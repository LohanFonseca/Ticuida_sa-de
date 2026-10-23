<script setup>
import { computed, ref } from "vue";
import { estado } from "../../estado/ticuida.js";
import { estados } from "../../utilitarios/estado.js";
import { linkSeguro, formatarData } from "../../utilitarios/formatacao.js";

const uf = ref("");

const noticias = computed(() =>
  estado.conteudo.noticias.filter(
    (item) =>
      item.casosConfirmados === true &&
      (!uf.value || item.uf === uf.value)
  )
);
</script>

<template>
  <section>
    <h2>Boletins com casos confirmados</h2>

    <label>
      Filtrar por estado
      <select v-model="uf">
        <option value="">Todos os estados</option>
        <option v-for="estadoItem in estados" :key="estadoItem.sigla" :value="estadoItem.sigla">
          {{ estadoItem.nome }}
        </option>
      </select>
    </label>

    <article v-for="noticia in noticias" :key="noticia.id" class="cartao">
      <small v-if="noticia.data">{{ formatarData(noticia.data) }}</small>
      <h3>{{ noticia.titulo }}</h3>
      <p>{{ noticia.resumo }}</p>

      <a
        v-if="linkSeguro(noticia.url)"
        :href="linkSeguro(noticia.url)"
        target="_blank"
        rel="noopener noreferrer"
      >
        Consultar fonte ↗
      </a>
    </article>

    <p v-if="!noticias.length" class="vazio">
      Nenhum boletim disponível para este filtro.
      Isso não significa ausência de casos.
    </p>
  </section>
</template>