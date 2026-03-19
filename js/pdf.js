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
081 – PDF PACIENTE (SUPREMO TCE)
==================================================== */
async function gerarPDFPaciente(){
if(!db)return
const pacienteId=document.getElementById("buscaPaciente")?.value
const dataInicio=document.getElementById("dataInicio")?.value
const dataFim=document.getElementById("dataFim")?.value
if(!pacienteId||pacienteId==="todos"){alert("Selecione um paciente");return}
const {data:paciente}=await db.from("pacientes").select("*").eq("id",pacienteId).single()
const {data:rotinasExec}=await db.from("rotinas_execucao").select("*").eq("paciente_id",pacienteId).gte("data",dataInicio).lte("data",dataFim)
const {data:rotinasBase}=await db.from("rotinas").select("id,nome")
const {jsPDF}=window.jspdf
const doc=new jsPDF("p","mm","a4")
let y=15
const cabecalho="Lar Geriátrico Harmonia\nTel: (81) 3461-3109"
const rodape="CNPJ 11197111000156 - Rua Doutor Manoel Benício Fontenelle, 38 - Piedade - Jaboatão dos Guararapes – PE"
/* CABEÇALHO */
doc.setFontSize(12)
doc.text(cabecalho,105,y,{align:"center"})
y+=10
doc.setFontSize(14)
doc.text("RELATÓRIO DO PACIENTE",105,y,{align:"center"})
y+=10
/* DADOS PACIENTE */
doc.setFontSize(10)
doc.text(`Paciente: ${paciente.nome_completo||""}`,10,y);y+=6
doc.text(`Idade: ${paciente.idade||""}`,10,y);y+=6
doc.text(`HAS: ${paciente.has?"SIM":"—"}`,10,y);y+=6
doc.text(`Diabetes: ${paciente.dm?"SIM":"—"}`,10,y);y+=6
doc.text(`Demência: ${paciente.demencia?"SIM":"—"}`,10,y);y+=6
doc.text(`Cardiopatia: ${paciente.cardio?"SIM":"—"}`,10,y);y+=6
doc.text(`Acamado: ${paciente.acamado?"SIM":"—"}`,10,y);y+=6
doc.text(`PA: ${paciente.pa||""}`,10,y);y+=6
doc.text(`Dieta: ${paciente.dieta||""}`,10,y);y+=6
doc.text(`Risco: ${paciente.risco||""}`,10,y);y+=6
doc.text(`Outras: ${paciente.outras||""}`,10,y);y+=10
if(y>250){doc.addPage();y=15}
/* MATRIZ DE ROTINAS */
const colunas=["Almoço","Troca de Fralda (noite)","Lanche","Higiene (tarde)","Alimentação","Banho","Café","Higiene Bucal","Medicação","Oferta de Água","Jantar","Higiene Noturna (noite)"]
let mapa={}
rotinasBase?.forEach(r=>{mapa[r.id]=r.nome})
let matriz={}
rotinasExec?.forEach(r=>{
if(!matriz[r.data])matriz[r.data]={}
const nome=mapa[r.rotina_id]
if(nome)matriz[r.data][nome]=r.status
})
let body=[]
Object.keys(matriz).sort().forEach(data=>{
let linha=[data]
colunas.forEach(col=>{
const status=matriz[data][col]
if(status==="executado")linha.push("✔")
else linha.push("✖")
})
body.push(linha)
})
doc.autoTable({
startY:y,
head:[["Data",...colunas]],
body:body,
styles:{fontSize:7,halign:"center"},
headStyles:{fillColor:[52,152,219]},
didParseCell:function(d){
if(d.row.section==="body"&&d.column.index>0){
if(d.cell.raw==="✔"){d.cell.styles.textColor=[39,174,96]}
if(d.cell.raw==="✖"){d.cell.styles.textColor=[231,76,60]}
}
},
didDrawPage:function(){
doc.setFontSize(8)
doc.text(rodape,105,290,{align:"center"})
}
})
y=doc.lastAutoTable.finalY+15
if(y>260){doc.addPage();y=20}
/* ASSINATURA */
doc.setFontSize(10)
doc.text(`Data da impressão: ${new Date().toLocaleDateString()}`,10,y);y+=15
doc.text("__________________________________________",10,y)
y+=6
doc.text("Responsável Técnico",10,y)
doc.save(`Relatorio_${paciente.nome_completo}.pdf`)
}
