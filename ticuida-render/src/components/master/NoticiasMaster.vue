<script setup>
import { onMounted, reactive, ref } from "vue";
import { requisitar } from "../servicos/apiMaster.js";

const vazia = () => ({
  titulo: "",
  resumo: "",
  fonte: "",
  url: "",
  imagem: "",
  categoria: "",
  status: "rascunho",
});
const form = reactive(vazia());
const noticiaEditada = ref(null);
const pagina = ref(1);
const resultado = ref(null);
const carregando = ref(false);
const erro = ref("");
const mensagem = ref("");

async function carregar() {
  carregando.value = true;
  erro.value = "";
  try {
    resultado.value = await requisitar(`/master/noticias?pagina=${pagina.value}`);
  } catch (e) {
    erro.value = e.message;
  } finally {
    carregando.value = false;
  }
}

function editar(noticia) {
  noticiaEditada.value = noticia;
  Object.assign(form, {
    titulo: noticia.titulo,
    resumo: noticia.resumo,
    fonte: noticia.fonte,
    url: noticia.url,
    imagem: noticia.imagem || "",
    categoria: noticia.categoria,
    status: noticia.status,
  });
}

function limparFormulario() {
  noticiaEditada.value = null;
  Object.assign(form, vazia());
}

async function salvar() {
  erro.value = "";
  mensagem.value = "";
  const metodo = noticiaEditada.value ? "PUT" : "POST";
  const caminho = noticiaEditada.value
    ? `/master/noticias/${encodeURIComponent(noticiaEditada.value.id)}`
    : "/master/noticias";
  try {
    const resposta = await requisitar(caminho, metodo, {
      ...form,
      ...(noticiaEditada.value ? { revisao: noticiaEditada.value.revisao } : {}),
    });
    mensagem.value = resposta.mensagem;
    limparFormulario();
    await carregar();
  } catch (e) {
    erro.value = e.message;
  }
}

onMounted(carregar);
</script>

<template>
  <section aria-labelledby="titulo-noticias">
    <h2 id="titulo-noticias">Notícias</h2>
    <form class="master-card master-formulario" @submit.prevent="salvar">
      <h3>{{ noticiaEditada ? "Editar notícia" : "Cadastrar notícia" }}</h3>
      <label>
        Título
        <input v-model="form.titulo" required minlength="3" maxlength="160" />
      </label>
      <label>
        Resumo
        <textarea v-model="form.resumo" required minlength="10" maxlength="800" />
      </label>
      <div class="master-grade">
        <label>
          Fonte
          <input v-model="form.fonte" required minlength="2" maxlength="160" />
        </label>
        <label>
          Categoria
          <input
            v-model="form.categoria"
            required
            minlength="2"
            maxlength="60"
          />
        </label>
      </div>
      <label>
        URL da notícia
        <input v-model="form.url" type="url" required maxlength="1500" />
      </label>
      <label>
        URL da imagem (opcional)
        <input v-model="form.imagem" type="url" maxlength="1500" />
      </label>
      <label>
        Situação
        <select v-model="form.status">
          <option value="rascunho">Rascunho</option>
          <option value="publicada">Publicada</option>
        </select>
      </label>
      <div class="master-acoes">
        <button type="submit" :disabled="carregando">
          {{ noticiaEditada ? "Salvar alterações" : "Salvar notícia" }}
        </button>
        <button
          v-if="noticiaEditada"
          type="button"
          @click="limparFormulario"
        >
          Cancelar edição
        </button>
      </div>
    </form>
    <p v-if="erro" class="master-erro" role="alert">{{ erro }}</p>
    <p v-if="mensagem" class="master-sucesso" role="status">{{ mensagem }}</p>
    <p v-if="carregando" role="status">Carregando notícias…</p>
    <p v-else-if="resultado && !resultado.itens.length">Nenhuma notícia cadastrada.</p>
    <article
      v-for="noticia in resultado?.itens"
      :key="noticia.id"
      class="master-card"
    >
      <div class="master-linha">
        <div>
          <h3>{{ noticia.titulo }}</h3>
          <p>{{ noticia.status }} · {{ noticia.categoria }} · {{ noticia.fonte }}</p>
        </div>
        <button type="button" @click="editar(noticia)">Editar</button>
      </div>
    </article>
    <div v-if="resultado && resultado.paginas > 1" class="master-acoes">
      <button
        type="button"
        :disabled="pagina <= 1 || carregando"
        @click="pagina--; carregar()"
      >
        Anterior
      </button>
      <span>Página {{ resultado.pagina }} de {{ resultado.paginas }}</span>
      <button
        type="button"
        :disabled="pagina >= resultado.paginas || carregando"
        @click="pagina++; carregar()"
      >
        Próxima
      </button>
    </div>
  </section>
</template>
