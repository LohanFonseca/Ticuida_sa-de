<script setup>
import FormularioCadastro from "../acesso/FormularioCadastro.vue";
</script>

<template>
  <section class="coluna-leitura">
    <h1>Um novo começo de cuidado</h1>
    <p class="suave">Cadastre um paciente que ainda não possui conta.</p>

    <div class="cartao">
      <FormularioCadastro perfil="paciente" por-profissional />
    </div>
  </section>
</template>