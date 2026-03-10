
/* ====================================================
CARREGAR PROFISSIONAIS
==================================================== */

async function carregarProfissionais(){

const {data}=await db
.from("profissionais")
.select("*")
.order("nome")

let html=""

data.forEach(p=>{

html+=`

<div class="drag-item"
draggable="true"
ondragstart="drag(event)"
id="prof_${p.id}">

${p.nome}

</div>

`

})

document.getElementById("listaProfissionaisDrag").innerHTML=html

}

/* ====================================================
CARREGAR PACIENTES DRAG
==================================================== */

async function carregarPacientesDrag(){

const {data}=await db
.from("pacientes")
.select("*")
.order("nome_completo")

let html=""

data.forEach(p=>{

html+=`

<div class="drag-item"
ondrop="drop(event)"
ondragover="allowDrop(event)"
id="pac_${p.id}">

${p.nome_completo}

</div>

`

})

document.getElementById("listaPacientesDrag").innerHTML=html

}
