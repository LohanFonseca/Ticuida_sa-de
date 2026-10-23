// Substitua o dados.js utilizado pelo seu projeto. Contas e vacinas sempre usam a API.
const BASE_API = "/api";
export const modoDemonstracao = false;
let acessoVisitante = false;
export function definirAcessoVisitante(ativo) {
  acessoVisitante = ativo;
}
const conteudoPublico = {
  noticias: [
    {
      id: "prevencao",
      titulo: "Informação também é cuidado",
      resumo:
        "Conheça os conteúdos oficiais sobre prevenção combinada, testagem e acompanhamento.",
      categoria: "Prevenção",
      data: "",
      uf: "",
      casosConfirmados: false,
      url: "https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/a/aids-hiv",
    },
    {
      id: "pep",
      titulo: "Possível exposição? Procure atendimento",
      resumo:
        "A avaliação para PEP é urgente. Acesse as orientações do Ministério da Saúde.",
      categoria: "Orientação",
      data: "",
      uf: "",
      casosConfirmados: false,
      url: "https://www.gov.br/aids/pt-br/assuntos/prevencao-combinada/pep-profilaxia-pos-exposicao-ao-hiv",
    },
  ],
  materiais: [
    {
      id: "material-1",
      titulo: "HIV e aids",
      tipo: "Leitura",
      descricao: "Informações oficiais sobre prevenção e cuidado.",
      url: "https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/a/aids-hiv",
    },
    {
      id: "material-2",
      titulo: "Vacinação",
      tipo: "Leitura",
      descricao: "Consulte informações oficiais sobre vacinação.",
      url: "https://www.gov.br/saude/pt-br/vacinacao",
    },
    {
      id: "material-3",
      titulo: "Apoio à decisão clínica",
      tipo: "Profissional",
      descricao: "Referência para consulta por profissionais de saúde.",
      url: "https://portal.aids.gov.br/",
    },
  ],
  // Cadastre apenas serviços verificados e indicadores com fonte.
  servicos: [],
  indicadores: [],
};

async function lerResposta(resposta) {
  const dados =
    resposta.status === 204 ? null : await resposta.json().catch(() => null);
  if (!resposta.ok) {
    const mensagemCampos = dados?.campos
      ?.map((item) => item.mensagem)
      .join(" ");
    const erro = new Error(
      mensagemCampos ||
        dados?.erro ||
        `Falha na solicitação (${resposta.status}).`,
    );
    erro.status = resposta.status;
    throw erro;
  }
  return dados;
}
export async function requisitar(caminho, opcoes = {}) {
  const metodo = opcoes.method || "GET";
  if (acessoVisitante && !["GET", "HEAD"].includes(metodo)) {
    throw new Error("No modo Explorar, as alterações não são salvas.");
  }
  const headers = {
    Accept: "application/json",
    ...(opcoes.body ? { "Content-Type": "application/json" } : {}),
    ...opcoes.headers,
  };
  if (!["GET", "HEAD"].includes(metodo)) {
    const dados = await lerResposta(
      await fetch(`${BASE_API}/csrf`, {
        credentials: "include",
        cache: "no-store",
      }),
    );
    headers["X-CSRF-Token"] = dados.token;
  }
  return lerResposta(
    await fetch(`${BASE_API}${caminho}`, {
      ...opcoes,
      method: metodo,
      credentials: "include",
      cache: "no-store",
      headers,
    }),
  );
}
export function carregarOpcoesMapa() {
  return requisitar("/mapa/opcoes");
}
export function consultarMapa(filtros) {
  const parametros = new URLSearchParams();
  for (const [chave, valor] of Object.entries(filtros))
    if (valor && !(chave === "sexo" && valor === "Total"))
      parametros.set(chave, valor);
  return requisitar(`/mapa?${parametros}`);
}
export function entrar(dados) {
  return requisitar("/sessoes", {
    method: "POST",
    body: JSON.stringify({ email: dados.email, senha: dados.senha }),
  });
}
export function sair() {
  return requisitar("/sessoes", { method: "DELETE" });
}
export async function obterSessao() {
  try {
    return await requisitar("/sessoes/atual");
  } catch (erro) {
    if (erro.status === 401) return null;
    throw erro;
  }
}
export function cadastrar(dados) {
  return requisitar("/usuarios", {
    method: "POST",
    body: JSON.stringify({
      nome: dados.nome,
      email: dados.email,
      cpf: dados.cpf || "",
      senha: dados.senha,
      perfil: dados.perfil || "paciente",
    }),
  });
}
// As notícias e os materiais existentes continuam locais nesta etapa.
export async function carregarConteudo() {
  return JSON.parse(JSON.stringify(conteudoPublico));
}
export function buscarPacientes(termo) {
  return requisitar(`/pacientes?busca=${encodeURIComponent(termo)}`);
}
export function listarRegistros(pacienteId) {
  return requisitar(`/pacientes/${encodeURIComponent(pacienteId)}/vacinas`);
}
export function salvarRegistro(pacienteId, dados) {
  const caminho = `/pacientes/${encodeURIComponent(pacienteId)}/vacinas`;
  return requisitar(
    dados.id ? `${caminho}/${encodeURIComponent(dados.id)}` : caminho,
    {
      method: dados.id ? "PATCH" : "POST",
      body: JSON.stringify({
        vacina: dados.vacina,
        dose: dados.dose,
        aplicadaEm: dados.aplicadaEm,
        proximaEm: dados.proximaEm || "",
        observacao: dados.observacao || "",
        ...(typeof dados.permitirEdicao === "boolean"
          ? { permitirEdicao: dados.permitirEdicao }
          : {}),
      }),
    },
  );
}
export function listarAutorizacoes() {
  return requisitar("/me/autorizacoes");
}
export function autorizarProfissional(email) {
  return requisitar("/me/autorizacoes", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}
export function revogarProfissional(id) {
  return requisitar(`/me/autorizacoes/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
