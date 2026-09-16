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
    if(menu)menu.addEventListener('click',()=>setTimeout(marcarAtivo,80));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar); else iniciar();
})();
