<script setup>
import { reactive, ref } from "vue";
import { hojeISO } from "../../utilitarios/formatacao.js";

const props = defineProps({
  registro: { type: Object, default: null },
  profissional: Boolean,
  ocupado: Boolean,
});

const emit = defineEmits(["salvar", "cancelar"]);
const erro = ref("");

const formulario = reactive({
  id: "",
  vacina: "",
  dose: "",
  aplicadaEm: "",
  proximaEm: "",
  observacao: "",
  permitirEdicao: false,
  ...(props.registro || {}),
});

function enviar() {
  erro.value = "";

  if (formulario.aplicadaEm > hojeISO()) {
    erro.value = "A aplicação não pode estar no futuro.";
    return;
  }

  if (
    formulario.proximaEm &&
    formulario.proximaEm < formulario.aplicadaEm
  ) {
    erro.value = "A próxima data não pode ser anterior à aplicação.";
    return;
  }

  emit("salvar", { ...formulario });
}
</script>

<template>
  <form class="cartao" @submit.prevent="enviar">
    <h3>{{ formulario.id ? "Editar registro" : "Nova aplicação" }}</h3>

    <div class="grade-formulario">
      <label>
        Vacina
        <input v-model.trim="formulario.vacina" maxlength="120" required />
      </label>

      <label>
        Dose
        <input v-model.trim="formulario.dose" placeholder="Conforme comprovante" required />
      </label>

      <label>
        Data de aplicação
        <input
          v-model="formulario.aplicadaEm"
          type="date"
          :max="hojeISO()"
          required
        />
      </label>

      <label>
        Próxima data, se orientada
        <input
          v-model="formulario.proximaEm"
          type="date"
          :min="formulario.aplicadaEm || undefined"
        />
      </label>
    </div>

    <label>
      Observações
      <textarea v-model.trim="formulario.observacao" rows="3"></textarea>
    </label>

    <label v-if="profissional" class="check">
      <input v-model="formulario.permitirEdicao" type="checkbox" />
      Permitir edição deste registro pelo paciente
    </label>

    <p v-else class="suave">
      Novos registros feitos por você serão identificados como autodeclarados.
    </p>

    <p v-if="erro" class="erro" role="alert">{{ erro }}</p>

    <div class="linha">
      <button class="primario" :disabled="ocupado">Salvar registro</button>
      <button
        class="secundario"
        type="button"
        :disabled="ocupado"
        @click="$emit('cancelar')"
      >
        Cancelar
      </button>
    </div>
  </form>
</template>