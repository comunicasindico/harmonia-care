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

data.forEach(p=>{

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

<td>
${(()=>{
let alerta=""

if(p.grau_risco>=4) alerta+="🔴 "
if(p.acamado) alerta+="⚫ "
if(p.da) alerta+="🧠 "

return alerta+(p.nome_completo??"")
})()}
</td>

<td>${calcularIdade(p.data_nascimento)}</td>

<td>
${MODO_EDICAO_CLINICO ?
`<select class="campo-clinico clin_has">
<option value="true"${p.has?" selected":""}>✔</option>
<option value="false"${!p.has?" selected":""}></option>
</select>`
:(p.has?"✔":"")}
</td>

<td>
${MODO_EDICAO_CLINICO ?
`<select class="campo-clinico clin_dm">
<option value="true"${p.dm?" selected":""}>✔</option>
<option value="false"${!p.dm?" selected":""}></option>
</select>`
:(p.dm?"✔":"")}
</td>

<td>
${MODO_EDICAO_CLINICO ?
`<select class="campo-clinico clin_da">
<option value="true"${p.da?" selected":""}>✔</option>
<option value="false"${!p.da?" selected":""}></option>
</select>`
:(p.da?"✔":"")}
</td>

<td>
${MODO_EDICAO_CLINICO ?
`<select class="campo-clinico clin_cardio">
<option value="true"${p.cardiopatia?" selected":""}>✔</option>
<option value="false"${!p.cardiopatia?" selected":""}></option>
</select>`
:(p.cardiopatia?"✔":"")}
</td>

<td>
${MODO_EDICAO_CLINICO ?
`<select class="campo-clinico clin_acamado">
<option value="true"${p.acamado?" selected":""}>✔</option>
<option value="false"${!p.acamado?" selected":""}></option>
</select>`
:(p.acamado?"✔":"")}
</td>

<td>
${MODO_EDICAO_CLINICO ?
`<input class="campo-clinico clin_pa" value="${p.pressao_arterial??""}" placeholder="120/80">`
:
(()=>{
if(!p.pressao_arterial) return ""

let pa=p.pressao_arterial.split("/")
if(pa.length!==2) return p.pressao_arterial

let sist=parseInt(pa[0])
let diast=parseInt(pa[1])

if(sist<=129 && diast<=85)
return `<span style="color:#16a34a;font-weight:bold">🟢 ${p.pressao_arterial}</span>`

if((sist>=130 && sist<=139)||(diast>=86 && diast<=89))
return `<span style="color:#ca8a04;font-weight:bold">🟡 ${p.pressao_arterial}</span>`

if(sist>=140 || diast>=90)
return `<span style="color:#dc2626;font-weight:bold">🔴 ${p.pressao_arterial}</span>`

return p.pressao_arterial
})()
}
</td>

<td>
${MODO_EDICAO_CLINICO ?
`<select class="campo-clinico clin_dieta">
<option value="">Não</option>
<option value="Hipossódica"${p.dieta_texto=="🧂Hipossódica"?" selected":""}>Hipossódica</option>
<option value="Diabética"${p.dieta_texto=="🍬Diabética"?" selected":""}>Diabética</option>
<option value="Pastosa"${p.dieta_texto=="🥣Pastosa"?" selected":""}>Pastosa</option>
<option value="Vegetariana"${p.dieta_texto=="🥗Vegetariana"?" selected":""}>Vegetariana</option>
<option value="Líquida"${p.dieta_texto=="🥤Líquida"?" selected":""}>Líquida</option>
</select>`
:
(()=>{
if(!p.dieta_especial) return "<span style='color:#6b7280'>- Sem dieta especial</span>"

let d=(p.dieta_texto??"").toLowerCase()

/* CORES AUTOMÁTICAS */

if(d.includes("hipossod"))
return "<span style='color:#2563eb;font-weight:bold'>🧂 Hipossódica</span>"

if(d.includes("diab"))
return "<span style='color:#9333ea;font-weight:bold'>🍬 Diabética</span>"

if(d.includes("past"))
return "<span style='color:#ea580c;font-weight:bold'>🥣 Pastosa</span>"

if(d.includes("veget"))
return "<span style='color:#16a34a;font-weight:bold'>🥗 Vegetariana</span>"

if(d.includes("liquid"))
return "<span style='color:#0ea5e9;font-weight:bold'>🥤 Líquida</span>"

/* padrão */

return `<span style="color:#f59e0b;font-weight:bold">🍽️ ${p.dieta_texto}</span>`

})()
}
</td>

<td>
${MODO_EDICAO_CLINICO ?
`<select class="campo-clinico clin_risco">
<option value="1"${p.grau_risco==1?" selected":""}>1</option>
<option value="2"${p.grau_risco==2?" selected":""}>2</option>
<option value="3"${p.grau_risco==3?" selected":""}>3</option>
<option value="4"${p.grau_risco==4?" selected":""}>4</option>
<option value="5"${p.grau_risco==5?" selected":""}>5</option>
</select>`
:
(()=>{
if(!p.grau_risco) return ""

if(p.grau_risco==5) return `<span style="color:#dc2626;font-weight:bold">🔴 ${p.grau_risco}</span>`
if(p.grau_risco==4) return `<span style="color:#ea580c;font-weight:bold">🟠 ${p.grau_risco}</span>`
if(p.grau_risco==3) return `<span style="color:#ca8a04;font-weight:bold">🟡 ${p.grau_risco}</span>`
return `<span style="color:#16a34a;font-weight:bold">🟢 ${p.grau_risco}</span>`
})()
}
</td>

<td>
${MODO_EDICAO_CLINICO ?
`<input class="campo-clinico clin_outros" value="${p.outras_comorbidades??""}">`
:(p.outras_comorbidades??"Não tem")}
</td>

</tr>
`
})
tabela.innerHTML=html

/* ===============================
030A PAINEL NUTRICIONAL
=============================== */
let totalDietas=0
let hipossodica=0
let diabetica=0
let pastosa=0
let vegetariana=0
let liquida=0

data.forEach(p=>{

if(!p.dieta_especial) return

totalDietas++

let d=(p.dieta_texto??"").toLowerCase()

if(d.includes("hipossod")) hipossodica++
else if(d.includes("diab")) diabetica++
else if(d.includes("past")) pastosa++
else if(d.includes("veget")) vegetariana++
else if(d.includes("liquid")) liquida++

})

const elTotal=document.getElementById("dietaTotal")
const elHip=document.getElementById("dietaHipossodica")
const elDia=document.getElementById("dietaDiabetica")
const elPas=document.getElementById("dietaPastosa")
const elVeg=document.getElementById("dietaVegetariana")
const elLiq=document.getElementById("dietaLiquida")

if(elTotal) elTotal.innerText=`🍽️ ${totalDietas}`
if(elHip) elHip.innerText=`🧂 ${hipossodica}`
if(elDia) elDia.innerText=`🍬 ${diabetica}`
if(elPas) elPas.innerText=`🥣 ${pastosa}`
if(elVeg) elVeg.innerText=`🥗 ${vegetariana}`
if(elLiq) elLiq.innerText=`🥤 ${liquida}`

/* ====================================================
030B PAINEL DE RISCO INSTITUCIONAL
==================================================== */
let alto=0
let medio=0
let moderado=0
let baixo=0

data.forEach(p=>{
if(p.grau_risco==5) alto++
else if(p.grau_risco==4) medio++
else if(p.grau_risco==3) moderado++
else if(p.grau_risco<=2) baixo++
})

const r1=document.getElementById("riscoAlto")
const r2=document.getElementById("riscoMedio")
const r3=document.getElementById("riscoModerado")
const r4=document.getElementById("riscoBaixo")

if(r1) r1.innerText=alto
if(r2) r2.innerText=medio
if(r3) r3.innerText=moderado
if(r4) r4.innerText=baixo

/* ===============================
030C INDICADORES
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
032 – EDITAR CLINICO GLOBAL
==================================================== */
function editarClinicoGlobal(){

/* ativa modo edição */
MODO_EDICAO_CLINICO = true

/* recarrega tabela clínica */
carregarClinico()

}

/* ====================================================
033 – SALVAR CLINICO GLOBAL
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
dieta_especial:linha.querySelector(".clin_dieta").value!=""
grau_risco:parseInt(linha.querySelector(".clin_risco").value),
outras_comorbidades:linha.querySelector(".clin_outros").value

}

await db
.from("pacientes")
.update(dados)
.eq("id",id)

}
alert("Dados clínicos atualizados")

/* sai do modo edição */
MODO_EDICAO_CLINICO=false

/* recarrega tabela */
await carregarClinico()

}
/* ====================================================
034 – CARREGAR DADOS CLÍNICOS DO PACIENTE (ENFERMAGEM)
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

