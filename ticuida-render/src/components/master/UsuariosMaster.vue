<script setup>
import { onMounted, ref } from "vue";
import { requisitar } from "../servicos/apiMaster.js";

const busca = ref("");
const perfil = ref("");
const ativo = ref("");
const pagina = ref(1);
const resultado = ref(null);
const carregando = ref(false);
const erro = ref("");
const mensagem = ref("");

async function carregar() {
  carregando.value = true;
  erro.value = "";
  const parametros = new URLSearchParams({ pagina: String(pagina.value) });
  if (busca.value.trim()) parametros.set("busca", busca.value.trim());
  if (perfil.value) parametros.set("perfil", perfil.value);
  if (ativo.value) parametros.set("ativo", ativo.value);
  try {
    resultado.value = await requisitar(`/master/usuarios?${parametros}`);
  } catch (e) {
    erro.value = e.message;
  } finally {
    carregando.value = false;
  }
}

async function alternarAtivo(usuario) {
  erro.value = "";
  mensagem.value = "";
  try {
    const resposta = await requisitar(
      `/master/usuarios/${encodeURIComponent(usuario.id)}/ativo`,
      "PATCH",
      { ativo: !usuario.ativo, revisao: usuario.revisao },
    );
    mensagem.value = resposta.mensagem;
    await carregar();
  } catch (e) {
    erro.value = e.message;
  }
}

function pesquisar() {
  pagina.value = 1;
  carregar();
}

onMounted(carregar);
</script>

<template>
  <section aria-labelledby="titulo-usuarios">
    <h2 id="titulo-usuarios">Usuários</h2>
    <form class="master-filtros" @submit.prevent="pesquisar">
      <label>
        Buscar por nome ou e-mail
        <input v-model="busca" type="search" maxlength="120" />
      </label>
      <label>
        Perfil
        <select v-model="perfil">
          <option value="">Todos</option>
          <option value="paciente">Paciente</option>
          <option value="profissional">Profissional</option>
          <option value="master">Master</option>
        </select>
      </label>
      <label>
        Situação
        <select v-model="ativo">
          <option value="">Todas</option>
          <option value="true">Ativa</option>
          <option value="false">Inativa</option>
        </select>
      </label>
      <button type="submit" :disabled="carregando">Pesquisar</button>
    </form>
    <p v-if="erro" class="master-erro" role="alert">{{ erro }}</p>
    <p v-if="mensagem" class="master-sucesso" role="status">{{ mensagem }}</p>
    <p v-if="carregando" role="status">Carregando usuários…</p>
    <p v-else-if="resultado && !resultado.itens.length">Nenhum usuário encontrado.</p>
    <article v-for="usuario in resultado?.itens" :key="usuario.id" class="master-card">
      <div class="master-linha">
        <div>
          <h3>{{ usuario.nome }}</h3>
          <p>{{ usuario.email }} · {{ usuario.perfil }}</p>
          <p>{{ usuario.ativo ? "Conta ativa" : "Conta inativa" }}</p>
        </div>
        <button
          v-if="usuario.perfil !== 'master'"
          type="button"
          :disabled="carregando"
          @click="alternarAtivo(usuario)"
        >
          {{ usuario.ativo ? "Desativar conta" : "Reativar conta" }}
        </button>
      </div>
    </article>
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
