/* Ficha clínica do paciente: edição individual com confirmação do salvamento. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const booleans=[['has','HAS · hipertensão arterial'],['dm','DM · diabetes mellitus'],['da','Demência'],['cardiopatia','Cardiopatia'],['acamado','Acamado']];
const fields=['data_nascimento',...booleans.map(x=>x[0]),'outras_comorbidades','pressao_arterial','dieta_texto','dieta_especial'];
const boolFields=new Set([...booleans.map(x=>x[0]),'dieta_especial']);
const columns=['id','empresa_id','nome_completo','ativo','grau_risco',...fields].join(',');
const state={patients:[],record:null,initial:{},busy:false,loading:false,request:0,actor:null,company:null};
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
function allowed(){
  if(!localStorage.getItem('usuario_id')||!localStorage.getItem('empresa_id'))return false;
  if(Number(localStorage.getItem('usuario_hierarquia'))===1)return true;
  return typeof window.pode==='function'&&window.pode('editar_clinico')===true;
}
function current(){return Object.fromEntries(fields.map(key=>[key,$('ce_'+key).value]));}
function dirty(){return !!state.record&&fields.some(key=>$('ce_'+key).value!==state.initial[key]);}
function message(text,error=false){$('ceMessage').textContent=text;$('ceMessage').dataset.error=String(error);}
function lock(){
  $('ceFields').disabled=state.busy||state.loading;
  $('cePatient').disabled=state.busy;
  $('ceSave').disabled=state.busy||state.loading||!state.record;
  $('ceClose').disabled=state.busy;
  $('ceCancel').disabled=state.busy;
  $('ceSave').textContent=state.busy?'Salvando…':'Salvar alterações';
}
function updateAge(){const value=window.calcularIdade($('ce_data_nascimento').value);$('ceAge').textContent=value===''?'Idade não informada':`${value} anos`;}
function setup(){
  if($('clinPacienteEditor'))return;
  const dialog=document.createElement('dialog');
  dialog.id='clinPacienteEditor';
  dialog.setAttribute('aria-labelledby','ceTitle');
  const yesNo='<option value="">Não informado</option><option value="true">Sim</option><option value="false">Não</option>';
  dialog.innerHTML=`<form id="ceForm">
    <header class="ce-heading"><div><small>HARMONIA CARE · FICHA CLÍNICA</small><h2 id="ceTitle">Editar paciente</h2></div><button id="ceClose" type="button" aria-label="Fechar ficha do paciente">✕</button></header>
    <div class="ce-content"><label class="ce-patient-label">Paciente<select id="cePatient"><option value="">Selecione um paciente…</option></select></label>
    <div id="ceMessage" role="status" aria-live="polite"></div>
    <fieldset id="ceFields" hidden>
      <div class="ce-grid"><label>Data de nascimento<input id="ce_data_nascimento" type="date"><output id="ceAge"></output></label></div>
      <h3>Comorbidades e condições clínicas</h3>
      <div class="ce-grid">${booleans.map(([key,label])=>`<label>${label}<select id="ce_${key}">${yesNo}</select></label>`).join('')}</div>
      <label class="ce-wide">Outras comorbidades<textarea id="ce_outras_comorbidades" rows="3" maxlength="4000" placeholder="Outras condições e observações clínicas"></textarea></label>
      <h3>Dados complementares</h3>
      <div class="ce-grid"><label>Pressão arterial<input id="ce_pressao_arterial" maxlength="30" placeholder="Ex.: 120/80"></label><label>Grau de risco<input id="ce_grau_risco" readonly aria-readonly="true"><small>Calculado pelo sistema ao salvar.</small></label><label>Dieta especial<select id="ce_dieta_especial">${yesNo}</select></label><label class="ce-wide">Dieta / consistência<input id="ce_dieta_texto" list="ceDietas" maxlength="250" placeholder="Dieta registrada para o paciente"><datalist id="ceDietas"><option value="Livre"><option value="Hipossódica"><option value="Diabética"><option value="Pastosa"><option value="Líquida"><option value="Vegetariana"></datalist></label></div>
    </fieldset></div>
    <footer class="ce-footer"><button id="ceCancel" type="button">Fechar</button><button id="ceSave" type="submit">Salvar alterações</button></footer>
  </form>`;
  document.body.appendChild(dialog);
  $('ce_data_nascimento').max=today();
  $('ce_data_nascimento').oninput=updateAge;
  $('ceClose').onclick=close;
  $('ceCancel').onclick=close;
  $('ceForm').onsubmit=e=>{e.preventDefault();return save();};
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  $('cePatient').onchange=()=>{
    if(dirty()&&!confirm('Descartar as alterações não salvas deste paciente?')){$('cePatient').value=state.record.id;return;}
    load($('cePatient').value);
  };
  $('ceFields').addEventListener('input',()=>message('Alterações pendentes. Clique em Salvar alterações para confirmar.'));
  $('ceFields').addEventListener('change',()=>message('Alterações pendentes. Clique em Salvar alterações para confirmar.'));
  window.addEventListener('beforeunload',e=>{if(dirty()){e.preventDefault();e.returnValue='';}});
}
function close(){
  if(state.busy)return;
  if(dirty()&&!confirm('Descartar as alterações não salvas deste paciente?'))return;
  ++state.request;state.loading=false;state.record=null;
  $('clinPacienteEditor').close();
}
function fill(record){
  state.record=record;
  fields.forEach(key=>{$('ce_'+key).value=record[key]===null||record[key]===undefined?'':String(record[key]);});
  $('ce_grau_risco').value=record.grau_risco??'';
  state.initial=current();
  $('ceTitle').textContent=record.nome_completo;
  $('ceFields').hidden=false;
  updateAge();
}
async function load(id){
  const request=++state.request;
  state.record=null;$('ceFields').hidden=true;$('ceTitle').textContent='Editar paciente';
  if(!id){state.loading=false;lock();message('Selecione um paciente para visualizar e editar sua ficha.');return;}
  if(!state.patients.some(p=>String(p.id)===id)){state.loading=false;lock();message('Paciente não disponível nesta lista.',true);return;}
  state.loading=true;lock();message('Carregando ficha…');
  try{
    const {data,error}=await window.db.from('pacientes').select(columns).eq('id',id).eq('empresa_id',state.company).eq('ativo',true).single();
    if(request!==state.request)return;
    if(error)throw error;
    if(!data)throw new Error('Paciente não encontrado.');
    fill(data);message('Edite os campos e confirme em Salvar alterações.');
  }catch(e){if(request===state.request)message('Não foi possível abrir a ficha: '+e.message,true);}
  finally{if(request===state.request){state.loading=false;lock();}}
}
async function open(id){
  if(!allowed()){alert('A edição do cadastro clínico requer permissão de gestão.');return;}
  if(!window.db){alert('A conexão ainda está carregando. Tente novamente.');return;}
  setup();
  $('ce_data_nascimento').max=today();
  if(state.busy)return;
  if(dirty()&&!confirm('Descartar as alterações não salvas deste paciente?'))return;
  state.record=null;state.company=localStorage.getItem('empresa_id');state.actor=localStorage.getItem('usuario_id');
  if(!state.patients.length&&typeof window.carregarClinico==='function')await window.carregarClinico();
  $('cePatient').replaceChildren(new Option('Selecione um paciente…',''),...state.patients.map(p=>new Option(p.nome_completo,String(p.id))));
  const selected=state.patients.some(p=>String(p.id)===id)?id:'';
  $('cePatient').value=selected;
  if(!$('clinPacienteEditor').open)$('clinPacienteEditor').showModal();
  await load(selected);
}
function patch(){
  const values=current(),data={};
  const birthday=values.data_nascimento;
  if(birthday&&(birthday>today()||window.calcularIdade(birthday)===''))throw new Error('Informe uma data de nascimento válida, até a data de hoje.');
  fields.forEach(key=>{
    if(values[key]===state.initial[key])return;
    const value=values[key];
    data[key]=value===''?null:boolFields.has(key)?value==='true':value.trim();
    if(typeof data[key]==='string'&&!data[key])data[key]=null;
  });
  return data;
}
async function save(){
  if(state.busy||state.loading||!state.record)return;
  if(!allowed()||localStorage.getItem('usuario_id')!==state.actor||localStorage.getItem('empresa_id')!==state.company){message('Sua sessão mudou. Feche a ficha e entre novamente.',true);return;}
  if(!$('ceForm').reportValidity())return;
  let data;
  try{data=patch();}catch(e){message(e.message,true);return;}
  if(!Object.keys(data).length){message('Nenhuma alteração para salvar.');return;}
  state.busy=true;lock();message('Salvando ficha…');
  try{
    let query=window.db.from('pacientes').update(data).eq('id',state.record.id).eq('empresa_id',state.company).eq('ativo',true);
    // Compare somente os campos alterados para não sobrescrever outra edição.
    for(const key of Object.keys(data))query=state.record[key]===null||state.record[key]===undefined?query.is(key,null):query.eq(key,state.record[key]);
    const result=await query.select(columns).maybeSingle();
    if(result.error)throw result.error;
    if(!result.data)throw new Error('O cadastro mudou ou não está disponível para edição. Feche e abra a ficha novamente para conferir os dados atuais.');
    fill(result.data);
    message('Dados salvos. A idade e o quadro clínico foram atualizados.');
    try{
      await window.carregarClinico();
      const selected=$('buscaPaciente')?.value;
      if(selected===state.record.id&&typeof window.carregarDadosClinicosPaciente==='function')await window.carregarDadosClinicosPaciente(selected);
    }catch(e){message('Dados salvos. Atualize o painel para recarregar a lista.');}
  }catch(e){message('Não foi possível salvar: '+e.message,true);}
  finally{state.busy=false;lock();}
}
window.HarmoniaPaciente={open,save,allowed,isOpen:()=>!!$('clinPacienteEditor')?.open,setPatients:patients=>{state.patients=patients;}};
})();
