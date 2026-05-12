/* ====================================================
080 – NORMALIZAR TEXTO
==================================================== */
function normalizar(txt){
return(txt||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim()
}
/* ====================================================
081 – FORMATAR DATA BR
==================================================== */
function formatarDataBR(dataISO){
if(!dataISO)return""
const d=new Date(dataISO)
const dia=String(d.getDate()).padStart(2,"0")
const mes=String(d.getMonth()+1).padStart(2,"0")
const ano=d.getFullYear()
return`${dia}-${mes}-${ano}`
}
/* ====================================================
082 – CARREGAR FONTE ROBOTO
==================================================== */
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
/* ====================================================
083 – GERAR ANÁLISE CLÍNICA
==================================================== */
function gerarAnaliseClinica(p){

if(!p)return[]

let analise=[]

if(p.has){
analise.push("Hipertensão: Monitorar PA diariamente, evitar picos >140/90, reduzir sódio e manter medicação regular.")
}

if(p.dm){
analise.push("Diabetes: Controle rigoroso de glicemia, atenção a hipoglicemia, fracionar alimentação e evitar açúcares simples.")
}

if(p.da||p.demencia){
analise.push("Demência: Manter ambiente seguro, evitar quedas, orientar equipe para reorientação frequente e supervisão contínua.")
}

if(p.cardiopatia||p.cardio){
analise.push("Cardiopatia: Observar sinais de dispneia, edema e fadiga. Evitar esforços e monitorar sinais vitais.")
}

if(p.acamado||p.restrito_leito){
analise.push("Paciente acamado: Realizar mudança de decúbito a cada 2h, prevenir lesão por pressão e manter hidratação adequada.")
}

let dieta=(p.dieta_texto||"Livre").toLowerCase()

if(dieta.includes("hipossodica")){
analise.push("Dieta hipossódica: Controle rigoroso de sódio para evitar sobrecarga cardiovascular.")
}else if(dieta.includes("diabetica")){
analise.push("Dieta diabética: Evitar picos glicêmicos, alimentação balanceada e controle de carboidratos.")
}else if(dieta.includes("pastosa")){
analise.push("Dieta pastosa: Atenção ao risco de broncoaspiração. Alimentação assistida.")
}else if(dieta.includes("liquida")){
analise.push("Dieta líquida: Monitorar ingestão calórica e risco de desnutrição.")
}else if(dieta.includes("vegetariana")){
analise.push("Dieta vegetariana: Garantir aporte proteico adequado.")
}else{
analise.push("Dieta livre: Manter equilíbrio alimentar e monitoramento nutricional.")
}

if(p.pressao_arterial){
let v=p.pressao_arterial.split("/")
let s=parseInt(v[0])||0
let d=parseInt(v[1])||0

if(s>=160||d>=100){
analise.push("Pressão arterial elevada: risco aumentado. Monitoramento intensivo necessário.")
}
}

if(p.outras_comorbidades){

let txt=normalizar(p.outras_comorbidades)

if(txt.includes("avc")){
analise.push("Histórico de AVC: atenção à mobilidade, fala e risco de nova ocorrência.")
}

if(txt.includes("alzheimer")){
analise.push("Alzheimer: acompanhamento cognitivo contínuo e supervisão integral.")
}

if(txt.includes("depressao")){
analise.push("Depressão: observar comportamento, apatia e adesão ao tratamento.")
}

if(txt.includes("fratura")){
analise.push("Histórico de fratura: alto risco de queda. Redobrar segurança.")
}

if(txt.includes("glaucoma")){
analise.push("Glaucoma: atenção à visão e risco de acidentes.")
}

}

if((p.grau_risco||0)>=4){
analise.push("Paciente de ALTO RISCO: exige acompanhamento intensivo da equipe.")
}else if((p.grau_risco||0)===3){
analise.push("Paciente com risco moderado: requer atenção contínua.")
}else{
analise.push("Paciente estável dentro do quadro clínico atual.")
}

return analise

}
/* ====================================================
084 – PDF PACIENTE
==================================================== */
async function gerarPDFPaciente(){

if(!db)return

const selectEnf=document.getElementById("buscaPaciente")
const selectMed=document.getElementById("buscaPacienteMedicacao")

const pacienteId=
(selectEnf&&selectEnf.value&&selectEnf.value!=="todos")
?selectEnf.value
:(selectMed&&selectMed.value&&selectMed.value!=="todos")
?selectMed.value
:null

const dataInicio=normalizarDataISO(document.getElementById("dataInicio")?.value)
const dataFim=normalizarDataISO(document.getElementById("dataFim")?.value)

if(!pacienteId||pacienteId==="todos"){
alert("Selecione um paciente")
return
}

const {data:paciente,error:erroPaciente}=await db
.from("pacientes")
.select("*")
.eq("id",pacienteId)
.single()

if(erroPaciente||!paciente){
alert("Paciente não encontrado")
return
}

const {data:rotinasExec}=await db
.from("rotinas_execucao")
.select("*,rotina_modelos(nome)")
.eq("paciente_id",pacienteId)
.gte("data",dataInicio)
.lte("data",dataFim)

const {jsPDF}=window.jspdf
const doc=new jsPDF("p","mm","a4")

await carregarFonteRoboto(doc)

let y=15

doc.setFillColor(41,128,185)
doc.rect(0,0,210,18,"F")

doc.setTextColor(255,255,255)
doc.setFont("Roboto","bold")
doc.setFontSize(12)
doc.text("LAR GERIÁTRICO HARMONIA",105,8,{align:"center"})

doc.setFont("Roboto","normal")
doc.setFontSize(9)
doc.text("Relatório Clínico do Paciente",105,14,{align:"center"})

doc.setTextColor(0)

y=25

doc.rect(10,y,190,42)

let dy=y+6

doc.text(`Paciente: ${paciente.nome_completo||"-"}`,12,dy)
doc.text(`Idade: ${calcularIdade(paciente.data_nascimento)||"-"}`,120,dy)

dy+=5

doc.text(`HAS: ${paciente.has?"SIM":"—"}`,12,dy)
doc.text(`DM: ${paciente.dm?"SIM":"—"}`,60,dy)
doc.text(`DA: ${paciente.da||paciente.demencia?"SIM":"—"}`,100,dy)
doc.text(`PA: ${paciente.pressao_arterial||"—"}`,140,dy)
doc.text(`Cardio: ${paciente.cardiopatia||paciente.cardio?"SIM":"—"}`,170,dy)

dy+=5

doc.text(`Dieta: ${paciente.dieta_especial?"SIM - "+(paciente.dieta_texto||""):"NÃO"}`,12,dy)
doc.text(`Risco: ${paciente.grau_risco||"—"}`,120,dy)

dy+=5

let comorbidades=[]

if(paciente.has)comorbidades.push("HAS")
if(paciente.dm)comorbidades.push("DM")
if(paciente.da||paciente.demencia)comorbidades.push("DEMÊNCIA")
if(paciente.cardiopatia||paciente.cardio)comorbidades.push("CARDIO")
if(paciente.acamado||paciente.restrito_leito)comorbidades.push("ACAMADO")
if(paciente.alzheimer)comorbidades.push("ALZHEIMER")
if(paciente.parkinson)comorbidades.push("PARKINSON")
if(paciente.avc)comorbidades.push("AVC")
if(paciente.depressao)comorbidades.push("DEPRESSÃO")

if(
paciente.outras_comorbidades &&
paciente.outras_comorbidades!=="-" &&
paciente.outras_comorbidades!=="null"
){
comorbidades.push(paciente.outras_comorbidades)
}

comorbidades=[...new Set(comorbidades)]

doc.text(`Comorbidades: ${comorbidades.join(" / ")||"—"}`,12,dy)

y=Math.max(y,dy)+10

let atual=new Date(dataInicio+"T00:00:00")
const fim=new Date(dataFim+"T00:00:00")
const dias=[]

while(atual<=fim){
dias.push(atual.toISOString().slice(0,10))
atual.setDate(atual.getDate()+1)
}

const colunas=["Banho","Higiene (manhã)","Troca de Fraldas (manhã)","Oferta de Água","Café","Medicação","Almoço","Lanche","Higiene (tarde)","Jantar","Higiene (noite)","Troca de Fraldas (noite)"]

const mapaExec=new Map()

rotinasExec?.forEach(r=>{

const nomeBanco=normalizar(r.rotina_modelos?.nome||"")

if(!nomeBanco)return

const chave=`${r.data}_${nomeBanco}`

if(!mapaExec.has(chave)){

mapaExec.set(chave,{
status:(r.status||"pendente").toLowerCase(),
prof:r.profissional_nome||""
})

}else{

if((r.status||"").toLowerCase()==="executado"){

mapaExec.set(chave,{
status:"executado",
prof:r.profissional_nome||""
})

}

}

})

let matriz={}

dias.forEach(dataRef=>{

matriz[dataRef]={}

colunas.forEach(c=>{

const chave=`${dataRef}_${normalizar(c)}`

if(mapaExec.has(chave)){
matriz[dataRef][c]=mapaExec.get(chave)
}else{
matriz[dataRef][c]={status:"neutro",prof:""}
}

})

})

doc.setFont("Roboto","bold")
doc.text("Rotinas por período",10,y)

y+=6

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

dias.forEach((dataRef,index)=>{

let x=10

if(index%2===0){
doc.setFillColor(248,249,250)
doc.rect(10,y-4,190,6,"F")
}

const[ano,mes,diaNum]=dataRef.split("-")

doc.text(`${diaNum}/${mes}/${ano}`,x,y)

x+=22

colunas.forEach(c=>{

const dado=matriz[dataRef][c]

if(dado.status==="executado"){

doc.setFillColor(39,174,96)
doc.rect(x-4.5,y-3,9,4.5,"F")

doc.setTextColor(255)
doc.setFont("Roboto","bold")
doc.text("OK",x,y,{align:"center"})

}else if(dado.status==="pendente"){

doc.setFillColor(192,57,43)
doc.rect(x-4.5,y-3,9,4.5,"F")

doc.setTextColor(255)
doc.setFont("Roboto","bold")
doc.text("X",x,y,{align:"center"})

}else{

doc.setTextColor(150)
doc.text("-",x,y,{align:"center"})

}

doc.setTextColor(0)
doc.setFont("Roboto","normal")

x+=12

})

y+=6

if(y>250){
doc.addPage()
y=20
}

})

y+=6

doc.setFont("Roboto","bold")
doc.text("Legenda:",10,y)

y+=5

doc.setFont("Roboto","normal")
doc.setFontSize(8)

doc.text("1–Banho | 2–Hig.Manhã | 3–Fraldas Manhã | 4–Água | 5–Café | 6–Medicação | 7–Almoço | 8–Lanche | 9–Hig.Tarde | 10–Jantar | 11–Hig.Noite | 12–Fraldas Noite",10,y,{maxWidth:180})

y+=8

let total=0
let exec=0

Object.values(matriz).forEach(d=>{
Object.values(d).forEach(st=>{
total++
if(st.status==="executado")exec++
})
})

let perc=total?Math.round((exec/total)*100):0

doc.setFont("Roboto","bold")
doc.text(`Execução: ${perc}%`,10,y)

y+=5

doc.setFillColor(220,220,220)
doc.rect(10,y,180,5,"F")

doc.setFillColor(46,204,113)
doc.rect(10,y,180*(perc/100),5,"F")

y+=10

doc.setFont("Roboto","normal")

doc.text(
perc>=80
?"Paciente estável com boa adesão às rotinas."
:perc>=50
?"Situação Clínica: Paciente requer monitoramento contínuo."
:"Paciente com risco elevado assistencial.",
10,
y,
{maxWidth:180}
)

y+=8

doc.setFont("Roboto","bold")
doc.text("Análise Clínica e Cuidados",10,y)

y+=6

doc.setFont("Roboto","normal")
doc.setFontSize(9)

const analise=gerarAnaliseClinica(paciente)

analise.forEach(item=>{

doc.text("• "+item,10,y,{maxWidth:180})

y+=5

if(y>250){
doc.addPage()
y=20
}

})

doc.text("Responsável:",10,y)

y+=5

let nome="Sistema"

const uid=localStorage.getItem("usuario_id")

if(uid){

const {data:user}=await db
.from("usuarios")
.select("nome_completo")
.eq("id",uid)
.single()

if(user?.nome_completo){
nome=user.nome_completo
}

}

doc.text(nome,10,y)

doc.line(10,y+3,80,y+3)

const totalPages=doc.getNumberOfPages()

for(let i=1;i<=totalPages;i++){

doc.setPage(i)

doc.setFontSize(8)
doc.setTextColor(120)

doc.text(`Página ${i}/${totalPages}`,200,290,{align:"right"})

}

doc.setTextColor(0)

doc.text(`Gerado em: ${new Date().toLocaleString()}`,10,290)

doc.save(`Relatorio_${paciente.nome_completo}.pdf`)

}
/* ====================================================
085 – PDF GERAL
==================================================== */
async function gerarPDFGeral(){

if(!db)return

const {data,error}=await db
.from("pacientes")
.select("*")
.eq("empresa_id",EMPRESA_ID)
.eq("ativo",true)
.order("nome_completo")

if(error||!data){
alert("Erro ao gerar PDF")
return
}

const {jsPDF}=window.jspdf

const doc=new jsPDF("p","mm","a4")

await carregarFonteRoboto(doc)

doc.setFont("Roboto","bold")
doc.setFontSize(16)

doc.text("RELATÓRIO GERAL DE PACIENTES",105,15,{align:"center"})

let y=28

data.forEach((p,i)=>{

if(y>260){
doc.addPage()
y=20
}

doc.setFont("Roboto","bold")
doc.setFontSize(11)

doc.text(`${i+1}. ${p.nome_completo||"-"}`,10,y)

y+=5

doc.setFont("Roboto","normal")
doc.setFontSize(9)

let com=[]

if(p.has)com.push("HAS")
if(p.dm)com.push("DM")
if(p.da||p.demencia)com.push("DEMÊNCIA")
if(p.cardiopatia||p.cardio)com.push("CARDIO")
if(p.acamado||p.restrito_leito)com.push("ACAMADO")

if(p.outras_comorbidades){
com.push(p.outras_comorbidades)
}

doc.text(`Idade: ${calcularIdade(p.data_nascimento)}`,12,y)

y+=4

doc.text(`PA: ${p.pressao_arterial||"-"}`,12,y)

y+=4

doc.text(`Dieta: ${p.dieta_texto||"Livre"}`,12,y)

y+=4

doc.text(`Risco: ${p.grau_risco||"-"}`,12,y)

y+=4

doc.text(`Comorbidades: ${com.join(" / ")||"Nenhuma"}`,12,y,{maxWidth:180})

y+=10

})

const totalPages=doc.getNumberOfPages()

for(let i=1;i<=totalPages;i++){

doc.setPage(i)

doc.setFontSize(8)
doc.setTextColor(120)

doc.text(`Página ${i}/${totalPages}`,200,290,{align:"right"})

}

doc.setTextColor(0)

doc.save("relatorio_geral_pacientes.pdf")

}
