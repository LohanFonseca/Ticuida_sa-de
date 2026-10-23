require("dotenv").config({ path: require("node:path").join(__dirname, ".env") });
const { conectarBanco } = require("./configuracao/banco");
const { criarAplicacao } = require("./app");
const criarRotasMapa = require("./rotas/mapa");
async function iniciar() {
  let cliente;
  let etapa = "conexão com MongoDB";
  try {
    const conexao = await conectarBanco();
    cliente = conexao.cliente;
    etapa = "leitura da planilha";
    const rotasMapa = await criarRotasMapa();
    etapa = "configuração da aplicação";
    const app = criarAplicacao({ ...conexao, rotasMapa });
    const porta = Number(process.env.PORT || 3000);
    const servidor = app.listen(porta, () =>
      console.log(
        `API Ticuida na porta ${porta}. MongoDB conectado; planilha carregada.`,
      ),
    );
    servidor.on("error", async () => {
      console.error("Não foi possível abrir a porta da API.");
      await cliente.close();
      process.exitCode = 1;
    });
    const encerrar = () =>
      servidor.close(async () => {
        await cliente.close();
        process.exit(0);
      });
    process.once("SIGINT", encerrar);
    process.once("SIGTERM", encerrar);
  } catch (erro) {
    // Não imprimir URI de conexão nem credenciais.
    console.error(
      `Falha na etapa: ${etapa}. Confira o guia e a configuração. Tipo:`,
      erro.name,
    );
    if (cliente) await cliente.close();
    process.exitCode = 1;
  }
}
iniciar();
