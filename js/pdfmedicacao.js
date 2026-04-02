/* ====================================================
000 – PDF MEDICAÇÃO HARMONIA CARE (COMPLETO)
==================================================== */

/* ====================================================
001 – UTIL NORMALIZAR HORA
==================================================== */
function normalizarHoraPDF(h){
if(!h)return""
h=h.toString().trim()
if(!h.includes(":"))return h.padStart(2,"0")+":00"
let[p,m]=h.split(":")
return p.padStart(2,"0")+":"+m.padStart(2,"0")
}

/* ====================================================
002 – UTIL COR POR HORÁRIO
==================================================== */
function corHorarioPDF(h,executado){
if(executado)return[34,197,94]
let hora=parseInt(h.split(":")[0])
if(hora<12)return[253,224,71]
if(hora<18)return[251,146,60]
return[239,68,68]
}

/* ====================================================
003 – CABEÇALHO PADRÃO
==================================================== */
function cabecalhoPDF(doc,titulo){
doc.setFillColor(30,64,175)
doc.rect(0,0,210,18,"F")
doc.setTextColor(255,255,255)
doc.setFontSize(13)
doc.text("HARMONIA-CARE",14,11)
doc.setFontSize(10)
doc.text(titulo,120,11)
doc.setTextColor(0,0,0)
}

/* ====================================================
004 – RODAPÉ PADRÃO
==================================================== */
function rodapePDF(doc){
doc.setFontSize(8)
doc.setTextColor(120,120,120)
doc.text("Harmonia-Care • Sistema de Gestão Clínica",14,285)
}

/* ====================================================
005 – AGRUPAR MEDICAÇÕES
==================================================== */
function agruparMedicacoesPDF(lista){
let mapa={}
lista.forEach(m=>{
let chave=(m.nome_medicamento||"")+"_"+(m.dosagem||"")
if(!mapa[chave]){
mapa[chave]={id:m.id,nome:m.nome_medicamento,dose:m.dosagem,horarios:new Set()}
}
;(m.horarios||"").split("|").forEach(h=>{
let n=normalizarHoraPDF(h)
if(n)mapa[chave].horarios.add(n)
})
})
return Object.values(mapa)
}

/* ====================================================
006 – PDF PACIENTE
==================================================== */
async function gerarPDFMedicacaoPaciente(){
if(!window.jspdf)return alert("jsPDF não carregado")
const{jsPDF}=window.jspdf
const doc=new jsPDF()

const pacienteId=document.getElementById("buscaPacienteMedicacao")?.value
if(!pacienteId||pacienteId==="todos"){alert("Selecione um paciente");return}

const paciente=(window.PACIENTES_CACHE||[]).find(p=>String(p.id)===String(pacienteId))
const meds=(window.MEDICACOES_CACHE||[]).filter(m=>String(m.paciente_id)===String(pacienteId))

cabecalhoPDF(doc,"Relatório de Medicações")

doc.setFontSize(11)
doc.text("Paciente: "+(paciente?.nome_completo||""),14,28)
doc.text("Data: "+new Date().toLocaleDateString(),14,34)

let y=44

let lista=agruparMedicacoesPDF(meds)

lista.forEach(m=>{
doc.setFontSize(11)
doc.text(m.nome+" ("+(m.dose||"")+")",14,y)
y+=6

let horarios=[...m.horarios].sort()

horarios.forEach(h=>{
let exec=(window.EXEC_CACHE||[]).find(e=>String(e.medicacao_id)===String(m.id)&&String(e.horario)===String(h))
let cor=corHorarioPDF(h,exec)

doc.setFillColor(...cor)
doc.roundedRect(16,y-4,45,6,2,2,"F")

doc.setFontSize(9)
doc.setTextColor(0,0,0)
doc.text(`${h} ${exec?"✔":"•"}`,18,y)

y+=7
})

y+=4
})

rodapePDF(doc)
doc.save("medicacao_paciente.pdf")
}

/* ====================================================
007 – PDF GERAL
==================================================== */
async function gerarPDFMedicacaoGeral(){
if(!window.jspdf)return alert("jsPDF não carregado")
const{jsPDF}=window.jspdf
const doc=new jsPDF()

cabecalhoPDF(doc,"Relatório Geral de Medicações")

let y=28

const pacientes={}

;(window.MEDICACOES_CACHE||[]).forEach(m=>{
if(!pacientes[m.paciente_id]){
let nome=(window.PACIENTES_CACHE||[]).find(p=>String(p.id)===String(m.paciente_id))?.nome_completo||"Paciente"
pacientes[m.paciente_id]={nome,itens:[]}
}
pacientes[m.paciente_id].itens.push(m)
})

Object.values(pacientes).forEach(p=>{
doc.setFontSize(11)
doc.setTextColor(0,0,0)
doc.text(p.nome,14,y)
y+=6

let lista=agruparMedicacoesPDF(p.itens)

lista.forEach(m=>{
doc.setFontSize(9)
doc.text("- "+m.nome+" ("+(m.dose||"")+")",16,y)
y+=5
})

y+=4
})

rodapePDF(doc)
doc.save("medicacoes_geral.pdf")
}
