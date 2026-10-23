<script setup>
import { ref, onMounted } from "vue";
import {
  estado,
  restaurarSessao,
  executar,
  encerrarSessao,
} from "./estado/ticuida.js";
import TelaAcesso from "./components/acesso/TelaAcesso.vue";
import PaginaPaciente from "./paginas/PaginaPaciente.vue";
import PaginaProfissional from "./paginas/PaginaProfissional.vue";
import PaginaMaster from "./paginas/PaginaMaster.vue";
import SolicitarPerfilProfissional from "./components/acesso/SolicitarPerfilProfissional.vue";
import "./estilos/ticuida.css";
const iniciando = ref(true),
  erroInicio = ref("");
async function iniciar() {
  iniciando.value = true;
  erroInicio.value = "";
  try {
    await restaurarSessao();
  } catch (e) {
    erroInicio.value = e.message;
  } finally {
    iniciando.value = false;
  }
}
onMounted(() => {
  try {
    const tema = localStorage.getItem("ticuida-tema");
    if (["claro", "escuro"].includes(tema))
      document.documentElement.dataset.tema = tema;
  } catch {}
  iniciar();
});
</script>
<template>
  <main v-if="iniciando" class="inicio-sessao" role="status">
    Abrindo o Ticuida…
  </main>
  <main v-else-if="erroInicio" class="inicio-sessao">
    <p role="alert">{{ erroInicio }}</p>
    <button @click="iniciar">Tentar novamente</button>
  </main>
  <TelaAcesso v-else-if="!estado.usuario" /><PaginaMaster
    v-else-if="estado.usuario.perfil === 'master'"
  /><PaginaProfissional
    v-else-if="estado.usuario.perfil === 'profissional'"
  /><template v-else-if="estado.usuario.perfil === 'paciente'"
    ><PaginaPaciente /><SolicitarPerfilProfissional
      v-if="!estado.usuario.visitante"
  /></template>
  <main v-else class="inicio-sessao">
    <p>Este perfil não tem acesso à aplicação.</p>
    <button @click="executar(encerrarSessao)">Sair</button>
  </main>
</template>
<style scoped>
.inicio-sessao {
  padding: 40px;
  font: 18px system-ui;
  color: var(--texto, #29232f);
  background: var(--fundo, #e4e0e7);
  min-height: 100vh;
}
</style>
