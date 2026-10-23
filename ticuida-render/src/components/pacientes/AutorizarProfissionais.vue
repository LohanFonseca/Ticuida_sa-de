<script setup>
import { ref, onMounted } from "vue";
import {
  listarAutorizacoes,
  autorizarProfissional,
  revogarProfissional,
} from "../../dados.js";
const email = ref(""),
  lista = ref([]),
  erro = ref(""),
  ocupado = ref(false);
async function executar(acao) {
  ocupado.value = true;
  erro.value = "";
  try {
    await acao();
    lista.value = await listarAutorizacoes();
  } catch (e) {
    erro.value = e.message;
  } finally {
    ocupado.value = false;
  }
}
async function adicionar() {
  await executar(async () => {
    await autorizarProfissional(email.value);
    email.value = "";
  });
}
onMounted(() => executar(async () => {}));
</script>
<template>
  <section class="cartao">
    <h3>Profissionais autorizados</h3>
    <p>
      Autorize um profissional cadastrado para consultar e atualizar sua
      carteira. Você pode revogar esse acesso aqui.
    </p>
    <form @submit.prevent="adicionar">
      <label
        >E-mail do profissional<input
          v-model="email"
          type="email"
          required
          maxlength="254"
          autocomplete="off"
      /></label>
      <button type="submit" :disabled="ocupado">Autorizar acesso</button>
    </form>
    <p v-if="erro" role="alert">{{ erro }}</p>
    <p v-if="ocupado" role="status">Atualizando…</p>
    <ul>
      <li v-for="item in lista" :key="item.id">
        <span>{{ item.nome }} — {{ item.email }}</span
        ><button
          type="button"
          :disabled="ocupado"
          @click="executar(() => revogarProfissional(item.id))"
        >
          Revogar acesso
        </button>
      </li>
    </ul>
    <p v-if="!ocupado && !erro && !lista.length">
      Nenhum profissional autorizado.
    </p>
  </section>
</template>
<style scoped>
form,
li {
  display: flex;
  gap: 0.75rem;
  align-items: end;
  flex-wrap: wrap;
}
label {
  display: grid;
  gap: 0.4rem;
  flex: 1;
}
input {
  min-width: 0;
  width: 100%;
}
li {
  justify-content: space-between;
  margin: 0.8rem 0;
  overflow-wrap: anywhere;
}
ul {
  padding: 0;
  list-style: none;
}
button {
  cursor: pointer;
}
</style>
