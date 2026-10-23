const express = require("express");
const path = require("node:path");
const fs = require("node:fs");
const cors = require("cors");
const helmet = require("helmet");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const crypto = require("node:crypto");
const { ZodError } = require("zod");
const rotasSessoes = require("./rotas/sessoes");
const rotasUsuarios = require("./rotas/usuarios");
const rotasVacinas = require("./rotas/vacinas");
const rotasMaster = require("./rotas/master");
function criarAplicacao({ db, cliente, rotasMapa, sessionStore }) {
  const segredo = process.env.SESSION_SECRET;
  if (!segredo || segredo.length < 32)
    throw new Error(
      "Defina SESSION_SECRET com pelo menos 32 caracteres aleatórios.",
    );
  const origens = (process.env.FRONTEND_ORIGINS || process.env.RENDER_EXTERNAL_URL || "http://localhost:5173,http://localhost:3000")
    .split(",")
    .map((v) => v.trim());
  const app = express();
  app.disable("x-powered-by");
  const saltos = Number(process.env.TRUST_PROXY_HOPS || 0);
  if (!Number.isInteger(saltos) || saltos < 0)
    throw new Error("TRUST_PROXY_HOPS inválido.");
  if (saltos) app.set("trust proxy", saltos);
  app.use(helmet({
    contentSecurityPolicy: { directives: {
      imgSrc: ["'self'", "data:", "https:"],
      upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
    } },
  }));
  app.get("/healthz", (_req, res) => res.json({status: "ok"}));
  app.use(
    cors({
      origin(origem, cb) {
        cb(null, !origem || origens.includes(origem));
      },
      credentials: true,
      allowedHeaders: ["Content-Type", "X-CSRF-Token"],
    }),
  );
  app.use(express.json({ limit: "32kb" }));
  // As rotas públicas do mapa não precisam abrir uma sessão.
  if (rotasMapa) app.use(rotasMapa);
  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  const store =
    sessionStore ||
    MongoStore.create({
      client: cliente,
      dbName: db.databaseName,
      collectionName: "sessoes",
      ttl: 8 * 60 * 60,
    });
  store.on("error", () => console.error("Falha no armazenamento de sessões."));
  app.use(
    "/api",
    session({
      name: "ticuida.sid",
      secret: segredo,
      store,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 8 * 60 * 60 * 1000,
        path: "/",
      },
    }),
  );
  app.get("/api/csrf", (req, res) => {
    if (!req.session.csrf)
      req.session.csrf = crypto.randomBytes(32).toString("hex");
    res.json({ token: req.session.csrf });
  });
  app.use("/api", (req, res, next) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
    if (req.get("origin") && !origens.includes(req.get("origin")))
      return res.status(403).json({ erro: "Origem não autorizada." });
    const token = req.get("X-CSRF-Token");
    const esperado = req.session.csrf;
    if (
      typeof token !== "string" ||
      typeof esperado !== "string" ||
      Buffer.byteLength(token) !== Buffer.byteLength(esperado) ||
      !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(esperado))
    )
      return res
        .status(403)
        .json({ erro: "Sessão de formulário inválida. Tente novamente." });
    next();
  });
  app.use(
    "/api",
    rotasSessoes(db),
    rotasUsuarios(db),
    rotasVacinas(db),
    rotasMaster(db),
  );
  // APIs inexistentes continuam retornando JSON, nunca o HTML do Vue.
  app.use("/api", (_req, res) => res.status(404).json({erro: "Rota não encontrada."}));
  const pastaFrontend = path.resolve(__dirname, "../dist");
  const paginaInicial = path.join(pastaFrontend, "index.html");
  if (fs.existsSync(paginaInicial)) {
    app.use(express.static(pastaFrontend, {index: false, dotfiles: "deny"}));
    app.get(/.*/, (req, res, next) => {
      if (path.extname(req.path) || req.path.split("/").some(parte => parte.startsWith(".")) || !req.accepts("html")) return next();
      res.set("Cache-Control", "no-cache");
      res.sendFile(paginaInicial);
    });
  } else if (process.env.NODE_ENV === "production") {
    throw new Error("Frontend ausente. Execute npm run build na raiz do projeto.");
  }
  app.use((_req, res) => res.status(404).json({erro: "Rota não encontrada."}));
  app.use((erro, _req, res, _next) => {
    if (erro instanceof ZodError)
      return res.status(400).json({
        erro: "Confira os campos informados.",
        campos: erro.issues.map((i) => ({
          campo: i.path.join("."),
          mensagem: i.message,
        })),
      });
    if (erro.code === 11000)
      return res
        .status(409)
        .json({ erro: "Já existe uma conta com esses dados de cadastro." });
    if (erro.status >= 400 && erro.status < 500)
      return res.status(erro.status).json({
        erro:
          erro.type === "entity.parse.failed" ? "JSON inválido." : erro.message,
      });
    console.error("Falha interna na API:", erro.name || "Erro");
    res.status(500).json({
      erro: "Não foi possível concluir a solicitação. Tente novamente.",
    });
  });
  return app;
}
module.exports = { criarAplicacao };
