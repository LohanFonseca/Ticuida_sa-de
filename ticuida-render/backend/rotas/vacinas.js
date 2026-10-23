const express = require("express");
const { vacina, id, falhar } = require("../utilitarios/validacao");
const { autenticar, permitirCarteira } = require("../middlewares/autenticacao");
function publico(r) {
  return {
    id: r._id.toString(),
    pacienteId: r.pacienteId.toString(),
    vacina: r.vacina,
    dose: r.dose,
    aplicadaEm: r.aplicadaEm,
    proximaEm: r.proximaEm,
    observacao: r.observacao,
    origem: r.origem,
    permitirEdicao: r.permitirEdicao,
  };
}
module.exports = function rotasVacinas(db) {
  const router = express.Router();
  router.use("/pacientes/:pacienteId/vacinas", autenticar(db));
  router.get("/pacientes/:pacienteId/vacinas", async (req, res) => {
    const pacienteId = id(req.params.pacienteId);
    await permitirCarteira(db, req.usuario, pacienteId);
    const registros = await db
      .collection("registrosVacinais")
      .find({ pacienteId })
      .sort({ aplicadaEm: -1, _id: -1 })
      .toArray();
    res.json(registros.map(publico));
  });
  router.post("/pacientes/:pacienteId/vacinas", async (req, res) => {
    const pacienteId = id(req.params.pacienteId);
    await permitirCarteira(db, req.usuario, pacienteId);
    const dados = vacina.parse(req.body);
    const profissional = req.usuario.perfil === "profissional";
    if (!profissional && dados.permitirEdicao === true)
      falhar(
        403,
        "Somente um profissional pode conceder a permissão de edição.",
      );
    const agora = new Date();
    const registro = {
      ...dados,
      pacienteId,
      origem: profissional ? "profissional" : "paciente",
      permitirEdicao: profissional ? Boolean(dados.permitirEdicao) : false,
      criadoPor: req.usuario._id,
      criadoEm: agora,
      atualizadoEm: agora,
      historico: [{ acao: "criacao", autor: req.usuario._id, data: agora }],
    };
    const { insertedId } = await db
      .collection("registrosVacinais")
      .insertOne(registro);
    res.status(201).json(publico({ ...registro, _id: insertedId }));
  });
  router.patch(
    "/pacientes/:pacienteId/vacinas/:registroId",
    async (req, res) => {
      const pacienteId = id(req.params.pacienteId);
      await permitirCarteira(db, req.usuario, pacienteId);
      const filtro = { _id: id(req.params.registroId), pacienteId };
      const anterior = await db.collection("registrosVacinais").findOne(filtro);
      if (!anterior) falhar(404, "Registro não encontrado.");
      const profissional = req.usuario.perfil === "profissional";
      if (
        !profissional &&
        anterior.origem === "profissional" &&
        !anterior.permitirEdicao
      )
        falhar(403, "Este registro está protegido pelo profissional.");
      const dados = vacina.parse(req.body);
      if (
        !profissional &&
        dados.permitirEdicao !== undefined &&
        dados.permitirEdicao !== anterior.permitirEdicao
      )
        falhar(403, "Você não pode alterar a permissão deste registro.");
      const agora = new Date();
      // A condição também é aplicada na escrita para impedir edição se a permissão for revogada durante a requisição.
      if (!profissional)
        filtro.$or = [{ origem: "paciente" }, { permitirEdicao: true }];
      const registro = await db
        .collection("registrosVacinais")
        .findOneAndUpdate(
          filtro,
          {
            $set: {
              ...dados,
              permitirEdicao: profissional
                ? (dados.permitirEdicao ?? anterior.permitirEdicao)
                : anterior.permitirEdicao,
              atualizadoEm: agora,
            },
            $push: {
              historico: {
                acao: "edicao",
                autor: req.usuario._id,
                data: agora,
              },
            },
          },
          { returnDocument: "after" },
        );
      if (!registro)
        falhar(
          403,
          "A permissão de edição foi alterada. Recarregue a carteira.",
        );
      res.json(publico(registro));
    },
  );
  return router;
};
