<script setup>
defineProps({
  itens: { type: Array, required: true },
  paginaAtual: { type: String, required: true },
  profissional: Boolean,
});

defineEmits(["navegar", "sair"]);
</script>

<template>
  <aside id="menu-principal" class="menu-lateral">
    <a href="#" class="marca" @click.prevent="$emit('navegar', 'inicio')">
      ♡ ticuida.
    </a>

    <span class="etiqueta">
      {{ profissional ? "ESPAÇO PROFISSIONAL" : "SEU ESPAÇO DE CUIDADO" }}
    </span>

    <nav aria-label="Menu principal">
      <button
        v-for="item in itens"
        :key="item.id"
        :class="{ ativo: paginaAtual === item.id }"
        :aria-current="paginaAtual === item.id ? 'page' : undefined"
        @click="$emit('navegar', item.id)"
      >
        <span aria-hidden="true">{{ item.icone }}</span>
        {{ item.nome }}
      </button>
    </nav>

    <div class="rodape-menu">
      <p>Um cuidado de cada vez.</p>
      <button class="secundario largura-total" @click="$emit('sair')">
        Sair
      </button>
    </div>
  </aside>
</template>