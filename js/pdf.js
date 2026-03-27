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
080 – PDF PACIENTE (CORREÇÃO DEFINITIVA)
==================================================== */
async function gerarPDFPaciente(){
const imgDieta=new Image()
imgDieta.src="img/icone-dieta.png"
await new Promise((resolve,reject)=>{imgDieta.onload=resolve;imgDieta.onerror=reject})
if(!db)return
const pacienteId=document.getElementById("buscaPaciente")?.value
const dataInicio=normalizarDataISO(document.getElementById("dataInicio")?.value)
const dataFim=normalizarDataISO(document.getElementById("dataFim")?.value)
const turno=(TURNO_ATUAL||"manha").toLowerCase().trim()
if(!pacienteId||pacienteId==="todos"){alert("Selecione um paciente");return}
const {data:paciente,error}=await db.from("pacientes").select("id,nome_completo,data_nascimento,has,dm,da,cardiopatia,acamado,dieta_especial,dieta_texto,outras_comorbidades,grau_risco,pressao_arterial").eq("id",pacienteId).single()
if(error||!paciente){console.error("ERRO PACIENTE",error);return}
const {data:rotinasExec}=await db.from("rotinas_execucao").select("*,rotina_modelos(nome)").eq("paciente_id",pacienteId).eq("turno",turno).gte("data",dataInicio).lte("data",dataFim)
const {jsPDF}=window.jspdf
const doc=new jsPDF("p","mm","a4")
await carregarFonteRoboto(doc)
let y=15
try{
const imgLogo=new Image()
imgLogo.src=window.location.origin+"/harmonia-care/logo-harmonia.png"
await new Promise((res)=>{imgLogo.onload=res;imgLogo.onerror=res})
doc.addImage(imgLogo,"PNG",10,5,25,10)
}catch(e){}
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
const colunas=["Banho","Higiene (manhã)","Troca de Fraldas (manhã)","Oferta de Água","Café","Medicação","Almoço","Lanche","Higiene (tarde)","Jantar","Higiene (noite)","Troca de Fraldas (noite)"]
function normalizar(txt){return (txt||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim()}
let matriz={}
rotinasExec?.forEach(r=>{
if(!matriz[r.data])matriz[r.data]={}
const nome=r.rotina_modelos?.nome||""
matriz[r.data][normalizar(nome)]=r.status
})
let[anoI,mesI,diaI]=dataInicio.split("-")
let[anoF,mesF,diaF]=dataFim.split("-")
let atual=new Date(parseInt(anoI),parseInt(mesI)-1,parseInt(diaI))
const fim=new Date(parseInt(anoF),parseInt(mesF)-1,parseInt(diaF))
const dias=[]
while(atual<=fim){
const yv=atual.getFullYear()
const mv=String(atual.getMonth()+1).padStart(2,"0")
const dv=String(atual.getDate()).padStart(2,"0")
dias.push(`${yv}-${mv}-${dv}`)
atual.setDate(atual.getDate()+1)
}
doc.setFont("Roboto","bold")
doc.text("Rotinas por período",10,y)
y+=6
doc.setFillColor(52,152,219)
doc.rect(10,y-4,190,6,"F")
doc.setTextColor(255,255,255)
doc.setFont("Roboto","bold")
doc.setFontSize(8)
let x=10
doc.text("Data",x,y)
x+=22
colunas.forEach((c,i)=>{doc.text(String(i+1),x,y,{align:"center"});x+=12})
doc.setTextColor(0,0,0)
y+=6
dias.forEach((dia,index)=>{
let x=10
if(index%2===0){doc.setFillColor(248,249,250);doc.rect(10,y-4,190,6,"F")}
const[dY,dM,dD]=dia.split("-")
doc.text(`${dD}/${dM}/${dY}`,x,y)
x+=22
colunas.forEach(c=>{
let status=(matriz[dia]||{})[normalizar(c)]
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
y+=5
doc.setFont("Roboto","bold")
doc.setFontSize(9)
doc.text("Legenda:",10,y)
y+=5
doc.setFont("Roboto","normal")
doc.setFontSize(8)
const legenda=["1–Banho","2–Hig.(manhã)","3–Fraldas(manhã)","4–Água","5–Café","6–Medicação","7–Almoço","8–Lanche","9–Hig.(tarde)","10–Jantar","11–Hig.(noite)","12–Fraldas(noite)"]
let lx=10,cont=0
legenda.forEach(item=>{
doc.text(item,lx,y)
lx+=45
cont++
if(cont===4){y+=5;lx=10;cont=0}
})
y+=8
doc.setFont("Roboto","bold")
doc.text("Análise do paciente",10,y)
y+=6
doc.setFont("Roboto","normal")
let total=0,executado=0
Object.values(matriz).forEach(d=>{Object.values(d).forEach(st=>{total++;if(st==="executado")executado++})})
let perc=total?Math.round((executado/total)*100):0
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
let analiseTexto=""
if(perc>=90){
analiseTexto="Paciente com excelente adesão às rotinas, indicando estabilidade clínica e manutenção adequada dos cuidados."
}else if(perc>=70){
analiseTexto="Paciente com boa adesão às rotinas, apresentando evolução satisfatória, com necessidade de monitoramento contínuo."
}else if(perc>=40){
analiseTexto="Paciente com adesão parcial às rotinas, sugerindo necessidade de reforço na assistência e acompanhamento mais rigoroso."
}else{
analiseTexto="Paciente com baixa execução das rotinas, indicando risco assistencial e necessidade de intervenção imediata."
}
if(paciente.has){
analiseTexto+=" Atenção ao controle da pressão arterial."
}
if(paciente.dm){
analiseTexto+=" Recomenda-se monitoramento glicêmico regular."
}
if(paciente.cardiopatia){
analiseTexto+=" Manter vigilância cardiovascular contínua."
}
if(paciente.da){
analiseTexto+=" Necessita acompanhamento cognitivo e suporte neurológico."
}
if(paciente.acamado){
analiseTexto+=" Paciente acamado, reforçar prevenção de lesões por pressão."
}
if(paciente.dieta_especial){
analiseTexto+=" Seguir rigorosamente a dieta prescrita."
}
if(paciente.pressao_arterial){
const pa=paciente.pressao_arterial.split("/")
if(pa.length===2){
const sist=parseInt(pa[0])
const diast=parseInt(pa[1])
if(sist>=140||diast>=90){
analiseTexto+=" Pressão arterial acima do ideal, recomenda-se avaliação clínica."
}
}
}
doc.setFontSize(9)
doc.setFont("Roboto","normal")
doc.text(analiseTexto,10,y,{maxWidth:180})
y+=12
doc.text("__________________________________________",10,y)
y+=6
const qrData=`Paciente:${paciente.nome_completo}\nPeriodo:${dataInicio} a ${dataFim}`
const qrCanvas=document.createElement("canvas")
await QRCode.toCanvas(qrCanvas,qrData,{width:80})
const qrImg=qrCanvas.toDataURL("image/png")
doc.addImage(qrImg,"PNG",170,y-10,25,25)
const totalPages=doc.getNumberOfPages()
for(let i=1;i<=totalPages;i++){
doc.setPage(i)
doc.setFontSize(8)
doc.setTextColor(120)
doc.text(`Relatório Clínico - Lar Harmonia | Página ${i}/${totalPages}`,200,290,{align:"right"})
}
doc.setTextColor(0)
doc.save(`Relatorio_${paciente.nome_completo}.pdf`)
}
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
/* NUMERAÇÃO DE PÁGINAS */
const totalPages=doc.getNumberOfPages()
for(let i=1;i<=totalPages;i++){
doc.setPage(i)
doc.setFontSize(8)
doc.setTextColor(120)
doc.text(`Relatório Clínico do Lar Harmonia | Página ${i}/${totalPages}`,200,290,{align:"right"})}
doc.setTextColor(0)
doc.save("relatorio_rotinas.pdf")
}
