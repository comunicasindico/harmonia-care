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
002 – RENDER POR HORA (CONTAGEM VISUAL SIMPLES)
==================================================== */
function renderizarMedicacoesHora(lista){
const div=document.getElementById("listaMedicacoesHora")
if(!div)return
if(!lista)lista=[]
let html=""
let agrupado={}
const normalizarHora=h=>{
if(!h)return""
h=h.toString().trim()
if(!h.includes(":"))return h.padStart(2,"0")+":00"
let[p,m]=h.split(":")
return p.padStart(2,"0")+":"+m.padStart(2,"0")
}
/* 🔥 AGRUPAR */
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
html+=`<div style="margin-bottom:12px"><div style="font-weight:bold;margin-bottom:6px">⏰ ${h}</div>`
agrupado[h].forEach(m=>{
/* 🔥 DEFINE COR APENAS VISUAL (SEM CACHE) */
let cor="#fde047"
/* 🔥 REGRA SIMPLES: se já tiver execução salva */
const execExiste=(window.EXEC_CACHE||[]).some(e=>String(e.medicacao_id)===String(m.id)&&normalizarHora(e.horario)===h&&String(e.data)===String(obterDataAtiva()))
if(execExiste){cor="#22c55e"}
html+=`<div class="itemHora" 
onclick="marcarMedicacaoHora(this)"
style="background:${cor};padding:10px;border-radius:10px;margin-bottom:6px;font-weight:500;cursor:pointer">
${m.nome_paciente} - ${m.nome_medicamento}
</div>`
})
html+=`</div>`
})
div.innerHTML=html
/* 🔥 CONTAGEM VISUAL REAL (DOM) */
let totalSim=0
let totalNao=0
document.querySelectorAll("#listaMedicacoesHora .itemHora").forEach(el=>{
let cor=el.getAttribute("data-cor")
if(cor==="#22c55e"){totalSim++}else{totalNao++}
})
const a=document.getElementById("countNaoMed")
const b=document.getElementById("countSimMed")
if(a)a.innerText=totalNao
if(b)b.innerText=totalSim
console.log("CONTADOR VISUAL:",totalNao,totalSim)
atualizarContadorMedicacaoHora()
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
