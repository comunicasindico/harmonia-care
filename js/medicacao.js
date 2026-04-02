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
if(pacienteId!=="todos")query=query.eq("paciente_id",pacienteId)
const {data,error}=await query
if(error){
renderizarMedicacoes([])
return
}
renderizarMedicacoes(data||[])
}
/* ====================================================
202 – RENDER MEDICAÇÕES POR PACIENTE
==================================================== */
function renderizarMedicacoes(lista){
const div=document.getElementById("listaMedicacoes")
if(!div)return
if(!lista)lista=[]

const normalizarHora=h=>{
if(!h)return""
h=h.toString().trim()
if(!h.includes(":"))return h.padStart(2,"0")+":00"
let[p,m]=h.split(":")
return p.padStart(2,"0")+":"+m.padStart(2,"0")
}

/* 🔥 AGRUPAR POR PACIENTE */
let pacientes={}

lista.forEach(m=>{
let pid=m.paciente_id||"0"

if(!pacientes[pid]){
let nome=(window.PACIENTES_CACHE||[]).find(p=>p.id==pid)?.nome_completo||"Paciente"
pacientes[pid]={nome:nome,itens:[]}
}

pacientes[pid].itens.push(m)
})

let html=""

/* 🔥 BOTÕES */
html+=`
<div style="display:flex;gap:8px;margin-bottom:10px">
<button onclick="abrirModalMedicacao()" style="background:#10b981;color:#fff;border:none;border-radius:6px;padding:6px 10px">➕ Nova</button>
<button onclick="editarMedicacaoGlobal()" style="background:#3b82f6;color:#fff;border:none;border-radius:6px;padding:6px 10px">✏️ Editar</button>
<button onclick="excluirMedicacaoGlobal()" style="background:#ef4444;color:#fff;border:none;border-radius:6px;padding:6px 10px">🗑️ Excluir</button>
</div>
`

/* 🔥 LOOP PACIENTES */
Object.values(pacientes).forEach(p=>{

html+=`<div style="background:#f9fafb;padding:10px;margin-bottom:12px;border-radius:10px">
<div style="font-weight:bold;margin-bottom:6px">👤 ${p.nome}</div>`

/* 🔥 AGRUPAR MEDICAÇÃO */
let mapa={}

p.itens.forEach(m=>{
const chave=m.nome_medicamento+"_"+(m.dosagem||"")

if(!mapa[chave]){
mapa[chave]={
id:m.id,
nome:m.nome_medicamento,
dose:m.dosagem,
horarios:new Set()
}
}

let hs=(m.horarios||"").toString().split("|")

hs.forEach(h=>{
let n=normalizarHora(h)
if(n)mapa[chave].horarios.add(n)
})
})

let meds=Object.values(mapa)

meds.forEach(m=>{

let horarios=[...m.horarios].sort((a,b)=>{
let[p1,m1]=a.split(":")
let[p2,m2]=b.split(":")
return(p1*60+m1)-(p2*60+m2)
})

let hHTML=horarios.map(h=>{
return `<span style="background:#ef4444;color:#fff;padding:4px 6px;border-radius:6px;margin-right:4px">${h}</span>`
}).join("")

html+=`
<div style="margin-bottom:8px">
<div style="font-weight:600">${m.nome} <span style="color:#666">${m.dose||""}</span></div>
<div style="margin-top:4px">${hHTML}</div>
</div>
`
})

html+=`</div>`
})

div.innerHTML=html
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
207 – SALVAR NOVA MEDICAÇÃO
==================================================== */
async function salvarNovaMedicacao(){
if(!db||!EMPRESA_ID)return

const nome=document.getElementById("nomeMedicacao").value
const dose=document.getElementById("doseMedicacao").value
const horario=document.getElementById("horarioMedicacao").value
const pacienteId=document.getElementById("buscaPacienteMedicacao")?.value

if(!nome||!pacienteId||pacienteId==="todos"){
alert("Informe paciente e nome")
return
}

await db.from("medicacoes").insert({
paciente_id:pacienteId,
nome_medicamento:nome,
dosagem:dose,
horarios:horario,
empresa_id:EMPRESA_ID,
ativo:true
})

carregarMedicacoes()

document.getElementById("nomeMedicacao").value=""
document.getElementById("doseMedicacao").value=""
document.getElementById("horarioMedicacao").value=""
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
alert("Modo edição ativado\nClique em um horário")
}

function excluirMedicacaoGlobal(){
window.MODO_MEDICACAO="excluir"
alert("Modo exclusão ativado")
}
