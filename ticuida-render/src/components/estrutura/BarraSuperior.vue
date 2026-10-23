<script setup>
import SeletorTema from "./SeletorTema.vue";

defineProps({
  titulo: { type: String, required: true },
  usuario: { type: Object, required: true },
  menuAberto: Boolean,
});

defineEmits(["alternar-menu"]);
</script>

<template>
  <header class="barra-superior">
    <div class="linha">
      <button
        type="button"
        class="botao-menu"
        aria-label="Abrir ou recolher menu"
        aria-controls="menu-principal"
        :aria-expanded="menuAberto"
        @click="$emit('alternar-menu')"
      >
        ☰
      </button>

      <span class="titulo-barra">{{ titulo }}</span>
    </div>

    <div class="acoes-cabecalho">
      <SeletorTema />

      <div class="perfil-usuario">
        <span class="avatar" aria-hidden="true">
          {{ usuario.nome.charAt(0) }}
        </span>

        <div class="identificacao-usuario">
          <strong>{{ usuario.nome }}</strong>
          <small>
            {{
              usuario.perfil === "profissional"
                ? "Profissional de saúde"
                : "Paciente"
            }}
          </small>
        </div>
      </div>
    </div>
  </header>
</template>