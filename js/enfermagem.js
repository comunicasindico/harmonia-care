
/* ====================================================
MUDAR TURNO
==================================================== */

function mudarTurno(turno){

TURNO_ATUAL=turno

carregarRotinas()

}


/* ====================================================
CARREGAR ROTINAS
==================================================== */

async function carregarRotinas(){

const {data,error}=await db
.from("vw_rotinas_painel")
.select("*")
.eq("turno",TURNO_ATUAL)
.order("paciente",{ascending:true})
.order("rotina",{ascending:true})

if(error){
console.error(error)
alert("Erro ao carregar rotinas")
return
}

renderizarRotinas(data)

calcularIndicadores(data)

}

/* ====================================================
RENDERIZAR ROTINAS
==================================================== */

function renderizarRotinas(data){

let html=""

data.forEach(r=>{

let classe="rotina-pendente"
let icon=""

if(r.status==="executado"){
classe="rotina-executada"
icon="✔"
}

html+=`

<tr>

<td>${r.paciente}</td>

<td>${r.turno}</td>

<td>

<button
class="btn-rotina ${classe}"
onclick="executarRotina('${r.id}',this)">

${r.rotina} ${icon}

</button>

</td>

</tr>

`

})

document.getElementById("rotinas").innerHTML=html

}

/* ====================================================
EXECUTAR ROTINA
==================================================== */

async function executarRotina(id,btn){

btn.disabled=true

await db
.from("rotinas_execucao")
.update({
status:"executado",
horario_execucao:new Date().toISOString()
})
.eq("id",id)

carregarRotinas()

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
