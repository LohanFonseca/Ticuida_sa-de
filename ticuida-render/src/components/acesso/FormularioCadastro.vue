<script setup>
import { reactive } from "vue";
import { cadastrar, modoDemonstracao } from "../../dados.js";
import { estado, executar } from "../../estado/ticuida.js";

const props = defineProps({
  perfil: { type: String, default: "paciente" },
  porProfissional: Boolean,
});

const emit = defineEmits(["cadastrado"]);

const valoresIniciais = () => ({
  nome: "",
  cpf: "",
  email: "",
  senha: "",
  conselho: "",
});

const formulario = reactive(valoresIniciais());

async function enviar() {
  if (estado.carregando) return;

  const sucesso = await executar(async () => {
    const dados = {
      nome: formulario.nome,
      cpf: formulario.cpf,
      email: formulario.email,
      perfil: props.porProfissional ? "paciente" : props.perfil,
    };

    if (!props.porProfissional) {
      dados.senha = formulario.senha;
    }

    if (dados.perfil === "profissional") {
      dados.conselho = formulario.conselho;
    }

    await cadastrar(dados);

    estado.mensagem = modoDemonstracao
      ? "Cadastro demonstrativo criado nesta sessão."
      : "Cadastro enviado. O acesso depende da ativação da conta.";
  });

  if (sucesso) {
    Object.assign(formulario, valoresIniciais());
    emit("cadastrado");
  }
}
</script>

<template>
  <form @submit.prevent="enviar">
    <p v-if="modoDemonstracao" class="aviso">
      Utilize apenas dados fictícios nesta demonstração.
    </p>

    <label>
      Nome completo
      <input v-model.trim="formulario.nome" required />
    </label>

    <label>
      CPF
      <input
        v-model.trim="formulario.cpf"
        inputmode="numeric"
        pattern="[0-9]{11}"
        maxlength="11"
        placeholder="11 números, sem pontuação"
        required
      />
    </label>

    <label>
      E-mail
      <input v-model.trim="formulario.email" type="email" required />
    </label>

    <label v-if="!porProfissional">
      Senha
      <input
        v-model="formulario.senha"
        type="password"
        minlength="8"
        autocomplete="new-password"
        required
      />
    </label>

    <label v-if="perfil === 'profissional' && !porProfissional">
      Conselho ou identificação profissional
      <input v-model.trim="formulario.conselho" required />
    </label>

    <p v-if="porProfissional" class="suave">
      Cadastre com a ciência do paciente.
      Na aplicação integrada, ele deverá ativar o próprio acesso.
    </p>

    <button class="primario largura-total" :disabled="estado.carregando > 0">
      {{ porProfissional ? "Cadastrar paciente" : "Criar cadastro" }}
    </button>
  </form>
</template>