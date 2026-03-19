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
081 – PDF SUPREMO PACIENTE (PRONTUÁRIO COMPLETO)
==================================================== */
async function gerarPDFPaciente(){
if(!db)return
const pacienteId=document.getElementById("buscaPaciente")?.value
if(!pacienteId||pacienteId==="todos"){alert("Selecione um paciente");return}
const dataInicio=document.getElementById("dataInicio")?.value
const dataFim=document.getElementById("dataFim")?.value
const {jsPDF}=window.jspdf
const doc=new jsPDF("p","mm","a4")
const empresa="Lar Geriátrico Harmonia"
const tel="Tel: (81) 3461-3109"
const rodape="CNPJ 11197111000156 - Rua Doutor Manoel Benício Fontenelle, 38 - Piedade - Jaboatão dos Guararapes – PE"

/* ===============================
DADOS
=============================== */
const {data:paciente}=await db.from("pacientes").select("*").eq("id",pacienteId).single()
const {data:clinico}=await db.from("clinico").select("*").eq("paciente_id",pacienteId).maybeSingle()
const {data:rotinasExec}=await db.from("rotinas_execucao").select("*").eq("paciente_id",pacienteId).gte("data",dataInicio).lte("data",dataFim).order("data",{ascending:true})
const {data:rotinasBase}=await db.from("rotinas").select("id,nome")

let mapaRotinas={}
rotinasBase?.forEach(r=>{mapaRotinas[r.id]=r.nome})

/* ===============================
CABEÇALHO
=============================== */
let y=10
doc.setFontSize(12)
doc.text(empresa,105,y,{align:"center"})
y+=5
doc.text(tel,105,y,{align:"center"})
y+=8
doc.setFontSize(14)
doc.text("PRONTUÁRIO DO PACIENTE",105,y,{align:"center"})
y+=10

/* ===============================
PACIENTE
=============================== */
doc.setFontSize(11)
doc.text(`Paciente: ${paciente?.nome_completo||""}`,10,y)
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
y+=6

/* ===============================
DIETA + RISCO
=============================== */
doc.text(`Dieta: ${clinico?.dieta||"---"}`,10,y)
y+=6
doc.text(`Risco Clínico: ${clinico?.risco||"---"}`,10,y)
y+=10

/* ===============================
RESUMO EXECUTIVO
=============================== */
let total=rotinasExec?.length||0
let executadas=rotinasExec?.filter(r=>r.status==="executado").length||0
let pendentes=total-executadas
let percentual=total?Math.round((executadas/total)*100):0

doc.setFontSize(12)
doc.text("Resumo",10,y)
y+=6
doc.setFontSize(10)
doc.text(`Total: ${total} | Executadas: ${executadas} | Pendentes: ${pendentes} | Execução: ${percentual}%`,10,y)
y+=8

/* ===============================
AGRUPAMENTO POR DATA
=============================== */
let agrupado={}
rotinasExec?.forEach(r=>{
if(!agrupado[r.data])agrupado[r.data]=[]
agrupado[r.data].push(r)
})

Object.keys(agrupado).forEach(data=>{
let linhas=[]
agrupado[data].forEach(r=>{
linhas.push([
mapaRotinas[r.rotina_id]||"---",
r.turno||"",
r.status||"",
r.profissional_nome||""
])
})

doc.setFontSize(11)
doc.text(`Data: ${data}`,10,y)
y+=2

doc.autoTable({
startY:y,
head:[["Rotina","Turno","Status","Profissional"]],
body:linhas,
styles:{fontSize:9},
didParseCell:function(d){
if(d.column.index===2){
if(d.cell.raw==="executado")d.cell.styles.textColor=[39,174,96]
if(d.cell.raw==="pendente")d.cell.styles.textColor=[231,76,60]
}
},
didDrawPage:function(){
doc.setFontSize(8)
doc.text(rodape,105,290,{align:"center"})
}
})

y=doc.lastAutoTable.finalY+6
if(y>260){doc.addPage();y=20}
})

/* ===============================
ASSINATURA
=============================== */
doc.setFontSize(11)
doc.text(`Data de impressão: ${new Date().toLocaleDateString()}`,10,y)
y+=15
doc.text("__________________________________________",10,y)
y+=6
doc.text("Responsável - Lar Geriátrico Harmonia",10,y)

/* ===============================
SALVAR
=============================== */
doc.save(`Prontuario_${paciente?.nome_completo||"Paciente"}.pdf`)
}
