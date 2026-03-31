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
021B – MUDAR TURNO (OBRIGATÓRIO)
==================================================== */
async function mudarTurno(turno){
TURNO_ATUAL=turno
localStorage.setItem("turno_atual",turno)
/* 🔥 BOTÕES VISUAIS */
const btnManha=document.getElementById("btnManha")
const btnTarde=document.getElementById("btnTarde")
const btnNoite=document.getElementById("btnNoite")

if(btnManha)btnManha.classList.remove("turno-ativo")
if(btnTarde)btnTarde.classList.remove("turno-ativo")
if(btnNoite)btnNoite.classList.remove("turno-ativo")

if(turno==="manha"&&btnManha)btnManha.classList.add("turno-ativo")
if(turno==="tarde"&&btnTarde)btnTarde.classList.add("turno-ativo")
if(turno==="noite"&&btnNoite)btnNoite.classList.add("turno-ativo")
/* 🔥 RECARREGA DADOS */
if(typeof carregarRotinas==="function")await carregarRotinas()
if(typeof montarGradePeriodo==="function")await montarGradePeriodo()
}
/* ====================================================
022 – CARREGAR PACIENTES BUSCA (CORRIGIDO SUPABASE V2)
==================================================== */
async function carregarPacientesBusca(){
if(!db)return
const select=document.getElementById("buscaPaciente")
if(!select)return
try{
let usuarioId=localStorage.getItem("usuario_id")||PROFISSIONAL_ID||null
let pacientes=[]
if(usuarioId && usuarioId!=="admin"){
const {data:rel}=await db
.from("pacientes_profissionais")
.select("paciente_id")
.eq("usuario_id",usuarioId)
.eq("ativo",true)
const ids=rel?.map(r=>r.paciente_id)||[]
if(ids.length){
const {data}=await db
.from("pacientes")
.select("id,nome_completo")
.in("id",ids)
.eq("empresa_id",EMPRESA_ID)
.eq("ativo",true)
.order("nome_completo",{ascending:true})
pacientes=data||[]
}else{
select.innerHTML='<option value="todos">SEM PACIENTES</option>'
return
}
}else{
const {data}=await db
.from("pacientes")
.select("id,nome_completo")
.eq("empresa_id",EMPRESA_ID)
.eq("ativo",true)
.order("nome_completo",{ascending:true})
pacientes=data||[]
}
let options='<option value="todos">TODOS</option>'
pacientes.forEach(p=>{
options+=`<option value="${p.id}">${p.nome_completo}</option>`
})
select.innerHTML=options
select.value="todos"
}catch(e){
console.error("Erro geral pacientes:",e)
}
}
/* ====================================================
023 – CARREGAR ROTINAS (CORRIGIDO COM VÍNCULO USUÁRIO)
==================================================== */
async function carregarRotinas(){
if(!db||!EMPRESA_ID)return
const turno=(TURNO_ATUAL||"manha").toLowerCase().trim()
const pacienteSelecionado=document.getElementById("buscaPaciente")?.value||"todos"
const dataHoje=obterDataSelecionada()
let usuarioId=localStorage.getItem("usuario_id")||PROFISSIONAL_ID||null
let pacientes=[]
if(usuarioId && usuarioId!=="admin"){
const {data:rel}=await db
.from("pacientes_profissionais")
.select("paciente_id")
.eq("usuario_id",usuarioId)
.eq("ativo",true)
const ids=rel?.map(r=>r.paciente_id)||[]
if(ids.length){
const {data:pacs}=await db
.from("pacientes")
.select("*")
.in("id",ids)
.eq("empresa_id",EMPRESA_ID)
.eq("ativo",true)
pacientes=pacs||[]
}else{
pacientes=[]
}
}else{
const {data:pacs}=await db
.from("pacientes")
.select("*")
.eq("empresa_id",EMPRESA_ID)
.eq("ativo",true)
pacientes=pacs||[]
}
pacientes.sort((a,b)=>(a.nome_completo||"").localeCompare(b.nome_completo||"","pt-BR"))
if(pacienteSelecionado!=="todos"){
pacientes=pacientes.filter(p=>String(p.id)===String(pacienteSelecionado))
}
const {data:rotinas}=await db
.from("rotina_modelos")
.select("*")
.eq("empresa_id",EMPRESA_ID)
.eq("ativo",true)
const rotinasTurno=(rotinas||[])
.filter(r=>!r.turno||r.turno===turno)
.sort((a,b)=>(a.ordem||99)-(b.ordem||99))
const {data:execucoes}=await db
.from("rotinas_execucao")
.select("*")
.eq("data",dataHoje)
.eq("turno",turno)
const mapaExec=new Map()
;(execucoes||[]).forEach(e=>{
const chave=`${e.paciente_id}_${e.rotina_id}`
mapaExec.set(chave,e)
})
const lista=[]
for(const p of pacientes){
for(const r of rotinasTurno){
const chave=`${p.id}_${r.id}`
const exec=mapaExec.get(chave)
lista.push({
paciente_id:p.id,
rotina_id:r.id,
paciente:p.nome_completo,
rotina:r.nome,
ordem:r.ordem||99,
turno:r.turno||turno,
status:exec&&exec.status==="executado"?"executado":"pendente",
profissional_nome:exec?exec.profissional_nome||"":"",
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
if(nomeA<nomeB)return-1
if(nomeA>nomeB)return 1
return(a.ordem||99)-(b.ordem||99)
})
ROTINAS_CACHE=lista
renderizarRotinas(lista)
calcularIndicadores(lista)
}
/* ====================================================
024 – RENDERIZAR ROTINAS (LAYOUT HOSPITAL LIMPO)
==================================================== */
function renderizarRotinas(lista){
const tbody=document.getElementById("rotinas")
if(!tbody)return
let html=""
const pacientes={}
lista.forEach(r=>{
if(!pacientes[r.paciente_id])pacientes[r.paciente_id]={nome:r.paciente,rotinas:[]}
pacientes[r.paciente_id].rotinas.push(r)
})

/* 🔥 ROTINAS ÚNICAS (CABEÇALHO) */
let rotinasUnicas={}
lista.forEach(r=>{
if(!rotinasUnicas[r.rotina_id]){
rotinasUnicas[r.rotina_id]={nome:r.rotina,turno:r.turno}
}
})

/* 🔥 HEADER PROFISSIONAL */
let headerHTML=`
<tr>
<td colspan="3" style="background:#f4f6f9;padding:6px 10px">
<div style="display:flex;justify-content:space-between;align-items:center">
<div style="font-weight:bold;color:#2c3e50">Ações por Rotina</div>
<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">
`

Object.keys(rotinasUnicas).forEach(rotinaId=>{
const r=rotinasUnicas[rotinaId]
let cor="#2ecc71"
if(r.turno==="tarde")cor="#f39c12"
if(r.turno==="noite")cor="#34495e"
headerHTML+=`
<button onclick="executarRotinaTodos('${rotinaId}')"
style="background:${cor};color:#fff;border:none;border-radius:6px;padding:4px 8px;font-size:11px;cursor:pointer">
✔ ${r.nome}
</button>
`
})

headerHTML+=`</div></div></td></tr>`

/* 🔥 LINHAS DOS PACIENTES */
Object.keys(pacientes).forEach(pid=>{
const p=pacientes[pid]
let rotinasHTML=""
let total=p.rotinas.length
let executadas=0

p.rotinas.forEach(r=>{
const status=(r.status||"pendente")
if(status==="executado")executadas++
let nomeProf=r.profissional_nome||r.profissional||""
let corProf="#64748b"
if(status==="executado"&&nomeProf)corProf=obterCorUsuario(nomeProf)

let classe="rotina-pendente"
if(status==="executado"){
if(r.turno==="manha")classe="rotina-ok-manha"
else if(r.turno==="tarde")classe="rotina-ok-tarde"
else if(r.turno==="noite")classe="rotina-ok-noite"
}

rotinasHTML+=`
<div class="badge-rotina ${classe}"
data-paciente="${r.paciente_id}"
data-rotina="${r.rotina_id}"
style="margin-bottom:3px">
${r.rotina}
${status==="executado"&&nomeProf?`<span style="color:${corProf};font-weight:bold"> ✔ ${nomeProf}</span>`:""}
</div>
`
})

let percentual=total?Math.round((executadas/total)*100):0
let concluido=executadas===total

html+=`
<tr>
<td>${p.nome}</td>
<td>
<b>${percentual}% (${executadas}/${total})</b><br>
<button onclick="executarTodos('${pid}')"
style="margin-top:4px;background:${concluido?"#2ecc71":"#3498db"};color:#fff;border:none;border-radius:6px;padding:3px 6px;font-size:11px;cursor:pointer">
${concluido?"✔ Concluído":"Concluir Todas"}
</button>
</td>
<td>${rotinasHTML}</td>
</tr>
`
})

tbody.innerHTML=headerHTML+html

document.querySelectorAll(".badge-rotina").forEach(el=>{
el.onclick=function(){
const pacienteId=this.dataset.paciente
const rotinaId=this.dataset.rotina
const executado=this.classList.contains("rotina-ok-manha")||this.classList.contains("rotina-ok-tarde")||this.classList.contains("rotina-ok-noite")
if(executado){
desfazerRotina(pacienteId,rotinaId)
}else{
executarRotina(pacienteId,rotinaId)
}
}
})
}
/* ====================================================
024B – EXECUTAR ROTINA (ANTI-SOBRESCRITA)
==================================================== */
async function executarRotina(pacienteId,rotinaId){
if(!db)return
const dataHoje=obterDataSelecionada()
const turno=(TURNO_ATUAL||"manha").toLowerCase().trim()
const user=obterUsuarioLogado()||{}
const usuarioId=user.id||null
const nome=user.nome||localStorage.getItem("usuario_nome")||"Administrador"
/* 🔒 VERIFICA SE JÁ EXISTE EXECUTADO */
const {data:existe}=await db.from("rotinas_execucao").select("status").eq("paciente_id",pacienteId).eq("rotina_id",rotinaId).eq("data",dataHoje).eq("turno",turno).maybeSingle()
if(existe&&existe.status==="executado")return
const {error}=await db.from("rotinas_execucao").upsert({
paciente_id:pacienteId,
rotina_id:rotinaId,
data:dataHoje,
turno:turno,
status:"executado",
usuario_id:usuarioId,
profissional_nome:nome,
empresa_id:EMPRESA_ID,
horario_executado:new Date().toISOString()
},{onConflict:"paciente_id,rotina_id,data,turno"})
if(error){console.error("Erro executarRotina:",error);return}
const item=ROTINAS_CACHE.find(r=>String(r.paciente_id)===String(pacienteId)&&String(r.rotina_id)===String(rotinaId)&&String((r.turno||"").toLowerCase())===turno)
if(item&&item.status!=="executado"){
item.status="executado"
item.profissional_nome=nome
}
renderizarRotinas(ROTINAS_CACHE)
calcularIndicadores(ROTINAS_CACHE)
}
/* ====================================================
027 – INDICADORES
==================================================== */
function calcularIndicadores(lista){
if(!Array.isArray(lista))return
let executado=0,pendente=0,atrasado=0

lista.forEach(r=>{
if(r.status==="executado")executado++
else if(r.status==="pendente")pendente++
else if(r.status==="atrasado")atrasado++
})

const e=document.getElementById("indicadorExecutado")
const p=document.getElementById("indicadorPendente")
const a=document.getElementById("indicadorAtrasado")

if(e)e.innerHTML="✔ "+executado
if(p)p.innerHTML="🔴 "+pendente
if(a)a.innerHTML="⚠ "+atrasado
}
/* ====================================================
028 – EXECUTAR TODOS (CORRIGIDO)
==================================================== */
async function executarTodos(pacienteId){
if(!db||!pacienteId)return
const dataHoje=obterDataSelecionada()
const turno=(TURNO_ATUAL||"manha").toLowerCase().trim()
const user=obterUsuarioLogado()||{}
const usuarioId=user.id||null
const nome=user.nome||localStorage.getItem("usuario_nome")||"Administrador"
const rotinas=ROTINAS_CACHE.filter(r=>String(r.paciente_id)===String(pacienteId)&&String((r.turno||"").toLowerCase())===turno)
const inserts=rotinas.filter(r=>r.status!=="executado").map(r=>({
paciente_id:r.paciente_id,
rotina_id:r.rotina_id,
data:dataHoje,
turno:turno,
status:"executado",
usuario_id:usuarioId,
profissional_nome:nome,
empresa_id:EMPRESA_ID,
horario_executado:new Date().toISOString()
}))
if(!inserts.length)return
const {error}=await db.from("rotinas_execucao").upsert(inserts,{onConflict:"paciente_id,rotina_id,data,turno"})
if(error){console.error("Erro executarTodos:",error);return}
rotinas.forEach(r=>{
r.status="executado"
r.profissional_nome=nome
})
renderizarRotinas(ROTINAS_CACHE)
calcularIndicadores(ROTINAS_CACHE)
}

/* ====================================================
029 – EXECUTAR ROTINA PARA TODOS (ANTI-SOBRESCRITA)
==================================================== */
async function executarRotinaTodos(rotinaId){
if(!db||!rotinaId)return
const dataHoje=obterDataSelecionada()
const turno=(TURNO_ATUAL||"manha").toLowerCase().trim()
const user=obterUsuarioLogado()||{}
const usuarioId=user.id||null
const nome=user.nome||localStorage.getItem("usuario_nome")||"Administrador"
const rotinas=ROTINAS_CACHE.filter(r=>String(r.rotina_id)===String(rotinaId)&&String((r.turno||"").toLowerCase())===turno)
/* 🔥 SOMENTE PENDENTES */
const pendentes=rotinas.filter(r=>r.status!=="executado")
if(!pendentes.length)return
const inserts=pendentes.map(r=>({
paciente_id:r.paciente_id,
rotina_id:r.rotina_id,
data:dataHoje,
turno:turno,
status:"executado",
usuario_id:usuarioId,
profissional_nome:nome,
empresa_id:EMPRESA_ID,
horario_executado:new Date().toISOString()
}))
const {error}=await db.from("rotinas_execucao").upsert(inserts,{onConflict:"paciente_id,rotina_id,data,turno"})
if(error){console.error("Erro executarRotinaTodos:",error);return}
/* 🔥 ATUALIZA SÓ PENDENTES */
pendentes.forEach(r=>{
r.status="executado"
r.profissional_nome=nome
})
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
999 – EXPORT (CORRIGIDO DEFINITIVO)
==================================================== */
window.executarRotina = executarRotina
window.executarTodos = executarTodos
window.executarRotinaTodos = executarRotinaTodos

/* 🔥 EXPORT SE EXISTIR */
if(typeof mudarTurno==="function"){
window.mudarTurno = mudarTurno
}
/* ====================================================
200 – CARREGAR PACIENTES MEDICAÇÃO (COM CACHE)
==================================================== */
async function carregarPacientesMedicacao(){
if(!db||!EMPRESA_ID)return
const select=document.getElementById("buscaPacienteMedicacao")
if(!select)return
const usuarioId=localStorage.getItem("usuario_id")||null
const hierarquia=parseInt(localStorage.getItem("usuario_hierarquia")||5)
/* 🔹 BASE QUERY */
let query=db
.from("pacientes")
.select("*")
.eq("empresa_id",EMPRESA_ID)
.eq("ativo",true)
/* 🔒 FILTRO POR USUÁRIO (MESMA REGRA DO PAINEL) */
if(hierarquia!==1&&usuarioId){
const {data:rel}=await db
.from("pacientes_profissionais")
.select("paciente_id")
.eq("usuario_id",usuarioId)
.eq("ativo",true)
const ids=rel?.map(r=>r.paciente_id)||[]
if(!ids.length){
window.PACIENTES_CACHE=[]
select.innerHTML='<option value="todos">SEM PACIENTES</option>'
return
}
query=query.in("id",ids)
}
/* 🔹 EXECUTA */
const {data}=await query.order("nome_completo")
window.PACIENTES_CACHE=data||[]
let html='<option value="todos">TODOS</option>'
data?.forEach(p=>{
html+=`<option value="${p.id}">${p.nome_completo}</option>`
})
select.innerHTML=html
select.onchange=carregarMedicacoes
}
/* ====================================================
201 – CARREGAR MEDICAÇÕES (FILTRO REAL POR USUÁRIO)
==================================================== */
async function carregarMedicacoes(){
if(!db||!EMPRESA_ID)return
const pacienteId=document.getElementById("buscaPacienteMedicacao")?.value||"todos"
const usuarioId=localStorage.getItem("usuario_id")
const hierarquia=parseInt(localStorage.getItem("usuario_hierarquia")||5)
/* 🔒 SE NÃO FOR ADMIN → FILTRA PACIENTES */
let pacientesPermitidos=null
if(hierarquia!==1&&usuarioId){
const {data:rel,error}=await db
.from("pacientes_profissionais")
.select("paciente_id")
.eq("usuario_id",usuarioId)
.eq("ativo",true)
if(error){console.error(error)}
pacientesPermitidos=rel?.map(r=>r.paciente_id)||[]
if(!pacientesPermitidos.length){
renderizarMedicacoes([])
return
}
}
/* 🔹 BUSCA MEDICAÇÕES */
let query=db
.from("medicacoes")
.select("*")
.eq("empresa_id",EMPRESA_ID)
.eq("ativo",true)
/* 🔒 AQUI ESTAVA O ERRO */
if(pacientesPermitidos){
query=query.in("paciente_id",pacientesPermitidos)
}
/* 🔹 SELECT */
if(pacienteId!=="todos"){
query=query.eq("paciente_id",pacienteId)
}
const {data,error}=await query
if(error){console.error(error)}
renderizarMedicacoes(data||[])
}
/* ====================================================
202 – RENDER MEDICAÇÕES (ULTRA COMPACTO 2 LINHAS)
==================================================== */
function renderizarMedicacoes(lista){
const div=document.getElementById("listaMedicacoes")
if(!div)return
if(!lista)lista=[]
const hierarquia=parseInt(localStorage.getItem("usuario_hierarquia")||5)
const podeEditar=hierarquia===1
const cores=["#f0f9ff","#fefce8","#f0fdf4","#fff7ed","#fdf2f8","#eef2ff"]
/* 🔹 NORMALIZAR HORA */
const norm=h=>{
if(!h)return""
h=h.toString().trim()
if(["jejum","almoço","almoco"].includes(h.toLowerCase()))return h.toUpperCase()
if(!h.includes(":"))return h.padStart(2,"0")+":00"
let[p,m]=h.split(":")
return p.padStart(2,"0")+":"+m.padStart(2,"0")
}
/* 🔹 HORÁRIOS */
let HORARIOS=[...new Set(lista.flatMap(m=>(m.horarios||"").split("|").map(norm)).filter(h=>{
if(!h)return false
if(h==="JEJUM"||h==="ALMOÇO")return true
return /^\d{2}:\d{2}$/.test(h)
}))].sort((a,b)=>{
const toMin=t=>{
if(t==="JEJUM")return -10
if(t==="ALMOÇO")return 720
let[p,m]=t.split(":")
return parseInt(p)*60+parseInt(m)
}
return toMin(a)-toMin(b)
})
/* 🔹 AGRUPAR */
const pacientes={}
;(window.PACIENTES_CACHE||[]).forEach(p=>{
pacientes[p.id]={nome:p.nome_completo,itens:[]}
})
lista.forEach(m=>{
if(!pacientes[m.paciente_id]){
pacientes[m.paciente_id]={nome:"Paciente",itens:[]}
}
pacientes[m.paciente_id].itens.push(m)
})
let html=""
let idx=0
Object.keys(pacientes).forEach(pid=>{
const p=pacientes[pid]
const cor=cores[idx%cores.length]
idx++
html+=`
<div style="background:${cor};padding:10px;margin-bottom:12px;border-radius:12px">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
<div style="font-weight:600;font-size:13px">👤 ${p.nome}</div>
${podeEditar?`
<div style="display:flex;gap:6px">
<button onclick="abrirNovaMedicacao('${pid}')" style="background:#10b981;color:#fff;border:none;border-radius:6px;font-size:10px;padding:4px 8px">＋</button>
</div>`:""}
</div>
`
if(!p.itens.length){
html+=`<div style="font-size:11px;color:#777">Sem medicação</div></div>`
return
}
/* 🔹 MEDICAÇÕES */
p.itens.forEach(m=>{
let horarios=(m.horarios||"").split("|").map(norm)
/* LINHA 1 – NOME */
html+=`
<div style="font-size:12px;font-weight:600;padding-top:6px">
${m.nome_medicamento||""} <span style="color:#666;font-weight:400">${m.dosagem||""}</span>
</div>
`
/* LINHA 2 – HORÁRIOS */
html+=`
<div style="display:flex;flex-wrap:wrap;gap:6px;padding-bottom:6px;border-bottom:1px solid #ddd;justify-content:flex-start">
${HORARIOS.map(h=>{
let tem=horarios.includes(h)
if(!tem)return ""
let exec=(window.EXEC_CACHE||[]).find(e=>norm(e.horario)===h&&e.medicacao_id===m.id)
let cor=exec?"#22c55e":"#f87171"
let usuarioExec=exec?.usuario_nome||""
return `<button onclick="administrarMedicacao('${m.id}','${h}',this)"
style="background:${cor};color:#fff;border:none;border-radius:6px;font-size:10px;padding:4px 6px;min-width:48px;text-align:center">
${h}
${usuarioExec?`<div style="font-size:8px">${usuarioExec}</div>`:""}
</button>`
}).join("")}
</div>
`
})
html+=`</div>`
})
div.innerHTML=html
}
/* ====================================================
203 – ADMINISTRAR MEDICAÇÃO (COM NOME NA TELA)
==================================================== */
async function administrarMedicacao(medicacaoId,horario,botao){
if(!db)return
if(!medicacaoId||!horario)return

/* 🔒 VALIDAÇÃO DE VÍNCULO (INSERIR AQUI) */
const hierarquia=parseInt(localStorage.getItem("usuario_hierarquia")||5)
const usuarioId=localStorage.getItem("usuario_id")||null
if(hierarquia!==1&&usuarioId){
const {data:rel}=await db
.from("pacientes_profissionais")
.select("paciente_id")
.eq("usuario_id",usuarioId)
.eq("ativo",true)
const ids=rel?.map(r=>r.paciente_id)||[]
const {data:med}=await db
.from("medicacoes")
.select("paciente_id")
.eq("id",medicacaoId)
.single()
if(!ids.includes(med?.paciente_id)){
alert("Sem permissão para este paciente")
return
}
}

const user=obterUsuarioLogado()
const dataHoje=new Date().toISOString().slice(0,10)
/* 🔹 VERIFICA SE JÁ EXISTE */
const {data:ja}=await db
.from("medicacoes_execucao")
.select("*")
.eq("medicacao_id",medicacaoId)
.eq("data",dataHoje)
.eq("horario",horario)
.maybeSingle()

if(ja){
botao.style.background="#22c55e"
botao.innerHTML=`
<span>${horario}</span>
<span style="font-size:9px;margin-top:2px">${ja.usuario_nome||""}</span>
`
return
}
/* 🔹 SALVA */
await db.from("medicacoes_execucao").insert({
medicacao_id:medicacaoId,
data:dataHoje,
horario:horario,
status:"executado",
usuario_id:user.id,
usuario_nome:user.nome
})
/* 🔹 UI */
botao.style.background="#22c55e"
botao.innerHTML=`
<span>${horario}</span>
<span style="font-size:9px;margin-top:2px">${user.nome||""}</span>
`
}
/* ====================================================
203C – CARREGAR STATUS EXECUTADO (FINAL)
==================================================== */
async function carregarStatusMedicacoes(){
if(!db)return
const dataHoje=new Date().toISOString().slice(0,10)
const {data}=await db.from("medicacoes_execucao").select("*").eq("data",dataHoje)
window.EXEC_CACHE=data||[]
if(typeof carregarMedicacoes==="function"){carregarMedicacoes()}
}
