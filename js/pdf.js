async function carregarFonteRoboto(doc){
const response=await fetch("fonts/Roboto-Regular.ttf")
const buffer=await response.arrayBuffer()
const base64=btoa(new Uint8Array(buffer).reduce((data,byte)=>data+String.fromCharCode(byte),""))
doc.addFileToVFS("Roboto-Regular.ttf",base64)
doc.addFont("Roboto-Regular.ttf","Roboto","normal")
doc.setFont("Roboto")
}
function formatarDataBR(dataISO){
if(!dataISO)return""
const d=new Date(dataISO)
const dia=String(d.getDate()).padStart(2,"0")
const mes=String(d.getMonth()+1).padStart(2,"0")
const ano=d.getFullYear()
return`${dia}-${mes}-${ano}`
}

/* ====================================================
080 – PDF PACIENTE (PADRÃO EXATO DO PAINEL)
==================================================== */
async function gerarPDFPaciente(){
const imgDieta=new Image()
imgDieta.src="img/icone-dieta.png"
await new Promise((resolve,reject)=>{imgDieta.onload=resolve;imgDieta.onerror=reject})
if(!db)return
const pacienteId=document.getElementById("buscaPaciente")?.value
const dataInicio=document.getElementById("dataInicio")?.value
const dataFim=document.getElementById("dataFim")?.value
if(!pacienteId||pacienteId==="todos"){alert("Selecione um paciente");return}
const {data:paciente,error}=await db.from("pacientes").select("id,nome_completo,data_nascimento,has,dm,da,cardiopatia,acamado,dieta_especial,dieta_texto,outras_comorbidades,grau_risco,pressao_arterial").eq("id",pacienteId).single()
if(error||!paciente){console.error("ERRO PACIENTE",error);return}
const {data:rotinasExec}=await db.from("rotinas_execucao").select("*,rotina_modelos(nome)").eq("paciente_id",pacienteId).gte("data",dataInicio).lte("data",dataFim)
const {jsPDF}=window.jspdf
const doc=new jsPDF("p","mm","a4")
await carregarFonteRoboto(doc)
let y=15

/* CABEÇALHO */
doc.setFontSize(12)
doc.text("Lar Geriátrico Harmonia\nTel: (81) 3461-3109",105,y,{align:"center"})
y+=10
doc.setFontSize(14)
doc.setFont("Roboto","bold")
doc.text("RELATÓRIO DO PACIENTE",105,y,{align:"center"})
y+=10

/* DADOS */
doc.setFont("Roboto","normal")
doc.setFontSize(10)
doc.text(`Paciente: ${paciente.nome_completo}`,10,y);y+=5
doc.text(`Idade: ${calcularIdade(paciente.data_nascimento)}`,10,y);y+=5
doc.text(`HAS: ${paciente.has?"SIM":"—"}`,10,y);y+=5
doc.text(`Diabetes: ${paciente.dm?"SIM":"—"}`,10,y);y+=5
doc.text(`Demência: ${paciente.da?"SIM":"—"}`,10,y);y+=5
doc.text(`Cardiopatia: ${paciente.cardiopatia?"SIM":"—"}`,10,y);y+=5
doc.text(`Acamado: ${paciente.acamado?"SIM":"—"}`,10,y);y+=5
doc.text(`PA: ${paciente.pressao_arterial||""}`,10,y);y+=5

y+=5

/* COLUNAS – ORDEM EXATA DO PAINEL */
const colunas=[
"Banho",
"Higiene (manhã)",
"Troca de Fraldas (manhã)",
"Oferta de Água",
"Café",
"Medicação",
"Almoço",
"Lanche",
"Higiene (tarde)",
"Jantar",
"Higiene (noite)",
"Troca de Fraldas (noite)"
]

/* NORMALIZADOR (GARANTE MATCH PERFEITO) */
function normalizar(txt){
return (txt||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim()
}
/* MATRIZ */
let matriz={}
rotinasExec?.forEach(r=>{
if(!matriz[r.data])matriz[r.data]={}
const nome=r.rotina_modelos?.nome||""
matriz[r.data][normalizar(nome)]=r.status
})
/* TÍTULO */
doc.setFont("Roboto","bold")
doc.text("Rotinas por período",10,y)
y+=6
/* HEADER */
let x=10
doc.text("Data",x,y)
x+=20
colunas.forEach((c,i)=>{
doc.text(String(i+1),x,y)
x+=12
})
y+=5
doc.line(10,y,200,y)
y+=4

doc.setFont("Roboto","normal")
/* LINHAS */
Object.keys(matriz).sort().forEach(data=>{
let x=10
doc.text(formatarDataBR(data),x,y)
x+=20
colunas.forEach(c=>{
let status=matriz[data][normalizar(c)]
doc.text(status==="executado"?"OK":"X",x,y)
x+=12
})
y+=6
if(y>270){doc.addPage();y=20}
})
/* ====================================================
LEGENDA (UMA VEZ SÓ)
==================================================== */
y+=5
doc.setFont("Roboto","bold")
doc.text("Legenda:",10,y)
y+=5
doc.setFont("Roboto","normal")
colunas.forEach((c,i)=>{
doc.text(`${i+1} – ${c}`,10,y)
y+=4
if(y>280){doc.addPage();y=20}
})
/* ====================================================
ANÁLISE FINAL (UMA VEZ SÓ)
==================================================== */
y+=6
doc.setFont("Roboto","bold")
doc.text("Análise do paciente",10,y)
y+=6
doc.setFont("Roboto","normal")

let total=0,executado=0
Object.values(matriz).forEach(d=>{
Object.values(d).forEach(st=>{
total++
if(st==="executado")executado++
})
})

let perc=Math.round((executado/total)*100)

doc.text(`Execução geral das rotinas: ${perc}%`,10,y);y+=5
doc.text("Paciente estável, com necessidade de acompanhamento contínuo.",10,y);y+=5
/* FINAL */
y+=10
doc.text("__________________________________________",10,y)
y+=6
doc.text("Responsável Técnico",10,y)

doc.save(`Relatorio_${paciente.nome_completo}.pdf`)
}
/* ====================================================
081 – PDF GERAL
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
