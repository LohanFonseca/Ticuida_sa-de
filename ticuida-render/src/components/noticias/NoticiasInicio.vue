<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { estado } from "../../estado/ticuida.js";
import {
  normalizarTexto,
} from "../../utilitarios/formatacao.js";

import MapaNacional from "../mapa/MapaNacional.vue";
import CartaoNoticia from "./CartaoNoticia.vue";

defineEmits(["navegar"]);

const busca = ref("");

const profissional = computed(
  () => estado.usuario?.perfil === "profissional"
);

const noticias = computed(() =>
  estado.conteudo.noticias.filter((item) =>
    normalizarTexto(`${item.titulo} ${item.resumo}`).includes(
      normalizarTexto(busca.value)
    )
  )
);

const mapaColuna = ref(null);
const referenciasLaterais = ref([]);
const limiteLaterais = ref(0);
let observador;
let ajustando = false;
let recalcular = false;

const noticiasLaterais = computed(() =>
  noticias.value.slice(0, limiteLaterais.value),
);
const noticiasInferiores = computed(() =>
  noticias.value.slice(limiteLaterais.value),
);

function registrarNoticia(elemento, indice) {
  referenciasLaterais.value[indice] = elemento;
  if (elemento) observador?.observe(elemento);
}

async function ajustarNoticias() {
  if (ajustando) {
    recalcular = true;
    return;
  }

  ajustando = true;
  try {
    let tentativas = noticias.value.length * 2 + 2;
    let continuar = true;
    while (continuar && tentativas-- > 0) {
      recalcular = false;
      await nextTick();

      if (window.matchMedia("(max-width: 800px)").matches) {
        continuar = limiteLaterais.value !== 0;
        if (continuar) limiteLaterais.value = 0;
        continue;
      }

      const alturaMapa = mapaColuna.value?.getBoundingClientRect().height || 0;
      let alturaOcupada = 0;
      let quantidadeQueCabe = 0;
      const alturaGap = 16;

      for (let indice = 0; indice < limiteLaterais.value; indice++) {
        const elemento = referenciasLaterais.value[indice];
        if (!elemento) break;
        const altura = elemento.getBoundingClientRect().height;
        if (alturaOcupada + altura + (indice ? alturaGap : 0) > alturaMapa)
          break;
        alturaOcupada += altura + (indice ? alturaGap : 0);
        quantidadeQueCabe++;
      }

      if (quantidadeQueCabe < limiteLaterais.value) {
        limiteLaterais.value = quantidadeQueCabe;
        continuar = true;
        continue;
      }

      if (limiteLaterais.value >= noticias.value.length) {
        continuar = false;
        continue;
      }

      const proxima = limiteLaterais.value;
      limiteLaterais.value++;
      await nextTick();
      const elemento = referenciasLaterais.value[proxima];
      const altura = elemento?.getBoundingClientRect().height || 0;
      if (
        !elemento ||
        alturaOcupada + altura + (proxima ? alturaGap : 0) > alturaMapa
      ) {
        limiteLaterais.value = proxima;
        continuar = false;
      } else {
        continuar = true;
      }
    }
  } finally {
    ajustando = false;
    if (recalcular) ajustarNoticias();
  }
}

watch(noticias, ajustarNoticias, { flush: "post" });

onMounted(() => {
  observador = new ResizeObserver(ajustarNoticias);
  if (mapaColuna.value) observador.observe(mapaColuna.value);
  window.addEventListener("resize", ajustarNoticias);
  ajustarNoticias();
});

onBeforeUnmount(() => {
  observador?.disconnect();
  window.removeEventListener("resize", ajustarNoticias);
});
</script>

<template>
  <section>
    <div class="boas-vindas">
      <div>
        <span class="etiqueta">CUIDAR COMEÇA COM INFORMAÇÃO</span>
        <h1>Ti cuida.<br />A gente cuida junto.</h1>
        <p>Orientação, prevenção e apoio para seguir com mais tranquilidade.</p>

        <button
          class="primario"
          @click="$emit('navegar', profissional ? 'pacientes' : 'servicos')"
        >
          {{ profissional ? "Acessar carteira do paciente" : "Encontrar atendimento" }}
        </button>
      </div>

      <span class="flor" aria-hidden="true">✳</span>
    </div>

    <div class="atalhos">
      <button @click="$emit('navegar', profissional ? 'pacientes' : 'carteira')">
        <strong>Carteira de vacinação</strong>
        <small>Histórico e próximas datas</small>
      </button>



      <button @click="$emit('navegar', profissional ? 'apoio' : 'educacao')">
        <strong>Conhecer para cuidar</strong>
        <small>Materiais e orientação</small>
      </button>
    </div>

    <div class="cabecalho-secao">
      <h2>Informação e notícias</h2>
      <label>
        Pesquisar conteúdo
        <input v-model="busca" type="search" placeholder="Digite um assunto..." />
      </label>
    </div>

    <div class="mapa-e-laterais">
      <div ref="mapaColuna" class="mapa-coluna">
        <MapaNacional class="mapa-principal" />
      </div>

      <aside class="noticias-laterais">
        <CartaoNoticia
          v-for="noticia in noticiasLaterais"
          :key="noticia.id"
          :ref="(el) => registrarNoticia(el?.$el, noticias.indexOf(noticia))"
          :noticia="noticia"
        />
      </aside>
    </div>

    <div v-if="noticiasInferiores.length || !noticias.length" class="noticias-inferiores">
      <CartaoNoticia
        v-for="noticia in noticiasInferiores"
        :key="noticia.id"
        :noticia="noticia"
      />
      <p v-if="!noticias.length" class="vazio">Nenhum conteúdo encontrado.</p>
    </div>
  </section>
</template>
<style scoped>
.atalhos { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.mapa-e-laterais {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: 1rem;
  align-items: start;
}
.noticias-laterais { display: grid; gap: 1rem; min-width: 0; }
.noticias-inferiores {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: 1rem;
  margin-top: 1rem;
}
@media (max-width: 1200px) {
  .mapa-e-laterais { grid-template-columns: minmax(0, 1fr); }
  .noticias-inferiores { grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); }
}
@media (min-width: 801px) {
  .mapa-e-laterais { grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); }
}
@media (max-width: 600px) {
  .atalhos { grid-template-columns: minmax(0, 1fr); }
  .cabecalho-secao { align-items: stretch; flex-direction: column; }
}
</style>
