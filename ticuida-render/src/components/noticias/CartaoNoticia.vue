<script setup>
import { computed, ref, watch } from "vue";
import { formatarData, linkSeguro } from "../../utilitarios/formatacao.js";
const props = defineProps({ noticia: { type: Object, required: true } });
const imagemFalhou = ref(false);
const endereco = computed(() => linkSeguro(props.noticia.url));
const imagem = computed(() => {
  const valor = props.noticia.imagem;
  if (typeof valor !== "string") return "";
  return valor.startsWith("/") && !valor.startsWith("//") ? valor : linkSeguro(valor);
});
const fonte = computed(() => {
  if (props.noticia.fonte) return props.noticia.fonte;
  try { return new URL(endereco.value).hostname.replace(/^www\./, ""); }
  catch { return "Fonte não informada"; }
});
watch(imagem, () => { imagemFalhou.value = false; });
</script>
<template>
  <article class="cartao noticia">
    <component :is="endereco ? 'a' : 'div'" :href="endereco || undefined" class="conteudo-noticia">
      <img v-if="imagem && !imagemFalhou" :src="imagem" alt="" loading="lazy" @error="imagemFalhou = true" />
      <div v-else class="imagem-alternativa" aria-hidden="true"><span>✳</span>Ti cuida.</div>
      <div class="texto-noticia">
        <div class="metadados"><span class="etiqueta">{{ noticia.categoria }}</span><small v-if="noticia.data">{{ formatarData(noticia.data) }}</small></div>
        <h3>{{ noticia.titulo }}</h3>
        <p>{{ noticia.resumo }}</p>
        <span class="fonte">Fonte: {{ fonte }} <span v-if="endereco" aria-hidden="true">↗</span></span>
        <small v-if="!endereco">Link da fonte indisponível</small>
      </div>
    </component>
  </article>
</template>
<style scoped>
.noticia { padding: 0; margin: 0; overflow: hidden; min-width: 0; background: var(--superficie); border: 1px solid var(--borda); border-radius: 1rem; }
.conteudo-noticia { display: block; height: 100%; color: var(--texto); text-decoration: none; }
a.conteudo-noticia:hover { background: var(--superficie-hover, var(--superficie-suave)); }
a.conteudo-noticia:focus-visible { outline: 3px solid var(--foco, var(--acai)); outline-offset: -4px; border-radius: 1rem; }
img, .imagem-alternativa { width: 100%; height: 155px; object-fit: cover; }
.imagem-alternativa { display: flex; align-items: center; justify-content: center; gap: .75rem; background: var(--lavanda); color: var(--acai-escuro); font-size: 1.35rem; font-weight: 700; }
.imagem-alternativa span { font-size: 3rem; }
.texto-noticia { padding: 1rem; overflow-wrap: anywhere; }
.metadados { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; justify-content: space-between; }
h3 { font-size: 1.1rem; margin: .7rem 0; line-height: 1.4; }
p { font-size: .9rem; line-height: 1.6; margin: .6rem 0 1rem; color: var(--texto-secundario, var(--suave)); }
.fonte { font-size: .8rem; font-weight: 600; }
small { display: block; font-size: .75rem; color: var(--texto-secundario, var(--suave)); }
</style>
