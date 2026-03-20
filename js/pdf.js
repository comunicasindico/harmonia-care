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
080 – PDF PACIENTE
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
if(error||!paciente){console.error("ERRO PACIENTE",error);alert("Erro ao carregar paciente");return}
const {data:rotinasExec}=await db.from("rotinas_execucao").select("*,rotina_modelos(id,nome,ordem,turno)").eq("paciente_id",pacienteId).gte("data",dataInicio).lte("data",dataFim)

const {jsPDF}=window.jspdf
const doc=new jsPDF("p","mm","a4")
await carregarFonteRoboto(doc)

let y=15

const cabecalho="Lar Geriátrico Harmonia\nTel: (81) 3461-3109"
const rodape="CNPJ 11197111000156 - Rua Doutor Manoel Benício Fontenelle, 38 - Piedade - Jaboatão dos Guararapes – PE"

function adicionarRodape(){
const totalPages=doc.getNumberOfPages()
for(let i=1;i<=totalPages;i++){
doc.setPage(i)
doc.setFontSize(8)
doc.setTextColor(120)
doc.text(`${rodape} | Página ${i} de ${totalPages}`,105,290,{align:"center"})
doc.setTextColor(0)
}}

doc.setFontSize(12)
doc.text(cabecalho,105,y,{align:"center"})
y+=10

doc.setFontSize(14)
doc.setFont("Roboto","bold")
doc.text("RELATÓRIO DO PACIENTE",105,y,{align:"center"})
y+=10

doc.setFillColor(240,240,240)
doc.rect(10,y-5,190,60,"F")

doc.setFontSize(10)
doc.setFont("Roboto","bold")
doc.text("DADOS CLÍNICOS DO PACIENTE",10,y)
y+=6

doc.setFont("Roboto","normal")

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
doc.addImage(imgDieta,"PNG",12,y-2.5,3.5,3.5)
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

/* ====================================================
COLUNAS NUMERADAS
==================================================== */

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

/* MATRIZ */
let matriz={}
rotinasExec?.forEach(r=>{
if(!matriz[r.data])matriz[r.data]={}
const nome=r.rotina_modelos?.nome||""
if(nome)matriz[r.data][nome]=r.status
})

/* TÍTULO */
doc.setFontSize(12)
doc.setFont("Roboto","bold")
doc.text("Rotinas por período",10,y)
y+=6

doc.setFontSize(7)
doc.setFont("Roboto","bold")

/* HEADER NUMÉRICO */
let x=10
doc.text("Data",x,y)
x+=20

colunas.forEach((c,i)=>{
doc.text(String(i+1),x,y,{align:"center"})
x+=12
})

y+=4
doc.setDrawColor(180)
doc.line(10,y,200,y)
y+=4

doc.setFont("Roboto","normal")

/* LINHAS */
Object.keys(matriz).sort().forEach(data=>{
let x=10
doc.text(formatarDataBR(data),x,y)
x+=20

colunas.forEach(c=>{
let status=matriz[data][c]||null

if(status==="executado"){
doc.setTextColor(39,174,96)
doc.text("OK",x,y,{align:"center"})
}else{
doc.setTextColor(231,76,60)
doc.text("X",x,y,{align:"center"})
}

x+=12
})

/* ====================================================
ANÁLISE CLÍNICA AUTOMÁTICA
==================================================== */
y+=6
if(y>260){doc.addPage();y=20}

doc.setFont("Roboto","bold")
doc.setFontSize(11)
doc.text("Análise do quadro geral do paciente",10,y)
y+=6

doc.setFont("Roboto","normal")
doc.setFontSize(9)

/* IDADE */
const idade=calcularIdade(paciente.data_nascimento)

/* CONTAGEM EXECUÇÃO */
let total=0,executado=0
Object.values(matriz).forEach(dia=>{
Object.values(dia).forEach(st=>{
total++
if(st==="executado")executado++
})
})

let percentual=total?Math.round((executado/total)*100):0

/* CLASSIFICAÇÃO */
let classificacao="Estável"
if(percentual<80)classificacao="Atenção"
if(percentual<60)classificacao="Crítico"

/* COMORBIDADES */
let comorb=[]
if(paciente.has)comorb.push("hipertensão")
if(paciente.dm)comorb.push("diabetes")
if(paciente.da)comorb.push("demência")
if(paciente.cardiopatia)comorb.push("cardiopatia")
if(paciente.acamado)comorb.push("restrição de mobilidade")

/* TEXTO */
let texto=[]

texto.push(`Paciente com ${idade} anos, apresentando quadro geral classificado como ${classificacao.toLowerCase()}.`)

if(comorb.length){
texto.push(`Possui histórico de ${comorb.join(", ")}, o que exige atenção contínua da equipe.`)
}

texto.push(`A taxa de execução das rotinas no período foi de ${percentual}%, refletindo o nível de adesão aos cuidados propostos.`)

/* RECOMENDAÇÕES */
if(percentual<80){
texto.push("Recomenda-se reforço na execução das rotinas diárias, especialmente nas atividades básicas de cuidado.")
}

if(paciente.acamado){
texto.push("Manter mudanças de decúbito frequentes e atenção redobrada com prevenção de lesões por pressão.")
}

if(paciente.dm){
texto.push("Monitorar alimentação e sinais glicêmicos, mantendo regularidade nas refeições.")
}

if(paciente.has||paciente.cardiopatia){
texto.push("Observar sinais cardiovasculares e manter controle rigoroso da pressão arterial.")
}

texto.push("Manter acompanhamento contínuo da equipe, garantindo segurança, dignidade e qualidade de vida ao paciente.")

/* IMPRESSÃO */
texto.forEach(linha=>{
doc.text(linha,10,y,{maxWidth:180})
y+=5
if(y>280){doc.addPage();y=20}
})

doc.setTextColor(0,0,0)
doc.line(10,y+2,200,y+2)
y+=6

if(y>270){doc.addPage();y=20}
})

/* ====================================================
LEGENDA
==================================================== */

y+=8
doc.setFont("Roboto","bold")
doc.setFontSize(10)
doc.text("Legenda:",10,y)
y+=5

doc.setFont("Roboto","normal")
doc.setFontSize(8)

colunas.forEach((c,i)=>{
doc.text(`${i+1} - ${c}`,10,y)
y+=4
if(y>280){doc.addPage();y=20}
})

/* RODAPÉ */
y+=5
doc.setFontSize(10)
doc.text(`Data da impressão: ${formatarDataBR(new Date())}`,10,y)
y+=15

doc.text("__________________________________________",10,y)
y+=6
doc.text("Responsável Técnico",10,y)

adicionarRodape()

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
