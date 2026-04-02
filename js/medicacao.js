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
202 – RENDER MEDICAÇÕES (LAYOUT CLÍNICO)
==================================================== */
function renderizarMedicacoes(lista){
const div=document.getElementById("listaMedicacoes")
if(!div)return
if(!lista)lista=[]
const hierarquia=parseInt(localStorage.getItem("usuario_hierarquia")||5)
const podeEditar=hierarquia===1
const normalizarHora=h=>{
if(!h)return""
h=h.toString().trim()
if(!h.includes(":"))return h.padStart(2,"0")+":00"
let[p,m]=h.split(":")
return p.padStart(2,"0")+":"+m.padStart(2,"0")
}
const limpar=txt=>{
return (txt||"").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g,"").replace(/mg|cp|cps|ml|ui/g,"").trim()
}
let pacientes={}
lista.forEach(m=>{
let pid=m.paciente_id
if(!pacientes[pid]){
let nome=(window.PACIENTES_CACHE||[]).find(p=>p.id===pid)?.nome_completo||"Paciente"
pacientes[pid]={nome:nome,itens:[]}
}
pacientes[pid].itens.push(m)
})
let html=""
if(podeEditar){
html+=`<div style="display:flex;gap:8px;margin-bottom:10px">
<button onclick="abrirModalMedicacao()" style="background:#10b981;color:#fff;border:none;border-radius:6px;padding:6px 10px;font-size:12px">➕ Nova</button>
<button onclick="editarMedicacaoGlobal()" style="background:#3b82f6;color:#fff;border:none;border-radius:6px;padding:6px 10px;font-size:12px">✏️ Editar</button>
<button onclick="excluirMedicacaoGlobal()" style="background:#ef4444;color:#fff;border:none;border-radius:6px;padding:6px 10px;font-size:12px">🗑️ Excluir</button>
</div>`
}
Object.values(pacientes).forEach(p=>{
html+=`<div style="background:#f9fafb;padding:12px;margin-bottom:12px;border-radius:10px">
<div style="font-weight:bold;margin-bottom:8px">👤 ${p.nome}</div>`
let mapa={}
p.itens.forEach(m=>{
const chave=`${limpar(m.nome_medicamento)}_${limpar(m.dosagem)}`
if(!mapa[chave]){
mapa[chave]={id:m.id,nome:m.nome_medicamento,dose:m.dosagem,horarios:new Set()}
}
let hs=(m.horarios||"").toString().split("|")
hs.forEach(h=>{
let n=normalizarHora(h)
if(n)mapa[chave].horarios.add(n)
})
})
let meds=Object.values(mapa).sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR"))
meds.forEach(m=>{
let horarios=[...m.horarios].sort((a,b)=>{
let[p1,m1]=a.split(":")
let[p2,m2]=b.split(":")
return(p1*60+m1)-(p2*60+m2)
})
let hHTML=horarios.map(h=>{
let exec=(window.EXEC_CACHE||[]).find(e=>e.horario===h&&e.medicacao_id===m.id)
let cor=exec?"#22c55e":"#f87171"
return `<button onclick="window.MODO_MEDICACAO==='editar'?editarHorario('${m.id}','${h}',this):administrarMedicacao('${m.id}','${h}',this)" style="background:${cor};color:#fff;border:none;border-radius:6px;padding:4px 6px;font-size:11px">${h}</button>`
}).join(" ")
html+=`<div style="margin-bottom:8px">
<div style="font-weight:600">
<span onclick="editarNomeMedicacao('${m.id}',\`${m.nome}\`,\`${m.dose||""}\`)">${m.nome}</span>
<span style="color:#666">${m.dose||""}</span>
</div>
<div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:6px">${hHTML}</div>
</div>`
})
html+=`</div>`
})
div.innerHTML=html
}
