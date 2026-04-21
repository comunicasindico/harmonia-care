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
002 – RENDER POR HORA (PADRÃO IGUAL MEDICAÇÃO)
==================================================== */
function renderizarMedicacoesHora(lista){

const div=document.getElementById("listaMedicacoesHora")
if(!div)return
if(!lista)lista=[]

const dataHoje=obterDataAtiva()

/* 🔥 MAPA EXEC IGUAL AO MEDICAÇÃO */
let mapaExec={}
;(window.EXEC_CACHE||[]).forEach(e=>{
let chave=e.data+"_"+e.medicacao_id+"_"+e.horario
mapaExec[chave]=e
})

let totalSim=0
let totalNao=0
let html=""
let agrupado={}

/* 🔥 NORMALIZAÇÃO PADRÃO */
const normalizarHora=h=>{
if(!h)return""
h=h.toString().trim()
if(!h.includes(":"))return h.padStart(2,"0")+":00"
let[p,m]=h.split(":")
return p.padStart(2,"0")+":"+m.padStart(2,"0")
}

/* 🔥 AGRUPAMENTO POR HORA */
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

/* 🔥 CHAVE IGUAL AO MEDICAÇÃO */
let chave=dataHoje+"_"+m.id+"_"+h
let exec=mapaExec[chave]

let cor="#fde047"

/* 🔥 CONTAGEM CORRETA */
if(exec){
cor="#22c55e"
totalSim++
}else{
totalNao++
}

html+=`<div style="background:${cor};padding:10px;border-radius:10px;margin-bottom:6px;font-weight:500">
${m.nome_paciente} - ${m.nome_medicamento}
</div>`

})

html+=`</div>`

})

div.innerHTML=html

/* 🔥 CONTADOR IGUAL AO MEDICAÇÃO */
const a=document.getElementById("countNaoMed")
const b=document.getElementById("countSimMed")

if(a)a.innerText=totalNao
if(b)b.innerText=totalSim

console.log("CONTADOR HORA:",totalNao,totalSim)
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
