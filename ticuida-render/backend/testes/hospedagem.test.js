// Verifica a entrega web. O banco é simulado; não substitui a validação no Atlas.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {MemoryStore}=require('express-session');
const {criarAplicacao}=require('../app');
const criarRotasMapa=require('../rotas/mapa');
const db={databaseName:'teste',collection(){return {findOne:async()=>null,find(){return {sort(){return this},limit(){return this},toArray:async()=>[]}}};}};
test('Hospedagem: frontend, arquivos, API, mapa e cookie HTTPS',async()=>{
 process.env.NODE_ENV='production';process.env.SESSION_SECRET='segredo-de-teste-nao-utilizar-em-producao-123456789';process.env.TRUST_PROXY_HOPS='1';process.env.RENDER_EXTERNAL_URL='https://ticuida-teste.onrender.com';delete process.env.FRONTEND_ORIGINS;
 const sessionStore=new MemoryStore();const rotasMapa=await criarRotasMapa();const app=criarAplicacao({db,sessionStore,rotasMapa});const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
 try {
  let r=await fetch(base+'/');assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/html/);assert.match(await r.text(),/Ticuida/);assert.equal(r.headers.get('set-cookie'),null);
  r=await fetch(base+'/painel');assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/html/);
  for(const caminho of ['/api/inexistente','/assets/inexistente.js','/mapas/inexistente.geojson','/.env','/backend/.env']){r=await fetch(base+caminho);assert.equal(r.status,404,caminho);assert.match(r.headers.get('content-type'),/json/);}
  for(const arquivo of ['brasil-estados.geojson','para-municipios.geojson','estados.json','municipios-para.json']){r=await fetch(base+'/mapas/'+arquivo);assert.equal(r.status,200);assert(await r.json());}
  const asset=fs.readdirSync(path.resolve(__dirname,'../../dist/assets')).find(n=>n.endsWith('.js'));r=await fetch(base+'/assets/'+asset);assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/javascript/);
  r=await fetch(base+'/healthz');assert.equal(r.status,200);assert.deepEqual(await r.json(),{status:'ok'});
  r=await fetch(base+'/api/mapa/opcoes');assert.equal(r.status,200);assert((await r.json()).ufs.includes('PA'));
  r=await fetch(base+'/api/sessoes/atual');assert.equal(r.status,401);
  r=await fetch(base+'/api/csrf',{headers:{'X-Forwarded-Proto':'https',Origin:process.env.RENDER_EXTERNAL_URL}});assert.equal(r.status,200);const cookie=r.headers.get('set-cookie');assert.match(cookie,/HttpOnly/);assert.match(cookie,/Secure/);assert.match(cookie,/SameSite=Lax/);assert.equal(r.headers.get('access-control-allow-origin'),process.env.RENDER_EXTERNAL_URL);assert((await r.json()).token);
  assert.match(r.headers.get('content-security-policy'),/img-src 'self' data: https:/);
 }finally{await new Promise(r=>server.close(r));sessionStore.clear();}
});
