<script setup>
import { ref } from "vue";
import { buscarPacientes } from "../../dados.js";
import { estado, executar } from "../../estado/ticuida.js";
import CarteiraVacinas from "../vacinas/CarteiraVacinas.vue";

const busca = ref("");
const pacientes = ref([]);
const selecionado = ref(null);
const pesquisou = ref(false);

async function pesquisar() {
  if (estado.carregando) return;

  pacientes.value = [];
  selecionado.value = null;
  pesquisou.value = false;

  await executar(async () => {
    pacientes.value = await buscarPacientes(busca.value);
    pesquisou.value = true;
  });
}
</script>

<template>
  <section>
    <h1>Localizar paciente</h1>

    <p class="suave">
      Pesquise pelo nome ou CPF de um paciente autorizado.
      Não solicite a senha pessoal dele.
    </p>

    <form class="linha formulario-busca" @submit.prevent="pesquisar">
      <label class="crescer">
        Nome ou CPF
        <input
          v-model.trim="busca"
          minlength="3"
          required
          placeholder="Na demonstração, pesquise Paciente"
        />
      </label>

      <button class="primario" :disabled="estado.carregando > 0">
        Pesquisar
      </button>
    </form>

    <div class="lista-resultados">
      <button
        v-for="paciente in pacientes"
        :key="paciente.id"
        class="resultado-paciente"
        :disabled="estado.carregando > 0"
        @click="selecionado = paciente"
      >
        <strong>{{ paciente.nome }}</strong>
        <span>Abrir carteira →</span>
      </button>
    </div>

    <p v-if="pesquisou && !pacientes.length" class="vazio">
      Nenhum paciente autorizado encontrado.
    </p>

    <CarteiraVacinas
      v-if="selecionado"
      :key="selecionado.id"
      :paciente="selecionado"
      profissional
    />
  </section>
</template>
