/* ====================================================
200 – CARREGAR MEDICAÇÕES (NOVO PADRÃO PROFISSIONAL)
==================================================== */
async function carregarMedicacoes(){
if(!db||!EMPRESA_ID)return
const pacienteId=document.getElementById("buscaPacienteMedicacao")?.value||"todos"

/* 🔹 QUERY */
let query=db
.from("medicacoes")
.select("*")
.eq("ativo",true)

/* 🔹 FILTRO */
if(pacienteId!=="todos"){
query=query.eq("paciente_id",pacienteId)
}

const {data,error}=await query

if(error){
console.error(error)
renderizarMedicacoes([])
return
}

/* 🔥 ORDENAÇÃO ALFABÉTICA */
data.sort((a,b)=>{
return (a.nome_medicamento||"").localeCompare(b.nome_medicamento||"","pt-BR")
})

renderizarMedicacoes(data||[])
}
/* ====================================================
201 – RENDER MEDICAÇÕES (UNIFICADO + ORDENADO)
==================================================== */
function renderizarMedicacoes(lista){
const div=document.getElementById("listaMedicacoes")
if(!div)return

const normalizarHora=h=>{
if(!h)return""
h=h.toString().trim()
if(!h.includes(":"))return h.padStart(2,"0")+":00"
let[p,m]=h.split(":")
return p.padStart(2,"0")+":"+m.padStart(2,"0")
}

/* 🔥 AGRUPAMENTO CORRETO */
let mapa={}

lista.forEach(m=>{
const chave=`${m.paciente_id}_${m.nome_medicamento}_${m.dosagem}`

if(!mapa[chave]){
mapa[chave]={
nome:m.nome_medicamento,
dose:m.dosagem,
paciente_id:m.paciente_id,
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

/* 🔥 ORDENA ALFABÉTICO */
meds.sort((a,b)=>{
return (a.nome||"").localeCompare(b.nome||"","pt-BR")
})

/* 🔥 HTML */
let html=""

meds.forEach(m=>{

/* 🔥 ORDENA HORÁRIOS */
let horarios=[...m.horarios].sort((a,b)=>{
let [h1,m1]=a.split(":")
let [h2,m2]=b.split(":")
return (h1*60+m1)-(h2*60+m2)
})

let hHTML=horarios.map(h=>`
<span style="background:#22c55e;color:#fff;padding:4px 6px;border-radius:6px;font-size:11px">
${h}
</span>
`).join(" ")

html+=`
<div style="padding:10px;border-bottom:1px solid #eee">
<div style="font-weight:bold">${m.nome} <span style="color:#666">${m.dose||""}</span></div>
<div style="margin-top:4px">${hHTML}</div>
</div>
`
})

div.innerHTML=html
}
/* ====================================================
202 – RENDER MEDICAÇÕES (CORRIGIDO DEFINITIVO V2)
==================================================== */
function renderizarMedicacoes(lista){
const div=document.getElementById("listaMedicacoes")
if(!div)return
if(!lista)lista=[]
const hierarquia=parseInt(localStorage.getItem("usuario_hierarquia")||5)
const podeEditar=hierarquia===1
const cores=["#f0f9ff","#fefce8","#f0fdf4","#fff7ed","#fdf2f8","#eef2ff"]

const normalizarHora=h=>{
if(!h)return""
h=h.toString().trim().toUpperCase()
if(h==="JEJUM"||h==="ALMOÇO")return h
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

/* ====================================================
🔹 MAPA PACIENTES
==================================================== */
const pacientes={}
;(window.PACIENTES_CACHE||[]).forEach(p=>{
const id=(p.id||"").toString().trim()
pacientes[id]={
id:id,
nome:p.nome_completo,
itens:[]
}
})

/* ====================================================
🔹 VINCULAR MEDICAÇÕES
==================================================== */
lista.forEach(m=>{
const pid=(m.paciente_id||"").toString().trim()
if(!pacientes[pid]){
pacientes[pid]={
id:pid,
nome:"Paciente Não Identificado",
itens:[]
}
}
pacientes[pid].itens.push(m)
})

let html=""

/* ====================================================
🔹 BOTÕES ADMIN
==================================================== */
if(podeEditar){
html+=`<div style="display:flex;gap:8px;margin-bottom:10px">
<button onclick="abrirModalMedicacao()" style="background:#10b981;color:#fff;border:none;border-radius:6px;padding:6px 10px;font-size:12px">➕ Nova</button>
<button onclick="editarMedicacaoGlobal()" style="background:#3b82f6;color:#fff;border:none;border-radius:6px;padding:6px 10px;font-size:12px">✏️ Editar</button>
<button onclick="excluirMedicacaoGlobal()" style="background:#ef4444;color:#fff;border:none;border-radius:6px;padding:6px 10px;font-size:12px">🗑️ Excluir</button>
</div>`
}

let idx=0

/* ====================================================
🔹 LOOP PACIENTES
==================================================== */
Object.values(pacientes).forEach(p=>{
const cor=cores[idx%cores.length]
idx++

let medsUnicos={}

/* ====================================================
🔹 AGRUPAMENTO CORRETO (NOME + DOSE)
==================================================== */
p.itens.forEach(m=>{
const chave=`${limpar(m.nome_medicamento)}_${limpar(m.dosagem)}`

if(!medsUnicos[chave]){
medsUnicos[chave]={
id:m.id,
nome_medicamento:m.nome_medicamento,
dosagem:m.dosagem,
paciente_id:m.paciente_id,
horarios_set:new Set()
}
}

/* 🔹 HORÁRIOS */
let listaHorarios=[]

if(Array.isArray(m.horarios)){
listaHorarios=m.horarios
}else if(m.horarios){
listaHorarios=m.horarios.toString().split("|")
}

/* 🔥 fallback número */
if(typeof m.horarios==="number"){
listaHorarios=[m.horarios.toString().padStart(2,"0")+":00"]
}

listaHorarios.forEach(h=>{
let hNorm=normalizarHora(h)
if(hNorm)medsUnicos[chave].horarios_set.add(hNorm)
})
})

/* ====================================================
🔹 FINAL LISTA + ORDENAÇÕES
==================================================== */
let listaFinal=Object.values(medsUnicos).map(m=>{
m.horarios=[...m.horarios_set]
.sort((a,b)=>{
const toMin=t=>{
if(t==="JEJUM")return -10
if(t==="ALMOÇO")return 720
let[p,m]=t.split(":")
return parseInt(p)*60+parseInt(m)
}
return toMin(a)-toMin(b)
})
return m
})

/* 🔥 ORDENA ALFABÉTICO */
listaFinal.sort((a,b)=>{
return (a.nome_medicamento||"").localeCompare(b.nome_medicamento||"","pt-BR")
})

/* ====================================================
🔹 HTML
==================================================== */
html+=`<div style="background:${cor};padding:12px;margin-bottom:14px;border-radius:12px">
<div style="font-weight:600;font-size:14px;margin-bottom:10px">👤 ${p.nome}</div>`

if(!listaFinal.length){
html+=`<div style="font-size:11px;color:#999">Sem medicação</div></div>`
return
}

html+=`<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">`

listaFinal.forEach(m=>{
let horariosHTML=m.horarios.map(h=>{
let exec=(window.EXEC_CACHE||[]).find(e=>e.horario===h&&e.medicacao_id===m.id)
let corBtn=exec?"#22c55e":"#f87171"
let usuarioExec=exec?.usuario_nome||""
return `<button onclick="window.MODO_MEDICACAO==='editar'?editarHorario('${m.id}','${h}',this):administrarMedicacao('${m.id}','${h}',this)" style="background:${corBtn};color:#fff;border:none;border-radius:6px;font-size:10px;padding:4px 6px">
${h}${usuarioExec?`<div style="font-size:8px">${usuarioExec}</div>`:""}
</button>`
}).join("")

html+=`<div style="border-bottom:1px solid #ddd;padding-bottom:6px">
<div style="font-size:12px;font-weight:600">
<span onclick="editarNomeMedicacao('${m.id}', \`${m.nome_medicamento||""}\`, \`${m.dosagem||""}\`)">
${m.nome_medicamento||""}
</span>
<span style="color:#666;font-weight:400">${m.dosagem||""}</span>
</div>
<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">
${horariosHTML}
</div>
</div>`
})

html+=`</div></div>`
})

div.innerHTML=html
}
