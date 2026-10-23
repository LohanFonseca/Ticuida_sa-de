const { MongoClient } = require("mongodb");
async function prepararIndices(db) {
  await db.collection("noticias").createIndex({ status: 1, publicadaEm: -1 });
  await db
    .collection("usuarios")
    .createIndex({ "solicitacaoProfissional.status": 1, ativo: 1 });
  await db.collection("usuarios").createIndex({ email: 1 }, { unique: true });
  await db
    .collection("usuarios")
    .createIndex(
      { cpf: 1 },
      { unique: true, partialFilterExpression: { cpf: { $type: "string" } } },
    );
  await db
    .collection("registrosVacinais")
    .createIndex({ pacienteId: 1, aplicadaEm: -1 });
  await db
    .collection("autorizacoesAtendimento")
    .createIndex({ pacienteId: 1, profissionalId: 1 }, { unique: true });
}
async function conectarBanco() {
  if (!process.env.MONGODB_URI)
    throw new Error("Configure MONGODB_URI no .env.");
  const cliente = new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  await cliente.connect();
  const db = cliente.db(process.env.MONGODB_DB || "ticuida");
  await prepararIndices(db);
  return { cliente, db };
}
module.exports = { conectarBanco, prepararIndices };
