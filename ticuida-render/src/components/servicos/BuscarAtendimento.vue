<script setup>
import { computed, ref } from "vue";
import { estado } from "../../estado/ticuida.js";
import { estados } from "../../utilitarios/estado.js";
import { normalizarTexto } from "../../utilitarios/formatacao.js";

const busca = ref("");
const uf = ref("");

const servicos = computed(() =>
  estado.conteudo.servicos.filter(
    (item) =>
      (!uf.value || item.uf === uf.value) &&
      normalizarTexto(
        `${item.nome} ${item.cidade} ${item.tipo} ${item.servicos || ""}`
      ).includes(normalizarTexto(busca.value))
  )
);

function localizacao(servico) {
  const endereco =
    `${servico.nome} ${servico.endereco} ${servico.cidade} ${servico.uf}`;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
}
</script>

<template>
  <section>
    <h1>Cuidado perto de você</h1>

    <p class="suave">
      Pesquise UBS, hospitais, clínicas e laboratórios cadastrados.
      Confirme os horários e serviços diretamente com a unidade.
    </p>

    <div class="grade-formulario">
      <label>
        Nome, cidade ou serviço
        <input v-model="busca" type="search" placeholder="Ex.: Belém, testagem, UBS..." />
      </label>

      <label>
        Estado
        <select v-model="uf">
          <option value="">Todos</option>
          <option v-for="item in estados" :key="item.sigla" :value="item.sigla">
            {{ item.nome }}
          </option>
        </select>
      </label>
    </div>

    <div class="grade">
      <article v-for="servico in servicos" :key="servico.id" class="cartao">
        <span class="etiqueta">{{ servico.tipo }}</span>
        <h3>{{ servico.nome }}</h3>
        <p>{{ servico.endereco }}</p>
        <p>{{ servico.cidade }} / {{ servico.uf }}</p>
        <p>{{ servico.servicos }}</p>
        <p v-if="servico.telefone">Telefone: {{ servico.telefone }}</p>

        <a
          :href="localizacao(servico)"
          target="_blank"
          rel="noopener noreferrer"
        >
          Abrir localização ↗
        </a>
      </article>
    </div>

    <div v-if="!servicos.length" class="vazio">
      Nenhuma unidade cadastrada encontrada para este filtro.
      A demonstração não inclui endereços fictícios.
      <p>Se precisar de atendimento, procure uma unidade de saúde.</p>
    </div>
  </section>
</template>