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
081 – PDF PACIENTE
==================================================== */
async function gerarPDFPaciente(){
if(!db)return
const pacienteId=document.getElementById("buscaPaciente")?.value
const dataInicio=document.getElementById("dataInicio")?.value
const dataFim=document.getElementById("dataFim")?.value
if(!pacienteId||pacienteId==="todos"){alert("Selecione um paciente");return}
const {data:paciente}=await db.from("pacientes").select("*").eq("id",pacienteId).single()
console.log("PACIENTE >>>",paciente)
const {data:rotinasExec}=await db.from("rotinas_execucao").select("*").eq("paciente_id",pacienteId).gte("data",dataInicio).lte("data",dataFim)
const {data:rotinasBase}=await db.from("rotina_modelos").select("id,nome")
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
/* DADOS CLÍNICOS (BOX PROFISSIONAL) */
doc.setFillColor(240,240,240)
doc.rect(10,y-5,190,60,"F")
doc.setFontSize(10)
doc.setFont(undefined,"bold")
doc.text("DADOS CLÍNICOS DO PACIENTE",10,y)
y+=6
doc.setFont(undefined,"normal")
const dadosClinicos=[
["Paciente",paciente.nome_completo||""],
["Idade",paciente.idade||""],
["HAS",paciente.has?"SIM":"—"],
["Diabetes",paciente.dm?"SIM":"—"],
["Demência",paciente.demencia?"SIM":"—"],
["Cardiopatia",paciente.cardio?"SIM":"—"],
["Acamado",paciente.acamado?"SIM":"—"],
["PA",paciente.pa||""],
["Dieta",paciente.dieta||""],
["Risco",paciente.risco||""],
["Outras",(paciente.outras_comorbidades||paciente.comorbidades||paciente.outras_comorbidades||"")]
]
dadosClinicos.forEach(d=>{
doc.text(`${d[0]}:`,12,y)
doc.text(String(d[1]||""),60,y)
y+=5
})
y+=5
if(y>250){doc.addPage();y=15}
/* ===============================
MATRIZ VISUAL (PADRÃO TELA)
=============================== */
const colunas=[
"Café","Cafe",
"Medicação","Medicacao",
"Oferta de Água","Oferta de agua",
"Banho",
"Almoço","Almoco",
"Alimentação","Alimentacao",
"Lanche",
"Jantar",
"Higiene Noturna (noite)","Higiene noturna",
"Higiene Bucal","Higiene bucal",
"Higiene (tarde)",
"Troca de Fralda (noite)","Troca de fralda"
]
let mapa={}
rotinasBase?.forEach(r=>{mapa[r.id]=r.nome})

let matriz={}
rotinasExec?.forEach(r=>{
if(!matriz[r.data])matriz[r.data]={}
const nome=(mapa[r.rotina_id]||"").trim()
if(nome){
matriz[r.data][nome]=r.status
}
})

/* TÍTULO */
doc.setFontSize(12)
doc.setFont(undefined,"bold")
doc.text("Rotinas por período",10,y)
y+=6

doc.setFontSize(7)
doc.setFont(undefined,"bold")

/* HEADER */
let x=10
doc.text("Data",x,y)
x+=22

colunas.forEach(col=>{
doc.text(col.substring(0,10),x,y)
x+=14
})

y+=4

/* LINHA HEADER */
doc.setDrawColor(180)
doc.line(10,y,200,y)
y+=4

doc.setFont(undefined,"normal")

/* LINHAS */
Object.keys(matriz).sort().forEach(data=>{

let x=10

/* DATA */
doc.text(data,x,y)
x+=22

colunas.forEach(col=>{
let status=null
Object.keys(matriz[data]||{}).forEach(k=>{
if(k.toLowerCase().includes(col.toLowerCase())){
status=matriz[data][k]
}
})
if(status==="executado"){
doc.setTextColor(39,174,96)
doc.text("OK",x,y)
}else{
doc.setTextColor(231,76,60)
doc.text("X",x,y)
}
x+=14
})

doc.setTextColor(0,0,0)

/* linha separadora */
doc.setDrawColor(230)
doc.line(10,y+2,200,y+2)

y+=6

if(y>270){
doc.addPage()
y=20
}
})
if(y>260){doc.addPage();y=20}
/* ASSINATURA */
doc.setFontSize(10)
doc.text(`Data da impressão: ${new Date().toLocaleDateString()}`,10,y);y+=15
doc.text("__________________________________________",10,y)
y+=6
doc.text("Responsável Técnico",10,y)
doc.save(`Relatorio_${paciente.nome_completo}.pdf`)
}
