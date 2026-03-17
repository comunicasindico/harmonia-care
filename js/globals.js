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
if(typeof PROFISSIONAL_ID==="undefined"){var PROFISSIONAL_ID=localStorage.getItem("profissional_id")||null}
if(typeof USUARIO_HIERARQUIA==="undefined"){var USUARIO_HIERARQUIA=parseInt(localStorage.getItem("usuario_hierarquia")||5)}
/* ====================================================
090 – MODO EDIÇÃO ADMIN
==================================================== */
if(typeof MODO_EDICAO_ADMIN==="undefined"){var MODO_EDICAO_ADMIN=localStorage.getItem("modo_edicao_admin")==="true"}
/* ====================================================
091 – ATIVAR EDIÇÃO ADMIN
==================================================== */
function editarUsuarios(){
MODO_EDICAO_ADMIN=true
localStorage.setItem("modo_edicao_admin","true")
if(typeof carregarUsuarios==="function")carregarUsuarios()
}
/* ====================================================
092 – CANCELAR EDIÇÃO ADMIN
==================================================== */
function cancelarEdicaoUsuarios(){
MODO_EDICAO_ADMIN=false
localStorage.setItem("modo_edicao_admin","false")
if(typeof carregarUsuarios==="function")carregarUsuarios()
}
/* ====================================================
093 – TOGGLE EDIÇÃO ADMIN
==================================================== */
function toggleEdicaoUsuarios(){
MODO_EDICAO_ADMIN=!MODO_EDICAO_ADMIN
localStorage.setItem("modo_edicao_admin",MODO_EDICAO_ADMIN)
if(typeof carregarUsuarios==="function")carregarUsuarios()
}
/* ====================================================
000A – CORES DOS USUÁRIOS
==================================================== */
const CORES_USUARIOS={
"admin":"#64748b",
"Administrador":"#64748b",
"visualizador":"#64748b",
"visualizador(a)":"#64748b",
"enfermeiro":"#64748b",
"enfermeiro(a)":"#64748b",
"medico":"#64748b",
"medico(a)":"#64748b",
"supervisor":"#64748b",
"supervisor(a)":"#64748b",
"teste":"#64748b"
}
function obterCorUsuario(nome){
if(!nome)return"#64748b"
const chave=nome.toLowerCase().trim()
if(CORES_USUARIOS[chave]){return CORES_USUARIOS[chave]}
let hash=0
for(let i=0;i<nome.length;i++){hash=nome.charCodeAt(i)+((hash<<5)-hash)}
const cores=["#2563eb","#059669","#d97706","#7c3aed","#db2777","#0891b2","#4f46e5"]
return cores[Math.abs(hash)%cores.length]
}
/* ====================================================
001 – ATUALIZAR SESSÃO PROFISSIONAL
==================================================== */
function definirSessaoProfissional(id,empresa){
PROFISSIONAL_ID=id
if(empresa){
EMPRESA_ID=empresa
localStorage.setItem("empresa_id",empresa)
}
localStorage.setItem("profissional_id",id)
}
/* ====================================================
050 – USUÁRIO LOGADO (HIERARQUIA)
==================================================== */
let USUARIO_HIERARQUIA=parseInt(localStorage.getItem("usuario_hierarquia")||5)
