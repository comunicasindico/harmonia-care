/* ====================================================
020 – MUDAR TURNO
==================================================== */
function mudarTurno(turno){

TURNO_ATUAL = turno

const btnManha = document.getElementById("btnManha")
const btnTarde = document.getElementById("btnTarde")
const btnNoite = document.getElementById("btnNoite")

if(btnManha) btnManha.classList.remove("turno-ativo")
if(btnTarde) btnTarde.classList.remove("turno-ativo")
if(btnNoite) btnNoite.classList.remove("turno-ativo")

if(turno==="manha" && btnManha) btnManha.classList.add("turno-ativo")
if(turno==="tarde" && btnTarde) btnTarde.classList.add("turno-ativo")
if(turno==="noite" && btnNoite) btnNoite.classList.add("turno-ativo")

carregarRotinas()

}

/* ====================================================
021 – CARREGAR PACIENTES BUSCA
==================================================== */
async function carregarPacientesBusca(){

const select = document.getElementById("buscaPaciente")

if(!select) return

const {data} = await db
.from("pacientes")
.select("id,nome_completo")
.order("nome_completo")

let html = `<option value="todos">Todos</option>`

data.forEach(p=>{

html += `<option value="${p.id}">${p.nome_completo}</option>`

})

select.innerHTML = html

}

/* ====================================================
022 – CARREGAR ROTINAS
==================================================== */
async function carregarRotinas(){
const paciente=document.getElementById("buscaPaciente")?.value
const dataInicio=document.getElementById("dataInicio")?.value
const turno=TURNO_ATUAL
const {data:idosos}=await db.from("idosos").select("id,nome")
const {data:rotinas}=await db.from("rotinas").select("id,nome,turno").eq("turno",turno)
const {data:execucoes}=await db.from("rotinas_execucao").select("*").eq("data",dataInicio)
let lista=[]
idosos.forEach(i=>{
rotinas.forEach(r=>{
const exec=execucoes.find(e=>e.idoso_id===i.id&&e.rotina_id===r.id)
lista.push({
id:exec?.id||`${i.id}_${r.id}`,
idoso_id:i.id,
paciente:i.nome,
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

const tbody = document.getElementById("rotinas")

if(!tbody) return

let html = ""

const pacientes = {}

/* agrupar rotinas por idoso */

lista.forEach(r=>{

if(!pacientes[r.idoso_id]){

pacientes[r.idoso_id] = {
nome: r.paciente,
rotinas: []
}

}

pacientes[r.idoso_id].rotinas.push(r)

})

/* renderizar */

Object.keys(pacientes).forEach(pid=>{

const p = pacientes[pid]

let rotinasHTML = ""

p.rotinas.forEach(r=>{

const classe = r.status==="executado"
? "rotina-executada"
: "rotina-pendente"

rotinasHTML += `

<button
class="btn-rotina ${classe}"
onclick="executarRotina('${r.id}')">

${r.rotina}

</button>

`

})

html += `

<tr>

<td>

${p.nome}

<button
style="margin-left:10px"
onclick="executarTodos('${pid}')">

TODOS

</button>

</td>

<td>${p.rotinas.length}</td>

<td class="rotinas-linha">

${rotinasHTML}

</td>

</tr>

`

})

tbody.innerHTML = html

}
/* ====================================================
024 – EXECUTAR ROTINA
==================================================== */
async function executarRotina(id){
const usuario = localStorage.getItem("usuario_nome")

await db.from("rotinas_execucao").insert({
idoso_id:idosoId,
rotina_id:rotinaId,
data:dataHoje,
status:"executado"
})
.eq("id",id)

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

if(r.status==="executado") executado++
if(r.status==="pendente") pendente++
if(r.status==="atrasado") atrasado++

})

const e = document.getElementById("indicadorExecutado")
const p = document.getElementById("indicadorPendente")
const a = document.getElementById("indicadorAtrasado")

if(e) e.innerHTML = "✔ "+executado
if(p) p.innerHTML = "🔴 "+pendente
if(a) a.innerHTML = "⚠ "+atrasado

}
/* ====================================================
026 – EXECUTAR TODAS ROTINAS DO IDOSO
==================================================== */
async function executarTodos(idosoId){

const rotinas = ROTINAS_CACHE.filter(r => r.idoso_id === idosoId)

for(const r of rotinas){

if(r.status !== "executado"){

await db
.from("rotinas_execucao")
.update({
status:"executado",
horario_executado:new Date()
})
.eq("id", r.id)
}
}

carregarRotinas()
}

/* ====================================================
027 – GERAR ROTINAS DO DIA
==================================================== */
async function gerarRotinasDoDia(){
const hoje=new Date().toISOString().slice(0,10)
const {data:idosos,error:e1}=await db.from("idosos").select("id")
if(e1){
console.error("Erro idosos",e1)
return
}
const {data:rotinas,error:e2}=await db.from("rotinas").select("id")
if(e2){
console.error("Erro rotinas",e2)
return
}
for(const i of idosos){
for(const r of rotinas){
const {data:existe}=await db.from("rotinas_execucao").select("id").eq("idoso_id",i.id).eq("rotina_id",r.id).eq("data",hoje).maybeSingle()
if(!existe){
await db.from("rotinas_execucao").insert({
idoso_id:i.id,
rotina_id:r.id,
data:hoje,
status:"pendente"
})
}
}
}
}
