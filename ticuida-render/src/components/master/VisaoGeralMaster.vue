<script setup>
import { onMounted, ref } from "vue";
import { requisitar } from "../servicos/apiMaster.js";

const resumo = ref(null);
const erro = ref("");

async function carregar() {
  erro.value = "";
  try {
    resumo.value = await requisitar("/master/resumo");
  } catch (e) {
    erro.value = e.message;
  }
}

onMounted(carregar);
</script>

<template>
  <section aria-labelledby="titulo-resumo">
    <h2 id="titulo-resumo">Resumo do sistema</h2>
    <p v-if="erro" class="master-erro" role="alert">{{ erro }}</p>
    <p v-else-if="!resumo" role="status">Carregando resumo…</p>
    <div v-else class="master-grade">
      <article class="master-card">
        <h3>Usuários cadastrados</h3>
        <strong class="master-numero">{{ resumo.totalUsuarios }}</strong>
      </article>
      <article class="master-card">
        <h3>Solicitações pendentes</h3>
        <strong class="master-numero">{{ resumo.pendentes }}</strong>
      </article>
      <article class="master-card">
        <h3>Notícias publicadas</h3>
        <strong class="master-numero">{{ resumo.publicadas }}</strong>
      </article>
    </div>
  </section>
</template>
