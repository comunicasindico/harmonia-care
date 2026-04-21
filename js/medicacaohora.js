/* ====================================================
000 – ABRIR PAINEL MEDICAÇÃO POR HORA
==================================================== */
function abrirPainelMedicacaoHora(){
document.getElementById("painelMedicacao").style.display="none"
document.getElementById("painelMedicacaoHora").style.display="block"
if(typeof carregarMedicacoesHora==="function"){
carregarMedicacoesHora()
}
/* 🔥 PATCH 3 – FORÇA CONTADOR ATUALIZAR */
setTimeout(()=>{
if(window.MEDICACOES_CACHE){
renderizarMedicacoesHora(window.MEDICACOES_CACHE)
}
},200)
}
/* ====================================================
001 – CARREGAR MEDICAÇÕES (REAPROVEITA CACHE)
==================================================== */
async function carregarMedicacoesHora(){
if(!window.MEDICACOES_CACHE || !window.MEDICACOES_CACHE.length){
await carregarMedicacoes()
}
renderizarMedicacoesHora(window.MEDICACOES_CACHE||[])
}
/* ====================================================
002 – RENDER POR HORA (REFLEXO REAL DO BANCO)
==================================================== */
function renderizarMedicacoesHora(lista){

const div=document.getElementById("listaMedicacoesHora")
if(!div)return
if(!lista)lista=[]

const execLista=(window.EXEC_CACHE||[])
const dataHoje=obterDataAtiva()

let totalSim=0
let totalNao=0
let html=""
let agrupado={}

/* NORMALIZA HORA */
const normalizarHora=h=>{
if(!h)return""
h=h.toString().trim()
if(!h.includes(":"))return h.padStart(2,"0")+":00"
let[p,m]=h.split(":")
return p.padStart(2,"0")+":"+m.padStart(2,"0")
}

/* AGRUPA POR HORA */
lista.forEach(m=>{
let horarios=(m.horarios||"").split("|")
horarios.forEach(h=>{
h=normalizarHora(h)
if(!h)return
if(!agrupado[h])agrupado[h]=[]
agrupado[h].push(m)
})
})

let horariosOrdenados=Object.keys(agrupado).sort()

horariosOrdenados.forEach(h=>{

html+=`<div style="margin-bottom:12px">
<div style="font-weight:bold;margin-bottom:6px">⏰ ${h}</div>`

agrupado[h].forEach(m=>{

/* 🔥 VERIFICA EXECUÇÃO REAL */
let executado=false

for(const e of execLista){
if(
String(e.data)===String(dataHoje) &&
String(e.medicacao_id)===String(m.id) &&
normalizarHora(e.horario)===h
){
executado=true
break
}
}

/* 🔥 COR + CONTADOR */
let cor="#fde047"

if(executado){
cor="#22c55e"
totalSim++
}else{
totalNao++
}

html+=`
<div style="background:${cor};padding:10px;border-radius:10px;margin-bottom:6px;font-weight:500">
${m.nome_paciente} - ${m.nome_medicamento}
</div>
`

})

html+=`</div>`

})

div.innerHTML=html

/* 🔥 CONTADOR FINAL (BANCO REAL) */
const a=document.getElementById("countNaoMed")
const b=document.getElementById("countSimMed")

if(a)a.innerText=totalNao
if(b)b.innerText=totalSim

console.log("CONTADOR REAL:",totalNao,totalSim)

}
/* ====================================================
003 –  BOTÃO MEDICAÇÃO POR HORA
==================================================== */
function garantirBotaoMedicacaoHora(){

const topo=document.getElementById("topoBotoes")
if(!topo)return

/* já existe? */
if(document.getElementById("btnMedicacaoHora"))return

const btn=document.createElement("button")
btn.id="btnMedicacaoHora"
btn.className="btn-secondary"
btn.innerHTML="⏰ Medicação p/Hora"
btn.onclick=abrirPainelMedicacaoHora

topo.appendChild(btn)
}
window.addEventListener("load",garantirBotaoMedicacaoHora)
/* ====================================================
004 – CONTADOR TEMPO REAL (BASEADO NA TELA)
==================================================== */
function atualizarContadorMedicacaoHora(){
let totalSim=0
let totalNao=0
document.querySelectorAll("#listaMedicacoesHora .itemHora").forEach(el=>{
const cor=el.style.background
if(cor.includes("34,197,94") || cor.includes("#22c55e")){
totalSim++
}else{
totalNao++
}
})
const a=document.getElementById("countNaoMed")
const b=document.getElementById("countSimMed")
if(a)a.innerText=totalNao
if(b)b.innerText=totalSim
}
/* ====================================================
005 – CLICK MEDICAÇÃO (TEMPO REAL)
==================================================== */
function marcarMedicacaoHora(el){
/* alterna cor */
if(el.style.background.includes("22c55e") || el.style.background.includes("34,197,94")){
el.style.background="#fde047"
}else{
el.style.background="#22c55e"
}
/* 🔥 ATUALIZA CONTADOR IMEDIATO */
atualizarContadorMedicacaoHora()
}
/* ====================================================
006 – TOGGLE MEDICAÇÃO
==================================================== */
function toggleMedicacaoHora(el){

let status=el.getAttribute("data-status")

if(status==="sim"){
el.setAttribute("data-status","nao")
el.style.background="#fde047"
}else{
el.setAttribute("data-status","sim")
el.style.background="#22c55e"
}

/* 🔥 ATUALIZA CONTADOR NA HORA */
atualizarContadorMedicacaoHora()

}
/* ====================================================
007 – CONTADOR REAL
==================================================== */
function atualizarContadorMedicacaoHora(){

let totalSim=0
let totalNao=0

document.querySelectorAll("#listaMedicacoesHora .itemHora").forEach(el=>{
let status=el.getAttribute("data-status")
if(status==="sim"){
totalSim++
}else{
totalNao++
}
})

const a=document.getElementById("countNaoMed")
const b=document.getElementById("countSimMed")

if(a)a.innerText=totalNao
if(b)b.innerText=totalSim

}
