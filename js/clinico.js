/* ====================================================
030 – CARREGAR CLINICO
==================================================== */
async function carregarClinico(){
const selectPaciente=document.getElementById("buscaPaciente")
const pacienteSelecionado=selectPaciente?selectPaciente.value:"todos"
if(!db){console.error("Supabase ainda não carregou");return}
const {data,error}=await db.from("pacientes").select("*").eq("empresa_id",EMPRESA_ID).eq("ativo",true).order("nome_completo")
if(error){console.error(error);return}
if(!data||data.length===0){const tabela=document.getElementById("quadroClinico");if(tabela)tabela.innerHTML="";return}
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
if(pacienteSelecionado!=="todos"&&pacienteSelecionado===p.id){pacienteAtual=p}
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
}}
if(p.grau_risco==1)risco1++
if(p.grau_risco==2)risco2++
if(p.grau_risco==3)risco3++
if(p.grau_risco==4)risco4++
if(p.grau_risco==5)risco5++

html+=`<tr data-id="${p.id}">

<td>${p.nome_completo??""}</td>

<td>${calcularIdade(p.data_nascimento)}</td>

<td>
<select class="campo-clinico clin_has" disabled>
<option value="true"${p.has?" selected":""}>✔</option>
<option value="false"${!p.has?" selected":""}></option>
</select>
</td>

<td>
<select class="campo-clinico clin_dm" disabled>
<option value="true"${p.dm?" selected":""}>✔</option>
<option value="false"${!p.dm?" selected":""}></option>
</select>
</td>

<td>
<select class="campo-clinico clin_da" disabled>
<option value="true"${p.da?" selected":""}>✔</option>
<option value="false"${!p.da?" selected":""}></option>
</select>
</td>

<td>
<select class="campo-clinico clin_cardio" disabled>
<option value="true"${p.cardiopatia?" selected":""}>✔</option>
<option value="false"${!p.cardiopatia?" selected":""}></option>
</select>
</td>

<td>
<select class="campo-clinico clin_acamado" disabled>
<option value="true"${p.acamado?" selected":""}>✔</option>
<option value="false"${!p.acamado?" selected":""}></option>
</select>
</td>

<td>
<input class="campo-clinico clin_pa"
value="${p.pressao_arterial??""}"
placeholder="120/80"
disabled>
</td>

<td>
<input class="campo-clinico clin_dieta"
value="${p.dieta_texto??""}"
placeholder="Dieta especial"
disabled>
</td>

<td>
<select class="campo-clinico clin_risco" disabled>
<option value="1"${p.grau_risco==1?" selected":""}>1</option>
<option value="2"${p.grau_risco==2?" selected":""}>2</option>
<option value="3"${p.grau_risco==3?" selected":""}>3</option>
<option value="4"${p.grau_risco==4?" selected":""}>4</option>
<option value="5"${p.grau_risco==5?" selected":""}>5</option>
</select>
</td>

<td>
<input class="campo-clinico clin_outros"
value="${p.outras_comorbidades??""}"
placeholder="Outras"
disabled>
</td>

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
const divClinico=document.getElementById("dadosClinicosPaciente")
if(!divClinico)return
if(pacienteSelecionado==="todos"||!pacienteAtual){divClinico.innerHTML="";return}
divClinico.innerHTML=`<div class="box">
<h3>Dados Clínicos do Paciente</h3>
<div style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">
<div style="display:flex;gap:10px">
<button class="btn-primary" onclick="editarClinico('${pacienteAtual.id}')">Editar</button>
<button class="btn-success" onclick="salvarClinico('${pacienteAtual.id}')">Salvar</button>
</div>
<div>
<button class="btn-danger" onclick="excluirClinico('${pacienteAtual.id}')">Excluir</button>
</div>
</div>
<table class="tabela-clinica-edicao">
<tr><td><b>Paciente</b></td><td><b>${pacienteAtual.nome_completo}</b></td></tr>
<tr><td><b>Idade</b></td><td><b>${calcularIdade(pacienteAtual.data_nascimento)}</b></td></tr>
<tr><td><b>HAS</b></td><td>${MODO_EDICAO_CLINICO?`<select id="clin_has"><option value="true"${pacienteAtual.has?" selected":""}>Sim</option><option value="false"${!pacienteAtual.has?" selected":""}>Não</option></select>`:`<b>${pacienteAtual.has?"SIM":"NÃO"}</b>`}</td></tr>
<tr><td><b>Diabetes</b></td><td>${MODO_EDICAO_CLINICO?`<select id="clin_dm"><option value="true"${pacienteAtual.dm?" selected":""}>Sim</option><option value="false"${!pacienteAtual.dm?" selected":""}>Não</option></select>`:`<b>${pacienteAtual.dm?"SIM":"NÃO"}</b>`}</td></tr>
<tr><td><b>Demência</b></td><td>${MODO_EDICAO_CLINICO?`<select id="clin_da"><option value="true"${pacienteAtual.da?" selected":""}>Sim</option><option value="false"${!pacienteAtual.da?" selected":""}>Não</option></select>`:`<b>${pacienteAtual.da?"SIM":"NÃO"}</b>`}</td></tr>
<tr><td><b>Cardiopatia</b></td><td>${MODO_EDICAO_CLINICO?`<select id="clin_cardio"><option value="true"${pacienteAtual.cardiopatia?" selected":""}>Sim</option><option value="false"${!pacienteAtual.cardiopatia?" selected":""}>Não</option></select>`:`<b>${pacienteAtual.cardiopatia?"SIM":"NÃO"}</b>`}</td></tr>
<tr><td><b>Acamado</b></td><td>${MODO_EDICAO_CLINICO?`<select id="clin_acamado"><option value="true"${pacienteAtual.acamado?" selected":""}>Sim</option><option value="false"${!pacienteAtual.acamado?" selected":""}>Não</option></select>`:`<b>${pacienteAtual.acamado?"SIM":"NÃO"}</b>`}</td></tr>
<tr><td><b>Pressão Arterial</b></td><td>${MODO_EDICAO_CLINICO?`<input id="clin_pa" value="${pacienteAtual.pressao_arterial??""}" placeholder="120/80" onblur="formatarPA(this);avaliarPA()">`:`<b>${pacienteAtual.pressao_arterial??"-"}</b>`}</td></tr>
<tr><td><b>Dieta Especial</b></td><td>${MODO_EDICAO_CLINICO?`<select id="clin_dieta"><option value="true"${pacienteAtual.dieta_especial?" selected":""}>Sim</option><option value="false"${!pacienteAtual.dieta_especial?" selected":""}>Não</option></select><input id="clin_dieta_texto" value="${pacienteAtual.dieta_texto??""}" placeholder="Ex: Hipossódica">`:`<b>${pacienteAtual.dieta_especial?"SIM":"NÃO"} ${pacienteAtual.dieta_texto??""}</b>`}</td></tr>
<tr><td><b>Grau de Risco</b></td><td>${MODO_EDICAO_CLINICO?`<select id="clin_risco"><option value="1"${pacienteAtual.grau_risco==1?" selected":""}>1</option><option value="2"${pacienteAtual.grau_risco==2?" selected":""}>2</option><option value="3"${pacienteAtual.grau_risco==3?" selected":""}>3</option><option value="4"${pacienteAtual.grau_risco==4?" selected":""}>4</option><option value="5"${pacienteAtual.grau_risco==5?" selected":""}>5</option></select>`:`<b>${pacienteAtual.grau_risco??"-"}</b>`}</td></tr>
<tr><td><b>Outras Comorbidades</b></td><td>${MODO_EDICAO_CLINICO?`<input id="clin_outros" value="${pacienteAtual.outras_comorbidades??""}" placeholder="Ex: Osteoporose">`:`<b>${pacienteAtual.outras_comorbidades??"-"}</b>`}</td></tr>
</table>
</div>`
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
/* ====================================================
038 – EDITAR DADOS CLINICOS GLOBAL
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
039 – SALVAR CLINICOS GLOBAL
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
