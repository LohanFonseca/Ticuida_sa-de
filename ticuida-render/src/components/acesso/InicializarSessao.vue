<script setup>
import { onMounted, ref } from "vue";
import { estado } from "../../estado/ticuida.js";
import { obterSessao, carregarConteudo } from "../../dados.js";
const carregando = ref(true);
const erro = ref("");
async function inicializar() {
  carregando.value = true;
  erro.value = "";
  try {
    const usuario = await obterSessao();
    if (usuario) {
      const conteudo = await carregarConteudo();
      Object.assign(estado.conteudo, conteudo);
    }
    estado.usuario = usuario;
  } catch (falha) {
    erro.value = falha.message || "Não foi possível verificar sua sessão.";
  } finally {
    carregando.value = false;
  }
}
onMounted(inicializar);
</script>
<template>
  <p v-if="carregando" role="status">Abrindo sua conta…</p>
  <div v-else-if="erro" role="alert">
    <p>{{ erro }}</p>
    <button type="button" @click="inicializar">Tentar novamente</button>
  </div>
  <slot v-else />
</template>
