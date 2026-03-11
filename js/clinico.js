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
if(!data||data.length===0){
const tabela=document.getElementById("quadroClinico")
if(tabela)tabela.innerHTML=""
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
if(s>=140||d>=90)totalPAAlterada++
}
}
if(p.grau_risco==1)risco1++
if(p.grau_risco==2)risco2++
if(p.grau_risco==3)risco3++
if(p.grau_risco==4)risco4++
if(p.grau_risco==5)risco5++
html+=`<tr>
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
</tr>`
})
const tabela=document.getElementById("quadroClinico")
if(tabela)tabela.innerHTML=html
const riscoTotal=risco1+risco2+risco3+risco4+risco5
const corHas="#e74c3c"
const corDm="#f39c12"
const corDemencia="#8e44ad"
const corCardio="#c0392b"
const corAcamado="#34495e"
const corPa="#e67e22"
const corRisco="#2c3e50"
const cabHas=document.getElementById("cabHas")
if(cabHas)cabHas.innerHTML=`HAS<br><b style="color:${corHas}">${totalHas}</b>`
const cabDm=document.getElementById("cabDm")
if(cabDm)cabDm.innerHTML=`DM<br><b style="color:${corDm}">${totalDm}</b>`
const cabDemencia=document.getElementById("cabDemencia")
if(cabDemencia)cabDemencia.innerHTML=`Demência<br><b style="color:${corDemencia}">${totalDemencia}</b>`
const cabCardio=document.getElementById("cabCardio")
if(cabCardio)cabCardio.innerHTML=`Cardio<br><b style="color:${corCardio}">${totalCardio}</b>`
const cabAcamado=document.getElementById("cabAcamado")
if(cabAcamado)cabAcamado.innerHTML=`Acamado<br><b style="color:${corAcamado}">${totalAcamado}</b>`
const cabPa=document.getElementById("cabPa")
if(cabPa)cabPa.innerHTML=`PA<br><b style="color:${corPa}">${totalPAAlterada}</b>`
const cabRisco=document.getElementById("cabRisco")
if(cabRisco)cabRisco.innerHTML=`Risco<br><b style="color:${corRisco}">${riscoTotal}</b>`
const rodapeHas=document.getElementById("rodapeHas")
if(rodapeHas)rodapeHas.innerHTML=`<b style="color:${corHas}">${totalHas}</b>`
const rodapeDm=document.getElementById("rodapeDm")
if(rodapeDm)rodapeDm.innerHTML=`<b style="color:${corDm}">${totalDm}</b>`
const rodapeDemencia=document.getElementById("rodapeDemencia")
if(rodapeDemencia)rodapeDemencia.innerHTML=`<b style="color:${corDemencia}">${totalDemencia}</b>`
const rodapeCardio=document.getElementById("rodapeCardio")
if(rodapeCardio)rodapeCardio.innerHTML=`<b style="color:${corCardio}">${totalCardio}</b>`
const rodapeAcamado=document.getElementById("rodapeAcamado")
if(rodapeAcamado)rodapeAcamado.innerHTML=`<b style="color:${corAcamado}">${totalAcamado}</b>`
const rodapePa=document.getElementById("rodapePa")
if(rodapePa)rodapePa.innerHTML=`<b style="color:${corPa}">${totalPAAlterada}</b>`
const rodapeRisco=document.getElementById("rodapeRisco")
if(rodapeRisco)rodapeRisco.innerHTML=`<b style="color:${corRisco}">${riscoTotal}</b>`
const totalPacientesCard=document.getElementById("totalPacientes")
if(totalPacientesCard)totalPacientesCard.innerHTML=totalPacientes
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
032 – EDITAR DADOS CLINICOS
==================================================== */
function editarClinico(){
MODO_EDICAO_CLINICO=true
carregarClinico()
}
/* ====================================================
033 – EXCLUIR DADOS CLINICOS
==================================================== */
async function excluirClinico(pacienteId){
if(!confirm("Deseja apagar os dados clínicos deste paciente?"))return
await db
.from("pacientes")
.update({
pressao_arterial:null,
grau_risco:null,
outras_comorbidades:null
})
.eq("id",pacienteId)
carregarClinico()
}

/* ====================================================
034 – SALVAR DADOS CLINICOS
==================================================== */
async function salvarClinico(id){
const has=document.getElementById("clin_has").value==="true"
const dm=document.getElementById("clin_dm").value==="true"
const da=document.getElementById("clin_da").value==="true"
const cardio=document.getElementById("clin_cardio").value==="true"
const acamado=document.getElementById("clin_acamado").value==="true"
const dieta=document.getElementById("clin_dieta").value==="true"
const dietaTexto=document.getElementById("clin_dieta_texto").value
const pa=document.getElementById("clin_pa").value
const risco=parseInt(document.getElementById("clin_risco").value)
const outros=document.getElementById("clin_outros").value
await db.from("pacientes").update({
has:has,
dm:dm,
da:da,
cardiopatia:cardio,
acamado:acamado,
dieta_especial:dieta,
dieta_texto:dietaTexto,
pressao_arterial:pa,
grau_risco:risco,
outras_comorbidades:outros
}).eq("id",id)
alert("Dados atualizados")
MODO_EDICAO_CLINICO=false
await carregarClinico()
}
/* ====================================================
035 – FORMATAR PRESSÃO ARTERIAL
==================================================== */
function formatarPA(input){
let v=input.value.replace(/[^\d]/g,"")
if(v.length>=3){
let sist=v.slice(0,3)
let diast=v.slice(3,5)
if(diast)input.value=sist+"/"+diast
else input.value=sist
}
}

/* ====================================================
036 – AVALIAR PRESSÃO ARTERIAL
==================================================== */
function avaliarPA(){
const campo=document.getElementById("clin_pa")
const status=document.getElementById("pa_status")
if(!campo||!status)return
let v=campo.value
if(!v.includes("/")){
status.innerHTML=""
return
}
let partes=v.split("/")
let sist=parseInt(partes[0])
let diast=parseInt(partes[1])
if(isNaN(sist)||isNaN(diast)){
status.innerHTML=""
return
}
if(sist<=129 && diast<=85){
status.innerHTML="🟢 Normal"
status.style.color="#16a34a"
}else if((sist>=130 && sist<=139)||(diast>=86 && diast<=89)){
status.innerHTML="🟡 Atenção"
status.style.color="#ca8a04"
}else if(sist>=140 || diast>=90){
status.innerHTML="🔴 Hipertensão"
status.style.color="#dc2626"
}
}

/* ====================================================
037 – CARREGAR DADOS CLINICOS PACIENTE
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
let html=`<div class="box">
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
</div>`
document.getElementById("dadosClinicosPaciente").innerHTML=html
}
