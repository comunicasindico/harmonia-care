window.salvandoPendencias=false
/* ====================================================
010 – LOGIN (FINAL LIMPO E CORRETO)
==================================================== */
async function login(){
/* 🔥 EFEITO BOTÃO */
const btn=document.getElementById("btnEntrar")
if(btn){
btn.innerText="Entrando..."
btn.style.opacity="0.7"
btn.style.transform="scale(0.97)"
btn.disabled=true
}
/* 🔥 VALIDA SISTEMA */
if(!db){
if(btn){
btn.innerText="Entrar"
btn.style.opacity="1"
btn.style.transform="scale(1)"
btn.disabled=false
}
alert("Sistema carregando")
return
}
/* 🔥 INPUTS */
const loginInput=document.getElementById("usuario")?.value?.trim().toLowerCase()
const senha=document.getElementById("senha")?.value?.trim()

if(!loginInput||!senha){
if(btn){
btn.innerText="Entrar"
btn.style.opacity="1"
btn.style.transform="scale(1)"
btn.disabled=false
}
alert("Informe usuário e senha")
return
}
/* 🔥 BUSCA USUÁRIOS */
const {data,error}=await db
.from("usuarios")
.select("*")
.eq("ativo",true)

if(error){
console.error(error)
if(btn){
btn.innerText="Entrar"
btn.style.opacity="1"
btn.style.transform="scale(1)"
btn.disabled=false
}
alert("Erro no login")
return
}
/* 🔍 LOCALIZA USUÁRIO */
const user=(data||[]).find(u=>
(
(u.nome_apelido||"").toLowerCase()===loginInput||
(u.email||"").toLowerCase()===loginInput||
(u.nome_completo||"").toLowerCase()===loginInput
)
&& String(u.senha_hash)===senha
)

if(!user){
if(btn){
btn.innerText="Entrar"
btn.style.opacity="1"
btn.style.transform="scale(1)"
btn.disabled=false
}
alert("Usuário ou senha inválidos")
return
}
if((user.perfil||"").toLowerCase()==="admin"){
localStorage.setItem("painelAtual","painelAdmin")
}else{
localStorage.setItem("painelAtual","painelEnfermagem")
}
localStorage.setItem("usuario_id",user.id||"")
localStorage.setItem("usuario_nome",user.nome_completo||user.nome_apelido||"")
localStorage.setItem("usuario_hierarquia",user.hierarquia||1)
localStorage.setItem("empresa_id",user.empresa_id||"")

/* ====================================================
011 – LOGIN OK (UNIFICADO DEFINITIVO)
==================================================== */
/* 🔐 SALVAR SESSÃO */
localStorage.setItem("usuario_id",user.id)
localStorage.setItem("usuario_nome",user.nome_apelido||user.nome_completo||"")
localStorage.setItem("usuario_hierarquia",user.hierarquia||1)
localStorage.setItem("perfil",user.perfil||"cuidador")
localStorage.setItem("usuario_perfil",(user.perfil||"cuidador").toLowerCase())
/* 🔥 EMPRESA PADRÃO */
const EMPRESA_FIXA="d9f678e5-6c7a-485e-895c-cb4791db840e"
localStorage.setItem("empresa_id",EMPRESA_FIXA)
EMPRESA_ID=EMPRESA_FIXA
/* 🔥 UI LOGIN → APP */
const telaLogin=document.getElementById("login")
const telaApp=document.getElementById("app")

if(telaLogin)telaLogin.style.display="none"
if(telaApp)telaApp.style.display="block"
/* 🔥 INICIALIZA SISTEMA */
if(typeof definirDataHoje==="function")definirDataHoje()
if(typeof carregarPacientesBusca==="function")carregarPacientesBusca()
if(typeof carregarRotinas==="function")carregarRotinas()
if(typeof carregarClinico==="function")carregarClinico()
}
/* ====================================================
012 – INICIAR SISTEMA
==================================================== */
async function iniciarSistema(){
definirDataHoje()
while(!db){await new Promise(r=>setTimeout(r,50))}
/* 🔥 AGUARDA EMPRESA_ID */
while(!EMPRESA_ID){
await new Promise(r=>setTimeout(r,50))
}
if(typeof carregarPacientesBusca==="function"){
await carregarPacientesBusca()
}
const pacienteSalvo=localStorage.getItem("pacienteSelecionado")
const buscaPaciente=document.getElementById("buscaPaciente")
if(buscaPaciente && pacienteSalvo){
buscaPaciente.value=pacienteSalvo
}
if(typeof gerarRotinasDoDia==="function"){await gerarRotinasDoDia()}
let painelSalvo=localStorage.getItem("painelAtual")
if(!painelSalvo){
painelSalvo="painelEnfermagem"
localStorage.setItem("painelAtual","painelEnfermagem")
}
abrirPainel(painelSalvo)
if(typeof carregarRotinas==="function"){await carregarRotinas()}
if(typeof carregarClinico==="function"){await carregarClinico()}
if(typeof carregarUsuarios==="function"){await carregarUsuarios()}
/* ====================================================
012A – INICIAR MEDICAÇÃO
==================================================== */
if(typeof carregarPacientesMedicacao==="function"){
await carregarPacientesMedicacao()
}
if(typeof carregarStatusMedicacoes==="function"){await carregarStatusMedicacoes()}
const inputBusca=document.getElementById("buscaUsuario")
if(inputBusca){
inputBusca.addEventListener("input",()=>carregarUsuarios())
}
if(painelSalvo==="painelAdmin"){
await carregarUsuarios()
}
if(typeof mudarTurno==="function"){
mudarTurno(TURNO_ATUAL)
}
const painelAtual=localStorage.getItem("painelAtual")||"painelEnfermagem"
const btnAdmin=document.getElementById("btnConcluirPendentes")
const hierarquia=parseInt(localStorage.getItem("usuario_hierarquia")||5)

if(btnAdmin){
if(hierarquia===1 && painelAtual==="painelEnfermagem"){
btnAdmin.style.display="inline-block"
}else{
btnAdmin.style.display="none"
}
}
setInterval(()=>{
const agora=new Date()
if(agora.getHours()===23 && agora.getMinutes()===59){
if(typeof autoFinalizarNaoObrigatorios==="function"){
autoFinalizarNaoObrigatorios()
}
}
},60000)
}
/* ====================================================
013 – LOGOUT
==================================================== */
function logout(){
localStorage.clear()
location.reload()
}
/* ====================================================
014 – SALVAR PACIENTE SELECIONADO
==================================================== */
document.addEventListener("change",async function(e){
if(e.target && e.target.id==="buscaPaciente"){
const pacienteId=e.target.value
localStorage.setItem("pacienteSelecionado",pacienteId)
/* 🔥 FORÇA ATUALIZAÇÃO CLÍNICA */
if(typeof carregarDadosClinicosPaciente==="function"){
await carregarDadosClinicosPaciente(pacienteId)
}
/* 🔥 GARANTE SINCRONIA COM ENFERMAGEM */
if(typeof carregarRotinas==="function"){
await carregarRotinas()
}
/* 🔥 GRADE */
if(typeof montarGradePeriodo==="function" && pacienteId!=="todos"){
await montarGradePeriodo()
}
}
})
/* ====================================================015 – INIT==================================================== */
window.addEventListener("load",async()=>{
while(!db){await new Promise(function(r){setTimeout(r,50)})}
const loginSalvo=localStorage.getItem("usuario_nome")
if(loginSalvo){
PROFISSIONAL_ID=localStorage.getItem("profissional_id")
EMPRESA_ID=localStorage.getItem("empresa_id")
const telaLogin=document.getElementById("login")
const telaApp=document.getElementById("app")
if(telaLogin)telaLogin.style.display="none"
if(telaApp)telaApp.style.display="block"
if(typeof carregarEmpresa==="function")await carregarEmpresa()
if(typeof iniciarSistema==="function")await iniciarSistema()
}else{
if(typeof carregarEmpresa==="function")await carregarEmpresa()
}
})
window.addEventListener("pageshow",function(e){
if(e.persisted){console.log("Página restaurada do cache")}
})
/* ====================================================
016 – DATA HOJE
==================================================== */
function definirDataHoje(){

const hoje=new Date()
const ano=hoje.getFullYear()
const mes=String(hoje.getMonth()+1).padStart(2,'0')
const dia=String(hoje.getDate()).padStart(2,'0')
const dataLocal=`${ano}-${mes}-${dia}`

const inicio=document.getElementById("dataInicio")
const fim=document.getElementById("dataFim")

if(inicio && !inicio.value)inicio.value=dataLocal
if(fim && !fim.value)fim.value=dataLocal

}
/* ====================================================017 – NAVEGAÇÃO PAINÉIS (FINAL CORRIGIDO)==================================================== */
function abrirPainel(id){
if(!podeUsarMedicacao()){const btn=document.getElementById("btnMedicacao");if(btn)btn.style.display="none"}
if(window.salvandoPendencias){alert("Aguarde finalizar o salvamento das pendências.");return}
localStorage.setItem("painelAtual",id)
const paineis=["painelEnfermagem","painelClinico","painelAdmin","painelMedicacao"]
for(let i=0;i<paineis.length;i++){const el=document.getElementById(paineis[i]);if(el)el.style.display="none"}
const alvo=document.getElementById(id);if(alvo)alvo.style.display="block"
/* 🔥 CARREGAMENTO */
if(id==="painelEnfermagem"&&typeof carregarRotinas==="function")carregarRotinas()
if(id==="painelClinico"&&typeof carregarClinico==="function")carregarClinico()
if(id==="painelMedicacao"){
setTimeout(function(){
if(typeof carregarStatusMedicacoes==="function")carregarStatusMedicacoes()
if(typeof carregarPacientesMedicacao==="function")carregarPacientesMedicacao()
if(typeof carregarMedicacoes==="function")carregarMedicacoes()
},100)
}
/* 🔥 BOTÃO PENDENTES (NOVO PADRÃO) */
const btnPendentes=document.getElementById("btnPendentesTodos")
if(btnPendentes){
if(id==="painelEnfermagem"){
btnPendentes.style.display="inline-block"
btnPendentes.onclick=function(){executarRotinaTodosPaciente()}
}else{
btnPendentes.style.display="none"
}
}
/* 🔥 TOPO */
if(id==="painelEnfermagem")atualizarBotoesTopo("enfermagem")
if(id==="painelClinico")atualizarBotoesTopo("clinico")
if(id==="painelAdmin")atualizarBotoesTopo("admin")
if(id==="painelMedicacao")atualizarBotoesTopo("medicacao")
}
/* ====================================================
018 – CONTROLE VISUAL DOS BOTÕES
==================================================== */
function atualizarBotoesTopo(painel){

const mostrar=(ids)=>{
document.querySelectorAll("#topoBotoes button").forEach(b=>b.style.display="none")
ids.forEach(id=>{
const el=document.getElementById(id)
if(el)el.style.display="inline-block"
})
}
/* 🔥 CONFIG POR PAINEL */
if(painel==="enfermagem"){
mostrar(["btnEnfermagem","btnClinico","btnAdmin","btnMedicacao","btnGerarPDF","btnPDFPaciente","btnPendentesTodos","btnSalvar"])
document.getElementById("acoesClinico").style.display="none"
}
if(painel==="clinico"){
mostrar(["btnEnfermagem","btnClinico","btnAdmin","btnMedicacao","btnSalvar"])
document.getElementById("acoesClinico").style.display="flex"
}
if(painel==="admin"){
mostrar(["btnEnfermagem","btnClinico","btnAdmin","btnMedicacao","btnBackup"])
document.getElementById("acoesClinico").style.display="none"
}
if(painel==="medicacao"){
mostrar(["btnEnfermagem","btnClinico","btnAdmin","btnMedicacao","btnPDFMedicacaoPaciente","btnPDFMedicacaoGeral"])
document.getElementById("acoesClinico").style.display="none"
}
/* 🔥 DESTACA ATIVO */
document.querySelectorAll("#topoBotoes button").forEach(b=>b.classList.remove("ativo"))
const mapa={
enfermagem:"btnEnfermagem",
clinico:"btnClinico",
admin:"btnAdmin",
medicacao:"btnMedicacao"
}
const ativo=document.getElementById(mapa[painel])
if(ativo)ativo.classList.add("ativo")
/* 🔥 MOVE PARA PRIMEIRO */
const container=document.getElementById("topoBotoes")
if(ativo)container.prepend(ativo)
}
/* ====================================================
019 – ABRIR ENFERMAGEM
==================================================== */
function abrirEnfermagem(){
abrirPainel("painelEnfermagem")
if(typeof carregarRotinas==="function"){carregarRotinas()}
const paciente=document.getElementById("buscaPaciente")?.value
if(typeof carregarDadosClinicosPaciente==="function"){carregarDadosClinicosPaciente(paciente)}
}
/* ====================================================
020 – ABRIR CLINICO
==================================================== */
function abrirClinico(){
abrirPainel("painelClinico")
const acoes=document.getElementById("acoesClinico")
if(acoes)acoes.style.display="flex"
if(typeof carregarClinico==="function"){carregarClinico()}
}
/* ====================================================
021 – ABRIR ADMIN
==================================================== */
async function abrirAdmin(){
abrirPainel("painelAdmin")
if(typeof carregarUsuarios==="function"){
await carregarUsuarios()
}
if(typeof carregarProfissionaisDrag==="function"){
await carregarProfissionaisDrag()
}
if(typeof carregarPacientesDrag==="function"){
await carregarPacientesDrag()
}
/* ITEM 084 – BUSCA EM TEMPO REAL */
setTimeout(()=>{
const inputBusca=document.getElementById("buscaUsuario")
if(inputBusca){
inputBusca.addEventListener("input",()=>carregarUsuarios())
}
},200)
}
/* ====================================================
022 – EMPRESA – CARREGAR DADOS
==================================================== */
async function carregarEmpresa(){
if(!db)return
if(!EMPRESA_ID)return
const {data,error}=await db.from("empresas").select("nome_fantasia,cnpj,endereco,cidade,estado,telefone").eq("id",EMPRESA_ID).single()
if(error){
console.log("Erro empresa",error)
return
}
if(!data)return
let html=`<div style="font-size:13px;color:#666;margin-bottom:18px;line-height:1.5"><b>${data.nome_fantasia}</b><br>CNPJ ${data.cnpj}<br>${data.endereco}<br>${data.cidade} – ${data.estado}<br>Tel: ${data.telefone}</div>`
const el=document.getElementById("dadosEmpresa")
if(el)el.innerHTML=html
}
