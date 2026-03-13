/* ====================================================
010 – LOGIN
==================================================== */
async function login(){
/* garantir que o Supabase carregou */
while(!db){
await new Promise(r=>setTimeout(r,50))
}
const usuario=document.getElementById("usuario").value.trim()
const senha=document.getElementById("senha").value.trim()
const btn=document.querySelector("#login button")
if(btn)btn.disabled=true
if(!usuario||!senha){
alert("Informe usuário e senha")
if(btn)btn.disabled=false
return
}
/* LOGIN ADMIN */
if(usuario==="admin"&&senha==="123456"){
const {data:admin,error:eAdmin}=await db
.from("profissionais")
.select("id,nome_apelido,empresa_id")
.eq("nome_apelido","admin")
.single()
if(eAdmin||!admin){
console.error("Admin não encontrado",eAdmin)
alert("Administrador não configurado no sistema")
if(btn)btn.disabled=false
return
}
localStorage.setItem("usuario_nome",admin.nome_apelido)
localStorage.setItem("profissional_id",admin.id)
localStorage.setItem("empresa_id",admin.empresa_id)
/* atualizar variáveis globais */
PROFISSIONAL_ID=admin.id
EMPRESA_ID=admin.empresa_id
document.getElementById("login").style.display="none"
document.getElementById("app").style.display="block"

if(typeof carregarEmpresa==="function"){
await carregarEmpresa()
}

await iniciarSistema()
if(btn)btn.disabled=false
return
}
/* LOGIN USUÁRIO */
const {data,error}=await db
.from("usuarios")
.select("id,nome,senha_hash,empresa_id,ativo")
.eq("usuario",usuario)
.limit(1)
if(error){
console.error(error)
alert("Erro ao acessar usuários")
if(btn)btn.disabled=false
return
}
if(!data||data.length===0){
alert("Usuário não encontrado")
if(btn)btn.disabled=false
return
}
const user=data[0]
if(!user.ativo){
alert("Usuário inativo")
if(btn)btn.disabled=false
return
}
if(user.senha_hash!==senha){
alert("Senha incorreta")
if(btn)btn.disabled=false
return
}
localStorage.setItem("usuario_nome",user.nome)
definirSessaoProfissional(user.id,user.empresa_id)
/* SALVAR EMPRESA */
if(user.empresa_id){
localStorage.setItem("empresa_id",user.empresa_id)
/* atualizar variável global */
EMPRESA_ID=user.empresa_id
}
/* atualizar variável global */
PROFISSIONAL_ID=user.id
document.getElementById("login").style.display="none"
document.getElementById("app").style.display="block"

if(typeof carregarEmpresa==="function"){
await carregarEmpresa()
}

await iniciarSistema()
if(btn)btn.disabled=false
}
/* ====================================================
011 – INICIAR SISTEMA
==================================================== */
async function iniciarSistema(){
while(!db){await new Promise(r=>setTimeout(r,50))}
definirDataHoje()
if(typeof carregarPacientesBusca==="function"){await carregarPacientesBusca()}
if(typeof gerarRotinasDoDia==="function"){await gerarRotinasDoDia()}
/* RESTAURAR PAINEL */
const painelSalvo=localStorage.getItem("painelAtual")||"painelEnfermagem"
abrirPainel(painelSalvo)
if(typeof carregarRotinas==="function"){await carregarRotinas()}
if(typeof carregarClinico==="function"){await carregarClinico()}
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
window.addEventListener("load",async()=>{

/* aguardar Supabase */

while(!db){
await new Promise(r=>setTimeout(r,50))
}

if(typeof carregarEmpresa==="function"){carregarEmpresa()}

const loginSalvo=localStorage.getItem("usuario_nome")

if(loginSalvo){

document.getElementById("login").style.display="none"
document.getElementById("app").style.display="block"

await iniciarSistema()

}

})
window.addEventListener("pageshow",function(e){
if(e.persisted){location.reload()}
})
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
/* salva painel atual */
localStorage.setItem("painelAtual", id)
const paineis=["painelEnfermagem","painelClinico","painelAdmin"]
paineis.forEach(p=>{
const el=document.getElementById(p)
if(el){el.style.display="none"}
})
const alvo=document.getElementById(id)
if(alvo){alvo.style.display="block"}
}

function abrirEnfermagem(){
abrirPainel("painelEnfermagem")
if(typeof carregarRotinas==="function"){
carregarRotinas()
}
/* carregar clínico do paciente selecionado */
const paciente=document.getElementById("buscaPaciente")?.value
if(typeof carregarDadosClinicosPaciente==="function"){
carregarDadosClinicosPaciente(paciente)
}
}

function abrirClinico(){
abrirPainel("painelClinico")
const acoes=document.getElementById("acoesClinico")
if(acoes)acoes.style.display="flex"
if(typeof carregarClinico==="function"){carregarClinico()}
}

async function abrirAdmin(){
abrirPainel("painelAdmin")
if(typeof carregarPacientesDrag==="function"){await carregarPacientesDrag()}
if(typeof carregarProfissionaisDrag==="function"){await carregarProfissionaisDrag()}
}
/* ====================================================
016 – EMPRESA – CARREGAR DADOS
==================================================== */
async function carregarEmpresa(){
if(typeof db==="undefined"){console.log("Supabase ainda não carregou");return}
const {data,error}=await db.from("empresas").select("nome_fantasia,cnpj,endereco,cidade,estado,telefone").eq("id",EMPRESA_ID).single()
if(error){console.log("Erro empresa",error);return}
if(!data)return
let html=`<div style="font-size:13px;color:#666;margin-bottom:18px;line-height:1.5"><b>${data.nome_fantasia}</b><br>CNPJ ${data.cnpj}<br>${data.endereco}<br>${data.cidade} – ${data.estado}<br>Tel: ${data.telefone}</div>`
const el=document.getElementById("dadosEmpresa")
if(el)el.innerHTML=html
}
