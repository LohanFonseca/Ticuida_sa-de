<script setup>
import { ref } from "vue";

defineProps({
  pagina: { type: String, required: true },
  nome: { type: String, default: "" },
});
defineEmits(["navegar", "sair"]);

const aberto = ref(false);
const itens = [
  { id: "inicio", nome: "Visão geral" },
  { id: "usuarios", nome: "Usuários" },
  { id: "profissionais", nome: "Solicitações profissionais" },
  { id: "noticias", nome: "Notícias" },
  { id: "historico", nome: "Histórico" },
];
</script>

<template>
  <aside class="master-menu">
    <div class="master-marca">ticuida<span>Painel administrativo</span></div>
    <p>Olá, {{ nome }}</p>
    <button
      class="master-menu-abrir"
      type="button"
      :aria-expanded="aberto"
      @click="aberto = !aberto"
    >
      {{ aberto ? "Fechar menu" : "Abrir menu" }}
    </button>
    <nav :class="{ aberto }" aria-label="Navegação Master">
      <button
        v-for="item in itens"
        :key="item.id"
        type="button"
        :aria-current="pagina === item.id ? 'page' : undefined"
        @click="$emit('navegar', item.id)"
      >
        {{ item.nome }}
      </button>
    </nav>
    <button type="button" @click="$emit('sair')">Sair</button>
  </aside>
</template>
