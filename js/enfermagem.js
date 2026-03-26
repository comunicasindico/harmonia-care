/* ====================================================
020 – CORES POR USUÁRIO (OK)
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
020A – USUARIO LOGADO (CORRIGIDO E BLINDADO)
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
return{
id:id||null,
nome:nome,
hierarquia:Number(hierarquia),
perfil:perfil
}
}
/* ====================================================
020B – BARRA DE PROGRESSO (AJUSTE SUAVE)
==================================================== */
function atualizarBarraProgresso(percentual){
const barra=document.getElementById("barraProgresso")
if(!barra)return
if(percentual<0)percentual=0
if(percentual>100)percentual=100
barra.style.width=percentual+"%"
if(percentual<30){barra.style.background="red"}
else if(percentual<70){barra.style.background="orange"}
else{barra.style.background="green"}
}
/* ====================================================
021 – VERIFICAR SE JÁ EXISTE (REGRA BANCO)
==================================================== */
async function registroJaExiste(pacienteId,rotinaId,data,turno){
const {data:existe}=await db.from("rotinas_execucao")
.select("id,status")
.eq("paciente_id",pacienteId)
.eq("rotina_id",rotinaId)
.eq("data",data)
.eq("turno",turno)
.maybeSingle()
return existe && existe.status==="executado"
}
/* ====================================================
021B – MUDAR TURNO (OK + ESTABILIDADE)
==================================================== */
async function mudarTurno(turno){
TURNO_ATUAL=turno
localStorage.setItem("turno_atual",turno)
const btnManha=document.getElementById("btnManha")
const btnTarde=document.getElementById("btnTarde")
const btnNoite=document.getElementById("btnNoite")
if(btnManha)btnManha.classList.remove("turno-ativo")
if(btnTarde)btnTarde.classList.remove("turno-ativo")
if(btnNoite)btnNoite.classList.remove("turno-ativo")
if(turno==="manha"&&btnManha)btnManha.classList.add("turno-ativo")
if(turno==="tarde"&&btnTarde)btnTarde.classList.add("turno-ativo")
if(turno==="noite"&&btnNoite)btnNoite.classList.add("turno-ativo")
if(typeof carregarRotinas==="function")await carregarRotinas()
if(typeof montarGradePeriodo==="function")await montarGradePeriodo()
}
/* ====================================================
022 – CARREGAR PACIENTES BUSCA (BLINDADO)
==================================================== */
async function carregarPacientesBusca(){
if(!db){console.warn("Supabase ainda não carregado");return}
if(!EMPRESA_ID){console.error("EMPRESA_ID null");return}
const select=document.getElementById("buscaPaciente")
if(!select)return
const {data,error}=await db.from("pacientes").select("id,nome_completo").eq("empresa_id",EMPRESA_ID).eq("ativo",true).order("nome_completo",{ascending:true})
if(error){console.error("Erro pacientes",error);return}
let html='<option value="todos">TODOS</option>'
data?.forEach(p=>{html+=`<option value="${p.id}">${p.nome_completo}</option>`})
select.innerHTML=html
select.value="todos"
/* 🔥 GARANTE SINCRONIA */
await new Promise(r=>setTimeout(r,50))
if(typeof carregarRotinas==="function")await carregarRotinas()
if(typeof carregarClinico==="function")await carregarClinico()
}
/* ====================================================
023 – CARREGAR ROTINAS (BLINDADO)
==================================================== */
async function carregarRotinas(){
const turno=TURNO_ATUAL||"manha"
if(!db||!EMPRESA_ID)return
const pacienteSelecionado=document.getElementById("buscaPaciente")?.value||"todos"
const dataRaw=document.getElementById("dataInicio")?.value
const dataHoje=dataRaw&&dataRaw.includes("/")?dataRaw.split("/").reverse().join("-"):(dataRaw||new Date().toISOString().slice(0,10))
let profissionalId=PROFISSIONAL_ID||localStorage.getItem("profissional_id")
let pacientes=[]
if(profissionalId&&profissionalId!=="null"&&profissionalId!=="admin"){
const {data:pp}=await db.from("pacientes_profissionais").select("paciente_id").eq("usuario_id",profissionalId).eq("turno",turno).eq("ativo",true)
if(pp?.length){
const ids=pp.map(p=>p.paciente_id)
const {data:pacs}=await db.from("pacientes").select("*").in("id",ids)
pacientes=pacs||[]
}
}
if(!pacientes.length){
const {data:pacs}=await db.from("pacientes").select("*").eq("empresa_id",EMPRESA_ID).eq("ativo",true)
pacientes=pacs||[]
}
if(pacienteSelecionado!=="todos"){
pacientes=pacientes.filter(p=>String(p.id)===String(pacienteSelecionado))
}
const {data:rotinas}=await db.from("rotina_modelos").select("*").eq("empresa_id",EMPRESA_ID).eq("ativo",true)
const rotinasTurno=(rotinas||[]).filter(r=>!r.turno||r.turno===turno).sort((a,b)=>(a.ordem||99)-(b.ordem||99))
let query=db.from("rotinas_execucao").select("*").eq("data",dataHoje).eq("turno",turno)
if(pacienteSelecionado!=="todos"){query=query.eq("paciente_id",pacienteSelecionado)}
const {data:execucoes}=await query
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
profissional:exec && exec.status==="executado"?(exec.profissional_nome||""):"",
has:p.has,
dm:p.dm,
demencia:p.da,
cardiopatia:p.cardiopatia,
acamado:p.acamado,
pa:p.pressao_arterial
})
}
}
ROTINAS_CACHE=lista
renderizarRotinas(lista)
calcularIndicadores(lista)
}
/* ====================================================
024 – RENDERIZAR ROTINAS
==================================================== */
function renderizarRotinas(lista){

const tbody=document.getElementById("rotinas")
if(!tbody)return

let html=""

const pacienteSelecionado=document.getElementById("buscaPaciente")?.value||"todos"

const pacientes={}

/* 🔹 AGRUPAR */
lista.forEach(r=>{
if(!pacientes[r.paciente_id]){
pacientes[r.paciente_id]={
nome:r.paciente,
rotinas:[],
has:r.has,
dm:r.dm,
demencia:r.demencia,
cardiopatia:r.cardiopatia,
acamado:r.acamado,
pa:r.pa
}
}
pacientes[r.paciente_id].rotinas.push(r)
})

/* 🔹 LOOP */
Object.keys(pacientes).forEach(pid=>{

const p=pacientes[pid]

const analiseTexto=gerarAnalisePaciente(p)

/* 🔹 ORDEM */
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
p.rotinas.sort((a,b)=>{
return ordemFixa.indexOf(a.rotina)-ordemFixa.indexOf(b.rotina)
})
/* 🔹 COMORBIDADES */
let comorbidadesHTML=""
if(p.has)comorbidadesHTML+="<span class='tag-comorb'>HAS</span>"
if(p.dm)comorbidadesHTML+="<span class='tag-comorb'>DM</span>"
if(p.demencia)comorbidadesHTML+="<span class='tag-comorb'>DEM</span>"
if(p.cardiopatia)comorbidadesHTML+="<span class='tag-comorb'>CARD</span>"
if(p.acamado)comorbidadesHTML+="<span class='tag-comorb'>ACAM</span>"
if(p.pa)comorbidadesHTML+="<span class='tag-comorb'>PA</span>"

/* 🔹 ROTINAS */
let rotinasHTML=""
let total=p.rotinas.length
let executadas=0

p.rotinas.forEach(r=>{
if(r.status==="executado")executadas++

const classe=r.status==="executado"?"rotina-executada":"rotina-pendente"
let nomeProf=""
let corProf="#64748b"

if(r.status==="executado"){
if(r.profissional && r.profissional.trim()!==""){
nomeProf=r.profissional
corProf=obterCorUsuario(nomeProf)
}else{
nomeProf=""
corProf="#64748b"
}
}

const classeVisual=r.status==="executado"?"rotina-ok":"rotina-pendente"

let perfil=(localStorage.getItem("usuario_perfil")||"").toLowerCase()

rotinasHTML+=`<div class="badge-rotina ${classeVisual} ${perfil==="administrador"&&r.status==="executado"?"admin":""}"
${r.status==="executado"
?(perfil==="administrador"
?`onclick="desfazerRotina('${r.paciente_id}','${r.rotina_id}',this)"`
:"")
:`onclick="executarRotina('${r.paciente_id}','${r.rotina_id}',this)"`
}>
${r.rotina}
${r.status==="executado"
?`<span class="profissional" style="color:${corProf};font-weight:bold">✔ ${nomeProf}</span>`
:""}
</div>`
})

let percentual=total?Math.round((executadas/total)*100):0

let botaoOK=percentual===100
?`<button class="btn-todos">Rotinas OK</button>`
:`<button class="btn-todos" onclick="executarTodos('${pid}')">Concluir Todas</button>`

/* 🔹 HTML FINAL */
html+=`<tr>
<td class="nome-paciente">
${p.nome}
<div style="margin-top:4px">${comorbidadesHTML}</div>
</td>

<td>
<div class="progresso-container">
<span class="progresso-label">${percentual}% (${executadas}/${total})</span>
${botaoOK}
</div>
</td>

<td>
<div class="rotinas-linha">${rotinasHTML}</div>
<div class="analise-clinica">${analiseTexto}</div>
</td>
</tr>`

})

/* 🔹 TODOS */
if(lista.length>0&&pacienteSelecionado==="todos"){

const rotinasUnicas={}

lista.forEach(r=>{
rotinasUnicas[r.rotina_id]=r.rotina
})

let rotinasHTML=""

Object.keys(rotinasUnicas).forEach(rotinaId=>{
rotinasHTML+=`<button class="btn-rotina" onclick="executarRotinaTodos('${rotinaId}')">${rotinasUnicas[rotinaId]}</button>`
})

html+=`<tr style="background:#f0fdf4;font-weight:bold">
<td>Todos os Pacientes</td>
<td>—</td>
<td class="rotinas-linha">${rotinasHTML}</td>
</tr>`
}

tbody.innerHTML=html
}
/* ====================================================
024B – EXECUTAR ROTINA (CORREÇÃO DEFINITIVA SUPABASE)
==================================================== */
async function executarRotina(pacienteId,rotinaId,botao){
if(!db||!pacienteId||!rotinaId)return
const chaveLock=`lock_${pacienteId}_${rotinaId}`
if(window[chaveLock])return
window[chaveLock]=true
const dataRaw=document.getElementById("dataInicio")?.value
const dataHoje=dataRaw&&dataRaw.includes("/")?dataRaw.split("/").reverse().join("-"):(dataRaw||new Date().toISOString().slice(0,10))
const turno=(TURNO_ATUAL||"manha").toLowerCase().trim()
const user=obterUsuarioLogado()
const nomeProfissional=user.nome||localStorage.getItem("usuario_nome")||"admin"
const usuarioId=user.id||localStorage.getItem("usuario_id")||null
try{
const {data,error}=await db.from("rotinas_execucao").upsert({
paciente_id:Number(pacienteId),
rotina_id:Number(rotinaId),
data:dataHoje,
turno:turno,
status:"executado",
usuario_id:usuarioId,
profissional_nome:nomeProfissional,
horario_executado:new Date().toISOString()
},{
onConflict:"paciente_id,rotina_id,data,turno"
})
if(error){
console.error("ERRO REAL SUPABASE:",error)
alert("Erro ao salvar no banco")
window[chaveLock]=false
return
}
/* 🔄 CACHE */
ROTINAS_CACHE.forEach(r=>{
if(String(r.paciente_id)===String(pacienteId)&&String(r.rotina_id)===String(rotinaId)){
r.status="executado"
r.profissional=nomeProfissional
}
})
renderizarRotinas(ROTINAS_CACHE)
calcularIndicadores(ROTINAS_CACHE)
}catch(e){
console.error("Erro geral executarRotina",e)
}
window[chaveLock]=false
}
/* ====================================================
026 – CONCLUIR TODAS (FINAL CORRETO)
==================================================== */
async function concluirTodas(pacienteId){
if(!db||!pacienteId)return
const chaveLock=`lock_exec_todos_${pacienteId}`
if(window[chaveLock])return
window[chaveLock]=true
try{

const dataRaw=document.getElementById("dataInicio")?.value
const dataHoje=dataRaw&&dataRaw.includes("/")?dataRaw.split("/").reverse().join("-"):(dataRaw||new Date().toISOString().slice(0,10))
const turno=(TURNO_ATUAL||"manha").toLowerCase().trim()

const user=obterUsuarioLogado()||{}
const usuarioId=user.id||null
const nomeUsuario=user.nome||"admin"

const rotinas=ROTINAS_CACHE.filter(r=>String(r.paciente_id)===String(pacienteId))

for(const r of rotinas){

/* 🔒 NÃO SOBRESCREVE */
if(r.status==="executado"){
continue
}

/* 🔥 UPSERT (SEM CONFLITO) */
const res=await db.from("rotinas_execucao").upsert({
paciente_id:Number(r.paciente_id),
rotina_id:Number(r.rotina_id),
data:dataHoje,
turno:turno,
status:"executado",
executado_por:usuarioId,
horario_executado:new Date().toISOString(),
profissional_nome:nomeUsuario
},{
onConflict:"paciente_id,rotina_id,data,turno"
})

if(res.error){
console.error("Erro concluirTodas",res.error)
continue
}

/* 🔄 CACHE */
r.status="executado"
r.profissional=nomeUsuario

}

/* 🔄 UI */
renderizarRotinas(ROTINAS_CACHE)
calcularIndicadores(ROTINAS_CACHE)

}catch(e){
console.error("Erro geral concluirTodas",e)
}finally{
window[chaveLock]=false
}
}
/* ====================================================
026A – DESFAZER ROTINA (FINAL CORRETO)
==================================================== */
async function desfazerRotina(pacienteId,rotinaId,botao){
if(!db||!pacienteId||!rotinaId)return
if(!confirm("Deseja desfazer esta rotina?"))return
const chaveLock=`lock_desfazer_${pacienteId}_${rotinaId}`
if(window[chaveLock])return
window[chaveLock]=true
const dataRaw=document.getElementById("dataInicio")?.value
const dataHoje=dataRaw&&dataRaw.includes("/")?dataRaw.split("/").reverse().join("-"):(dataRaw||new Date().toISOString().slice(0,10))
const turno=TURNO_ATUAL||"manha"
const {error}=await db.from("rotinas_execucao")
.delete()
.eq("paciente_id",pacienteId)
.eq("rotina_id",rotinaId)
.eq("data",dataHoje)
.eq("turno",turno)
if(error){
console.error("Erro desfazerRotina",error)
window[chaveLock]=false
return
}
ROTINAS_CACHE.forEach(r=>{
if(String(r.paciente_id)===String(pacienteId)&&String(r.rotina_id)===String(rotinaId)){
r.status="pendente"
r.profissional=""
}
})
renderizarRotinas(ROTINAS_CACHE)
calcularIndicadores(ROTINAS_CACHE)
window[chaveLock]=false
}
/* ====================================================
027 – INDICADORES (CORRIGIDO)
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
028 – EXECUTAR TODOS (CORREÇÃO DEFINITIVA)
==================================================== */
async function executarTodos(pacienteId){
if(!db||!pacienteId)return
const chaveLock=`lock_exec_todos_${pacienteId}`
if(window[chaveLock])return
window[chaveLock]=true
try{
const dataRaw=document.getElementById("dataInicio")?.value
const dataHoje=dataRaw&&dataRaw.includes("/")?dataRaw.split("/").reverse().join("-"):(dataRaw||new Date().toISOString().slice(0,10))
const turno=(TURNO_ATUAL||"manha").toLowerCase().trim()
const user=obterUsuarioLogado()
const usuarioId=user.id||localStorage.getItem("usuario_id")||null
const nomeUsuario=user.nome||localStorage.getItem("usuario_nome")||"admin"
const rotinas=ROTINAS_CACHE.filter(r=>String(r.paciente_id)===String(pacienteId))
for(const r of rotinas){
if(r.status==="executado")continue
const {error}=await db.from("rotinas_execucao").upsert({
paciente_id:Number(r.paciente_id),
rotina_id:Number(r.rotina_id),
data:dataHoje,
turno:turno,
status:"executado",
usuario_id:usuarioId,
profissional_nome:nomeUsuario,
horario_executado:new Date().toISOString()
},{
onConflict:"paciente_id,rotina_id,data,turno"
})
if(error){
console.error("Erro executarTodos:",error)
continue
}
r.status="executado"
r.profissional=nomeUsuario
}
renderizarRotinas(ROTINAS_CACHE)
calcularIndicadores(ROTINAS_CACHE)
}catch(e){
console.error("Erro geral executarTodos",e)
}
window[chaveLock]=false
}
/* ====================================================
029 – EXECUTAR ROTINA PARA TODOS (FINAL CORRETO)
==================================================== */
async function executarRotinaTodos(rotinaId){
if(!db||!rotinaId)return
const chaveLock=`lock_rotina_todos_${rotinaId}`
if(window[chaveLock])return
window[chaveLock]=true
try{

const dataRaw=document.getElementById("dataInicio")?.value
const dataHoje=dataRaw&&dataRaw.includes("/")?dataRaw.split("/").reverse().join("-"):(dataRaw||new Date().toISOString().slice(0,10))

const turno=(TURNO_ATUAL||"manha").toLowerCase().trim()

const user=obterUsuarioLogado()
const usuarioId=user.id||null
const nomeUsuario=user.nome||"Administrador"

const rotinas=ROTINAS_CACHE.filter(r=>String(r.rotina_id)===String(rotinaId))

for(const r of rotinas){

/* 🔒 NÃO SOBRESCREVE */
if(r.status==="executado"){
continue
}

/* 🔥 UPSERT SEGURO */
const res=await db.from("rotinas_execucao").upsert({
paciente_id:Number(r.paciente_id),
rotina_id:Number(r.rotina_id),
data:dataHoje,
turno:turno,
status:"executado",
executado_por:usuarioId,
horario_executado:new Date().toISOString(),
profissional_nome:nomeUsuario
},{
onConflict:"paciente_id,rotina_id,data,turno"
})

if(res.error){
console.error("Erro executarRotinaTodos",res.error)
continue
}

/* 🔄 CACHE */
r.status="executado"
r.profissional=nomeUsuario

}

/* 🔄 UI */
renderizarRotinas(ROTINAS_CACHE)
calcularIndicadores(ROTINAS_CACHE)

}catch(e){
console.error("Erro geral executarRotinaTodos",e)
}finally{
window[chaveLock]=false
}
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
