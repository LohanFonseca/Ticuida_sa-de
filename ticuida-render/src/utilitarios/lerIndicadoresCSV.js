import { estados } from "./estado.js";
import { dataLocal } from "./formatacao.js";

export function lerIndicadoresCSV(texto) {
  const linhas = [];
  let linha = [];
  let campo = "";
  let entreAspas = false;

  const entrada = texto.replace(/^\uFEFF/, "");

  for (let indice = 0; indice < entrada.length; indice++) {
    const caractere = entrada[indice];

    if (caractere === '"') {
      if (entreAspas && entrada[indice + 1] === '"') {
        campo += '"';
        indice++;
      } else {
        entreAspas = !entreAspas;
      }
    } else if (caractere === "," && !entreAspas) {
      linha.push(campo);
      campo = "";
    } else if (
      (caractere === "\n" || caractere === "\r") &&
      !entreAspas
    ) {
      if (caractere === "\r" && entrada[indice + 1] === "\n") {
        indice++;
      }

      linha.push(campo);

      if (linha.some((valor) => valor.trim())) linhas.push(linha);

      linha = [];
      campo = "";
    } else {
      campo += caractere;
    }
  }

  if (entreAspas) {
    throw new Error("CSV inválido: aspas não fechadas.");
  }

  linha.push(campo);
  if (linha.some((valor) => valor.trim())) linhas.push(linha);

  if (linhas.length < 2) {
    throw new Error("O CSV precisa de cabeçalho e pelo menos uma linha.");
  }

  const cabecalho = linhas.shift().map((valor) => valor.trim());
  const obrigatorias = [
    "uf",
    "casos",
    "periodo",
    "fonte",
    "atualizadoEm",
  ];

  if (
    new Set(cabecalho).size !== cabecalho.length ||
    obrigatorias.some((nome) => !cabecalho.includes(nome))
  ) {
    throw new Error(
      `Cabeçalho inválido. Colunas necessárias: ${obrigatorias.join(", ")}.`
    );
  }

  const utilizadas = new Set();

  return linhas.map((valores, indice) => {
    if (valores.length !== cabecalho.length) {
      throw new Error(`Quantidade de colunas inválida na linha ${indice + 2}.`);
    }

    const item = Object.fromEntries(
      cabecalho.map((nome, posicao) => [nome, valores[posicao].trim()])
    );

    item.uf = item.uf.toUpperCase();

    const casos = Number(item.casos);
    const data = dataLocal(item.atualizadoEm);

    const dataValida =
      /^\d{4}-\d{2}-\d{2}$/.test(item.atualizadoEm) &&
      Number.isFinite(data.getTime()) &&
      data.getFullYear() === Number(item.atualizadoEm.slice(0, 4)) &&
      data.getMonth() + 1 === Number(item.atualizadoEm.slice(5, 7)) &&
      data.getDate() === Number(item.atualizadoEm.slice(8, 10));

    if (
      !estados.some((estado) => estado.sigla === item.uf) ||
      utilizadas.has(item.uf) ||
      item.casos === "" ||
      !Number.isSafeInteger(casos) ||
      casos < 0 ||
      !item.periodo ||
      !item.fonte ||
      !dataValida
    ) {
      throw new Error(`Dados inválidos ou UF repetida na linha ${indice + 2}.`);
    }

    utilizadas.add(item.uf);

    return {
      uf: item.uf,
      casos,
      periodo: item.periodo,
      fonte: item.fonte,
      atualizadoEm: item.atualizadoEm,
    };
  });
}