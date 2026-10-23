<script setup>
import { ref, reactive } from "vue";
import { requisitar } from "../servicos/apiMaster.js";
const aberto = ref(false),
  solicitacao = ref(null),
  erro = ref(""),
  mensagem = ref(""),
  ocupado = ref(false);
const form = reactive({ profissao: "", conselho: "", numero: "", uf: "PA" });
async function abrir() {
  aberto.value = true;
  ocupado.value = true;
  erro.value = "";
  try {
    solicitacao.value = await requisitar("/me/solicitacao-profissional");
  } catch (e) {
    erro.value = e.message;
  } finally {
    ocupado.value = false;
  }
}
async function enviar() {
  ocupado.value = true;
  erro.value = "";
  try {
    await requisitar("/me/solicitacao-profissional", "POST", form);
    solicitacao.value = { ...form, status: "pendente" };
    mensagem.value = "Solicitação enviada.";
  } catch (e) {
    erro.value = e.message;
  } finally {
    ocupado.value = false;
  }
}
</script>
<template>
  <details
    class="solicitar-perfil"
    :open="aberto"
    @toggle="aberto = $event.target.open"
  >
    <summary @click.prevent="aberto ? (aberto = false) : abrir()">
      Sou profissional de saúde
    </summary>
    <div v-if="aberto">
      <p>
        Solicite a mudança para o perfil profissional. Após aprovação, seu
        acesso passará a abrir o painel profissional.
      </p>
      <p v-if="erro" role="alert">{{ erro }}</p>
      <p v-if="mensagem" role="status">{{ mensagem }}</p>
      <p v-if="ocupado" role="status">Carregando…</p>
      <p v-if="solicitacao">
        Situação: {{ solicitacao.status }}. {{ solicitacao.motivo }}
      </p>
      <form
        v-if="!ocupado && solicitacao?.status !== 'pendente'"
        @submit.prevent="enviar"
      >
        <label
          >Profissão<input
            v-model="form.profissao"
            required
            minlength="2"
            maxlength="100" /></label
        ><label
          >Conselho<input
            v-model="form.conselho"
            required
            minlength="2"
            maxlength="40"
            placeholder="Ex.: COREN" /></label
        ><label
          >Número do registro<input
            v-model="form.numero"
            required
            minlength="2"
            maxlength="40" /></label
        ><label
          >UF<select v-model="form.uf">
            <option
              v-for="uf in 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(
                ' ',
              )"
              :key="uf"
            >
              {{ uf }}
            </option>
          </select></label
        ><button :disabled="ocupado">Enviar solicitação</button>
      </form>
    </div>
  </details>
</template>
<style scoped>
.solicitar-perfil {
  margin: 20px;
  padding: 16px;
  border: 1px solid var(--borda, #b7aabd);
  border-radius: 14px;
  background: var(--superficie, #f2eff4);
  color: var(--texto, #29232f);
  font: inherit;
}
.solicitar-perfil summary {
  cursor: pointer;
  font-weight: 600;
}
.solicitar-perfil form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  align-items: end;
}
.solicitar-perfil label {
  display: grid;
  gap: 5px;
}
.solicitar-perfil input,
.solicitar-perfil select,
.solicitar-perfil button {
  font: inherit;
  padding: 10px;
  border: 1px solid var(--borda, #b7aabd);
  border-radius: 8px;
  background: var(--superficie-campo, var(--superficie, #f2eff4));
  color: inherit;
  min-width: 0;
}
</style>
