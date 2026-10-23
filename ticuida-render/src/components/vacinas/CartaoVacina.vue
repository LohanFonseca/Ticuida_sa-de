<script setup>
import { computed } from "vue";
import { formatarData } from "../../utilitarios/formatacao.js";

const props = defineProps({
  registro: { type: Object, required: true },
  profissional: Boolean,
  ocupado: Boolean,
});

defineEmits(["editar", "alterar-permissao"]);

const podeEditar = computed(
  () =>
    props.profissional ||
    props.registro.origem === "paciente" ||
    props.registro.permitirEdicao
);
</script>

<template>
  <article class="cartao">
    <span class="etiqueta">
      {{ registro.origem === "profissional" ? "REGISTRO PROFISSIONAL" : "AUTODECLARADO" }}
    </span>

    <h3>{{ registro.vacina }}</h3>
    <p>{{ registro.dose }}</p>

    <dl>
      <dt>Aplicada em</dt>
      <dd>{{ formatarData(registro.aplicadaEm) }}</dd>

      <dt>Próxima data registrada</dt>
      <dd>{{ formatarData(registro.proximaEm) }}</dd>
    </dl>

    <p v-if="registro.observacao" class="suave">{{ registro.observacao }}</p>

    <p class="estado-registro">
      {{ podeEditar ? "Edição disponível" : "Protegido pelo profissional" }}
    </p>

    <div class="linha">
      <button
        class="secundario"
        :disabled="!podeEditar || ocupado"
        @click="$emit('editar', registro)"
      >
        Editar
      </button>

      <button
        v-if="profissional && registro.origem === 'profissional'"
        class="link"
        :disabled="ocupado"
        @click="$emit('alterar-permissao', registro)"
      >
        {{
          registro.permitirEdicao
            ? "Bloquear edição do paciente"
            : "Liberar edição do paciente"
        }}
      </button>
    </div>
  </article>
</template>
