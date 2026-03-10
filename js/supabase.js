/* ====================================================
001 – CONFIG SUPABASE
==================================================== */
const SUPABASE_URL = "https://whvwqektkinnhdprehss.supabase.co"
const SUPABASE_KEY ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndodndxZWt0a2lubmhkcHJlaHNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTY2MzYsImV4cCI6MjA4Nzg3MjYzNn0.gdTMT25dc4x7YlLQEWHKd-6dM32nKp5mnRwMk_fiEdU"
const supabaseClient=window.supabase.createClient(
SUPABASE_URL,
SUPABASE_ANON_KEY
)
const db=supabaseClient
const EMPRESA_ID = "d9f678e5-6c7a-485e-895c-cb4791db840e"
/* ====================================================
002 – VARIÁVEIS GLOBAIS
==================================================== */

let TURNO_ATUAL = "manha"
let ROTINAS_CACHE = []

/* ====================================================
003 – KEEP ALIVE
==================================================== */

setInterval(async () => {

  try {

    await db
      .from("pacientes")
      .select("id")
      .limit(1)

    console.log("Supabase ativo")

  } catch (e) {

    console.log("Erro keep alive")

  }

}, 300000)
