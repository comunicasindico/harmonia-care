/* ====================================================
001 – CONFIG SUPABASE
==================================================== */
const SUPABASE_URL="https://whvwqektkinnhdprehss.supabase.co"
const SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndodndxZWt0a2lubmhkcHJlaHNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTY2MzYsImV4cCI6MjA4Nzg3MjYzNn0.gdTMT25dc4x7YlLQEWHKd-6dM32nKp5mnRwMk_fiEdU"
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
