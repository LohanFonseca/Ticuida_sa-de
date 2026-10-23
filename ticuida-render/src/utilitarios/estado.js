export const estados = (
  "AC:Acre,AL:Alagoas,AP:Amapá,AM:Amazonas,BA:Bahia,CE:Ceará," +
  "DF:Distrito Federal,ES:Espírito Santo,GO:Goiás,MA:Maranhão," +
  "MT:Mato Grosso,MS:Mato Grosso do Sul,MG:Minas Gerais,PA:Pará," +
  "PB:Paraíba,PR:Paraná,PE:Pernambuco,PI:Piauí,RJ:Rio de Janeiro," +
  "RN:Rio Grande do Norte,RS:Rio Grande do Sul,RO:Rondônia," +
  "RR:Roraima,SC:Santa Catarina,SP:São Paulo,SE:Sergipe,TO:Tocantins"
)
  .split(",")
  .map((item) => {
    const [sigla, nome] = item.split(":");
    return { sigla, nome };
  });

// Posições de um cartograma esquemático, sem limites geográficos.
export const posicoesEstados = {
  RR: [2, 1], AP: [4, 1],
  AM: [2, 2], PA: [4, 2], MA: [5, 2], CE: [7, 2], RN: [8, 2],
  AC: [1, 3], RO: [2, 3], TO: [4, 3], PI: [6, 3], PB: [8, 3],
  MT: [3, 4], GO: [4, 4], BA: [6, 4], PE: [8, 4],
  MS: [3, 5], DF: [4, 5], MG: [5, 5], SE: [7, 5], AL: [8, 5],
  PR: [3, 6], SP: [4, 6], RJ: [5, 6], ES: [6, 6],
  SC: [3, 7], RS: [3, 8],
};