(function(){
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

  function ajustarLogin(){
    const titulo=document.querySelector('.titulo-login-topo');
    if(!titulo)return;
    titulo.textContent='Harmonia Care';
    const caixa=titulo.closest('.login-box,.login-card');
    if(!caixa || caixa.querySelector('.hc-login-subtitle'))return;
    const sub=document.createElement('div');
    sub.className='hc-login-subtitle';
    const l1=document.createElement('div');
    l1.textContent='Gestão assistencial e operacional';
    l1.style.fontWeight='700';
    const l2=document.createElement('div');
    l2.textContent='Instituição de Longa Permanência para Idosos';
    sub.appendChild(l1);
    sub.appendChild(l2);
    titulo.insertAdjacentElement('afterend',sub);
  }

  function ajustarTopo(){
    const topo=document.querySelector('.topo-sistema');
    const titulo=document.querySelector('.topo-sistema .titulo-3d');
    if(!topo || !titulo)return;
    titulo.textContent='HARMONIA CARE';
    const pai=titulo.parentElement;
    if(pai && !pai.querySelector('.hc-brand-kicker')){
      const kicker=document.createElement('span');
      kicker.className='hc-brand-kicker';
      kicker.textContent='Gestão Assistencial • ILPI';
      pai.insertBefore(kicker,titulo);
      pai.classList.add('hc-brand-stack');
    }
    if(!topo.querySelector('.hc-user-chip')){
      const nome=localStorage.getItem('usuario_nome');
      if(nome){
        const chip=document.createElement('div');
        chip.className='hc-user-chip';
        chip.textContent='● '+nome;
        const sair=topo.querySelector('.btn-sair');
        if(sair)topo.insertBefore(chip,sair); else topo.appendChild(chip);
      }
    }
  }

  function ajustarBotoes(){
    Object.entries(nomes).forEach(([id,texto])=>{
      const el=document.getElementById(id);
      if(el)el.textContent=texto;
    });
  }

  function marcarAtivo(){
    const painel=localStorage.getItem('painelAtual')||'painelEnfermagem';
    const mapa={painelEnfermagem:'btnEnfermagem',painelClinico:'btnClinico',painelMedicacao:'btnMedicacao',painelMedicacaoHora:'btnMedicacaoHora',painelAdmin:'btnAdmin'};
    document.querySelectorAll('#topoBotoes button').forEach(b=>b.classList.remove('ativo'));
    const id=mapa[painel];
    if(id){const el=document.getElementById(id);if(el)el.classList.add('ativo');}
  }

 function iniciar(){
  ajustarLogin();
  ajustarTopo();
  ajustarBotoes();
  marcarAtivo();

  const menu=document.getElementById('topoBotoes');

  if(menu){
    menu.addEventListener('click',()=>{
      setTimeout(marcarAtivo,80);
    });
  }
}
/* =========================================================
AJUSTES BÁSICOS DE LAYOUT
1. Move os indicadores 141 / 0 / 0 para o topo, ao lado do usuário
2. Move manhã / tarde / noite para a direita da legenda
3. Coloca o tique verde ao lado do 100% (3/3)
========================================================= */

function aplicarAjustesBasicosHarmonia(){
  moverIndicadoresParaTopo();
  moverTurnosParaDireitaDaLegenda();
  alinharTiqueComProgresso();
}

function moverIndicadoresParaTopo(){
  const topo = document.querySelector(".topo-sistema");
  const chip = document.querySelector(".hc-user-chip");
  const sair = document.querySelector(".btn-sair, #btnSair, button[onclick*='logout']");
  if(!topo || !chip) return;

  if(document.getElementById("hcTopKpis")) return;

  let kpis = null;

  const possiveisContainers = [
    "#cardsResumo",
    ".cards-resumo",
    ".resumo-cards",
    ".kpi-container",
    ".status-cards"
  ];

  for(const sel of possiveisContainers){
    const el = document.querySelector(sel);
    if(el && el.children.length >= 3){
      kpis = el;
      break;
    }
  }

  if(!kpis){
    const blocos = [...document.querySelectorAll("#app > div, #app > section")]
      .find(el => {
        const textos = el.innerText || "";
        return textos.includes("141") && textos.includes("0");
      });
    if(blocos) kpis = blocos;
  }

  if(!kpis) return;

  const itens = [...kpis.children].slice(0,3);
  if(!itens.length) return;

  const wrap = document.createElement("div");
  wrap.id = "hcTopKpis";
  wrap.className = "hc-top-kpis";

  itens.forEach(item => wrap.appendChild(item));

  const right = document.createElement("div");
  right.className = "hc-top-right";

  right.appendChild(wrap);
  right.appendChild(chip);

  if(sair) right.appendChild(sair);

  topo.appendChild(right);
}

function moverTurnosParaDireitaDaLegenda(){
  if(document.getElementById("hcLegendaTurnos")) return;

  const turnos = document.querySelector(".turnos");
  if(!turnos) return;

  const candidatos = [...document.querySelectorAll("#painelEnfermagem div, #painelEnfermagem p, #painelEnfermagem small")];
  const legenda = candidatos.find(el => (el.textContent || "").includes("Legenda:"));
  if(!legenda) return;

  const wrap = document.createElement("div");
  wrap.id = "hcLegendaTurnos";
  wrap.className = "hc-legenda-turnos";

  legenda.parentNode.insertBefore(wrap, legenda);
  wrap.appendChild(legenda);
  wrap.appendChild(turnos);
}

function alinharTiqueComProgresso(){
  const tabelas = [...document.querySelectorAll("table")];
  const tabela = tabelas.find(t => (t.innerText || "").includes("Progresso") && (t.innerText || "").includes("Rotinas"));
  if(!tabela) return;

  const linhas = tabela.querySelectorAll("tbody tr");
  linhas.forEach(tr => {
    const tds = tr.querySelectorAll("td");
    if(tds.length < 2) return;

    const tdProgresso = tds[1];
    if(tdProgresso.querySelector(".hc-progresso-inline")) return;

    const texto = [...tdProgresso.querySelectorAll("*")]
      .find(el => (el.textContent || "").includes("%"));

    const check = [...tdProgresso.querySelectorAll("*")]
      .find(el => {
        const tx = (el.textContent || "").trim();
        return tx === "✓" || tx === "✔" || tx === "✅";
      });

    if(!texto || !check) return;

    const wrap = document.createElement("div");
    wrap.className = "hc-progresso-inline";

    const txt = document.createElement("span");
    txt.className = "hc-progresso-texto";
    txt.textContent = texto.textContent.trim();

    const ok = document.createElement("span");
    ok.className = "hc-progresso-check";
    ok.textContent = "✓";

    wrap.appendChild(txt);
    wrap.appendChild(ok);

    tdProgresso.innerHTML = "";
    tdProgresso.appendChild(wrap);
  });
}
/* =========================================================
MANTÉM OS AJUSTES MESMO QUANDO OS PAINÉIS SÃO REDESENHADOS
========================================================= */

let hcAjustandoLayout = false;
let hcTimerLayout = null;

function manterAjustesHarmonia(){
  if(hcAjustandoLayout) return;

  clearTimeout(hcTimerLayout);

  hcTimerLayout = setTimeout(()=>{
    hcAjustandoLayout = true;

    try{
      aplicarAjustesBasicosHarmonia();
    }catch(e){
      console.error("Erro nos ajustes Harmonia:",e);
    }

    requestAnimationFrame(()=>{
      hcAjustandoLayout = false;
    });
  },80);
}

/* primeira aplicação */
if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", manterAjustesHarmonia, {once:true});
}else{
  manterAjustesHarmonia();
}

/* reaplica somente quando os painéis realmente mudarem */
const hcApp = document.getElementById("app");

if(hcApp){
  const hcObserver = new MutationObserver((mutacoes)=>{
    const houveMudanca = mutacoes.some(m =>
      m.type === "childList" &&
      (m.addedNodes.length > 0 || m.removedNodes.length > 0)
    );

    if(houveMudanca){
      manterAjustesHarmonia();
    }
  });

  hcObserver.observe(hcApp,{
    childList:true,
    subtree:true
  });
}

/* também reaplica ao trocar de painel */
const hcMenu = document.getElementById("topoBotoes");

if(hcMenu){
  hcMenu.addEventListener("click",()=>{
    setTimeout(manterAjustesHarmonia,150);
  });
}
