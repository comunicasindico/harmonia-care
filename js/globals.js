/* ====================================================
000 – VARIÁVEIS GLOBAIS DO SISTEMA
==================================================== */
if(typeof TURNO_ATUAL==="undefined"){
var TURNO_ATUAL="manha"
}

if(typeof PACIENTE_ATUAL==="undefined"){
var PACIENTE_ATUAL=null
}

if(typeof db==="undefined"){
var db=null
}

if(typeof EMPRESA_ID==="undefined"){
var EMPRESA_ID="d9f678e5-6c7a-485e-895c-cb4791db840e"
}

if(typeof ROTINAS_CACHE==="undefined"){
var ROTINAS_CACHE=[]
}

if(typeof ROTINAS_GERADAS==="undefined"){
var ROTINAS_GERADAS=false
}

if(typeof MODO_EDICAO_CLINICO==="undefined"){
var MODO_EDICAO_CLINICO=false
}
if(typeof PROFISSIONAL_ID==="undefined"){
var PROFISSIONAL_ID=localStorage.getItem("profissional_id")||null
}
