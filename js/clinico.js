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
if(!data)return
let html=""
let totalPacientes=0
let totalHas=0
let totalDm=0
let totalDemencia=0
let pacienteAtual=null
data.forEach(p=>{
if(pacienteSelecionado!=="todos" && pacienteSelecionado!==p.id)return
if(pacienteSelecionado!=="todos")pacienteAtual=p
totalPacientes++
if(p.has)totalHas++
if(p.dm)totalDm++
if(p.da)totalDemencia++
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
document.getElementById("totalPacientes").innerHTML=totalPacientes
document.getElementById("totalHas").innerHTML=totalHas
document.getElementById("totalDm").innerHTML=totalDm
document.getElementById("totalDemencia").innerHTML=totalDemencia
const divClinico=document.getElementById("dadosClinicosPaciente")
if(!divClinico)return
if(pacienteSelecionado==="todos" || !pacienteAtual){
divClinico.innerHTML=""
return
}
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
<tr><td><b>Paciente</b></td><td>${pacienteAtual.nome_completo}</td></tr>
<tr><td><b>Idade</b></td><td>${calcularIdade(pacienteAtual.data_nascimento)}</td></tr>
<tr><td><b>HAS</b></td><td><select id="clin_has" disabled><option value="true"${pacienteAtual.has?" selected":""}>Sim</option><option value="false"${!pacienteAtual.has?" selected":""}>Não</option></select></td></tr>
<tr><td><b>Diabetes</b></td><td><select id="clin_dm" disabled><option value="true"${pacienteAtual.dm?" selected":""}>Sim</option><option value="false"${!pacienteAtual.dm?" selected":""}>Não</option></select></td></tr>
<tr><td><b>Demência</b></td><td><select id="clin_da" disabled><option value="true"${pacienteAtual.da?" selected":""}>Sim</option><option value="false"${!pacienteAtual.da?" selected":""}>Não</option></select></td></tr>
<tr><td><b>Cardiopatia</b></td><td><select id="clin_cardio" disabled><option value="true"${pacienteAtual.cardiopatia?" selected":""}>Sim</option><option value="false"${!pacienteAtual.cardiopatia?" selected":""}>Não</option></select></td></tr>
<tr><td><b>Acamado</b></td><td><select id="clin_acamado" disabled><option value="true"${pacienteAtual.acamado?" selected":""}>Sim</option><option value="false"${!pacienteAtual.acamado?" selected":""}>Não</option></select></td></tr>
<tr>
<td><b>Pressão Arterial</b></td>
<td><input id="clin_pa" disabled value="${pacienteAtual.pressao_arterial??""}" placeholder="120/80" onblur="formatarPA(this);avaliarPA()"><span id="pa_status" style="margin-left:10px;font-weight:bold"></span></td>
</tr>
<tr>
<td><b>Dieta Especial</b></td>
<td>
<select id="clin_dieta" disabled>
<option value="true"${pacienteAtual.dieta_especial?" selected":""}>Sim</option>
<option value="false"${!pacienteAtual.dieta_especial?" selected":""}>Não</option>
</select>
<input id="clin_dieta_texto" disabled value="${pacienteAtual.dieta_texto??""}" placeholder="Ex: Hipossódica">
</td>
</tr>
<tr>
<td><b>Grau de Risco</b></td>
<td>
<select id="clin_risco" disabled>
<option value="1"${pacienteAtual.grau_risco==1?" selected":""}>1</option>
<option value="2"${pacienteAtual.grau_risco==2?" selected":""}>2</option>
<option value="3"${pacienteAtual.grau_risco==3?" selected":""}>3</option>
<option value="4"${pacienteAtual.grau_risco==4?" selected":""}>4</option>
<option value="5"${pacienteAtual.grau_risco==5?" selected":""}>5</option>
</select>
</td>
</tr>
<tr>
<td><b>Outras Comorbidades</b></td>
<td><input id="clin_outros" disabled value="${pacienteAtual.outras_comorbidades??""}" placeholder="Ex: Osteoporose"></td>
</tr>
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
/* ====================================================
032 – EDITAR DADOS CLINICOS
==================================================== */
function editarClinico(id){
["clin_has","clin_dm","clin_da","clin_cardio","clin_acamado","clin_pa","clin_dieta","clin_dieta_texto","clin_risco","clin_outros"].forEach(c=>{
const el=document.getElementById(c)
if(el)el.removeAttribute("disabled")
})
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
carregarClinico()
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
