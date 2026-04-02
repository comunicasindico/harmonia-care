/* ====================================================
200 – CARREGAR PACIENTES MEDICAÇÃO
==================================================== */
async function carregarPacientesMedicacao(){
if(!db||!EMPRESA_ID)return
const select=document.getElementById("buscaPacienteMedicacao")
if(!select)return
const usuarioId=localStorage.getItem("usuario_id")||null
const hierarquia=parseInt(localStorage.getItem("usuario_hierarquia")||5)

let query=db
.from("pacientes")
.select("*")
.eq("empresa_id",EMPRESA_ID)
.eq("ativo",true)

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
const {data:rel}=await db
.from("pacientes_profissionais")
.select("paciente_id")
.eq("usuario_id",usuarioId)
.eq("ativo",true)

pacientesPermitidos=rel?.map(r=>r.paciente_id)||[]

if(!pacientesPermitidos.length){
renderizarMedicacoes([])
return
}
}

let query=db
.from("medicacoes")
.select("*")
.eq("ativo",true)

if(pacientesPermitidos){
query=query.in("paciente_id",pacientesPermitidos)
}

if(pacienteId!=="todos"){
query=query.eq("paciente_id",pacienteId)
}

const {data,error}=await query

if(error){
renderizarMedicacoes([])
return
}

renderizarMedicacoes(data||[])
}

/* ====================================================
202 – RENDER MEDICAÇÕES (FINAL)
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

const limpar=txt=>{
return (txt||"")
.toString()
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g,"")
.replace(/\s+/g,"")
.replace(/mg|cp|cps|ml|ui/g,"")
.trim()
}

let mapa={}

lista.forEach(m=>{
const chave=`${limpar(m.nome_medicamento)}_${limpar(m.dosagem)}`

if(!mapa[chave]){
mapa[chave]={
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

meds.sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR"))

let html=""

meds.forEach(m=>{
let horarios=[...m.horarios].sort((a,b)=>{
let [h1,m1]=a.split(":")
let [h2,m2]=b.split(":")
return (h1*60+m1)-(h2*60+m2)
})

html+=`
<div style="padding:10px;border-bottom:1px solid #eee">
<div style="font-weight:bold">${m.nome} <span style="color:#666">${m.dose||""}</span></div>
<div style="margin-top:4px">
${horarios.join(" ")}
</div>
</div>
`
})

div.innerHTML=html
}
