async function carregarFonteRoboto(doc){
const normal=await fetch("fonts/Roboto-Regular.ttf")
const bold=await fetch("fonts/Roboto-Bold.ttf")
const bufferNormal=await normal.arrayBuffer()
const bufferBold=await bold.arrayBuffer()
const base64Normal=btoa(new Uint8Array(bufferNormal).reduce((d,b)=>d+String.fromCharCode(b),""))
const base64Bold=btoa(new Uint8Array(bufferBold).reduce((d,b)=>d+String.fromCharCode(b),""))
doc.addFileToVFS("Roboto-Regular.ttf",base64Normal)
doc.addFont("Roboto-Regular.ttf","Roboto","normal")
doc.addFileToVFS("Roboto-Bold.ttf",base64Bold)
doc.addFont("Roboto-Bold.ttf","Roboto","bold")
doc.setFont("Roboto","normal")
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
/* LOGO */
const imgLogo=new Image()
imgLogo.src="img/logo-harmonia.png"
await new Promise((res,rej)=>{imgLogo.onload=res;imgLogo.onerror=rej})
doc.addImage(imgLogo,"PNG",10,5,25,10)
/* HEADER AZUL */
doc.setFillColor(41,128,185)
doc.rect(0,0,210,18,"F")
doc.setTextColor(255,255,255)
doc.setFontSize(12)
doc.setFont("Roboto","bold")
doc.text(["LAR GERIÁTRICO HARMONIA - Tel: (81) 3461-3109"],105,8,{align:"center"})
doc.setFontSize(9)
doc.setFont("Roboto","normal")
doc.text("Relatório Clínico do Paciente",105,14,{align:"center"})
doc.setTextColor(0,0,0)
y=25
/* BOX DADOS */
doc.setDrawColor(200)
doc.rect(10,y,190,40)

doc.setFontSize(9)
let dy=y+6

doc.text(`Paciente: ${paciente.nome_completo}`,12,dy)
doc.text(`Idade: ${calcularIdade(paciente.data_nascimento)}`,120,dy)

dy+=5
doc.text(`HAS: ${paciente.has?"SIM":"—"}`,12,dy)
doc.text(`Diabetes: ${paciente.dm?"SIM":"—"}`,60,dy)
doc.text(`Demência: ${paciente.da?"SIM":"—"}`,120,dy)

dy+=5
doc.text(`Cardiopatia: ${paciente.cardiopatia?"SIM":"—"}`,12,dy)
doc.text(`Acamado: ${paciente.acamado?"SIM":"—"}`,80,dy)
doc.text(`PA: ${paciente.pressao_arterial||""}`,140,dy)

dy+=5
doc.text(`Dieta: ${paciente.dieta_especial?"SIM - "+(paciente.dieta_texto||""):"NÃO"}`,12,dy)
doc.text(`Risco: ${paciente.grau_risco||"—"}`,120,dy)

dy+=5
doc.text(`Comorbidades: ${paciente.outras_comorbidades||"—"}`,12,dy)

y+=45
/* COLUNAS */
const colunas=["Banho","Higiene (manhã)","Troca de Fraldas (manhã)","Oferta de Água","Café","Medicação","Almoço","Lanche","Higiene (tarde)","Jantar","Higiene (noite)","Troca de Fraldas (noite)"]
function normalizar(txt){return (txt||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim()}
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
/* HEADER TABELA */
doc.setFillColor(52,152,219)
doc.rect(10,y-4,190,6,"F")
doc.setTextColor(255,255,255)
doc.setFont("Roboto","bold")
doc.setFontSize(8)
let x=10
doc.text("Data",x,y)
x+=22
colunas.forEach((c,i)=>{
doc.text(String(i+1),x,y,{align:"center"})
x+=12
})
doc.setTextColor(0,0,0)
y+=6
/* LINHAS DASHBOARD */
Object.keys(matriz).sort().forEach((data,index)=>{
let x=10
if(index%2===0){
doc.setFillColor(248,249,250)
doc.rect(10,y-4,190,6,"F")
}
doc.setTextColor(0,0,0)
doc.text(formatarDataBR(data),x,y)
x+=22
colunas.forEach(c=>{
let status=matriz[data][normalizar(c)]
const largura=9
const altura=4.5
if(status==="executado"){
doc.setFillColor(39,174,96)
doc.rect(x-4.5,y-3,largura,altura,"F")
doc.setTextColor(255,255,255)
doc.setFont("Roboto","bold")
doc.text("OK",x,y,{align:"center"})
}else{
doc.setFillColor(192,57,43)
doc.rect(x-4.5,y-3,largura,altura,"F")
doc.setTextColor(255,255,255)
doc.setFont("Roboto","bold")
doc.text("X",x,y,{align:"center"})
}
doc.setTextColor(0,0,0)
doc.setFont("Roboto","normal")
x+=12
})
y+=6
if(y>270){doc.addPage();y=20}
})
doc.setTextColor(0,0,0)
/* ====================================================
LEGENDA COMPACTA PROFISSIONAL
==================================================== */
y+=5
doc.setFont("Roboto","bold")
doc.setFontSize(9)
doc.text("Legenda:",10,y)
y+=5
doc.setFont("Roboto","normal")
doc.setFontSize(8)
const legenda=[
"1–Banho","2–Hig.(manhã)","3–Fraldas(manhã)","4–Água",
"5–Café","6–Medicação","7–Almoço","8–Lanche",
"9–Hig.(tarde)","10–Jantar","11–Hig.(noite)","12–Fraldas(noite)"
]
let lx=10,cont=0
legenda.forEach(item=>{
doc.text(item,lx,y)
lx+=45
cont++
if(cont===4){y+=5;lx=10;cont=0}
})
/* ====================================================
ANÁLISE FINAL + BARRA VISUAL
==================================================== */
y+=8
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
doc.text(`Execução geral das rotinas: ${perc}%`,10,y)
y+=4
const larguraBarra=180
const progresso=(perc||0)/100
doc.setFillColor(220,220,220)
doc.rect(10,y,larguraBarra,5,"F")
doc.setFillColor(46,204,113)
doc.rect(10,y,larguraBarra*progresso,5,"F")
doc.setFontSize(8)
doc.text(`${perc}%`,95,y+4,{align:"center"})
y+=10
doc.text("Paciente estável, com necessidade de acompanhamento contínuo.",10,y)
/* FINAL */
y+=10
doc.text("__________________________________________",10,y)
y+=6
/* QR CODE */
const qrData=`Paciente:${paciente.nome_completo}\nPeriodo:${dataInicio} a ${dataFim}`
const qrCanvas=document.createElement("canvas")
await QRCode.toCanvas(qrCanvas,qrData,{width:80})
const qrImg=qrCanvas.toDataURL("image/png")
doc.addImage(qrImg,"PNG",170,y-10,25,25)
doc.save(`Relatorio_${paciente.nome_completo}.pdf`)
/* ASSINATURA DIGITAL */
const usuario=obterUsuarioLogado?obterUsuarioLogado():{nome:"Sistema"}
doc.setFont("Roboto","bold")
doc.text("Responsável Técnico:",10,y)
y+=5
doc.setFont("Roboto","normal")
doc.text(usuario.nome||"—",10,y)
y+=5
doc.setDrawColor(0)
doc.line(10,y,80,y)
y+=4
doc.setFontSize(8)
doc.text("Assinatura digital",10,y)
doc.text(`Gerado em: ${new Date().toLocaleString()}`,140,290)
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
