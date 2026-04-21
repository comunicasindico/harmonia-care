/* ====================================================
000 – ABRIR PAINEL MEDICAÇÃO POR HORA
==================================================== */
function abrirPainelMedicacaoHora(){
document.getElementById("painelMedicacao").style.display="none"
document.getElementById("painelMedicacaoHora").style.display="block"
carregarMedicacoesHora()
}

/* ====================================================
001 – CARREGAR MEDICAÇÕES (REAPROVEITA CACHE)
==================================================== */
async function carregarMedicacoesHora(){
if(!window.MEDICACOES_CACHE || !window.MEDICACOES_CACHE.length){
await carregarMedicacoes()
}
renderizarMedicacoesHora(window.MEDICACOES_CACHE||[])
setTimeout(atualizarLegendaMedicacao,100)
}

/* ====================================================
002 – RENDER POR HORA
==================================================== */
function renderizarMedicacoesHora(lista){
const div=document.getElementById("listaMedicacoesHora")
if(!div)return
if(!lista)lista=[]
let mapaExec={}
const execLista=(window.EXEC_CACHE||[])
execLista.forEach(e=>{
let chave=e.data+"_"+e.medicacao_id+"_"+e.horario
mapaExec[chave]=e
})
let totalSim=0
let totalNao=0
let html=""
let agrupado={}
lista.forEach(m=>{
let h=(m.horario||"").trim()
if(!agrupado[h])agrupado[h]=[]
agrupado[h].push(m)
})
let horarios=Object.keys(agrupado).sort()
horarios.forEach(h=>{
html+=`<div style="margin-bottom:10px"><div style="font-weight:bold;margin-bottom:6px">⏰ ${h}</div>`
agrupado[h].forEach(m=>{
let chave=(obterDataAtiva())+"_"+m.id+"_"+h
let exec=mapaExec[chave]
let cor="#fde047"
if(exec){
cor="#22c55e"
totalSim++
}else{
totalNao++
}
html+=`<div style="background:${cor};padding:8px;border-radius:8px;margin-bottom:6px">${m.nome_paciente} - ${m.nome_medicamento}</div>`
})
html+=`</div>`
})
div.innerHTML=html
/* 🔥 CONTADOR FUNCIONANDO */
setTimeout(function(){
const a=document.getElementById("countNaoMed")
const b=document.getElementById("countSimMed")
if(a)a.innerText=totalNao
if(b)b.innerText=totalSim
},100)
}
/* ====================================================
999 – GARANTIR BOTÃO MEDICAÇÃO POR HORA
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

function atualizarLegendaMedicacao(){
const itens=document.querySelectorAll("#listaMedicacoesHora .item-medicacao")
let medicado=0
let nao=0
itens.forEach(el=>{
if(el.classList.contains("ok")||el.classList.contains("medicado")){
medicado++
}else{
nao++
}
})
const c1=document.getElementById("countNao")
const c2=document.getElementById("countSim")
if(c1)c1.innerText=nao
if(c2)c2.innerText=medicado
}
const observer=new MutationObserver(()=>atualizarLegendaMedicacao())
const alvo=document.getElementById("listaMedicacoesHora")
if(alvo){
observer.observe(alvo,{childList:true,subtree:true})
}
