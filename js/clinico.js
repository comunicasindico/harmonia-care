function normalizar(txt){
return (txt||"")
.toString()
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g,"")
.trim()
}
/* ====================================================
040 – CARREGAR CLINICO (PADRÃO DEFINITIVO COM DIETA)
==================================================== */
async function carregarClinico(){
const selectPaciente=document.getElementById("buscaPaciente")
const pacienteSelecionado=selectPaciente?selectPaciente.value:"todos"
if(!db){console.error("Supabase ainda não carregou");return}
if(!EMPRESA_ID){console.warn("EMPRESA_ID ainda não carregado");return}
const {data,error}=await db.from("pacientes").select("*").eq("empresa_id",EMPRESA_ID).eq("ativo",true).order("nome_completo")
if(error){console.error(error);return}
const tabela=document.getElementById("quadroClinico")
if(!tabela)return
if(!data||data.length===0){tabela.innerHTML="";return}

/* 🔥 PADRÃO DIETAS */
const DIETAS={
normal:{nome:"Normal",icone:"🍽️",cor:"#f4f6f9"},
hipossodica:{nome:"Hipossódica",icone:"🧂",cor:"#eafaf1"},
diabetica:{nome:"Diabética",icone:"🩸",cor:"#fdecea"},
pastosa:{nome:"Pastosa",icone:"🥣",cor:"#fff3cd"},
liquida:{nome:"Líquida",icone:"🧃",cor:"#e8f4fd"},
vegetariana:{nome:"Vegetariana",icone:"🥗",cor:"#eafaf1"}
}

/* 🔥 IDENTIFICAR DIETA */
function getDietaKey(txt){
let t=(txt||"").toLowerCase()
for(const k in DIETAS){
if(t.includes(DIETAS[k].nome.toLowerCase().replace("é","e")))return k
}
return ""
}

/* 🔥 FORMATAR DIETA */
function formatarDieta(p){
let key=getDietaKey(p.dieta_texto)
if(!key)return "-"
let d=DIETAS[key]
return '<span style="padding:3px 8px;border-radius:6px;font-size:11px;background:'+d.cor+';font-weight:bold;display:inline-block">'+d.icone+' '+d.nome+'</span>'
}

let html=""
let totalPacientes=0,totalHas=0,totalDm=0,totalDemencia=0,totalCardio=0,totalAcamado=0,totalPAAlterada=0
let risco1=0,risco2=0,risco3=0,risco4=0,risco5=0

data.forEach(p=>{
p.has=p.has===true||p.has==="true"||p.has==1
p.dm=p.dm===true||p.dm==="true"||p.dm==1
p.da=p.da===true||p.da==="true"||p.da==1
p.cardiopatia=p.cardiopatia===true||p.cardiopatia==="true"||p.cardiopatia==1
p.acamado=p.acamado===true||p.acamado==="true"||p.acamado==1
p.grau_risco=parseInt(p.grau_risco)||0
let paS=0,paD=0
if(p.pressao_arterial){
let pa=p.pressao_arterial.replace(/\s/g,"").split("/")
if(pa.length===2){
paS=parseInt(pa[0])||0
paD=parseInt(pa[1])||0
}}
p.pa_alterada=(paS>=140||paD>=90)
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
})

const riscoTotal=risco1+risco2+risco3+risco4+risco5

html+=`<tr style="background:#fff200;font-weight:bold;text-align:center"><td>Todos</td><td></td><td style="color:#e74c3c">${totalHas}</td><td style="color:#f39c12">${totalDm}</td><td style="color:#8e44ad">${totalDemencia}</td><td style="color:#c0392b">${totalCardio}</td><td style="color:#34495e">${totalAcamado}</td><td style="color:#e67e22">${totalPAAlterada}</td><td></td><td style="color:#2c3e50">${riscoTotal}</td><td></td></tr>`

data.forEach(p=>{
let dietaKey=getDietaKey(p.dieta_texto)
let dietaHTML=""
if(MODO_EDICAO_CLINICO){
dietaHTML=`<select class="clin_dieta">
<option value="">-</option>
<option value="normal"${dietaKey==="normal"?" selected":""}>🍽️ Normal</option>
<option value="hipossodica"${dietaKey==="hipossodica"?" selected":""}>🧂 Hipossódica</option>
<option value="diabetica"${dietaKey==="diabetica"?" selected":""}>🩸 Diabética</option>
<option value="pastosa"${dietaKey==="pastosa"?" selected":""}>🥣 Pastosa</option>
<option value="liquida"${dietaKey==="liquida"?" selected":""}>🧃 Líquida</option>
<option value="vegetariana"${dietaKey==="vegetariana"?" selected":""}>🥗 Vegetariana</option>
</select>`
}else{
dietaHTML=formatarDieta(p)
}

html+=`<tr data-id="${p.id}" style="${p.grau_risco>=4?'background:#ffe5e5':''} ${p.pa_alterada?'border-left:6px solid #e74c3c':''}">
<td>${p.nome_apelido||p.nome_completo||""}</td>
<td>${calcularIdade(p.data_nascimento)}</td>
<td>${MODO_EDICAO_CLINICO?`<select class="clin_has"><option value="true"${p.has?" selected":""}>✔</option><option value="false"${!p.has?" selected":""}></option></select>`:(p.has?"✔":"")}</td>
<td>${MODO_EDICAO_CLINICO?`<select class="clin_dm"><option value="true"${p.dm?" selected":""}>✔</option><option value="false"${!p.dm?" selected":""}></option></select>`:(p.dm?"✔":"")}</td>
<td>${MODO_EDICAO_CLINICO?`<select class="clin_da"><option value="true"${p.da?" selected":""}>✔</option><option value="false"${!p.da?" selected":""}></option></select>`:(p.da?"✔":"")}</td>
<td>${MODO_EDICAO_CLINICO?`<select class="clin_cardio"><option value="true"${p.cardiopatia?" selected":""}>✔</option><option value="false"${!p.cardiopatia?" selected":""}></option></select>`:(p.cardiopatia?"✔":"")}</td>
<td>${MODO_EDICAO_CLINICO?`<select class="clin_acamado"><option value="true"${p.acamado?" selected":""}>✔</option><option value="false"${!p.acamado?" selected":""}></option></select>`:(p.acamado?"✔":"")}</td>
<td>${MODO_EDICAO_CLINICO?`<input class="clin_pa" value="${p.pressao_arterial||""}" placeholder="120/80">`:(p.pressao_arterial?(p.pa_alterada?`<span style="color:#e74c3c;font-weight:bold">${p.pressao_arterial}</span>`:p.pressao_arterial):"")}</td>
<td>${dietaHTML}</td>
<td>${MODO_EDICAO_CLINICO?`<select class="clin_risco"><option value="1"${p.grau_risco==1?" selected":""}>1</option><option value="2"${p.grau_risco==2?" selected":""}>2</option><option value="3"${p.grau_risco==3?" selected":""}>3</option><option value="4"${p.grau_risco==4?" selected":""}>4</option><option value="5"${p.grau_risco==5?" selected":""}>5</option></select>`:(p.grau_risco?`<b style="color:${p.grau_risco>=4?'#e74c3c':'#2c3e50'}">${p.grau_risco}</b>`:"")}</td>
<td>${MODO_EDICAO_CLINICO?`<input class="clin_outros" value="${p.outras_comorbidades||""}">`:(p.outras_comorbidades||"Não tem")}</td>
<td class="acoesClinico" style="${MODO_EDICAO_CLINICO?'':'display:none'}"><button class="btn-danger" onclick="excluirPaciente('${p.id}')">Excluir</button></td>
</tr>`
})

tabela.innerHTML=html

/* ====================================================
041 – PAINEL NUTRICIONAL (PADRÃO NOVO)
==================================================== */
let totalDietas=0,hipossodica=0,diabetica=0,pastosa=0,vegetariana=0,liquida=0

data.forEach(p=>{
let key=getDietaKey(p.dieta_texto)
if(!key)return
totalDietas++
if(key==="hipossodica")hipossodica++
if(key==="diabetica")diabetica++
if(key==="pastosa")pastosa++
if(key==="vegetariana")vegetariana++
if(key==="liquida")liquida++
})

const elTotal=document.getElementById("dietaTotal"),elHip=document.getElementById("dietaHipossodica"),elDia=document.getElementById("dietaDiabetica"),elPas=document.getElementById("dietaPastosa"),elVeg=document.getElementById("dietaVegetariana"),elLiq=document.getElementById("dietaLiquida")

if(elTotal)elTotal.innerText=`🍽️ ${totalDietas}`
if(elHip)elHip.innerText=`🧂 ${hipossodica}`
if(elDia)elDia.innerText=`🩸 ${diabetica}`
if(elPas)elPas.innerText=`🥣 ${pastosa}`
if(elVeg)elVeg.innerText=`🥗 ${vegetariana}`
if(elLiq)elLiq.innerText=`🧃 ${liquida}`
}
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
045 – SALVAR CLÍNICO GLOBAL (COM DIETA PADRONIZADA)
==================================================== */
async function salvarClinicoGlobal(){
if(!db)return
const linhas=document.querySelectorAll("#quadroClinico tr[data-id]")
const DIETAS={
normal:{nome:"Normal",icone:"🍽️"},
hipossodica:{nome:"Hipossódica",icone:"🧂"},
diabetica:{nome:"Diabética",icone:"🩸"},
pastosa:{nome:"Pastosa",icone:"🥣"},
liquida:{nome:"Líquida",icone:"🧃"},
vegetariana:{nome:"Vegetariana",icone:"🥗"}
}
const bool=v=>v==="1"||v==="true"||v==="sim"
const getVal=(linha,cls)=>linha.querySelector(cls)?.value||""
let total=linhas.length
let atual=0
for(const linha of linhas){
const id=linha.dataset.id
if(!id)continue
const dietaKey=(getVal(linha,".clin_dieta")||"").toLowerCase().trim()
const dietaObj=DIETAS[dietaKey]||null
const dados={
has:bool(getVal(linha,".clin_has")),
dm:bool(getVal(linha,".clin_dm")),
da:bool(getVal(linha,".clin_da")),
cardiopatia:bool(getVal(linha,".clin_cardio")),
acamado:bool(getVal(linha,".clin_acamado")),
pressao_arterial:(getVal(linha,".clin_pa")||"").trim()||null,
dieta_especial:dietaObj?true:false,
dieta_texto:dietaObj?dietaObj.nome:null,
grau_risco:parseInt(getVal(linha,".clin_risco")||0),
outras_comorbidades:(getVal(linha,".clin_outros")||"").trim()||null
}
try{
const {error}=await db.from("pacientes").update(dados).eq("id",id)
if(error)console.error("Erro ao salvar paciente:",id,error)
}catch(e){
console.error("Erro inesperado:",id,e)
}
atual++
if(window.atualizarBarraProgresso){
let p=Math.round((atual/total)*100)
atualizarBarraProgresso(p)
}
}
MODO_EDICAO_CLINICO=false
await carregarClinico()
alert("Dados salvos com sucesso!")
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
<tr>
<td><b>Outras Comorbidades</b></td>
<td style="color:#c0392b;font-weight:bold">
${data.outras_comorbidades&&data.outras_comorbidades.trim()!==""?data.outras_comorbidades:"Não informado"}
</td>
</tr>
</table></div>`
box.innerHTML=html
}



