/* ====================================================
050 – PDF GERAL
==================================================== */

async function gerarPDFGeral(){

const { jsPDF } = window.jspdf

const doc=new jsPDF()

doc.text("Relatório Geral de Rotinas",20,20)

const linhas=[]

ROTINAS_CACHE.forEach(r=>{

linhas.push([
r.paciente,
r.rotina,
r.turno,
r.status
])

})

doc.autoTable({

head:[["Paciente","Rotina","Turno","Status"]],
body:linhas,
startY:30

})

doc.save("relatorio_rotinas.pdf")

}

/* ====================================================
051 – PDF PACIENTE
==================================================== */

async function gerarPDFPaciente(){

const paciente=document.getElementById("buscaPaciente").value

if(!paciente || paciente==="todos"){

alert("Selecione um paciente")
return

}

const { jsPDF } = window.jspdf

const doc=new jsPDF()

doc.text("Relatório do Paciente",20,20)

const linhas=[]

ROTINAS_CACHE
.filter(r=>r.paciente_id===paciente)
.forEach(r=>{

linhas.push([
r.rotina,
r.turno,
r.status
])

})

doc.autoTable({

head:[["Rotina","Turno","Status"]],
body:linhas,
startY:30

})

doc.save("relatorio_paciente.pdf")

}
