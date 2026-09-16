/* Harmonia Care 2026 - camada aditiva segura */
(function(){
  'use strict';
  if(window.__HC2026__) return;
  window.__HC2026__=true;

  const qs=(s,p=document)=>p.querySelector(s);
  const qsa=(s,p=document)=>[...p.querySelectorAll(s)];
  const esc=(v='')=>String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

  function injectStyles(){
    if(qs('#hc2026-style'))return;
    const st=document.createElement('style');
    st.id='hc2026-style';
    st.textContent=`
      :root{--hc-primary:#0f766e;--hc-primary-2:#14b8a6;--hc-surface:rgba(255,255,255,.95);--hc-border:#dbe7e6;--hc-text:#16302d;--hc-muted:#64748b}
      body{color:var(--hc-text)}
      #app{max-width:1600px;padding:14px}
      .topo-sistema,.box,.card{background:var(--hc-surface)!important;border:1px solid var(--hc-border)!important;box-shadow:0 8px 24px rgba(15,118,110,.08)!important}
      #topoBotoes{gap:8px!important}.btn-primary,.btn-secondary,.btn-success,.btn-topo{box-shadow:0 3px 10px rgba(15,23,42,.12)!important;border-radius:10px!important}
      input,select,textarea{border:1px solid #cbd5e1;border-radius:9px;padding:8px;background:#fff;min-height:36px}
      input:focus,select:focus,textarea:focus{outline:2px solid rgba(20,184,166,.22);border-color:#14b8a6}
      #hcMedExtras{display:grid;grid-template-columns:repeat(3,minmax(180px,1fr));gap:10px;margin-top:10px;padding:12px;border:1px solid #dbe7e6;background:#f8fffe;border-radius:12px}
      #hcMedExtras .full{grid-column:1/-1}.hc-field label{display:block;font-size:11px;font-weight:700;color:#475569;margin:0 0 4px}
      .hc-chip{display:inline-flex;align-items:center;gap:5px;padding:3px 7px;border-radius:999px;font-size:10px;font-weight:800;margin:2px 4px 2px 0}
      .hc-chip.controlado{background:#fee2e2;color:#991b1b}.hc-chip.especial{background:#ede9fe;color:#5b21b6}.hc-chip.continuo{background:#dcfce7;color:#166534}.hc-chip.temporario{background:#fef3c7;color:#92400e}
      #painelVinculo{position:relative}.hc-admin-note{font-size:12px;color:#475569;background:#ecfeff;border:1px solid #a5f3fc;border-radius:9px;padding:8px 10px;margin:8px 0}
      #tabelaUsuarios{display:block;overflow-x:auto}.hc-nutri-badge{background:#ecfccb;color:#365314}
      @media(max-width:900px){#hcMedExtras{grid-template-columns:repeat(2,minmax(150px,1fr))}}
      @media(max-width:640px){#app{padding:7px}#hcMedExtras{grid-template-columns:1fr}.topo-sistema{gap:8px}.titulo-3d{font-size:20px}button{padding:8px 10px}.box{padding:9px!important}table{font-size:12px}th,td{padding:5px}}
    `;
    document.head.appendChild(st);
  }

  function ensureNutritionist(){
    const sel=qs('#u_perfil');
    if(sel && ![...sel.options].some(o=>/nutric/i.test(o.textContent))){
      const o=document.createElement('option');o.textContent='Nutricionista';sel.appendChild(o);
    }
  }

  function medExtrasMarkup(){
    return `
      <div id="hcMedExtras">
        <div class="hc-field"><label>Classificação</label><select id="hc_classificacao"><option value="comum">Comum</option><option value="controlado">Controlado</option><option value="controle_especial">Controle especial</option></select></div>
        <div class="hc-field"><label>Duração</label><select id="hc_duracao"><option value="continuo">Uso contínuo</option><option value="temporario">Uso temporário</option></select></div>
        <div class="hc-field"><label>Via</label><input id="hc_via" placeholder="Oral, tópica, IM, SC..."></div>
        <div class="hc-field"><label>Data início</label><input id="hc_inicio" type="date"></div>
        <div class="hc-field"><label>Data final</label><input id="hc_fim" type="date"></div>
        <div class="hc-field"><label>Dias de tratamento</label><input id="hc_dias" type="number" min="1" placeholder="Ex.: 7"></div>
        <div class="hc-field"><label>Frequência</label><input id="hc_frequencia" placeholder="Ex.: 8/8h, 1x/dia"></div>
        <div class="hc-field"><label>Prescritor</label><input id="hc_prescritor" placeholder="Nome do prescritor"></div>
        <div class="hc-field"><label>Validade da prescrição</label><input id="hc_validade" type="date"></div>
        <div class="hc-field"><label>Nº/Referência da prescrição</label><input id="hc_prescricao_numero" placeholder="CRM/receita/referência"></div>
        <div class="hc-field full"><label>Observações da prescrição</label><textarea id="hc_obs" rows="2" placeholder="Orientações, diluição, cuidados, suspensão, alergias..."></textarea></div>
      </div>`;
  }

  function ensureMedicationFields(){
    const box=qs('#painelMedicacao > div[style*="background:#fff"]');
    if(!box || qs('#hcMedExtras'))return;
    const wrap=document.createElement('div');wrap.innerHTML=medExtrasMarkup();box.appendChild(wrap.firstElementChild);
    const dur=qs('#hc_duracao'), fim=qs('#hc_fim'), dias=qs('#hc_dias'), inicio=qs('#hc_inicio');
    const sync=()=>{const temp=dur.value==='temporario';fim.disabled=!temp;dias.disabled=!temp;if(!temp){fim.value='';dias.value='';}};
    dur.addEventListener('change',sync);sync();
    dias.addEventListener('change',()=>{if(dias.value&&inicio.value){const d=new Date(inicio.value+'T00:00:00');d.setDate(d.getDate()+Math.max(0,Number(dias.value)-1));fim.value=d.toISOString().slice(0,10)}});
  }

  function getExtras(){return {
    classificacao_medicamento:qs('#hc_classificacao')?.value||'comum',duracao_tipo:qs('#hc_duracao')?.value||'continuo',data_inicio:qs('#hc_inicio')?.value||null,data_fim:qs('#hc_fim')?.value||null,dias_tratamento:Number(qs('#hc_dias')?.value)||null,via_administracao:qs('#hc_via')?.value?.trim()||null,frequencia:qs('#hc_frequencia')?.value?.trim()||null,observacoes:qs('#hc_obs')?.value?.trim()||null,prescritor:qs('#hc_prescritor')?.value?.trim()||null,prescricao_numero:qs('#hc_prescricao_numero')?.value?.trim()||null,prescricao_validade:qs('#hc_validade')?.value||null,status_tratamento:'ativo'
  }};

  function medicationActiveToday(m){
    const hoje=(qs('#dataInicioMedicacao')?.value)||new Date().toISOString().slice(0,10);
    if(m.status_tratamento && m.status_tratamento!=='ativo')return false;
    if(m.duracao_tipo==='temporario' && m.data_fim && hoje>m.data_fim)return false;
    if(m.data_inicio && hoje<m.data_inicio)return false;
    return true;
  }

  function decorateMedicationCards(){
    qsa('#listaMedicacoes [style*="font-weight:600"]').forEach(el=>{
      const card=el.closest('div[style*="border-radius:8px"]');if(!card||card.dataset.hcDecorated)return;
      const name=(el.textContent||'').trim().toLowerCase();
      const m=(window.MEDICACOES_CACHE||[]).find(x=>String(x.nome_medicamento||x.medicacoes_modelo?.nome_medicamento||'').trim().toLowerCase()===name);
      if(!m)return;card.dataset.hcDecorated='1';
      const line=document.createElement('div');line.style.marginTop='5px';
      const chips=[];
      if(m.classificacao_medicamento==='controlado')chips.push('<span class="hc-chip controlado">Controlado</span>');
      if(m.classificacao_medicamento==='controle_especial')chips.push('<span class="hc-chip especial">Controle especial</span>');
      if(m.duracao_tipo==='continuo')chips.push('<span class="hc-chip continuo">Uso contínuo</span>');
      if(m.duracao_tipo==='temporario')chips.push('<span class="hc-chip temporario">Uso temporário</span>');
      line.innerHTML=chips.join('')+(m.prescritor?`<div style="font-size:10px;color:#64748b;margin-top:3px">Prescritor: ${esc(m.prescritor)}</div>`:'');
      card.appendChild(line);
    });
  }

  function patchMedication(){
    const originalLoad=window.carregarMedicacoes;
    if(typeof originalLoad==='function'&&!originalLoad.__hc2026){
      const f=async function(){await originalLoad.apply(this,arguments);if(Array.isArray(window.MEDICACOES_CACHE)){window.MEDICACOES_CACHE=window.MEDICACOES_CACHE.filter(medicationActiveToday);if(typeof window.renderizarMedicacoes==='function')window.renderizarMedicacoes(window.MEDICACOES_CACHE)}setTimeout(decorateMedicationCards,60)};f.__hc2026=true;window.carregarMedicacoes=f;
    }
    const originalSave=window.salvarNovaMedicacao;
    if(typeof originalSave==='function'&&!originalSave.__hc2026){
      const f=async function(){
        if(!window.db||!window.EMPRESA_ID)return originalSave.apply(this,arguments);
        const pacienteId=qs('#buscaPacienteMedicacao')?.value;
        const nome=(qs('#nomeMedicacao')?.value||'').trim();
        const dose=(qs('#doseMedicacao')?.value||'').trim();
        const ativos=qsa('#horarioMedicacao .ativo').map(e=>e.dataset.valor).filter(Boolean);
        if(!nome||!pacienteId||pacienteId==='todos'||!ativos.length)return originalSave.apply(this,arguments);
        const extras=getExtras();
        const payload={nome_medicamento:nome.toUpperCase(),dosagem:dose.toUpperCase(),obrigatorio:qs('#obrigatorioMedicacao')?.value==='true',horarios:ativos.join('|'),empresa_id:window.EMPRESA_ID,paciente_id:pacienteId,ativo:true,...extras};
        const {error}=await window.db.from('medicacoes').insert(payload);
        if(error && /column|schema cache|does not exist/i.test(error.message||''))return originalSave.apply(this,arguments);
        if(error){console.error(error);alert('Erro ao salvar medicação: '+error.message);return;}
        qsa('#hcMedExtras input,#hcMedExtras textarea').forEach(x=>x.value='');qs('#hc_classificacao').value='comum';qs('#hc_duracao').value='continuo';
        alert('Medicação e prescrição salvas com sucesso');await window.carregarMedicacoes();
      };f.__hc2026=true;window.salvarNovaMedicacao=f;
    }
  }

  function patchAdmin(){
    ensureNutritionist();
    const originalInsert=window.inserirUsuario;
    if(typeof originalInsert==='function'&&!originalInsert.__hc2026){
      const f=async function(){
        const perfil=qs('#u_perfil')?.value||'';
        if(/nutric/i.test(perfil)){
          if(!window.db)return;
          const novo={empresa_id:window.EMPRESA_ID,nome:qs('#u_nome')?.value||'',nome_completo:qs('#u_nome')?.value||'',nome_apelido:qs('#u_apelido')?.value||'',email:qs('#u_email')?.value||'',perfil:'nutricionista',hierarquia:parseInt(qs('#u_hierarquia')?.value||5),senha_hash:qs('#u_senha')?.value||'',ativo:true};
          const {error}=await window.db.from('usuarios').insert([novo]);if(error){alert('Erro ao inserir: '+error.message);return;}alert('Nutricionista inserido com sucesso');return window.carregarUsuarios?.();
        }
        return originalInsert.apply(this,arguments);
      };f.__hc2026=true;window.inserirUsuario=f;
    }
    const originalLoad=window.carregarUsuarios;
    if(typeof originalLoad==='function'&&!originalLoad.__hc2026){
      const f=async function(){await originalLoad.apply(this,arguments);qsa('#tabelaUsuariosAdmin tr').forEach(tr=>{const td=tr.children[3];if(td&&!td.querySelector('select,input')&&td.textContent.trim().toLowerCase()==='nutricionista')td.innerHTML='<span class="hc-chip hc-nutri-badge">Nutricionista</span>'});};f.__hc2026=true;window.carregarUsuarios=f;
    }
    const painel=qs('#painelAdmin .box');
    if(painel&&!qs('.hc-admin-note',painel)){const d=document.createElement('div');d.className='hc-admin-note';d.textContent='Atribua pacientes pelo botão “Pacientes” de cada profissional. Cuidadores permanecem visíveis ao nível 1 e podem receber exatamente os pacientes autorizados.';painel.insertBefore(d,painel.children[1]||null)}
  }

  function boot(){injectStyles();ensureMedicationFields();patchMedication();patchAdmin();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0));else setTimeout(boot,0);
  window.addEventListener('load',()=>setTimeout(boot,200));
})();

