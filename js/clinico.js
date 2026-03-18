/* ====================================================
030 – CARREGAR CLINICO
==================================================== */
async function carregarClinico(){
const selectPaciente=document.getElementById("buscaPaciente")
const pacienteSelecionado=selectPaciente?selectPaciente.value:"todos"
if(!db){console.error("Supabase ainda não carregou");return}
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
<td>${MODO_EDICAO_CLINICO?`<input class="clin_dieta" value="${p.dieta_texto||""}">`:(p.dieta_texto||"-")}</td>
<td>${MODO_EDICAO_CLINICO?`<select class="clin_risco"><option value="1"${p.grau_risco==1?" selected":""}>1</option><option value="2"${p.grau_risco==2?" selected":""}>2</option><option value="3"${p.grau_risco==3?" selected":""}>3</option><option value="4"${p.grau_risco==4?" selected":""}>4</option><option value="5"${p.grau_risco==5?" selected":""}>5</option></select>`:(p.grau_risco?`<b style="color:${p.grau_risco>=4?'#e74c3c':'#2c3e50'}">${p.grau_risco}</b>`:"")}</td>
<td>${MODO_EDICAO_CLINICO?`<input class="clin_outros" value="${p.outras_comorbidades||""}">`:(p.outras_comorbidades||"Não tem")}</td>
<td class="acoesClinico" style="${MODO_EDICAO_CLINICO?'':'display:none'}"><button class="btn-danger" onclick="excluirPaciente('${p.id}')">Excluir</button></td>
</tr>`
})
tabela.innerHTML=html
/* ===============================
030A PAINEL NUTRICIONAL
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
030D INDICADORES VISUAIS
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
031 – CALCULAR IDADE
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
032 – EDITAR CLINICO GLOBAL
==================================================== */
function editarClinicoGlobal(){MODO_EDICAO_CLINICO=true;carregarClinico()}
/* ====================================================
033 – SALVAR CLINICO GLOBAL
==================================================== */
async function salvarClinicoGlobal(){
if(!db)return
const linhas=document.querySelectorAll("#quadroClinico tr[data-id]")
for(const linha of linhas){
const id=linha.dataset.id
const dados={
has:linha.querySelector(".clin_has")?.value==="true",
dm:linha.querySelector(".clin_dm")?.value==="true",
da:linha.querySelector(".clin_da")?.value==="true",
cardiopatia:linha.querySelector(".clin_cardio")?.value==="true",
acamado:linha.querySelector(".clin_acamado")?.value==="true",
pressao_arterial:linha.querySelector(".clin_pa")?.value||"",
dieta_texto:linha.querySelector(".clin_dieta")?.value||"",
dieta_especial:(linha.querySelector(".clin_dieta")?.value||"")!=="",
grau_risco:parseInt(linha.querySelector(".clin_risco")?.value||0),
outras_comorbidades:linha.querySelector(".clin_outros")?.value||""
}
await db.from("pacientes").update(dados).eq("id",id)
}
MODO_EDICAO_CLINICO=false
await carregarClinico()
}
/* ====================================================
034 – CARREGAR DADOS CLÍNICOS DO PACIENTE
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
/* ====================================================
035 – INSERIR USUÁRIO (CORRIGIDO)
==================================================== */
async function inserirUsuario(){
if(!db)return

const novo={
empresa_id:EMPRESA_ID,
nome:document.getElementById("u_nome")?.value||"", // 🔥 AQUI
nome_completo:document.getElementById("u_nome")?.value||"",
nome_apelido:document.getElementById("u_apelido")?.value||"",
email:document.getElementById("u_email")?.value||"",
perfil:document.getElementById("u_perfil")?.value||"",
hierarquia:parseInt(document.getElementById("u_hierarquia")?.value||5),
senha_hash:document.getElementById("u_senha")?.value||"",
ativo:true
}

if(!novo.nome_completo || !novo.email){
alert("Preencha nome e email")
return
}

const {error}=await db.from("usuarios").insert([novo])

if(error){
console.error(error)
alert("Erro ao inserir: "+error.message)
return
}

alert("Usuário inserido com sucesso")
carregarUsuarios()
}
/* ====================================================
036 – CARREGAR USUÁRIOS (ADMIN) – CORRIGIDO
==================================================== */
async function carregarUsuarios(){
if(!db)return

let query=db
.from("usuarios")
.select("id,empresa_id,nome_completo,nome_apelido,email,perfil,hierarquia,senha_hash,ativo")
.eq("empresa_id",EMPRESA_ID)

const busca=document.getElementById("buscaUsuario")?.value?.toLowerCase()||""
const perfilFiltro=document.getElementById("filtroPerfil")?.value||""
const hierarquiaFiltro=document.getElementById("filtroHierarquia")?.value||""

if(perfilFiltro)query=query.eq("perfil",perfilFiltro)
if(hierarquiaFiltro)query=query.eq("hierarquia",parseInt(hierarquiaFiltro))

const {data,error}=await query.order("nome_completo")

if(error){
console.error("Erro usuários",error)
return
}

const listaFiltrada=data.filter(u=>{
if(!busca)return true
return (u.nome_completo||"").toLowerCase().includes(busca) ||
       (u.email||"").toLowerCase().includes(busca)
})

const tabela=document.getElementById("tabelaUsuariosAdmin")
if(!tabela)return

let html=""

listaFiltrada.forEach(u=>{

let cor="#fff"
if(u.perfil?.includes("Administrador"))cor="#e3f2fd"
else if(u.perfil?.includes("Médico"))cor="#fdecea"
else if(u.perfil?.includes("Enfermeiro"))cor="#e8f5e9"
else if(u.perfil?.includes("Cuidador"))cor="#fff8e1"
else if(u.perfil?.includes("Fisioterapeuta"))cor="#f3e5f5"

html+=`
<tr data-id="${u.id}" style="background:${cor}">

<td><input class="u_nome" value="${u.nome_completo||""}"></td>

<td><input class="u_apelido" value="${u.nome_apelido||""}"></td>

<td><input class="u_email" value="${u.email||""}"></td>

<td>
<select class="u_perfil">
<option value="administrador">Administrador</option>
<option value="medico">Médico</option>
<option value="enfermeiro">Enfermeiro</option>
<option value="cuidador">Cuidador</option>
<option value="fisioterapeuta">Fisioterapeuta</option>
<option value="estagiario">Estagiário</option>
</select>
</td>

<td>
<select class="u_hierarquia">
<option value="1"${u.hierarquia==1?" selected":""}>1</option>
<option value="2"${u.hierarquia==2?" selected":""}>2</option>
<option value="3"${u.hierarquia==3?" selected":""}>3</option>
<option value="4"${u.hierarquia==4?" selected":""}>4</option>
<option value="5"${u.hierarquia==5?" selected":""}>5</option>
</select>
</td>

<td>
<input class="u_senha" type="password" placeholder="nova senha">
</td>

<td>
<button onclick="salvarUsuario('${u.id}',this)" class="btn-success">Salvar</button>
<button onclick="excluirUsuario('${u.id}')" class="btn-danger">Excluir</button>
</td>

</tr>
`
})

tabela.innerHTML=html
}
/* ====================================================
037 – SALVAR USUÁRIO
==================================================== */
async function salvarUsuario(id,btn){
const tr=btn.closest("tr")
const nivelAlvo=parseInt(tr.querySelector(".u_hierarquia")?.value||5)
if(USUARIO_HIERARQUIA>=nivelAlvo){

return
}
/* CAPTURA REAL DO ESTADO ANTERIOR */
const dadosAntes={
nome_completo:tr.querySelector(".u_nome")?.getAttribute("value")||"",
nome_apelido:tr.querySelector(".u_apelido")?.getAttribute("value")||"",
email:tr.querySelector(".u_email")?.getAttribute("value")||"",
perfil:perfil,
hierarquia:parseInt(tr.querySelector(".u_hierarquia")?.value||5),
senha:"***"
}
let perfil=tr.querySelector(".u_perfil")?.value||""
perfil=perfil
.replace("(a)","")
.normalize("NFD").replace(/[\u0300-\u036f]/g,"")
.toLowerCase()
/* NOVOS DADOS */
const dados={
nome_completo:tr.querySelector(".u_nome")?.value||"",
nome_apelido:tr.querySelector(".u_apelido")?.value||"",
email:tr.querySelector(".u_email")?.value||"",
perfil:tr.querySelector(".u_perfil")?.value||"",
hierarquia:parseInt(tr.querySelector(".u_hierarquia")?.value||5),
senha_hash:tr.querySelector(".u_senha")?.value||"",
ativo:true
}
const {error}=await db.from("usuarios").update(dados).eq("id",id)
if(error){
alert("Erro ao salvar")
console.error(error)
return
}
/* AUDITORIA COMPLETA */
if(typeof registrarAuditoria==="function"){
await registrarAuditoria({
acao:"UPDATE",
tabela:"usuarios",
registro_id:id,
antes:dadosAntes,
depois:dados
})
}
btn.innerText="✔"
setTimeout(()=>btn.innerText="Salvar",1200)
}
/* ====================================================
038 – EXCLUIR USUÁRIO
==================================================== */
async function excluirUsuario(id){
const tr=document.querySelector(`tr[data-id="${id}"]`)
const nivel=parseInt(tr?.querySelector(".u_hierarquia")?.value||5)
if(USUARIO_HIERARQUIA>=nivel){alert("Sem permissão");return}
if(!confirm("Excluir usuário?"))return
await db.from("usuarios").delete().eq("id",id)
if(typeof registrarAuditoria==="function"){
await registrarAuditoria({acao:"DELETE",tabela:"usuarios",registro_id:id})
}
carregarUsuarios()
}



