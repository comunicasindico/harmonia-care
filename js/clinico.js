function normalizar(txt){
return (txt||"")
.toString()
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g,"")
.trim()
}
/* ====================================================
039 – CLASSIFICAÇÃO PRESSÃO ARTERIAL
==================================================== */
function classificarPA(pa){
if(!pa)return""
let v=pa.replace(/\s/g,"").split("/")
if(v.length!==2)return""
let s=parseInt(v[0])||0
let d=parseInt(v[1])||0
if(s<120&&d<80)return"normal"
if((s>=120&&s<=139)||(d>=80&&d<=89))return"limítrofe"
if((s>=140&&s<=159)||(d>=90&&d<=99))return"leve"
if(s>=160||d>=100)return"grave"
return""
}
/* ====================================================
039A – CARREGAR CLINICO
==================================================== */
async function carregarClinico(){
const selectPaciente=document.getElementById("buscaPaciente")
const pacienteSelecionado=selectPaciente?selectPaciente.value:"todos"
if(!db){console.error("Supabase ainda não carregou");return}
if(!EMPRESA_ID){console.warn("EMPRESA_ID ainda não carregado");return}
/* 🔥 FILTRO POR USUÁRIO (CLÍNICO) */
let usuarioId=localStorage.getItem("usuario_id")||PROFISSIONAL_ID||null
let query=db.from("pacientes").select("*")
if(usuarioId&&usuarioId!=="admin"){
const {data:rel}=await db.from("pacientes_profissionais").select("paciente_id").eq("usuario_id",usuarioId).eq("ativo",true)
const ids=rel?.map(r=>r.paciente_id)||[]
if(ids.length){query=query.in("id",ids)}else{console.warn("Usuário sem pacientes vinculados");const tabela=document.getElementById("quadroClinico");if(tabela)tabela.innerHTML="";return}
}
const {data,error}=await query.eq("empresa_id",EMPRESA_ID).eq("ativo",true).order("nome_completo")
if(error){console.error(error);return}
const tabela=document.getElementById("quadroClinico")
if(!tabela)return
if(!data||data.length===0){tabela.innerHTML="";return}
/* 🔥 PADRÃO DIETAS */
const DIETAS={normal:{nome:"Normal",icone:"🍽️",cor:"#f4f6f9"},hipossodica:{nome:"Hipossódica",icone:"🧂",cor:"#eafaf1"},diabetica:{nome:"Diabética",icone:"🩸",cor:"#fdecea"},pastosa:{nome:"Pastosa",icone:"🥣",cor:"#fff3cd"},liquida:{nome:"Líquida",icone:"🧃",cor:"#e8f4fd"},vegetariana:{nome:"Vegetariana",icone:"🥗",cor:"#eafaf1"}}

function getDietaKey(txt){
let t=(txt||"").toString().toLowerCase().trim()
if(!t||t==="-"||t==="nao"||t==="não")return "normal"
t=t.normalize("NFD").replace(/[\u0300-\u036f]/g,"")
if(t.includes("normal"))return "normal"
if(t.includes("hipossodica"))return "hipossodica"
if(t.includes("diabetica"))return "diabetica"
if(t.includes("pastosa"))return "pastosa"
if(t.includes("liquida"))return "liquida"
if(t.includes("vegetariana"))return "vegetariana"
return "normal"
}

function formatarDieta(p){let key=getDietaKey(p.dieta_texto);if(!key)return"-";let d=DIETAS[key];return'<span style="padding:3px 8px;border-radius:6px;font-size:11px;background:'+d.cor+';font-weight:bold;display:inline-block">'+d.icone+' '+d.nome+'</span>'}
let html=""
let totalPacientes=0,totalHas=0,totalDm=0,totalDemencia=0,totalCardio=0,totalAcamado=0,totalPAAlterada=0
let risco1=0,risco2=0,risco3=0,risco4=0,risco5=0
let dietaNormal=0,hipossodica=0,diabetica=0,pastosa=0,vegetariana=0,liquida=0

data.forEach(p=>{

/* 🔥 NORMALIZAÇÃO */
let paS=0,paD=0
if(p.pressao_arterial){
let pa=p.pressao_arterial.replace(/\s/g,"").split("/")
if(pa.length===2){
paS=parseInt(pa[0])||0
paD=parseInt(pa[1])||0
}
}

p.pa_alterada=(paS>=140||paD>=90)
p.has=p.has===true||p.has==="true"||p.has==1
p.dm=p.dm===true||p.dm==="true"||p.dm==1
p.da=p.da===true||p.da==="true"||p.da==1
p.cardiopatia=p.cardiopatia===true||p.cardiopatia==="true"||p.cardiopatia==1
p.acamado=p.acamado===true||p.acamado==="true"||p.acamado==1
p.grau_risco=parseInt(p.grau_risco)||0

/* 🔥 CONTADORES GERAIS */
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

/* 🔥 DIETAS */
let dietaKey=getDietaKey(p.dieta_texto)
/* 🔥 TODOS entram */
if(dietaKey==="hipossodica")hipossodica++
else if(dietaKey==="diabetica")diabetica++
else if(dietaKey==="pastosa")pastosa++
else if(dietaKey==="vegetariana")vegetariana++
else if(dietaKey==="liquida")liquida++
else dietaNormal++
}

/* 🔥 VISUAL */
let destaqueCritico=""
if(p.grau_risco>=4&&p.pa_alterada)destaqueCritico="animation:pulse 1s infinite alternate;"

let corLinha="#fff"
if(p.grau_risco>=4)corLinha="#ffe5e5"
else if(p.grau_risco===3)corLinha="#fff8e1"

let borda=""
if(p.pa_alterada)borda="border-left:6px solid #e74c3c"

let dietaHTML=""
if(MODO_EDICAO_CLINICO){
dietaHTML=`<select class="clin_dieta"><option value="">-</option>
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

/* 🔥 HTML */
html+=`<tr data-id="${p.id}" style="background:${corLinha};${borda}${destaqueCritico}">
<td>${p.nome_apelido||p.nome_completo||""}</td>
<td>${calcularIdade(p.data_nascimento)}</td>
<td>${p.has?"✔":""}</td>
<td>${p.dm?"✔":""}</td>
<td>${p.da?"✔":""}</td>
<td>${p.cardiopatia?"✔":""}</td>
<td>${p.acamado?"✔":""}</td>
<td>${p.pressao_arterial?`<span style="color:${p.pa_alterada?'#e74c3c':'#27ae60'};font-weight:bold">${p.pressao_arterial}</span>`:""}</td>
<td>${dietaHTML}</td>
<td><b style="color:${p.grau_risco>=4?'#e74c3c':'#2c3e50'}">${p.grau_risco||""}</b></td>
<td>${p.outras_comorbidades||"Não tem"}</td>
</tr>`

})

/* 🔥 LINHA TOTAL */
const riscoTotal=risco1+risco2+risco3+risco4+risco5
html=`<tr style="background:#fff200;font-weight:bold;text-align:center">
<td>Todos</td><td></td>
<td style="color:#e74c3c">${totalHas}</td>
<td style="color:#f39c12">${totalDm}</td>
<td style="color:#8e44ad">${totalDemencia}</td>
<td style="color:#c0392b">${totalCardio}</td>
<td style="color:#34495e">${totalAcamado}</td>
<td style="color:#e67e22">${totalPAAlterada}</td>
<td></td>
<td style="color:#2c3e50">${riscoTotal}</td>
<td></td>
</tr>`+html
tabela.innerHTML=html
  

const elTotal=document.getElementById("dietaTotal"),elHip=document.getElementById("dietaHipossodica"),elDia=document.getElementById("dietaDiabetica"),elPas=document.getElementById("dietaPastosa"),elVeg=document.getElementById("dietaVegetariana"),elLiq=document.getElementById("dietaLiquida")

const totalDietas=dietaNormal+hipossodica+diabetica+pastosa+vegetariana+liquida

if(elTotal)elTotal.innerText=`🍽️ ${dietaNormal}`
if(elHip)elHip.innerText=`🧂 ${hipossodica}`
if(elDia)elDia.innerText=`🩸 ${diabetica}`
if(elPas)elPas.innerText=`🥣 ${pastosa}`
if(elVeg)elVeg.innerText=`🥗 ${vegetariana}`
if(elLiq)elLiq.innerText=`🧃 ${liquida}`
const elRisco=document.getElementById("painelRiscoResumo")
if(elRisco){
try{
elRisco.innerHTML=`
<span style="background:#2ecc71;color:#fff;padding:4px 10px;border-radius:6px">Baixo ${risco1+risco2}</span>
<span style="background:#f1c40f;color:#fff;padding:4px 10px;border-radius:6px">Moderado ${risco3}</span>
<span style="background:#e67e22;color:#fff;padding:4px 10px;border-radius:6px">Médio ${risco4}</span>
<span style="background:#e74c3c;color:#fff;padding:4px 10px;border-radius:6px">Alto ${risco5}</span>
`
}catch(e){
console.error("Erro painel risco",e)
}
}
/* ===============================
040B INDICADORES VISUAIS
=============================== */
const elR5=document.getElementById("indicadorRISCO5")
const elR4=document.getElementById("indicadorRISCO4")
const elR3=document.getElementById("indicadorRISCO3")
const elR12=document.getElementById("indicadorRISCO12")
if(elR5)elR5.innerHTML=`🔴 Alto ${risco5}`
if(elR4)elR4.innerHTML=`🟠 Médio ${risco4}`
if(elR3)elR3.innerHTML=`🟡 Moderado ${risco3}`
if(elR12)elR12.innerHTML=`🟢 Baixo ${risco1+risco2}`
document.querySelectorAll("#quadroClinico select,#quadroClinico input").forEach(el=>{
el.onchange=null
el.onchange=async()=>{
if(!pode("editar_clinico"))return
const linha=el.closest("tr")
if(!linha)return
const id=linha.dataset.id
if(!id)return
const bool=v=>v==="true"||v==="1"||v==="sim"
let dados={}
if(el.className.includes("clin_has"))dados.has=bool(el.value)
if(el.className.includes("clin_dm"))dados.dm=bool(el.value)
if(el.className.includes("clin_da"))dados.da=bool(el.value)
if(el.className.includes("clin_cardio"))dados.cardiopatia=bool(el.value)
if(el.className.includes("clin_acamado"))dados.acamado=bool(el.value)
if(el.className.includes("clin_pa"))dados.pressao_arterial=el.value||null
if(el.className.includes("clin_pa_class"))dados.pa_classificacao=el.value||null
if(el.className.includes("clin_risco"))dados.grau_risco=parseInt(el.value||0)
if(el.className.includes("clin_outros"))dados.outras_comorbidades=el.value||null
if(el.className.includes("clin_dieta")){
const mapa={normal:"Normal",hipossodica:"Hipossódica",diabetica:"Diabética",pastosa:"Pastosa",liquida:"Líquida",vegetariana:"Vegetariana"}
dados.dieta_especial=el.value?true:false
dados.dieta_texto=mapa[el.value]||null
}
if(Object.keys(dados).length===0)return
await db.from("pacientes").update(dados).eq("id",id).eq("empresa_id",EMPRESA_ID)
linha.style.transition="all 0.3s"
linha.style.background="#d4edda"
setTimeout(()=>{linha.style.background=""},800)
}
})
}
/* ====================================================
041 – CALCULAR IDADE
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
function editarClinicoGlobal(){MODO_EDICAO_CLINICO=true;carregarClinico()}
async function salvarClinicoGlobal(){
if(!db)return
if(!pode("salvar_clinico")){
alert("Sem permissão para salvar alterações clínicas")
return
}
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
let dados={}
const vHas=getVal(linha,".clin_has")
if(vHas!=="")dados.has=bool(vHas)
const vDm=getVal(linha,".clin_dm")
if(vDm!=="")dados.dm=bool(vDm)
const vDa=getVal(linha,".clin_da")
if(vDa!=="")dados.da=bool(vDa)
const vCardio=getVal(linha,".clin_cardio")
if(vCardio!=="")dados.cardiopatia=bool(vCardio)
const vAcamado=getVal(linha,".clin_acamado")
if(vAcamado!=="")dados.acamado=bool(vAcamado)
/* 🔥 NORMALIZA PA */
const pa=(getVal(linha,".clin_pa")||"").replace(/\s/g,"").trim()
if(pa!=="")dados.pressao_arterial=pa
/* 🔥 DIETA PADRONIZADA */
if(dietaKey!==""){
dados.dieta_especial=true
dados.dieta_texto=dietaObj?dietaObj.nome:null
}
/* 🔥 RISCO SEGURO */
const risco=getVal(linha,".clin_risco")
if(risco!==""&&!isNaN(risco))dados.grau_risco=parseInt(risco)
/* 🔥 OUTRAS LIMPO */
const outras=(getVal(linha,".clin_outros")||"").trim()
if(outras!=="")dados.outras_comorbidades=outras
/* 🔒 PATCH SELETIVO */
if(Object.keys(dados).length===0)continue
try{
const {error}=await db.from("pacientes").update(dados).eq("id",id).eq("empresa_id",EMPRESA_ID)
if(error)console.error("Erro ao salvar paciente:",id,error)
}catch(e){
console.error("Erro inesperado:",id,e)
}
atual++
/* 🔄 PROGRESSO SUAVE */
if(window.atualizarBarraProgresso){
let p=Math.round((atual/total)*100)
atualizarBarraProgresso(p)
}
}
/* 🔒 RESET LIMPO */
MODO_EDICAO_CLINICO=false
await carregarClinico()
alert("Dados salvos com sucesso!")
}
/* ====================================================
044 – CARREGAR DADOS CLÍNICOS DO PACIENTE
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
/* ====================================================
045 – EXCLUIR PACIENTE (COM CONTROLE)
==================================================== */
async function excluirPaciente(id){
if(!id)return
if(!pode("excluir_paciente"))return
const confirmar=confirm("Deseja excluir?")
if(!confirmar)return
await db.from("pacientes").update({ativo:false}).eq("id",id).eq("empresa_id",EMPRESA_ID)
await carregarClinico()
}


