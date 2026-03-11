/* ====================================================
030 – CARREGAR CLINICO
==================================================== */
async function carregarClinico(){

const pacienteSelecionado=document.getElementById("buscaPaciente")?.value||"todos"

if(!db){
console.error("Supabase ainda não carregou")
return
}

const {data,error}=await db
.from("pacientes")
.select("*")
.eq("empresa_id",EMPRESA_ID)
.eq("ativo",true)
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

let pacienteAtual=null

data.forEach(p=>{

/* FILTRO POR PACIENTE */
if(pacienteSelecionado!=="todos" && pacienteSelecionado!==p.id) return

if(pacienteSelecionado!=="todos") pacienteAtual=p

totalPacientes++

if(p.has) totalHas++
if(p.dm) totalDm++
if(p.da) totalDemencia++

html+=`
<tr>
<td>${p.nome_completo??""}</td>
<td>${calcularIdade(p.data_nascimento)}</td>
<td>${p.has?"✔":""}</td>
<td>${p.dm?"✔":""}</td>
<td>${p.da?"✔":""}</td>
<td>${p.cardiopatia?"✔":""}</td>
<td>${p.acamado?"✔":""}</td>
<td>${p.pressao_arterial??""}</td>
<td>${p.dieta_especial?"✔":""}</td>
<td>${p.grau_risco??""}</td>
<td>${p.outras_comorbidades??""}</td>
</tr>
`

})

/* ATUALIZA TABELA DO PAINEL CLINICO */

const tabela=document.getElementById("quadroClinico")
if(tabela) tabela.innerHTML=html

/* ATUALIZA INDICADORES */

const tPac=document.getElementById("totalPacientes")
const tHas=document.getElementById("totalHas")
const tDm=document.getElementById("totalDm")
const tDem=document.getElementById("totalDemencia")

if(tPac) tPac.innerHTML=totalPacientes
if(tHas) tHas.innerHTML=totalHas
if(tDm) tDm.innerHTML=totalDm
if(tDem) tDem.innerHTML=totalDemencia


/* ====================================================
MOSTRAR DADOS CLINICOS NO PAINEL ENFERMAGEM
==================================================== */

const divPaciente=document.getElementById("dadosClinicosPaciente")

if(!divPaciente) return

if(!pacienteAtual){
divPaciente.innerHTML=""
return
}

divPaciente.innerHTML=`
<div class="box">

<h3>Dados Clínicos do Paciente</h3>

<table>

<tr>
<td><b>Paciente</b></td>
<td>${pacienteAtual.nome_completo??""}</td>
</tr>

<tr>
<td><b>Idade</b></td>
<td>${calcularIdade(pacienteAtual.data_nascimento)}</td>
</tr>

<tr>
<td><b>HAS</b></td>
<td>${pacienteAtual.has?"✔ Sim":"-"}</td>
</tr>

<tr>
<td><b>Diabetes</b></td>
<td>${pacienteAtual.dm?"✔ Sim":"-"}</td>
</tr>

<tr>
<td><b>Demência</b></td>
<td>${pacienteAtual.da?"✔ Sim":"-"}</td>
</tr>

<tr>
<td><b>Cardiopatia</b></td>
<td>${pacienteAtual.cardiopatia?"✔ Sim":"-"}</td>
</tr>

<tr>
<td><b>Acamado</b></td>
<td>${pacienteAtual.acamado?"✔ Sim":"-"}</td>
</tr>

<tr>
<td><b>Pressão Arterial</b></td>
<td>${pacienteAtual.pressao_arterial??"-"}</td>
</tr>

<tr>
<td><b>Dieta Especial</b></td>
<td>${pacienteAtual.dieta_especial?"✔ Sim":"-"}</td>
</tr>

<tr>
<td><b>Grau de Risco</b></td>
<td>${pacienteAtual.grau_risco??"-"}</td>
</tr>

<tr>
<td><b>Outras Comorbidades</b></td>
<td>${pacienteAtual.outras_comorbidades??"-"}</td>
</tr>

</table>

</div>
`

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
