/* ====================================================
020 – MUDAR TURNO
==================================================== */
function mudarTurno(turno){
console.log("Turno selecionado:",turno)

TURNO_ATUAL=turno
const btnManha=document.getElementById("btnManha")
const btnTarde=document.getElementById("btnTarde")
const btnNoite=document.getElementById("btnNoite")
if(btnManha)btnManha.classList.remove("turno-ativo")
if(btnTarde)btnTarde.classList.remove("turno-ativo")
if(btnNoite)btnNoite.classList.remove("turno-ativo")
if(turno==="manha"&&btnManha)btnManha.classList.add("turno-ativo")
if(turno==="tarde"&&btnTarde)btnTarde.classList.add("turno-ativo")
if(turno==="noite"&&btnNoite)btnNoite.classList.add("turno-ativo")
if(typeof carregarRotinas==="function")carregarRotinas()
}
/* ====================================================
020A – CARREGAR PACIENTES
==================================================== */
async function carregarPacientes(){
const {data:pacientes,error}=await db
.from("pacientes")
.select("id,nome_completo")
.eq("empresa_id",EMPRESA_ID)
if(error){
console.error("Erro pacientes",error)
return
}
const select=document.getElementById("buscaPaciente")
select.innerHTML=""
const optTodos=document.createElement("option")
optTodos.value="todos"
optTodos.textContent="TODOS"
select.appendChild(optTodos)
pacientes.forEach(p=>{
const opt=document.createElement("option")
opt.value=p.id
opt.textContent=p.nome_completo
select.appendChild(opt)
})
}
/* ====================================================
021 – CARREGAR PACIENTES BUSCA
==================================================== */
async function carregarPacientesBusca(){

if(!db){
console.warn("Supabase ainda não carregado")
return
}

const select=document.getElementById("buscaPaciente")
if(!select)return

const {data,error}=await db
.from("pacientes")
.select("id,nome_completo")
.eq("empresa_id",EMPRESA_ID)
.eq("ativo",true)
.order("nome_completo",{ascending:true})

if(error){
console.error("Erro pacientes",error)
return
}

let html=`<option value="todos">TODOS</option>`

data?.forEach(p=>{
html+=`<option value="${p.id}">${p.nome_completo}</option>`
})

select.innerHTML=html
select.value="todos"

/* carregar dados depois do select pronto */

if(typeof carregarRotinas==="function"){
await carregarRotinas()
}

if(typeof carregarClinico==="function"){
await carregarClinico()
}

}
/* ====================================================
022 – CARREGAR ROTINAS
==================================================== */
async function carregarRotinas(){
if(!db)return
const paciente=document.getElementById("buscaPaciente")?.value||"todos"
const dataHoje=document.getElementById("dataInicio")?.value
const turno=TURNO_ATUAL

let pacientes=[]
if(PROFISSIONAL_ID && PROFISSIONAL_ID !== "null"){

const {data,error}=await db
.from("pacientes_profissionais")
.select(`
paciente_id,
pacientes(id,nome_completo)
`)
.eq("profissional_id",PROFISSIONAL_ID)
.eq("turno",turno)
.eq("ativo",true)

if(error){
console.error("Erro pacientes profissional",error)
return
}
pacientes=data?.map(p=>({
id:p.pacientes.id,
nome_completo:p.pacientes.nome_completo
}))||[]
}else{
const {data,error}=await db
.from("pacientes")
.select("id,nome_completo")
.eq("empresa_id",EMPRESA_ID)
.eq("ativo",true)
.order("nome_completo")
if(error){
console.error("Erro pacientes",error)
return
}
pacientes=data||[]
}

const {data:rotinas,error:e2}=await db
.from("rotina_modelos")
.select("id,nome")
.eq("turno",turno)
if(e2){console.error("Erro rotinas",e2);return}

const {data:execucoes,error:e3}=await db
.from("rotinas_execucao")
.select("*")
.eq("data",dataHoje)

const {data:profissionais}=await db
.from("profissionais")
.select("id,nome_apelido")

if(e3){console.error("Erro execucoes",e3);return}
const mapaProfissionais={}
profissionais?.forEach(p=>{
mapaProfissionais[p.id]=p.nome_apelido
})

let lista=[]
pacientes?.forEach(p=>{
if(paciente!=="todos"&&paciente!==p.id)return
rotinas?.forEach(r=>{
const exec=execucoes?.find(e=>e.idoso_id===p.id&&e.rotina_id===r.id)

lista.push({
id:exec?.id||`${p.id}_${r.id}`,
idoso_id:p.id,
rotina_id:r.id,
paciente:p.nome_completo,
rotina:r.nome,
status:exec?.status||"pendente",
profissional:exec?.profissional_id?mapaProfissionais[exec.profissional_id]:""})
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

const tbody=document.getElementById("rotinas")
if(!tbody)return

let html=""
const pacienteSelecionado=document.getElementById("buscaPaciente")?.value||"todos"
const pacientes={}

lista.forEach(r=>{

if(!pacientes[r.idoso_id]){
pacientes[r.idoso_id]={
nome:r.paciente,
rotinas:[]
}
}

pacientes[r.idoso_id].rotinas.push(r)

})

Object.keys(pacientes).forEach(pid=>{

const p=pacientes[pid]

let rotinasHTML=""

let total=p.rotinas.length
let executadas=0

p.rotinas.forEach(r=>{

const classe=r.status==="executado"
?"rotina-executada"
:"rotina-pendente"

rotinasHTML+=`
<button
class="btn-rotina ${classe}"
onclick="executarRotina('${r.idoso_id}','${r.rotina_id}',this)">
${r.rotina}${r.profissional?`<br><small>✔ ${r.profissional}</small>`:""}
</button>
`

})

/* CALCULO PROGRESSO */

let percentual=total>0?Math.round((executadas/total)*100):0

let cor="#ef4444"   // vermelho

if(percentual===100) cor="#22c55e" // verde
else if(percentual>0) cor="#f59e0b" // laranja

html+=`
<tr>

<td class="nome-paciente">${p.nome||""}</td>

<td>

<div class="progresso-container">

<span class="progresso-label">
${percentual}% (${executadas}/${total})
</span>

<button class="btn-todos" onclick="executarTodos('${pid}')">
Rotinas OK
</button>

</div> 

</td>

<td class="rotinas-linha">
${rotinasHTML}
</td>

</tr>
`

})
/* ============================================
LINHA FINAL – TODOS OS PACIENTES
============================================ */
if(lista.length>0 && pacienteSelecionado==="todos"){
const rotinasUnicas={}
lista.forEach(r=>{
rotinasUnicas[r.rotina_id]=r.rotina
})

let rotinasHTML=""

Object.keys(rotinasUnicas).forEach(rotinaId=>{

rotinasHTML+=`
<button
class="btn-rotina ${classe}"
onclick="executarRotina('${r.idoso_id}','${r.rotina_id}',this)">
${r.rotina}${r.profissional?`<br><small>✔ ${r.profissional}</small>`:""}
</button>
`

})

html+=`
<tr style="background:#f0fdf4;font-weight:bold">

<td>
Todos os Pacientes
</td>

<td>
—
</td>

<td class="rotinas-linha">
${rotinasHTML}
</td>

</tr>
`
}

tbody.innerHTML=html

}

/* ====================================================
024 – EXECUTAR ROTINA
==================================================== */
async function executarRotina(pacienteId,rotinaId,botao){

if(!db)return

const dataHoje=document.getElementById("dataInicio")?.value

/* muda visual imediatamente */

if(botao){
botao.classList.remove("rotina-pendente")
botao.classList.add("rotina-executada")
}

/* salvar no banco */

const {error}=await db
.from("rotinas_execucao")
.update({
status:"executado",
horario_executado:new Date(),
profissional_id:localStorage.getItem("profissional_id")
})
.eq("idoso_id",pacienteId)
.eq("rotina_id",rotinaId)
.eq("data",dataHoje)

if(error){
console.error("Erro executar rotina",error)
}

/* recarrega silenciosamente */

setTimeout(()=>{
carregarRotinas()
},200)

}

/* ====================================================
025 – INDICADORES
==================================================== */
function calcularIndicadores(lista){

let executado=0
let pendente=0
let atrasado=0

lista.forEach(r=>{

if(r.status==="executado")executado++
if(r.status==="pendente")pendente++
if(r.status==="atrasado")atrasado++

})

const e=document.getElementById("indicadorExecutado")
const p=document.getElementById("indicadorPendente")
const a=document.getElementById("indicadorAtrasado")

if(e)e.innerHTML="✔ "+executado
if(p)p.innerHTML="🔴 "+pendente
if(a)a.innerHTML="⚠ "+atrasado

}

/* ====================================================
026 – EXECUTAR TODAS ROTINAS
==================================================== */
async function executarTodos(pacienteId){
if(!db)return
const rotinas=ROTINAS_CACHE.filter(r=>r.idoso_id===pacienteId)
for(const r of rotinas){
if(r.status!=="executado"){
await db
.from("rotinas_execucao")
.update({
status:"executado",
horario_executado:new Date()
})
.eq("idoso_id",r.idoso_id)
.eq("rotina_id",r.rotina_id)
}
}
carregarRotinas()
}
/* ====================================================
EXECUTAR ROTINA PARA TODOS OS PACIENTES
==================================================== */
async function executarRotinaTodos(rotinaId){

if(!db)return

const dataHoje=document.getElementById("dataInicio")?.value

const rotinas=ROTINAS_CACHE.filter(r=>r.rotina_id===rotinaId)

for(const r of rotinas){

await db
.from("rotinas_execucao")
.update({
status:"executado",
horario_executado:new Date()
})
.eq("idoso_id",r.idoso_id)
.eq("rotina_id",r.rotina_id)
.eq("data",dataHoje)

}

carregarRotinas()

}
/* ====================================================
027 – GERAR ROTINAS
==================================================== */
async function gerarRotinasDoDia(){
if(!db)return
if(ROTINAS_GERADAS)return
ROTINAS_GERADAS=true
const hoje=new Date().toISOString().slice(0,10)
const {data:pacientes,error:e1}=await db
.from("pacientes")
.select("id")
.eq("empresa_id",EMPRESA_ID)
.eq("ativo",true)
if(e1){
console.error(e1)
return
}
const {data:rotinas,error:e2}=await db
.from("rotina_modelos")
.select("id")
if(e2){
console.error(e2)
return
}
if(!pacientes?.length)return
if(!rotinas?.length)return
for(const p of pacientes){
for(const r of rotinas){
const {data:existe,error:e3}=await db
.from("rotinas_execucao")
.select("id")
.eq("idoso_id",p.id)
.eq("rotina_id",r.id)
.eq("data",hoje)
.limit(1)
if(!existe||existe.length===0){
const {error:e4}=await db
.from("rotinas_execucao")
.insert({
idoso_id:p.id,
rotina_id:r.id,
data:hoje,
status:"pendente"
})
if(e4){
console.error("Erro insert rotina",e4)
}
}
}
}
}
/* ====================================================
028 – SELECIONAR PACIENTE
==================================================== */
async function selecionarPaciente(){

const select=document.getElementById("buscaPaciente")
if(!select)return

const pacienteId=select.value

/* atualizar rotinas */
if(typeof carregarRotinas==="function"){
await carregarRotinas()
}

/* atualizar clínico individual */
if(typeof carregarDadosClinicosPaciente==="function"){
await carregarDadosClinicosPaciente(pacienteId)
}

/* atualizar tabela clínica geral */
if(typeof carregarClinico==="function"){
await carregarClinico()
}

}
/* ====================================================
029 – AO SELECIONAR PACIENTE
==================================================== */
async function aoSelecionarPaciente(){

const paciente=document.getElementById("buscaPaciente")?.value

if(typeof carregarRotinas==="function"){
await carregarRotinas()
}

/* mostrar clínico individual */
if(typeof carregarDadosClinicosPaciente==="function"){
await carregarDadosClinicosPaciente(paciente)
}

}


