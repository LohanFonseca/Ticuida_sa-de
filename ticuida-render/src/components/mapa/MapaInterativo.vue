<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
const props = defineProps({ geografia: Object, uf: String, municipio: String, carregando: Boolean, erro: String });
const emit = defineEmits(["selecionar-estado", "selecionar-municipio", "voltar-brasil", "tentar-novamente"]);
const recipiente = ref(null);
const aviso = ref("");
let mapa, estados, municipios, observador;
let limitesBrasil;
const selecao = computed(() => props.geografia?.municipios.find(item => String(item.id) === props.municipio)?.nome || (props.uf === "PA" ? "Pará" : "Brasil"));
function codigo(feature) { return String(feature.properties?.codarea ?? feature.id ?? ""); }
function estiloEstado(feature) {
  return { className: `area-estado ${codigo(feature) === "15" ? "area-para" : ""}`, weight: 1, fillOpacity: .8 };
}
function estiloMunicipio(feature) {
  return { className: `area-municipio ${codigo(feature) === props.municipio ? "area-selecionada" : ""}`, weight: codigo(feature) === props.municipio ? 2.5 : .7, fillOpacity: .8 };
}
function textoTooltip(texto) { const el = document.createElement("span"); el.textContent = texto; return el; }
function ativar(layer, nome, acao) {
  layer.bindTooltip(textoTooltip(nome), { sticky: true });
  layer.on("click", acao);
  layer.on("add", () => {
    const elemento = layer.getElement();
    if (!elemento) return;
    elemento.setAttribute("tabindex", "0"); elemento.setAttribute("role", "button"); elemento.setAttribute("aria-label", nome);
    elemento.onkeydown = evento => { if (evento.key === "Enter" || evento.key === " ") { evento.preventDefault(); evento.stopPropagation(); acao(); } };
  });
}
function enquadrar(limites) {
  if (!mapa || !limites?.isValid()) return;
  mapa.stop();
  mapa.fitBounds(limites, { padding: [16, 16], maxZoom: 11, animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches, duration: .4 });
}
function atualizarSelecao() {
  if (!mapa || !estados) return;
  aviso.value = "";
  if (municipios && mapa.hasLayer(municipios)) mapa.removeLayer(municipios);
  if (props.uf !== "PA") { enquadrar(limitesBrasil); return; }
  municipios = L.geoJSON(props.geografia.para, { style: estiloMunicipio, onEachFeature(feature, layer) {
    const id = codigo(feature);
    const nome = props.geografia.municipios.find(item => String(item.id) === id)?.nome || id;
    ativar(layer, nome, () => emit("selecionar-municipio", id));
  }}).addTo(mapa);
  let alvo = municipios.getBounds();
  municipios.eachLayer(layer => { if (codigo(layer.feature) === props.municipio) alvo = layer.getBounds(); });
  enquadrar(alvo);
}
function desenhar() {
  if (!mapa || !props.geografia) return;
  if (estados) mapa.removeLayer(estados);
  if (municipios) mapa.removeLayer(municipios);
  estados = L.geoJSON(props.geografia.brasil, { style: estiloEstado, onEachFeature(feature, layer) {
    const id = codigo(feature);
    const nome = props.geografia.estados.find(item => String(item.id) === id)?.nome || id;
    ativar(layer, id === "15" ? `${nome}: selecionar estado` : `${nome}: fora da demonstração`, () => {
      if (id === "15") emit("selecionar-estado", "PA");
      else aviso.value = `${nome}: detalhamento disponível somente para o Pará nesta demonstração.`;
    });
  }}).addTo(mapa);
  limitesBrasil = estados.getBounds();
  mapa.setMaxBounds(limitesBrasil.pad(.2));
  atualizarSelecao();
}
onMounted(async () => {
  mapa = L.map(recipiente.value, { scrollWheelZoom: false, zoomSnap: .25, minZoom: 2, maxZoom: 12, attributionControl: true });
  mapa.attributionControl.addAttribution('Limites: <a href="https://servicodados.ibge.gov.br/api/docs/malhas?versao=3" target="_blank" rel="noopener noreferrer">IBGE</a>');
  await nextTick(); desenhar();
  observador = new ResizeObserver(() => { mapa?.invalidateSize({ pan: false }); });
  observador.observe(recipiente.value);
});
watch(() => props.geografia, desenhar);
watch([() => props.uf, () => props.municipio], atualizarSelecao);
onBeforeUnmount(() => { observador?.disconnect(); mapa?.remove(); mapa = undefined; });
</script>
<template>
  <section class="mapa-geografico" aria-label="Mapa interativo do Brasil">
    <div class="barra-mapa"><strong>{{ selecao }}</strong><button type="button" @click="emit('voltar-brasil')">Ver Brasil</button></div>
    <div class="quadro">
      <div ref="recipiente" class="superficie-mapa" aria-label="Use os filtros ou selecione uma área do mapa" />
      <div v-if="carregando || erro" class="mensagem-mapa" :role="erro ? 'alert' : 'status'">
        <p>{{ erro || 'Carregando mapa…' }}</p><button v-if="erro" type="button" @click="emit('tentar-novamente')">Tentar novamente</button>
      </div>
    </div>
    <p class="legenda">Pará em destaque · Clique no estado para explorar seus municípios.</p>
    <p v-if="aviso" class="legenda" role="status">{{ aviso }}</p>
  </section>
</template>
<style scoped>
.barra-mapa { display: flex; justify-content: space-between; gap: .5rem; align-items: center; margin: .5rem 0; }
.barra-mapa strong { overflow-wrap: anywhere; }
button { font: inherit; font-size: .75rem; padding: .35rem .6rem; border: 1px solid var(--borda); border-radius: .5rem; background: var(--superficie); color: var(--texto); cursor: pointer; }
button:focus-visible { outline: 2px solid var(--foco, var(--acai)); }
.quadro { position: relative; }
.superficie-mapa { width: 100%; height: 300px; isolation: isolate; z-index: 0; border-radius: .65rem; background: var(--superficie-suave, #e9e3ed); }
.mensagem-mapa { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1rem; text-align: center; background: var(--superficie); border-radius: .65rem; }
.legenda { font-size: .73rem; line-height: 1.4; color: var(--texto-secundario, var(--suave)); margin: .5rem 0; }
:deep(.area-estado) { fill: var(--superficie, #f2eff4); stroke: var(--borda, #b7aabd); }
:deep(.area-para), :deep(.area-municipio) { fill: var(--lavanda, #dfd1e7); stroke: var(--acai, #694276); }
:deep(.area-selecionada), :deep(.area-municipio:hover) { fill: var(--acai, #694276); stroke: var(--texto, #29232f); }
:deep(path:focus-visible) { outline: none; stroke: var(--texto, #29232f); stroke-width: 3; }
:deep(.leaflet-bar a), :deep(.leaflet-control-attribution), :deep(.leaflet-tooltip) { background: var(--superficie, #f2eff4); color: var(--texto, #29232f); }
:deep(.leaflet-control-attribution a) { color: var(--acai-escuro, #53315f); }
</style>
