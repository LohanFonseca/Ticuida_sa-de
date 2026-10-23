<script setup>
import { estado } from "../../estado/ticuida.js";
</script>

<template>
  <div class="avisos-sistema" aria-live="polite">
    <p v-if="estado.carregando" class="aviso">
      Processando...
    </p>

    <p v-if="estado.erro" class="erro" role="alert">
      {{ estado.erro }}
    </p>

    <p v-if="estado.mensagem" class="sucesso" role="status">
      {{ estado.mensagem }}
    </p>
  </div>
</template>