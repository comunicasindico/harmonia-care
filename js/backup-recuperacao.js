/* =========================================================
HARMONIA CARE — BACKUP E RECUPERAÇÃO V2.1 SAFE
Correção definitiva de travamento:
- sem MutationObserver
- inicialização única
- sem alterações repetitivas no DOM
========================================================= */
(function(){
  "use strict";

  if(window.__HC_BACKUP_SAFE_LOADED__) return;
  window.__HC_BACKUP_SAFE_LOADED__ = true;

  const VERSAO_BACKUP="2.1.0";
  const TABELAS_BACKUP=[
    "empresas","pacientes","usuarios","pacientes_profissionais",
    "rotina_modelos","rotinas_execucao","medicacoes_modelo",
    "medicacoes","medicacoes_execucao","auditoria"
  ];
  const ORDEM_RESTAURACAO=[
    "empresas","usuarios","pacientes","rotina_modelos","medicacoes_modelo",
    "pacientes_profissionais","medicacoes","rotinas_execucao",
    "medicacoes_execucao","auditoria"
  ];

  const empresaAtual=()=>window.EMPRESA_ID||localStorage.getItem("empresa_id")||null;
  const agoraArquivo=()=>new Date().toISOString().replace(/[:.]/g,"-");

  function baixarJson(obj,nome){
    const blob=new Blob([JSON.stringify(obj,null,2)],{type:"application/json;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download=nome;
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  function progresso(titulo,texto,pct=0){
    let modal=document.getElementById("hcBackupProgress");
    if(!modal){
      modal=document.createElement("div");
      modal.id="hcBackupProgress";
      modal.className="hc-progress-modal";
      modal.innerHTML=`
        <div class="hc-progress-box">
          <h3 id="hcProgressTitle"></h3>
          <div class="hc-progress-track"><div class="hc-progress-fill" id="hcProgressFill"></div></div>
          <div class="hc-progress-text" id="hcProgressText"></div>
        </div>`;
      document.body.appendChild(modal);
    }
    modal.style.display="flex";
    const t=document.getElementById("hcProgressTitle");
    const tx=document.getElementById("hcProgressText");
    const f=document.getElementById("hcProgressFill");
    if(t)t.textContent=titulo||"";
    if(tx)tx.textContent=texto||"";
    if(f)f.style.width=`${Math.max(0,Math.min(100,pct))}%`;
  }

  function fecharProgresso(){
    const m=document.getElementById("hcBackupProgress");
    if(m)m.style.display="none";
  }

  async function lerTabela(tabela,empresaId){
    try{
      if(empresaId){
        const r=await window.db.from(tabela).select("*").eq("empresa_id",empresaId);
        if(!r.error)return r;
      }
      return await window.db.from(tabela).select("*");
    }catch(e){
      return {data:null,error:e};
    }
  }

  window.backupCompleto=async function(){
    if(!window.db){alert("Banco de dados ainda não está disponível.");return;}

    const empresaId=empresaAtual();
    const backup={
      manifesto:{
        sistema:"Harmonia Care",
        tipo:"backup-completo",
        versao:VERSAO_BACKUP,
        criado_em:new Date().toISOString(),
        empresa_id:empresaId,
        usuario:localStorage.getItem("usuario_nome")||null
      },
      resumo:{},dados:{},falhas:{}
    };

    progresso("Backup completo","Preparando...",0);

    for(let i=0;i<TABELAS_BACKUP.length;i++){
      const tabela=TABELAS_BACKUP[i];
      progresso("Backup completo",`Exportando ${tabela}...`,Math.round((i/TABELAS_BACKUP.length)*90));
      const r=await lerTabela(tabela,empresaId);
      if(r.error){
        backup.dados[tabela]=[];
        backup.resumo[tabela]=0;
        backup.falhas[tabela]=r.error.message||String(r.error);
      }else{
        backup.dados[tabela]=r.data||[];
        backup.resumo[tabela]=backup.dados[tabela].length;
      }
    }

    backup.manifesto.total_registros=Object.values(backup.resumo).reduce((a,b)=>a+(Number(b)||0),0);
    progresso("Backup completo","Gerando arquivo...",96);
    baixarJson(backup,`harmonia-care-backup-${agoraArquivo()}.json`);
    progresso("Backup completo",`Concluído: ${backup.manifesto.total_registros} registros.`,100);
    setTimeout(()=>{
      fecharProgresso();
      alert(`Backup concluído.\nRegistros: ${backup.manifesto.total_registros}`);
    },500);
  };

  function validarBackup(obj){
    if(!obj||typeof obj!=="object")throw new Error("Arquivo inválido.");
    if(!obj.manifesto||obj.manifesto.sistema!=="Harmonia Care")throw new Error("Backup não reconhecido.");
    if(!obj.dados||typeof obj.dados!=="object")throw new Error("Backup sem dados.");
  }

  function lotes(arr,tam=200){
    const out=[];
    for(let i=0;i<arr.length;i+=tam)out.push(arr.slice(i,i+tam));
    return out;
  }

  window.restaurarBackupHarmonia=async function(arquivo){
    if(!arquivo||!window.db)return;
    let backup;
    try{
      backup=JSON.parse(await arquivo.text());
      validarBackup(backup);
    }catch(e){
      alert("Não foi possível abrir o backup:\n"+(e.message||e));
      return;
    }

    const total=Object.values(backup.dados).filter(Array.isArray).reduce((n,a)=>n+a.length,0);
    if(!confirm(`Restaurar backup com ${total} registros?\n\nA recuperação usa UPSERT e não apaga a base atual.`))return;
    if(!confirm("Confirma a recuperação agora?"))return;

    let feitos=0;
    progresso("Recuperação","Iniciando...",0);

    for(let i=0;i<ORDEM_RESTAURACAO.length;i++){
      const tabela=ORDEM_RESTAURACAO[i];
      const regs=backup.dados[tabela]||[];
      progresso("Recuperação",`Restaurando ${tabela}...`,Math.round((i/ORDEM_RESTAURACAO.length)*95));
      for(const lote of lotes(regs,200)){
        const {error}=await window.db.from(tabela).upsert(lote);
        if(error){
          console.error("Falha restaurando",tabela,error);
          break;
        }
        feitos+=lote.length;
      }
    }

    progresso("Recuperação",`Concluído: ${feitos} registros processados.`,100);
    setTimeout(()=>{fecharProgresso();alert(`Recuperação concluída.\nRegistros processados: ${feitos}`);},500);
  };

  function instalarUI(){
    if(window.__HC_BACKUP_UI_INSTALLED__)return;
    window.__HC_BACKUP_UI_INSTALLED__=true;

    let input=document.getElementById("hcRestoreInput");
    if(!input){
      input=document.createElement("input");
      input.type="file";
      input.accept=".json,application/json";
      input.id="hcRestoreInput";
      input.style.display="none";
      input.addEventListener("change",async e=>{
        const arq=e.target.files&&e.target.files[0];
        if(arq)await window.restaurarBackupHarmonia(arq);
        e.target.value="";
      });
      document.body.appendChild(input);
    }

    const btnBackup=document.getElementById("btnBackup");
    if(btnBackup){
      btnBackup.textContent="💾 Backup Completo";
      btnBackup.onclick=()=>window.backupCompleto();
      if(!document.getElementById("btnRestaurarBackup")){
        const b=document.createElement("button");
        b.id="btnRestaurarBackup";
        b.className="hc-btn-restore";
        b.textContent="♻️ Restaurar Backup";
        b.onclick=()=>input.click();
        btnBackup.insertAdjacentElement("afterend",b);
      }
    }

    const painel=document.getElementById("painelAdmin");
    if(painel&&!document.getElementById("hcBackupCard")){
      const card=document.createElement("div");
      card.id="hcBackupCard";
      card.className="hc-backup-card";
      card.innerHTML=`
        <h3>💾 Backup e Recuperação</h3>
        <p>Backup ampliado do Harmonia Care, sem apagar a base atual.</p>
        <div class="hc-backup-actions">
          <button id="hcBackupAgora" class="btn-primary">💾 Gerar backup agora</button>
          <button id="hcRestoreAgora" class="hc-btn-restore">♻️ Recuperar arquivo</button>
        </div>`;
      painel.prepend(card);
      card.querySelector("#hcBackupAgora").onclick=()=>window.backupCompleto();
      card.querySelector("#hcRestoreAgora").onclick=()=>input.click();
    }
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",()=>setTimeout(instalarUI,0),{once:true});
  }else{
    setTimeout(instalarUI,0);
  }
})();
