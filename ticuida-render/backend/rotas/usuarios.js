const express = require("express");
const argon2 = require("argon2");
const { rateLimit } = require("express-rate-limit");
const {
  cadastro,
  publico,
  z,
  email,
  id,
  falhar,
} = require("../utilitarios/validacao");
const { autenticar } = require("../middlewares/autenticacao");
module.exports = function rotasUsuarios(db) {
  const router = express.Router();
  router.post(
    "/usuarios",
    rateLimit({
      windowMs: 60 * 60 * 1000,
      limit: 20,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { erro: "Limite de cadastros atingido. Tente mais tarde." },
    }),
    async (req, res) => {
      const dados = cadastro.parse(req.body);
      const usuario = {
        nome: dados.nome,
        email: dados.email,
        ...(dados.cpf ? { cpf: dados.cpf } : {}),
        perfil: "paciente",
        ativo: true,
        versaoSessao: 1,
        criadoEm: new Date(),
        senhaHash: await argon2.hash(dados.senha, {
          type: argon2.argon2id,
          memoryCost: 19456,
          timeCost: 2,
          parallelism: 1,
        }),
      };
      const { insertedId } = await db.collection("usuarios").insertOne(usuario);
      res.status(201).json(publico({ ...usuario, _id: insertedId }));
    },
  );
  router.get("/pacientes", autenticar(db), async (req, res) => {
    if (req.usuario.perfil !== "profissional")
      falhar(403, "Acesso exclusivo a profissionais autorizados.");
    const termo = z.string().trim().min(2).max(120).parse(req.query.busca);
    const vinculos = await db
      .collection("autorizacoesAtendimento")
      .find({ profissionalId: req.usuario._id })
      .toArray();
    const literal = termo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pacientes = await db
      .collection("usuarios")
      .find({
        _id: { $in: vinculos.map((v) => v.pacienteId) },
        perfil: "paciente",
        ativo: true,
        $or: [
          { nome: { $regex: literal, $options: "i" } },
          { cpf: termo.replace(/\D/g, "") },
        ],
      })
      .limit(50)
      .toArray();
    res.json(pacientes.map(publico));
  });
  router.get("/me/autorizacoes", autenticar(db), async (req, res) => {
    if (req.usuario.perfil !== "paciente")
      falhar(403, "Acesso exclusivo ao paciente.");
    const itens = await db
      .collection("autorizacoesAtendimento")
      .find({ pacienteId: req.usuario._id })
      .toArray();
    const profissionais = await db
      .collection("usuarios")
      .find({
        _id: { $in: itens.map((v) => v.profissionalId) },
        perfil: "profissional",
        ativo: true,
      })
      .toArray();
    res.json(
      profissionais.map((u) => ({
        id: u._id.toString(),
        nome: u.nome,
        email: u.email,
      })),
    );
  });
  router.post("/me/autorizacoes", autenticar(db), async (req, res) => {
    if (req.usuario.perfil !== "paciente")
      falhar(403, "Somente o paciente pode autorizar o acesso.");
    const entrada = z.object({ email }).parse(req.body);
    const profissional = await db
      .collection("usuarios")
      .findOne({ email: entrada.email, perfil: "profissional", ativo: true });
    if (!profissional) falhar(404, "Profissional não disponível.");
    await db
      .collection("autorizacoesAtendimento")
      .updateOne(
        { pacienteId: req.usuario._id, profissionalId: profissional._id },
        { $setOnInsert: { criadoEm: new Date() } },
        { upsert: true },
      );
    res
      .status(201)
      .json({
        id: profissional._id.toString(),
        nome: profissional.nome,
        email: profissional.email,
      });
  });
  router.delete("/me/autorizacoes/:id", autenticar(db), async (req, res) => {
    if (req.usuario.perfil !== "paciente")
      falhar(403, "Somente o paciente pode revogar o acesso.");
    await db
      .collection("autorizacoesAtendimento")
      .deleteOne({
        pacienteId: req.usuario._id,
        profissionalId: id(req.params.id),
      });
    res.sendStatus(204);
  });
  return router;
};
