const { id, falhar } = require("../utilitarios/validacao");
function autenticar(db) {
  return async (req, _res, next) => {
    if (!req.session.usuarioId)
      falhar(401, "Entre na sua conta para continuar.");
    const usuario = await db
      .collection("usuarios")
      .findOne({ _id: id(req.session.usuarioId), ativo: true });
    if (!usuario || usuario.versaoSessao !== req.session.versaoSessao)
      falhar(401, "Sua sessão expirou. Entre novamente.");
    req.usuario = usuario;
    next();
  };
}
async function permitirCarteira(db, usuario, pacienteId) {
  const paciente = await db
    .collection("usuarios")
    .findOne({ _id: pacienteId, perfil: "paciente", ativo: true });
  if (!paciente) falhar(404, "Carteira não disponível.");
  if (usuario.perfil === "paciente" && usuario._id.equals(pacienteId)) return;
  if (usuario.perfil === "profissional") {
    const vinculo = await db
      .collection("autorizacoesAtendimento")
      .findOne({ pacienteId, profissionalId: usuario._id });
    if (vinculo) return;
  }
  falhar(403, "Você não tem autorização para acessar esta carteira.");
}
module.exports = { autenticar, permitirCarteira };
