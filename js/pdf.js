/* ====================================================
080 – PDF PACIENTE
==================================================== */
async function gerarPDFPaciente(){
if(!db)return
const pacienteId=document.getElementById("buscaPaciente")?.value
const dataInicio=document.getElementById("dataInicio")?.value
const dataFim=document.getElementById("dataFim")?.value
if(!pacienteId||pacienteId==="todos"){alert("Selecione um paciente");return}
const {data:paciente,error}=await db.from("pacientes").select("id,nome_completo,data_nascimento,has,dm,da,cardiopatia,acamado,dieta_especial,dieta_texto,outras_comorbidades,grau_risco,pressao_arterial").eq("id",pacienteId).single()
if(error||!paciente){console.error("ERRO PACIENTE",error);alert("Erro ao carregar paciente");return}
const {data:rotinasExec}=await db.from("rotinas_execucao").select("*").eq("paciente_id",pacienteId).gte("data",dataInicio).lte("data",dataFim)
const {data:rotinasBase}=await db.from("rotina_modelos").select("id,nome")
const ICON_DIETA="data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjZjM5YzEyIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJhMTAgMTAgMCAxIDAgMCAyMCAxMCAxMCAwIDAgMCAwLTIwem0wIDE4YTggOCAwIDEgMSAwLTE2IDggOCAwIDAgMSAwIDE2em0tMS04VjZoMnY2em0wIDRoLTJ2MmgyVjE2eiIvPjwvc3ZnPg=="
const {jsPDF}=window.jspdf
const doc=new jsPDF("p","mm","a4")
let y=15
const cabecalho="Lar Geriátrico Harmonia\nTel: (81) 3461-3109"
const rodape="CNPJ 11197111000156 - Rua Doutor Manoel Benício Fontenelle, 38 - Piedade - Jaboatão dos Guararapes – PE"
doc.setFontSize(12)
doc.text(cabecalho,105,y,{align:"center"})
y+=10
doc.setFontSize(14)
doc.text("RELATÓRIO DO PACIENTE",105,y,{align:"center"})
y+=10
doc.setFillColor(240,240,240)
doc.rect(10,y-5,190,60,"F")
doc.setFontSize(10)
doc.setFont(undefined,"bold")
doc.text("DADOS CLÍNICOS DO PACIENTE",10,y)
y+=6
doc.setFont(undefined,"normal")
const dadosClinicos=[
["Paciente",paciente.nome_completo||""],
["Idade",calcularIdade(paciente.data_nascimento)],
["HAS",paciente.has?"SIM":"—"],
["Diabetes",paciente.dm?"SIM":"—"],
["Demência",paciente.da?"SIM":"—"],
["Cardiopatia",paciente.cardiopatia?"SIM":"—"],
["Acamado",paciente.acamado?"SIM":"—"],
["PA",paciente.pressao_arterial||""],
["Dieta",paciente.dieta_especial?(paciente.dieta_texto?`SIM ${paciente.dieta_texto}`:"SIM"):"NÃO","dieta"],
["Risco",paciente.grau_risco||""],
["Outras",paciente.outras_comorbidades||""]
]
dadosClinicos.forEach(d=>{
let label=d[0]
let valor=String(d[1]||"")
let tipo=d[2]||null
if(tipo==="dieta"&&paciente.dieta_especial){
doc.addImage(ICON_DIETA,"PNG",12,y-3,4,4)
doc.text(label+":",18,y)
doc.setTextColor(243,156,18)
doc.text(valor,60,y)
doc.setTextColor(0,0,0)
}else{
doc.text(label+":",12,y)
doc.text(valor,60,y)
}
y+=5
})
y+=5
if(y>250){doc.addPage();y=15}
const colunas=[
{nome:"Café",turno:"manha"},
{nome:"Medicação",turno:"manha"},
{nome:"Oferta de Água",turno:"manha"},
{nome:"Banho",turno:"manha"},
{nome:"Almoço",turno:"manha"},
{nome:"Alimentação",turno:"tarde"},
{nome:"Lanche",turno:"tarde"},
{nome:"Higiene Bucal",turno:"tarde"},
{nome:"Jantar",turno:"noite"},
{nome:"Higiene Noturna",turno:"noite"},
{nome:"Troca de Fralda",turno:"noite"}
]
let mapa={}
rotinasBase?.forEach(r=>{mapa[r.id]=r.nome})
let matriz={}
rotinasExec?.forEach(r=>{
if(!matriz[r.data])matriz[r.data]={}
const nome=(mapa[r.rotina_id]||"").trim()
if(nome){matriz[r.data][nome]=r.status}
})
doc.setFontSize(12)
doc.setFont(undefined,"bold")
doc.text("Rotinas por período",10,y)
y+=6
doc.setFontSize(6)
doc.setFont(undefined,"bold")
let x=10
doc.text("Data",x,y,{align:"center"})
x+=20
colunas.forEach(c=>{
if(c.turno==="manha")doc.setTextColor(41,128,185)
if(c.turno==="tarde")doc.setTextColor(243,156,18)
if(c.turno==="noite")doc.setTextColor(44,62,80)
let partes=c.nome.split(" ")
if(partes.length>1){
doc.text(partes[0],x,y,{align:"center"})
doc.text(partes.slice(1).join(" "),x,y+3,{align:"center"})
}else{
doc.text(c.nome,x,y,{align:"center"})
}
x+=15
})
doc.setTextColor(0,0,0)
y+=6
doc.setDrawColor(180)
doc.line(10,y,200,y)
y+=4
doc.setFont(undefined,"normal")
Object.keys(matriz).sort().forEach(data=>{
let x=10
doc.text(data,x,y)
x+=20
colunas.forEach(c=>{
let status=null
Object.keys(matriz[data]||{}).forEach(k=>{
if(k.toLowerCase().trim()===c.nome.toLowerCase()){status=matriz[data][k]}
})
if(status==="executado"){
doc.setTextColor(39,174,96)
doc.text("OK",x,y,{align:"center"})
}else{
doc.setTextColor(231,76,60)
doc.text("X",x,y,{align:"center"})
}
x+=15
})
doc.setTextColor(0,0,0)
doc.setDrawColor(230)
doc.line(10,y+2,200,y+2)
y+=6
if(y>270){doc.addPage();y=20}
})
if(y>260){doc.addPage();y=20}
doc.setFontSize(10)
doc.text(`Data da impressão: ${new Date().toLocaleDateString()}`,10,y);y+=15
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
