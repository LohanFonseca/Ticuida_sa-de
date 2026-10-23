<script setup>
import { ref } from "vue";
import {
  estado,
  limparAvisos,
  entrarComoVisitante,
  executar,
} from "../../estado/ticuida.js";
import AvisosSistema from "../estrutura/AvisosSistema.vue";
import FormularioLogin from "./FormularioLogin.vue";
import FormularioCadastro from "./FormularioCadastro.vue";
import SeletorTema from "../estrutura/SeletorTema.vue";

const perfil = ref("paciente");
const cadastrando = ref(false);

function trocarPerfil(valor) {
  perfil.value = valor;
  limparAvisos();
}

function alternarFormulario() {
  cadastrando.value = !cadastrando.value;
  limparAvisos();
}
</script>

<template>
    <section class="cartao formulario-acesso">
        <div class="tema-no-acesso">
  <SeletorTema />
</div>
    </section>
  <main class="tela-acesso">
    <section class="apresentacao">
      <span class="marca">♡ ticuida.</span>
      <span class="etiqueta">DO PARÁ, COM CUIDADO</span>

      <h1>Informação acolhe.<br />Cuidado transforma.</h1>

      <p>
        Um espaço para aprender, acompanhar sua saúde e encontrar apoio.
        No seu tempo, com respeito e sem julgamentos.
      </p>

      <div class="coracao-decorativo" aria-hidden="true">♡</div>
      <small>HIV e outras ISTs · Prevenção · Acolhimento</small>
    </section>

    <section class="cartao formulario-acesso">
      <h2>{{ cadastrando ? "Vamos começar?" : "Que bom ter você aqui." }}</h2>
      <p class="suave">Escolha como deseja acessar.</p>

      <div class="seletor">
        <button
          v-for="tipo in ['paciente', 'profissional']"
          :key="tipo"
          :class="{ selecionado: perfil === tipo }"
          :aria-pressed="perfil === tipo"
          @click="trocarPerfil(tipo)"
        >
          {{ tipo === "paciente" ? "Sou paciente" : "Sou profissional" }}
        </button>
      </div>

      <AvisosSistema />

      <FormularioCadastro
        v-if="cadastrando"
        :key="`cadastro-${perfil}`"
        :perfil="perfil"
        @cadastrado="cadastrando = false"
      />

      <FormularioLogin
        v-else
        :key="`login-${perfil}`"
        :perfil="perfil"
      />

      <button
        class="secundario largura-total"
        :disabled="estado.carregando > 0"
        @click="executar(entrarComoVisitante)"
      >
        Explorar sem login
      </button>
      <p class="suave">
        No modo Explorar, você pode navegar pelo app, mas as alterações não são
        salvas.
      </p>

      <button class="link largura-total" @click="alternarFormulario">
        {{ cadastrando ? "Já tenho cadastro" : "Ainda não tenho cadastro" }}
      </button>
    </section>
  </main>
</template>