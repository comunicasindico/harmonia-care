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
080 – PDF PACIENTE (FINAL CORRIGIDO DEFINITIVO)
==================================================== */
async function gerarPDFPaciente(){
if(!db)return
const pacienteId=document.getElementById("buscaPaciente")?.value
const dataInicio=normalizarDataISO(document.getElementById("dataInicio")?.value)
const dataFim=normalizarDataISO(document.getElementById("dataFim")?.value)
const turnoAtual=(TURNO_ATUAL||"manha").toLowerCase().trim()
if(!pacienteId||pacienteId==="todos"){alert("Selecione um paciente");return}
const {data:paciente}=await db.from("pacientes").select("*").eq("id",pacienteId).single()
const {data:rotinasExec}=await db.from("rotinas_execucao").select("*,rotina_modelos(nome)").eq("paciente_id",pacienteId).gte("data",dataInicio).lte("data",dataFim)

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
doc.text(`Paciente: ${paciente.nome_completo}`,12,dy)
doc.text(`Idade: ${calcularIdade(paciente.data_nascimento)}`,120,dy)
dy+=5
doc.text(`HAS: ${paciente.has?"SIM":"—"}`,12,dy)
doc.text(`DM: ${paciente.dm?"SIM":"—"}`,60,dy)
doc.text(`DA: ${paciente.da?"SIM":"—"}`,100,dy)
doc.text(`PA: ${paciente.pressao_arterial||"—"}`,140,dy)
dy+=5
doc.text(`Dieta: ${paciente.dieta_especial?"SIM - "+(paciente.dieta_texto||""):"NÃO"}`,12,dy)
doc.text(`Risco: ${paciente.grau_risco||"—"}`,120,dy)
dy+=5
doc.text(`Comorbidades: ${paciente.outras_comorbidades||"—"}`,12,dy)
y+=10
/* ====================================================
082 – BLOCO ANÁLISE CLÍNICA
==================================================== */
doc.setFont("Roboto","bold")
doc.text("Análise Clínica e Cuidados",10,y)
y+=6
doc.setFont("Roboto","normal")
doc.setFontSize(9)
const analise=gerarAnaliseClinica(paciente)
analise.forEach(item=>{
doc.text("• "+item,10,y,{maxWidth:180})
y+=5
if(y>250){doc.addPage();y=20}
})
function normalizar(txt){
return (txt||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim()
}
/* ====================================================
081 – GERAR ANÁLISE CLÍNICA INTELIGENTE
==================================================== */
function gerarAnaliseClinica(p){

let analise=[]
/* 🔴 HAS */
if(p.has){
analise.push("Hipertensão: Monitorar PA diariamente, evitar picos >140/90, reduzir sódio e manter medicação regular.")
}
/* 🔵 DIABETES */
if(p.dm){
analise.push("Diabetes: Controle rigoroso de glicemia, atenção a hipoglicemia, fracionar alimentação e evitar açúcares simples.")
}
/* 🟣 DEMÊNCIA (DA) */
if(p.da){
analise.push("Demência: Manter ambiente seguro, evitar quedas, orientar equipe para reorientação frequente e supervisão contínua.")
}
/* ❤️ CARDIOPATIA */
if(p.cardiopatia){
analise.push("Cardiopatia: Observar sinais de dispneia, edema e fadiga. Evitar esforços e monitorar sinais vitais.")
}
/* 🛏️ ACAMADO */
if(p.acamado){
analise.push("Paciente acamado: Realizar mudança de decúbito a cada 2h, prevenir lesão por pressão e manter hidratação adequada.")
}
/* 🍽️ DIETA */
let dieta=(p.dieta_texto||"Livre").toLowerCase()

if(dieta.includes("hipossodica")){
analise.push("Dieta hipossódica: Controle rigoroso de sódio para evitar sobrecarga cardiovascular.")
}
else if(dieta.includes("diabetica")){
analise.push("Dieta diabética: Evitar picos glicêmicos, alimentação balanceada e controle de carboidratos.")
}
else if(dieta.includes("pastosa")){
analise.push("Dieta pastosa: Atenção ao risco de broncoaspiração. Alimentação assistida.")
}
else if(dieta.includes("liquida")){
analise.push("Dieta líquida: Monitorar ingestão calórica e risco de desnutrição.")
}
else if(dieta.includes("vegetariana")){
analise.push("Dieta vegetariana: Garantir aporte proteico adequado.")
}
else{
analise.push("Dieta livre: Manter equilíbrio alimentar e monitoramento nutricional.")
}

/* 🩺 PRESSÃO ARTERIAL */
if(p.pressao_arterial){
let v=p.pressao_arterial.split("/")
let s=parseInt(v[0])||0
let d=parseInt(v[1])||0

if(s>=160||d>=100){
analise.push("Pressão arterial elevada: risco aumentado. Monitoramento intensivo necessário.")
}
}

/* ⚠️ OUTRAS COMORBIDADES */
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

/* 🎯 CONCLUSÃO INTELIGENTE */
if(p.grau_risco>=4){
analise.push("Paciente de ALTO RISCO: exige acompanhamento intensivo da equipe.")
}else if(p.grau_risco===3){
analise.push("Paciente com risco moderado: requer atenção contínua.")
}else{
analise.push("Paciente estável dentro do quadro clínico atual.")
}

return analise
}


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
/* 🔥 SE QUALQUER TURNO EXECUTOU → MARCA COMO OK */
if((r.status||"").toLowerCase()==="executado"){
mapaExec.set(chave,{
status:"executado",
prof:r.profissional_nome||""
})
}
}
})

let matriz={}
dias.forEach(dia=>{
matriz[dia]={}
colunas.forEach(c=>{
const chave=`${dia}_${normalizar(c)}`
if(mapaExec.has(chave)){
matriz[dia][c]=mapaExec.get(chave)
}else{
matriz[dia][c]={status:"neutro",prof:""}
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
colunas.forEach((c,i)=>{doc.text(String(i+1),x,y,{align:"center"});x+=12})
doc.setTextColor(0)
y+=6
dias.forEach((dia,index)=>{
let x=10
if(index%2===0){doc.setFillColor(248,249,250);doc.rect(10,y-4,190,6,"F")}
const[dY,dM,dD]=dia.split("-")
doc.text(`${dD}/${dM}/${dY}`,x,y)
x+=22
colunas.forEach(c=>{
const dado=matriz[dia][c]
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
if(y>250){doc.addPage();y=20}
})
y+=6
doc.setFont("Roboto","bold")
doc.text("Legenda:",10,y)
y+=5
doc.setFont("Roboto","normal")
doc.setFontSize(8)
doc.text("1–Banho | 2–Hig.Manhã | 3–Fraldas Manhã | 4–Água | 5–Café | 6–Medicação | 7–Almoço | 8–Lanche | 9–Hig.Tarde | 10–Jantar | 11–Hig.Noite | 12–Fraldas Noite",10,y,{maxWidth:180})
y+=8
let total=0,exec=0
Object.values(matriz).forEach(d=>{Object.values(d).forEach(st=>{total++;if(st.status==="executado")exec++})})
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
doc.text(perc>=80?"Paciente estável com boa adesão às rotinas.":perc>=50?"Paciente requer monitoramento.":"Paciente com risco elevado assistencial.",10,y,{maxWidth:180})
y+=12
doc.text("Responsável:",10,y)
y+=5
let nome="Sistema"
const uid=localStorage.getItem("usuario_id")
if(uid){
const {data:user}=await db.from("usuarios").select("nome_completo").eq("id",uid).single()
if(user?.nome_completo)nome=user.nome_completo
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
