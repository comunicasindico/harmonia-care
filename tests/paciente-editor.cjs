// Exercita a edição individual sem utilizar dados reais de pacientes.
const {JSDOM}=require('jsdom');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'https://example.test',runScripts:'outside-only'});
const w=dom.window,d=w.document;
w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
w.HTMLDialogElement.prototype.close=function(){this.open=false;};
w.alert=()=>{};w.confirm=()=>true;
const $=id=>d.getElementById(id);
Object.entries({usuario_id:'gestor',empresa_id:'empresa-teste',usuario_hierarquia:'1'}).forEach(([k,v])=>w.localStorage.setItem(k,v));
w.EMPRESA_ID='empresa-teste';w.PROFISSIONAL_ID='gestor';w.HarmoniaNutricao={allowed:()=>false};
const base={id:'paciente-a',empresa_id:'empresa-teste',ativo:true,nome_completo:'Paciente fictício A',data_nascimento:'1940-05-15',has:true,dm:null,da:false,cardiopatia:null,acamado:false,outras_comorbidades:'Observação fictícia',pressao_arterial:'120/80',grau_risco:1,dieta_texto:'Livre',dieta_especial:false};
let patients=[{...base},{...base,id:'paciente-b',nome_completo:'Paciente fictício B'}];
const writes=[];let errorNext=null;
w.db={from(table){assert.equal(table,'pacientes');const filters=[];let delta=null;
  const result=()=>{
    if(delta&&errorNext){const error=errorNext;errorNext=null;return {data:null,error};}
    const rows=patients.filter(p=>filters.every(([k,v])=>p[k]===v));
    if(delta){writes.push({data:{...delta},filters:[...filters]});rows.forEach(p=>Object.assign(p,delta));}
    return {data:rows.map(p=>({...p})),error:null};
  };
  return {select(){return this;},eq(k,v){filters.push([k,v]);return this;},is(k,v){filters.push([k,v]);return this;},update(v){delta=v;return this;},order(){return Promise.resolve(result());},single(){const r=result();return Promise.resolve({...r,data:r.data?.[0]||null});},maybeSingle(){return this.single();}};
}};
for(const file of ['clinico.js','paciente-editor.js'])w.eval(fs.readFileSync(path.join(root,'js',file),'utf8'));
async function run(){
  await w.carregarClinico();
  assert.equal(d.querySelectorAll('.clin-editar').length,2);
  await w.HarmoniaPaciente.open('paciente-a');
  assert.equal($('ceTitle').textContent,'Paciente fictício A');
  assert.equal($('ce_data_nascimento').value,'1940-05-15');
  $('ce_data_nascimento').value='1942-05-15';$('ce_has').value='false';$('ce_outras_comorbidades').value='';
  await w.HarmoniaPaciente.save();
  assert.deepEqual(writes[0].data,{data_nascimento:'1942-05-15',has:false,outras_comorbidades:null});
  assert(writes[0].filters.some(([k,v])=>k==='empresa_id'&&v==='empresa-teste'));
  assert.equal(patients[0].dm,null);
  assert.equal(patients[1].data_nascimento,'1940-05-15');
  assert.equal(patients[1].has,true);
  assert.equal(d.querySelector('#quadroClinico tr td:nth-child(2)').textContent,String(w.calcularIdade('1942-05-15')));
  assert.match($('ceMessage').textContent,/Dados salvos/);
  await w.HarmoniaPaciente.save();assert.equal(writes.length,1);
  $('ce_data_nascimento').value='2999-01-01';await w.HarmoniaPaciente.save();assert.equal(writes.length,1);
  $('ce_data_nascimento').value='1942-05-15';$('ce_outras_comorbidades').value='Nova observação';
  errorNext={message:'Falha de rede simulada'};await w.HarmoniaPaciente.save();
  assert.match($('ceMessage').textContent,/Não foi possível salvar/);
  assert.equal($('ce_outras_comorbidades').value,'Nova observação');
  assert.equal(patients[0].outras_comorbidades,null);
  // Outra edição ocorre depois da leitura. A comparação impede a sobrescrita.
  patients[0].outras_comorbidades='Edição concorrente';await w.HarmoniaPaciente.save();
  assert.match($('ceMessage').textContent,/cadastro mudou/);
  assert.equal(patients[0].outras_comorbidades,'Edição concorrente');
  w.confirm=()=>false;$('ceCancel').click();assert.equal($('clinPacienteEditor').open,true);
  w.confirm=()=>true;$('ceCancel').click();assert.equal($('clinPacienteEditor').open,false);
  await w.HarmoniaPaciente.open('paciente-b');
  $('ce_dm').value='true';const before=writes.length;
  w.localStorage.setItem('empresa_id','outra-empresa');await w.HarmoniaPaciente.save();
  assert.equal(writes.length,before);assert.match($('ceMessage').textContent,/sessão mudou/);
  w.localStorage.setItem('empresa_id','empresa-teste');w.localStorage.setItem('usuario_hierarquia','4');
  assert.equal(w.HarmoniaPaciente.allowed(),false);
  const now=new Date();const birthday=[now.getFullYear()-80,String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
  assert.equal(w.calcularIdade(birthday),80);
  assert.equal(w.calcularIdade('1942-02-30'),'');
  console.log('PASS: ficha individual, nascimento/idade, comorbidades, limpeza de texto, isolamento por paciente/empresa, falha de gravação, concorrência e cancelamento.');
  w.close();
}
run().catch(e=>{console.error(e);w.close();process.exitCode=1;});
