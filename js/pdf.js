/* ====================================================
080 – PDF GERAL
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
081 – GERAR PDF POR PACIENTE (A4 PROFISSIONAL)
==================================================== */
async function gerarPDFPaciente(){

if(!db)return

const pacienteId=document.getElementById("buscaPaciente")?.value
if(!pacienteId || pacienteId==="todos"){
alert("Selecione um paciente")
return
}
const dataInicio=document.getElementById("dataInicio")?.value
const dataFim=document.getElementById("dataFim")?.value
const { jsPDF } = window.jspdf
const doc = new jsPDF("p","mm","a4")
/* ===============================
EMPRESA
=============================== */
const empresaTitulo="Lar Geriátrico Harmonia"
const empresaTel="Tel: (81) 3461-3109"
const rodape="CNPJ 11197111000156 - Rua Doutor Manoel Benício Fontenelle, 38 - Piedade - Jaboatão dos Guararapes – PE"
/* ===============================
PACIENTE
=============================== */
const {data:paciente}=await db
.from("pacientes")
.select("*")
.eq("id",pacienteId)
.single()
/* ===============================
CLÍNICO
=============================== */
const {data:clinico}=await db
.from("clinico")
.select("*")
.eq("paciente_id",pacienteId)
.maybeSingle()
/* ===============================
ROTINAS
=============================== */
const {data:rotinas}=await db
.from("rotinas_execucao")
.select("*")
.eq("paciente_id",pacienteId)
.gte("data",dataInicio)
.lte("data",dataFim)
.order("data",{ascending:true})

/* ===============================
CABEÇALHO
=============================== */
let y=10
doc.setFontSize(12)
doc.text(empresaTitulo,105,y,{align:"center"})
y+=5
doc.text(empresaTel,105,y,{align:"center"})
y+=10
/* ===============================
DADOS PACIENTE
=============================== */
doc.setFontSize(11)
doc.text(`Paciente: ${paciente.nome_completo||""}`,10,y)
y+=6
doc.text(`Período: ${dataInicio} até ${dataFim}`,10,y)
y+=6
/* ===============================
COMORBIDADES
=============================== */
let comorbidades=[]
if(clinico){
if(clinico.has)comorbidades.push("HAS")
if(clinico.dm)comorbidades.push("DM")
if(clinico.demencia)comorbidades.push("Demência")
if(clinico.cardio)comorbidades.push("Cardio")
if(clinico.acamado)comorbidades.push("Acamado")
}
doc.text(`Comorbidades: ${comorbidades.join(", ")||"Nenhuma"}`,10,y)
y+=10
/* ===============================
TABELA ROTINAS
=============================== */
let linhas=[]
rotinas?.forEach(r=>{
linhas.push([
r.data||"",
r.rotina_id||"",
r.status||"",
r.profissional_nome||""
])
})
doc.autoTable({
startY:y,
head:[["Data","Rotina","Status","Profissional"]],
body:linhas,
styles:{fontSize:9},
headStyles:{fillColor:[41,128,185]},
didDrawPage:function(data){

/* RODAPÉ */
doc.setFontSize(8)
doc.text(rodape,105,290,{align:"center"})
}
})
y=doc.lastAutoTable.finalY+10
/* ===============================
ASSINATURA
=============================== */
if(y>260){
doc.addPage()
y=20
}
doc.text(`Data de impressão: ${new Date().toLocaleDateString()}`,10,y)
y+=15
doc.text("__________________________________________",10,y)
y+=6
doc.text("Responsável - Lar Geriátrico Harmonia",10,y)
/* ===============================
SALVAR
=============================== */
doc.save(`Paciente_${paciente.nome_completo}.pdf`)
}
