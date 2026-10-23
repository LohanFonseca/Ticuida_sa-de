<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { consultarMapa, carregarOpcoesMapa } from "../../dados.js";
import { carregarGeografia, normalizarMunicipio } from "../servicos/geografia.js";
import FiltrosMapa from "./FiltrosMapa.vue";
import MapaInterativo from "./MapaInterativo.vue";
import DadosFiltradosMapa from "./DadosFiltradosMapa.vue";
const uf = ref("");
const municipio = ref("");
const ano = ref("");
const sexo = ref("Total");
const opcoes = ref({ municipios: [], anos: [] });
const geografia = ref(null);
const carregandoGeografia = ref(true);
const erroGeografia = ref("");
const resultado = ref(null);
const erro = ref("");
const carregando = ref(true);
let pronta = false, ativa = true, requisicao = 0;
const municipios = computed(() => {
  const registros = opcoes.value.municipios.filter(item => item.uf === "PA");
  const usados = new Set();
  const oficiais = (geografia.value?.municipios || []).map(item => {
    const correspondencias = registros.filter(registro => registro.status === "informado" && normalizarMunicipio(registro.nome) === normalizarMunicipio(item.nome));
    const registro = correspondencias.length === 1 ? correspondencias[0] : null;
    if (registro) usados.add(registro);
    return { id: String(item.id), nome: item.nome, consulta: registro?.nome || item.nome, localizado: true };
  });
  const pendentes = registros.filter(item => !usados.has(item)).map(item => ({ id: `base:${item.nome}`, nome: item.nome, consulta: item.nome, localizado: false }));
  return [...oficiais, ...pendentes].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
});
const selecionado = computed(() => municipios.value.find(item => item.id === municipio.value));
const territorio = computed(() => selecionado.value ? `${selecionado.value.nome} · PA` : "Pará · todos os municípios");
function selecionarEstado(valor) { uf.value = valor; municipio.value = ""; }
function selecionarMunicipio(valor) { uf.value = "PA"; municipio.value = valor; }
async function carregarContornos() {
  carregandoGeografia.value = true; erroGeografia.value = "";
  try { const dados = await carregarGeografia(); if (ativa) geografia.value = dados; }
  catch (falha) { if (ativa) erroGeografia.value = falha.message; }
  finally { if (ativa) carregandoGeografia.value = false; }
}
async function atualizar() {
  const id = ++requisicao;
  resultado.value = null; carregando.value = true; erro.value = "";
  try {
    const dados = await consultarMapa({ uf: "PA", municipio: selecionado.value?.consulta || "", ano: ano.value, sexo: sexo.value });
    if (ativa && id === requisicao) resultado.value = dados;
  } catch (falha) { if (ativa && id === requisicao) erro.value = falha.message || "Não foi possível consultar os indicadores."; }
  finally { if (ativa && id === requisicao) carregando.value = false; }
}
async function iniciarDados() {
  pronta = false; carregando.value = true; erro.value = "";
  try {
    const dados = await carregarOpcoesMapa();
    if (!ativa) return;
    opcoes.value = { municipios: dados.municipios || [], anos: dados.anos || [] };
    pronta = true;
    await atualizar();
  } catch (falha) { if (ativa) { erro.value = falha.message || "Não foi possível carregar os filtros."; carregando.value = false; } }
}
watch([uf, municipio, ano, sexo], () => { if (pronta) atualizar(); });
onMounted(() => { carregarContornos(); iniciarDados(); });
onBeforeUnmount(() => { ativa = false; requisicao++; });
</script>
<template>
  <section class="cartao mapa-inicio" aria-label="Panorama epidemiológico do Pará">
    <header><span class="etiqueta">UM OLHAR COLETIVO</span><h3>Panorama epidemiológico</h3><p class="suave">Mapa do Brasil · indicadores disponíveis apenas para o Pará.</p></header>
    <FiltrosMapa :uf="uf" :municipio="municipio" v-model:ano="ano" v-model:sexo="sexo" :municipios="municipios" :anos="opcoes.anos"
      @update:uf="selecionarEstado" @update:municipio="selecionarMunicipio" />
    <MapaInterativo :geografia="geografia" :uf="uf" :municipio="municipio" :carregando="carregandoGeografia" :erro="erroGeografia"
      @selecionar-estado="selecionarEstado" @selecionar-municipio="selecionarMunicipio" @voltar-brasil="selecionarEstado('')" @tentar-novamente="carregarContornos" />
    <p class="recorte"><strong>Dados exibidos: {{ territorio }}</strong></p>
    <p v-if="selecionado && !selecionado.localizado" class="nota">Localização municipal não confirmada. O mapa permanece enquadrado no Pará.</p>
    <DadosFiltradosMapa :resultado="resultado" :erro="erro" :carregando="carregando" :municipio="selecionado?.consulta || ''" :municipios="opcoes.municipios" @tentar-novamente="iniciarDados" />
    <p class="nota">A seleção no mapa indica localização, não nível de risco. A ausência de registros não significa zero casos.</p>
  </section>
</template>
<style scoped>
.mapa-inicio { margin: 0; padding: 1.1rem; min-width: 0; color: var(--texto); background: var(--superficie); }
h3 { margin: .4rem 0; }
header p, .recorte { font-size: .8rem; line-height: 1.5; }
.nota { font-size: .75rem; line-height: 1.5; color: var(--texto-secundario, var(--suave)); }
</style>
