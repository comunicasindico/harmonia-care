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
002 – RENDER POR HORA (CORRIGIDO DEFINITIVO)
==================================================== */
function renderizarMedicacoesHora(lista){
const div=document.getElementById("listaMedicacoesHora")
if(!div)return
if(!lista)lista=[]
const execLista=(window.EXEC_CACHE||[])
const dataHoje=obterDataAtiva()
const normalizarHora=h=>{
if(!h)return""
h=h.toString().trim()
if(!h.includes(":"))return h.padStart(2,"0")+":00"
let[p,m]=h.split(":")
return p.padStart(2,"0")+":"+m.padStart(2,"0")
}
let totalSim=0
let totalNao=0
let html=""
let agrupado={}
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
let exec=null
for(const e of execLista){
if(
String(e.data)===String(dataHoje) &&
normalizarHora(e.horario)===h &&
String(e.medicacao_id)===String(m.id)
){
exec=e
break
}
}
let cor="#fde047"
if(exec){
cor="#22c55e"
totalSim++
}else{
totalNao++
}
html+=`<div style="background:${cor};padding:10px;border-radius:10px;margin-bottom:6px;font-weight:500">${m.nome_paciente} - ${m.nome_medicamento}</div>`
})
html+=`</div>`
})
div.innerHTML=html
/* 🔥 CONTADOR CORRETO */
setTimeout(function(){
const a=document.getElementById("countNaoMed")
const b=document.getElementById("countSimMed")
if(a)a.innerText=totalNao
if(b)b.innerText=totalSim
},50)
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
