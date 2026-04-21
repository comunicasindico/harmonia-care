/* ====================================================
000 – ABRIR PAINEL MEDICAÇÃO POR HORA (SOMENTE LEITURA)
==================================================== */
function abrirPainelMedicacaoHora(){
document.getElementById("painelMedicacao").style.display="none"
document.getElementById("painelMedicacaoHora").style.display="block"

carregarMedicacoesHora()

/* 🔥 FORÇA ESPELHO DO CONTADOR */
setTimeout(()=>{
const origemNao=document.getElementById("countNaoMed")
const origemSim=document.getElementById("countSimMed")

const destinoNao=document.getElementById("countNaoMedHora")
const destinoSim=document.getElementById("countSimMedHora")

if(origemNao && destinoNao)destinoNao.innerText=origemNao.innerText
if(origemSim && destinoSim)destinoSim.innerText=origemSim.innerText
},100)
}

/* ====================================================
001 – CARREGAR MEDICAÇÕES
==================================================== */
async function carregarMedicacoesHora(){

/* garante cache atualizado */
await carregarStatusMedicacoes()

if(!window.MEDICACOES_CACHE || !window.MEDICACOES_CACHE.length){
await carregarMedicacoes()
}

renderizarMedicacoesHora(window.MEDICACOES_CACHE||[])
}
/* ====================================================002 – RENDER POR HORA (REFLEXO REAL DO BANCO)==================================================== */
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
const normalizarHora=h=>{if(!h)return"";h=h.toString().trim();if(!h.includes(":"))return h.padStart(2,"0")+":00";let[p,m]=h.split(":");return p.padStart(2,"0")+":"+m.padStart(2,"0")}
lista.forEach(m=>{let horarios=(m.horarios||"").split("|");horarios.forEach(h=>{h=normalizarHora(h);if(!h)return;if(!agrupado[h])agrupado[h]=[];agrupado[h].push(m)})})
let horariosOrdenados=Object.keys(agrupado).sort()
horariosOrdenados.forEach(h=>{
html+=`<div style="margin-bottom:12px"><div style="font-weight:bold;margin-bottom:6px">⏰ ${h}</div>`
const listaOrdenada=agrupado[h].slice().sort((a,b)=>{let na=(a.nome_paciente||"").toLowerCase().trim();let nb=(b.nome_paciente||"").toLowerCase().trim();return na.localeCompare(nb,"pt-BR")})
html+=`<div style="display:grid;grid-template-columns:50% 50%;gap:6px;margin-bottom:6px;font-weight:600;font-size:12px;padding:4px 6px"><div>Paciente</div><div>Medicação</div></div>`
listaOrdenada.forEach(m=>{
let executado=false
for(const e of execLista){
if(String(e.data)===String(dataHoje)&&String(e.medicacao_id)===String(m.id)&&normalizarHora(e.horario)===h){executado=true;break}
}
let cor="#fde047"
if(executado){cor="#22c55e";totalSim++}else{totalNao++}
html+=`<div style="display:grid;grid-template-columns:50% 50%;gap:6px;background:${cor};padding:10px;border-radius:10px;margin-bottom:6px;font-weight:500;align-items:center"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.nome_paciente||"-"}</div><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.nome_medicamento||"-"}</div></div>`
})
html+=`</div>`
})
div.innerHTML=html
const a=document.getElementById("countNaoMed")
const b=document.getElementById("countSimMed")
if(a)a.innerText=totalNao
if(b)b.innerText=totalSim
console.log("MEDICAÇÃO HORA OK",totalNao,totalSim)
}
/* ====================================================
003 – BOTÃO
==================================================== */
function garantirBotaoMedicacaoHora(){

const topo=document.getElementById("topoBotoes")
if(!topo)return
if(document.getElementById("btnMedicacaoHora"))return

const btn=document.createElement("button")
btn.id="btnMedicacaoHora"
btn.className="btn-secondary"
btn.innerHTML="⏰ Medicação p/Hora"
btn.onclick=abrirPainelMedicacaoHora

topo.appendChild(btn)
}

window.addEventListener("load",garantirBotaoMedicacaoHora)
