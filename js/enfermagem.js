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
021 – CARREGAR PACIENTES BUSCA
==================================================== */
async function carregarPacientesBusca(){

if(!db)return

const select=document.getElementById("buscaPaciente")
if(!select)return

const {data,error}=await db
.from("pacientes")
.select("id,nome_completo")
.eq("empresa_id",EMPRESA_ID)
.eq("ativo",true)
.order("nome_completo")

if(error){
console.error(error)
return
}

let html=`<option value="todos">Todos</option>`

data?.forEach(p=>{
html+=`<option value="${p.id}">${p.nome_completo}</option>`
})

select.innerHTML=html

}

/* ====================================================
022 – CARREGAR ROTINAS
==================================================== */
async function carregarRotinas(){
if(!db)return
const paciente=document.getElementById("buscaPaciente")?.value||"todos"
const dataHoje=document.getElementById("dataInicio")?.value
const turno=TURNO_ATUAL
const {data:pacientes,error:e1}=await db
.from("pacientes")
.select("id,nome_completo")
.eq("empresa_id",EMPRESA_ID)
if(e1){console.error("Erro pacientes",e1);return}
const {data:rotinas,error:e2}=await db
.from("rotina_modelos")
.select("id,nome")
.eq("turno",turno)
if(e2){console.error("Erro rotinas",e2);return}
const {data:execucoes,error:e3}=await db
.from("rotinas_execucao")
.select("*")
.eq("data",dataHoje)
if(e3){console.error("Erro execucoes",e3);return}
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
status:exec?.status||"pendente"
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

p.rotinas.forEach(r=>{

const classe=r.status==="executado"
?"rotina-executada"
:"rotina-pendente"

rotinasHTML+=`
<button
class="btn-rotina ${classe}"
onclick="executarRotina('${r.idoso_id}','${r.rotina_id}')">
${r.rotina}
</button>
`

})

html+=`
<tr>
<td>
${p.nome_completo}
<button style="margin-left:10px" onclick="executarTodos('${pid}')">TODOS</button>
</td>
<td>${p.rotinas.length}</td>
<td class="rotinas-linha">${rotinasHTML}</td>
</tr>
`

})

tbody.innerHTML=html

}

/* ====================================================
024 – EXECUTAR ROTINA
==================================================== */

async function executarRotina(pacienteId,rotinaId){

if(!db)return

const dataHoje=document.getElementById("dataInicio")?.value

await db
.from("rotinas_execucao")
.update({
status:"executado",
horario_executado:new Date()
})
.eq("idoso_id",pacienteId)
.eq("rotina_id",rotinaId)
.eq("data",dataHoje)

carregarRotinas()

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
