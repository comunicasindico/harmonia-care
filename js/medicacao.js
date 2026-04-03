/* ====================================================
200 – CARREGAR PACIENTES MEDICAÇÃO
==================================================== */
async function carregarPacientesMedicacao(){
if(!db||!EMPRESA_ID)return
const select=document.getElementById("buscaPacienteMedicacao")
if(!select)return
const usuarioId=localStorage.getItem("usuario_id")||null
const hierarquia=parseInt(localStorage.getItem("usuario_hierarquia")||5)
let query=db.from("pacientes").select("*").eq("empresa_id",EMPRESA_ID).eq("ativo",true)
if(hierarquia!==1&&usuarioId){
const {data:rel}=await db.from("pacientes_profissionais").select("paciente_id").eq("usuario_id",usuarioId).eq("ativo",true)
const ids=rel?.map(r=>r.paciente_id)||[]
if(!ids.length){
window.PACIENTES_CACHE=[]
select.innerHTML='<option value="todos">SEM PACIENTES</option>'
return
}
query=query.in("id",ids)
}
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
201 – CARREGAR MEDICAÇÕES
==================================================== */
async function carregarMedicacoes(){
if(!db||!EMPRESA_ID)return
let usuarioId=localStorage.getItem("usuario_id")
let hierarquia=parseInt(localStorage.getItem("usuario_hierarquia")||5)
if(!usuarioId){
setTimeout(()=>carregarMedicacoes(),300)
return
}
const pacienteId=document.getElementById("buscaPacienteMedicacao")?.value||"todos"
let pacientesPermitidos=null
if(hierarquia!==1){
const {data:rel}=await db.from("pacientes_profissionais").select("paciente_id").eq("usuario_id",usuarioId).eq("ativo",true)
pacientesPermitidos=rel?.map(r=>r.paciente_id)||[]
if(!pacientesPermitidos.length){
renderizarMedicacoes([])
return
}
}
let query=db.from("medicacoes").select("*").eq("ativo",true)
if(pacientesPermitidos)query=query.in("paciente_id",pacientesPermitidos)
if(pacienteId!=="todos"){
if(pacientesPermitidos && !pacientesPermitidos.includes(pacienteId)){
renderizarMedicacoes([])
return
}
query=query.eq("paciente_id",pacienteId)
}
if(hierarquia!==1 && pacienteId!=="todos"){
if(!pacientesPermitidos.includes(pacienteId)){
console.warn("Acesso bloqueado ao paciente")
renderizarMedicacoes([])
return
}
}
const {data,error}=await query
if(error){
renderizarMedicacoes([])
return
}
renderizarMedicacoes(data||[])
aplicarDataInteligente()
carregarListaHorarios()
montarHorariosMedicacao()
}
/* ====================================================
202 – RENDER MEDICAÇÕES (FINAL LIMPO PROFISSIONAL)
==================================================== */
function renderizarMedicacoes(lista){

const dataEnfInicio=document.getElementById("dataInicio")?.value
const dataEnfFim=document.getElementById("dataFim")?.value

const dataMedInicio=document.getElementById("dataInicioMedicacao")
const dataMedFim=document.getElementById("dataFimMedicacao")

if(dataEnfInicio&&dataMedInicio)dataMedInicio.value=dataEnfInicio
if(dataEnfFim&&dataMedFim)dataMedFim.value=dataEnfFim
const div=document.getElementById("listaMedicacoes")
if(!div)return
if(!lista)lista=[]
/* ====================================================
202A – FILTRO FINAL SEGURANÇA (MEDICAÇÃO)
==================================================== */
let usuarioId=localStorage.getItem("usuario_id")
let hierarquia=parseInt(localStorage.getItem("usuario_hierarquia")||5)

if(hierarquia!==1 && usuarioId){
let permitidos=new Set(window.PACIENTES_CACHE?.map(p=>String(p.id))||[])
lista=lista.filter(m=>permitidos.has(String(m.paciente_id)))
}
window.MEDICACOES_CACHE=lista

const normalizarHora=h=>{
if(!h)return""
h=h.toString().trim()
if(!h.includes(":"))return h.padStart(2,"0")+":00"
let[p,m]=h.split(":")
return p.padStart(2,"0")+":"+m.padStart(2,"0")
}

let pacientes={}
lista.forEach(m=>{
let pid=(m.paciente_id||"").toString().trim()
if(!pid)return
if(!pacientes[pid]){
let nome=(window.PACIENTES_CACHE||[]).find(p=>String(p.id)===String(pid))?.nome_completo||"Paciente"
pacientes[pid]={id:pid,nome:nome,itens:[]}
}
pacientes[pid].itens.push(m)
})

let hierarquia=parseInt(localStorage.getItem("usuario_hierarquia")||5)
let modo=window.MODO_MEDICACAO||""
let mostrarAcoes=(hierarquia===1&&(modo==="editar"||modo==="excluir"))

let html=""
/* 🔹 TOPO PROFISSIONAL CORRIGIDO */
html+=`
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:10px">

<div style="display:flex;gap:8px;flex-wrap:wrap">
<button onclick="abrirModalMedicacao()" style="background:#10b981;color:#fff;border:none;border-radius:6px;padding:6px 10px">➕ Nova</button>
<button onclick="editarMedicacaoGlobal()" style="background:#3b82f6;color:#fff;border:none;border-radius:6px;padding:6px 10px">✏️ Editar</button>
<button onclick="excluirMedicacaoGlobal()" style="background:#ef4444;color:#fff;border:none;border-radius:6px;padding:6px 10px">🗑️ Excluir</button>
<button onclick="cancelarModoMedicacao()" style="background:#6b7280;color:#fff;border:none;border-radius:6px;padding:6px 10px">❌ Cancelar</button>
</div>

<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
<button onclick="if(window.salvarMedicacoes) salvarMedicacoes()" style="background:#2563eb;color:#fff;border:none;border-radius:6px;padding:6px 12px;font-size:12px">💾 Salvar</button>
<button onclick="concluirPendentesMedicacao()" style="background:#16a34a;color:#fff;border:none;border-radius:6px;padding:6px 12px;font-size:12px">✔ Concluir Pendentes</button>
</div>

</div>
`
/* 🔹 PACIENTES */
Object.values(pacientes).sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR")).forEach(p=>{
let corPaciente=gerarCor(p.nome,60,92)
html+=`<div data-paciente-id="${p.id}" style="background:${corPaciente};padding:12px;margin-bottom:14px;border-radius:12px">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
<div class="paciente-header">
<div class="paciente-ficha">
<span class="icone">📋</span>
<span class="nome">${p.nome}</span>
</div>
</div>
${hierarquia===1?`<button onclick="concluirPacienteMedicacao('${p.id}')" style="background:#22c55e;color:#fff;border:none;border-radius:6px;padding:4px 8px;font-size:11px">✔ Concluir Paciente</button>`:""}
</div>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">`
let mapa={}

const limpar=txt=>{
return (txt||"").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g,"").replace(/mg|cp|cps|ml|ui/g,"").trim()
}

/* 🔹 AGRUPA MEDICAÇÕES */
p.itens.forEach(m=>{
const nomeBase=limpar(m.nome_medicamento)
const doseBase=(m.dosagem||"").toString().toLowerCase().trim()
const chave=nomeBase+"_"+doseBase

if(!mapa[chave]){
mapa[chave]={id:m.id,nome:m.nome_medicamento,dose:m.dosagem,paciente_id:p.id,horarios:new Set()}
}

let hs=(m.horarios||"").toString().split("|")
hs.forEach(h=>{
let n=normalizarHora(h)
if(n)mapa[chave].horarios.add(n)
})
})

let meds=Object.values(mapa).sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR"))

/* 🔹 MEDICAÇÕES */
meds.forEach(m=>{

let corMedicacao=gerarCor(m.nome,50,96)

let horarios=[...m.horarios].sort((a,b)=>{
let[p1,m1]=a.split(":")
let[p2,m2]=b.split(":")
return(p1*60+m1)-(p2*60+m2)
})

let hHTML=horarios.map(h=>{

let exec=(window.EXEC_CACHE||[]).find(e=>
String(e.medicacao_id)===String(m.id)&&
String(e.horario)===String(h)
)

/* 🔥 TURNO */
let hora=parseInt(h.split(":")[0])
let corBase="#fde047"
let icone="🌅"

if(hora>=12&&hora<18){corBase="#fb923c";icone="☀️"}
if(hora>=18||hora<5){corBase="#ef4444";icone="🌙"}

/* 🔥 EXECUTADO */
let cor=exec?"#22c55e":corBase

/* 🔒 BLOQUEIO */
let bloqueado=exec?"pointer-events:none;opacity:0.65;cursor:not-allowed;":""

/* 🔥 TEXTO */
let texto=exec?`${h} ${exec.usuario_nome||"Admin"} OK`:h

return `<button
data-hora="${h}" 
class="${exec ? 'executado' : ''}"
onclick="${exec?"":`administrarMedicacao('${m.id}','${h}',this)`}"
style="background:${cor};color:#000;border:none;border-radius:8px;padding:6px;font-size:11px;display:flex;flex-direction:column;align-items:center;min-width:70px;box-shadow:0 2px 4px rgba(0,0,0,0.15);${bloqueado}">
<span>${icone} ${texto}</span>
</button>`

}).join("")

html+=`<div style="background:${corMedicacao};padding:8px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
<div style="font-weight:600;font-size:12px;display:flex;justify-content:space-between">
<span>${m.nome}</span>
${mostrarAcoes?`<span style="display:flex;gap:6px">
<button onclick="editarMedicacao('${m.id}','${m.nome}','${m.dose||""}')" style="background:#3b82f6;color:#fff;border:none;border-radius:4px;font-size:10px;padding:2px 6px">✏️</button>
<button onclick="excluirMedicacao('${m.nome}','${m.dose||""}','${p.id}')" style="background:#ef4444;color:#fff;border:none;border-radius:4px;font-size:10px;padding:2px 6px">🗑️</button>
</span>`:""}
</div>

<div style="color:#555;font-size:11px;margin-bottom:6px">${m.dose||""}</div>
<div style="display:flex;flex-wrap:wrap;gap:6px">${hHTML}</div>

</div>`
})

html+=`</div></div>`
})

div.innerHTML=html
}
/* ====================================================
203 – ADMINISTRAR MEDICAÇÃO (TOGGLE CORRETO POR HORÁRIO)
==================================================== */
async function administrarMedicacao(medicacaoId,horario,botao){
if(!db||!medicacaoId||!horario)return
const user=obterUsuarioLogado()||{}
const dataHoje=new Date().toISOString().slice(0,10)
const usuarioId=user.id||null
const nome=user.nome||"Administrador"
/* 🔍 VERIFICA EXISTENTE EXATO */
const {data:ja}=await db
.from("medicacoes_execucao")
.select("*")
.eq("medicacao_id",medicacaoId)
.eq("data",dataHoje)
.eq("empresa_id",EMPRESA_ID)
.eq("horario",horario)
.maybeSingle()
/* 🔴 SE EXISTE → REMOVE */
if(ja){
const {error}=await db
.from("medicacoes_execucao")
.delete()
.eq("id",ja.id)
if(error){
console.error(error)
alert("Erro ao remover")
return
}
await carregarStatusMedicacoes()
return
}
/* 🟢 SE NÃO EXISTE → INSERE */
const {error}=await db
.from("medicacoes_execucao")
.insert({
medicacao_id:medicacaoId,
data:dataHoje,
horario:horario,
status:"executado",
usuario_id:usuarioId,
usuario_nome:nome,
empresa_id:EMPRESA_ID
})
if(error){
console.error(error)
alert("Erro ao salvar")
return
}
if(botao){
botao.classList.add("pulse-ok")
setTimeout(()=>botao.classList.remove("pulse-ok"),400)
}
await carregarStatusMedicacoes()
}
/* ====================================================
203C – CARREGAR STATUS
==================================================== */
async function carregarStatusMedicacoes(){
if(!db)return
const dataHoje=new Date().toISOString().slice(0,10)
const {data}=await db.from("medicacoes_execucao").select("*").eq("data",dataHoje)
window.EXEC_CACHE=data||[]
if(typeof carregarMedicacoes==="function")carregarMedicacoes()
}
/* ====================================================
205 – BUSCAR MODELO INTELIGENTE
==================================================== */
async function buscarModeloMedicacao(nome){
if(!db||!nome)return null

const {data}=await db
.from("medicacoes_modelo")
.select("*")
.ilike("nome_medicamento",`%${nome}%`)
.limit(1)

return data?.[0]||null
}
/* ====================================================
205 – BUSCAR MODELO MEDICAÇÃO
==================================================== */
async function buscarModeloMedicacao(nome){
if(!db||!nome)return null
const {data}=await db
.from("medicacoes_modelo")
.select("*")
.ilike("nome_medicamento",`%${nome}%`)
.limit(1)
return data?.[0]||null
}

/* ====================================================
206 – APLICAR MODELO AUTOMÁTICO
==================================================== */
async function aplicarModeloAutomatico(inputNome,inputDose,inputHorario){
const modelo=await buscarModeloMedicacao(inputNome.value)
if(!modelo)return
if(!inputDose.value && modelo.dosagem_padrao){
inputDose.value=modelo.dosagem_padrao
}
if(modelo.horarios_padrao){
inputHorario.value=modelo.horarios_padrao
}
}
/* ====================================================
207 – SALVAR NOVA MEDICAÇÃO (FINAL CORRIGIDO + HORÁRIO PADRÃO)
==================================================== */
async function salvarNovaMedicacao(){
if(!db||!EMPRESA_ID)return
const nome=(document.getElementById("nomeMedicacao").value||"").trim().toUpperCase()
const dose=(document.getElementById("doseMedicacao").value||"").trim().toUpperCase()
const selecionados=[...document.querySelectorAll("#horarioMedicacao .ativo")]
.map(e=>e.dataset.valor)
let horario=selecionados.join("|")
if(!horario){
alert("Selecione pelo menos um horário")
return
}
const pacienteId=document.getElementById("buscaPacienteMedicacao")?.value
if(!nome||!pacienteId||pacienteId==="todos"){
alert("Informe paciente e nome")
return
}
/* 🔥 NORMALIZA HORÁRIOS (ACEITA MULTIPLOS COM | ) */
const horarioFinal=horario.split("|").map(h=>{
h=h.trim()
if(!h)return""
if(!h.includes(":"))return h.padStart(2,"0")+":00"
let[p,m]=h.split(":")
return p.padStart(2,"0")+":"+m.padStart(2,"0")
}).filter(h=>h).join("|")
if(!horarioFinal){
alert("Informe ao menos um horário")
return
}
/* 🔥 NOME PADRÃO */
const nomeLimpo=nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g,"").replace(/mg|cp|cps|ml|ui/g,"").trim()
/* 🔍 EVITA DUPLICADO */
const {data:existe}=await db.from("medicacoes").select("id").eq("empresa_id",EMPRESA_ID).eq("nome_padrao",nomeLimpo).eq("dosagem",dose||"").eq("paciente_id",pacienteId).maybeSingle()
if(existe){
alert("Medicação já cadastrada")
return
}
/* 💾 INSERT */
const {error}=await db.from("medicacoes").insert({
nome_medicamento:nome,
dosagem:dose,
horarios:horarioFinal,
empresa_id:EMPRESA_ID,
nome_padrao:nomeLimpo,
paciente_id:pacienteId,
ativo:true
})
if(error){
console.error("Erro ao salvar:",error)
alert("Erro ao salvar medicação")
return
}
/* 🔄 RELOAD */
carregarMedicacoes()
document.getElementById("nomeMedicacao").value=""
document.getElementById("doseMedicacao").value=""
document.getElementById("horarioMedicacao").value=""
}
/* ====================================================
208 – CARREGAR LISTA DE HORÁRIOS (FINAL AJUSTADO)
==================================================== */
function carregarListaHorarios(){
const select=document.getElementById("horarioMedicacao")
if(!select)return
select.innerHTML=""
for(let h=6;h<=23;h++){
let hora=h.toString().padStart(2,"0")+":00"
let opt=document.createElement("option")
opt.value=hora
opt.textContent=hora
select.appendChild(opt)
}
let opt=document.createElement("option")
opt.value="00:00"
opt.textContent="00:00"
select.appendChild(opt)
}
/* ====================================================
209 – GERAR COR POR TEXTO (PACIENTE / MEDICAÇÃO)
==================================================== */
function gerarCor(texto, saturacao=70, luminosidade=85){
let hash=0
for(let i=0;i<texto.length;i++){
hash=texto.charCodeAt(i)+((hash<<5)-hash)
}
let hue=hash%360
return `hsl(${hue},${saturacao}%,${luminosidade}%)`
}
/* ====================================================
210 – BARRA DE PROGRESSO GLOBAL
==================================================== */
function iniciarBarra(total){
const c=document.getElementById("barraProgressoContainer")
const b=document.getElementById("barraProgresso")
if(!c||!b)return
c.style.display="block"
b.style.width="0%"
b.style.background="#ef4444" // começa vermelho
window.__barraTotal=total
window.__barraAtual=0
}

function atualizarBarra(){
const b=document.getElementById("barraProgresso")
if(!b)return
window.__barraAtual++
let p=(window.__barraAtual/window.__barraTotal)*100
b.style.width=p+"%"
/* 🎨 COR DINÂMICA */
let cor="#ef4444" // vermelho
if(p>30&&p<=70){
cor="#facc15" // amarelo
}
if(p>70){
cor="#22c55e" // verde
}
b.style.background=cor
}

function finalizarBarra(){
setTimeout(()=>{
const c=document.getElementById("barraProgressoContainer")
if(c)c.style.display="none"
},500)
}
/* ====================================================
211 – FUNÇÕES ADMIN (OBRIGATÓRIO)
==================================================== */
function abrirModalMedicacao(){
window.MODO_MEDICACAO="novo"
alert("Modo NOVA medicação ativo")
}
function editarMedicacaoGlobal(){
window.MODO_MEDICACAO="editar"
carregarMedicacoes()
alert("Modo edição ativado\nClique em um horário")
}
function excluirMedicacaoGlobal(){
window.MODO_MEDICACAO="excluir"
carregarMedicacoes()
alert("Modo exclusão ativado")
}
/* ====================================================
211A – Cancelar Modo Medicação
==================================================== */
function cancelarModoMedicacao(){
window.MODO_MEDICACAO=""
carregarMedicacoes()
}

/* ====================================================
212 – CONCLUIR MEDICAÇÃO POR PACIENTE (FINAL CORRETO)
==================================================== */
window.concluirPacienteMedicacao=async function(pacienteId){
if(!db||!pacienteId)return

const user=obterUsuarioLogado()||{}
const d1=document.getElementById("dataInicioMedicacao")
const d2=document.getElementById("dataFimMedicacao")

let dataInicio=d1?.value
let dataFim=d2?.value

/* 🔥 GARANTE DATA SEM TRAVAR */
if(!dataInicio||!dataFim){
const hoje=new Date().toISOString().slice(0,10)
dataInicio=hoje
dataFim=hoje
if(d1)d1.value=hoje
if(d2)d2.value=hoje
}

const datas=gerarDatasPeriodo(dataInicio,dataFim)
const usuarioId=user.id||null
const nome=user.nome||"Administrador"

/* 🔥 MEDICAÇÕES DO PACIENTE */
const meds=(window.MEDICACOES_CACHE||[]).filter(m=>String(m.paciente_id)===String(pacienteId))
console.log("📦 Medicações encontradas:",meds.length)
if(!meds.length){
alert("Nenhuma medicação encontrada")
return
}

/* 🔒 BASE SEM DATA */
let base=[]
let totalAplicacoes=0
let totalJaExistentes=0
meds.forEach(m=>{
let horarios=(m.horarios||"").toString().split("|")

horarios.forEach(h=>{
if(!h)return

h=h.toString().trim()
if(!h.includes(":"))h=h.padStart(2,"0")+":00"

base.push({
medicacao_id:m.id,
horario:h,
status:"executado",
usuario_id:usuarioId,
usuario_nome:nome,
empresa_id:EMPRESA_ID
})

})
})

/* 🔒 EXECUTA POR PERÍODO */
for(const dataHoje of datas){

for(const itemBase of base){

let item={
...itemBase,
data:dataHoje
}

const {data:existe}=await db
.from("medicacoes_execucao")
.select("id")
.eq("medicacao_id",item.medicacao_id)
.eq("data",item.data)
.eq("horario",item.horario)
.eq("empresa_id",item.empresa_id)
.maybeSingle()

if(existe){
totalJaExistentes++
continue
}
const {error}=await db
.from("medicacoes_execucao")
.insert(item)
totalAplicacoes++
if(error){
console.error(error)
alert("Erro ao concluir paciente")
return
}
/* 🔥 PATCH 043 — ATUALIZA CACHE IMEDIATO */
if(!window.EXEC_CACHE)window.EXEC_CACHE=[]
window.EXEC_CACHE.push(item)
}
}
let totalGeral=0
let totalFeito=0

for(const dataHoje of datas){
for(const itemBase of base){

totalGeral++

const jaExiste=await db
.from("medicacoes_execucao")
.select("id")
.eq("medicacao_id",itemBase.medicacao_id)
.eq("data",dataHoje)
.eq("horario",itemBase.horario)
.eq("empresa_id",itemBase.empresa_id)
.maybeSingle()

if(jaExiste?.data){
totalFeito++
}

}
}

console.log("✅ Progresso:",totalFeito,"/",totalGeral)

/* 🔥 STATUS VISUAL */
setTimeout(()=>{
marcarPacienteCompleto(pacienteId,totalFeito,totalGeral)
},300)
/* 🔄 ATUALIZA */
await carregarStatusMedicacoes()

/* 🔥 FORÇA RE-RENDER IMEDIATO */
setTimeout(()=>{
renderizarMedicacoes(window.MEDICACOES_CACHE||[])
},100)
}
/* ====================================================
213 – EDITAR MEDICAÇÃO (FUNCIONAL)
==================================================== */
async function editarMedicacao(nome,dose,pacienteId){
let novoNome=prompt("Nome:",nome||"")
if(novoNome===null)return
novoNome=novoNome.trim()
if(!novoNome){alert("Nome obrigatório");return}
let novaDose=prompt("Dosagem:",dose||"")
if(novaDose===null)return
novaDose=novaDose.trim()
try{
const {error}=await db.from("medicacoes")
.update({
nome_medicamento:novoNome,
dosagem:novaDose||null
})
.eq("paciente_id",pacienteId)
.eq("nome_medicamento",nome)
.eq("dosagem",dose||null)
if(error){console.error(error);alert("Erro ao editar");return}
carregarMedicacoes()
}catch(e){
console.error(e)
alert("Erro inesperado")
}
}
/* ====================================================
214 – EXCLUIR MEDICAÇÃO (CORRIGIDO DEFINITIVO)
==================================================== */
async function excluirMedicacao(nome,dose,pacienteId){
if(!pacienteId){alert("Paciente inválido");return}
if(!confirm("Excluir esta medicação?"))return
try{
let query=db.from("medicacoes").delete().eq("paciente_id",pacienteId).ilike("nome_medicamento",nome)
if(dose && dose.trim()!==""){
query=query.ilike("dosagem",dose)
}else{
query=query.is("dosagem",null)
}
const {error}=await query
if(error){console.error(error);alert("Erro ao excluir");return}
carregarMedicacoes()
}catch(e){
console.error(e)
alert("Erro inesperado")
}
}
/* ====================================================
222 – CONCLUIR PENDENTES MEDICACAO (FINAL TURBO)
==================================================== */
window.concluirPendentesMedicacao=async function(){
if(!db)return

const user=obterUsuarioLogado()||{}
const dataInicio=document.getElementById("dataInicioMedicacao")?.value
const dataFim=document.getElementById("dataFimMedicacao")?.value

if(!dataInicio||!dataFim){
alert("Informe período")
return
}

const datas=gerarDatasPeriodo(dataInicio,dataFim)

const lista=window.MEDICACOES_CACHE||[]
if(!lista.length){
alert("Nenhuma medicação encontrada")
return
}

/* 🔥 BASE */
let base=[]

lista.forEach(m=>{
let horarios=(m.horarios||"").toString().split("|")
horarios.forEach(h=>{
if(!h)return
h=h.toString().trim()
if(!h.includes(":"))h=h.padStart(2,"0")+":00"
base.push({
medicacao_id:m.id,
horario:h,
empresa_id:EMPRESA_ID
})
})
})

if(!base.length){
alert("Nada para concluir")
return
}

/* 🔥 CONTROLE */
let total=base.length * datas.length
let atual=0

iniciarBarra(total)

/* 🔥 LOOP */
for(const dataHoje of datas){

for(const itemBase of base){

let item={
...itemBase,
data:dataHoje,
status:"executado",
usuario_id:user.id||null,
usuario_nome:user.nome||"Admin"
}

/* 🔒 VERIFICA */
const {data:existe}=await db
.from("medicacoes_execucao")
.select("id")
.eq("medicacao_id",item.medicacao_id)
.eq("data",item.data)
.eq("horario",item.horario)
.eq("empresa_id",item.empresa_id)
.maybeSingle()

if(!existe){

await db.from("medicacoes_execucao").insert(item)

/* 🔥 ATIVA UI (BOTÃO VERDE) */
const btn=document.querySelector(
`[data-id="${item.medicacao_id}"][data-hora="${item.horario}"]`
)

if(btn){
btn.classList.add("ok")
btn.style.background="#22c55e"
btn.style.color="#fff"
btn.innerText=`${item.horario} ${user.nome||"Admin"} OK`
}

}

atual++
atualizarBarra(atual,total)

}
}

/* 🔥 FINAL */
finalizarBarra()

await carregarStatusMedicacoes()
}
/* ====================================================
223 GERAR DATAS MEDICACAO
==================================================== */
function gerarDatasPeriodo(inicio,fim){
let datas=[]
let atual=new Date(inicio)
let final=new Date(fim)

while(atual<=final){
datas.push(atual.toISOString().slice(0,10))
atual.setDate(atual.getDate()+1)
}
return datas
}
/* ====================================================
230 – DATA INTELIGENTE
==================================================== */
function aplicarDataInteligente(){

const hoje=new Date()
const inicio=hoje.toISOString().slice(0,10)

/* +7 dias */
const fimDate=new Date()
fimDate.setDate(fimDate.getDate()+7)
const fim=fimDate.toISOString().slice(0,10)

const d1=document.getElementById("dataInicioMedicacao")
const d2=document.getElementById("dataFimMedicacao")

if(d1&&!d1.value)d1.value=inicio
if(d2&&!d2.value)d2.value=fim
}
/* ====================================================
231 – SET PERIODO DIAS - MEDICACAO
==================================================== */
function setPeriodoDias(dias){

const hoje=new Date()
const inicio=hoje.toISOString().slice(0,10)

const fimDate=new Date()
fimDate.setDate(fimDate.getDate()+dias-1)
const fim=fimDate.toISOString().slice(0,10)

document.getElementById("dataInicioMedicacao").value=inicio
document.getElementById("dataFimMedicacao").value=fim
}
/* ====================================================
232 – DATA FIXA HOJE (SEMPRE)
==================================================== */
function forcarDataHoje(){

const hoje=new Date().toISOString().slice(0,10)

const d1=document.getElementById("dataInicioMedicacao")
const d2=document.getElementById("dataFimMedicacao")

if(d1)d1.value=hoje
if(d2)d2.value=hoje
}
/* ====================================================
233 – FILTRAR MEDICAÇÃO POR PERÍODO
==================================================== */
async function filtrarPeriodoMedicacao(){
if(!db)return
const dataInicio=document.getElementById("dataInicioMedicacao")?.value
const dataFim=document.getElementById("dataFimMedicacao")?.value
if(!dataInicio||!dataFim){
alert("Informe período")
return
}
/* 🔥 BUSCA EXECUÇÕES */
const {data:exec}=await db
.from("medicacoes_execucao")
.select("*")
.gte("data",dataInicio)
.lte("data",dataFim)
window.EXEC_CACHE=exec||[]
/* 🔄 RECARREGA TELA */
carregarMedicacoes()
}
/* ====================================================
234 – MARCAR PACIENTE COMPLETO
==================================================== */
function marcarPacienteCompleto(pacienteId,feito,total){
const cards=document.querySelectorAll("[data-paciente-id]")
cards.forEach(card=>{
const id=card.dataset.pacienteId
/* 🔥 CALCULA EXECUÇÃO REAL DO CARD */
const botoes=card.querySelectorAll("button[data-hora]")
let totalCard=botoes.length
let feitosCard=0
botoes.forEach(btn=>{
if(btn.classList.contains("executado")){
feitosCard++
}
})
/* 🔥 100% COMPLETO */
if(totalCard>0 && feitosCard>=totalCard){
card.style.background="#dcfce7"
card.style.border="2px solid #22c55e"
/* 🔘 BOTÃO */
const btnAcao=card.querySelector("button[onclick*='concluirPacienteMedicacao']")
if(btnAcao){
btnAcao.innerText="✔ Completo"
btnAcao.style.background="#16a34a"
}
/* 🏷️ BADGE */
let badge=card.querySelector(".badge-status")
if(!badge){
badge=document.createElement("div")
badge.className="badge-status"
badge.style.fontSize="11px"
badge.style.marginTop="4px"
card.prepend(badge)
}
badge.innerText=`${feitosCard}/${totalCard} ✔`
}else{
/* 🔶 PARCIAL */
card.style.background=""
card.style.border="2px solid #facc15"
/* 🔘 BOTÃO VOLTA */
const btnAcao=card.querySelector("button[onclick*='concluirPacienteMedicacao']")
if(btnAcao){
btnAcao.innerText="✔ Concluir Paciente"
btnAcao.style.background="#22c55e"
}
/* 🏷️ BADGE */
let badge=card.querySelector(".badge-status")
if(!badge){
badge=document.createElement("div")
badge.className="badge-status"
badge.style.fontSize="11px"
badge.style.marginTop="4px"
card.prepend(badge)
}
badge.innerText=`${feitosCard}/${totalCard}`
}
})
}
/* ====================================================
235 – GERAR HORÁRIOS VISUAL (CLIQUE)
==================================================== */
function montarHorariosMedicacao(){
const container=document.getElementById("horarioMedicacao")
if(!container)return
container.innerHTML=""

for(let h=0;h<=23;h++){
const hora=h.toString().padStart(2,"0")+":00"

const btn=document.createElement("div")
btn.innerText=hora
btn.dataset.valor=hora

btn.style.padding="6px"
btn.style.border="1px solid #ddd"
btn.style.borderRadius="6px"
btn.style.textAlign="center"
btn.style.cursor="pointer"
btn.style.background="#f3f4f6"
btn.style.userSelect="none"

btn.onclick=function(){
if(btn.classList.contains("ativo")){
btn.classList.remove("ativo")
btn.style.background="#f3f4f6"
btn.style.color="#000"
}else{
btn.classList.add("ativo")
btn.style.background="#22c55e"
btn.style.color="#fff"
}
}
container.appendChild(btn)
}
}
/* ====================================================
236 – INIT HORÁRIOS (AUTOLOAD)
==================================================== */
document.addEventListener("DOMContentLoaded",()=>{
montarHorariosMedicacao()
})
/* ====================================================
237 – BARRA PROGRESSO MEDICAÇÃO
==================================================== */
function atualizarBarraMedicacao(atual,total){
let container=document.getElementById("barraProgressoMedicacao")
if(!container){
container=document.createElement("div")
container.id="barraProgressoMedicacao"
container.style.position="fixed"
container.style.top="10px"
container.style.right="10px"
container.style.width="200px"
container.style.height="10px"
container.style.background="#fee2e2"
container.style.borderRadius="6px"
container.style.overflow="hidden"
container.style.zIndex="9999"
const barra=document.createElement("div")
barra.id="barraInternaMedicacao"
barra.style.height="100%"
barra.style.width="0%"
barra.style.background="#ef4444"
barra.style.transition="0.3s"
container.appendChild(barra)
document.body.appendChild(container)
}
const barra=document.getElementById("barraInternaMedicacao")
const perc=Math.round((atual/total)*100)
barra.style.width=perc+"%"
if(perc>70)barra.style.background="#22c55e"
else if(perc>30)barra.style.background="#facc15"
else barra.style.background="#ef4444"
if(perc>=100){
setTimeout(()=>{
container.remove()
},800)
}
}
/* ====================================================
238 090 – TOGGLE HORÁRIOS MEDICAÇÃO
==================================================== */
function toggleHorariosMedicacao(){
const box=document.getElementById("boxHorariosMedicacao")
if(!box)return
box.style.display=(box.style.display==="none")?"block":"none"
}
