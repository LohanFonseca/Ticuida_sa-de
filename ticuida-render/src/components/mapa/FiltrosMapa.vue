<script setup>
defineProps({ uf: String, municipio: String, ano: [String, Number], sexo: String, municipios: { type: Array, default: () => [] }, anos: { type: Array, default: () => [] } });
defineEmits(["update:uf", "update:municipio", "update:ano", "update:sexo"]);
</script>
<template>
  <fieldset class="filtros">
    <legend>Filtros</legend>
    <div class="campos">
      <label>Estado
        <select :value="uf" @change="$emit('update:uf', $event.target.value)">
          <option value="">Brasil — visão geral</option><option value="PA">Pará</option>
        </select>
      </label>
      <label>Município
        <select :value="municipio" :disabled="uf !== 'PA'" @change="$emit('update:municipio', $event.target.value)">
          <option value="">{{ uf === 'PA' ? 'Todos os municípios' : 'Selecione o Pará' }}</option>
          <option v-for="item in municipios" :key="item.id" :value="item.id">{{ item.nome }}{{ item.localizado ? '' : ' (sem localização confirmada)' }}</option>
        </select>
      </label>
      <label>Sexo
        <select :value="sexo" @change="$emit('update:sexo', $event.target.value)">
          <option value="Total">Total</option><option value="Masculino">Masculino</option><option value="Feminino">Feminino</option>
        </select>
      </label>
      <label>Ano
        <select :value="ano" @change="$emit('update:ano', $event.target.value)">
          <option value="">Todos os anos</option><option v-for="item in anos" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>
    </div>
  </fieldset>
</template>
<style scoped>
.filtros { border: 0; margin: 0 0 .8rem; padding: 0; min-width: 0; }
legend { font-weight: 700; margin-bottom: .6rem; }
.campos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .6rem; }
label { display: grid; gap: .3rem; min-width: 0; font-size: .8rem; }
label:nth-child(1), label:nth-child(2) { grid-column: 1 / -1; }
select { min-width: 0; width: 100%; padding: .55rem; color: var(--texto); background: var(--superficie-campo, var(--superficie)); border: 1px solid var(--borda); border-radius: .6rem; }
select:focus-visible { outline: 2px solid var(--foco, var(--acai)); outline-offset: 2px; }
select:disabled { opacity: .65; }
</style>
