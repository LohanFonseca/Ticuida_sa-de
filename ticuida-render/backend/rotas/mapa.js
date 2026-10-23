const path = require("node:path");
const fs = require("node:fs/promises");
const express = require("express");
const ExcelJS = require("exceljs");
const JSZip = require("jszip");

const app = express.Router();
let registros = [];
const arquivoPlanilha =
  process.env.PLANILHA_MAPA ||
  path.join(__dirname, "..", "dados", "Ticuida_planilha_mestre_v002.xlsx");
const camposObrigatorios = [
  "uf_residencia",
  "municipio_residencia",
  "ano_diagnostico",
  "sexo",
  "quantidade",
  "status_municipio",
];

async function carregarRegistros() {
  const zip = await JSZip.loadAsync(await fs.readFile(arquivoPlanilha));

  for (const nome of Object.keys(zip.files).filter((arquivo) =>
    arquivo.endsWith(".xml"),
  )) {
    const entrada = zip.file(nome);
    if (!entrada) continue;

    const xml = await entrada.async("string");
    zip.file(
      nome,
      xml.replace(/(<\/?)x:/g, "$1").replace(/\sxmlns:x="[^"]*"/g, ""),
    );
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await zip.generateAsync({ type: "nodebuffer" }));

  const planilha = workbook.getWorksheet("Mestre");
  if (!planilha) {
    throw new Error('A planilha precisa conter a aba "Mestre".');
  }

  const cabecalho = planilha
    .getRow(1)
    .values.slice(1)
    .map((valor) => String(valor ?? "").trim());
  const indices = new Map(
    cabecalho.map((campo, indice) => [campo, indice + 1]),
  );
  const ausentes = camposObrigatorios.filter((campo) => !indices.has(campo));

  if (ausentes.length > 0) {
    throw new Error(
      `Colunas ausentes na aba "Mestre": ${ausentes.join(", ")}.`,
    );
  }

  const registros = [];

  for (let numeroLinha = 2; numeroLinha <= planilha.rowCount; numeroLinha++) {
    const linha = planilha.getRow(numeroLinha);
    const obter = (campo) =>
      String(linha.getCell(indices.get(campo)).text ?? "").trim();

    if (linha.cellCount === 0) continue;

    const quantidade = Number(obter("quantidade"));
    const registro = {
      uf: obter("uf_residencia").toUpperCase(),
      municipio: obter("municipio_residencia"),
      ano: obter("ano_diagnostico"),
      sexo: obter("sexo"),
      quantidade,
      statusMunicipio: obter("status_municipio"),
    };

    if (
      !registro.uf ||
      !registro.municipio ||
      !/^\d{4}$/.test(registro.ano) ||
      !["Masculino", "Feminino"].includes(registro.sexo) ||
      !Number.isSafeInteger(quantidade) ||
      quantidade < 0 ||
      !registro.statusMunicipio
    ) {
      throw new Error(`Dados inválidos na aba "Mestre", linha ${numeroLinha}.`);
    }

    registros.push(registro);
  }

  if (registros.length === 0) {
    throw new Error('A aba "Mestre" não contém registros.');
  }

  return registros;
}

function somar(registros) {
  return registros.reduce((total, registro) => total + registro.quantidade, 0);
}

function filtrarRegistros({ uf, municipio, ano, sexo = "Total" }) {
  return registros.filter(
    (registro) =>
      (!uf || registro.uf === uf) &&
      (!municipio || registro.municipio === municipio) &&
      (!ano || registro.ano === ano) &&
      (sexo === "Total" || registro.sexo === sexo),
  );
}

app.get("/api/dashboard", (_req, res) => {
  res.json({
    totalCasos: somar(registros),
    totalMasculino: somar(
      registros.filter((registro) => registro.sexo === "Masculino"),
    ),
    totalFeminino: somar(
      registros.filter((registro) => registro.sexo === "Feminino"),
    ),
    fonteDados: path.basename(arquivoPlanilha),
  });
});

app.get("/api/top-cidades", (_req, res) => {
  const cidades = new Map();

  for (const registro of registros) {
    if (registro.statusMunicipio !== "informado") continue;
    cidades.set(
      registro.municipio,
      (cidades.get(registro.municipio) || 0) + registro.quantidade,
    );
  }

  res.json(
    [...cidades.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cidade, casos]) => ({ cidade, casos })),
  );
});

app.get("/api/filtro", (req, res) => {
  const sexo = req.query.sexo || "Total";

  if (
    typeof sexo !== "string" ||
    !["Total", "Masculino", "Feminino"].includes(sexo)
  ) {
    return res.status(400).json({
      erro: 'O filtro "sexo" deve ser Total, Masculino ou Feminino.',
    });
  }

  const filtrados = filtrarRegistros({
    uf: req.query.uf,
    municipio: req.query.cidade,
    ano: req.query.ano,
    sexo,
  });

  res.json({
    totalCasos: somar(filtrados),
    totalMasculino: somar(
      filtrados.filter((registro) => registro.sexo === "Masculino"),
    ),
    totalFeminino: somar(
      filtrados.filter((registro) => registro.sexo === "Feminino"),
    ),
  });
});

app.get("/api/cidades", (_req, res) => {
  res.json(
    [...new Set(registros.map((registro) => registro.municipio))].sort(),
  );
});

app.get("/api/anos", (_req, res) => {
  res.json([...new Set(registros.map((registro) => registro.ano))].sort());
});

app.get("/api/mapa/opcoes", (_req, res) => {
  const municipiosUnicos = new Map();

  for (const registro of registros) {
    const chave = `${registro.uf}|${registro.municipio}`;
    if (!municipiosUnicos.has(chave)) {
      municipiosUnicos.set(chave, {
        uf: registro.uf,
        nome: registro.municipio,
        status: registro.statusMunicipio,
      });
    }
  }

  res.json({
    ufs: [...new Set(registros.map((registro) => registro.uf))].sort(),
    municipios: [...municipiosUnicos.values()].sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR"),
    ),
    anos: [...new Set(registros.map((registro) => registro.ano))].sort(),
  });
});

app.get("/api/mapa", (req, res) => {
  const { uf, municipio, ano } = req.query;
  const sexo = req.query.sexo || "Total";

  if (
    typeof sexo !== "string" ||
    !["Total", "Masculino", "Feminino"].includes(sexo)
  ) {
    return res.status(400).json({
      erro: 'O filtro "sexo" deve ser Total, Masculino ou Feminino.',
    });
  }

  const filtrados = filtrarRegistros({ uf, municipio, ano, sexo });

  res.json({
    totalCasos: somar(filtrados),
    totalMasculino: somar(
      filtrados.filter((registro) => registro.sexo === "Masculino"),
    ),
    totalFeminino: somar(
      filtrados.filter((registro) => registro.sexo === "Feminino"),
    ),
    totalRegistros: filtrados.length,
  });
});

module.exports = async function criarRotasMapa() {
  registros = await carregarRegistros();
  return app;
};
