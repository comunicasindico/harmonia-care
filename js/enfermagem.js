/* ====================================================
020 – MUDAR TURNO
==================================================== */
function mudarTurno(turno){
console.log("Turno selecionado:",turno)
TURNO_ATUAL=turno
localStorage.setItem("turno_atual",turno)
const btnManha=document.getElementById("btnManha"),btnTarde=document.getElementById("btnTarde"),btnNoite=document.getElementById("btnNoite")
if(btnManha)btnManha.classList.remove("turno-ativo")
if(btnTarde)btnTarde.classList.remove("turno-ativo")
if(btnNoite)btnNoite.classList.remove("turno-ativo")
if(turno==="manha"&&btnManha)btnManha.classList.add("turno-ativo")
if(turno==="tarde"&&btnTarde)btnTarde.classList.add("turno-ativo")
if(turno==="noite"&&btnNoite)btnNoite.classList.add("turno-ativo")
if(typeof carregarRotinas==="function")carregarRotinas()
}

/* ====================================================
021 – CARREGAR PACIENTES BUSCA
==================================================== */
async function carregarPacientesBusca(){
if(!db){console.warn("Supabase ainda não carregado");return}
const select=document.getElementById("buscaPaciente")
if(!select)return
const {data,error}=await db.from("pacientes").select("id,nome_completo").eq("empresa_id",EMPRESA_ID).eq("ativo",true).order("nome_completo",{ascending:true})
if(error){console.error("Erro pacientes",error);return}
let html='<option value="todos">TODOS</option>'
data?.forEach(p=>{html+=`<option value="${p.id}">${p.nome_completo}</option>`})
select.innerHTML=html
select.value="todos"
if(typeof carregarRotinas==="function")await carregarRotinas()
if(typeof carregarClinico==="function")await carregarClinico()
}

/* ====================================================
022 – CARREGAR ROTINAS
==================================================== */
async function carregarRotinas(){
if(!db)return
const paciente=document.getElementById("buscaPaciente")?.value||"todos"
const dataRaw=document.getElementById("dataInicio")?.value
const dataHoje=dataRaw&&dataRaw.includes("/")?dataRaw.split("/").reverse().join("-"):(dataRaw||new Date().toISOString().slice(0,10))
const turno=TURNO_ATUAL
let profissionalId=PROFISSIONAL_ID||localStorage.getItem("profissional_id")
let pacientes=[]
if(profissionalId&&profissionalId!=="null"&&profissionalId!=="admin"){
const {data,error}=await db.from("pacientes_profissionais").select("paciente_id").eq("usuario_id",profissionalId).eq("turno",turno).eq("ativo",true)
if(error){console.error("Erro pacientes profissional",error);return}
if(data?.length){
const ids=data.map(p=>p.paciente_id)
const {data:lista}=await db.from("pacientes").select("id,nome_completo").in("id",ids)
pacientes=lista||[]
}}
if(!pacientes.length){
const {data,error}=await db.from("pacientes").select("id,nome_completo").eq("empresa_id",EMPRESA_ID).eq("ativo",true).order("nome_completo")
if(error){console.error("Erro pacientes",error);return}
pacientes=data||[]
}
const {data:rotinas,error:e2}=await db.from("rotina_modelos").select("id,nome,turno")
if(e2){console.error("Erro rotinas",e2);return}
const rotinasTurno=rotinas?.filter(r=>r.turno===turno)||[]
const {data:execucoes,error:e3}=await db.from("rotinas_execucao").select("*").eq("data",dataHoje)
if(e3){console.error("Erro execucoes",e3);return}
const {data:usuarios}=await db.from("usuarios").select("id,nome_apelido")
const mapaProfissionais={}
usuarios?.forEach(u=>{mapaProfissionais[u.id]=u.nome_apelido})
const mapaExecucoes={}
execucoes?.forEach(e=>{mapaExecucoes[`${e.idoso_id}_${e.rotina_id}`]=e})
let lista=[]
pacientes?.forEach(p=>{
if(paciente!=="todos"&&paciente!=p.id)return
rotinasTurno.forEach(r=>{
const chave=`${p.id}_${r.id}`
const exec=mapaExecucoes[chave]
lista.push({id:exec?.id||chave,idoso_id:p.id,rotina_id:r.id,paciente:p.nome_completo,rotina:r.nome,status:exec?.status||"pendente",profissional:exec?.usuario_id?mapaProfissionais[exec.usuario_id]:""})
})
})
ROTINAS_CACHE=lista
calcularIndicadores(lista)
renderizarRotinas(lista)
}
/* ====================================================
023 – RENDERIZAR ROTINAS
==================================================== */
function renderizarRotinas(lista){
const tbody=document.getElementById("rotinas");if(!tbody)return
let html=""
const pacienteSelecionado=document.getElementById("buscaPaciente")?.value||"todos"
const pacientes={}
lista.forEach(r=>{if(!pacientes[r.idoso_id])pacientes[r.idoso_id]={nome:r.paciente,rotinas:[]};pacientes[r.idoso_id].rotinas.push(r)})
Object.keys(pacientes).forEach(pid=>{
const p=pacientes[pid]
let rotinasHTML="",total=p.rotinas.length,executadas=0
p.rotinas.forEach(r=>{
if(r.status==="executado")executadas++
const classe=r.status==="executado"?"rotina-executada":"rotina-pendente"
let nomeProf=""
let corProf="#64748b"
if(r.status==="executado"){
if(r.profissional && r.profissional.trim()!==""){
nomeProf=r.profissional
}else{
nomeProf="admin"
}
corProf=obterCorUsuario(nomeProf)
}
rotinasHTML+=`<button class="btn-rotina ${classe}" ${r.status==="executado"?"":`onclick="executarRotina('${r.idoso_id}','${r.rotina_id}',this)"`}>
${r.rotina}
${r.status==="executado"
?`<br><span style="font-size:9px;font-weight:bold;color:${corProf}">✔ ${nomeProf}</span>`
:""}
</button>`
})
let percentual=total?Math.round((executadas/total)*100):0
let botaoOK=percentual===100?`<button class="btn-todos">Rotinas OK</button>`:`<button class="btn-todos" onclick="executarTodos('${pid}')">Concluir Todas</button>`
html+=`<tr><td class="nome-paciente">${p.nome}</td><td><div class="progresso-container"><span class="progresso-label">${percentual}% (${executadas}/${total})</span>${botaoOK}</div></td><td class="rotinas-linha">${rotinasHTML}</td></tr>`
})
if(lista.length>0&&pacienteSelecionado==="todos"){
const rotinasUnicas={}
lista.forEach(r=>{rotinasUnicas[r.rotina_id]=r.rotina})
let rotinasHTML=""
Object.keys(rotinasUnicas).forEach(rotinaId=>{
const nomeRotina=rotinasUnicas[rotinaId]
rotinasHTML+=`<button class="btn-rotina" onclick="executarRotinaTodos('${rotinaId}')">${nomeRotina}</button>`
})
html+=`<tr style="background:#f0fdf4;font-weight:bold"><td>Todos os Pacientes</td><td>—</td><td class="rotinas-linha">${rotinasHTML}</td></tr>`
}
tbody.innerHTML=html
}
/* ====================================================
024 – EXECUTAR ROTINA (LOCK DE EXECUÇÃO)
==================================================== */
async function executarRotina(pacienteId,rotinaId,botao){
if(!db)return
if(botao&&botao.classList.contains("rotina-executada")){return}
const chaveLock=`lock_${pacienteId}_${rotinaId}`
if(window[chaveLock]){return}
window[chaveLock]=true
const dataRaw=document.getElementById("dataInicio")?.value
const dataHoje=dataRaw&&dataRaw.includes("/")?dataRaw.split("/").reverse().join("-"):(dataRaw||new Date().toISOString().slice(0,10))
let usuarioId=localStorage.getItem("usuario_id")
if(!usuarioId||usuarioId==="null"){usuarioId=PROFISSIONAL_ID||null}
const {data:existe}=await db.from("rotinas_execucao").select("status").eq("idoso_id",pacienteId).eq("rotina_id",rotinaId).eq("data",dataHoje).maybeSingle()
if(existe&&existe.status==="executado"){window[chaveLock]=false;return}
if(!existe){
await db.from("rotinas_execucao").insert({idoso_id:pacienteId,rotina_id:rotinaId,data:dataHoje,status:"pendente"})
}
if(botao){
botao.classList.remove("rotina-pendente")
botao.classList.add("rotina-executada")
let nomeProfissional=localStorage.getItem("usuario_nome")
if(!nomeProfissional){
nomeProfissional="admin"
}
let cor=obterCorUsuario(nomeProfissional)
if(!botao.innerHTML.includes("✔")){
botao.innerHTML+=`<br><span style="font-size:9px;font-weight:bold;color:${cor}">✔ ${nomeProfissional}</span>`
}
}
await db.from("rotinas_execucao").update({status:"executado",horario_executado:new Date(),usuario_id:usuarioId}).eq("idoso_id", pacienteId).eq("rotina_id",rotinaId).eq("data",dataHoje)
window[chaveLock]=false
await carregarRotinas()
}
/* ====================================================
025 – INDICADORES
==================================================== */
function calcularIndicadores(lista){
let executado=0,pendente=0,atrasado=0
lista.forEach(r=>{if(r.status==="executado")executado++;if(r.status==="pendente")pendente++;if(r.status==="atrasado")atrasado++})
const e=document.getElementById("indicadorExecutado"),p=document.getElementById("indicadorPendente"),a=document.getElementById("indicadorAtrasado")
if(e)e.innerHTML="✔ "+executado
if(p)p.innerHTML="🔴 "+pendente
if(a)a.innerHTML="⚠ "+atrasado
}

/* ====================================================
026 – EXECUTAR TODAS ROTINAS
==================================================== */
async function executarTodos(pacienteId){
if(!db)return

const dataRaw=document.getElementById("dataInicio")?.value
const dataHoje=dataRaw && dataRaw.includes("/") ? dataRaw.split("/").reverse().join("-") : (dataRaw || new Date().toISOString().slice(0,10))

/* ATUALIZA VISUAL IMEDIATO */
const linha=document.querySelectorAll(`[data-paciente="${pacienteId}"] .btn-rotina`)
linha.forEach(btn=>{
if(!btn.classList.contains("rotina-executada")){
btn.classList.remove("rotina-pendente")
btn.classList.add("rotina-executada")
if(!btn.innerHTML.includes("✔")){
btn.innerHTML+=`<br><span style="font-size:10px">✔ admin</span>`
}
}
})

const rotinas=ROTINAS_CACHE.filter(r=>r.idoso_id===pacienteId)

for(const r of rotinas){

let usuarioId=localStorage.getItem("usuario_id")
if(!usuarioId||usuarioId==="null")usuarioId=PROFISSIONAL_ID||null

const {data:existe}=await db
.from("rotinas_execucao")
.select("id,status")
.eq("idoso_id",r.idoso_id)
.eq("rotina_id",r.rotina_id)
.eq("data",dataHoje)
.maybeSingle()

if(existe && existe.status==="executado")continue

if(!existe){
await db.from("rotinas_execucao").insert({
idoso_id:r.idoso_id,
rotina_id:r.rotina_id,
data:dataHoje,
status:"pendente"
})
}

await db.from("rotinas_execucao")
.update({
status:"executado",
horario_executado:new Date(),
usuario_id:usuarioId
})
.eq("idoso_id",r.idoso_id)
.eq("rotina_id",r.rotina_id)
.eq("data",dataHoje)

}

await carregarRotinas()
}
/* ====================================================
027 – EXECUTAR ROTINA PARA TODOS OS PACIENTES
==================================================== */
async function executarRotinaTodos(rotinaId){

if(!db)return

const dataRaw=document.getElementById("dataInicio")?.value
const dataHoje=dataRaw && dataRaw.includes("/") 
? dataRaw.split("/").reverse().join("-") 
: (dataRaw || new Date().toISOString().slice(0,10))

let nomeUsuario=localStorage.getItem("usuario_nome") || "admin"
let corUsuario=obterCorUsuario(nomeUsuario)

/* ====================================================
ATUALIZA VISUAL IMEDIATO (SEM ESPERAR SUPABASE)
==================================================== */
document.querySelectorAll(".btn-rotina").forEach(btn=>{

if(btn.innerText.includes("✔"))return

if(btn.innerText.includes(rotinaId)){

btn.classList.remove("rotina-pendente")
btn.classList.add("rotina-executada")

if(!btn.innerHTML.includes("✔")){
btn.innerHTML+=`<br><span style="font-size:10px;font-weight:bold;color:${corUsuario}">✔ ${nomeUsuario}</span>`
}

}

})

/* ====================================================
SALVAR NO SUPABASE
==================================================== */
const rotinas=ROTINAS_CACHE.filter(r=>r.rotina_id===rotinaId)

for(const r of rotinas){

let usuarioId=localStorage.getItem("usuario_id")
if(!usuarioId||usuarioId==="null")usuarioId=PROFISSIONAL_ID||null

const {data:existe}=await db
.from("rotinas_execucao")
.select("id,status")
.eq("idoso_id",r.idoso_id)
.eq("rotina_id",r.rotina_id)
.eq("data",dataHoje)
.maybeSingle()

if(existe && existe.status==="executado")continue

if(!existe){

await db
.from("rotinas_execucao")
.insert({
idoso_id:r.idoso_id,
rotina_id:r.rotina_id,
data:dataHoje,
status:"pendente"
})

}

await db
.from("rotinas_execucao")
.update({
status:"executado",
horario_executado:new Date(),
usuario_id:usuarioId
})
.eq("idoso_id",r.idoso_id)
.eq("rotina_id",r.rotina_id)
.eq("data",dataHoje)

}

await carregarRotinas()

}
/* ====================================================
028 – GERAR ROTINAS DO DIA
==================================================== */
async function gerarRotinasDoDia(){
if(!db)return
if(ROTINAS_GERADAS)return
ROTINAS_GERADAS=true
const hoje=document.getElementById("dataInicio")?.value||new Date().toISOString().slice(0,10)
const {data:pacientes}=await db.from("pacientes").select("id").eq("empresa_id",EMPRESA_ID).eq("ativo",true)
const {data:rotinas}=await db.from("rotina_modelos").select("id")
if(!pacientes?.length||!rotinas?.length)return
for(const p of pacientes){
for(const r of rotinas){
const {data:existe}=await db.from("rotinas_execucao").select("id").eq("idoso_id",p.id).eq("rotina_id",r.id).eq("data",hoje).limit(1)
if(!existe||!existe.length){
await db.from("rotinas_execucao").insert({idoso_id:p.id,rotina_id:r.id,data:hoje,status:"pendente"})
}}
}
await carregarRotinas()
}

/* ====================================================
029 – SELECIONAR PACIENTE
==================================================== */
async function selecionarPaciente(){
await processarSelecaoPaciente()
}
/* ====================================================
030 – AO SELECIONAR PACIENTE
==================================================== */
async function aoSelecionarPaciente(){
await processarSelecaoPaciente()
}
/* ====================================================
031 – PROCESSAR SELEÇÃO DE PACIENTE
==================================================== */
async function processarSelecaoPaciente(){
const select=document.getElementById("buscaPaciente")
if(!select)return
const pacienteId=select.value
if(typeof carregarRotinas==="function"){await carregarRotinas()}
if(pacienteId!=="todos"){
if(typeof carregarDadosClinicosPaciente==="function"){await carregarDadosClinicosPaciente(pacienteId)}
if(typeof carregarClinico==="function"){await carregarClinico(pacienteId)}
}
}
/* ====================================================
032 – PESQUISAR ROTINAS
==================================================== */
async function pesquisarRotinas(){
await gerarRotinasDoDia()
await carregarRotinas()

const paciente=document.getElementById("buscaPaciente")?.value

if(paciente && paciente!=="todos"){
if(typeof montarGradePeriodo==="function"){
await montarGradePeriodo()
}
}else{
const el=document.getElementById("gradePeriodo")
if(el)el.innerHTML=""
}
}
/* ====================================================
033 – NORMALIZAR DATA PARA ISO
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
034 – CONCLUIR PENDENTES VISÍVEIS
==================================================== */
async function concluirPendentesVisiveis(){
if(!db)return
if(window.salvandoPendencias){alert("Aguarde finalizar o salvamento.");return}
window.salvandoPendencias=true
const dataRaw=document.getElementById("dataInicio")?.value
const dataHoje=dataRaw&&dataRaw.includes("/")?dataRaw.split("/").reverse().join("-"):(dataRaw||new Date().toISOString().slice(0,10))
let usuarioId=localStorage.getItem("usuario_id")
if(!usuarioId||usuarioId==="null")usuarioId=PROFISSIONAL_ID||null
const botoes=document.querySelectorAll(".btn-rotina")
botoes.forEach(btn=>{
if(!btn.classList.contains("rotina-executada")){
btn.classList.remove("rotina-pendente")
btn.classList.add("rotina-executada")
if(!btn.innerHTML.includes("✔")){
btn.innerHTML+=`<br><span style="font-size:10px">✔ Administrador</span>`
}}
})
const pendentes=(ROTINAS_CACHE||[]).filter(r=>r.status!=="executado")
for(const r of pendentes){
const {data:existe}=await db.from("rotinas_execucao").select("id,status").eq("idoso_id",r.idoso_id).eq("rotina_id",r.rotina_id).eq("data",dataHoje).maybeSingle()
if(existe&&existe.status==="executado")continue
if(!existe){
await db.from("rotinas_execucao").insert({idoso_id:r.idoso_id,rotina_id:r.rotina_id,data:dataHoje,status:"pendente"})
}
await db.from("rotinas_execucao").update({status:"executado",horario_executado:new Date(),usuario_id:usuarioId}).eq("idoso_id",r.idoso_id).eq("rotina_id",r.rotina_id).eq("data",dataHoje)
}
await carregarRotinas()
window.salvandoPendencias=false
alert("Pendências concluídas com sucesso")
}
/* ====================================================
035 – TESTE SEM FILTROS FINAL
==================================================== */
async function montarGradePeriodo(){
if(!db)return
const pacienteId=document.getElementById("buscaPaciente")?.value
const dataInicio=document.getElementById("dataInicio")?.value
const dataFim=document.getElementById("dataFim")?.value
if(!pacienteId||pacienteId==="todos"){
const el=document.getElementById("gradePeriodo")
if(el)el.innerHTML=""
return
}
const inicio=new Date(dataInicio+"T00:00:00")
const fim=new Date(dataFim+"T00:00:00")
const dias=[]
for(let d=new Date(inicio);d<=fim;d.setDate(d.getDate()+1)){
const y=d.getFullYear()
const m=String(d.getMonth()+1).padStart(2,"0")
const da=String(d.getDate()).padStart(2,"0")
dias.push(`${y}-${m}-${da}`)
}
const {data:rotinasModelos}=await db.from("rotina_modelos").select("id,nome,turno")
if(!rotinasModelos||rotinasModelos.length===0){
document.getElementById("gradePeriodo").innerHTML="<p>Sem rotinas</p>"
return
}
const normalizar=(txt)=>txt?.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()
const ordemTurno=["manha","tarde","noite"]
const ordemDesejada=["Banho","Alimentação","Café","Higiene Bucal","Medicação","Oferta de Água","Almoço","Lanche","Higiene (tarde)","Jantar","Higiene Noturna (noite)","Troca de Fralda (noite)"]
const ordemNormalizada=ordemDesejada.map(normalizar)
rotinasModelos.sort((a,b)=>{
const tA=ordemTurno.indexOf(a.turno||"")
const tB=ordemTurno.indexOf(b.turno||"")
if(tA!==tB)return tA-tB
const ia=ordemNormalizada.indexOf(normalizar(a.nome))
const ib=ordemNormalizada.indexOf(normalizar(b.nome))
if(ia===-1&&ib===-1)return 0
if(ia===-1)return 1
if(ib===-1)return -1
return ia-ib
})
const {data:execucao}=await db
.from("rotinas_execucao")
.select("rotina_id,data,horario_executado,status,turno,idoso_id,paciente_id")
.or(`data.gte.${dataInicio},horario_executado.gte.${dataInicio}`)
.or(`data.lte.${dataFim},horario_executado.lte.${dataFim}`)
let mapa={}
for(const e of execucao||[]){
const id=(e.idoso_id||e.paciente_id)?.toString().trim()
const pacienteSel=pacienteId?.toString().trim()
console.log("ID BANCO:", id, "ID SELECT:", pacienteSel)
if(id!==pacienteSel)continue

let base = e.data ? e.data : e.horario_executado
if(!base)continue

const dt=new Date(base)
const y=dt.getFullYear()
const m=String(dt.getMonth()+1).padStart(2,"0")
const da=String(dt.getDate()).padStart(2,"0")

const dataExec=`${y}-${m}-${da}`
const chave=dataExec+"_"+String(e.rotina_id)

if(!mapa[chave])mapa[chave]=[]
mapa[chave].push(e)
}
let html=`<div style="margin-top:20px"><b>Rotinas por período</b><table style="width:100%;margin-top:10px;border-collapse:collapse;font-size:12px">`
html+=`<tr style="background:#f1f1f1"><th>Data</th>`
for(const r of rotinasModelos){
html+=`<th style="padding:4px">${r.nome}</th>`
}
html+=`</tr>`
for(const dia of dias){
const dataBR=new Date(dia+"T00:00:00").toLocaleDateString("pt-BR")
html+=`<tr><td style="font-weight:bold">${dataBR}</td>`
for(const r of rotinasModelos){
const lista=mapa[dia+"_"+String(r.id)]||[]
let manha=false,tarde=false,noite=false

for(const e of lista){

const statusOK=(e.status||"").toLowerCase().trim()==="executado"
if(!statusOK)continue

// 🔥 PRIORIDADE: usar turno se existir
if(e.turno==="manha")manha=true
else if(e.turno==="tarde")tarde=true
else if(e.turno==="noite")noite=true

// 🔥 SE turno for NULL → usa horário
else if(e.horario_executado){
const hora=new Date(e.horario_executado).getHours()

if(hora<12)manha=true
else if(hora<18)tarde=true
else noite=true
}
}
let celula = ""

if(manha)celula+=`<span style="color:#2196f3">●</span>`
if(tarde)celula+=`<span style="color:#ff9800">●</span>`
if(noite)celula+=`<span style="color:#37474f">●</span>`

/* 🔥 MOSTRAR VAZIO VISUAL */
if(!celula){
celula = `<span style="color:#e74c3c">✖</span>`
}
html+=`<td style="text-align:center">${celula}</td>`
}
html+=`</tr>`
}
html+=`</table><div style="margin-top:10px;font-size:12px"><span style="color:#2196f3">●</span> Manhã <span style="color:#ff9800;margin-left:10px">●</span> Tarde <span style="color:#37474f;margin-left:10px">●</span> Noite</div></div>`
document.getElementById("gradePeriodo").innerHTML=html
}
