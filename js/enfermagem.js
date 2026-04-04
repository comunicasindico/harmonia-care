/* ====================================================005 – ABRIR PAINEL MEDICAÇÃO==================================================== */
async function abrirPainelMedicacao(){await carregarPacientesMedicacao();await carregarStatusMedicacoes();await carregarMedicacoes()}
/* ====================================================020 – CORES POR USUÁRIO==================================================== */
function obterCorUsuario(nome){if(!nome)return"#64748b";let hash=0;for(let i=0;i<nome.length;i++){hash=nome.charCodeAt(i)+((hash<<5)-hash)}let cor="#";for(let i=0;i<3;i++){let value=(hash>>(i*8))&255;cor+=("00"+value.toString(16)).slice(-2)}return cor}
/* ====================================================020A – USUARIO LOGADO==================================================== */
function obterUsuarioLogado(){let id=localStorage.getItem("usuario_id");let nome=localStorage.getItem("usuario_nome");let hierarquia=localStorage.getItem("usuario_hierarquia");let perfil=(localStorage.getItem("usuario_perfil")||"admin").toLowerCase();if(!nome||nome==="null"||nome==="")nome="Administrador";if(!hierarquia||hierarquia==="null"){hierarquia="1";localStorage.setItem("usuario_hierarquia","1")}return{id:id||null,nome:nome,hierarquia:Number(hierarquia),perfil:perfil}}
/* ====================================================020C – DATA==================================================== */
window.obterDataSelecionada=function(){const d=document.getElementById("dataInicio")?.value;if(d&&d.includes("/")){const[a,b,c]=d.split("/");return`${c}-${b.padStart(2,"0")}-${a.padStart(2,"0")}`}return d||new Date().toISOString().slice(0,10)}
/* ====================================================021B – TURNO==================================================== */
async function mudarTurno(turno){TURNO_ATUAL=turno;localStorage.setItem("turno_atual",turno);["btnManha","btnTarde","btnNoite"].forEach(id=>document.getElementById(id)?.classList.remove("turno-ativo"));if(turno==="manha")document.getElementById("btnManha")?.classList.add("turno-ativo");if(turno==="tarde")document.getElementById("btnTarde")?.classList.add("turno-ativo");if(turno==="noite")document.getElementById("btnNoite")?.classList.add("turno-ativo");await carregarRotinas();if(typeof montarGradePeriodo==="function")await montarGradePeriodo()}
/* ====================================================022 – CARREGAR PACIENTES BUSCA (CORRIGIDO DEFINITIVO)==================================================== */
async function carregarPacientesBusca(){
if(!db)return
const s=document.getElementById("buscaPaciente")
if(!s)return
try{
let usuarioId=localStorage.getItem("usuario_id")||PROFISSIONAL_ID||null
let pacientes=[]
if(usuarioId&&usuarioId!=="admin"){
const{data:rel}=await db.from("pacientes_profissionais").select("paciente_id").eq("usuario_id",usuarioId).eq("ativo",true)
const ids=rel?rel.map(function(r){return r.paciente_id}):[]
if(ids.length){
const{data}=await db.from("pacientes").select("id,nome_completo").in("id",ids).eq("empresa_id",EMPRESA_ID).eq("ativo",true).order("nome_completo",{ascending:true})
pacientes=data||[]
}else{
s.innerHTML='<option value="todos">SEM PACIENTES</option>'
return
}
}else{
const{data}=await db.from("pacientes").select("id,nome_completo").eq("empresa_id",EMPRESA_ID).eq("ativo",true).order("nome_completo",{ascending:true})
pacientes=data||[]
}
let html='<option value="todos">TODOS</option>'
for(let i=0;i<pacientes.length;i++){
let p=pacientes[i]
html+=`<option value="${p.id}">${p.nome_completo}</option>`
}
s.innerHTML=html
s.value="todos"
}catch(e){
console.error("Erro geral pacientes:",e)
}
}
/* ====================================================023 – CARREGAR ROTINAS==================================================== */
async function carregarRotinas(){if(!db||!EMPRESA_ID)return;const turno=(TURNO_ATUAL||"manha").toLowerCase();const dataHoje=obterDataSelecionada();const{data:pacs}=await db.from("pacientes").select("*").eq("empresa_id",EMPRESA_ID).eq("ativo",true);const{data:rotinas}=await db.from("rotina_modelos").select("*").eq("empresa_id",EMPRESA_ID).eq("ativo",true);const{data:exec}=await db.from("rotinas_execucao").select("*").eq("data",dataHoje).eq("turno",turno);const mapa=new Map();(exec||[]).forEach(e=>mapa.set(`${e.paciente_id}_${e.rotina_id}`,e));let lista=[];(pacs||[]).forEach(p=>{(rotinas||[]).filter(r=>!r.turno||r.turno===turno).forEach(r=>{let e=mapa.get(`${p.id}_${r.id}`);lista.push({paciente_id:p.id,rotina_id:r.id,paciente:p.nome_completo,rotina:r.nome,turno:r.turno||turno,status:e&&e.status==="executado"?"executado":"pendente",profissional_nome:e?.profissional_nome||""})})});ROTINAS_CACHE=lista;garantirContainerAcoesRotinas();renderizarRotinas(lista);renderizarBotoesRotinas();calcularIndicadores(lista)}
/* ====================================================024 – RENDER==================================================== */
function renderizarRotinas(lista){
const t=document.getElementById("rotinas");if(!t)return
let html=""
const map={}
lista.forEach(r=>{if(!map[r.paciente_id])map[r.paciente_id]={nome:r.paciente,rotinas:[]};map[r.paciente_id].rotinas.push(r)})
Object.keys(map).forEach(pid=>{
const p=map[pid]
let total=p.rotinas.length
let executadas=p.rotinas.filter(r=>(r.status||"")==="executado").length
let manha="",tarde="",noite=""
p.rotinas.forEach(r=>{
let turno=(r.turno||"").toLowerCase()
let classe="rotina-pendente"
if(r.status==="executado"){
if(turno==="manha")classe="rotina-ok-manha"
else if(turno==="tarde")classe="rotina-ok-tarde"
else if(turno==="noite")classe="rotina-ok-noite"
}
let nomeProf=r.profissional_nome||""
let corProf="#64748b"
if(r.status==="executado"&&nomeProf)corProf=obterCorUsuario(nomeProf)
let prof=r.status==="executado"&&nomeProf?` <span style="color:${corProf};font-weight:bold">✔ ${nomeProf}</span>`:""
let el=`<div class="badge-rotina ${classe}" data-paciente="${r.paciente_id}" data-rotina="${r.rotina_id}" style="margin:3px">${r.rotina}${prof}</div>`
if(turno==="manha")manha+=el
else if(turno==="tarde")tarde+=el
else if(turno==="noite")noite+=el
})
let perc=total?Math.round((executadas/total)*100):0
let ok=executadas===total
html+=`<tr style="height:32px"><td style="font-size:12px;font-weight:600">${p.nome}</td><td style="font-size:11px"><b>${perc}% (${executadas}/${total})</b><br><button onclick="executarTodos('${pid}')" style="margin-top:3px;background:${ok?"#2ecc71":"#3498db"};color:#fff;border:none;border-radius:6px;padding:2px 6px;font-size:10px;cursor:pointer">${ok?"✔":"Concluir"}</button></td><td style="font-size:11px"><div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">${manha}${tarde}${noite}</div></td></tr>`
})
t.innerHTML=html
document.querySelectorAll(".badge-rotina").forEach(el=>{
el.onclick=function(){
const p=this.dataset.paciente
const r=this.dataset.rotina
const executado=this.classList.contains("rotina-ok-manha")||this.classList.contains("rotina-ok-tarde")||this.classList.contains("rotina-ok-noite")
if(executado){desfazerRotina(p,r)}else{executarRotina(p,r,this)}
}
})
}
/* ====================================================024B – EXECUTAR ROTINA==================================================== */
async function executarRotina(pacienteId,rotinaId,botao){if(!db)return;const d=obterDataSelecionada();const t=(TURNO_ATUAL||"manha");const user=obterUsuarioLogado();if(botao){botao.style.opacity="0.6";botao.style.pointerEvents="none";setTimeout(()=>{botao.style.opacity="1";botao.style.pointerEvents="auto"},600)}const{data:existe}=await db.from("rotinas_execucao").select("status").eq("paciente_id",pacienteId).eq("rotina_id",rotinaId).eq("data",d).eq("turno",t).maybeSingle();if(existe?.status==="executado")return;await db.from("rotinas_execucao").upsert({paciente_id:pacienteId,rotina_id:rotinaId,data:d,turno:t,status:"executado",profissional_nome:user.nome,empresa_id:EMPRESA_ID},{onConflict:"paciente_id,rotina_id,data,turno"});ROTINAS_CACHE.forEach(r=>{if(r.paciente_id==pacienteId&&r.rotina_id==rotinaId)r.status="executado"});renderizarRotinas(ROTINAS_CACHE);calcularIndicadores(ROTINAS_CACHE)}
/* ====================================================025A – BOTÕES==================================================== */
function renderizarBotoesRotinas(){const div=document.getElementById("acoesRotinas");if(!div)return;const turno=(TURNO_ATUAL||"manha");let html="";const unicas={};ROTINAS_CACHE.forEach(r=>{if(r.turno!==turno)return;unicas[r.rotina_id]=r.rotina});Object.keys(unicas).forEach(id=>html+=`<button onclick="executarRotinaTodos('${id}')">✔ ${unicas[id]}</button>`);div.innerHTML=html}
/* ====================================================027 – INDICADORES==================================================== */
function calcularIndicadores(lista){let e=0,p=0;lista.forEach(r=>r.status==="executado"?e++:p++);document.getElementById("indicadorExecutado")?.innerText=e;document.getElementById("indicadorPendente")?.innerText=p}
/* ====================================================028 – EXECUTAR TODOS==================================================== */
async function executarTodos(pid){const d=obterDataSelecionada();const t=TURNO_ATUAL;const user=obterUsuarioLogado();let inserts=ROTINAS_CACHE.filter(r=>r.paciente_id==pid&&r.turno==t).map(r=>({paciente_id:r.paciente_id,rotina_id:r.rotina_id,data:d,turno:t,status:"executado",profissional_nome:user.nome,empresa_id:EMPRESA_ID}));await db.from("rotinas_execucao").upsert(inserts,{onConflict:"paciente_id,rotina_id,data,turno"});ROTINAS_CACHE.forEach(r=>{if(r.paciente_id==pid&&r.turno==t)r.status="executado"});renderizarRotinas(ROTINAS_CACHE);calcularIndicadores(ROTINAS_CACHE)}
/* ====================================================029 – EXECUTAR ROTINA TODOS==================================================== */
async function executarRotinaTodos(rotinaId){const d=obterDataSelecionada();const t=TURNO_ATUAL;const user=obterUsuarioLogado();let pendentes=ROTINAS_CACHE.filter(r=>r.rotina_id==rotinaId&&r.turno==t&&r.status!="executado");let inserts=pendentes.map(r=>({paciente_id:r.paciente_id,rotina_id:r.rotina_id,data:d,turno:t,status:"executado",profissional_nome:user.nome,empresa_id:EMPRESA_ID}));await db.from("rotinas_execucao").upsert(inserts,{onConflict:"paciente_id,rotina_id,data,turno"});pendentes.forEach(r=>r.status="executado");renderizarRotinas(ROTINAS_CACHE);calcularIndicadores(ROTINAS_CACHE)}
/* ====================================================031-043 – MANTIDOS==================================================== */
/* (mantive seu bloco original completo sem alteração pois já estava correto) */
/* ====================================================
030 – GERAR ROTINAS DO DIA (BLINDADO FINAL)
==================================================== */
async function gerarRotinasDoDia(){
if(!db||!EMPRESA_ID)return
if(window._gerandoRotinas)return
window._gerandoRotinas=true
try{
const dataRaw=document.getElementById("dataInicio")?.value
const hoje=dataRaw&&dataRaw.includes("/")?dataRaw.split("/").reverse().join("-"):(dataRaw||new Date().toISOString().slice(0,10))
const turno=TURNO_ATUAL||"manha"
const {data:pacientes,error:e1}=await db.from("pacientes").select("id").eq("empresa_id",EMPRESA_ID).eq("ativo",true)
if(e1||!pacientes?.length){console.error("Erro pacientes",e1);return}
const {data:rotinas,error:e2}=await db.from("rotina_modelos").select("id").eq("empresa_id",EMPRESA_ID).eq("ativo",true)
if(e2||!rotinas?.length){console.error("Erro rotinas",e2);return}
const {data:existentes}=await db.from("rotinas_execucao").select("paciente_id,rotina_id").eq("data",hoje).eq("turno",turno)
const mapa=new Set((existentes||[]).map(e=>`${e.paciente_id}_${e.rotina_id}`))
let lote=[]
for(const p of pacientes){
for(const r of rotinas){
const chave=`${p.id}_${r.id}`
if(mapa.has(chave))continue
lote.push({
paciente_id:p.id,
rotina_id:r.id,
data:hoje,
turno:turno,
status:"pendente",
empresa_id:EMPRESA_ID
})
}}
const TAM_LOTE=500
for(let i=0;i<lote.length;i+=TAM_LOTE){
const slice=lote.slice(i,i+TAM_LOTE)
const {error}=await db.from("rotinas_execucao").insert(slice)
if(error){console.error("Erro lote",i,error)}
}
}catch(err){
console.error("Erro geral gerarRotinasDoDia",err)
}finally{
window._gerandoRotinas=false
}
}
/* ====================================================
031 – SELECIONAR PACIENTE
==================================================== */
async function selecionarPaciente(){
await processarSelecaoPaciente()
}
/* ====================================================
032 – AO SELECIONAR PACIENTE
==================================================== */
async function aoSelecionarPaciente(){
await processarSelecaoPaciente()
}
/* ====================================================
033 – PROCESSAR SELEÇÃO DE PACIENTE
==================================================== */
async function processarSelecaoPaciente(){
const select=document.getElementById("buscaPaciente")
if(!select)return
const pacienteId=select.value
if(typeof carregarRotinas==="function")await carregarRotinas()
if(pacienteId!=="todos"){
if(typeof carregarDadosClinicosPaciente==="function")await carregarDadosClinicosPaciente(pacienteId)
if(typeof carregarClinico==="function")await carregarClinico(pacienteId)
}
}
/* ====================================================
034 – PESQUISAR ROTINAS
==================================================== */
async function pesquisarRotinas(){
await gerarRotinasDoDia()
await carregarRotinas()
const paciente=document.getElementById("buscaPaciente")?.value
if(paciente&&paciente!=="todos"){
if(typeof montarGradePeriodo==="function")await montarGradePeriodo()
}else{
const el=document.getElementById("gradePeriodo")
if(el)el.innerHTML=""
}
}
/* ====================================================
035 – NORMALIZAR DATA PARA ISO (SEM UTC BUG)
==================================================== */
function normalizarDataISO(v){
if(!v)return""
if(v.includes("/")){
const[d,m,a]=v.split("/")
return`${a}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`
}
return v
}
/* ====================================================
036 – GRADE REAL BASEADA NO BANCO (CORREÇÃO DEFINITIVA FINAL)
==================================================== */
async function montarGradePeriodo(){
if(!db)return
const pacienteId=document.getElementById("buscaPaciente")?.value
const dataInicio=normalizarDataISO(document.getElementById("dataInicio")?.value)
const dataFim=normalizarDataISO(document.getElementById("dataFim")?.value)
if(!pacienteId||pacienteId==="todos"){
document.getElementById("gradePeriodo").innerHTML=""
return
}
/* 🔥 BUSCA TODAS EXECUÇÕES (SEM FILTRO DE TURNO) */
const {data:execucoes,error}=await db
.from("rotinas_execucao")
.select("*,rotina_modelos(nome)")
.eq("paciente_id",pacienteId)
.gte("data",dataInicio)
.lte("data",dataFim)

if(error){console.error("Erro execuções",error);return}
/* 🔥 NORMALIZADOR PADRÃO */
function normalizar(txt){
return (txt||"")
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g,"")
.trim()
}
/* 🔥 ORDEM FIXA (PADRÃO SISTEMA INTEIRO) */
const ordemFixa=[
"Banho",
"Higiene (manhã)",
"Troca de Fraldas (manhã)",
"Oferta de Água",
"Café",
"Medicação",
"Almoço",
"Lanche",
"Higiene (tarde)",
"Jantar",
"Higiene (noite)",
"Troca de Fraldas (noite)"
]

/* 🔥 GERAR DIAS */
const dias=[]
let [anoI,mesI,diaI]=dataInicio.split("-")
let [anoF,mesF,diaF]=dataFim.split("-")
let atual=new Date(anoI,mesI-1,diaI)
const fim=new Date(anoF,mesF-1,diaF)

while(atual<=fim){
const y=atual.getFullYear()
const m=String(atual.getMonth()+1).padStart(2,"0")
const d=String(atual.getDate()).padStart(2,"0")
dias.push(`${y}-${m}-${d}`)
atual.setDate(atual.getDate()+1)
}

/* 🔥 MAPA EXECUÇÕES (PADRÃO PDF) */
const mapaExec=new Map()
execucoes?.forEach(r=>{
const nome=normalizar(r.rotina_modelos?.nome||"")
const chave=`${r.data}_${nome}`
mapaExec.set(chave,r.status)
})

/* 🔥 MONTAR MATRIZ COMPLETA */
let matriz={}
dias.forEach(dia=>{
matriz[dia]={}
ordemFixa.forEach(nome=>{
const nomeNorm=normalizar(nome)
const registros = execucoes.filter(e=>{
return e.data===dia && normalizar(e.rotina_modelos?.nome||"")===nomeNorm
})

if(registros.length===0){
matriz[dia][nomeNorm]="neutro"
}else{
const temExecutado = registros.some(r=>r.status==="executado")

if(temExecutado){
matriz[dia][nomeNorm]="executado"
}else{
matriz[dia][nomeNorm]="pendente"
}
}
})
})

/* 🔥 RENDER */
let html=`<div style="margin-top:20px"><b>Rotinas por período</b><table style="width:100%;border-collapse:collapse;font-size:12px">`

html+=`<tr style="background:#3498db;color:#fff"><th>Data</th>`
ordemFixa.forEach((_,i)=>{
html+=`<th style="text-align:center">${i+1}</th>`
})
html+=`</tr>`

dias.forEach((dia,index)=>{
const[dY,dM,dD]=dia.split("-")
const dataBR=`${dD}/${dM}/${dY}`

html+=`<tr ${index%2===0?'style="background:#f9fafb"':''}>`
html+=`<td><b>${dataBR}</b></td>`

ordemFixa.forEach(nome=>{
const status=matriz[dia][normalizar(nome)]

let celula=""
if(status==="executado"){
celula=`<span style="color:#27ae60;font-weight:bold">✔</span>`
}else if(status==="pendente"){
celula=`<span style="color:#e74c3c;font-weight:bold">✖</span>`
}else{
celula=`<span style="color:#bdc3c7;font-weight:bold">—</span>`
}

html+=`<td style="text-align:center">${celula}</td>`
})

html+=`</tr>`
})

html+=`</table>`

/* 🔥 LEGENDA */
html+=`<div style="margin-top:10px;font-size:11px">
<b>Legenda:</b><br>
1–Banho | 2–Hig.(manhã) | 3–Fraldas(manhã) | 4–Água<br>
5–Café | 6–Medicação | 7–Almoço | 8–Lanche<br>
9–Hig.(tarde) | 10–Jantar | 11–Hig.(noite) | 12–Fraldas(noite)
</div>`

html+=`</div>`

document.getElementById("gradePeriodo").innerHTML=html
}
/* ====================================================
037 – MOSTRAR PROGRESSO
==================================================== */
function mostrarProgresso(){
const container=document.getElementById("barraProgressoContainer")
const barra=document.getElementById("barraProgresso")

if(container)container.style.display="block"

if(barra){
barra.style.width="0%"
barra.style.background="red"
}
}
/* ====================================================
038 – ATUALIZAR PROGRESSO
==================================================== */
function atualizarProgresso(p){
const barra=document.getElementById("barraProgresso")
if(!barra)return

barra.style.width=p+"%"

/* 🔥 CORES DINÂMICAS */
if(p<60){
barra.style.background="red"
}else if(p<40){
barra.style.background="orange"
}else{
barra.style.background="green"
}
}
/* ====================================================
039 – ESCONDER PROGRESSO
==================================================== */
function esconderProgresso(){
setTimeout(()=>{
const container=document.getElementById("barraProgressoContainer")
if(container)container.style.display="none"
},800)
}
/* ====================================================
040 – BLOQUEAR TELA
==================================================== */
function bloquearTela(){
document.body.style.pointerEvents="none"
document.body.style.opacity="0.6"
}
/* ====================================================
041 – DESBLOQUEAR TELA
==================================================== */
function desbloquearTela(){
document.body.style.pointerEvents="auto"
document.body.style.opacity="1"
}
/* ====================================================
042 – PROTEÇÃO SAÍDA DURANTE SALVAMENTO
==================================================== */
window.addEventListener("beforeunload",function(e){
if(SALVANDO){
e.preventDefault()
e.returnValue="Aguarde concluir o salvamento"
}
})
/* ====================================================
043 – ANALISE CLINICA PACIENTE (BLINDADO)
==================================================== */
function gerarAnalisePaciente(p){
if(!p||!p.rotinas)return"Sem dados"
let total=p.rotinas.length
let executadas=p.rotinas.filter(r=>r.status==="executado").length
let percentual=total?Math.round((executadas/total)*100):0
let classificacao="Estável"
if(percentual<80)classificacao="Atenção"
if(percentual<60)classificacao="Crítico"
let comorb=[]
if(p.has)comorb.push("HAS")
if(p.dm)comorb.push("DM")
if(p.demencia)comorb.push("DEM")
if(p.cardiopatia)comorb.push("CARD")
if(p.acamado)comorb.push("ACAM")
let texto=`${classificacao} | Execução: ${percentual}%`
if(comorb.length)texto+=` | ${comorb.join(", ")}`
if(percentual<80)texto+=" | Atenção nas rotinas"
if(p.acamado)texto+=" | Prevenir LPP"
if(p.dm)texto+=" | Controle glicêmico"
if(p.has||p.cardiopatia)texto+=" | Monitorar PA"
return texto
}
/* ====================================================
026 – GARANTIR CONTAINER AÇÕES ROTINAS (ULTRA ROBUSTO)
==================================================== */
function garantirContainerAcoesRotinas(){
let div=document.getElementById("acoesRotinas")
if(div)return
const tbody=document.getElementById("rotinas")
if(!tbody)return
const table=tbody.parentElement
if(!table)return
div=document.createElement("div")
div.id="acoesRotinas"
div.style.marginBottom="8px"
div.style.display="flex"
div.style.flexWrap="wrap"
div.style.gap="6px"
/* 🔥 INSERE ANTES DA TABELA */
table.parentNode.insertBefore(div,table)
}
/* ====================================================999 – EXPORT==================================================== */
window.executarRotina=executarRotina;window.executarTodos=executarTodos;window.executarRotinaTodos=executarRotinaTodos
