<script setup>
import { ref } from "vue";
import { limparAvisos } from "../estado/ticuida.js";

import EstruturaPainel from "../components/estrutura/EstruturaPainel.vue";
import NoticiasInicio from "../components/noticias/NoticiasInicio.vue";
import BuscarPaciente from "../components/pacientes/BuscarPaciente.vue";
import CadastrarPaciente from "../components/pacientes/CadastrarPaciente.vue";
import ApoioVacinas from "../components/educacao/ApoioVacinas.vue";

const pagina = ref("inicio");

const menu = [
  { id: "inicio", icone: "⌂", nome: "Página inicial" },
  { id: "pacientes", icone: "◎", nome: "Carteira do paciente" },
  { id: "apoio", icone: "+", nome: "Apoio sobre vacinas" },
  { id: "cadastro", icone: "↗", nome: "Cadastrar paciente" },
];

function navegar(destino) {
  limparAvisos();
  pagina.value = destino;
}
</script>

<template>
  <EstruturaPainel v-model:pagina-atual="pagina" :itens="menu">
    <NoticiasInicio
      v-if="pagina === 'inicio'"
      @navegar="navegar"
    />

    <BuscarPaciente v-else-if="pagina === 'pacientes'" />

    <ApoioVacinas v-else-if="pagina === 'apoio'" />

    <CadastrarPaciente v-else-if="pagina === 'cadastro'" />

  </EstruturaPainel>
</template>
