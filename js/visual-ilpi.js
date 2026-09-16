(function(){
  "use strict";

  if(window.__HC_VISUAL_ILPI__) return;
  window.__HC_VISUAL_ILPI__ = true;

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
    if(!caixa || caixa.querySelector(".hc-login-subtitle"))return;

    const sub=document.createElement("div");
    sub.className="hc-login-subtitle";
    sub.innerHTML=`
      <div style="font-weight:700">Gestão assistencial e operacional</div>
      <div>Instituição de Longa Permanência para Idosos</div>
    `;

    titulo.insertAdjacentElement("afterend",sub);
  }

  function ajustarBotoes(){
    Object.entries(nomes).forEach(([id,nome])=>{
      const el=document.getElementById(id);
      if(el)el.textContent=nome;
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

    document.querySelectorAll("#topoBotoes button")
      .forEach(b=>b.classList.remove("ativo"));

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

    if(!topo || !titulo)return;

    titulo.textContent="HARMONIA CARE";

    const pai=titulo.parentElement;

    if(pai && !pai.querySelector(".hc-brand-kicker")){
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

    if(nome){
      chip.textContent="● "+nome;
      if(!area.contains(chip))area.appendChild(chip);
    }

    const sair=topo.querySelector(".btn-sair,#btnSair,button[onclick*='logout']");

    if(sair && !area.contains(sair)){
      area.appendChild(sair);
    }
  }

  function moverIndicadoresTopo(){
    const area=criarAreaTopoDireita();
    const app=document.getElementById("app");

    if(!area || !app)return;

    let wrap=document.getElementById("hcTopKpis");

    if(!wrap){
      wrap=document.createElement("div");
      wrap.id="hcTopKpis";
      wrap.className="hc-top-kpis";
    }

    if(wrap.children.length<3){
      const candidatos=[...app.querySelectorAll("div,span")].filter(el=>{
        if(el.children.length>2)return false;

        const t=texto(el);

        return (
          t==="141" ||
          t==="0" ||
          t==="⚠ 0" ||
          t==="⚠0" ||
          t==="△ 0" ||
          t==="△0"
        );
      });

      const unicos=[];

      for(const el of candidatos){
        if(unicos.some(x=>x.contains(el)||el.contains(x)))continue;
        unicos.push(el);
        if(unicos.length===3)break;
      }

      if(unicos.length===3){
        unicos.forEach(el=>wrap.appendChild(el));
      }
    }

    if(wrap.children.length===3 && !area.contains(wrap)){
      area.insertBefore(wrap,area.firstChild);
    }
  }

  function moverTurnosLegenda(){
    const painel=document.getElementById("painelEnfermagem");
    if(!painel)return;

    const turnos=painel.querySelector(".turnos");
    if(!turnos)return;

    const legenda=[...painel.querySelectorAll("div,p,small,strong")]
      .find(el=>texto(el).startsWith("Legenda:"));

    if(!legenda)return;

    let wrap=document.getElementById("hcLegendaTurnos");

    if(!wrap){
      wrap=document.createElement("div");
      wrap.id="hcLegendaTurnos";
      wrap.className="hc-legenda-turnos";

      legenda.parentNode.insertBefore(wrap,legenda);
    }

    if(!wrap.contains(legenda))wrap.appendChild(legenda);
    if(!wrap.contains(turnos))wrap.appendChild(turnos);
  }

  function alinharProgresso(){
    const tabelas=[
      ...document.querySelectorAll("#painelEnfermagem table")
    ];

    const tabela=tabelas.find(t=>{
      const ttxt=texto(t);
      return ttxt.includes("Paciente") &&
             ttxt.includes("Progresso") &&
             ttxt.includes("Rotinas");
    });

    if(!tabela)return;

    tabela.querySelectorAll("tbody tr").forEach(tr=>{
      const tds=tr.querySelectorAll("td");
      if(tds.length<2)return;

      const td=tds[1];
      const bruto=texto(td);

      const match=bruto.match(/(\d+%\s*\(\d+\/\d+\))/);

      if(!match)return;

      if(td.querySelector(".hc-progresso-inline")){
        const txt=td.querySelector(".hc-progresso-texto");
        if(txt)txt.textContent=match[1];
        return;
      }

      td.innerHTML=`
        <div class="hc-progresso-inline">
          <span class="hc-progresso-texto">${match[1]}</span>
          <span class="hc-progresso-check">✓</span>
        </div>
      `;
    });
  }

  function aplicarTudo(){
    ajustarLogin();
    ajustarTopo();
    ajustarBotoes();
    marcarAtivo();
    moverIndicadoresTopo();
    moverTurnosLegenda();
    alinharProgresso();
  }

  function iniciar(){
    aplicarTudo();

    const menu=document.getElementById("topoBotoes");

    if(menu){
      menu.addEventListener("click",()=>{
        setTimeout(aplicarTudo,150);
        setTimeout(aplicarTudo,500);
      });
    }

    setInterval(aplicarTudo,1000);
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",iniciar,{once:true});
  }else{
    iniciar();
  }

})();
