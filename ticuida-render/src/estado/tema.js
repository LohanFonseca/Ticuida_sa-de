import { ref } from "vue";

const CHAVE_TEMA = "ticuida-tema";

function obterTemaInicial() {
  if (typeof window === "undefined") return "claro";

  try {
    const salvo = localStorage.getItem(CHAVE_TEMA);

    if (salvo === "claro" || salvo === "escuro") {
      return salvo;
    }
  } catch {
    // O seletor continua funcionando quando o armazenamento está indisponível.
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "escuro"
    : "claro";
}

export const temaAtual = ref(obterTemaInicial());

function aplicarTema() {
  if (typeof document === "undefined") return;

  document.documentElement.dataset.tema = temaAtual.value;
  document.documentElement.style.colorScheme =
    temaAtual.value === "escuro" ? "dark" : "light";
}

export function definirTema(tema) {
  if (!["claro", "escuro"].includes(tema)) return;

  temaAtual.value = tema;
  aplicarTema();

  try {
    localStorage.setItem(CHAVE_TEMA, tema);
  } catch {
    // Mantém a escolha durante esta sessão.
  }
}

aplicarTema();
