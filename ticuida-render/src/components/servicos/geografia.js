// Arquivos oficiais do IBGE incluídos em public/mapas. Não contém indicadores de saúde.
let promessa;
export function normalizarMunicipio(nome = "") {
  return String(nome).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}
export function carregarGeografia() {
  if (!promessa) {
    const base = import.meta.env.BASE_URL || "/";
    promessa = Promise.all(["brasil-estados.geojson", "para-municipios.geojson", "estados.json", "municipios-para.json"].map(async arquivo => {
      const resposta = await fetch(`${base}mapas/${arquivo}`);
      if (!resposta.ok) throw new Error("Não foi possível carregar os arquivos do mapa. Confira a pasta public/mapas.");
      return resposta.json();
    })).then(([brasil, para, estados, municipios]) => {
      if (!Array.isArray(brasil.features) || !Array.isArray(para.features) || !Array.isArray(estados) || !Array.isArray(municipios)) throw new Error("Os arquivos geográficos não estão no formato esperado.");
      return { brasil, para, estados, municipios };
    }).catch(erro => { promessa = undefined; throw erro; });
  }
  return promessa;
}
