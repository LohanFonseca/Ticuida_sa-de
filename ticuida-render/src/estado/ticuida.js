import { reactive } from "vue";
import {
  noticiasPublicadas,
  sessaoAtual,
} from "../components/servicos/apiMaster.js";
import {
  entrar,
  sair,
  carregarConteudo,
  definirAcessoVisitante,
} from "../dados.js";

export const estado = reactive({
  usuario: null,
  carregando: 0,
  erro: "",
  mensagem: "",
  conteudo: {
    noticias: [],
    materiais: [],
    servicos: [],
    indicadores: [],
  },
});

export function limparAvisos() {
  estado.erro = "";
  estado.mensagem = "";
}

// Retorna true ou false para o componente saber se a operação funcionou.
export async function executar(acao) {
  estado.carregando++;
  limparAvisos();

  try {
    await acao();
    return true;
  } catch (erro) {
    estado.erro = erro.message || "Não foi possível concluir a operação.";
    return false;
  } finally {
    estado.carregando--;
  }
}

export async function autenticar(dados) {
  const usuario = await entrar(dados);
  const conteudo = await carregarConteudoAtual();

  Object.assign(estado.conteudo, conteudo);
  definirAcessoVisitante(false);
  estado.usuario = usuario;
}

export async function entrarComoVisitante() {
  const conteudo = await carregarConteudoAtual();
  Object.assign(estado.conteudo, conteudo);
  definirAcessoVisitante(true);
  estado.usuario = {
    id: "visitante",
    nome: "Visitante",
    perfil: "paciente",
    visitante: true,
  };
  estado.mensagem = "Você está explorando. Nenhuma alteração será salva.";
}

export async function encerrarSessao() {
  const visitante = estado.usuario?.visitante;
  if (!visitante) await sair();
  definirAcessoVisitante(false);
  estado.usuario = null;

  Object.assign(estado.conteudo, {
    noticias: [],
    materiais: [],
    servicos: [],
    indicadores: [],
  });
}
async function carregarConteudoAtual() {
  const conteudo = await carregarConteudo();
  return { ...conteudo, noticias: await noticiasPublicadas() };
}
export async function restaurarSessao() {
  const usuario = await sessaoAtual();
  if (!usuario) return;
  const conteudo = await carregarConteudoAtual();
  definirAcessoVisitante(false);
  Object.assign(estado.conteudo, conteudo);
  estado.usuario = usuario;
}
