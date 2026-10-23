require("dotenv").config();
const { conectarBanco } = require("../configuracao/banco");
(async () => {
  const [email, perfil] = process.argv.slice(2);
  if (!email || !["paciente", "profissional", "master"].includes(perfil))
    throw new Error(
      "Uso: npm run perfil -- email@exemplo.com profissional|master|paciente",
    );
  const { cliente, db } = await conectarBanco();
  try {
    const resposta = await db.collection("usuarios").updateOne(
      { email: email.trim().toLowerCase(), ativo: true },
      {
        $set: { perfil, atualizadoEm: new Date() },
        $inc: { versaoSessao: 1, revisao: 1 },
        $push: {
          historicoAdministrativo: {
            _id: new (require("mongodb").ObjectId)(),
            acao: "Perfil alterado no servidor para " + perfil,
            autorNome: "Administrador do servidor",
            alvo: email.trim().toLowerCase(),
            campos: ["perfil"],
            data: new Date(),
          },
        },
      },
    );
    if (!resposta.matchedCount)
      throw new Error(
        "Cadastre a conta primeiro. Nenhum usuário ativo encontrado.",
      );
    console.log(
      "Perfil atualizado. As sessões anteriores foram invalidadas; faça login novamente.",
    );
  } finally {
    await cliente.close();
  }
})().catch((e) => {
  console.error(
    e.message.startsWith("Uso:") || e.message.startsWith("Cadastre")
      ? e.message
      : "Não foi possível atualizar o perfil. Confira o .env e a conexão.",
  );
  process.exitCode = 1;
});
