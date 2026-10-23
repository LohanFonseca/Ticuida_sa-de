export function dataLocal(valor) {
  return new Date(`${valor}T00:00:00`);
}

export function formatarData(valor) {
  if (!valor) return "Não informada";

  const data = dataLocal(valor);

  return Number.isNaN(data.getTime())
    ? "Data inválida"
    : data.toLocaleDateString("pt-BR");
}

export function hojeISO() {
  const hoje = new Date();

  return [
    hoje.getFullYear(),
    String(hoje.getMonth() + 1).padStart(2, "0"),
    String(hoje.getDate()).padStart(2, "0"),
  ].join("-");
}

export function diasRestantes(valor) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  return Math.round((dataLocal(valor) - hoje) / 86400000);
}

export function situacaoData(valor) {
  const dias = diasRestantes(valor);

  if (dias < 0) {
    return `Data registrada passou há ${Math.abs(dias)} dia(s)`;
  }

  if (dias === 0) return "Data registrada para hoje";

  return `Em ${dias} dia(s)`;
}

export function linkSeguro(valor) {
  try {
    const url = new URL(valor);

    return ["https:", "http:"].includes(url.protocol)
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function normalizarTexto(valor = "") {
  return String(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}