/* ====================================================
010 – LOGIN
==================================================== */

async function login(){

const usuario = document.getElementById("usuario").value.trim()
const senha = document.getElementById("senha").value.trim()

if(usuario === "admin" && senha === "123456"){

localStorage.setItem("usuario_nome","Administrador")

document.getElementById("login").style.display="none"
document.getElementById("app").style.display="block"

carregarTudo()

return
}

const {data,error} = await db
.from("usuarios")
.select("*")
.eq("usuario",usuario)
.limit(1)

if(!data?.length){

alert("Usuário não encontrado")
return

}

const user = data[0]

if(user.senha_hash !== senha){

alert("Senha incorreta")
return

}

localStorage.setItem("usuario_nome",user.nome)

document.getElementById("login").style.display="none"
document.getElementById("app").style.display="block"

carregarTudo()

}

/* ====================================================
011 – LOGOUT
==================================================== */

function logout(){

localStorage.clear()
location.reload()

}

/* ====================================================
012 – INIT
==================================================== */

window.onload = function(){

const loginSalvo = localStorage.getItem("usuario_nome")

if(loginSalvo){

document.getElementById("login").style.display="none"
document.getElementById("app").style.display="block"

carregarTudo()

}

}

/* ====================================================
013 – CARREGAR SISTEMA
==================================================== */

async function carregarTudo(){

definirDataHoje()

await carregarPacientesBusca()

await carregarRotinas()

await carregarClinico()

mudarTurno("manha")

}

/* ====================================================
014 – DATA HOJE
==================================================== */

function definirDataHoje(){

const hoje = new Date()

const ano = hoje.getFullYear()
const mes = String(hoje.getMonth()+1).padStart(2,'0')
const dia = String(hoje.getDate()).padStart(2,'0')

const dataLocal = `${ano}-${mes}-${dia}`

const inicio = document.getElementById("dataInicio")
const fim = document.getElementById("dataFim")

if(inicio) inicio.value = dataLocal
if(fim) fim.value = dataLocal

}

/* ====================================================
015 – NAVEGAÇÃO PAINÉIS
==================================================== */

function abrirPainel(id){

const paineis = [
"painelEnfermagem",
"painelClinico",
"painelAdmin"
]

paineis.forEach(p=>{
const el = document.getElementById(p)
if(el) el.style.display="none"
})

const alvo = document.getElementById(id)

if(alvo) alvo.style.display="block"

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
