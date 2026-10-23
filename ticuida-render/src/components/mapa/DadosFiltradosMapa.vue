<script setup>
defineProps({ resultado: Object, erro: String, carregando: Boolean, municipio: String, municipios: Array });
defineEmits(["tentar-novamente"]);
</script>
<template>
  <section class="dados" :aria-busy="carregando" aria-live="polite">
    <h4>Dados filtrados</h4>
    <div v-if="erro" role="alert"><p class="erro">{{ erro }}</p><button type="button" @click="$emit('tentar-novamente')">Tentar novamente</button></div>
        <p v-else-if="carregando" class="suave" role="status">
          Atualizando indicadores…
        </p>

        <template v-if="resultado && !carregando && !erro && resultado.totalRegistros > 0">
          <span class="etiqueta">CASOS REGISTRADOS</span>

          <div class="indicadores-mapa">
            <div class="indicador-mapa">
              <span>Total conforme filtros</span>
              <strong>{{ resultado.totalCasos.toLocaleString("pt-BR") }}</strong>
            </div>
            <div class="indicador-mapa">
              <span>Masculino</span>
              <strong>{{ resultado.totalMasculino.toLocaleString("pt-BR") }}</strong>
            </div>
            <div class="indicador-mapa">
              <span>Feminino</span>
              <strong>{{ resultado.totalFeminino.toLocaleString("pt-BR") }}</strong>
            </div>
          </div>

          <p
            v-if="
              municipio &&
              municipios.find(
                (municipio) => municipio.nome === municipio
              )?.status !== 'informado'
            "
            class="aviso"
          >
            Este valor está registrado sem localização municipal confirmada.
          </p>

          <p class="suave">
            Fonte: Ticuida_planilha_mestre_v002.xlsx ·
            {{ resultado.totalRegistros.toLocaleString("pt-BR") }}
            registros correspondentes
          </p>
        </template>
    <p v-if="!carregando && !erro && resultado?.totalRegistros === 0" class="suave">Não há registros para esta combinação de filtros.</p>
  </section>
</template>
<style scoped>
h4 { margin: .9rem 0 .6rem; }
.indicadores-mapa { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .5rem; margin-top: .5rem; }
.indicador-mapa { padding: .6rem; background: var(--superficie-suave); border-radius: .6rem; }
.indicador-mapa:first-child { grid-column: 1 / -1; }
.indicador-mapa span { display: block; font-size: .75rem; color: var(--texto-secundario, var(--suave)); }
.indicador-mapa strong { font-size: 1.3rem; color: var(--texto); }
.dados p { font-size: .78rem; overflow-wrap: anywhere; }
.dados .etiqueta { font-size: .65rem; }
</style>
