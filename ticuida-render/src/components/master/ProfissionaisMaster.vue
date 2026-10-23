<script setup>
import { onMounted, ref } from "vue";
import { requisitar } from "../servicos/apiMaster.js";

const pagina = ref(1);
const resultado = ref(null);
const motivos = ref({});
const carregando = ref(false);
const erro = ref("");
const mensagem = ref("");

async function carregar() {
  carregando.value = true;
  erro.value = "";
  try {
    resultado.value = await requisitar(
      `/master/profissionais?pagina=${pagina.value}`,
    );
  } catch (e) {
    erro.value = e.message;
  } finally {
    carregando.value = false;
  }
}

async function decidir(usuario, aprovar) {
  erro.value = "";
  mensagem.value = "";
  try {
    const resposta = await requisitar(
      `/master/profissionais/${encodeURIComponent(usuario.id)}/decisao`,
      "POST",
      {
        revisao: usuario.revisao,
        aprovar,
        motivo: motivos.value[usuario.id] || "",
      },
    );
    mensagem.value = resposta.mensagem;
    await carregar();
  } catch (e) {
    erro.value = e.message;
  }
}

onMounted(carregar);
</script>

<template>
  <section aria-labelledby="titulo-profissionais">
    <h2 id="titulo-profissionais">Solicitações profissionais</h2>
    <p v-if="erro" class="master-erro" role="alert">{{ erro }}</p>
    <p v-if="mensagem" class="master-sucesso" role="status">{{ mensagem }}</p>
    <p v-if="carregando" role="status">Carregando solicitações…</p>
    <p v-else-if="resultado && !resultado.itens.length">
      Não há solicitações pendentes.
    </p>
    <article
      v-for="usuario in resultado?.itens"
      :key="usuario.id"
      class="master-card"
    >
      <h3>{{ usuario.nome }}</h3>
      <p>{{ usuario.email }}</p>
      <p>
        {{ usuario.solicitacao.profissao }} ·
        {{ usuario.solicitacao.conselho }}
        {{ usuario.solicitacao.numero }}/{{ usuario.solicitacao.uf }}
      </p>
      <label>
        Motivo da recusa
        <textarea
          v-model="motivos[usuario.id]"
          maxlength="600"
          rows="3"
          placeholder="Obrigatório para recusar (mínimo de 5 caracteres)"
        />
      </label>
      <div class="master-acoes">
        <button
          type="button"
          :disabled="carregando"
          @click="decidir(usuario, true)"
        >
          Aprovar
        </button>
        <button
          type="button"
          :disabled="carregando"
          @click="decidir(usuario, false)"
        >
          Recusar
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
