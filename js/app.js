/* ====================================================
010 – LOGIN
==================================================== */
async function login(){
const usuario=document.getElementById("usuario").value.trim()
const senha=document.getElementById("senha").value.trim()
if(!usuario||!senha){alert("Informe usuário e senha");return}
if(usuario==="admin"&&senha==="123456"){
localStorage.setItem("usuario_nome","Administrador")
localStorage.setItem("profissional_id",null)
document.getElementById("login").style.display="none"
document.getElementById("app").style.display="block"
await iniciarSistema()
return}
const {data,error}=await db.from("usuarios").select("*").eq("usuario",usuario).limit(1)
if(error){console.error(error);alert("Erro ao acessar usuários");return}
if(!data||data.length===0){alert("Usuário não encontrado");return}
const user=data[0]
if(user.senha_hash!==senha){alert("Senha incorreta");return}
localStorage.setItem("usuario_nome",user.nome)
localStorage.setItem("profissional_id",user.id)
document.getElementById("login").style.display="none"
document.getElementById("app").style.display="block"
await iniciarSistema()
}
/* ====================================================
011 – INICIAR SISTEMA
==================================================== */
async function iniciarSistema(){
while(!db){await new Promise(r=>setTimeout(r,50))}
definirDataHoje()
if(typeof carregarEmpresa==="function"){carregarEmpresa()}
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
