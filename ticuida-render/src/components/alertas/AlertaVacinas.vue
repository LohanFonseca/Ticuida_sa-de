<script setup>
import { computed, onMounted, ref } from "vue";
import { listarRegistros } from "../../dados.js";
import { estado, executar } from "../../estado/ticuida.js";
import {
  diasRestantes,
  formatarData,
  situacaoData,
} from "../../utilitarios/formatacao.js";

const registros = ref([]);
const carregou = ref(false);

const lembretes = computed(() =>
  registros.value
    .filter((item) => item.proximaEm && diasRestantes(item.proximaEm) <= 30)
    .slice()
    .sort((a, b) => a.proximaEm.localeCompare(b.proximaEm))
);

async function carregar() {
  carregou.value = false;

  await executar(async () => {
    registros.value = await listarRegistros(estado.usuario.id);
    carregou.value = true;
  });
}

onMounted(carregar);
</script>

<template>
  <section>
    <h2>Datas da carteira</h2>

    <article
      v-for="registro in lembretes"
      :key="registro.id"
      class="cartao lembrete"
    >
      <div>
        <strong>{{ registro.vacina }}</strong>
        <p>{{ formatarData(registro.proximaEm) }}</p>
      </div>
      <span class="estado-registro">
        {{ situacaoData(registro.proximaEm) }}
      </span>
    </article>

    <p v-if="carregou && !lembretes.length" class="vazio">
      Nenhuma data vencida ou prevista para os próximos 30 dias.
    </p>

    <button
      v-if="!carregou && !estado.carregando"
      class="secundario"
      @click="carregar"
    >
      Tentar carregar lembretes novamente
    </button>
  </section>
</template>