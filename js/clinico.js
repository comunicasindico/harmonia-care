/* ====================================================
030 – CARREGAR CLINICO
==================================================== */
async function carregarClinico(){

const selectPaciente=document.getElementById("buscaPaciente")
const pacienteSelecionado=selectPaciente?selectPaciente.value:"todos"

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

const tabela=document.getElementById("quadroClinico")
if(!tabela)return

if(!data || data.length===0){
tabela.innerHTML=""
return
}

let html=""

let totalPacientes=0
let totalHas=0
let totalDm=0
let totalDemencia=0
let totalCardio=0
let totalAcamado=0
let totalPAAlterada=0

let risco1=0
let risco2=0
let risco3=0
let risco4=0
let risco5=0

let pacienteAtual=null

data.forEach(p=>{

if(pacienteSelecionado!=="todos" && pacienteSelecionado===p.id){
pacienteAtual=p
}

totalPacientes++

if(p.has)totalHas++
if(p.dm)totalDm++
if(p.da)totalDemencia++
if(p.cardiopatia)totalCardio++
if(p.acamado)totalAcamado++

if(p.pressao_arterial){
let pa=p.pressao_arterial.split("/")
if(pa.length===2){
let s=parseInt(pa[0])
let d=parseInt(pa[1])
if(s>=140 || d>=90) totalPAAlterada++
}
}

if(p.grau_risco==1)risco1++
if(p.grau_risco==2)risco2++
if(p.grau_risco==3)risco3++
if(p.grau_risco==4)risco4++
if(p.grau_risco==5)risco5++

html+=`

<tr data-id="${p.id}">

<td>${p.nome_completo ?? ""}</td>

<td>${calcularIdade(p.data_nascimento)}</td>

<td>
<select class="campo-clinico clin_has" disabled>
<option value="true" ${p.has?"selected":""}>✔</option>
<option value="false" ${!p.has?"selected":""}></option>
</select>
</td>

<td>
<select class="campo-clinico clin_dm" disabled>
<option value="true" ${p.dm?"selected":""}>✔</option>
<option value="false" ${!p.dm?"selected":""}></option>
</select>
</td>

<td>
<select class="campo-clinico clin_da" disabled>
<option value="true" ${p.da?"selected":""}>✔</option>
<option value="false" ${!p.da?"selected":""}></option>
</select>
</td>

<td>
<select class="campo-clinico clin_cardio" disabled>
<option value="true" ${p.cardiopatia?"selected":""}>✔</option>
<option value="false" ${!p.cardiopatia?"selected":""}></option>
</select>
</td>

<td>
<select class="campo-clinico clin_acamado" disabled>
<option value="true" ${p.acamado?"selected":""}>✔</option>
<option value="false" ${!p.acamado?"selected":""}></option>
</select>
</td>

<td>
<input class="campo-clinico clin_pa"
value="${p.pressao_arterial ?? ""}"
placeholder="120/80"
disabled>
</td>

<td>
<input class="campo-clinico clin_dieta"
value="${p.dieta_texto ?? ""}"
placeholder="Dieta especial"
disabled>
</td>

<td>
<select class="campo-clinico clin_risco" disabled>
<option value="1" ${p.grau_risco==1?"selected":""}>1</option>
<option value="2" ${p.grau_risco==2?"selected":""}>2</option>
<option value="3" ${p.grau_risco==3?"selected":""}>3</option>
<option value="4" ${p.grau_risco==4?"selected":""}>4</option>
<option value="5" ${p.grau_risco==5?"selected":""}>5</option>
</select>
</td>

<td>
<input class="campo-clinico clin_outros"
value="${p.outras_comorbidades ?? ""}"
placeholder="Outras"
disabled>
</td>

</tr>
`
})

tabela.innerHTML=html

/* ===============================
INDICADORES
=============================== */
const riscoTotal=risco1+risco2+risco3+risco4+risco5

const corHas="#e74c3c"
const corDm="#f39c12"
const corDemencia="#8e44ad"
const corCardio="#c0392b"
const corAcamado="#34495e"
const corPa="#e67e22"
const corRisco="#2c3e50"

document.getElementById("cabHas").innerHTML=`HAS<br><b style="color:${corHas}">${totalHas}</b>`
document.getElementById("cabDm").innerHTML=`DM<br><b style="color:${corDm}">${totalDm}</b>`
document.getElementById("cabDemencia").innerHTML=`Demência<br><b style="color:${corDemencia}">${totalDemencia}</b>`
document.getElementById("cabCardio").innerHTML=`Cardio<br><b style="color:${corCardio}">${totalCardio}</b>`
document.getElementById("cabAcamado").innerHTML=`Acamado<br><b style="color:${corAcamado}">${totalAcamado}</b>`
document.getElementById("cabPa").innerHTML=`PA<br><b style="color:${corPa}">${totalPAAlterada}</b>`
document.getElementById("cabRisco").innerHTML=`Risco<br><b style="color:${corRisco}">${riscoTotal}</b>`

document.getElementById("rodapeHas").innerHTML=`<b style="color:${corHas}">${totalHas}</b>`
document.getElementById("rodapeDm").innerHTML=`<b style="color:${corDm}">${totalDm}</b>`
document.getElementById("rodapeDemencia").innerHTML=`<b style="color:${corDemencia}">${totalDemencia}</b>`
document.getElementById("rodapeCardio").innerHTML=`<b style="color:${corCardio}">${totalCardio}</b>`
document.getElementById("rodapeAcamado").innerHTML=`<b style="color:${corAcamado}">${totalAcamado}</b>`
document.getElementById("rodapePa").innerHTML=`<b style="color:${corPa}">${totalPAAlterada}</b>`
document.getElementById("rodapeRisco").innerHTML=`<b style="color:${corRisco}">${riscoTotal}</b>`

const totalPacientesCard=document.getElementById("totalPacientes")
if(totalPacientesCard) totalPacientesCard.innerHTML=totalPacientes

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
038 – EDITAR CLINICO GLOBAL
==================================================== */
function editarClinicoGlobal(){

document.querySelectorAll("#quadroClinico select").forEach(el=>{
el.removeAttribute("disabled")
})

document.querySelectorAll("#quadroClinico input").forEach(el=>{
el.removeAttribute("disabled")
})

}

/* ====================================================
039 – SALVAR CLINICO GLOBAL
==================================================== */
async function salvarClinicoGlobal(){

const linhas=document.querySelectorAll("#quadroClinico tr")

for(const linha of linhas){

const id=linha.dataset.id
if(!id)continue

const dados={

has:linha.querySelector(".clin_has").value==="true",
dm:linha.querySelector(".clin_dm").value==="true",
da:linha.querySelector(".clin_da").value==="true",
cardiopatia:linha.querySelector(".clin_cardio").value==="true",
acamado:linha.querySelector(".clin_acamado").value==="true",
pressao_arterial:linha.querySelector(".clin_pa").value,
dieta_texto:linha.querySelector(".clin_dieta").value,
grau_risco:parseInt(linha.querySelector(".clin_risco").value),
outras_comorbidades:linha.querySelector(".clin_outros").value

}

await db
.from("pacientes")
.update(dados)
.eq("id",id)

}

alert("Dados clínicos atualizados")

carregarClinico()

}
/* ====================================================
040 – CARREGAR DADOS CLÍNICOS DO PACIENTE (ENFERMAGEM)
==================================================== */
async function carregarDadosClinicosPaciente(pacienteId){

const box=document.getElementById("dadosClinicosPaciente")
if(!box)return

/* se for TODOS, limpa */
if(!pacienteId || pacienteId==="todos"){
box.innerHTML=""
return
}

if(!db){
console.error("Supabase ainda não carregou")
return
}

const {data,error}=await db
.from("pacientes")
.select("*")
.eq("id",pacienteId)
.single()

if(error){
console.error("Erro clínico paciente",error)
return
}

let html=`
<div class="box">

<h3>Dados Clínicos do Paciente</h3>

<table class="tabela-clinica-edicao">

<tr>
<td><b>Paciente</b></td>
<td>${data.nome_completo}</td>
</tr>

<tr>
<td><b>Idade</b></td>
<td>${calcularIdade(data.data_nascimento)}</td>
</tr>

<tr>
<td><b>HAS</b></td>
<td>${data.has?"✔ SIM":"—"}</td>
</tr>

<tr>
<td><b>Diabetes</b></td>
<td>${data.dm?"✔ SIM":"—"}</td>
</tr>

<tr>
<td><b>Demência</b></td>
<td>${data.da?"✔ SIM":"—"}</td>
</tr>

<tr>
<td><b>Cardiopatia</b></td>
<td>${data.cardiopatia?"✔ SIM":"—"}</td>
</tr>

<tr>
<td><b>Acamado</b></td>
<td>${data.acamado?"✔ SIM":"—"}</td>
</tr>

<tr>
<td><b>Pressão Arterial</b></td>
<td>${data.pressao_arterial ?? "-"}</td>
</tr>

<tr>
<td><b>Dieta Especial</b></td>
<td>${data.dieta_especial ? "SIM" : "NÃO"} ${data.dieta_texto ?? ""}</td>
</tr>

<tr>
<td><b>Grau de Risco</b></td>
<td>${data.grau_risco ?? "-"}</td>
</tr>

<tr>
<td><b>Outras Comorbidades</b></td>
<td>${data.outras_comorbidades ?? "-"}</td>
</tr>

</table>

</div>
`

box.innerHTML=html

}
/* ====================================================
041 – SELECIONAR PACIENTE
==================================================== */
async function selecionarPaciente(){

const paciente=document.getElementById("buscaPaciente")?.value

if(typeof carregarRotinas==="function"){
await carregarRotinas()
}

if(typeof carregarDadosClinicosPaciente==="function"){
await carregarDadosClinicosPaciente(paciente)
}

}
