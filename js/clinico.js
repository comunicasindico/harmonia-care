/* ====================================================
040 – CARREGAR CLINICO
==================================================== */
async function carregarClinico(){
const selectPaciente=document.getElementById("buscaPaciente")
const pacienteSelecionado=selectPaciente?selectPaciente.value:"todos"
if(!db){console.error("Supabase ainda não carregou");return}
if(!EMPRESA_ID){console.error("EMPRESA_ID null");return}  // 👈 AQUI
const {data,error}=await db.from("pacientes").select("*").eq("empresa_id",EMPRESA_ID).eq("ativo",true).order("nome_completo")
if(error){console.error(error);return}
const tabela=document.getElementById("quadroClinico")
if(!tabela)return
if(!data||data.length===0){tabela.innerHTML="";return}
let html=""
let totalPacientes=0,totalHas=0,totalDm=0,totalDemencia=0,totalCardio=0,totalAcamado=0,totalPAAlterada=0
let risco1=0,risco2=0,risco3=0,risco4=0,risco5=0
data.forEach(p=>{

p.has = p.has===true || p.has==="true" || p.has==1
p.dm = p.dm===true || p.dm==="true" || p.dm==1
p.da = p.da===true || p.da==="true" || p.da==1
p.cardiopatia = p.cardiopatia===true || p.cardiopatia==="true" || p.cardiopatia==1
p.acamado = p.acamado===true || p.acamado==="true" || p.acamado==1

p.grau_risco = parseInt(p.grau_risco)||0

let paS=0,paD=0
if(p.pressao_arterial){
let pa=p.pressao_arterial.replace(/\s/g,"").split("/")
if(pa.length===2){
paS=parseInt(pa[0])||0
paD=parseInt(pa[1])||0
}
}
p.pa_alterada = (paS>=140 || paD>=90)

totalPacientes++
if(p.has)totalHas++
if(p.dm)totalDm++
if(p.da)totalDemencia++
if(p.cardiopatia)totalCardio++
if(p.acamado)totalAcamado++
if(p.pa_alterada)totalPAAlterada++

if(p.grau_risco===1)risco1++
if(p.grau_risco===2)risco2++
if(p.grau_risco===3)risco3++
if(p.grau_risco===4)risco4++
if(p.grau_risco===5)risco5++
/* 🔥 BONUS AQUI */
if(p.pa_alterada && p.grau_risco>=4){
console.warn("PACIENTE CRÍTICO:",p.nome_completo)
}
})
const riscoTotal=risco1+risco2+risco3+risco4+risco5
html+=`<tr style="background:#fff200;font-weight:bold;text-align:center"><td>Todos</td><td></td><td style="color:#e74c3c">${totalHas}</td><td style="color:#f39c12">${totalDm}</td><td style="color:#8e44ad">${totalDemencia}</td><td style="color:#c0392b">${totalCardio}</td><td style="color:#34495e">${totalAcamado}</td><td style="color:#e67e22">${totalPAAlterada}</td><td></td><td style="color:#2c3e50">${riscoTotal}</td><td></td></tr>`
data.forEach(p=>{
html+=`<tr data-id="${p.id}" style="
${p.grau_risco>=4?'background:#ffe5e5':''}
${p.pa_alterada?'border-left:6px solid #e74c3c':''}
">
<td>${p.nome_apelido||p.nome_completo||""}</td>
<td>${calcularIdade(p.data_nascimento)}</td>
<td>${MODO_EDICAO_CLINICO?`<select class="clin_has"><option value="true"${p.has?" selected":""}>✔</option><option value="false"${!p.has?" selected":""}></option></select>`:(p.has?"✔":"")}</td>
<td>${MODO_EDICAO_CLINICO?`<select class="clin_dm"><option value="true"${p.dm?" selected":""}>✔</option><option value="false"${!p.dm?" selected":""}></option></select>`:(p.dm?"✔":"")}</td>
<td>${MODO_EDICAO_CLINICO?`<select class="clin_da"><option value="true"${p.da?" selected":""}>✔</option><option value="false"${!p.da?" selected":""}></option></select>`:(p.da?"✔":"")}</td>
<td>${MODO_EDICAO_CLINICO?`<select class="clin_cardio"><option value="true"${p.cardiopatia?" selected":""}>✔</option><option value="false"${!p.cardiopatia?" selected":""}></option></select>`:(p.cardiopatia?"✔":"")}</td>
<td>${MODO_EDICAO_CLINICO?`<select class="clin_acamado"><option value="true"${p.acamado?" selected":""}>✔</option><option value="false"${!p.acamado?" selected":""}></option></select>`:(p.acamado?"✔":"")}</td>
<td>${MODO_EDICAO_CLINICO?`<input class="clin_pa" value="${p.pressao_arterial||""}" placeholder="120/80">`:(p.pressao_arterial? (p.pa_alterada?`<span style="color:#e74c3c;font-weight:bold">${p.pressao_arterial}</span>`:p.pressao_arterial):"")}</td>
<td>${MODO_EDICAO_CLINICO?`
<select class="clin_dieta">
<option value="">Selecione</option>
<option value="Hipossódica"${p.dieta_texto==="Hipossódica"?" selected":""}>Hipossódica</option>
<option value="Diabética"${p.dieta_texto==="Diabética"?" selected":""}>Diabética</option>
<option value="Pastosa"${p.dieta_texto==="Pastosa"?" selected":""}>Pastosa</option>
<option value="Líquida"${p.dieta_texto==="Líquida"?" selected":""}>Líquida</option>
<option value="Vegetariana"${p.dieta_texto==="Vegetariana"?" selected":""}>Vegetariana</option>
<option value="Normal"${p.dieta_texto==="Normal"?" selected":""}>Normal</option>
</select>
`:(p.dieta_texto||"-")}</td>
<td>${MODO_EDICAO_CLINICO?`<select class="clin_risco"><option value="1"${p.grau_risco==1?" selected":""}>1</option><option value="2"${p.grau_risco==2?" selected":""}>2</option><option value="3"${p.grau_risco==3?" selected":""}>3</option><option value="4"${p.grau_risco==4?" selected":""}>4</option><option value="5"${p.grau_risco==5?" selected":""}>5</option></select>`:(p.grau_risco?`<b style="color:${p.grau_risco>=4?'#e74c3c':'#2c3e50'}">${p.grau_risco}</b>`:"")}</td>
<td>${MODO_EDICAO_CLINICO?`<input class="clin_outros" value="${p.outras_comorbidades||""}">`:(p.outras_comorbidades||"Não tem")}</td>
<td class="acoesClinico" style="${MODO_EDICAO_CLINICO?'':'display:none'}"><button class="btn-danger" onclick="excluirPaciente('${p.id}')">Excluir</button></td>
</tr>`
})
tabela.innerHTML=html
/* ===============================
041 PAINEL NUTRICIONAL
=============================== */
let totalDietas=0,hipossodica=0,diabetica=0,pastosa=0,vegetariana=0,liquida=0
data.forEach(p=>{if(!p.dieta_especial)return;totalDietas++;let d=(p.dieta_texto||"").toLowerCase();if(d.includes("hipossod"))hipossodica++;else if(d.includes("diab"))diabetica++;else if(d.includes("past"))pastosa++;else if(d.includes("veget"))vegetariana++;else if(d.includes("liquid"))liquida++})
const elTotal=document.getElementById("dietaTotal"),elHip=document.getElementById("dietaHipossodica"),elDia=document.getElementById("dietaDiabetica"),elPas=document.getElementById("dietaPastosa"),elVeg=document.getElementById("dietaVegetariana"),elLiq=document.getElementById("dietaLiquida")
if(elTotal)elTotal.innerText=`🍽️ ${totalDietas}`
if(elHip)elHip.innerText=`🧂 ${hipossodica}`
if(elDia)elDia.innerText=`🍬 ${diabetica}`
if(elPas)elPas.innerText=`🥣 ${pastosa}`
if(elVeg)elVeg.innerText=`🥗 ${vegetariana}`
if(elLiq)elLiq.innerText=`🥤 ${liquida}`
/* ===============================
042 INDICADORES VISUAIS
=============================== */
const elR5=document.getElementById("indicadorRISCO5")
const elR4=document.getElementById("indicadorRISCO4")
const elR3=document.getElementById("indicadorRISCO3")
const elR12=document.getElementById("indicadorRISCO12")
if(elR5)elR5.innerHTML=`🔴 Alto ${risco5}`
if(elR4)elR4.innerHTML=`🟠 Médio ${risco4}`
if(elR3)elR3.innerHTML=`🟡 Moderado ${risco3}`
if(elR12)elR12.innerHTML=`🟢 Baixo ${risco1+risco2}`
}
/* ====================================================
043 – CALCULAR IDADE
==================================================== */
function calcularIdade(data){
if(!data)return""
const nascimento=new Date(data)
const hoje=new Date()
let idade=hoje.getFullYear()-nascimento.getFullYear()
const m=hoje.getMonth()-nascimento.getMonth()
if(m<0||(m===0&&hoje.getDate()<nascimento.getDate()))idade--
return idade
}
/* ====================================================
044 – EDITAR CLINICO GLOBAL
==================================================== */
function editarClinicoGlobal(){MODO_EDICAO_CLINICO=true;carregarClinico()}
/* ====================================================
045 – SALVAR CLINICO GLOBAL (CORRIGIDO E PADRONIZADO)
==================================================== */
async function salvarClinicoGlobal(){
if(!db)return
const linhas=document.querySelectorAll("#quadroClinico tr[data-id]")
for(const linha of linhas){
const id=linha.dataset.id
const dietaValor=(linha.querySelector(".clin_dieta")?.value||"").trim()
const dados={
has:linha.querySelector(".clin_has")?.value==="true",
dm:linha.querySelector(".clin_dm")?.value==="true",
da:linha.querySelector(".clin_da")?.value==="true",
cardiopatia:linha.querySelector(".clin_cardio")?.value==="true",
acamado:linha.querySelector(".clin_acamado")?.value==="true",
pressao_arterial:(linha.querySelector(".clin_pa")?.value||"").trim(),
dieta_texto:dietaValor||null,
dieta_especial:dietaValor!==""?true:false,
grau_risco:parseInt(linha.querySelector(".clin_risco")?.value||0),
outras_comorbidades:(linha.querySelector(".clin_outros")?.value||"").trim()
}
const {error}=await db.from("pacientes").update(dados).eq("id",id)
if(error)console.error("Erro ao salvar paciente:",id,error)
}
MODO_EDICAO_CLINICO=false
await carregarClinico()
}
/* ====================================================
046 – CARREGAR DADOS CLÍNICOS DO PACIENTE
==================================================== */
async function carregarDadosClinicosPaciente(pacienteId){
const box=document.getElementById("dadosClinicosPaciente")
if(!box)return
if(!pacienteId||pacienteId==="todos"){box.innerHTML="";return}
if(!db){console.error("Supabase ainda não carregou");return}
const {data,error}=await db.from("pacientes").select("*").eq("id",pacienteId).single()
if(error){console.error("Erro clínico paciente",error);return}
let html=`<div class="box"><h3>Dados Clínicos do Paciente</h3><table class="tabela-clinica-edicao">
<tr><td><b>Paciente</b></td><td>${data.nome_completo}</td></tr>
<tr><td><b>Idade</b></td><td>${calcularIdade(data.data_nascimento)}</td></tr>
<tr><td><b>HAS</b></td><td>${data.has?"✔ SIM":"—"}</td></tr>
<tr><td><b>Diabetes</b></td><td>${data.dm?"✔ SIM":"—"}</td></tr>
<tr><td><b>Demência</b></td><td>${data.da?"✔ SIM":"—"}</td></tr>
<tr><td><b>Cardiopatia</b></td><td>${data.cardiopatia?"✔ SIM":"—"}</td></tr>
<tr><td><b>Acamado</b></td><td>${data.acamado?"✔ SIM":"—"}</td></tr>
<tr><td><b>Pressão Arterial</b></td><td>${data.pressao_arterial??"-"}</td></tr>
<tr><td><b>Dieta Especial</b></td><td>${data.dieta_especial?"SIM":"NÃO"} ${data.dieta_texto??""}</td></tr>
<tr><td><b>Grau de Risco</b></td><td>${data.grau_risco??"-"}</td></tr>
<tr><td><b>Outras Comorbidades</b></td><td>${data.outras_comorbidades??"-"}</td></tr>
</table></div>`
box.innerHTML=html
}



