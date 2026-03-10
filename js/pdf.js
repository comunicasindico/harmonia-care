
/* ====================================================
GERAR PDF GERAL
==================================================== */

async function gerarPDFGeral(){

const { jsPDF } = window.jspdf
const doc = new jsPDF()

doc.text("Relatório Geral",20,20)

doc.save("relatorio.pdf")

}

/* ====================================================
GERAR PDF PACIENTE
==================================================== */

async function gerarPDFPaciente(){

const { jsPDF } = window.jspdf
const doc = new jsPDF()

doc.text("Relatório Paciente",20,20)

doc.save("paciente.pdf")

}
