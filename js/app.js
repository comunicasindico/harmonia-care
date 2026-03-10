/* ====================================================
LOGIN
==================================================== */

async function login(){

const usuarioDigitado=document.getElementById("usuario").value.trim()
const senhaDigitada=document.getElementById("senha").value.trim()

if(usuarioDigitado==="admin" && senhaDigitada==="123456"){

localStorage.setItem("usuario_id","admin")
localStorage.setItem("usuario_nome","Administrador")

document.getElementById("login").style.display="none"
document.getElementById("app").style.display="block"

carregarTudo()

return
}

const {data,error}=await db
.from("usuarios")
.select("*")
.eq("usuario",usuarioDigitado)
.limit(1)

if(!data?.length){
alert("Usuário não encontrado")
return
}

const usuario=data[0]

if(senhaDigitada!==usuario.senha_hash){
alert("Senha incorreta")
return
}

localStorage.setItem("usuario_id",usuario.id)
localStorage.setItem("usuario_nome",usuario.nome)

document.getElementById("login").style.display="none"
document.getElementById("app").style.display="block"

carregarTudo()

}

/* ====================================================
LOGOUT
==================================================== */

function logout(){

localStorage.clear()
location.reload()

}

/* ====================================================
INIT
==================================================== */

window.onload=function(){

const loginSalvo=localStorage.getItem("usuario_id")

if(loginSalvo){

document.getElementById("login").style.display="none"
document.getElementById("app").style.display="block"

carregarTudo()

}

}

/* ====================================================
CARREGAR TUDO
==================================================== */

async function carregarTudo(){

definirDataHoje()

await carregarPacientesBusca()

await carregarRotinas()

await carregarClinico()

setInterval(()=>{carregarRotinas()},30000)

abrirEnfermagem()

mudarTurno("manha")

}

/* ====================================================
DATA HOJE
==================================================== */

function definirDataHoje(){

const hoje = new Date()

const ano = hoje.getFullYear()
const mes = String(hoje.getMonth()+1).padStart(2,'0')
const dia = String(hoje.getDate()).padStart(2,'0')

const dataLocal = `${ano}-${mes}-${dia}`

document.getElementById("dataInicio").value = dataLocal
document.getElementById("dataFim").value = dataLocal

}

/* ====================================================
PAINÉIS
==================================================== */

function abrirEnfermagem(){

document.getElementById("painelEnfermagem").style.display="block"
document.getElementById("painelClinico").style.display="none"
document.getElementById("painelAdmin").style.display="none"

}

function abrirClinico(){

document.getElementById("painelEnfermagem").style.display="none"
document.getElementById("painelAdmin").style.display="none"
document.getElementById("painelClinico").style.display="block"

carregarClinico()

}

async function abrirAdmin(){

document.getElementById("painelEnfermagem").style.display="none"
document.getElementById("painelClinico").style.display="none"
document.getElementById("painelAdmin").style.display="block"

await carregarPacientesDrag()
await carregarProfissionaisDrag()

}
