const base = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
export async function requisitar(caminho, metodo = "GET", dados) {
  const headers = {};
  if (metodo !== "GET") {
    const resposta = await fetch(`${base}/csrf`, { credentials: "include" });
    if (!resposta.ok) throw new Error("Não foi possível preparar a operação.");
    headers["X-CSRF-Token"] = (await resposta.json()).token;
    headers["Content-Type"] = "application/json";
  }
  const resposta = await fetch(base + caminho, {
    method: metodo,
    credentials: "include",
    headers,
    ...(dados !== undefined ? { body: JSON.stringify(dados) } : {}),
  });
  const conteudo = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    const erro = new Error(conteudo.erro || "Não foi possível acessar a API.");
    erro.status = resposta.status;
    erro.campos = conteudo.campos;
    throw erro;
  }
  return conteudo;
}
export async function sessaoAtual() {
  try {
    return await requisitar("/sessoes/atual");
  } catch (e) {
    if (e.status === 401) return null;
    throw e;
  }
}
export const noticiasPublicadas = () => requisitar("/noticias");
