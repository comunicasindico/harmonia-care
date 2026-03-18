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
if(!EMPRESA_ID){console.error("EMPRESA_ID null");return}  // 👈 AQUI
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
if(u.perfil?.includes("Administrador"))cor="#e3f2fd"
else if(u.perfil?.includes("Médico"))cor="#fdecea"
else if(u.perfil?.includes("Enfermeiro"))cor="#e8f5e9"
else if(u.perfil?.includes("Cuidador"))cor="#fff8e1"
else if(u.perfil?.includes("Fisioterapeuta"))cor="#f3e5f5"

html+=`
<tr data-id="${u.id}" style="background:${cor}">
<td><input class="u_nome" value="${u.nome_completo||""}"></td>
<td><input class="u_apelido" value="${u.nome_apelido||""}"></td>
<td><input class="u_email" value="${u.email||""}"></td>
<td>
<select class="u_perfil">
<option value="administrador">Administrador</option>
<option value="medico">Médico</option>
<option value="enfermeiro">Enfermeiro</option>
<option value="cuidador">Cuidador</option>
<option value="fisioterapeuta">Fisioterapeuta</option>
<option value="estagiario">Estagiário</option>
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
<td>
<input class="u_senha" type="password" placeholder="nova senha">
</td>
<td>
<button onclick="salvarUsuario('${u.id}',this)" class="btn-success">Salvar</button>
<button onclick="excluirUsuario('${u.id}')" class="btn-danger">Excluir</button>
</td>
</tr>
`
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
senha_hash:tr.querySelector(".u_senha")?.value||"",
ativo:true
}

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
066 – CARREGAR USUARIOS ADMIN
==================================================== */
async function carregarUsuariosAdmin(){
if(!db)return
if(!EMPRESA_ID){console.error("EMPRESA_ID null");return}  // 👈 AQUI
const tabela=document.getElementById("tabelaUsuariosAdmin")
if(!tabela)return
const {data,error}=await db.from("usuarios").select("id,empresa_id,nome_completo,nome_apelido,email,perfil,ativo,created_at,cargo,hierarquia,senha_hash").order("nome_completo",{ascending:true})
if(error){console.error("Erro usuarios",error);return}
let html=""
data?.forEach(u=>{
html+=`<tr data-id="${u.id}">
<td>${u.id||""}</td>
<td>${u.empresa_id||""}</td>
<td contenteditable="true" data-campo="nome_completo" data-id="${u.id}">${u.nome_completo||""}</td>
<td contenteditable="true" data-campo="nome_apelido" data-id="${u.id}">${u.nome_apelido||""}</td>
<td contenteditable="true" data-campo="email" data-id="${u.id}">${u.email||""}</td>
<td contenteditable="true" data-campo="perfil" data-id="${u.id}">${u.perfil||""}</td>
<td contenteditable="true" data-campo="ativo" data-id="${u.id}">${u.ativo}</td>
<td>${u.created_at||""}</td>
<td contenteditable="true" data-campo="cargo" data-id="${u.id}">${u.cargo||""}</td>
<td contenteditable="true" data-campo="hierarquia" data-id="${u.id}">${u.hierarquia||""}</td>
<td contenteditable="true" data-campo="senha_hash" data-id="${u.id}">${u.senha_hash||""}</td>
<td>
<button onclick="salvarUsuarioLinha('${u.id}')">Salvar</button>
<button onclick="excluirUsuario('${u.id}')">Excluir</button>
</td>
</tr>`
})
tabela.innerHTML=html
}
/* ====================================================
067 – SALVAR USUARIO EDITADO
==================================================== */
document.addEventListener("blur",async function(e){
if(!e.target.dataset.campo)return
const campo=e.target.dataset.campo
const id=e.target.dataset.id
const valor=e.target.innerText.trim()
await db.from("usuarios").update({[campo]:valor}).eq("id",id)
},{capture:true})
/* ====================================================
068 – ADICIONAR ROTINA
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
069 – CONCLUIR PENDENTES (ADMIN)
==================================================== */
async function concluirPendentes(){
if(!db)return
const dataInicio=document.getElementById("dataInicio")?.value
const dataFim=document.getElementById("dataFim")?.value
if(!dataInicio){alert("Informe a data inicial");return}
const usuarioId=localStorage.getItem("usuario_id")
const {error}=await db
       .from("rotinas_execucao")
       .update({status:"executado",usuario_id:usuarioId,profissional_nome:"administrador",horario_executado:new Date()}) 
       .eq("status","pendente").gte("data",dataInicio)
       .lte("data",dataFim)
if(error){console.error(error);alert("Erro ao concluir pendentes");return}
alert("Pendências concluídas com sucesso")
if(typeof carregarRotinas==="function"){await carregarRotinas()}
}
/* ====================================================
070 – SALVAR USUARIO (BOTÃO)
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
