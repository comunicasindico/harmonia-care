/* ====================================================
030 – CARREGAR CLINICO
==================================================== */

async function carregarClinico(){

const {data,error}=await db
.from("pacientes")
.select("*")
.order("nome_completo")

if(error){

console.error(error)
return

}

let html=""

let totalPacientes=0
let totalHas=0
let totalDm=0
let totalDemencia=0

data.forEach(p=>{

totalPacientes++

if(p.has) totalHas++
if(p.dm) totalDm++
if(p.demencia) totalDemencia++

html+=`
<tr>

<td>${p.nome_completo}</td>

<td>${calcularIdade(p.data_nascimento)}</td>

<td>${p.has?"✔":""}</td>

<td>${p.dm?"✔":""}</td>

<td>${p.demencia?"✔":""}</td>

<td>${p.cardiopatia?"✔":""}</td>

<td>${p.acamado?"✔":""}</td>

<td>${p.pressao_arterial??""}</td>

<td>${p.dieta_especial?"✔":""}</td>

<td>${p.grau_risco??""}</td>

<td>${p.outras_comorbidades??""}</td>

</tr>
`

})

document.getElementById("quadroClinico").innerHTML=html

document.getElementById("totalPacientes").innerHTML=totalPacientes
document.getElementById("totalHas").innerHTML=totalHas
document.getElementById("totalDm").innerHTML=totalDm
document.getElementById("totalDemencia").innerHTML=totalDemencia

}

/* ====================================================
031 – CALCULAR IDADE
==================================================== */

function calcularIdade(data){

if(!data) return ""

const nascimento=new Date(data)
const hoje=new Date()

let idade=hoje.getFullYear()-nascimento.getFullYear()

const m=hoje.getMonth()-nascimento.getMonth()

if(m<0 || (m===0 && hoje.getDate()<nascimento.getDate())){

idade--

}

return idade

}

/* ====================================================
032 – DADOS CLINICOS PACIENTE
==================================================== */

async function carregarDadosClinicosPaciente(pacienteId){

if(!pacienteId || pacienteId==="todos"){

document.getElementById("dadosClinicosPaciente").innerHTML=""
return

}

const {data}=await db
.from("pacientes")
.select("*")
.eq("id",pacienteId)
.single()

if(!data) return

let html=`

<div class="box">

<h4>Dados Clínicos</h4>

<b>Paciente:</b> ${data.nome_completo}<br>

<b>Idade:</b> ${calcularIdade(data.data_nascimento)}<br>

<b>HAS:</b> ${data.has?"Sim":"Não"}<br>

<b>DM:</b> ${data.dm?"Sim":"Não"}<br>

<b>Demência:</b> ${data.demencia?"Sim":"Não"}<br>

<b>Cardiopatia:</b> ${data.cardiopatia?"Sim":"Não"}<br>

<b>Acamado:</b> ${data.acamado?"Sim":"Não"}<br>

<b>Pressão:</b> ${data.pressao_arterial ?? ""}<br>

<b>Dieta:</b> ${data.dieta_especial?"Sim":"Não"}<br>

<b>Grau de risco:</b> ${data.grau_risco ?? ""}<br>

</div>

`

document.getElementById("dadosClinicosPaciente").innerHTML=html

}
