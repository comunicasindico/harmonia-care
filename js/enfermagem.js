/* ====================================================
MUDAR TURNO
==================================================== */

function mudarTurno(turno){

TURNO_ATUAL=turno

document.getElementById("btnManha").classList.remove("turno-ativo")
document.getElementById("btnTarde").classList.remove("turno-ativo")
document.getElementById("btnNoite").classList.remove("turno-ativo")

if(turno==="manha")document.getElementById("btnManha").classList.add("turno-ativo")
if(turno==="tarde")document.getElementById("btnTarde").classList.add("turno-ativo")
if(turno==="noite")document.getElementById("btnNoite").classList.add("turno-ativo")

carregarRotinas()

}


/* ====================================================
CARREGAR ROTINAS
==================================================== */

async function carregarRotinas(){

const paciente=document.getElementById("buscaPaciente")?.value

if(paciente && paciente !== "todos"){
carregarDadosClinicosPaciente(paciente)
}

const dataInicio=document.getElementById("dataInicio")?.value
const dataFim=document.getElementById("dataFim")?.value

let query=db
.from("vw_rotinas_painel")
.select("*")
.eq("turno",TURNO_ATUAL)

if(paciente) query=query.eq("paciente_id",paciente)
if(dataInicio) query=query.gte("data",dataInicio)
if(dataFim) query=query.lte("data",dataFim)

query=query.order("paciente").order("rotina")

const {data,error}=await query

if(error){

console.error(error)
alert("Erro ao carregar rotinas")

return

}

calcularIndicadores(data)

renderizarRotinas(data)

}


/* ====================================================
INDICADORES
==================================================== */

function calcularIndicadores(data){

let executado=0
let pendente=0
let atrasado=0

data.forEach(r=>{

if(r.status==="executado")executado++
if(r.status==="pendente")pendente++
if(r.status==="atrasado")atrasado++

})

document.getElementById("indicadorExecutado").innerHTML="✔ "+executado
document.getElementById("indicadorPendente").innerHTML="🔴 "+pendente
document.getElementById("indicadorAtrasado").innerHTML="⚠ "+atrasado

}
