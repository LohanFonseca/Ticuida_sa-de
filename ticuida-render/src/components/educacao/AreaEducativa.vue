<script setup>
import { computed, ref } from "vue";
import { estado } from "../../estado/ticuida.js";
import { linkSeguro, normalizarTexto } from "../../utilitarios/formatacao.js";

defineProps({
  titulo: { type: String, default: "Aprender e cuidar" },
  descricao: {
    type: String,
    default: "Materiais educativos para aprender no seu tempo.",
  },
});

const busca = ref("");

const materiais = computed(() =>
  estado.conteudo.materiais.filter((item) =>
    normalizarTexto(
      `${item.titulo} ${item.tipo} ${item.descricao}`
    ).includes(normalizarTexto(busca.value))
  )
);
</script>

<template>
  <section>
    <span class="etiqueta">CONHECIMENTO QUE ACOLHE</span>
    <h1>{{ titulo }}</h1>
    <p class="suave">{{ descricao }}</p>

    <label>
      Pesquisar material ou formato
      <input
        v-model="busca"
        type="search"
        placeholder="Vídeo, PDF, e-book, vacina..."
      />
    </label>

    <div class="grade">
      <article v-for="material in materiais" :key="material.id" class="cartao">
        <span class="etiqueta">{{ material.tipo }}</span>
        <h3>{{ material.titulo }}</h3>
        <p>{{ material.descricao }}</p>

        <a
          v-if="linkSeguro(material.url)"
          :href="linkSeguro(material.url)"
          target="_blank"
          rel="noopener noreferrer"
        >
          Abrir material ↗
        </a>
      </article>
    </div>

    <p v-if="!materiais.length" class="vazio">
      Nenhum material encontrado.
    </p>
  </section>
</template>
