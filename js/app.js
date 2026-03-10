/* ====================================================
010 – LOGIN
==================================================== */
async function login(){
const usuario=document.getElementById("usuario").value.trim()
const senha=document.getElementById("senha").value.trim()
if(usuario==="admin"&&senha==="123456"){
localStorage.setItem("usuario_nome","Administrador")
document.getElementById("login").style.display="none"
document.getElementById("app").style.display="block"
await iniciarSistema()
return
}
const {data,error}=await db.from("usuarios").select("*").eq("usuario",usuario).limit(1)
if(error){
console.error(error)
alert("Erro ao acessar usuários")
return
}
if(!data?.length){
alert("Usuário não encontrado")
return
}
const user=data[0]
if(user.senha_hash!==senha){
alert("Senha incorreta")
return
}
localStorage.setItem("usuario_nome",user.nome)
document.getElementById("login").style.display="none"
document.getElementById("app").style.display="block"
await iniciarSistema()
}
/* ====================================================
011 – INICIAR SISTEMA
==================================================== */
async function iniciarSistema(){
definirDataHoje()
await gerarRotinasDoDia()
await carregarPacientesBusca()
await carregarRotinas()
if(typeof carregarClinico==="function"){
await carregarClinico()
}
mudarTurno("manha")
}
/* ====================================================
012 – LOGOUT
==================================================== */
function logout(){
localStorage.clear()
location.reload()
}
/* ====================================================
013 – INIT
==================================================== */
window.onload=async function(){
carregarEmpresa()
const loginSalvo=localStorage.getItem("usuario_nome")
if(loginSalvo){
document.getElementById("login").style.display="none"
document.getElementById("app").style.display="block"
await iniciarSistema()
}
}
/* ====================================================
014 – DATA HOJE
==================================================== */
function definirDataHoje(){
const hoje=new Date()
const ano=hoje.getFullYear()
const mes=String(hoje.getMonth()+1).padStart(2,'0')
const dia=String(hoje.getDate()).padStart(2,'0')
const dataLocal=`${ano}-${mes}-${dia}`
const inicio=document.getElementById("dataInicio")
const fim=document.getElementById("dataFim")
if(inicio)inicio.value=dataLocal
if(fim)fim.value=dataLocal
}
/* ====================================================
015 – NAVEGAÇÃO PAINÉIS
==================================================== */
function abrirPainel(id){
const paineis=["painelEnfermagem","painelClinico","painelAdmin"]
paineis.forEach(p=>{
const el=document.getElementById(p)
if(el)el.style.display="none"
})
const alvo=document.getElementById(id)
if(alvo)alvo.style.display="block"
}
function abrirEnfermagem(){
abrirPainel("painelEnfermagem")
}
function abrirClinico(){
abrirPainel("painelClinico")
carregarClinico()
}
async function abrirAdmin(){
abrirPainel("painelAdmin")
await carregarPacientesDrag()
await carregarProfissionaisDrag()
}
/* ====================================================
016 – EMPRESA – CARREGAR DADOS
==================================================== */
async function carregarEmpresa(){
const {data,error}=await db.from("empresas").select("*").eq("id",EMPRESA_ID).single()
if(error){
console.log("Erro empresa",error)
return
}
let html=`<div style="font-size:13px;color:#666;margin-bottom:18px;line-height:1.5"><b>${data.nome_fantasia}</b><br>CNPJ ${data.cnpj}<br>${data.endereco}<br>${data.cidade} – ${data.estado}<br>Tel: ${data.telefone}</div>`
document.getElementById("dadosEmpresa").innerHTML=html
}
