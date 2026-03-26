/* ====================================================
060 – INSERIR USUÁRIO (CORRIGIDO FINAL)
==================================================== */
async function inserirUsuario(){
if(!db)return
let perfilUI=document.getElementById("u_perfil")?.value||""
let perfilMap={"Administrador(a)":"administrador","Médico(a)":"medico","Enfermeiro(a)":"enfermeiro","Cuidador(a)":"cuidador","Fisioterapeuta":"fisioterapeuta","Estagiário(a)":"estagiario"}
let perfil=perfilMap[perfilUI]||"cuidador"
const novo={empresa_id:EMPRESA_ID,nome:document.getElementById("u_nome")?.value||"",nome_completo:document.getElementById("u_nome")?.value||"",nome_apelido:document.getElementById("u_apelido")?.value||"",email:document.getElementById("u_email")?.value||"",perfil:perfil,hierarquia:parseInt(document.getElementById("u_hierarquia")?.value||5),senha_hash:document.getElementById("u_senha")?.value||"",ativo:true}
if(!novo.nome||!novo.email){alert("Preencha nome e email");return}
const {error}=await db.from("usuarios").insert([novo])
if(error){console.error(error);alert("Erro ao inserir: "+error.message);return}
alert("Usuário inserido com sucesso")
document.getElementById("u_nome").value=""
document.getElementById("u_apelido").value=""
document.getElementById("u_email").value=""
document.getElementById("u_senha").value=""
carregarUsuarios()
}
/* ====================================================
061 – CARREGAR USUÁRIOS
==================================================== */
async function carregarUsuarios(){
if(!db||!EMPRESA_ID)return
MODO_EDICAO_ADMIN=localStorage.getItem("modo_edicao_admin")==="true"
let query=db.from("usuarios").select("*").eq("empresa_id",EMPRESA_ID)
const busca=document.getElementById("buscaUsuario")?.value?.toLowerCase()||""
const perfilFiltro=document.getElementById("filtroPerfil")?.value||""
const hierarquiaFiltro=document.getElementById("filtroHierarquia")?.value||""
if(perfilFiltro)query=query.eq("perfil",perfilFiltro)
if(hierarquiaFiltro)query=query.eq("hierarquia",parseInt(hierarquiaFiltro))
const {data,error}=await query.order("nome_completo")
if(error){console.error(error);return}
const lista=data.filter(u=>!busca||(u.nome_completo||"").toLowerCase().includes(busca)||(u.email||"").toLowerCase().includes(busca))
const tabela=document.getElementById("tabelaUsuariosAdmin")
if(!tabela)return
let html=""
lista.forEach(u=>{
let cor="#fff"
if(u.perfil==="administrador")cor="#e3f2fd"
else if(u.perfil==="medico")cor="#fdecea"
else if(u.perfil==="enfermeiro")cor="#e8f5e9"
else if(u.perfil==="cuidador")cor="#fff8e1"
else if(u.perfil==="fisioterapeuta")cor="#f3e5f5"
else if(u.perfil==="estagiario")cor="#ede7f6"
if(!MODO_EDICAO_ADMIN){
html+=`<tr data-id="${u.id}" style="background:${cor}"><td>${u.nome_completo||""}</td><td>${u.nome_apelido||""}</td><td>${u.email||""}</td><td>${u.perfil||""}</td><td>${u.hierarquia||""}</td><td></td></tr>`
}else{
html+=`<tr data-id="${u.id}" style="background:${cor}">
<td><input class="u_nome" value="${u.nome_completo||""}"></td>
<td><input class="u_apelido" value="${u.nome_apelido||""}"></td>
<td><input class="u_email" value="${u.email||""}"></td>
<td><select class="u_perfil">
<option value="administrador"${u.perfil==="administrador"?" selected":""}>Administrador</option>
<option value="medico"${u.perfil==="medico"?" selected":""}>Médico</option>
<option value="enfermeiro"${u.perfil==="enfermeiro"?" selected":""}>Enfermeiro</option>
<option value="cuidador"${u.perfil==="cuidador"?" selected":""}>Cuidador</option>
<option value="fisioterapeuta"${u.perfil==="fisioterapeuta"?" selected":""}>Fisioterapeuta</option>
<option value="estagiario"${u.perfil==="estagiario"?" selected":""}>Estagiário</option>
</select></td>
<td><select class="u_hierarquia">
<option value="1"${u.hierarquia==1?" selected":""}>1</option>
<option value="2"${u.hierarquia==2?" selected":""}>2</option>
<option value="3"${u.hierarquia==3?" selected":""}>3</option>
<option value="4"${u.hierarquia==4?" selected":""}>4</option>
<option value="5"${u.hierarquia==5?" selected":""}>5</option>
</select></td>
<td><input class="u_senha" type="password"></td>
<td><button onclick="excluirUsuario('${u.id}')" class="btn-danger">Excluir</button></td>
</tr>`
}
})
tabela.innerHTML=html
}
/* ====================================================
062 – SALVAR USUÁRIO
==================================================== */
async function salvarUsuario(id,btn){
const tr=btn.closest("tr")
const dados={nome_completo:tr.querySelector(".u_nome")?.value||"",nome_apelido:tr.querySelector(".u_apelido")?.value||"",email:tr.querySelector(".u_email")?.value||"",perfil:tr.querySelector(".u_perfil")?.value||"",hierarquia:parseInt(tr.querySelector(".u_hierarquia")?.value||5),ativo:true}
const novaSenha=tr.querySelector(".u_senha")?.value
if(novaSenha)dados.senha_hash=novaSenha
const {error}=await db.from("usuarios").update(dados).eq("id",id)
if(error){alert("Erro ao salvar");console.error(error);return}
btn.innerText="✔"
setTimeout(()=>btn.innerText="Salvar",1200)
}
/* ====================================================
063 – EXCLUIR USUÁRIO
==================================================== */
async function excluirUsuario(id){
if(!confirm("Excluir usuário?"))return
await db.from("usuarios").delete().eq("id",id)
carregarUsuarios()
}
/* ====================================================
064 – PACIENTES DRAG
==================================================== */
async function carregarPacientesDrag(){
if(!db)return
const {data}=await db.from("pacientes").select("id,nome_completo").order("nome_completo")
let html=""
data?.forEach(p=>{html+=`<div class="drag-item" id="pac_${p.id}">${p.nome_completo}</div>`})
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
const {data}=await db.from("usuarios").select("id,nome_apelido").eq("ativo",true)
let html=""
data?.forEach(p=>{html+=`<div class="drag-item" id="prof_${p.id}">${p.nome_apelido||p.id}</div>`})
el.innerHTML=html
}
/* ====================================================
066 – SALVAR USUARIO EDITADO (INLINE BLUR CORRIGIDO)
==================================================== */
document.addEventListener("blur",async function(e){
if(!e.target.dataset.campo)return
if(!db)return
const campo=e.target.dataset.campo
const id=e.target.dataset.id
if(!id)return
let valor=e.target.innerText.trim()
if(campo==="hierarquia")valor=parseInt(valor||5)
if(campo==="ativo")valor=(valor==="true"||valor==="1")
try{
await db.from("usuarios").update({[campo]:valor}).eq("id",id)
}catch(err){
console.error("Erro inline:",err)
}
},{capture:true})
/* ====================================================
067 – ADICIONAR ROTINA (CORRIGIDO)
==================================================== */
async function adicionarRotina(){
if(!db)return
if(!EMPRESA_ID){console.error("EMPRESA_ID null");return}
const nome=document.getElementById("adminRotina")?.value||""
const turno=document.getElementById("adminTurno")?.value||"manha"
if(!nome){alert("Informe o nome da rotina");return}
const {error}=await db.from("rotina_modelos").insert({
empresa_id:EMPRESA_ID,
nome:nome,
turno:turno,
ordem:99,
ativo:true
})
if(error){
console.error(error)
alert("Erro ao adicionar rotina")
return
}
alert("Rotina adicionada")
document.getElementById("adminRotina").value=""
if(typeof carregarRotinas==="function")await carregarRotinas()
}
/* ====================================================
068 – CONCLUIR PENDENTES (DEFINITIVO FUNCIONANDO)
==================================================== */
async function concluirPendentes(){

if(!db||SALVANDO)return

const user=obterUsuarioLogado()
const isAdmin=Number(user?.hierarquia)===1

if(!isAdmin){
alert("Apenas administradores podem executar esta ação")
return
}

SALVANDO=true
atualizarBarraProgresso(0)

const dataRaw=document.getElementById("dataInicio")?.value
const dataHoje=dataRaw&&dataRaw.includes("/")?dataRaw.split("/").reverse().join("-"):(dataRaw||new Date().toISOString().slice(0,10))
const turno=TURNO_ATUAL||"manha"

const nomeUsuario="Administrador"

const pendentes=(ROTINAS_CACHE||[]).filter(r=>r.status!=="executado")

let total=pendentes.length
let atual=0

for(const r of pendentes){

/* 🔴 LIMPA QUALQUER REGISTRO ANTERIOR */
await db.from("rotinas_execucao")
.delete()
.eq("paciente_id",r.paciente_id)
.eq("rotina_id",r.rotina_id)
.eq("data",dataHoje)
.eq("turno",turno)

/* 🔥 INSERE COMO EXECUTADO */
const res=await db.from("rotinas_execucao").insert({
paciente_id:r.paciente_id,
rotina_id:r.rotina_id,
data:dataHoje,
turno:turno,
status:"executado",
executado_por:null,
horario_executado:new Date().toISOString(),
profissional_nome:nomeUsuario
})

if(res.error){
console.error("Erro concluirPendentes",res.error)
continue
}

/* 🔄 CACHE */
r.status="executado"
r.profissional=nomeUsuario

atual++
atualizarBarraProgresso(Math.floor((atual/total)*100))

}

/* 🔄 RECARREGA DO BANCO */
await carregarRotinas()

SALVANDO=false
atualizarBarraProgresso(100)
setTimeout(()=>atualizarBarraProgresso(0),1200)

alert("Pendências concluídas")
}
/* ====================================================
069 – SALVAR USUARIO LINHA (ROBUSTO)
==================================================== */
async function salvarUsuarioLinha(id){
if(!db)return
if(!id)return
const linha=document.querySelector(`tr[data-id="${id}"]`)
if(!linha)return
const dados={
nome_completo:linha.querySelector(".u_nome")?.value||"",
nome_apelido:linha.querySelector(".u_apelido")?.value||"",
email:linha.querySelector(".u_email")?.value||"",
perfil:linha.querySelector(".u_perfil")?.value||"",
hierarquia:parseInt(linha.querySelector(".u_hierarquia")?.value||5),
ativo:true
}
const novaSenha=linha.querySelector(".u_senha")?.value
if(novaSenha)dados.senha_hash=novaSenha
try{
const {error}=await db.from("usuarios").update(dados).eq("id",id)
if(error){
console.error(error)
alert("Erro ao salvar usuário")
return
}
alert("Usuário atualizado")
}catch(err){
console.error("Erro geral:",err)
}
}
/* ====================================================
070 – EDITAR USUÁRIOS
==================================================== */
function editarUsuarios(){
localStorage.setItem("modo_edicao_admin","true")
MODO_EDICAO_ADMIN=true
carregarUsuarios()
}
/* ====================================================
071 – SALVAR USUÁRIOS - TODOS (OTIMIZADO E BLINDADO)
==================================================== */
async function salvarUsuarios(){
if(!db)return
if(window._salvandoUsuarios)return
window._salvandoUsuarios=true
const linhas=document.querySelectorAll("#tabelaUsuariosAdmin tr[data-id]")
let promessas=[]
for(const tr of linhas){
const id=tr.getAttribute("data-id")
if(!id)continue
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
promessas.push(
db.from("usuarios").update(dados).eq("id",id)
)
}
const resultados=await Promise.all(promessas)
let erro=false
resultados.forEach(r=>{
if(r.error){
erro=true
console.error("Erro salvar usuário:",r.error)
}
})
window._salvandoUsuarios=false
if(erro){
alert("Alguns usuários não foram salvos. Ver console.")
}else{
alert("Todos usuários salvos com sucesso")
}
MODO_EDICAO_ADMIN=false
localStorage.setItem("modo_edicao_admin","false")
await carregarUsuarios()
}
