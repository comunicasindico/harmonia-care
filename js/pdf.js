async function gerarPDFGeral(){

const { jsPDF } = window.jspdf

const doc = new jsPDF()

doc.text("Relatório Geral de Rotinas",20,20)

doc.save("relatorio.pdf")

}

async function gerarPDFPaciente(){

const { jsPDF } = window.jspdf

const doc = new jsPDF()

doc.text("Relatório do Paciente",20,20)

doc.save("paciente.pdf")

}
