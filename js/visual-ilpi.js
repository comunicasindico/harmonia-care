(function(){
"use strict";
if(window.__HC_VISUAL_ILPI_V3__)return;
window.__HC_VISUAL_ILPI_V3__=true;
const nomes={
btnEnfermagem:"🩺 Painel Enfermagem",
btnClinico:"🧑‍⚕️ Painel Clínico",
btnMedicacao:"💊 Medicação",
btnMedicacaoHora:"⏰ Medicação p/Hora",
btnAdmin:"⚙️ Admin",
btnGerarPDF:"📄 Gerar PDF",
btnPDFPaciente:"👤 PDF do Paciente",
btnPDFMedicacaoPaciente:"📋 PDF Paciente Medicação",
btnPDFMedicacaoGeral:"📚 PDF Geral Medicação",
btnBackup:"💾 Backup Completo",
btnPendentesTodos:"✓ Pendentes"
};
function texto(el){
return String(el?.textContent||"").replace(/\s+/g," ").trim();
}
function ajustarLogin(){
const titulo=document.querySelector(".titulo-login-topo");
if(!titulo)return;
titulo.textContent="Harmonia Care";
const caixa=titulo.closest(".login-box,.login-card");
if(!caixa||caixa.querySelector(".hc-login-subtitle"))return;
const sub=document.createElement("div");
sub.className="hc-login-subtitle";
sub.innerHTML='<div style="font-weight:700">Gestão assistencial e operacional</div><div>Instituição de Longa Permanência para Idosos</div>';
titulo.insertAdjacentElement("afterend",sub);
}
function ajustarBotoes(){
Object.entries(nomes).forEach(([id,nome])=>{
const el=document.getElementById(id);
if(el&&el.textContent!==nome)el.textContent=nome;
});
}
function marcarAtivo(){
const painel=localStorage.getItem("painelAtual")||"painelEnfermagem";
const mapa={
painelEnfermagem:"btnEnfermagem",
painelClinico:"btnClinico",
painelMedicacao:"btnMedicacao",
painelMedicacaoHora:"btnMedicacaoHora",
painelAdmin:"btnAdmin"
};
document.querySelectorAll("#topoBotoes button").forEach(b=>b.classList.remove("ativo"));
const ativo=document.getElementById(mapa[painel]);
if(ativo)ativo.classList.add("ativo");
}
function criarAreaTopoDireita(){
const topo=document.querySelector(".topo-sistema");
if(!topo)return null;
let area=topo.querySelector(".hc-top-right");
if(!area){
area=document.createElement("div");
area.className="hc-top-right";
topo.appendChild(area);
}
return area;
}
function ajustarTopo(){
const topo=document.querySelector(".topo-sistema");
const titulo=document.querySelector(".topo-sistema .titulo-3d");
if(!topo||!titulo)return;
titulo.textContent="HARMONIA CARE";
const pai=titulo.parentElement;
if(pai&&!pai.querySelector(".hc-brand-kicker")){
const kicker=document.createElement("span");
kicker.className="hc-brand-kicker";
kicker.textContent="Gestão Assistencial • ILPI";
pai.insertBefore(kicker,titulo);
pai.classList.add("hc-brand-stack");
}
const area=criarAreaTopoDireita();
if(!area)return;
let chip=topo.querySelector(".hc-user-chip");
if(!chip){
chip=document.createElement("div");
chip.className="hc-user-chip";
}
const nome=localStorage.getItem("usuario_nome");
if(nome)chip.textContent="● "+nome;
if(!area.contains(chip))area.appendChild(chip);
const sair=topo.querySelector(".btn-sair,#btnSair,button[onclick*='logout']");
if(sair&&!area.contains(sair))area.appendChild(sair);
}
function localizarIndicadoresOriginais(){
let marcados=[...document.querySelectorAll("[data-hc-kpi-original='1']")];
if(marcados.length>=3)return marcados.slice(0,3);
const app=document.getElementById("app");
if(!app)return[];
const paineis="#painelEnfermagem,#painelClinico,#painelMedicacao,#painelMedicacaoHora,#painelAdmin";
const candidatos=[...app.querySelectorAll("div,span")].filter(el=>{
if(el.closest(".topo-sistema"))return false;
if(el.closest("#topoBotoes"))return false;
if(el.closest(paineis))return false;
if(el.closest("#hcTopKpis"))return false;
const t=texto(el);
if(!/^(?:\d+|⚠\s*\d+|△\s*\d+|Δ\s*\d+)$/.test(t))return false;
const r=el.getBoundingClientRect();
if(r.width<30||r.width>140||r.height<28||r.height>90)return false;
return true;
});
candidatos.sort((a,b)=>{
const ra=a.getBoundingClientRect();
const rb=b.getBoundingClientRect();
if(Math.abs(ra.top-rb.top)>10)return ra.top-rb.top;
return ra.left-rb.left;
});
for(let i=0;i<candidatos.length;i++){
const base=candidatos[i].getBoundingClientRect();
const linha=candidatos.filter(el=>Math.abs(el.getBoundingClientRect().top-base.top)<15);
if(linha.length>=3){
const encontrados=linha.slice(0,3);
encontrados.forEach(el=>el.dataset.hcKpiOriginal="1");
return encontrados;
}
}
return[];
}
function atualizarIndicadoresTopo(){
const area=criarAreaTopoDireita();
if(!area)return;
const chip=area.querySelector(".hc-user-chip");
const sair=area.querySelector(".btn-sair,#btnSair,button[onclick*='logout']");
const fontes=localizarIndicadoresOriginais();
if(fontes.length<3)return;
let wrap=document.getElementById("hcTopKpis");
if(!wrap){
wrap=document.createElement("div");
wrap.id="hcTopKpis";
wrap.className="hc-top-kpis";
}
const valores=fontes.map(el=>texto(el));
if(wrap.children.length!==3){
wrap.innerHTML='<span class="hc-kpi hc-kpi-verde"></span><span class="hc-kpi hc-kpi-laranja"></span><span class="hc-kpi hc-kpi-vermelho"></span>';
}
[...wrap.children].forEach((el,i)=>el.textContent=valores[i]||"0");
const pais=[...new Set(fontes.map(el=>el.parentElement).filter(Boolean))];
if(pais.length===1)pais[0].style.display="none";
else fontes.forEach(el=>el.style.display="none");
if(!area.contains(wrap))area.appendChild(wrap);
if(chip&&chip.parentElement===area){
if(chip.nextSibling!==wrap){
area.insertBefore(wrap,chip.nextSibling);
}
}
if(sair&&sair.parentElement===area&&wrap.nextSibling!==sair){
area.insertBefore(sair,wrap.nextSibling);
}
}
function localizarLegenda(){
const painel=document.getElementById("painelEnfermagem");
if(!painel)return null;
const els=[...painel.querySelectorAll("div,p,small")];
return els.find(el=>{
const t=texto(el);
return t.startsWith("Legenda:")&&t.includes("1–Banho");
})||els.find(el=>texto(el).startsWith("Legenda:"));
}
function atualizarTurnosLegenda(){
const painel=document.getElementById("painelEnfermagem");
if(!painel)return;
const original=painel.querySelector(".turnos:not(.hc-turnos-clone)");
if(!original)return;
const legenda=localizarLegenda();
if(!legenda)return;
let wrap=document.getElementById("hcLegendaTurnos");
if(!wrap||!painel.contains(wrap)){
wrap=document.createElement("div");
wrap.id="hcLegendaTurnos";
wrap.className="hc-legenda-turnos";
legenda.parentNode.insertBefore(wrap,legenda);
wrap.appendChild(legenda);
}
let clone=wrap.querySelector(".hc-turnos-clone");
if(!clone){
clone=document.createElement("div");
clone.className="turnos hc-turnos-clone";
wrap.appendChild(clone);
}
const botoesOriginais=[...original.querySelectorAll("button,.turno-btn")];
if(!botoesOriginais.length)return;
const assinatura=botoesOriginais.map(b=>texto(b)).join("|");
if(clone.dataset.assinatura!==assinatura||clone.children.length!==botoesOriginais.length){
clone.innerHTML="";
botoesOriginais.forEach((btn,i)=>{
const novo=document.createElement("button");
novo.type="button";
novo.className=btn.className;
novo.textContent=texto(btn);
novo.title=texto(btn);
novo.dataset.indice=String(i);
novo.addEventListener("click",()=>{
const atual=document.querySelector("#painelEnfermagem .turnos:not(.hc-turnos-clone)");
const alvo=atual?[...atual.querySelectorAll("button,.turno-btn")][i]:null;
if(alvo)alvo.click();
setTimeout(aplicarTudo,50);
setTimeout(aplicarTudo,180);
});
clone.appendChild(novo);
});
clone.dataset.assinatura=assinatura;
}
const atuais=[...document.querySelectorAll("#painelEnfermagem .turnos:not(.hc-turnos-clone) button,#painelEnfermagem .turnos:not(.hc-turnos-clone) .turno-btn")];
[...clone.children].forEach((b,i)=>{
const origem=atuais[i];
if(!origem)return;
b.className=origem.className;
if(origem.classList.contains("turno-ativo"))b.classList.add("turno-ativo");
});
original.style.position="absolute";
original.style.left="-99999px";
original.style.width="1px";
original.style.height="1px";
original.style.overflow="hidden";
original.style.opacity="0";
original.style.pointerEvents="none";
}
function alinharProgresso(){
const tabelas=[...document.querySelectorAll("#painelEnfermagem table")];
const tabela=tabelas.find(t=>{
const ttxt=texto(t);
return ttxt.includes("Paciente")&&ttxt.includes("Progresso")&&ttxt.includes("Rotinas");
});
if(!tabela)return;
tabela.querySelectorAll("tbody tr").forEach(tr=>{
const tds=tr.querySelectorAll("td");
if(tds.length<2)return;
const td=tds[1];
const bruto=texto(td);
const match=bruto.match(/(\d+%\s*\(\d+\/\d+\))/);
if(!match)return;
let linha=td.querySelector(".hc-progresso-inline");
if(!linha){
td.innerHTML='<div class="hc-progresso-inline"><span class="hc-progresso-texto"></span><span class="hc-progresso-check">✓</span></div>';
linha=td.querySelector(".hc-progresso-inline");
}
const tx=linha.querySelector(".hc-progresso-texto");
if(tx)tx.textContent=match[1];
});
}
function aplicarTudo(){
ajustarLogin();
ajustarTopo();
ajustarBotoes();
marcarAtivo();
atualizarIndicadoresTopo();
atualizarTurnosLegenda();
alinharProgresso();
}
function iniciar(){
aplicarTudo();
const menu=document.getElementById("topoBotoes");
if(menu){
menu.addEventListener("click",()=>{
setTimeout(aplicarTudo,60);
setTimeout(aplicarTudo,220);
});
}
setInterval(aplicarTudo,700);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",iniciar,{once:true});
else iniciar();
})();
