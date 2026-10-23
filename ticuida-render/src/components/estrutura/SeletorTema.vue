<script setup>
import { temaAtual, definirTema } from "../../estado/tema.js";
</script>

<template>
  <div class="seletor-tema" role="group" aria-label="Tema da aplicação">
    <button
      type="button"
      :aria-pressed="temaAtual === 'claro'"
      @click="definirTema('claro')"
    >
      Claro
    </button>

    <button
      type="button"
      :aria-pressed="temaAtual === 'escuro'"
      @click="definirTema('escuro')"
    >
      Escuro
    </button>
  </div>
</template>

<style scoped>
.seletor-tema {
  display: inline-flex;
  flex-shrink: 0;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--borda);
  border-radius: 12px;
  background: var(--superficie-suave);
}

.seletor-tema button {
  min-height: 40px;
  padding: 8px 13px;
  border-radius: 8px;
  background: transparent;
  color: var(--texto-secundario);
  font-size: 0.85rem;
  font-weight: 650;
}

.seletor-tema button[aria-pressed="true"] {
  background: var(--acai);
  color: var(--texto-botao);
}

.seletor-tema button:hover:not([aria-pressed="true"]) {
  background: var(--lavanda);
  color: var(--acai-escuro);
}
</style>