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
if(paciente && paciente!=="todos"){
carregarDadosClinicosPaciente(paciente)
}else{
document.getElementById("dadosClinicosPaciente").innerHTML=""
}
const dataInicio = document.getElementById("dataInicio")?.value
const dataFim = document.getElementById("dataFim")?.value

let query = db
.from("vw_rotinas_painel")
.select("*")
.eq("turno",TURNO_ATUAL)

if(paciente && paciente !== "todos") query = query.eq("paciente_id",paciente)
if(dataInicio) query = query.gte("data",dataInicio)
if(dataFim) query = query.lte("data",dataFim)

const {data,error} = await query

if(error){

console.error(error)
alert("Erro ao carregar rotinas")
return

}

ROTINAS_CACHE = data

calcularIndicadores(data)

renderizarRotinas(data)

}

/* ====================================================
023 – RENDERIZAR ROTINAS
==================================================== */

function renderizarRotinas(lista){

const tbody = document.getElementById("rotinas")

if(!tbody) return

let html = ""

lista.forEach(r=>{

const classe = r.status==="executado" ? "rotina-executada" : "rotina-pendente"

html += `
<tr>

<td>${r.paciente}</td>

<td>${r.status}</td>

<td>
<button class="btn-rotina ${classe}"
onclick="executarRotina('${r.id}')">
${r.rotina}
</button>
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

await db
.from("rotina_execucao")
.update({
status:"executado",
executado_por:usuario,
horario_execucao:new Date()
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
EXECUTAR TODOS
==================================================== */

async function executarTodos(pacienteId){

const rotinas=ROTINAS_CACHE.filter(r=>r.paciente_id===pacienteId)

for(const r of rotinas){

if(r.status!=="executado"){

await db
.from("rotina_execucao")
.update({
status:"executado",
horario_execucao:new Date()
})
.eq("id",r.id)

}

}

carregarRotinas()

}

