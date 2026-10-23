<script setup>
import { reactive } from "vue";
import { modoDemonstracao } from "../../dados.js";
import { estado, executar, autenticar } from "../../estado/ticuida.js";

const props = defineProps({
  perfil: { type: String, required: true },
});

const formulario = reactive({
  email: "",
  senha: "",
});

async function enviar() {
  if (estado.carregando) return;

  await executar(() =>
    autenticar({
      ...formulario,
      perfil: props.perfil,
    })
  );

  formulario.senha = "";
}
</script>

<template>
  <form @submit.prevent="enviar">
    <p v-if="modoDemonstracao" class="aviso">
      A demonstração abre um perfil de exemplo. Não há autenticação real.
    </p>

    <template v-else>
      <label>
        E-mail
        <input
          v-model.trim="formulario.email"
          type="email"
          autocomplete="email"
          required
        />
      </label>

      <label>
        Senha
        <input
          v-model="formulario.senha"
          type="password"
          autocomplete="current-password"
          required
        />
      </label>
    </template>

    <button class="primario largura-total" :disabled="estado.carregando > 0">
      {{ modoDemonstracao ? "Explorar demonstração" : "Entrar" }}
    </button>
  </form>
</template>