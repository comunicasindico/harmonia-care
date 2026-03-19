/* ====================================================
060 – INSERIR USUÁRIO (CORRIGIDO FINAL)
==================================================== */
async function inserirUsuario(){
if(!db)return
/* 🔥 MAPEAR PERFIL */
let perfilUI=document.getElementById("u_perfil")?.value||""
let perfilMap={
"Administrador(a)":"administrador",
"Médico(a)":"medico",
"Enfermeiro(a)":"enfermeiro",
"Cuidador(a)":"cuidador",
"Fisioterapeuta":"fisioterapeuta",
"Estagiário(a)":"estagiario"
}

let perfil=perfilMap[perfilUI]||"cuidador"
/* 🔥 OBJETO */
const novo={
empresa_id:EMPRESA_ID,
nome:document.getElementById("u_nome")?.value||"", // obrigatório no banco
nome_completo:document.getElementById("u_nome")?.value||"",
nome_apelido:document.getElementById("u_apelido")?.value||"",
email:document.getElementById("u_email")?.value||"",
perfil:perfil, // 🔥 CORRIGIDO
hierarquia:parseInt(document.getElementById("u_hierarquia")?.value||5),
senha_hash:document.getElementById("u_senha")?.value||"",
ativo:true
}
/* 🔥 VALIDAÇÃO */
if(!novo.nome || !novo.email){
alert("Preencha nome e email")
return
}
/* 🔥 INSERT */
const {error}=await db.from("usuarios").insert([novo])

if(error){
console.error(error)
alert("Erro ao inserir: "+error.message)
return
}
alert("Usuário inserido com sucesso")
/* 🔄 LIMPA CAMPOS */
document.getElementById("u_nome").value=""
document.getElementById("u_apelido").value=""
document.getElementById("u_email").value=""
document.getElementById("u_senha").value=""
/* 🔄 RECARREGA */
carregarUsuarios()
}
/* ====================================================
061 – CARREGAR USUÁRIOS (ADMIN)
==================================================== */
async function carregarUsuarios(){
if(!db)return
if(!EMPRESA_ID){console.error("EMPRESA_ID null");return}

let query=db
.from("usuarios")
.select("id,empresa_id,nome_completo,nome_apelido,email,perfil,hierarquia,senha_hash,ativo")
.eq("empresa_id",EMPRESA_ID)

const busca=document.getElementById("buscaUsuario")?.value?.toLowerCase()||""
const perfilFiltro=document.getElementById("filtroPerfil")?.value||""
const hierarquiaFiltro=document.getElementById("filtroHierarquia")?.value||""

if(perfilFiltro)query=query.eq("perfil",perfilFiltro)
if(hierarquiaFiltro)query=query.eq("hierarquia",parseInt(hierarquiaFiltro))

const {data,error}=await query.order("nome_completo")

if(error){
console.error("Erro usuários",error)
return
}

const listaFiltrada=data.filter(u=>{
if(!busca)return true
return (u.nome_completo||"").toLowerCase().includes(busca) ||
(u.email||"").toLowerCase().includes(busca)
})

const tabela=document.getElementById("tabelaUsuariosAdmin")
if(!tabela)return

let html=""

listaFiltrada.forEach(u=>{

let cor="#fff"
if(u.perfil==="administrador")cor="#e3f2fd"
else if(u.perfil==="medico")cor="#fdecea"
else if(u.perfil==="enfermeiro")cor="#e8f5e9"
else if(u.perfil==="cuidador")cor="#fff8e1"
else if(u.perfil==="fisioterapeuta")cor="#f3e5f5"
else if(u.perfil==="estagiario")cor="#ede7f6"

if(!MODO_EDICAO_ADMIN){

html+=`
<tr data-id="${u.id}" style="background:${cor}">
<td>${u.nome_completo||""}</td>
<td>${u.nome_apelido||""}</td>
<td>${u.email||""}</td>
<td>${u.perfil||""}</td>
<td>${u.hierarquia||""}</td>
${MODO_EDICAO_ADMIN 
? `<td><button onclick="excluirUsuario('${u.id}')" class="btn-excluir-mini">✖</button></td>` 
: `<td></td>`}
</tr>
`

}else{

html+=`
<tr data-id="${u.id}" style="background:${cor}">
<td><input class="u_nome" value="${u.nome_completo||""}"></td>
<td><input class="u_apelido" value="${u.nome_apelido||""}"></td>
<td><input class="u_email" value="${u.email||""}"></td>

<td>
<select class="u_perfil">
<option value="administrador" ${u.perfil==="administrador"?"selected":""}>Administrador</option>
<option value="medico" ${u.perfil==="medico"?"selected":""}>Médico</option>
<option value="enfermeiro" ${u.perfil==="enfermeiro"?"selected":""}>Enfermeiro</option>
<option value="cuidador" ${u.perfil==="cuidador"?"selected":""}>Cuidador</option>
<option value="fisioterapeuta" ${u.perfil==="fisioterapeuta"?"selected":""}>Fisioterapeuta</option>
<option value="estagiario" ${u.perfil==="estagiario"?"selected":""}>Estagiário</option>
</select>
</td>

<td>
<select class="u_hierarquia">
<option value="1"${u.hierarquia==1?" selected":""}>1</option>
<option value="2"${u.hierarquia==2?" selected":""}>2</option>
<option value="3"${u.hierarquia==3?" selected":""}>3</option>
<option value="4"${u.hierarquia==4?" selected":""}>4</option>
<option value="5"${u.hierarquia==5?" selected":""}>5</option>
</select>
</td>

<td><input class="u_senha" type="password" placeholder="nova senha"></td>

<td>
<button onclick="excluirUsuario('${u.id}')" class="btn-danger">Excluir</button>
</td>
</tr>
`

}

})

tabela.innerHTML=html
}
/* ====================================================
062 – SALVAR USUÁRIO
==================================================== */
async function salvarUsuario(id,btn){
const tr=btn.closest("tr")
const nivelAlvo=parseInt(tr.querySelector(".u_hierarquia")?.value||5)
if(USUARIO_HIERARQUIA>=nivelAlvo){
return
}
/* 🔥 PERFIL (CORREÇÃO COMPLETA) */
let perfilUI=tr.querySelector(".u_perfil")?.value||""

let perfilMap={
"Administrador(a)":"administrador",
"Médico(a)":"medico",
"Enfermeiro(a)":"enfermeiro",
"Cuidador(a)":"cuidador",
"Fisioterapeuta":"fisioterapeuta",
"Estagiário(a)":"estagiario"
}
let perfil=perfilMap[perfilUI]||"cuidador"
/* CAPTURA REAL DO ESTADO ANTERIOR */
const dadosAntes={
nome_completo:tr.querySelector(".u_nome")?.getAttribute("value")||"",
nome_apelido:tr.querySelector(".u_apelido")?.getAttribute("value")||"",
email:tr.querySelector(".u_email")?.getAttribute("value")||"",
perfil:perfil,
hierarquia:parseInt(tr.querySelector(".u_hierarquia")?.value||5),
senha:"***"
}
/* NOVOS DADOS */
const dados={
nome_completo:tr.querySelector(".u_nome")?.value||"",
nome_apelido:tr.querySelector(".u_apelido")?.value||"",
email:tr.querySelector(".u_email")?.value||"",
perfil:perfil, // 🔥 AGORA CORRETO
hierarquia:parseInt(tr.querySelector(".u_hierarquia")?.value||5),
ativo:true
}
const novaSenha=tr.querySelector(".u_senha")?.value
if(novaSenha)dados.senha_hash=novaSenha
const {error}=await db.from("usuarios").update(dados).eq("id",id)
if(error){
alert("Erro ao salvar")
console.error(error)
return
}
/* AUDITORIA */
if(typeof registrarAuditoria==="function"){
await registrarAuditoria({
acao:"UPDATE",
tabela:"usuarios",
registro_id:id,
antes:dadosAntes,
depois:dados
})
}
btn.innerText="✔"
setTimeout(()=>btn.innerText="Salvar",1200)
}
/* ====================================================
063 – EXCLUIR USUÁRIO
==================================================== */
async function excluirUsuario(id){
const tr=document.querySelector(`tr[data-id="${id}"]`)
const nivel=parseInt(tr?.querySelector(".u_hierarquia")?.value||5)
if(USUARIO_HIERARQUIA>=nivel){alert("Sem permissão");return}
if(!confirm("Excluir usuário?"))return
await db.from("usuarios").delete().eq("id",id)
if(typeof registrarAuditoria==="function"){
await registrarAuditoria({acao:"DELETE",tabela:"usuarios",registro_id:id})
}
carregarUsuarios()
}
/* ====================================================
064 – PACIENTES DRAG
==================================================== */
async function carregarPacientesDrag(){
if(!db)return
const {data,error}=await db.from("pacientes").select("id,nome_completo").order("nome_completo")
if(error){console.error(error);return}
let html=""
data?.forEach(p=>{
html+=`<div class="drag-item" id="pac_${p.id}">${p.nome_completo}</div>`
})
const el=document.getElementById("listaPacientesDrag")
if(el)el.innerHTML=html
}
/* ====================================================
065 – PROFISSIONAIS DRAG
==================================================== */
async function carregarProfissionaisDrag(){
if(!db)return
const el=document.getElementById("listaProfissionaisDrag")
if(!el)return
const {data,error}=await db
.from("usuarios")
.select("id,nome_completo")
.eq("ativo",true)
.order("nome_completo",{ascending:true})
if(error){
console.error("Erro profissionais",error)
return
}
let html=""
data?.forEach(p=>{
html+=`<div class="drag-item" id="prof_${p.id}">${p.nome_completo}</div>`
})
el.innerHTML=html
}
/* ====================================================
066 – SALVAR USUARIO EDITADO
==================================================== */
document.addEventListener("blur",async function(e){
if(!e.target.dataset.campo)return
const campo=e.target.dataset.campo
const id=e.target.dataset.id
const valor=e.target.innerText.trim()
await db.from("usuarios").update({[campo]:valor}).eq("id",id)
},{capture:true})
/* ====================================================
067 – ADICIONAR ROTINA
==================================================== */
async function adicionarRotina(){
if(!db)return
const paciente=document.getElementById("adminPaciente")?.value
const rotina=document.getElementById("adminRotina")?.value
const turno=document.getElementById("adminTurno")?.value
await db.from("rotina_modelos").insert({empresa_id:EMPRESA_ID,paciente_id:paciente,rotina:rotina,turno:turno})
alert("Rotina adicionada")
}
/* ====================================================
068 – CONCLUIR PENDENTES (BASE VISÍVEL + ADMIN)
==================================================== */
async function concluirPendentes(){
if(!db)return
if(!EMPRESA_ID){
console.error("EMPRESA_ID NULL")
return
}
if(SALVANDO){alert("Aguarde finalizar...");return}
SALVANDO=true
const dataRaw=document.getElementById("dataInicio")?.value
const dataHoje=dataRaw&&dataRaw.includes("/") 
? dataRaw.split("/").reverse().join("-") 
: (dataRaw||new Date().toISOString().slice(0,10))
const pendentes=(ROTINAS_CACHE||[]).filter(r=>r.status!=="executado")
let total=pendentes.length
let atual=0
for(const r of pendentes){
atual++
const {data:existe}=await db
.from("rotinas_execucao")
.select("id,status")
.eq("paciente_id",r.paciente_id)
.eq("rotina_id",r.rotina_id)
.eq("data",dataHoje)
.maybeSingle()
if(existe && existe.status==="executado")continue
if(!existe){
await db.from("rotinas_execucao").insert({
paciente_id:r.paciente_id,
rotina_id:r.rotina_id,
data:dataHoje,
status:"pendente"
})
}
await db.from("rotinas_execucao")
.update({
status:"executado",
horario_executado:new Date(),
usuario_id:localStorage.getItem("usuario_id")||null,
profissional_nome:"administrador" // 👈 AQUI É O SEGREDO
})
.eq("paciente_id",r.paciente_id)
.eq("rotina_id",r.rotina_id)
.eq("data",dataHoje)
}
SALVANDO=false
await carregarRotinas()
alert("Pendências concluídas com sucesso")
}
/* ====================================================
069 – SALVAR USUARIO (BOTÃO)
==================================================== */
async function salvarUsuarioLinha(id){
if(!db)return

const linha=document.querySelector(`tr[data-id="${id}"]`)
if(!linha)return

const campos=linha.querySelectorAll("[data-campo]")
let dados={}

campos.forEach(c=>{
let campo=c.dataset.campo
let valor=c.innerText.trim()

if(campo==="hierarquia")valor=parseInt(valor||5)
if(campo==="ativo")valor=(valor==="true"||valor==="1")

dados[campo]=valor
})

const {error}=await db.from("usuarios").update(dados).eq("id",id)

if(error){
console.error(error)
alert("Erro ao salvar")
return
}

alert("Salvo com sucesso")
}
/* ====================================================
070 – EDITAR USUARIOS
==================================================== */
function editarUsuarios(){
MODO_EDICAO_ADMIN=true
localStorage.setItem("modo_edicao_admin","true")
carregarUsuariosAdmin()
}
/* ====================================================
071 – SALVAR USUÁRIOS (GERAL)
==================================================== */
async function salvarUsuarios(){
if(!db)return
const linhas=document.querySelectorAll("#tabelaUsuariosAdmin tr[data-id]")
for(const tr of linhas){
const id=tr.getAttribute("data-id")
const dados={
nome_completo:tr.querySelector(".u_nome")?.value||"",
nome_apelido:tr.querySelector(".u_apelido")?.value||"",
email:tr.querySelector(".u_email")?.value||"",
perfil:tr.querySelector(".u_perfil")?.value||"",
hierarquia:parseInt(tr.querySelector(".u_hierarquia")?.value||5),
ativo:true
}
const novaSenha=tr.querySelector(".u_senha")?.value
if(novaSenha)dados.senha_hash=novaSenha
await db.from("usuarios").update(dados).eq("id",id)
}
MODO_EDICAO_ADMIN=false
localStorage.setItem("modo_edicao_admin","false")
alert("Todos os usuários salvos com sucesso")
carregarUsuarios()
}
