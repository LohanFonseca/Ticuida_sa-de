<script setup>
import { ref } from "vue";
import { estado, limparAvisos } from "../estado/ticuida.js";

import EstruturaPainel from "../components/estrutura/EstruturaPainel.vue";
import NoticiasInicio from "../components/noticias/NoticiasInicio.vue";
import CarteiraVacinas from "../components/vacinas/CarteiraVacinas.vue";
import AreaEducativa from "../components/educacao/AreaEducativa.vue";
import MeusAlertas from "../components/alertas/MeusAlertas.vue";
import OrientacaoExposicao from "../components/exposicao/OrientacaoExposicao.vue";
import BuscarAtendimento from "../components/servicos/BuscarAtendimento.vue";

const pagina = ref("inicio");

const menu = [
  { id: "inicio", icone: "⌂", nome: "Página inicial" },
  { id: "carteira", icone: "▤", nome: "Minha carteira" },
  { id: "educacao", icone: "▣", nome: "Aprender e cuidar" },
  { id: "alertas", icone: "◷", nome: "Meus alertas" },
  { id: "exposicao", icone: "♡", nome: "Calculadora de Riscos" },
  { id: "servicos", icone: "⌖", nome: "Encontrar atendimento" },
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


    <CarteiraVacinas
      v-else-if="pagina === 'carteira'"
      :paciente="estado.usuario"
    />

    <AreaEducativa v-else-if="pagina === 'educacao'" />

    <MeusAlertas v-else-if="pagina === 'alertas'" />

    <OrientacaoExposicao
      v-else-if="pagina === 'exposicao'"
      @buscar-atendimento="navegar('servicos')"
    />

    <BuscarAtendimento v-else-if="pagina === 'servicos'" />
  </EstruturaPainel>
</template>
