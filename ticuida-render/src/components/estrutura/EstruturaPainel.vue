<script setup>
import { computed, onMounted, ref } from "vue";
import { modoDemonstracao } from "../../dados.js";
import {
  estado,
  executar,
  encerrarSessao,
  limparAvisos,
} from "../../estado/ticuida.js";

import MenuLateral from "./MenuLateral.vue";
import BarraSuperior from "./BarraSuperior.vue";
import AvisosSistema from "./AvisosSistema.vue";

const props = defineProps({
  itens: { type: Array, required: true },
  paginaAtual: { type: String, required: true },
});

const emit = defineEmits(["update:paginaAtual"]);
const menuAberto = ref(true);

const titulo = computed(
  () => props.itens.find((item) => item.id === props.paginaAtual)?.nome || "Ticuida"
);

function navegar(destino) {
  limparAvisos();
  emit("update:paginaAtual", destino);

  if (window.innerWidth < 800) menuAberto.value = false;
}

function sairDoPainel() {
  if (!estado.carregando) executar(encerrarSessao);
}

onMounted(() => {
  menuAberto.value = window.innerWidth >= 800;
});
</script>

<template>
  <div class="estrutura" :class="{ recolhido: !menuAberto }">
    <MenuLateral
      v-if="menuAberto"
      :itens="itens"
      :pagina-atual="paginaAtual"
      :profissional="estado.usuario.perfil === 'profissional'"
      @navegar="navegar"
      @sair="sairDoPainel"
    />

    <div class="principal">
      <BarraSuperior
        :titulo="titulo"
        :usuario="estado.usuario"
        :menu-aberto="menuAberto"
        @alternar-menu="menuAberto = !menuAberto"
      />

      <main class="conteudo">
        <p v-if="modoDemonstracao" class="faixa-demo">
          Ambiente demonstrativo · Dados em memória · Sem notificações externas
        </p>
        <p v-if="estado.usuario.visitante" class="faixa-demo">
          Modo Explorar · alterações não são salvas
        </p>

        <AvisosSistema />

        <slot />

        <footer class="rodape">
          <strong>ticuida.</strong>
          <span>Informação e acolhimento para caminhar junto.</span>
          <a
            href="https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/a/aids-hiv"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ministério da Saúde ↗
          </a>
        </footer>
      </main>
    </div>
  </div>
</template>