/* ====================================================
000 – VARIÁVEIS GLOBAIS CLÍNICO
==================================================== */
window.MODO_EDICAO_CLINICO=false

function textoClinicoSeguro(valor){
return String(valor??"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
}

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
040 – CARREGAR CLINICO
==================================================== */
async function carregarClinico(){
const selectPaciente=document.getElementById("buscaPaciente")
const pacienteSelecionado=selectPaciente?selectPaciente.value:"todos"
if(!db)return
if(!EMPRESA_ID)return
let usuarioId=localStorage.getItem("usuario_id")||PROFISSIONAL_ID||null
let query=db.from("pacientes").select("*")
if(usuarioId&&usuarioId!=="admin"&&Number(localStorage.getItem("usuario_hierarquia")||5)!==1){
const {data:rel}=await db.from("pacientes_profissionais").select("paciente_id").eq("usuario_id",usuarioId).eq("ativo",true)
const ids=rel?.map(r=>r.paciente_id)||[]
if(ids.length)query=query.in("id",ids)
else{
const tabela=document.getElementById("quadroClinico")
if(tabela)tabela.innerHTML=""
return
}}
const {data}=await query.eq("empresa_id",EMPRESA_ID).eq("ativo",true).order("nome_completo")
const tabela=document.getElementById("quadroClinico")
if(!tabela)return
let html=""
let dietaLivre=0
let hipossodica=0
let diabetica=0
let pastosa=0
let vegetariana=0
let liquida=0
for(const p of (data||[])){
let txt=((p&&p.dieta_texto)||"").toString().trim()
if(!txt||txt==="-"||txt.toLowerCase()==="normal")txt="Livre"
p.dieta_texto=txt
let key=getDietaKey(txt)
if(key==="hipossodica")hipossodica++
else if(key==="diabetica")diabetica++
else if(key==="pastosa")pastosa++
else if(key==="vegetariana")vegetariana++
else if(key==="liquida")liquida++
else dietaLivre++
let dietaHTML=window.MODO_EDICAO_CLINICO
?renderSelectDieta(key)
:formatarDieta(p)
html+=`<tr data-id="${p?.id||""}">
<td><div class="clin-paciente"><strong class="clin-nome"></strong></div></td>
<td>${calcularIdade(p?.data_nascimento)||""}</td>
<td>${p?.has?"✔":""}</td>
<td>${p?.dm?"✔":""}</td>
<td>${p?.da||p?.demencia?"✔":""}</td>
<td>${p?.cardiopatia||p?.cardio?"✔":""}</td>
<td>${p?.acamado||p?.restrito_leito?"✔":""}</td>
<td>${textoClinicoSeguro(p?.pressao_arterial)}</td>
<td>${dietaHTML||""}</td>
<td>${p?.grau_risco||""}</td>
<td>${textoClinicoSeguro(montarColunaOutras(p))}</td>
</tr>`
}
tabela.innerHTML=html
window.HarmoniaPaciente?.setPatients(data||[]);
const pacientesPorId=new Map((data||[]).map(p=>[String(p.id),p]));
tabela.querySelectorAll('tr[data-id]').forEach(tr=>{
const p=pacientesPorId.get(tr.dataset.id);
const nome=p?.nome_apelido||p?.nome_completo||"";
tr.querySelector('.clin-nome').textContent=nome;
const acoes=document.createElement('span');
acoes.className='clin-paciente-acoes';
tr.querySelector('.clin-paciente').appendChild(acoes);
if(window.HarmoniaPaciente?.allowed()){
const editar=document.createElement('button');
editar.type='button';
editar.className='clin-editar';
editar.textContent='Editar';
editar.title='Editar nascimento e comorbidades';
editar.setAttribute('aria-label','Editar dados de '+nome);
editar.onclick=()=>window.HarmoniaPaciente.open(tr.dataset.id);
acoes.appendChild(editar);
}
if(!window.HarmoniaNutricao?.allowed())return;
const b=document.createElement('button');
b.type='button';
b.className='clin-nutricao';
b.textContent='Nutrição ↗';
b.title='Nutrição e evolução do paciente';
b.setAttribute('aria-label','Abrir nutrição e evolução de '+nome);
b.onclick=()=>{window.HarmoniaNutricao.target=tr.dataset.id;abrirPainel('painelNutricao');};
acoes.appendChild(b);
});
atualizarIndicadoresDieta(dietaLivre,hipossodica,diabetica,pastosa,vegetariana,liquida)
ativarEventosClinico()
}
/* ====================================================
041 – GET DIETA KEY
==================================================== */
function getDietaKey(txt){
let t=(txt??"").toString().toLowerCase().trim()
t=t.normalize("NFD").replace(/[\u0300-\u036f]/g,"")
if(!t||t==="-"||t==="nao")return"livre"
if(t.includes("hipossodica"))return"hipossodica"
if(t.includes("diabetica"))return"diabetica"
if(t.includes("pastosa"))return"pastosa"
if(t.includes("liquida"))return"liquida"
if(t.includes("vegetariana"))return"vegetariana"
return"livre"
}
/* ====================================================
042 – MONTAR coluna outras COMORBIDADES COMPLETAS
==================================================== */
function montarColunaOutras(p){

if(!p)return""

let lista=[]

if(p.has)lista.push("HAS")
if(p.dm)lista.push("DM")
if(p.da||p.demencia)lista.push("DEMÊNCIA")
if(p.cardiopatia||p.cardio)lista.push("CARDIO")
if(p.acamado||p.restrito_leito)lista.push("ACAMADO")

if(p.alzheimer)lista.push("ALZHEIMER")
if(p.parkinson)lista.push("PARKINSON")
if(p.avc)lista.push("AVC")
if(p.depressao)lista.push("DEPRESSÃO")

let outras=(p.outras_comorbidades||"")
.toString()
.trim()

if(
outras &&
outras!=="-" &&
outras.toLowerCase()!=="null"
){
lista.push(outras)
}

lista=[...new Set(lista)]

if(lista.length===0)return"Não tem"

return lista.join(" / ")

}
/* ====================================================
043 – FORMATAR DIETA
==================================================== */
function formatarDieta(p){
const DIETAS={
livre:{nome:"Livre",icone:"🍽️",cor:"#f4f6f9"},
hipossodica:{nome:"Hipossódica",icone:"🧂",cor:"#eafaf1"},
diabetica:{nome:"Diabética",icone:"🩸",cor:"#fdecea"},
pastosa:{nome:"Pastosa",icone:"🥣",cor:"#fff3cd"},
liquida:{nome:"Líquida",icone:"🧃",cor:"#e8f4fd"},
vegetariana:{nome:"Vegetariana",icone:"🥗",cor:"#eafaf1"}
}
let key=getDietaKey(p.dieta_texto)
let d=DIETAS[key]
return`<span class="clin-dieta-chip" style="background:${d.cor}">${d.icone} ${d.nome}</span>`
}

/* ====================================================
044 – SELECT DIETA
==================================================== */
function renderSelectDieta(key){
return`<select class="clin_dieta">
<option value="livre"${key==="livre"?" selected":""}>🍽️ Livre</option>
<option value="hipossodica"${key==="hipossodica"?" selected":""}>🧂 Hipossódica</option>
<option value="diabetica"${key==="diabetica"?" selected":""}>🩸 Diabética</option>
<option value="pastosa"${key==="pastosa"?" selected":""}>🥣 Pastosa</option>
<option value="liquida"${key==="liquida"?" selected":""}>🧃 Líquida</option>
<option value="vegetariana"${key==="vegetariana"?" selected":""}>🥗 Vegetariana</option>
</select>`
}

/* ====================================================
045 – INDICADORES DIETA
==================================================== */
function atualizarIndicadoresDieta(livre,hipo,dia,pas,veg,liq){
const elLivre=document.getElementById("dietaLivre")
const elHip=document.getElementById("dietaHipossodica")
const elDia=document.getElementById("dietaDiabetica")
const elPas=document.getElementById("dietaPastosa")
const elVeg=document.getElementById("dietaVegetariana")
const elLiq=document.getElementById("dietaLiquida")
if(elLivre)elLivre.innerHTML=`🍽️ ${livre}`
if(elHip)elHip.innerHTML=`🧂 ${hipo}`
if(elDia)elDia.innerHTML=`🩸 ${dia}`
if(elPas)elPas.innerHTML=`🥣 ${pas}`
if(elVeg)elVeg.innerHTML=`🥗 ${veg}`
if(elLiq)elLiq.innerHTML=`🧃 ${liq}`
}

/* ====================================================
046 – EVENTOS CLINICO
==================================================== */
function ativarEventosClinico(){
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
const mapa={
livre:"Livre",
hipossodica:"Hipossódica",
diabetica:"Diabética",
pastosa:"Pastosa",
liquida:"Líquida",
vegetariana:"Vegetariana"
}
let val=el.value||"livre"
dados.dieta_especial=true
dados.dieta_texto=mapa[val]||"Livre"
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
047 – CALCULAR IDADE
==================================================== */
function calcularIdade(data){
if(!data)return ""
const partes=String(data).slice(0,10).split("-").map(Number)
if(partes.length!==3||partes.some(v=>!v))return ""
const [ano,mes,dia]=partes
const nascimento=new Date(ano,mes-1,dia)
if(nascimento.getFullYear()!==ano||nascimento.getMonth()!==mes-1||nascimento.getDate()!==dia)return ""
const hoje=new Date()
if(nascimento>hoje)return ""
let idade=hoje.getFullYear()-ano
if(hoje.getMonth()<mes-1||(hoje.getMonth()===mes-1&&hoje.getDate()<dia))idade--
return idade
}
function editarClinicoGlobal(){
return window.HarmoniaPaciente?.open(document.getElementById("buscaPaciente")?.value)
}
async function salvarClinicoGlobal(){
if(window.HarmoniaPaciente?.isOpen())return window.HarmoniaPaciente.save()
return editarClinicoGlobal()
}
/* ====================================================
048 – CARREGAR DADOS CLÍNICOS DO PACIENTE
==================================================== */
async function carregarDadosClinicosPaciente(pacienteId){
const box=document.getElementById("dadosClinicosPaciente")
if(!box)return
if(!pacienteId||pacienteId==="todos"){box.innerHTML="";window.HarmoniaNutricao?.summary(null);return}
if(!db){console.error("Supabase ainda não carregou");return}
const {data,error}=await db.from("pacientes").select("*").eq("id",pacienteId).single()
if(error){console.error("Erro clínico paciente",error);return}
let html=`<div class="box"><h3>Dados Clínicos do Paciente</h3><table class="tabela-clinica-edicao">
<tr><td><b>Paciente</b></td><td>${textoClinicoSeguro(data.nome_completo)}</td></tr>
<tr><td><b>Idade</b></td><td>${calcularIdade(data.data_nascimento)}</td></tr>
<tr><td><b>HAS</b></td><td>${data.has?"✔ SIM":"—"}</td></tr>
<tr><td><b>Diabetes</b></td><td>${data.dm?"✔ SIM":"—"}</td></tr>
<tr><td><b>Demência</b></td><td>${data.da?"✔ SIM":"—"}</td></tr>
<tr><td><b>Cardiopatia</b></td><td>${data.cardiopatia?"✔ SIM":"—"}</td></tr>
<tr><td><b>Acamado</b></td><td>${data.acamado?"✔ SIM":"—"}</td></tr>
<tr><td><b>Pressão Arterial</b></td><td>${textoClinicoSeguro(data.pressao_arterial??"-")}</td></tr>
<tr><td><b>Dieta Especial</b></td><td>${data.dieta_especial?"SIM":"NÃO"} ${textoClinicoSeguro(data.dieta_texto)}</td></tr>
<tr><td><b>Grau de Risco</b></td><td>${data.grau_risco??"-"}</td></tr>
<tr>
<td><b>Outras Comorbidades</b></td>
<td style="color:#c0392b;font-weight:bold">
${textoClinicoSeguro(data.outras_comorbidades&&data.outras_comorbidades.trim()!==""?data.outras_comorbidades:"Não informado")}
</td>
</tr>
</table></div>`
box.innerHTML=html
window.HarmoniaNutricao?.summary(pacienteId)
}
/* ====================================================
049 – EXCLUIR PACIENTE (COM CONTROLE)
==================================================== */
async function excluirPaciente(id){
if(!id)return
if(!pode("excluir_paciente"))return
const confirmar=confirm("Deseja excluir?")
if(!confirmar)return
await db.from("pacientes").update({ativo:false}).eq("id",id).eq("empresa_id",EMPRESA_ID)
await carregarClinico()
}
