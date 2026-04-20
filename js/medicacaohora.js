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
}

/* ====================================================
002 – RENDER POR HORA
==================================================== */
function renderizarMedicacoesHora(lista){

const div=document.getElementById("listaMedicacoesHora")
if(!div)return

let mapa={}

/* 🔥 MONTA MAPA POR HORA */
lista.forEach(m=>{
let paciente=(m.nome_paciente||"Paciente").trim()
let horarios=(m.horarios||"").split("|")

horarios.forEach(h=>{
h=h.trim()
if(!h)return

if(!mapa[h])mapa[h]=[]

mapa[h].push({
paciente:paciente,
nome:m.nome_medicamento,
id:m.id
})

})
})

/* 🔥 ORDENA HORÁRIOS */
let horas=Object.keys(mapa).sort()

let html=""

/* ====================================================
003 – LOOP HORAS
==================================================== */
horas.forEach(h=>{

html+=`
<div style="background:#f1f5f9;padding:10px;border-radius:10px;margin-bottom:10px">

<div style="font-weight:bold;font-size:16px;margin-bottom:8px">
⏰ ${h}
</div>

<div style="display:flex;flex-direction:column;gap:6px">
`

mapa[h].forEach(item=>{

let chave=obterDataAtiva()+"_"+item.id+"_"+h
let exec=(window.EXEC_CACHE||[]).find(e=>e.data+"_"+e.medicacao_id+"_"+e.horario===chave)

let cor="#fde047"
let texto=`${item.paciente} - ${item.nome}`

if(exec){
cor="#22c55e"
texto=`${item.paciente} - ${item.nome} ✔`
}

html+=`
<button onclick="administrarMedicacao(${item.id},'${h}',this)"
style="background:${cor};border:none;border-radius:8px;padding:8px;text-align:left">
${texto}
</button>
`

})

html+=`</div></div>`
})

div.innerHTML=html
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
