/* ====================================================
040 – PACIENTES DRAG
==================================================== */

async function carregarPacientesDrag(){

const {data,error}=await db
.from("pacientes")
.select("id,nome_completo")
.order("nome_completo")

if(error){

console.error(error)
return

}

let html=""

data.forEach(p=>{

html+=`

<div class="drag-item"
id="pac_${p.id}">

${p.nome_completo}

</div>

`

})

document.getElementById("listaPacientesDrag").innerHTML=html

}

/* ====================================================
041 – PROFISSIONAIS DRAG
==================================================== */

async function carregarProfissionaisDrag(){

const {data,error}=await db
.from("profissionais")
.select("*")
.order("nome")

if(error){

console.error(error)
return

}

let html=""

data.forEach(p=>{

html+=`

<div class="drag-item"
id="prof_${p.id}">

${p.nome}

</div>

`

})

document.getElementById("listaProfissionaisDrag").innerHTML=html

}

/* ====================================================
042 – ADICIONAR ROTINA
==================================================== */

async function adicionarRotina(){

const paciente=document.getElementById("adminPaciente").value
const rotina=document.getElementById("adminRotina").value
const turno=document.getElementById("adminTurno").value

await db
.from("rotina_modelos")
.insert({

empresa_id:EMPRESA_ID,
paciente_id:paciente,
rotina:rotina,
turno:turno

})

alert("Rotina adicionada")

}
