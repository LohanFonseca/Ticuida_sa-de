# Ticuida — publicar no Render com MongoDB Atlas

Este pacote reúne os dois ZIPs enviados e acrescenta a configuração de hospedagem. A aplicação Vue e a API Express serão servidas pelo mesmo endereço HTTPS. A planilha do mapa e os limites geográficos estão incluídos. Não contém seu `.env`, senhas, `node_modules` ou uma cópia do seu banco local.

## 1. Extraia e confira localmente

Extraia o ZIP em uma pasta nova. Abra essa pasta no VS Code. Na raiz devem aparecer `src`, `public`, `backend`, `package.json` e `render.yaml`.

No terminal, dentro dessa pasta:

```powershell
npm ci --include=dev
npm --prefix backend ci --omit=dev
npm run build
```

Para testar com seu MongoDB local, copie seu `.env` local anterior para `backend/.env`, somente no computador. Use `NODE_ENV=development`, `TRUST_PROXY_HOPS=0` e `FRONTEND_ORIGINS=http://localhost:3000,http://localhost:5173`. Mantenha sua conexão e segredo locais.

Pare o backend antigo para liberar a porta 3000. Na raiz do projeto novo, execute:

```powershell
npm start
```

Abra `http://localhost:3000`. Esse endereço passa a oferecer a aplicação inteira, inclusive `/api`. Não precisa manter `npm run dev` aberto para este teste. Para continuar desenvolvendo, o comando `npm run dev` continua disponível.

## 2. Crie o MongoDB Atlas gratuito

1. Acesse https://www.mongodb.com/cloud/atlas e entre ou crie sua conta.
2. Crie um projeto e um cluster do tipo **Free**. Não selecione Flex ou um cluster pago.
3. Crie um usuário de banco para a aplicação, com permissão de leitura e escrita no banco `ticuida`. Esse usuário é diferente da sua conta de acesso ao site Atlas.
4. Em **Connect → Drivers**, obtenha a conexão `mongodb+srv://...` e preencha suas credenciais conforme a orientação do Atlas. Guarde essa conexão de forma privada.
5. A permissão de rede será completada na etapa 4, com os endereços de saída do Render. Para acessar pelo Compass ou pelo seu computador, autorize também seu IP atual.

Se já usa Atlas, pode reutilizar o cluster existente se houver capacidade e se ele estiver no plano desejado.

Criar o cluster não copia seus dados locais. Você tem duas opções:

- Começar com banco vazio: cadastrar contas de demonstração e publicar as notícias novamente.
- Preservar o banco local: migrar as coleções com MongoDB Database Tools (`mongodump` e `mongorestore`) ou um procedimento equivalente que preserve os tipos BSON, sobretudo ObjectId, datas e vínculos. Não exporte os registros relacionados como CSV para essa migração. Faça backup antes e não use opções de remoção de coleções em um banco que já tenha dados que deseja preservar. As sessões antigas não precisam ser migradas; as pessoas poderão entrar novamente.

## 3. Coloque os arquivos no GitHub

Crie um repositório, preferencialmente privado, e envie o conteúdo da pasta extraída. `render.yaml` e o `package.json` do frontend devem ficar na raiz do repositório, não dentro de outra pasta adicional.

Pode usar GitHub Desktop para facilitar. Se preferir o terminal:

```powershell
git init
git add .
git status
```

Confira que `.env`, `node_modules` e `dist` não aparecem entre os arquivos a enviar. O `.gitignore` incluído já os ignora. Depois:

```powershell
git commit -m "Preparar Ticuida para hospedagem"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
git push -u origin main
```

Substitua a URL pela do seu repositório. Não envie o ZIP ao repositório como substituto do código: envie os arquivos extraídos. `backend/.env.example` é apenas um modelo e pode ser versionado; `backend/.env` deve ficar privado.

## 4. Publique no Render usando o arquivo pronto

1. Acesse https://render.com e conecte sua conta GitHub.
2. No painel, escolha **New → Blueprint**.
3. Selecione o repositório do Ticuida e a branch `main`.
4. O Render lerá `render.yaml`. Confira que o serviço usa o plano **Free**.
5. No campo `MONGODB_URI`, informe a conexão privada do Atlas. O segredo de sessão será gerado pelo Render automaticamente.
6. Crie o serviço. Abra **Connect → Outbound** no serviço e copie todos os intervalos de IP indicados.
7. No Atlas, adicione esses intervalos à lista de acesso de rede do banco. Se a primeira tentativa de implantação falhar antes dessa autorização, use **Manual Deploy → Deploy latest commit** depois de autorizar.
8. Aguarde a implantação terminar e abra a URL HTTPS `https://...onrender.com` exibida pelo Render.

O Blueprint configura:

| Campo | Valor |
|---|---|
| Build Command | `npm ci --include=dev && npm run build && npm --prefix backend ci --omit=dev` |
| Start Command | `npm start` |
| Health Check | `/healthz` |
| NODE_VERSION | `24.19.0` |
| NODE_ENV | `production` |
| MONGODB_DB | `ticuida` |
| TRUST_PROXY_HOPS | `1` |
| SESSION_SECRET | Gerado automaticamente |
| MONGODB_URI | Informado por você, somente no servidor |

A URL padrão do Render é reconhecida pelo backend através de `RENDER_EXTERNAL_URL`. Não configure `FRONTEND_ORIGINS` com localhost no Render. Para um domínio próprio futuro, defina `FRONTEND_ORIGINS` com a origem HTTPS exata, sem caminho e sem barra no final; várias origens podem ser separadas por vírgulas.

Não configure `VITE_API_URL` para localhost. O frontend usa `/api` no mesmo endereço da aplicação. O Render fornece `PORT` automaticamente.

Alternativa: se criar **New → Web Service** manualmente, use os mesmos valores da tabela, deixe **Root Directory** vazio e crie você mesmo um `SESSION_SECRET` aleatório. O arquivo Blueprint só gera esse segredo automaticamente quando a implantação é feita por Blueprint.

## 5. Ative sua conta Master

Se você migrou uma conta que já era Master, basta entrar novamente. Se o banco estiver vazio:

1. Cadastre sua conta no endereço publicado.
2. No computador, configure um `.env` privado em `backend` apontando para o mesmo Atlas e banco `ticuida`. Autorize seu IP no Atlas.
3. Abra um terminal dentro de `backend` e execute:

```powershell
node scripts/definirPerfil.js "SEU-EMAIL-CADASTRADO" master
```

4. Saia da aplicação publicada e entre novamente.

O comando usa as credenciais de banco do seu `.env` local; você não precisa habilitar uma rota pública para promover usuários. Não envie esse `.env` para o GitHub nem para o chat.

## 6. Confira antes da apresentação

- Abra a página e entre como visitante; confira o mapa e os filtros do Pará.
- Cadastre uma conta fictícia, entre, saia e entre novamente.
- Com essa conta, crie um registro de vacinação fictício e confira que ele permanece após sair/entrar.
- Entre como Master, publique uma notícia e confira sua exibição como visitante.
- Confira as permissões de paciente e profissional com contas separadas.
- Abra `/healthz`: deve responder `{"status":"ok"}`. Esse endpoint indica que o processo iniciou; não verifica a conexão do banco a cada chamada.

A base real de estabelecimentos de atendimento ainda não foi incorporada: o código recebido tem a lista de serviços vazia. Esta preparação mantém esse estado; publicar o projeto não preenche a lista automaticamente.

## 7. Limites do plano gratuito

O Render gratuito entra em repouso após 15 minutos de inatividade, e o primeiro acesso seguinte pode levar cerca de um minuto. Abra o projeto antes da apresentação. Existem limites de uso mensais; a opção gratuita não garante operação contínua para produção.

Os dados gravados pelo usuário ficam no Atlas. O disco do Render gratuito é temporário. A planilha epidemiológica e os arquivos do mapa são incluídos no código e reaparecem a cada implantação. Não use esse disco para guardar novos uploads que precisem persistir.

O painel de notícias atual usa URLs de imagens. Imagens externas devem funcionar por HTTPS; o navegador pode bloquear imagens HTTP em uma página HTTPS.

## Alterações feitas e validação

- Reunião das pastas complementares nos caminhos corretos de `backend` e `public`.
- Express entrega o `dist` e mantém as rotas `/api` separadas do retorno de HTML.
- Rotas inexistentes da API e arquivos estáticos inexistentes retornam 404.
- Origem do Render reconhecida automaticamente, mantendo validação de origem e CSRF.
- Cookies seguros em produção, atrás do proxy configurado.
- Política de conteúdo permite imagens externas HTTPS sem desabilitar o Helmet.
- `.env` local carregado a partir do backend, inclusive quando `npm start` roda na raiz.
- Correção dos imports em `InicializarSessao.vue` e `AutorizarProfissionais.vue` para o `src/dados.js` existente.
- DevTools do Vue restrito ao modo de desenvolvimento; título da página e idioma ajustados.
- Inclusão de `.gitignore`, modelo de variáveis, teste de hospedagem e `render.yaml`.

Instalação com os lockfiles e compilação de produção passaram. Testes HTTP verificaram o frontend, arquivos geográficos, rotas do mapa, erros 404, cabeçalhos de segurança e emissão do cookie HTTPS. O navegador abriu o frontend servido pelo Express, entrou como visitante e carregou o mapa sem erros JavaScript. Os testes usaram armazenamento de usuários simulado: não houve conexão ao seu Atlas nem implantação na sua conta Render.

Para repetir os testes de hospedagem, depois de instalar dependências e executar `npm run build`:

```powershell
node --test backend/testes/hospedagem.test.js
```

## Fontes de configuração

- https://render.com/docs/blueprint-spec
- https://render.com/docs/environment-variables
- https://render.com/docs/free
- https://render.com/docs/connect-to-mongodb-atlas
- https://helmet.js.org/
