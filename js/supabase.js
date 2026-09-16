/* ====================================================
HARMONIA CARE — SUPABASE LOADER SAFE 20260916
==================================================== */
const SUPABASE_URL="https://whvwqektkinnhdprehss.supabase.co";
const SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndodndxZWt0a2lubmhkcHJlaHNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTY2MzYsImV4cCI6MjA4Nzg3MjYzNn0.gdTMT25dc4x7YlLQEWHKd-6dM32nKp5mnRwMk_fiEdU";
(function(){
  "use strict";

  if(typeof supabase==="undefined"){
    console.error("Supabase SDK não carregou");
    window.db=null;
    return;
  }

  try{
    window.db=supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
    console.log("Supabase conectado");
  }catch(e){
    console.error("Falha ao inicializar Supabase",e);
    window.db=null;
  }

  setInterval(async()=>{
    if(!window.db)return;
    try{ await window.db.from("pacientes").select("id").limit(1); }
    catch(e){ console.warn("Keep alive falhou",e); }
  },300000);

  window.registrarAuditoria=async function({acao,tabela,registro_id,antes,depois}){
    if(!window.db)return;
    try{
      await window.db.from("auditoria").insert({
        usuario_id:localStorage.getItem("usuario_id"),
        usuario_nome:localStorage.getItem("usuario_nome"),
        acao,tabela,registro_id,
        dados_antes:antes||null,
        dados_depois:depois||null
      });
    }catch(e){ console.warn("Auditoria não registrada",e); }
  };

  function carregar(id,src){
    if(document.getElementById(id))return;
    const s=document.createElement("script");
    s.id=id;
    s.src=src;
    s.async=false;
    document.head.appendChild(s);
  }

  function css(id,href){
    if(document.getElementById(id))return;
    const l=document.createElement("link");
    l.id=id;l.rel="stylesheet";l.href=href;
    document.head.appendChild(l);
  }

  window.addEventListener("DOMContentLoaded",()=>{
    css("harmonia-ilpi-css","css/harmonia-ilpi.css?v=20260916b");
    carregar("harmonia-visual-ilpi","js/visual-ilpi.js?v=20260916b");
    carregar("harmonia-backup-recuperacao","js/backup-recuperacao.js?v=20260916b");
  },{once:true});
})();
