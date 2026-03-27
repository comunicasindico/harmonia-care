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
080 – PDF PACIENTE (COMPLETO PROFISSIONAL FINAL)
==================================================== */
async function gerarPDFPaciente(){

if(!db)return
/* ====================================================
INPUTS
==================================================== */
const pacienteId=document.getElementById("buscaPaciente")?.value
const dataInicio=normalizarDataISO(document.getElementById("dataInicio")?.value)
const dataFim=normalizarDataISO(document.getElementById("dataFim")?.value)
const turnoAtual=(TURNO_ATUAL||"manha").toLowerCase().trim()

if(!pacienteId||pacienteId==="todos"){alert("Selecione um paciente");return}
/* ====================================================
PACIENTE
==================================================== */
const {data:paciente,error}=await db
.from("pacientes")
.select("*")
.eq("id",pacienteId)
.single()

if(error||!paciente){console.error(error);return}
/* ====================================================
EXECUÇÕES
==================================================== */
const {data:rotinasExec}=await db
.from("rotinas_execucao")
.select("*,rotina_modelos(nome)")
.eq("paciente_id",pacienteId)
.eq("turno",turnoAtual)
.gte("data",dataInicio)
.lte("data",dataFim)
/* ====================================================
ROTINAS MODELO
==================================================== */
const {data:rotinasModelo}=await db
.from("rotina_modelos")
.select("id,nome,ordem,turno")
.eq("empresa_id",EMPRESA_ID)
.eq("ativo",true)
.order("ordem",{ascending:true})
/* ====================================================
PDF BASE
==================================================== */
const {jsPDF}=window.jspdf
const doc=new jsPDF("p","mm","a4")
await carregarFonteRoboto(doc)

let y=15
/* ====================================================
HEADER
==================================================== */
doc.setFillColor(41,128,185)
doc.rect(0,0,210,18,"F")

doc.setTextColor(255,255,255)
doc.setFont("Roboto","bold")
doc.setFontSize(12)
doc.text("LAR GERIÁTRICO HARMONIA - Tel: (81) 3461-3109",105,8,{align:"center"})

doc.setFont("Roboto","normal")
doc.setFontSize(9)
doc.text("Relatório Clínico do Paciente",105,14,{align:"center"})

doc.setTextColor(0,0,0)
y=25
/* ====================================================
BOX PACIENTE
==================================================== */
doc.rect(10,y,190,40)

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
/* ====================================================
UTIL
==================================================== */
function normalizar(txt){
return (txt||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim()
}
/* ====================================================
GERAR DIAS
==================================================== */
let atual=new Date(dataInicio+"T00:00:00")
const fim=new Date(dataFim+"T00:00:00")

const dias=[]

while(atual<=fim){
dias.push(atual.toISOString().slice(0,10))
atual.setDate(atual.getDate()+1)
}
/* ====================================================
MAPA EXECUÇÕES
==================================================== */
const mapaExec=new Map()

rotinasExec?.forEach(r=>{
const nome=normalizar(r.rotina_modelos?.nome||"")
const chave=`${r.data}_${nome}`
mapaExec.set(chave,r.status)
})
/* ====================================================
COLUNAS FIXAS (12)
==================================================== */
const colunas=[
"Banho","Higiene (manhã)","Troca de Fraldas (manhã)","Oferta de Água","Café",
"Medicação","Almoço","Lanche","Higiene (tarde)",
"Jantar","Higiene (noite)","Troca de Fraldas (noite)"
]
/* ====================================================
MATRIZ COMPLETA
==================================================== */
let matriz={}

dias.forEach(dia=>{
matriz[dia]={}
colunas.forEach(c=>{
const nomeNorm=normalizar(c)
const chave=`${dia}_${nomeNorm}`
matriz[dia][nomeNorm]=mapaExec.get(chave)||"pendente"
})
})
/* ====================================================
TÍTULO
==================================================== */
doc.setFont("Roboto","bold")
doc.text("Rotinas por período",10,y)
y+=6
/* HEADER */
doc.setFillColor(52,152,219)
doc.rect(10,y-4,190,6,"F")

doc.setTextColor(255,255,255)
doc.setFontSize(8)

let x=10
doc.text("Data",x,y)
x+=22

colunas.forEach((c,i)=>{
doc.text(String(i+1),x,y,{align:"center"})
x+=12
})

doc.setTextColor(0)
y+=6
/* ====================================================
LINHAS
==================================================== */
dias.forEach((dia,index)=>{

let x=10

if(index%2===0){
doc.setFillColor(248,249,250)
doc.rect(10,y-4,190,6,"F")
}

const[dY,dM,dD]=dia.split("-")
doc.text(`${dD}/${dM}/${dY}`,x,y)
x+=22

colunas.forEach(c=>{

let status=matriz[dia][normalizar(c)]

if(status==="executado"){
doc.setFillColor(39,174,96)
doc.rect(x-4.5,y-3,9,4.5,"F")
doc.setTextColor(255,255,255)
doc.setFont("Roboto","bold")
doc.text("OK",x,y,{align:"center"})
}else{
doc.setFillColor(192,57,43)
doc.rect(x-4.5,y-3,9,4.5,"F")
doc.setTextColor(255,255,255)
doc.setFont("Roboto","bold")
doc.text("X",x,y,{align:"center"})
}

doc.setTextColor(0)
doc.setFont("Roboto","normal")
x+=12

})

y+=6

if(y>250){doc.addPage();y=20}

})
/* ====================================================
LEGENDA
==================================================== */
y+=5
doc.setFont("Roboto","bold")
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
ANÁLISE AVANÇADA (NÍVEL PROFISSIONAL)
==================================================== */
y+=8
doc.setFont("Roboto","bold")
doc.text("Análise do paciente",10,y)
y+=6

let total=0,executado=0

Object.values(matriz).forEach(d=>{
Object.values(d).forEach(st=>{
total++
if(st==="executado")executado++
})
})

let perc=total?Math.round((executado/total)*100):0

doc.text(`Execução geral das rotinas: ${perc}%`,10,y)
y+=4

doc.setFillColor(220,220,220)
doc.rect(10,y,180,5,"F")

doc.setFillColor(46,204,113)
doc.rect(10,y,180*(perc/100),5,"F")

y+=10

/* ====================================================
ANÁLISE CLÍNICA EVOLUÍDA
==================================================== */
let analise=""
let alerta=""

/* 🔹 CLASSIFICAÇÃO BASE */
if(perc>=85){
analise="Paciente com elevada adesão às rotinas, indicando estabilidade clínica e bom manejo assistencial."
}else if(perc>=60){
analise="Paciente com adesão parcial às rotinas, necessitando monitoramento contínuo."
}else{
analise="Paciente com baixa execução das rotinas, indicando risco assistencial elevado."
alerta+="⚠️ Baixa adesão às rotinas. "
}

/* 🔹 TENDÊNCIA */
const diasOrdenados=Object.keys(matriz).sort()
let execPorDia=[]

diasOrdenados.forEach(d=>{
let t=0,e=0
Object.values(matriz[d]).forEach(st=>{
t++
if(st==="executado")e++
})
execPorDia.push(t?Math.round((e/t)*100):0)
})

let tendencia="estavel"

if(execPorDia.length>=2){
const inicio=execPorDia[0]
const fim=execPorDia[execPorDia.length-1]

if(fim>inicio+10)tendencia="melhora"
else if(fim<inicio-10)tendencia="piora"
}

if(tendencia==="melhora"){
analise+=" Observa-se evolução positiva ao longo do período."
}

if(tendencia==="piora"){
analise+=" Observa-se queda na execução das rotinas."
alerta+="⚠️ Queda na qualidade do cuidado. "
}

/* 🔹 COMORBIDADES */
if(paciente.has){
analise+=" Controle rigoroso da pressão arterial é essencial."
}

if(paciente.dm){
analise+=" Monitoramento glicêmico frequente recomendado."
alerta+="⚠️ Risco metabólico. "
}

if(paciente.cardiopatia){
analise+=" Manter vigilância cardiovascular contínua."
alerta+="⚠️ Risco cardíaco. "
}

if(paciente.da){
analise+=" Necessário suporte cognitivo contínuo."
}

if(paciente.acamado){
analise+=" Alto risco de lesões por pressão, reforçar mudança de decúbito."
alerta+="⚠️ Risco de lesão por pressão. "
}

/* 🔹 PRESSÃO ARTERIAL */
if(paciente.pressao_arterial){
const pa=paciente.pressao_arterial.split("/")
if(pa.length===2){
const sist=parseInt(pa[0])
const diast=parseInt(pa[1])

if(sist>=140||diast>=90){
analise+=" Pressão arterial acima do recomendado."
alerta+="⚠️ Hipertensão não controlada. "
}else if(sist<100||diast<60){
analise+=" Pressão arterial abaixo do ideal."
alerta+="⚠️ Possível hipotensão. "
}
}
}

/* 🔹 DIETA */
if(paciente.dieta_especial){
analise+=" Dieta especial deve ser rigorosamente seguida."
}

/* 🔹 GRAU DE RISCO */
if(paciente.grau_risco>=4){
alerta+="🚨 Paciente classificado como alto risco clínico. "
}

/* 🔹 ALERTA FINAL */
if(perc<50){
alerta+="🚨 Necessária intervenção imediata da equipe. "
}

/* ====================================================
RENDER FINAL
==================================================== */
doc.setFont("Roboto","bold")
doc.text(`Classificação: ${perc>=80?"BAIXO":perc>=50?"MODERADO":"ALTO"}`,10,y)
y+=5

if(alerta){
doc.setTextColor(192,57,43)
doc.setFont("Roboto","bold")
doc.text(alerta,10,y,{maxWidth:180})
y+=6
doc.setTextColor(0,0,0)
}

doc.setFont("Roboto","normal")
doc.text(analise,10,y,{maxWidth:180})
/* ====================================================
ASSINATURA
==================================================== */
y+=12

let nomeCompleto="Sistema"
const usuarioId=localStorage.getItem("usuario_id")

if(usuarioId){
const {data:user}=await db.from("usuarios").select("nome_completo").eq("id",usuarioId).single()
if(user?.nome_completo)nomeCompleto=user.nome_completo
}

doc.text("Responsável Técnico:",10,y)
y+=5
doc.text(nomeCompleto,10,y)

doc.line(10,y+3,80,y+3)
/* ====================================================
RODAPÉ
==================================================== */
const totalPages=doc.getNumberOfPages()

for(let i=1;i<=totalPages;i++){
doc.setPage(i)
doc.setFontSize(8)
doc.setTextColor(120)
doc.text(`Página ${i}/${totalPages}`,200,290,{align:"right"})
}

doc.setTextColor(0)
doc.text(`Gerado em: ${new Date().toLocaleString()}`,10,290)
/* ====================================================
SAVE
==================================================== */
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
