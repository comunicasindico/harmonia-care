/* ====================================================
030 – CARREGAR CLINICO
==================================================== */
async function carregarClinico(){

if(!db){
console.error("Supabase ainda não carregou")
return
}

const {data,error}=await db
.from("pacientes")
.select("*")
.order("nome_completo")

if(error){
console.error(error)
return
}

if(!data) return

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
<td>${p.nome_completo??""}</td>
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

const tabela=document.getElementById("quadroClinico")
if(tabela) tabela.innerHTML=html

const tPac=document.getElementById("totalPacientes")
const tHas=document.getElementById("totalHas")
const tDm=document.getElementById("totalDm")
const tDem=document.getElementById("totalDemencia")

if(tPac) tPac.innerHTML=totalPacientes
if(tHas) tHas.innerHTML=totalHas
if(tDm) tDm.innerHTML=totalDm
if(tDem) tDem.innerHTML=totalDemencia

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
DADOS CLINICOS PACIENTE
==================================================== */

async function carregarDadosClinicosPaciente(pacienteId){

if(!pacienteId || pacienteId==="todos"){

document.getElementById("dadosClinicosPaciente").innerHTML=""
return

}

const {data,error}=await db
.from("pacientes")
.select("*")
.eq("id",pacienteId)
.single()

if(error){

console.log(error)
return

}

let html=`

<div class="box">

<h4>Dados Clínicos</h4>

<b>Paciente:</b> ${data.nome_completo}<br>

<b>Idade:</b> ${calcularIdade(data.data_nascimento)} anos<br>

<b>HAS:</b> ${data.has?"Sim":"Não"}<br>

<b>DM:</b> ${data.dm?"Sim":"Não"}<br>

<b>Demência:</b> ${data.demencia?"Sim":"Não"}<br>

<b>Cardiopatia:</b> ${data.cardiopatia?"Sim":"Não"}<br>

<b>Acamado:</b> ${data.acamado?"Sim":"Não"}<br>

<b>Pressão arterial:</b> ${data.pressao_arterial ?? ""}<br>

<b>Dieta especial:</b> ${data.dieta_especial?"Sim":"Não"}<br>

<b>Grau de risco:</b> ${data.grau_risco ?? ""}

</div>

`

document.getElementById("dadosClinicosPaciente").innerHTML=html

}
