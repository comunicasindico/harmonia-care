/* ====================================================
040 – PACIENTES DRAG
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
041 – PROFISSIONAIS DRAG
==================================================== */
async function carregarProfissionaisDrag(){
if(!db)return
const el=document.getElementById("listaProfissionaisDrag")
if(!el)return
const {data,error}=await db
.from("usuarios")
.select("id,nome_completo,perfil,ativo")
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
042 – CARREGAR USUARIOS ADMIN
==================================================== */
async function carregarUsuariosAdmin(){
if(!db)return
const tabela=document.getElementById("tabelaUsuariosAdmin")
if(!tabela)return
const {data,error}=await db.from("usuarios").select("id,empresa_id,nome_completo,usuario_apelido,email,perfil,ativo,created_at,cargo,hierarquia,senha_hash").order("nome_completo",{ascending:true})
if(error){console.error("Erro usuarios",error);return}
let html=""
data?.forEach(u=>{
html+=`<tr>
<td>${u.id||""}</td>
<td>${u.empresa_id||""}</td>
<td contenteditable="true" data-campo="nome_completo" data-id="${u.id}">${u.nome_completo||""}</td>
<td contenteditable="true" data-campo="usuario_apelido" data-id="${u.id}">${u.usuario_apelido||""}</td>
<td contenteditable="true" data-campo="email" data-id="${u.id}">${u.email||""}</td>
<td contenteditable="true" data-campo="perfil" data-id="${u.id}">${u.perfil||""}</td>
<td contenteditable="true" data-campo="ativo" data-id="${u.id}">${u.ativo}</td>
<td>${u.created_at||""}</td>
<td contenteditable="true" data-campo="cargo" data-id="${u.id}">${u.cargo||""}</td>
<td contenteditable="true" data-campo="hierarquia" data-id="${u.id}">${u.hierarquia||""}</td>
<td contenteditable="true" data-campo="senha_hash" data-id="${u.id}">${u.senha_hash||""}</td>
</tr>`
})
tabela.innerHTML=html
}
/* ====================================================
043 – SALVAR USUARIO EDITADO
==================================================== */
document.addEventListener("blur",async function(e){
if(!e.target.dataset.campo)return
const campo=e.target.dataset.campo
const id=e.target.dataset.id
const valor=e.target.innerText.trim()
await db.from("usuarios").update({[campo]:valor}).eq("id",id)
},{capture:true})
/* ====================================================
044 – ADICIONAR ROTINA
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
045 – CONCLUIR PENDENTES (ADMIN)
==================================================== */
async function concluirPendentes(){
if(!db)return
const dataInicio=document.getElementById("dataInicio")?.value
const dataFim=document.getElementById("dataFim")?.value
if(!dataInicio){alert("Informe a data inicial");return}
const usuarioId=localStorage.getItem("usuario_id")
const {error}=await db.from("rotinas_execucao").update({status:"executado",usuario_id:usuarioId,horario_executado:new Date()}).eq("status","pendente").gte("data",dataInicio).lte("data",dataFim)
if(error){console.error(error);alert("Erro ao concluir pendentes");return}
alert("Pendências concluídas com sucesso")
if(typeof carregarRotinas==="function"){await carregarRotinas()}
}
