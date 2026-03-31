/* 🔥 LOGIN UNIVERSAL (ENTER + CONTROLE + CLICK) */
document.addEventListener("keydown",e=>{
const btn=document.getElementById("btnEntrar")
if(!btn)return
if(
e.key==="Enter"||
e.key===" "||
e.key==="OK"||
e.keyCode===13
){
e.preventDefault()
btn.click()
}
})
/* ====================================================
000 – EMPRESA FIXA (DEFINITIVO)
==================================================== */
if(typeof EMPRESA_ID==="undefined" || !EMPRESA_ID){
var EMPRESA_ID="d9f678e5-6c7a-485e-895c-cb4791db840e"
}
/* ====================================================
000 – VARIÁVEIS GLOBAIS DO SISTEMA
==================================================== */
if(typeof TURNO_ATUAL==="undefined"){var TURNO_ATUAL=localStorage.getItem("turno_atual")||"manha"}
if(typeof PACIENTE_ATUAL==="undefined"){var PACIENTE_ATUAL=null}
if(typeof db==="undefined"){var db=null}
if(typeof EMPRESA_ID==="undefined"){var EMPRESA_ID=localStorage.getItem("empresa_id")||"d9f678e5-6c7a-485e-895c-cb4791db840e"}
if(typeof ROTINAS_CACHE==="undefined"){var ROTINAS_CACHE=[]}
if(typeof ROTINAS_GERADAS==="undefined"){var ROTINAS_GERADAS=false}
if(typeof MODO_EDICAO_CLINICO==="undefined"){var MODO_EDICAO_CLINICO=false}
if(typeof PROFISSIONAL_ID==="undefined"){var PROFISSIONAL_ID=localStorage.getItem("usuario_id")||null}
if(typeof USUARIO_HIERARQUIA==="undefined"){var USUARIO_HIERARQUIA=parseInt(localStorage.getItem("usuario_hierarquia")||1)}
if(typeof SALVANDO==="undefined"){var SALVANDO=false}
if(typeof MODO_EDICAO_ADMIN==="undefined"){var MODO_EDICAO_ADMIN=localStorage.getItem("modo_edicao_admin")==="true"}

/* ====================================================
001 – DEFINIR SESSÃO PROFISSIONAL (CORRIGIDO DEFINITIVO)
==================================================== */
function definirSessaoProfissional(user){
if(!user)return
localStorage.setItem("usuario_id",user.id)
localStorage.setItem("usuario_nome",user.nome_apelido||user.nome_completo||"admin")
localStorage.setItem("usuario_hierarquia",user.hierarquia||1)
localStorage.setItem("usuario_perfil",(user.perfil||"admin").toLowerCase())
localStorage.setItem("empresa_id",user.empresa_id||EMPRESA_ID)
PROFISSIONAL_ID=user.id
}

/* ====================================================
002 – OBTER USUÁRIO LOGADO (BLINDADO FINAL)
==================================================== */
function obterUsuarioLogado(){
const id=localStorage.getItem("usuario_id")
const nome=localStorage.getItem("usuario_nome")||"admin"
let perfil=(localStorage.getItem("usuario_perfil")||"admin").toLowerCase()
let hierarquia=localStorage.getItem("usuario_hierarquia")

/* 🔥 GARANTE CONSISTÊNCIA */
if(!hierarquia){
hierarquia="1"
localStorage.setItem("usuario_hierarquia","1")
}

/* 🔥 FORÇA ADMIN SE NOME FOR ADMIN */
if(nome.toLowerCase()==="admin"){
perfil="admin"
hierarquia="1"
}

return{
id,
nome,
perfil,
hierarquia:Number(hierarquia),
empresa_id:localStorage.getItem("empresa_id")
}
}
/* ====================================================
010 – CONTROLE DE PERMISSÃO (CORRIGIDO DEFINITIVO)
==================================================== */
function pode(acao){

const user=obterUsuarioLogado()
const perfil=user.perfil
const h=user.hierarquia

const regras={
admin:true,

editar_clinico:(perfil==="admin"||h<=2),
salvar_clinico:(perfil==="admin"||h<=2),
excluir_paciente:(perfil==="admin"),
executar_rotina:(h<=4),
concluir_pendentes:(h<=2),
editar_admin:(perfil==="admin"),

/* ====================================================
011 – PERMISSÕES MEDICAÇÃO
==================================================== */
medicacao_visualizar:true,
medicacao_editar:(perfil==="admin"||h<=3),
medicacao_excluir:(perfil==="admin"||h<=2)

}

return regras[acao]===true

}
/* ====================================================
003 – CACHE DE USUÁRIOS (DINÂMICO)
==================================================== */
var USUARIOS_CACHE={}

/* ====================================================
004 – GERAR COR POR NOME (AUTOMÁTICO)
==================================================== */
function gerarCorPorNome(nome){
if(!nome)return"#64748b"
let hash=0
for(let i=0;i<nome.length;i++){hash=nome.charCodeAt(i)+((hash<<5)-hash)}
let cor="#"
for(let i=0;i<3;i++){let value=(hash>>(i*8))&255;cor+=("00"+value.toString(16)).slice(-2)}
return cor
}

/* ====================================================
005 – OBTER COR DO USUÁRIO (DINÂMICO)
==================================================== */
function obterCorUsuario(nome){
if(!nome)return"#64748b"
nome=nome.toLowerCase().trim()
if(USUARIOS_CACHE[nome]&&USUARIOS_CACHE[nome].cor)return USUARIOS_CACHE[nome].cor
return gerarCorPorNome(nome)
}

/* ====================================================
006 – CARREGAR USUÁRIOS DO BANCO
==================================================== */
async function carregarUsuariosCache(){
if(!db||!EMPRESA_ID)return
const {data,error}=await db
.from("usuarios")
.select("id,nome_apelido,nome_completo,perfil,hierarquia")
.eq("empresa_id",EMPRESA_ID)
.eq("ativo",true)
if(error){console.error("Erro usuários",error);return}
USUARIOS_CACHE={}
data?.forEach(u=>{
let nome=(u.nome_apelido||u.nome_completo||"").toLowerCase().trim()
if(!nome)return
USUARIOS_CACHE[nome]={
id:u.id,
nome:u.nome_apelido||u.nome_completo,
perfil:(u.perfil||"").toLowerCase(),
hierarquia:Number(u.hierarquia)||5,
cor:gerarCorPorNome(nome)
}
})
}

/* ====================================================
007 – OBTER NOME USUÁRIO ATUAL
==================================================== */
function obterNomeUsuarioAtual(){
return localStorage.getItem("usuario_nome")||"admin"
}

/* ====================================================
008 – OBTER ID USUÁRIO
==================================================== */
function obterIdUsuarioAtual(){
return localStorage.getItem("usuario_id")||null
}

/* ====================================================
009 – OBTER COR USUÁRIO ATUAL
==================================================== */
function obterCorUsuarioAtual(){
return obterCorUsuario(obterNomeUsuarioAtual())
}

/* ====================================================
090 – EDITAR USUÁRIOS (ADMIN)
==================================================== */
function editarUsuarios(){
MODO_EDICAO_ADMIN=true
localStorage.setItem("modo_edicao_admin","true")
if(typeof carregarUsuarios==="function")carregarUsuarios()
}

/* ====================================================
091 – CANCELAR EDIÇÃO
==================================================== */
function cancelarEdicaoUsuarios(){
MODO_EDICAO_ADMIN=false
localStorage.setItem("modo_edicao_admin","false")
if(typeof carregarUsuarios==="function")carregarUsuarios()
}

/* ====================================================
092 – TOGGLE EDIÇÃO
==================================================== */
function toggleEdicaoUsuarios(){
MODO_EDICAO_ADMIN=!MODO_EDICAO_ADMIN
localStorage.setItem("modo_edicao_admin",MODO_EDICAO_ADMIN)
if(typeof carregarUsuarios==="function")carregarUsuarios()
}

/* ====================================================
099 – INIT GLOBAL (OBRIGATÓRIO)
==================================================== */
async function initGlobals(){
await carregarUsuariosCache()
}
