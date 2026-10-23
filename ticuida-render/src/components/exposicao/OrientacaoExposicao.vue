<script setup>
import { computed, reactive, ref, watch, nextTick } from "vue";

defineEmits(["buscar-atendimento"]);

const perguntas = [
  {
    chave: "preservativo",
    titulo: "Com que frequência você usou preservativo nos últimos 6 meses?",
    ajuda: "Considere preservativos internos ou externos.",
    opcoes: [
      ["sempre", "Sempre"],
      ["maioria", "Na maioria das vezes"],
      ["raramente", "Raramente"],
      ["nunca", "Nunca"],
      ["sem-relacoes", "Não tive relações sexuais"],
    ],
  },
  {
    chave: "pratica",
    titulo: "Que tipo de prática sexual ocorreu nas relações sem preservativo?",
    ajuda: "Selecione a opção que melhor descreve sua situação.",
    opcoes: [
      ["nenhuma", "Nenhuma / não tive relações"],
      ["oral", "Apenas oral"],
      ["vaginal", "Vaginal"],
      ["anal", "Anal"],
      ["vaginal-anal", "Vaginal e anal"],
    ],
  },
  {
    chave: "sintomas",
    titulo: "Você está sentindo algum destes sintomas?",
    ajuda:
      "Selecione todos os que se aplicam. A ausência de sintomas não descarta uma IST.",
    multipla: true,
    opcoes: [
      [
        "feridas",
        "Feridas, bolhas ou úlceras na região genital, anal ou na boca",
      ],
      ["corrimento", "Corrimento incomum"],
      ["ardor", "Coceira, ardor ao urinar ou dor durante a relação sexual"],
      ["verrugas", "Verrugas na região genital ou anal"],
      ["nenhum", "Nenhum destes sintomas"],
    ],
  },
  {
    chave: "parceiro",
    titulo:
      "Você ou algum(a) parceiro(a) recente teve diagnóstico ou sintomas de IST?",
    ajuda: "Considere os últimos meses.",
    opcoes: [
      ["sim", "Sim, houve diagnóstico ou sintomas"],
      ["naosei", "Não sei / não conversamos sobre isso"],
      ["nao", "Não; sei que fizeram exames recentes e deram negativo"],
    ],
  },
  {
    chave: "exames",
    titulo: "Quando você fez exames de rotina para ISTs pela última vez?",
    ajuda: "Por exemplo, HIV, sífilis e hepatites B/C.",
    opcoes: [
      ["menos6meses", "Há menos de 6 meses"],
      ["ate1ano", "Entre 6 meses e 1 ano"],
      ["mais1ano", "Há mais de 1 ano"],
      ["nunca", "Nunca fiz exames"],
    ],
  },
  {
    chave: "prevencao",
    titulo: "Quais formas adicionais de prevenção você utiliza?",
    ajuda: "Selecione todas as opções que se aplicam.",
    multipla: true,
    opcoes: [
      ["prep", "Faço uso contínuo de PrEP"],
      ["pep", "Tomei PEP nas últimas 72 horas"],
      ["vacinas", "Tenho vacinação contra hepatite B e HPV em dia"],
      ["nenhum", "Nenhuma das alternativas"],
    ],
    nota: "PrEP e PEP previnem HIV; as vacinas contra hepatite B e HPV não previnem outras ISTs.",
  },
  {
    chave: "evento72",
    titulo:
      "Nas últimas 72 horas, houve sexo desprotegido, rompimento de preservativo ou violência sexual?",
    ajuda:
      "Uma resposta positiva requer avaliação imediata de um profissional de saúde.",
    opcoes: [
      ["sim", "Sim"],
      ["nao", "Não"],
    ],
  },
  {
    chave: "perfuro",
    titulo: "Você compartilhou materiais perfurocortantes não esterilizados?",
    ajuda:
      "Considere agulhas, seringas ou materiais de perfuração/tatuagem nos últimos meses.",
    opcoes: [
      ["sim", "Sim"],
      ["nao", "Não"],
    ],
  },
];

const respostas = reactive({
  preservativo: "",
  pratica: "",
  sintomas: [],
  parceiro: "",
  exames: "",
  prevencao: [],
  evento72: "",
  perfuro: "",
});

const etapa = ref(0);
const resultadoVisivel = ref(false);
const erroFormulario = ref("");
const perguntaAtual = computed(() => perguntas[etapa.value]);
const tituloPergunta = ref(null);
const tituloResultado = ref(null);
const totalRespondidas = computed(
  () =>
    perguntas.filter((pergunta) => {
      const resposta = respostas[pergunta.chave];
      return Array.isArray(resposta) ? resposta.length > 0 : Boolean(resposta);
    }).length,
);
const progresso = computed(
  () => (totalRespondidas.value / perguntas.length) * 100,
);
const respostaAtualPreenchida = computed(() => {
  const resposta = respostas[perguntaAtual.value.chave];
  return Array.isArray(resposta) ? resposta.length > 0 : Boolean(resposta);
});
const todasRespondidas = computed(
  () => totalRespondidas.value === perguntas.length,
);
const categorias = [
  "Proteção",
  "Práticas",
  "Sintomas",
  "Parcerias",
  "Testagem",
  "Prevenção",
  "Exposição recente",
  "Outras exposições",
];
const resumoRespostas = computed(() =>
  perguntas.map((pergunta, indice) => {
    const valores = Array.isArray(respostas[pergunta.chave])
      ? respostas[pergunta.chave]
      : [respostas[pergunta.chave]];
    return {
      indice,
      titulo: pergunta.titulo,
      texto: pergunta.opcoes
        .filter(([valor]) => valores.includes(valor))
        .map(([, texto]) => texto)
        .join("; "),
    };
  }),
);
function focarPergunta() {
  tituloPergunta.value?.focus({ preventScroll: true });
}
async function editarResposta(indice) {
  resultadoVisivel.value = false;
  etapa.value = indice;
  erroFormulario.value = "";
  await nextTick();
  focarPergunta();
}
async function mostrarResultado() {
  if (!todasRespondidas.value) return;
  resultadoVisivel.value = true;
  await nextTick();
  tituloResultado.value?.focus({ preventScroll: true });
}

watch(
  respostas,
  () => {
    resultadoVisivel.value = false;
    erroFormulario.value = "";
  },
  { deep: true },
);

const sintomasAtivos = computed(() =>
  respostas.sintomas.some((sintoma) => sintoma !== "nenhum"),
);
const prioridade = computed(() => {
  if (respostas.evento72 === "sim") return "urgente";

  if (
    sintomasAtivos.value ||
    respostas.parceiro === "sim" ||
    respostas.perfuro === "sim" ||
    (["raramente", "nunca"].includes(respostas.preservativo) &&
      ["vaginal", "anal", "vaginal-anal"].includes(respostas.pratica))
  ) {
    return "alta";
  }

  if (
    respostas.preservativo === "maioria" ||
    respostas.parceiro === "naosei" ||
    respostas.exames === "mais1ano" ||
    respostas.exames === "nunca" ||
    respostas.pratica === "oral"
  ) {
    return "media";
  }

  return "baixa";
});

const orientacao = computed(() => {
  if (prioridade.value === "urgente") {
    return {
      titulo: "Procure avaliação para PEP agora",
      texto:
        "Uma situação de exposição nas últimas 72 horas pode exigir avaliação para PEP. " +
        "Procure imediatamente um serviço de saúde ou de urgência. A PEP deve ser iniciada " +
        "o quanto antes, idealmente nas primeiras 24 horas e no máximo em até 72 horas. " +
        "Não espere por sintomas ou pelo resultado desta calculadora.",
      classe: "urgente",
    };
  }

  if (prioridade.value === "alta") {
    return {
      titulo: "Recomendamos avaliação prioritária",
      texto:
        "Suas respostas indicam situações que merecem avaliação presencial e testagem. " +
        "Procure uma unidade de saúde em breve. Se houver sintomas, evite relações sexuais " +
        "ou use preservativo até receber orientação profissional.",
      classe: "alta",
    };
  }

  if (prioridade.value === "media") {
    return {
      titulo: "Considere fazer uma testagem",
      texto:
        "Converse com uma equipe de saúde e atualize sua testagem para ISTs. A testagem " +
        "é importante mesmo sem sintomas. Use preservativos e converse com a equipe sobre " +
        "prevenção adequada para você.",
      classe: "media",
    };
  }

  return {
    titulo: "Mantenha a prevenção e a rotina de cuidado",
    texto:
      "Pelas respostas informadas, não apareceram fatores que indiquem necessidade de " +
      "atendimento prioritário neste momento. Isso não descarta uma IST: mantenha a prevenção, " +
      "faça testagem de rotina e procure uma unidade de saúde se surgirem sintomas ou dúvidas.",
    classe: "baixa",
  };
});

function selecionada(opcao) {
  const resposta = respostas[perguntaAtual.value.chave];
  return perguntaAtual.value.multipla
    ? resposta.includes(opcao)
    : resposta === opcao;
}

function selecionar(opcao) {
  const pergunta = perguntaAtual.value;
  const resposta = respostas[pergunta.chave];
  if (!pergunta.multipla) {
    respostas[pergunta.chave] = opcao;
    return;
  }

  if (opcao === "nenhum") {
    respostas[pergunta.chave] = resposta.includes(opcao) ? [] : [opcao];
    return;
  }

  const outras = resposta.filter((item) => item !== "nenhum");
  respostas[pergunta.chave] = outras.includes(opcao)
    ? outras.filter((item) => item !== opcao)
    : [...outras, opcao];
}

function continuar() {
  const resposta = respostas[perguntaAtual.value.chave];
  if (!resposta || (Array.isArray(resposta) && !resposta.length)) {
    erroFormulario.value = "Escolha uma opção para continuar.";
    return;
  }

  erroFormulario.value = "";
  if (etapa.value < perguntas.length - 1) {
    etapa.value += 1;
    return;
  }

  mostrarResultado();
}

async function voltar() {
  erroFormulario.value = "";
  if (resultadoVisivel.value) {
    resultadoVisivel.value = false;
    etapa.value = perguntas.length - 1;
    await nextTick();
    focarPergunta();
  } else if (etapa.value > 0) {
    etapa.value -= 1;
  }
}

async function reiniciar() {
  for (const pergunta of perguntas) {
    respostas[pergunta.chave] = pergunta.multipla ? [] : "";
  }
  etapa.value = 0;
  resultadoVisivel.value = false;
  erroFormulario.value = "";
  await nextTick();
  focarPergunta();
}
</script>

<template>
  <section class="calculadora-riscos">
    <header class="introducao-quiz">
      <span class="etiqueta-quiz">CUIDADO SEM JULGAMENTOS</span>
      <h1>Calculadora de riscos</h1>
      <p>
        Um quiz rápido para ajudar você a pensar em prevenção, testagem e
        próximos passos.
      </p>
      <div class="detalhes-quiz">
        <span>8 perguntas</span><span aria-hidden="true">·</span
        ><span>No seu ritmo</span><span aria-hidden="true">·</span
        ><span>Respostas privadas</span>
      </div>
    </header>

    <aside class="aviso-quiz">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6m0-10v2" />
      </svg>
      <p>
        Esta ferramenta não diagnostica ISTs nem calcula uma probabilidade
        individual. Suas respostas não são enviadas ou armazenadas.
      </p>
    </aside>

    <div class="quiz-cartao">
      <template v-if="!resultadoVisivel">
        <div class="progresso-quiz">
          <div class="progresso-texto">
            <span>Seu percurso de cuidado</span
            ><strong
              >{{ totalRespondidas }} de
              {{ perguntas.length }} respondidas</strong
            >
          </div>
          <div
            class="trilho-progresso"
            role="progressbar"
            :aria-valuenow="totalRespondidas"
            :aria-valuemax="perguntas.length"
            :aria-valuemin="0"
            aria-label="Perguntas respondidas"
          >
            <span :style="{ width: `${progresso}%` }" />
          </div>
        </div>

        <form @submit.prevent="continuar" novalidate>
          <Transition
            name="pergunta"
            mode="out-in"
            @after-enter="focarPergunta"
          >
            <div :key="perguntaAtual.chave" class="pergunta-quiz">
              <div class="identificacao-pergunta">
                <span class="numero-pergunta">{{
                  String(etapa + 1).padStart(2, "0")
                }}</span
                ><span>{{ categorias[etapa] }}</span
                ><span class="tipo-pergunta">{{
                  perguntaAtual.multipla ? "Múltipla escolha" : "Escolha única"
                }}</span>
              </div>
              <fieldset
                class="grupo-respostas"
                :aria-describedby="`ajuda-${perguntaAtual.chave}`"
              >
                <legend ref="tituloPergunta" tabindex="-1">
                  {{ perguntaAtual.titulo }}
                </legend>
                <p :id="`ajuda-${perguntaAtual.chave}`" class="ajuda-pergunta">
                  {{ perguntaAtual.ajuda }}
                </p>
                <div
                  class="opcoes-quiz"
                  :class="{
                    'opcoes-curtas': perguntaAtual.opcoes.every(
                      (opcao) => opcao[1].length < 48,
                    ),
                  }"
                >
                  <label
                    v-for="opcao in perguntaAtual.opcoes"
                    :key="opcao[0]"
                    class="opcao-quiz"
                    :class="{
                      selecionada: selecionada(opcao[0]),
                      multipla: perguntaAtual.multipla,
                    }"
                  >
                    <input
                      class="entrada-opcao"
                      :type="perguntaAtual.multipla ? 'checkbox' : 'radio'"
                      :name="perguntaAtual.chave"
                      :value="opcao[0]"
                      :checked="selecionada(opcao[0])"
                      @change="selecionar(opcao[0])"
                    />
                    <span class="marcador-opcao" aria-hidden="true"
                      ><svg
                        v-if="selecionada(opcao[0])"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.7"
                      >
                        <path d="m5 12 4 4L19 6" /></svg
                    ></span>
                    <span class="texto-opcao">{{ opcao[1] }}</span>
                  </label>
                </div>
                <p v-if="perguntaAtual.nota" class="nota-pergunta">
                  {{ perguntaAtual.nota }}
                </p>
              </fieldset>
            </div>
          </Transition>

          <p v-if="erroFormulario" class="erro-quiz" role="alert">
            {{ erroFormulario }}
          </p>
          <footer class="rodape-quiz">
            <div class="feedback-selecao" aria-live="polite">
              <span
                :class="{ preenchida: respostaAtualPreenchida }"
                aria-hidden="true"
              />{{
                respostaAtualPreenchida
                  ? "Resposta marcada. Você pode continuar."
                  : perguntaAtual.multipla
                    ? "Marque todas as opções que se aplicam."
                    : "Escolha uma resposta para continuar."
              }}
            </div>
            <div class="controles-quiz">
              <button
                type="button"
                class="botao-secundario"
                :disabled="etapa === 0"
                @click="voltar"
              >
                <span aria-hidden="true">←</span> Voltar
              </button>
              <button type="submit" class="botao-principal">
                {{
                  etapa === perguntas.length - 1
                    ? "Ver minha orientação"
                    : "Continuar"
                }}<span aria-hidden="true">→</span>
              </button>
            </div>
            <button
              v-if="todasRespondidas && etapa < perguntas.length - 1"
              type="button"
              class="botao-texto concluir-revisao"
              @click="mostrarResultado"
            >
              Concluir revisão e ver orientação
            </button>
          </footer>
        </form>
      </template>

      <section
        v-else
        class="resultado-orientacao"
        :class="`resultado-${orientacao.classe}`"
        aria-labelledby="titulo-resultado"
      >
        <div class="cabecalho-resultado">
          <span class="icone-resultado" aria-hidden="true"
            ><svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
            >
              <path d="M12 3 4 6v6c0 4 8 9 8 9s8-5 8-9V6z" />
              <path d="M12 8v5m0 2v2" /></svg></span
          ><span class="etiqueta-quiz">{{
            orientacao.classe === "urgente"
              ? "ATENÇÃO IMEDIATA"
              : "SUA ORIENTAÇÃO DE CUIDADO"
          }}</span>
        </div>
        <h2 id="titulo-resultado" ref="tituloResultado" tabindex="-1">
          {{ orientacao.titulo }}
        </h2>
        <p class="texto-resultado">{{ orientacao.texto }}</p>
        <p class="nota-resultado">
          Esta orientação não é um diagnóstico nem substitui avaliação
          profissional. A ausência de sintomas não descarta uma IST.
        </p>
        <div class="acoes-resultado">
          <button
            type="button"
            class="botao-principal"
            @click="$emit('buscar-atendimento')"
          >
            Encontrar atendimento <span aria-hidden="true">↗</span></button
          ><button type="button" class="botao-secundario" @click="reiniciar">
            Refazer quiz
          </button>
        </div>
        <details class="revisao-respostas">
          <summary>
            Revisar minhas respostas
            <span>{{ perguntas.length }} perguntas</span>
          </summary>
          <ol>
            <li v-for="item in resumoRespostas" :key="item.indice">
              <div>
                <h3>{{ item.titulo }}</h3>
                <p>{{ item.texto }}</p>
              </div>
              <button
                type="button"
                class="botao-texto"
                :aria-label="`Editar resposta da pergunta ${item.indice + 1}`"
                @click="editarResposta(item.indice)"
              >
                Editar
              </button>
            </li>
          </ol>
        </details>
        <button
          type="button"
          class="botao-texto voltar-respostas"
          @click="voltar"
        >
          ← Voltar às respostas
        </button>
      </section>
    </div>
    <p class="privacidade-quiz">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        aria-hidden="true"
      >
        <rect x="5" y="10" width="14" height="11" rx="3" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v3" /></svg
      >Suas respostas são privadas e ficam apenas nesta página.
    </p>
  </section>
</template>

<style scoped>
.calculadora-riscos {
  --quiz-texto: var(--texto, #29232f);
  --quiz-secundario: var(--texto-secundario, var(--suave, #514758));
  --quiz-fundo: var(--superficie, #f2eff4);
  --quiz-suave: var(--superficie-suave, #e9e3ed);
  --quiz-borda: var(--borda, #b7aabd);
  --quiz-destaque: var(--acai, #694276);
  --quiz-selecao: var(--lavanda, #dfd1e7);
  --quiz-contraste: var(--texto-botao, #ffffff);
  color: var(--quiz-texto);
  width: min(100%, 860px);
  min-width: 0;
  margin: clamp(1rem, 3vw, 2.5rem) auto;
}
.calculadora-riscos *,
.calculadora-riscos *::before,
.calculadora-riscos *::after {
  box-sizing: border-box;
}
.introducao-quiz {
  margin-bottom: 1.4rem;
}
.etiqueta-quiz {
  font-size: 0.7rem;
  font-weight: 750;
  letter-spacing: 0.12em;
  color: var(--quiz-destaque);
}
.introducao-quiz h1 {
  color: var(--quiz-texto);
  margin: 0.55rem 0 0.65rem;
  font-size: clamp(1.85rem, 4vw, 2.7rem);
  line-height: 1.15;
  letter-spacing: -0.035em;
}
.introducao-quiz > p {
  color: var(--quiz-secundario);
  max-width: 630px;
  margin: 0;
  line-height: 1.65;
}
.detalhes-quiz {
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
  margin-top: 0.85rem;
  color: var(--quiz-secundario);
  font-size: 0.78rem;
}
.aviso-quiz {
  display: flex;
  gap: 0.7rem;
  align-items: flex-start;
  padding: 0.9rem 1rem;
  border: 1px solid var(--quiz-borda);
  border-radius: 14px;
  margin-bottom: 1.2rem;
  color: var(--quiz-secundario);
  background: var(--quiz-suave);
}
.aviso-quiz svg {
  flex: 0 0 21px;
  width: 21px;
  height: 21px;
  margin-top: 0.1rem;
}
.aviso-quiz p {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.65;
}
.quiz-cartao {
  background: var(--quiz-fundo);
  border: 1px solid var(--quiz-borda);
  padding: clamp(1.1rem, 4vw, 2.3rem);
  border-radius: 24px;
  box-shadow: 0 8px 28px rgb(35 22 44 / 0.055);
  overflow: hidden;
}
.progresso-quiz {
  margin-bottom: 1.7rem;
}
.progresso-texto {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.4rem 1rem;
  font-size: 0.78rem;
  color: var(--quiz-secundario);
  margin-bottom: 0.65rem;
}
.progresso-texto strong {
  font-weight: 650;
  color: var(--quiz-texto);
}
.trilho-progresso {
  height: 6px;
  border-radius: 20px;
  overflow: hidden;
  background: var(--quiz-suave);
}
.trilho-progresso > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--quiz-destaque);
  transition: width 0.2s ease;
}
.identificacao-pergunta {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
  font-size: 0.8rem;
  color: var(--quiz-secundario);
  margin-bottom: 1rem;
}
.numero-pergunta {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: var(--quiz-selecao);
  color: var(--quiz-texto);
  font-weight: 750;
}
.tipo-pergunta {
  margin-left: auto;
  border: 1px solid var(--quiz-borda);
  border-radius: 20px;
  padding: 0.3rem 0.65rem;
  font-size: 0.7rem;
}
.grupo-respostas {
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}
.grupo-respostas legend {
  float: none;
  padding: 0;
  width: 100%;
  color: var(--quiz-texto);
  font-size: clamp(1.15rem, 2.7vw, 1.55rem);
  font-weight: 700;
  line-height: 1.45;
  letter-spacing: -0.015em;
}
.grupo-respostas legend:focus,
.resultado-orientacao h2:focus {
  outline: none;
}
.ajuda-pergunta {
  margin: 0.6rem 0 1.2rem;
  color: var(--quiz-secundario);
  font-size: 0.85rem;
  line-height: 1.65;
}
.opcoes-quiz {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.7rem;
}
.opcoes-curtas {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.opcoes-curtas .opcao-quiz:last-child:nth-child(odd) {
  grid-column: 1 / -1;
}
.opcao-quiz {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
  min-height: 68px;
  padding: 0.95rem 1rem;
  border: 1px solid var(--quiz-borda);
  border-radius: 14px;
  background: var(--quiz-fundo);
  cursor: pointer;
  color: var(--quiz-texto);
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1.5;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    box-shadow 0.15s ease;
}
.entrada-opcao {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
.texto-opcao {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}
.marcador-opcao {
  display: grid;
  place-items: center;
  flex: 0 0 24px;
  width: 24px;
  height: 24px;
  border: 1.5px solid var(--quiz-borda);
  border-radius: 50%;
  background: var(--quiz-suave);
  color: var(--quiz-contraste);
}
.multipla .marcador-opcao {
  border-radius: 7px;
}
.marcador-opcao svg {
  width: 16px;
  height: 16px;
}
.opcao-quiz.selecionada {
  background: var(--quiz-selecao);
  border-color: var(--quiz-destaque);
  box-shadow: inset 0 0 0 1px var(--quiz-destaque);
}
.selecionada .marcador-opcao {
  border-color: var(--quiz-destaque);
  background: var(--quiz-destaque);
}
.opcao-quiz:has(.entrada-opcao:focus-visible) {
  outline: 3px solid var(--foco, var(--quiz-destaque));
  outline-offset: 3px;
}
.nota-pergunta {
  color: var(--quiz-secundario);
  font-size: 0.78rem;
  line-height: 1.65;
  padding-left: 0.8rem;
  border-left: 2px solid var(--quiz-borda);
  margin: 1rem 0 0;
}
.rodape-quiz {
  border-top: 1px solid var(--quiz-borda);
  margin-top: 1.5rem;
  padding-top: 1rem;
}
.feedback-selecao {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--quiz-secundario);
  min-height: 1.5rem;
}
.feedback-selecao > span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--quiz-borda);
  flex-shrink: 0;
}
.feedback-selecao .preenchida {
  background: var(--quiz-destaque);
}
.controles-quiz {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 1rem;
}
.calculadora-riscos button {
  font: inherit;
  cursor: pointer;
  letter-spacing: normal;
}
.botao-principal,
.botao-secundario {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 48px;
  padding: 0.75rem 1.2rem;
  border: 1px solid var(--quiz-destaque);
  border-radius: 12px;
  font-size: 0.86rem !important;
  font-weight: 650 !important;
  line-height: 1.4;
  transition:
    background 0.15s ease,
    box-shadow 0.15s ease;
}
.botao-principal {
  color: var(--quiz-contraste);
  background: var(--quiz-destaque);
}
.botao-secundario {
  background: transparent;
  border-color: var(--quiz-borda);
  color: var(--quiz-texto);
}
.botao-secundario:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.calculadora-riscos button:focus-visible,
.revisao-respostas summary:focus-visible {
  outline: 3px solid var(--foco, var(--quiz-destaque));
  outline-offset: 3px;
}
.botao-texto {
  border: 0;
  background: transparent;
  color: var(--quiz-destaque);
  padding: 0.6rem 0.3rem;
  min-height: 44px;
  font-size: 0.8rem !important;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.concluir-revisao {
  display: block;
  margin: 0.65rem auto 0;
}
.erro-quiz {
  color: var(--erro-texto, var(--quiz-texto));
  background: var(--erro-fundo, var(--quiz-suave));
  border-left: 3px solid var(--erro-borda, var(--quiz-destaque));
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
}
.privacidade-quiz {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.5rem;
  color: var(--quiz-secundario);
  margin: 1rem 0;
  font-size: 0.75rem;
  line-height: 1.6;
  text-align: center;
}
.privacidade-quiz svg {
  width: 17px;
  height: 17px;
  flex-shrink: 0;
}
.cabecalho-resultado {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}
.icone-resultado {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: var(--quiz-selecao);
  color: var(--quiz-destaque);
  flex-shrink: 0;
}
.icone-resultado svg {
  width: 26px;
  height: 26px;
}
.resultado-orientacao h2 {
  font-size: clamp(1.35rem, 3vw, 1.8rem);
  line-height: 1.4;
  color: var(--quiz-texto);
  margin: 1.2rem 0 0.8rem;
}
.texto-resultado {
  color: var(--quiz-texto);
  line-height: 1.8;
  font-size: 0.95rem;
}
.nota-resultado {
  padding: 1rem;
  background: var(--quiz-suave);
  color: var(--quiz-secundario);
  border-radius: 12px;
  font-size: 0.8rem;
  line-height: 1.65;
}
.resultado-urgente {
  border-top: 4px solid var(--erro-borda, var(--quiz-destaque));
  padding-top: 1rem;
}
.acoes-resultado {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 1.3rem 0;
}
.revisao-respostas {
  margin-top: 1.6rem;
  border-top: 1px solid var(--quiz-borda);
  border-bottom: 1px solid var(--quiz-borda);
}
.revisao-respostas summary {
  padding: 1rem 0.2rem;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 650;
}
.revisao-respostas summary span {
  color: var(--quiz-secundario);
  font-weight: 400;
  font-size: 0.75rem;
  margin-left: 0.5rem;
}
.revisao-respostas ol {
  list-style: none;
  padding: 0;
  margin: 0;
}
.revisao-respostas li {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 0.9rem 0;
  border-top: 1px solid var(--quiz-borda);
}
.revisao-respostas h3 {
  color: var(--quiz-texto);
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.5;
}
.revisao-respostas li p {
  color: var(--quiz-secundario);
  margin: 0.35rem 0 0;
  font-size: 0.8rem;
  line-height: 1.55;
}
.voltar-respostas {
  margin-top: 0.7rem;
}
.pergunta-enter-active,
.pergunta-leave-active {
  transition:
    opacity 0.12s ease,
    transform 0.12s ease;
}
.pergunta-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.pergunta-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
@media (hover: hover) {
  .opcao-quiz:hover {
    border-color: var(--quiz-destaque);
    background: var(--quiz-suave);
  }
  .opcao-quiz.selecionada:hover {
    background: var(--quiz-selecao);
  }
  .botao-principal:hover {
    background: var(--acai-hover, var(--quiz-destaque));
  }
  .botao-secundario:not(:disabled):hover {
    background: var(--quiz-suave);
  }
}
@media (max-width: 600px) {
  .calculadora-riscos {
    margin: 1rem auto;
  }
  .quiz-cartao {
    border-radius: 18px;
    padding: 1.1rem;
  }
  .opcoes-curtas {
    grid-template-columns: minmax(0, 1fr);
  }
  .opcao-quiz {
    min-height: 62px;
    padding: 0.85rem;
    font-size: 0.88rem;
  }
  .tipo-pergunta {
    font-size: 0.65rem;
  }
  .controles-quiz .botao-principal {
    flex: 1;
    padding-inline: 0.8rem;
  }
  .controles-quiz .botao-secundario {
    padding-inline: 0.8rem;
  }
  .acoes-resultado {
    flex-direction: column;
  }
  .acoes-resultado button {
    width: 100%;
  }
  .revisao-respostas summary span {
    display: block;
    margin: 0.35rem 0 0 1rem;
  }
}
@media (max-width: 360px) {
  .tipo-pergunta {
    margin-left: 0;
  }
  .controles-quiz {
    flex-direction: column-reverse;
  }
}
@media (prefers-reduced-motion: reduce) {
  .calculadora-riscos *,
  .calculadora-riscos *::before,
  .calculadora-riscos *::after {
    transition: none !important;
    animation: none !important;
    scroll-behavior: auto !important;
  }
}
</style>
