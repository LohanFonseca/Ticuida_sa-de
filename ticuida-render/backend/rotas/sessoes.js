const express = require("express");
const argon2 = require("argon2");
const { rateLimit } = require("express-rate-limit");
const { z, email, publico, falhar } = require("../utilitarios/validacao");
const { autenticar } = require("../middlewares/autenticacao");
module.exports = function rotasSessoes(db) {
  const router = express.Router();
  const limite = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { erro: "Muitas tentativas. Tente novamente em 15 minutos." },
  });
  // Hash fictício evita resposta imediata para e-mails inexistentes.
  const hashFicticio = argon2.hash("senha-ficticia-sem-conta", {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
  router.post("/sessoes", limite, async (req, res) => {
    const entrada = z
      .object({ email, senha: z.string().min(1).max(128) })
      .parse(req.body);
    const usuario = await db
      .collection("usuarios")
      .findOne({ email: entrada.email, ativo: true });
    const valido = await argon2.verify(
      usuario?.senhaHash || (await hashFicticio),
      entrada.senha,
    );
    if (!usuario || !valido) falhar(401, "E-mail ou senha inválidos.");
    await new Promise((resolve, reject) =>
      req.session.regenerate((e) => (e ? reject(e) : resolve())),
    );
    req.session.usuarioId = usuario._id.toString();
    req.session.versaoSessao = usuario.versaoSessao;
    await new Promise((resolve, reject) =>
      req.session.save((e) => (e ? reject(e) : resolve())),
    );
    res.json(publico(usuario));
  });
  router.get("/sessoes/atual", autenticar(db), (req, res) =>
    res.json(publico(req.usuario)),
  );
  router.delete("/sessoes", async (req, res) => {
    await new Promise((resolve, reject) =>
      req.session.destroy((e) => (e ? reject(e) : resolve())),
    );
    res.clearCookie("ticuida.sid", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    res.sendStatus(204);
  });
  return router;
};
