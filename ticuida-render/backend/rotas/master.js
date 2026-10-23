const express = require("express");
const { ObjectId } = require("mongodb");
const { autenticar } = require("../middlewares/autenticacao");
const {
  z,
  cadastro,
  id,
  falhar,
  publico,
} = require("../utilitarios/validacao");
const revisao = z.number().int().nonnegative();
const endereco = z
  .string()
  .trim()
  .max(1500)
  .refine((v) => {
    try {
      const u = new URL(v);
      return (
        ["https:", "http:"].includes(u.protocol) && !u.username && !u.password
      );
    } catch {
      return false;
    }
  }, "Informe uma URL completa http ou https.");
const noticia = z
  .object({
    titulo: z.string().trim().min(3).max(160),
    resumo: z.string().trim().min(10).max(800),
    fonte: z.string().trim().min(2).max(160),
    url: endereco,
    imagem: z.union([endereco, z.literal("")]).default(""),
    categoria: z.string().trim().min(2).max(60),
    status: z.enum(["rascunho", "publicada"]),
  })
  .strict();
const pedido = z
  .object({
    profissao: z.string().trim().min(2).max(100),
    conselho: z.string().trim().min(2).max(40),
    numero: z.string().trim().min(2).max(40),
    uf: z.enum([
      "AC",
      "AL",
      "AP",
      "AM",
      "BA",
      "CE",
      "DF",
      "ES",
      "GO",
      "MA",
      "MT",
      "MS",
      "MG",
      "PA",
      "PB",
      "PR",
      "PE",
      "PI",
      "RJ",
      "RN",
      "RS",
      "RO",
      "RR",
      "SC",
      "SP",
      "SE",
      "TO",
    ]),
  })
  .strict();
const paginar = (req) =>
  z.coerce.number().int().min(1).max(10000).default(1).parse(req.query.pagina);
function filtroRevisao(valor) {
  return valor === 0
    ? { $or: [{ revisao: 0 }, { revisao: { $exists: false } }] }
    : { revisao: valor };
}
function evento(req, acao, alvo, campos = []) {
  return {
    _id: new ObjectId(),
    acao,
    autorId: req.usuario._id,
    autorNome: req.usuario.nome,
    alvo,
    campos,
    data: new Date(),
  };
}
function usuarioPublico(u) {
  return {
    ...publico(u),
    ativo: u.ativo,
    revisao: u.revisao || 0,
    solicitacao: u.solicitacaoProfissional || null,
  };
}
function noticiaPublica(n) {
  return {
    id: n._id.toString(),
    titulo: n.titulo,
    resumo: n.resumo,
    fonte: n.fonte,
    url: n.url,
    imagem: n.imagem,
    categoria: n.categoria,
    data: n.publicadaEm?.toISOString().slice(0, 10) || "",
  };
}
async function lista(col, filtro, pagina, mapear) {
  const [total, docs] = await Promise.all([
    col.countDocuments(filtro),
    col
      .find(filtro)
      .sort({ _id: -1 })
      .skip((pagina - 1) * 20)
      .limit(20)
      .toArray(),
  ]);
  return {
    itens: docs.map(mapear),
    total,
    pagina,
    paginas: Math.max(1, Math.ceil(total / 20)),
  };
}
function rotasMaster(db) {
  const r = express.Router(),
    usuarios = db.collection("usuarios"),
    noticias = db.collection("noticias");
  r.get("/noticias", async (_req, res) =>
    res.json(
      (
        await noticias
          .find({ status: "publicada" })
          .sort({ publicadaEm: -1, _id: -1 })
          .limit(100)
          .toArray()
      ).map(noticiaPublica),
    ),
  );
  r.get("/me/solicitacao-profissional", autenticar(db), async (req, res) =>
    res.json(req.usuario.solicitacaoProfissional || null),
  );
  r.post("/me/solicitacao-profissional", autenticar(db), async (req, res) => {
    if (req.usuario.perfil !== "paciente")
      falhar(403, "A solicitação é exclusiva para contas de paciente.");
    const dados = pedido.parse(req.body);
    const resultado = await usuarios.updateOne(
      {
        _id: req.usuario._id,
        perfil: "paciente",
        "solicitacaoProfissional.status": { $ne: "pendente" },
      },
      {
        $set: {
          solicitacaoProfissional: {
            ...dados,
            status: "pendente",
            solicitadaEm: new Date(),
          },
        },
        $inc: { revisao: 1 },
        $push: {
          historicoAdministrativo: evento(
            req,
            "Solicitação profissional enviada",
            req.usuario.nome,
          ),
        },
      },
    );
    if (!resultado.matchedCount)
      falhar(409, "Já existe uma solicitação pendente.");
    res.status(201).json({ mensagem: "Solicitação enviada para análise." });
  });
  r.use("/master", autenticar(db), (req, _res, next) => {
    if (req.usuario.perfil !== "master")
      falhar(403, "Acesso exclusivo do Master.");
    next();
  });
  r.get("/master/resumo", async (_req, res) => {
    const [totalUsuarios, pendentes, publicadas] = await Promise.all([
      usuarios.countDocuments({}),
      usuarios.countDocuments({
        "solicitacaoProfissional.status": "pendente",
        ativo: true,
      }),
      noticias.countDocuments({ status: "publicada" }),
    ]);
    res.json({ totalUsuarios, pendentes, publicadas });
  });
  r.get("/master/usuarios", async (req, res) => {
    const q = z
      .object({
        busca: z.string().trim().max(120).default(""),
        perfil: z.enum(["", "paciente", "profissional", "master"]).default(""),
        ativo: z.enum(["", "true", "false"]).default(""),
      })
      .parse(req.query);
    const filtro = {};
    if (q.perfil) filtro.perfil = q.perfil;
    if (q.ativo) filtro.ativo = q.ativo === "true";
    if (q.busca) {
      const texto = q.busca.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filtro.$or = [
        { nome: { $regex: texto, $options: "i" } },
        { email: { $regex: texto, $options: "i" } },
      ];
    }
    res.json(await lista(usuarios, filtro, paginar(req), usuarioPublico));
  });
  async function alterarUsuario(req, operacao) {
    const alvo = id(req.params.id),
      rev = revisao.parse(req.body.revisao);
    const atual = await usuarios.findOne({ _id: alvo });
    if (!atual) falhar(404, "Cadastro não encontrado.");
    if (atual.perfil === "master")
      falhar(
        403,
        "Contas Master são administradas somente pelo responsável no servidor.",
      );
    const mudanca = operacao(atual);
    const resultado = await usuarios.updateOne(
      {
        _id: alvo,
        perfil: { $ne: "master" },
        ...filtroRevisao(rev),
        ...(mudanca.filtro || {}),
      },
      {
        ...mudanca.update,
        $inc: { revisao: 1, versaoSessao: 1 },
        $push: {
          historicoAdministrativo: evento(
            req,
            mudanca.acao,
            atual.nome,
            mudanca.campos,
          ),
        },
      },
    );
    if (!resultado.matchedCount)
      falhar(409, "Este cadastro mudou. Atualize a lista e tente novamente.");
  }
  r.patch("/master/usuarios/:id", async (req, res) => {
    const dados = cadastro
      .pick({ nome: true, email: true, cpf: true })
      .extend({ revisao })
      .strict()
      .parse(req.body);
    await alterarUsuario(req, () => ({
      acao: "Cadastro atualizado",
      campos: ["nome", "email", "cpf"],
      update: {
        $set: {
          nome: dados.nome,
          email: dados.email,
          atualizadoEm: new Date(),
          ...(dados.cpf ? { cpf: dados.cpf } : {}),
        },
        ...(!dados.cpf ? { $unset: { cpf: "" } } : {}),
      },
    }));
    res.json({
      mensagem: "Cadastro atualizado. A conta precisará entrar novamente.",
    });
  });
  r.patch("/master/usuarios/:id/ativo", async (req, res) => {
    const dados = z
      .object({ ativo: z.boolean(), revisao })
      .strict()
      .parse(req.body);
    await alterarUsuario(req, () => ({
      acao: dados.ativo ? "Conta reativada" : "Conta desativada",
      campos: ["ativo"],
      update: { $set: { ativo: dados.ativo, atualizadoEm: new Date() } },
    }));
    res.json({ mensagem: "Situação da conta atualizada." });
  });
  r.get("/master/profissionais", async (req, res) =>
    res.json(
      await lista(
        usuarios,
        { "solicitacaoProfissional.status": "pendente", ativo: true },
        paginar(req),
        usuarioPublico,
      ),
    ),
  );
  r.post("/master/profissionais/:id/decisao", async (req, res) => {
    const dados = z
      .object({
        revisao,
        aprovar: z.boolean(),
        motivo: z.string().trim().max(600).default(""),
      })
      .strict()
      .refine(
        (v) => v.aprovar || v.motivo.length >= 5,
        "Informe o motivo da recusa.",
      )
      .parse(req.body);
    await alterarUsuario(req, () => ({
      acao: dados.aprovar
        ? "Perfil profissional aprovado"
        : "Solicitação profissional recusada",
      campos: ["perfil", "solicitacaoProfissional"],
      filtro: {
        perfil: "paciente",
        ativo: true,
        "solicitacaoProfissional.status": "pendente",
      },
      update: {
        $set: {
          "solicitacaoProfissional.status": dados.aprovar
            ? "aprovada"
            : "recusada",
          "solicitacaoProfissional.motivo": dados.motivo,
          "solicitacaoProfissional.analisadaEm": new Date(),
          ...(dados.aprovar ? { perfil: "profissional" } : {}),
        },
      },
    }));
    res.json({ mensagem: "Análise registrada." });
  });
  r.get("/master/noticias", async (req, res) =>
    res.json(
      await lista(noticias, {}, paginar(req), (n) => ({
        ...noticiaPublica(n),
        status: n.status,
        revisao: n.revisao || 0,
      })),
    ),
  );
  r.post("/master/noticias", async (req, res) => {
    const dados = noticia.parse(req.body),
      agora = new Date();
    const resultado = await noticias.insertOne({
      ...dados,
      revisao: 0,
      criadaEm: agora,
      atualizadaEm: agora,
      publicadaEm: dados.status === "publicada" ? agora : null,
      historicoAdministrativo: [evento(req, "Notícia criada", dados.titulo)],
    });
    res
      .status(201)
      .json({
        id: resultado.insertedId.toString(),
        mensagem: "Notícia salva.",
      });
  });
  r.put("/master/noticias/:id", async (req, res) => {
    const { revisao: rev, ...dados } = noticia
      .extend({ revisao })
      .strict()
      .parse(req.body);
    const alvo = id(req.params.id);
    const atual = await noticias.findOne({ _id: alvo });
    if (!atual) falhar(404, "Notícia não encontrada.");
    const resultado = await noticias.updateOne(
      { _id: alvo, ...filtroRevisao(rev) },
      {
        $set: {
          ...dados,
          atualizadaEm: new Date(),
          publicadaEm:
            dados.status === "publicada"
              ? atual.publicadaEm || new Date()
              : null,
        },
        $inc: { revisao: 1 },
        $push: {
          historicoAdministrativo: evento(
            req,
            "Notícia atualizada",
            dados.titulo,
            ["conteudo", "status"],
          ),
        },
      },
    );
    if (!resultado.matchedCount)
      falhar(409, "Esta notícia mudou. Atualize a lista antes de editar.");
    res.json({ mensagem: "Notícia salva." });
  });
  r.get("/master/historico", async (req, res) => {
    const pagina = paginar(req);
    const pipeline = [
      { $project: { historicoAdministrativo: 1 } },
      { $unwind: "$historicoAdministrativo" },
      { $replaceRoot: { newRoot: "$historicoAdministrativo" } },
      {
        $unionWith: {
          coll: "noticias",
          pipeline: [
            { $project: { historicoAdministrativo: 1 } },
            { $unwind: "$historicoAdministrativo" },
            { $replaceRoot: { newRoot: "$historicoAdministrativo" } },
          ],
        },
      },
      { $sort: { data: -1, _id: -1 } },
      {
        $facet: {
          itens: [{ $skip: (pagina - 1) * 20 }, { $limit: 20 }],
          contagem: [{ $count: "total" }],
        },
      },
    ];
    const [resultado] = await usuarios.aggregate(pipeline).toArray();
    const total = resultado?.contagem[0]?.total || 0;
    res.json({
      itens: resultado?.itens || [],
      total,
      pagina,
      paginas: Math.max(1, Math.ceil(total / 20)),
    });
  });
  return r;
}
module.exports = rotasMaster;
