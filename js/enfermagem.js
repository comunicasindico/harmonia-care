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
|| new Date().toISOString().slice(0,10)

const turno=TURNO_ATUAL

let profissionalId=PROFISSIONAL_ID||localStorage.getItem("profissional_id")

let pacientes=[]


/* PROFISSIONAL */

if(profissionalId && profissionalId!=="null" && profissionalId!=="admin"){

const {data,error}=await db
.from("pacientes_profissionais")
.select(`
paciente_id,
pacientes(id,nome_completo)
`)
.eq("usuario_id",profissionalId)
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


/* FALLBACK */

if(!pacientes || pacientes.length===0){

console.warn("Fallback ativado: carregando todos pacientes")

const {data:todosPacientes,error:eFallback}=await db
.from("pacientes")
.select("id,nome_completo")
.eq("empresa_id",EMPRESA_ID)
.eq("ativo",true)
.order("nome_completo")

if(eFallback){
console.error("Erro fallback pacientes",eFallback)
return
}

pacientes=todosPacientes||[]

}

}

/* ADMIN */

else{

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
.select("id,nome,turno")

const rotinasTurno = rotinas?.filter(r=>r.turno===turno) || []

if(e2){
console.error("Erro rotinas",e2)
return
}


const {data:execucoes,error:e3}=await db
.from("rotinas_execucao")
.select(`
*,
usuarios:usuario_id(nome)
`)
.eq("data",dataHoje)

if(e3){
console.error("Erro execucoes",e3)
return
}


const {data:usuarios}=await db
.from("usuarios")
.select("id,nome")

const mapaProfissionais={}

usuarios?.forEach(u=>{
mapaProfissionais[u.id]=u.nome
})


const mapaExecucoes={}

execucoes?.forEach(e=>{
mapaExecucoes[`${e.idoso_id}_${e.rotina_id}`]=e
})


let lista=[]

pacientes?.forEach(p=>{

if(paciente!=="todos"&&paciente!==p.id)return

rotinasTurno.forEach(r=>{

const chave=`${p.id}_${r.id}`

const exec=mapaExecucoes[chave]

lista.push({

id:exec?.id||chave,
idoso_id:p.id,
rotina_id:r.id,
paciente:p.nome_completo,
rotina:r.nome,
status:exec?.status||"pendente",
profissional:exec?.usuario_id?mapaProfissionais[exec.usuario_id]:""

})

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
pacientes[r.idoso_id]={nome:r.paciente,rotinas:[]}
}

pacientes[r.idoso_id].rotinas.push(r)

})


Object.keys(pacientes).forEach(pid=>{

const p=pacientes[pid]

let rotinasHTML=""

let total=p.rotinas.length
let executadas=0

p.rotinas.forEach(r=>{

if(r.status==="executado") executadas++

const classe=r.status==="executado"
?"rotina-executada"
:"rotina-pendente"

rotinasHTML+=`
<button
class="btn-rotina ${classe}"
onclick="executarRotina('${r.idoso_id}','${r.rotina_id}',this)">
${r.rotina}${r.profissional?`<br><span style="font-size:9px;color:#444">✔ ${r.profissional}</span>`:""}
</button>
`

})


let percentual=total>0?Math.round((executadas/total)*100):0

let botaoOK = percentual===100
? `<button class="btn-todos">Rotinas OK</button>`
: `<button class="btn-todos" onclick="executarTodos('${pid}')">Concluir Todas</button>`


html+=`
<tr>

<td class="nome-paciente">${p.nome||""}</td>

<td>

<div class="progresso-container">

<span class="progresso-label">
${percentual}% (${executadas}/${total})
</span>

${botaoOK}

</div> 

</td>

<td class="rotinas-linha">
${rotinasHTML}
</td>

</tr>
`

})


/* LINHA FINAL – TODOS PACIENTES */

if(lista.length>0 && pacienteSelecionado==="todos"){

const rotinasUnicas={}

lista.forEach(r=>{
rotinasUnicas[r.rotina_id]=r.rotina
})

let rotinasHTML=""

Object.keys(rotinasUnicas).forEach(rotinaId=>{

const nomeRotina=rotinasUnicas[rotinaId]

rotinasHTML+=`
<button
class="btn-rotina"
onclick="executarRotinaTodos('${rotinaId}')">
${nomeRotina}
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
|| new Date().toISOString().slice(0,10)

let usuarioId = localStorage.getItem("usuario_id")

if(!usuarioId || usuarioId==="null"){
usuarioId=null
}

if(botao){
botao.classList.remove("rotina-pendente")
botao.classList.add("rotina-executada")
}

const {error}=await db
.from("rotinas_execucao")
.update({
status:"executado",
horario_executado:new Date(),
usuario_id:usuarioId
})
.eq("idoso_id",pacienteId)
.eq("rotina_id",rotinaId)
.eq("data",dataHoje)

if(error){
console.error("Erro executar rotina",error)
}

await carregarRotinas()

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

const dataHoje=document.getElementById("dataInicio")?.value

const rotinas=ROTINAS_CACHE.filter(r=>r.idoso_id===pacienteId)

for(const r of rotinas){

if(r.status!=="executado"){

await db
.from("rotinas_execucao")
.update({
status:"executado",
horario_executado:new Date(),
usuario_id:PROFISSIONAL_ID
})
.eq("idoso_id",r.idoso_id)
.eq("rotina_id",r.rotina_id)
.eq("data",dataHoje)

}

}

await carregarRotinas()

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
horario_executado:new Date(),
usuario_id:PROFISSIONAL_ID
})
.eq("idoso_id",r.idoso_id)
.eq("rotina_id",r.rotina_id)
.eq("data",dataHoje)

}

await carregarRotinas()

}


/* ====================================================
027 – GERAR ROTINAS
==================================================== */
async function gerarRotinasDoDia(){

if(!db)return

if(ROTINAS_GERADAS)return

ROTINAS_GERADAS=true

const hoje=new Date().toISOString().slice(0,10)

const {data:pacientes}=await db
.from("pacientes")
.select("id")
.eq("empresa_id",EMPRESA_ID)
.eq("ativo",true)

const {data:rotinas}=await db
.from("rotina_modelos")
.select("id,turno")

if(!pacientes?.length)return
if(!rotinas?.length)return

for(const p of pacientes){
for(const r of rotinas){

const {data:existe}=await db
.from("rotinas_execucao")
.select("id")
.eq("idoso_id",p.id)
.eq("rotina_id",r.id)
.eq("data",hoje)
.limit(1)

if(!existe||existe.length===0){

await db
.from("rotinas_execucao")
.insert({
idoso_id:p.id,
rotina_id:r.id,
data:hoje,
status:"pendente"
})
.onConflict("idoso_id,rotina_id,data")
.ignore()

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

if(typeof carregarRotinas==="function"){
await carregarRotinas()
}

if(typeof carregarDadosClinicosPaciente==="function"){
await carregarDadosClinicosPaciente(pacienteId)
}

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

if(typeof carregarDadosClinicosPaciente==="function"){
await carregarDadosClinicosPaciente(paciente)
}

}
