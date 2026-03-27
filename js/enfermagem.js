/* ====================================================
015 – GERAR ROTINAS DO DIA
==================================================== */
async function gerarRotinasDoDia(){
if(!db||!EMPRESA_ID)return
if(window._gerandoRotinas)return
window._gerandoRotinas=true
try{
const dataRaw=document.getElementById("dataInicio")?.value
const hoje=dataRaw&&dataRaw.includes("/")?dataRaw.split("/").reverse().join("-"):(dataRaw||new Date().toISOString().slice(0,10))
const turno=TURNO_ATUAL||"manha"
const {data:pacientes}=await db.from("pacientes").select("id").eq("empresa_id",EMPRESA_ID).eq("ativo",true)
const {data:rotinas}=await db.from("rotina_modelos").select("id").eq("empresa_id",EMPRESA_ID).eq("ativo",true)
const {data:existentes}=await db.from("rotinas_execucao").select("paciente_id,rotina_id").eq("data",hoje).eq("turno",turno)
const mapa=new Set((existentes||[]).map(e=>`${e.paciente_id}_${e.rotina_id}`))
let lote=[]
for(const p of pacientes){
for(const r of rotinas){
const chave=`${p.id}_${r.id}`
if(mapa.has(chave))continue
lote.push({paciente_id:p.id,rotina_id:r.id,data:hoje,turno:turno,status:"pendente",empresa_id:EMPRESA_ID})
}}
if(lote.length){await db.from("rotinas_execucao").insert(lote)}
}catch(e){console.error("Erro gerarRotinasDoDia",e)}
finally{window._gerandoRotinas=false}
}

/* ====================================================
020 – CORES POR USUÁRIO
==================================================== */
function obterCorUsuario(nome){
if(!nome)return"#64748b"
let hash=0
for(let i=0;i<nome.length;i++){hash=nome.charCodeAt(i)+((hash<<5)-hash)}
let cor="#"
for(let i=0;i<3;i++){let value=(hash>>(i*8))&255;cor+=("00"+value.toString(16)).slice(-2)}
return cor
}

/* ====================================================
020A – USUARIO LOGADO (BLINDADO)
==================================================== */
function obterUsuarioLogado(){
let id=localStorage.getItem("usuario_id")
let nome=localStorage.getItem("usuario_nome")
let hierarquia=localStorage.getItem("usuario_hierarquia")
let perfil=(localStorage.getItem("usuario_perfil")||"admin").toLowerCase()
if(!nome||nome==="null"||nome==="")nome="Administrador"
if(!hierarquia||hierarquia==="null"){
hierarquia="1"
localStorage.setItem("usuario_hierarquia","1")
}
return{id:id||null,nome:nome,hierarquia:Number(hierarquia),perfil:perfil}
}
/* ====================================================
020C – DATA PADRONIZADA (CRÍTICO)
==================================================== */
window.obterDataSelecionada=function(){
const dataRaw=document.getElementById("dataInicio")?.value

if(dataRaw && dataRaw.includes("/")){
const [dia,mes,ano]=dataRaw.split("/")
return `${ano}-${mes.padStart(2,"0")}-${dia.padStart(2,"0")}`
}

return dataRaw || new Date().toISOString().slice(0,10)
}
/* ====================================================
023 – CARREGAR ROTINAS (CORRIGIDO DEFINITIVO)
==================================================== */
async function carregarRotinas(){
if(!db||!EMPRESA_ID)return

const turno=(TURNO_ATUAL||"manha").toLowerCase().trim()
const pacienteSelecionado=document.getElementById("buscaPaciente")?.value||"todos"

const dataRaw=document.getElementById("dataInicio")?.value
const dataHoje=dataRaw&&dataRaw.includes("/")?dataRaw.split("/").reverse().join("-"):(dataRaw||new Date().toISOString().slice(0,10))

let pacientes=[]
const {data:pacs}=await db.from("pacientes").select("*").eq("empresa_id",EMPRESA_ID).eq("ativo",true)
pacientes=pacs||[]

pacientes.sort((a,b)=>(a.nome_completo||"").localeCompare(b.nome_completo||"","pt-BR"))

if(pacienteSelecionado!=="todos"){
pacientes=pacientes.filter(p=>String(p.id)===String(pacienteSelecionado))
}

const {data:rotinas}=await db.from("rotina_modelos").select("*").eq("empresa_id",EMPRESA_ID).eq("ativo",true)

const rotinasTurno=(rotinas||[])
.filter(r=>!r.turno||r.turno===turno)
.sort((a,b)=>(a.ordem||99)-(b.ordem||99))

const {data:execucoes}=await db.from("rotinas_execucao").select("*").eq("data",dataHoje).eq("turno",turno)

const mapaExec=new Map()
;(execucoes||[]).forEach(e=>{
const chave=`${String(e.paciente_id)}_${String(e.rotina_id)}`
mapaExec.set(chave,e)
})

const lista=[]

for(const p of pacientes){
for(const r of rotinasTurno){

const chave=`${String(p.id)}_${String(r.id)}`
const exec=mapaExec.get(chave)

lista.push({
paciente_id:p.id,
rotina_id:r.id,
paciente:p.nome_completo,
rotina:r.nome,
ordem:r.ordem||99,

status:exec && exec.status==="executado"?"executado":"pendente",

profissional:exec && exec.status==="executado"
? (exec.profissional_nome || exec.usuario_nome || exec.executado_por || exec.usuario_id || "Administrador")
: "",

has:p.has,
dm:p.dm,
demencia:p.da,
cardiopatia:p.cardiopatia,
acamado:p.acamado,
pa:p.pressao_arterial
})
}}

lista.sort((a,b)=>{
const nomeA=(a.paciente||"").toLowerCase()
const nomeB=(b.paciente||"").toLowerCase()
if(nomeA<nomeB)return -1
if(nomeA>nomeB)return 1
return (a.ordem||99)-(b.ordem||99)
})

ROTINAS_CACHE=lista
renderizarRotinas(lista)
calcularIndicadores(lista)
}

/* ====================================================
024 – RENDERIZAR ROTINAS (CORRIGIDO)
==================================================== */
function renderizarRotinas(lista){
const tbody=document.getElementById("rotinas")
if(!tbody)return

let html=""
const pacientes={}

lista.forEach(r=>{
if(!pacientes[r.paciente_id]){
pacientes[r.paciente_id]={nome:r.paciente,rotinas:[]}
}
pacientes[r.paciente_id].rotinas.push(r)
})

Object.keys(pacientes).forEach(pid=>{
const p=pacientes[pid]

let rotinasHTML=""
p.rotinas.forEach(r=>{
let nomeProf=""
let corProf="#64748b"

if(r.status==="executado"){
if(r.profissional && String(r.profissional).trim()!==""){
nomeProf=r.profissional
corProf=obterCorUsuario(nomeProf)
}
}

rotinasHTML+=`
<div class="badge-rotina ${r.status==="executado"?"rotina-ok":"rotina-pendente"}"
data-paciente="${r.paciente_id}"
data-rotina="${r.rotina_id}">
${r.rotina}
${r.status==="executado"?`<span style="color:${corProf};font-weight:bold">✔ ${nomeProf}</span>`:""}
</div>`
})

html+=`<tr>
<td>${p.nome}</td>
<td><div>${rotinasHTML}</div></td>
</tr>`
})

tbody.innerHTML=html

setTimeout(()=>{
document.querySelectorAll(".badge-rotina").forEach(el=>{
el.addEventListener("click",function(){
const pacienteId=this.dataset.paciente
const rotinaId=this.dataset.rotina
const status=this.classList.contains("rotina-ok")?"executado":"pendente"

if(status==="executado"){
desfazerRotina(pacienteId,rotinaId,this)
}else{
executarRotina(pacienteId,rotinaId)
}
})
})
},100)
}

/* ====================================================
024B – EXECUTAR ROTINA (FINAL)
==================================================== */
async function executarRotina(pacienteId,rotinaId){
if(!db)return

const dataHoje=obterDataSelecionada()
const turno=(TURNO_ATUAL||"manha").toLowerCase().trim()

const user=obterUsuarioLogado()||{}

const usuarioId=user.id||null
const nomeProfissional=
user.nome||
localStorage.getItem("usuario_nome")||
"Administrador"

await db.from("rotinas_execucao").upsert({
paciente_id:pacienteId,
rotina_id:rotinaId,
data:dataHoje,
turno:turno,
status:"executado",
usuario_id:usuarioId,
profissional_nome:nomeProfissional||"Administrador",
empresa_id:EMPRESA_ID
},{onConflict:"paciente_id,rotina_id,data,turno"})

const item=ROTINAS_CACHE.find(r=>String(r.paciente_id)===String(pacienteId)&&String(r.rotina_id)===String(rotinaId))
if(item){
item.status="executado"
item.profissional=nomeProfissional||"Administrador"
}

renderizarRotinas(ROTINAS_CACHE)
}

/* ====================================================
028 – EXECUTAR TODOS (FINAL)
==================================================== */
async function executarTodos(pacienteId){
if(!db||!pacienteId)return

const dataHoje=obterDataSelecionada()
const turno=(TURNO_ATUAL||"manha").toLowerCase().trim()

const user=obterUsuarioLogado()
const usuarioId=user.id||null
const nomeProfissional=
user.nome||
localStorage.getItem("usuario_nome")||
"Administrador"

const rotinas=ROTINAS_CACHE.filter(r=>String(r.paciente_id)===String(pacienteId))

for(const r of rotinas){
if(r.status==="executado")continue

await db.from("rotinas_execucao").upsert({
paciente_id:r.paciente_id,
rotina_id:r.rotina_id,
data:dataHoje,
turno:turno,
status:"executado",
usuario_id:usuarioId,
profissional_nome:nomeProfissional||"Administrador",
empresa_id:EMPRESA_ID
},{onConflict:"paciente_id,rotina_id,data,turno"})

r.status="executado"
r.profissional=nomeProfissional||"Administrador"
}

renderizarRotinas(ROTINAS_CACHE)
}

/* ====================================================
029 – EXECUTAR ROTINA PARA TODOS (CORREÇÃO DEFINITIVA)
==================================================== */
async function executarRotinaTodos(rotinaId){

if(!db||!rotinaId)return

const dataHoje=obterDataSelecionada()
const turno=(TURNO_ATUAL||"manha").toLowerCase().trim()

const user=obterUsuarioLogado()||{}

/* 🔥 NOME BLINDADO */
const usuarioId=user.id||null
const nomeProfissional=
user.nome||
localStorage.getItem("usuario_nome")||
"Administrador"

const rotinas=ROTINAS_CACHE.filter(r=>String(r.rotina_id)===String(rotinaId))

for(const r of rotinas){

if(r.status==="executado")continue

const {error}=await db.from("rotinas_execucao").upsert({
paciente_id:r.paciente_id,
rotina_id:r.rotina_id,
data:dataHoje,
turno:turno,
status:"executado",
usuario_id:usuarioId,
profissional_nome:nomeProfissional||"Administrador",
empresa_id:EMPRESA_ID
},{
onConflict:"paciente_id,rotina_id,data,turno"
})

if(error){
console.error("Erro executarRotinaTodos:",error)
continue
}

/* 🔥 ATUALIZA CACHE CORRETAMENTE */
r.status="executado"
r.profissional=nomeProfissional||"Administrador"

}

/* 🔥 RENDER FINAL */
renderizarRotinas(ROTINAS_CACHE)
calcularIndicadores(ROTINAS_CACHE)

}
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
lote.push({paciente_id:p.id,rotina_id:r.id,data:hoje,turno:turno,status:"pendente"})
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
035 – NORMALIZAR DATA PARA ISO
==================================================== */
function normalizarDataISO(v){
if(!v)return new Date().toISOString().slice(0,10)
if(v.includes("/")){
const [d,m,a]=v.split("/")
return `${a}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`
}
return v
}
/* ====================================================
036 – GRADE REAL BASEADA NO BANCO (SIMPLES E CORRETA)
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
const {data:execucoes,error}=await db.from("rotinas_execucao").select("*").eq("paciente_id",pacienteId).gte("data",dataInicio).lte("data",dataFim)
if(error){console.error("Erro ao buscar execuções",error);return}
const mapa={}
execucoes.forEach(e=>{
if(!mapa[e.data])mapa[e.data]=[]
mapa[e.data].push(e)
})
const rotinasSet=new Set()
execucoes.forEach(e=>{rotinasSet.add(e.rotina_id)})
const rotinasIdsRaw=Array.from(rotinasSet)
const {data:rotinas}=await db.from("rotina_modelos").select("id,nome").in("id",rotinasIdsRaw)
const nomesRotinas={}
rotinas?.forEach(r=>{nomesRotinas[r.id]=r.nome})
const ordemFixa=["Banho","Higiene (manhã)","Troca de Fraldas (manhã)","Oferta de Água","Café","Medicação","Almoço","Lanche","Higiene (tarde)","Jantar","Higiene (noite)","Troca de Fraldas (noite)"]
const rotinasIds=rotinasIdsRaw.sort((a,b)=>ordemFixa.indexOf(nomesRotinas[a])-ordemFixa.indexOf(nomesRotinas[b]))
const dias=[]
let d=new Date(dataInicio+"T00:00:00")
const fim=new Date(dataFim+"T00:00:00")
while(d<=fim){
dias.push(d.toISOString().slice(0,10))
d.setDate(d.getDate()+1)
}
let html=`<div style="margin-top:20px"><b>Rotinas por período</b><table style="width:100%;border-collapse:collapse;font-size:12px">`
html+=`<tr style="background:#f1f1f1"><th>Data</th>`
rotinasIds.forEach(id=>{html+=`<th>${nomesRotinas[id]||id}</th>`})
html+=`</tr>`
dias.forEach(dia=>{
html+=`<tr><td><b>${new Date(dia+"T00:00:00").toLocaleDateString("pt-BR")}</b></td>`
rotinasIds.forEach(rid=>{
const lista=(mapa[dia]||[]).filter(e=>String(e.rotina_id)===String(rid))
const total=lista.length
const executadas=lista.filter(e=>e.status==="executado").length
let celula=""
if(total>0&&executadas===total){
celula=`<span title="Completo (${executadas}/${total})" style="color:#2ecc71;font-weight:bold">✔</span>`
}else if(executadas>0){
celula=`<span title="Parcial (${executadas}/${total})" style="color:#f39c12;font-weight:bold">⚠️</span>`
}else{
celula=`<span title="Não executado (0/${total})" style="color:#e74c3c;font-weight:bold">✖</span>`
}
html+=`<td style="text-align:center">${celula}</td>`
})
html+=`</tr>`
})
html+=`</table></div>`
document.getElementById("gradePeriodo").innerHTML=html
}
/* ====================================================
037 – MOSTRAR PROGRESSO
==================================================== */
function mostrarProgresso(){
const barra=document.getElementById("barraProgresso")
const interna=document.getElementById("barraInterna")
if(barra)barra.style.display="block"
if(interna)interna.style.width="0%"
}
/* ====================================================
038 – ATUALIZAR PROGRESSO
==================================================== */
function atualizarProgresso(p){
const interna=document.getElementById("barraInterna")
if(interna)interna.style.width=p+"%"
}
/* ====================================================
039 – ESCONDER PROGRESSO
==================================================== */
function esconderProgresso(){
const barra=document.getElementById("barraProgresso")
if(barra)barra.style.display="none"
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
999 – EXPORT
==================================================== */
window.executarRotina=executarRotina
window.executarTodos=executarTodos
window.executarRotinaTodos=executarRotinaTodos

