<script setup>
import { ref } from "vue";
import { estado, executar, encerrarSessao } from "../estado/ticuida";
import MenuMaster from "../components/master/MenuMaster.vue";
import VisaoGeralMaster from "../components/master/VisaoGeralMaster.vue";
import UsuariosMaster from "../components/master/UsuariosMaster.vue";
import ProfissionaisMaster from "../components/master/ProfissionaisMaster.vue";
import NoticiasMaster from "../components/master/NoticiasMaster.vue";
import HistoricoMaster from "../components/master/HistoricoMaster.vue";
import "../estilos/master.css";
const pagina = ref("inicio");
const componentes = {
  inicio: VisaoGeralMaster,
  usuarios: UsuariosMaster,
  profissionais: ProfissionaisMaster,
  noticias: NoticiasMaster,
  historico: HistoricoMaster,
};
</script>
<template>
  <div class="painel-master">
    <MenuMaster
      :pagina="pagina"
      :nome="estado.usuario.nome"
      @navegar="pagina = $event"
      @sair="executar(encerrarSessao)"
    />
    <main class="master-conteudo">
      <header>
        <span class="master-etiqueta">Painel Master</span>
        <h1>Cuidar também é organizar.</h1>
        <p>Acompanhe os acessos e mantenha a informação atualizada.</p>
      </header>
      <p v-if="estado.erro" class="master-erro" role="alert">
        {{ estado.erro }}
      </p>
      <component :is="componentes[pagina]" />
    </main>
  </div>
</template>
