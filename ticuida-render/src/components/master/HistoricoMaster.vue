<script setup>
import { onMounted, ref } from "vue";
import { requisitar } from "../servicos/apiMaster.js";

const pagina = ref(1);
const resultado = ref(null);
const carregando = ref(false);
const erro = ref("");

async function carregar() {
  carregando.value = true;
  erro.value = "";
  try {
    resultado.value = await requisitar(`/master/historico?pagina=${pagina.value}`);
  } catch (e) {
    erro.value = e.message;
  } finally {
    carregando.value = false;
  }
}

function formatarData(data) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}

onMounted(carregar);
</script>

<template>
  <section aria-labelledby="titulo-historico">
    <h2 id="titulo-historico">Histórico administrativo</h2>
    <p v-if="erro" class="master-erro" role="alert">{{ erro }}</p>
    <p v-if="carregando" role="status">Carregando histórico…</p>
    <p v-else-if="resultado && !resultado.itens.length">Ainda não há eventos.</p>
    <ol v-else class="master-historico">
      <li
        v-for="evento in resultado?.itens"
        :key="evento._id"
        class="master-card"
      >
        <strong>{{ evento.acao }}</strong>
        <p>{{ evento.autorNome }} · {{ evento.alvo }}</p>
        <small>{{ formatarData(evento.data) }}</small>
      </li>
    </ol>
    <div v-if="resultado && resultado.paginas > 1" class="master-acoes">
      <button
        type="button"
        :disabled="pagina <= 1 || carregando"
        @click="pagina--; carregar()"
      >
        Anterior
      </button>
      <span>Página {{ resultado.pagina }} de {{ resultado.paginas }}</span>
      <button
        type="button"
        :disabled="pagina >= resultado.paginas || carregando"
        @click="pagina++; carregar()"
      >
        Próxima
      </button>
    </div>
  </section>
</template>
