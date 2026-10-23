<script setup>
import AlertaVacinas from "./AlertaVacinas.vue";
import AlertaNoticias from "./AlertaNoticias.vue";
</script>

<template>
  <section>
    <h1>Meus alertas</h1>

    <p class="suave">
      Lembretes exibidos durante o uso do aplicativo.
      Avisos por e-mail ou celular dependem de integração futura.
    </p>

    <AlertaVacinas />
    <AlertaNoticias />
  </section>
</template>