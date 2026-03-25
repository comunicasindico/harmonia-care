window.salvandoPendencias=false
/* ====================================================
010 – LOGIN
==================================================== */
async function login(){
if(!db){alert("Sistema carregando");return}

const loginInput=document.getElementById("usuario")?.value?.trim().toLowerCase()
const senha=document.getElementById("senha")?.value?.trim()

if(!usuario||!senha){alert("Informe usuário e senha");return}
/* 🔥 NÃO DEPENDER MAIS DO EMPRESA_ID */
const {data,error}=await db
.from("usuarios")
.select("*")
.eq("ativo",true)

if(error){console.error(error);alert("Erro no login");return}
/* 🔍 LOCALIZA USUÁRIO */
const user=data.find(u=>
(
(u.nome_apelido||"").toLowerCase()===loginInput||
(u.email||"").toLowerCase()===loginInput||
(u.nome_completo||"").toLowerCase()===loginInput
)
&& String(u.senha_hash)===senha
)

if(!user){alert("Usuário ou senha inválidos");return}
/* ✅ SALVAR SESSÃO COMPLETA */
localStorage.setItem("usuario_id",user.id)
localStorage.setItem("usuario_nome",user.nome_apelido||user.nome_completo)
localStorage.setItem("usuario_hierarquia",user.hierarquia||5)
localStorage.setItem("perfil",user.perfil||"cuidador")
localStorage.setItem("usuario_perfil",(user.perfil||"cuidador").toLowerCase())
/* 🔥 CORREÇÃO PRINCIPAL */
localStorage.setItem("empresa_id",user.empresa_id)
/* 🔄 ATUALIZA VARIÁVEL GLOBAL */
EMPRESA_ID=user.empresa_id
/* UI */
document.getElementById("login").style.display="none"
document.getElementById("app").style.display="block"
/* INICIALIZA */
if(typeof definirDataHoje==="function")definirDataHoje()
if(typeof carregarPacientesBusca==="function")carregarPacientesBusca()
if(typeof carregarRotinas==="function")carregarRotinas()
if(typeof carregarClinico==="function")carregarClinico()
}
/* ====================================================
011 – INICIAR SISTEMA
==================================================== */
async function iniciarSistema(){
definirDataHoje()
while(!db){await new Promise(r=>setTimeout(r,50))}
if(typeof carregarPacientesBusca==="function"){await carregarPacientesBusca()}
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
const inputBusca=document.getElementById("buscaUsuario")
if(inputBusca){
inputBusca.addEventListener("input",()=>carregarUsuarios())
}
if(painelSalvo==="painelAdmin"){
await carregarUsuarios()
}
mudarTurno(TURNO_ATUAL)
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
}
/* ====================================================
012 – LOGOUT
==================================================== */
function logout(){
localStorage.clear()
location.reload()
}
/* ====================================================
013 – SALVAR PACIENTE SELECIONADO
==================================================== */
document.addEventListener("change",function(e){
if(e.target && e.target.id==="buscaPaciente"){
localStorage.setItem("pacienteSelecionado",e.target.value)
}
})
/* ====================================================
014 – INIT
==================================================== */
window.addEventListener("load",async()=>{
while(!db){await new Promise(r=>setTimeout(r,50))}
const loginSalvo=localStorage.getItem("usuario_nome")
if(loginSalvo){
PROFISSIONAL_ID=localStorage.getItem("profissional_id")
EMPRESA_ID=localStorage.getItem("empresa_id")
document.getElementById("login").style.display="none"
document.getElementById("app").style.display="block"
if(typeof carregarEmpresa==="function"){await carregarEmpresa()}
await iniciarSistema()
}else{
if(typeof carregarEmpresa==="function"){await carregarEmpresa()}
}
})
window.addEventListener("pageshow",function(e){
if(e.persisted){
console.log("Página restaurada do cache")
}
})
/* ====================================================
015 – DATA HOJE
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
/* ====================================================
016 – NAVEGAÇÃO PAINÉIS
==================================================== */
function abrirPainel(id){
if(window.salvandoPendencias){
alert("Aguarde finalizar o salvamento das pendências.")
return
}
localStorage.setItem("painelAtual",id)
const paineis=["painelEnfermagem","painelClinico","painelAdmin"]
paineis.forEach(p=>{
const el=document.getElementById(p)
if(el)el.style.display="none"
})
const alvo=document.getElementById(id)
if(alvo)alvo.style.display="block"
const btnAdmin=document.getElementById("btnConcluirPendentes")
const hierarquia=parseInt(localStorage.getItem("usuario_hierarquia")||5)

if(btnAdmin){
if(hierarquia===1 && id==="painelEnfermagem"){
btnAdmin.style.display="inline-block"
}else{
btnAdmin.style.display="none"
}
}
}
/* ====================================================
017 – ABRIR ENFERMAGEM
==================================================== */
function abrirEnfermagem(){
abrirPainel("painelEnfermagem")
if(typeof carregarRotinas==="function"){carregarRotinas()}
const paciente=document.getElementById("buscaPaciente")?.value
if(typeof carregarDadosClinicosPaciente==="function"){carregarDadosClinicosPaciente(paciente)}
}
/* ====================================================
018 – ABRIR CLINICO
==================================================== */
function abrirClinico(){
abrirPainel("painelClinico")
const acoes=document.getElementById("acoesClinico")
if(acoes)acoes.style.display="flex"
if(typeof carregarClinico==="function"){carregarClinico()}
}
/* ====================================================
019 – ABRIR ADMIN
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
020 – EMPRESA – CARREGAR DADOS
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
