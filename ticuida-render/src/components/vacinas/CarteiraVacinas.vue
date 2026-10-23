<script setup>
import { ref, watch } from "vue";
import { listarRegistros, salvarRegistro } from "../../dados.js";
import { estado, executar } from "../../estado/ticuida.js";

import CartaoVacina from "./CartaoVacina.vue";
import FormularioVacina from "./FormularioVacina.vue";

const props = defineProps({
  paciente: { type: Object, required: true },
  profissional: Boolean,
});

const registros = ref([]);
const mostrarFormulario = ref(false);
const registroSelecionado = ref(null);
const versaoFormulario = ref(0);
const carteiraCarregada = ref(false);

let versaoCarga = 0;

async function carregar() {
  const versao = ++versaoCarga;
  const pacienteId = props.paciente.id;

  registros.value = [];
  carteiraCarregada.value = Boolean(props.paciente.visitante);
  if (props.paciente.visitante) return;
  carteiraCarregada.value = false;

  await executar(async () => {
    const dados = await listarRegistros(pacienteId);

    if (versao === versaoCarga && props.paciente.id === pacienteId) {
      registros.value = dados;
      carteiraCarregada.value = true;
    }
  });
}

watch(
  () => props.paciente.id,
  () => {
    mostrarFormulario.value = false;
    registroSelecionado.value = null;
    carregar();
  },
  { immediate: true }
);

function abrirFormulario(registro = null) {
  if (
    registro &&
    !props.profissional &&
    registro.origem === "profissional" &&
    !registro.permitirEdicao
  ) {
    return;
  }

  registroSelecionado.value = registro;
  versaoFormulario.value++;
  mostrarFormulario.value = true;
}

async function salvar(dados) {
  if (estado.carregando) return;

  const pacienteId = props.paciente.id;

  await executar(async () => {
    await salvarRegistro(pacienteId, dados);

    if (props.paciente.id !== pacienteId) return;

    mostrarFormulario.value = false;
    carteiraCarregada.value = false;
    registros.value = [];

    registros.value = await listarRegistros(pacienteId);
    carteiraCarregada.value = true;
    estado.mensagem = "Registro salvo.";
  });
}

async function alterarPermissao(registro) {
  if (!props.profissional || estado.carregando) return;

  await salvar({
    ...registro,
    permitirEdicao: !registro.permitirEdicao,
  });
}
</script>

<template>
  <section>
    <div class="cabecalho-secao">
      <div>
        <h1>{{ profissional ? "Carteira do paciente" : "Minha carteira" }}</h1>
        <p class="suave">{{ paciente.nome }}</p>
      </div>

      <button
        v-if="!paciente.visitante"
        class="primario"
        :disabled="estado.carregando > 0"
        @click="abrirFormulario()"
      >
        + Registrar aplicação
      </button>
    </div>

    <p v-if="paciente.visitante" class="aviso">
      Modo Explorar: a carteira é apenas demonstrativa e não salva alterações.
    </p>

    <p class="aviso">
      Não existe vacina contra o HIV. Esta carteira registra outras vacinas.
      O sistema não calcula esquemas nem recomenda doses.
    </p>

    <FormularioVacina
      v-if="mostrarFormulario && !paciente.visitante"
      :key="versaoFormulario"
      :registro="registroSelecionado"
      :profissional="profissional"
      :ocupado="estado.carregando > 0"
      @salvar="salvar"
      @cancelar="mostrarFormulario = false"
    />

    <div class="grade">
      <CartaoVacina
        v-for="registro in registros"
        :key="registro.id"
        :registro="registro"
        :profissional="profissional"
        :ocupado="estado.carregando > 0"
        @editar="abrirFormulario"
        @alterar-permissao="alterarPermissao"
      />
    </div>

    <p v-if="carteiraCarregada && !registros.length" class="vazio">
      Nenhuma aplicação registrada.
    </p>

    <button
      v-if="!paciente.visitante && !carteiraCarregada && !estado.carregando"
      class="secundario"
      @click="carregar"
    >
      Tentar carregar carteira novamente
    </button>
  </section>
</template>
