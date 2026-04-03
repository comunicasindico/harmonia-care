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
006 – PDF MEDICAÇÃO AUDITORIA MÁXIMA + QR CODE
==================================================== */
async function gerarPDFMedicacaoPaciente(){
if(!window.jspdf)return alert("jsPDF não carregado")
if(!window.QRCode)return alert("QRCode.js não carregado")
const{jsPDF}=window.jspdf
const doc=new jsPDF()
const pacienteId=document.getElementById("buscaPacienteMedicacao")?.value
if(!pacienteId||pacienteId==="todos"){alert("Selecione um paciente");return}
const paciente=(window.PACIENTES_CACHE||[]).find(p=>String(p.id)===String(pacienteId))
const meds=(window.MEDICACOES_CACHE||[]).filter(m=>String(m.paciente_id)===String(pacienteId))
const agora=new Date()
const dataGeracao=agora.toLocaleString()
/* 🔷 CABEÇALHO */
doc.setFillColor(30,64,175)
doc.rect(0,0,210,20,"F")
doc.setTextColor(255,255,255)
doc.setFontSize(14)
doc.text("HARMONIA-CARE",14,12)
doc.setFontSize(10)
doc.text("RELATÓRIO DE MEDICAÇÕES - AUDITORIA",105,12,null,null,"center")
doc.setTextColor(0,0,0)
/* 🔷 DADOS PACIENTE */
doc.setFontSize(11)
doc.text("Paciente: "+(paciente?.nome_completo||""),14,28)
doc.text("Data emissão: "+dataGeracao,14,34)
/* 🔷 QR CODE */
let qrData=`Paciente:${paciente?.nome_completo} | Data:${dataGeracao}`

if(window.QRCode){
const canvas=document.createElement("canvas")
QRCode.toCanvas(canvas,qrData,{width:120},function(err){
if(!err){
let img=canvas.toDataURL("image/png")
doc.addImage(img,"PNG",160,22,30,30)
}
})
}
let y=50
let mapa={}
meds.forEach(m=>{
let chave=(m.nome_medicamento||"")+"_"+(m.dosagem||"")
if(!mapa[chave]){mapa[chave]={id:m.id,nome:m.nome_medicamento,dose:m.dosagem,horarios:[]}}
;(m.horarios||"").split("|").forEach(h=>{if(h)mapa[chave].horarios.push(h.trim())})
})
Object.values(mapa).forEach(m=>{
doc.setFillColor(245,245,245)
doc.roundedRect(12,y-6,186,9,2,2,"F")
doc.setFontSize(11)
doc.setTextColor(0,0,0)
doc.text(m.nome+" ("+(m.dose||"")+")",14,y)
y+=9
let horarios=[...new Set(m.horarios)].sort()
let x=14
horarios.forEach(h=>{
let hora=h.toString().replace(/[^\d:]/g,"").slice(0,5)
if(!hora.includes(":"))return
let exec=(window.EXEC_CACHE||[]).find(e=>String(e.medicacao_id)===String(m.id)&&String(e.horario).includes(hora))
let hNum=parseInt(hora.split(":")[0])
let cor=[253,224,71]
let label="MANHÃ"
if(hNum>=12&&hNum<18){cor=[251,146,60];label="TARDE"}
if(hNum>=18||hNum<5){cor=[239,68,68];label="NOITE"}
if(exec){cor=[34,197,94];label="ADMIN"}
doc.setFillColor(...cor)
doc.roundedRect(x,y-5,42,9,3,3,"F")
doc.setFontSize(9)
doc.text(hora,x+2,y-1)
doc.setFontSize(7)
doc.text(label,x+2,y+3)
x+=46
if(x>170){x=14;y+=12}
})
y+=14
if(y>265){doc.addPage();y=20}
})
/* 🔷 ASSINATURA */
y+=10
doc.setDrawColor(0)
doc.line(14,y,100,y)
doc.setFontSize(9)
doc.text("Responsável Técnico",14,y+5)
/* 🔷 RODAPÉ */
doc.setFontSize(8)
doc.setTextColor(120,120,120)
doc.text("Harmonia-Care • Sistema de Gestão Clínica • Documento Auditável",14,285)
doc.save("medicacao_auditoria.pdf")
}
/* ====================================================
007 – PDF GERAL COM PAGINAÇÃO CORRETA
==================================================== */
async function gerarPDFMedicacaoGeral(){
if(!window.jspdf)return alert("jsPDF não carregado")
const{jsPDF}=window.jspdf
const doc=new jsPDF()
doc.setFillColor(30,64,175)
doc.rect(0,0,210,18,"F")
doc.setTextColor(255,255,255)
doc.setFontSize(13)
doc.text("HARMONIA-CARE",14,11)
doc.setFontSize(10)
doc.text("Relatório Geral de Medicações",120,11)
doc.setTextColor(0,0,0)
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
if(y>270){doc.addPage();y=20}
doc.setFontSize(11)
doc.setTextColor(0,0,0)
doc.text(p.nome,14,y)
y+=6
let mapa={}
p.itens.forEach(m=>{
let chave=(m.nome_medicamento||"")+"_"+(m.dosagem||"")
if(!mapa[chave]){mapa[chave]={nome:m.nome_medicamento,dose:m.dosagem,horarios:[]}}
;(m.horarios||"").split("|").forEach(h=>{if(h)mapa[chave].horarios.push(h.trim())})
})
Object.values(mapa).forEach(m=>{
if(y>270){doc.addPage();y=20}
doc.setFontSize(9)
doc.text("- "+m.nome+" ("+(m.dose||"")+")",16,y)
y+=5
let horarios=[...new Set(m.horarios)].sort()
let linha=""
horarios.forEach(h=>{
let hora=(h||"").toString().trim()
if(!hora)return
if(!hora.includes(":")){
hora=hora.padStart(2,"0")+":00"
}else{
let[p,m]=hora.split(":")
hora=p.padStart(2,"0")+":"+m.padStart(2,"0")
}
linha+=hora+"  "
})
if(y>270){doc.addPage();y=20}
doc.setFontSize(8)
doc.setTextColor(80,80,80)
doc.text(linha,18,y)
y+=6
})
y+=4
})
doc.setFontSize(8)
doc.setTextColor(120,120,120)
doc.text("Harmonia-Care • Sistema de Gestão Clínica",14,285)
doc.save("medicacoes_geral.pdf")
}
