async function carregarPacientesDrag(){

const {data}=await db
.from("pacientes")
.select("id,nome_completo")
.order("nome_completo")

let html=""

data.forEach(p=>{

html+=`
<div class="drag-item" id="pac_${p.id}">
${p.nome_completo}
</div>
`

})

document.getElementById("listaPacientesDrag").innerHTML=html

}


async function carregarProfissionaisDrag(){

const {data}=await db
.from("profissionais")
.select("*")
.order("nome")

let html=""

data.forEach(p=>{

html+=`
<div class="drag-item" id="prof_${p.id}">
${p.nome}
</div>
`

})

document.getElementById("listaProfissionaisDrag").innerHTML=html

}
