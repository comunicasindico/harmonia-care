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
202 – RENDER MEDICAÇÕES (FINAL CORRIGIDO DEFINITIVO)
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
html+=`<div style="display:flex;gap:8px;margin-bottom:12px">
<button onclick="abrirModalMedicacao()" style="background:#10b981;color:#fff;border:none;border-radius:6px;padding:6px 10px">➕ Nova</button>
${hierarquia===1?`
<button onclick="editarMedicacaoGlobal()" style="background:#3b82f6;color:#fff;border:none;border-radius:6px;padding:6px 10px">✏️ Editar</button>
<button onclick="excluirMedicacaoGlobal()" style="background:#ef4444;color:#fff;border:none;border-radius:6px;padding:6px 10px">🗑️ Excluir</button>
<button onclick="cancelarModoMedicacao()" style="background:#6b7280;color:#fff;border:none;border-radius:6px;padding:6px 10px">❌ Cancelar</button>
`:""}
</div>`
Object.values(pacientes).sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR")).forEach(p=>{
let corPaciente=gerarCor(p.nome,60,92)
html+=`<div style="background:${corPaciente};padding:12px;margin-bottom:14px;border-radius:12px">
<div style="font-weight:bold;margin-bottom:10px">👤 ${p.nome}</div>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">`
let mapa={}
p.itens.forEach(m=>{
const chave=(m.nome_medicamento||"").trim().toLowerCase()+"_"+(m.dosagem||"").trim().toLowerCase()
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
meds.forEach(m=>{
let corMedicacao=gerarCor(m.nome,50,96)
let horarios=[...m.horarios].sort((a,b)=>{
let[p1,m1]=a.split(":")
let[p2,m2]=b.split(":")
return(p1*60+m1)-(p2*60+m2)
})
let hHTML=horarios.map(h=>{
let exec=(window.EXEC_CACHE||[]).find(e=>{
let exec=(window.EXEC_CACHE||[]).find(e=>{
return String(e.medicacao_id)===String(m.id) && String(e.horario)===String(h)
})
})
let cor=exec?"#22c55e":"#ef4444"
let usuario=(exec&&exec.usuario_nome)?exec.usuario_nome:""
return `<button onclick="administrarMedicacao('${m.id}','${h}',this)" style="background:${cor};color:#fff;border:none;border-radius:6px;padding:6px;font-size:11px;display:flex;flex-direction:column;align-items:center;min-width:60px"><span>${h}</span>${usuario?`<span style="font-size:9px">${usuario}</span>`:""}</button>`
}).join("")
html+=`<div style="background:${corMedicacao};padding:8px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
<div style="font-weight:600;font-size:12px;display:flex;justify-content:space-between">
<span>${m.nome}</span>
${mostrarAcoes?`
<span style="display:flex;gap:6px">
<button onclick="editarMedicacao('${m.id}','${m.nome}','${m.dose||""}')" style="background:#3b82f6;color:#fff;border:none;border-radius:4px;font-size:10px;padding:2px 6px">✏️</button>
<button onclick="excluirMedicacao('${m.nome}','${m.dose||""}','${p.id}')" style="background:#ef4444;color:#fff;border:none;border-radius:4px;font-size:10px;padding:2px 6px">🗑️</button>
</span>
`:""}
</div>
<div style="color:#666;font-size:11px;margin-bottom:6px">${m.dose||""}</div>
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
208 – GERAR COR POR TEXTO (PACIENTE / MEDICAÇÃO)
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
220 – EDITAR MEDICAÇÃO (FUNCIONAL)
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
221 – EXCLUIR MEDICAÇÃO (CORRIGIDO DEFINITIVO)
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
