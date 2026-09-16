/* ====================================================
001 – CONFIG SUPABASE
==================================================== */
const SUPABASE_URL="https://whvwqektkinnhdprehss.supabase.co"
const SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXAiLCJyZWYiOiJ3aHZ3cWVrdGtubmhkcHJlaHNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTY2MzYsImV4cCI6MjA4Nzg3MjYzNn0.gdTMT25dc4x7YlLQEWHKd-6dM32nKp5mnRwMk_fiEdU"

/* garantir que SDK carregou */
if(typeof supabase==="undefined"){
  console.error("Supabase SDK não carregou")
}else{
  const supabaseClient=supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  )
  db=supabaseClient
  console.log("Supabase conectado")
}

/* ====================================================
003 – KEEP ALIVE
==================================================== */
setInterval(async()=>{
  if(!db)return
  try{
    await db
      .from("pacientes")
      .select("id")
      .limit(1)
    console.log("Supabase ativo")
  }catch(e){
    console.log("Erro keep alive")
  }
},300000)

/* ====================================================
004 – AUDITORIA GLOBAL
==================================================== */
async function registrarAuditoria({acao,tabela,registro_id,antes,depois}){
  if(!db)return
  const usuario_id=localStorage.getItem("usuario_id")
  const usuario_nome=localStorage.getItem("usuario_nome")
  await db.from("auditoria").insert({
    usuario_id,
    usuario_nome,
    acao,
    tabela,
    registro_id,
    dados_antes:antes||null,
    dados_depois:depois||null
  })
}

/* ====================================================
900 – APRIMORAMENTOS HARMONIA CARE
Carrega visual profissional e backup/recuperação depois
do sistema original, sem alterar a lógica assistencial.
==================================================== */
window.addEventListener("load",()=>{
  try{
    if(!document.getElementById("harmonia-ilpi-css")){
      const link=document.createElement("link")
      link.id="harmonia-ilpi-css"
      link.rel="stylesheet"
      link.href="css/harmonia-ilpi.css?v=20260915"
      document.head.appendChild(link)
    }

    const carregarScript=(id,src)=>{
      if(document.getElementById(id))return
      const script=document.createElement("script")
      script.id=id
      script.src=src
      script.defer=true
      document.body.appendChild(script)
    }

    carregarScript("harmonia-visual-ilpi","js/visual-ilpi.js?v=20260915")
    carregarScript("harmonia-backup-recuperacao","js/backup-recuperacao.js?v=20260915")
  }catch(e){
    console.error("Falha ao carregar aprimoramentos Harmonia Care",e)
  }
})
