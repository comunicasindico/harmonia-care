/* =========================================================
HARMONIA CARE — BACKUP E RECUPERAÇÃO V2
- Backup ampliado das tabelas usadas pelo sistema
- Manifesto, contagens e falhas
- Restauração por upsert em lotes
- Não apaga dados existentes
========================================================= */
(function(){
  const VERSAO_BACKUP="2.0.0"

  const TABELAS_BACKUP=[
    "empresas",
    "pacientes",
    "usuarios",
    "pacientes_profissionais",
    "rotina_modelos",
    "rotinas_execucao",
    "medicacoes_modelo",
    "medicacoes",
    "medicacoes_execucao",
    "auditoria"
  ]

  const ORDEM_RESTAURACAO=[
    "empresas",
    "usuarios",
    "pacientes",
    "rotina_modelos",
    "medicacoes_modelo",
    "pacientes_profissionais",
    "medicacoes",
    "rotinas_execucao",
    "medicacoes_execucao",
    "auditoria"
  ]

  function agoraArquivo(){
    return new Date().toISOString().replace(/[:.]/g,"-")
  }

  function empresaAtual(){
    return window.EMPRESA_ID || localStorage.getItem("empresa_id") || null
  }

  function mostrarProgresso(titulo,texto="Preparando..."){
    let modal=document.getElementById("hcBackupProgress")
    if(!modal){
      modal=document.createElement("div")
      modal.id="hcBackupProgress"
      modal.className="hc-progress-modal"
      const caixa=document.createElement("div")
      caixa.className="hc-progress-box"
      const h=document.createElement("h3")
      h.id="hcProgressTitle"
      const track=document.createElement("div")
      track.className="hc-progress-track"
      const fill=document.createElement("div")
      fill.className="hc-progress-fill"
      fill.id="hcProgressFill"
      const txt=document.createElement("div")
      txt.className="hc-progress-text"
      txt.id="hcProgressText"
      track.appendChild(fill)
      caixa.appendChild(h)
      caixa.appendChild(track)
      caixa.appendChild(txt)
      modal.appendChild(caixa)
      document.body.appendChild(modal)
    }
    document.getElementById("hcProgressTitle").textContent=titulo
    document.getElementById("hcProgressText").textContent=texto
    document.getElementById("hcProgressFill").style.width="0%"
    modal.style.display="flex"
  }

  function atualizarProgresso(pct,texto){
    const fill=document.getElementById("hcProgressFill")
    const txt=document.getElementById("hcProgressText")
    if(fill)fill.style.width=`${Math.max(0,Math.min(100,pct))}%`
    if(txt && texto)txt.textContent=texto
  }

  function fecharProgresso(){
    const modal=document.getElementById("hcBackupProgress")
    if(modal)modal.style.display="none"
  }

  function baixarJson(obj,nome){
    const blob=new Blob([JSON.stringify(obj,null,2)],{type:"application/json;charset=utf-8"})
    const url=URL.createObjectURL(blob)
    const a=document.createElement("a")
    a.href=url
    a.download=nome
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(()=>URL.revokeObjectURL(url),1000)
  }

  async function lerTabela(tabela,empresaId){
    let query=db.from(tabela).select("*")
    if(empresaId){
      const filtrada=await query.eq("empresa_id",empresaId)
      if(!filtrada.error)return filtrada
    }
    return await db.from(tabela).select("*")
  }

  window.backupCompleto=async function backupCompleto(){
    if(!window.db && typeof db==="undefined"){
      alert("Sem conexão com o banco.")
      return
    }

    const empresaId=empresaAtual()
    const backup={
      manifesto:{
        sistema:"Harmonia Care",
        tipo:"backup-completo",
        versao:VERSAO_BACKUP,
        criado_em:new Date().toISOString(),
        empresa_id:empresaId,
        usuario:localStorage.getItem("usuario_nome")||null,
        origem:location.href
      },
      resumo:{},
      dados:{},
      falhas:{}
    }

    mostrarProgresso("Backup completo","Lendo banco de dados...")

    for(let i=0;i<TABELAS_BACKUP.length;i++){
      const tabela=TABELAS_BACKUP[i]
      atualizarProgresso((i/TABELAS_BACKUP.length)*90,`Exportando ${tabela}...`)
      try{
        const {data,error}=await lerTabela(tabela,empresaId)
        if(error){
          backup.dados[tabela]=[]
          backup.resumo[tabela]=0
          backup.falhas[tabela]=error.message||String(error)
        }else{
          backup.dados[tabela]=data||[]
          backup.resumo[tabela]=(data||[]).length
        }
      }catch(e){
        backup.dados[tabela]=[]
        backup.resumo[tabela]=0
        backup.falhas[tabela]=e?.message||String(e)
      }
    }

    backup.manifesto.total_registros=Object.values(backup.resumo).reduce((a,b)=>a+(Number(b)||0),0)
    backup.manifesto.tabelas_ok=Object.keys(backup.resumo).filter(t=>!backup.falhas[t]).length
    backup.manifesto.tabelas_com_falha=Object.keys(backup.falhas).length

    atualizarProgresso(96,"Gerando arquivo JSON...")
    baixarJson(backup,`harmonia-care-backup-${agoraArquivo()}.json`)
    atualizarProgresso(100,`Backup concluído: ${backup.manifesto.total_registros} registros.`)

    setTimeout(()=>{
      fecharProgresso()
      const falhas=Object.keys(backup.falhas)
      alert(`Backup concluído.\n\nRegistros: ${backup.manifesto.total_registros}\nTabelas exportadas: ${backup.manifesto.tabelas_ok}\n${falhas.length?`Tabelas não acessíveis: ${falhas.join(", ")}`:"Todas as tabelas acessíveis foram exportadas."}`)
    },600)
  }

  function validarBackup(obj){
    if(!obj || typeof obj!=="object")throw new Error("Arquivo inválido.")
    if(!obj.manifesto || obj.manifesto.sistema!=="Harmonia Care"){
      throw new Error("Este arquivo não é um backup reconhecido do Harmonia Care.")
    }
    if(!obj.dados || typeof obj.dados!=="object"){
      throw new Error("Backup sem bloco de dados.")
    }
    return true
  }

  function lotes(arr,tamanho=200){
    const out=[]
    for(let i=0;i<arr.length;i+=tamanho)out.push(arr.slice(i,i+tamanho))
    return out
  }

  async function restaurarTabela(tabela,registros){
    if(!Array.isArray(registros) || !registros.length)return {ok:0,erro:null}
    let ok=0
    for(const lote of lotes(registros,200)){
      const {error}=await db.from(tabela).upsert(lote)
      if(error)return {ok,erro:error}
      ok+=lote.length
    }
    return {ok,erro:null}
  }

  window.restaurarBackupHarmonia=async function restaurarBackupHarmonia(arquivo){
    if(!arquivo)return
    let backup
    try{
      const texto=await arquivo.text()
      backup=JSON.parse(texto)
      validarBackup(backup)
    }catch(e){
      alert("Não foi possível abrir o backup:\n"+(e?.message||e))
      return
    }

    const total=Object.values(backup.dados)
      .filter(Array.isArray)
      .reduce((n,a)=>n+a.length,0)

    const origem=backup.manifesto.criado_em
      ? new Date(backup.manifesto.criado_em).toLocaleString("pt-BR")
      : "data desconhecida"

    const confirmar1=confirm(`RESTAURAR BACKUP HARMONIA CARE\n\nBackup de: ${origem}\nRegistros encontrados: ${total}\n\nA recuperação faz MERGE/UPSERT: não apaga os dados atuais.\nDeseja continuar?`)
    if(!confirmar1)return

    const confirmar2=confirm("Confirma a recuperação dos dados agora?\n\nRecomendação: mantenha uma cópia do backup atual antes de prosseguir.")
    if(!confirmar2)return

    mostrarProgresso("Recuperando backup","Validando tabelas...")
    const resultado={restaurados:{},falhas:{}}
    let concluidas=0

    for(const tabela of ORDEM_RESTAURACAO){
      const registros=backup.dados[tabela]||[]
      atualizarProgresso((concluidas/ORDEM_RESTAURACAO.length)*95,`Restaurando ${tabela} (${registros.length})...`)
      if(!registros.length){
        resultado.restaurados[tabela]=0
        concluidas++
        continue
      }

      try{
        const r=await restaurarTabela(tabela,registros)
        resultado.restaurados[tabela]=r.ok
        if(r.erro)resultado.falhas[tabela]=r.erro.message||String(r.erro)
      }catch(e){
        resultado.falhas[tabela]=e?.message||String(e)
      }
      concluidas++
    }

    const soma=Object.values(resultado.restaurados).reduce((a,b)=>a+(Number(b)||0),0)
    atualizarProgresso(100,`Recuperação concluída: ${soma} registros processados.`)

    setTimeout(()=>{
      fecharProgresso()
      const falhas=Object.keys(resultado.falhas)
      alert(`Recuperação concluída.\n\nRegistros processados: ${soma}\n${falhas.length?`Atenção nas tabelas: ${falhas.join(", ")}`:"Nenhuma falha informada pelo banco."}`)
    },700)
  }

  function criarInterfaceBackup(){
    const btnBackup=document.getElementById("btnBackup")
    if(btnBackup){
      btnBackup.textContent="💾 Backup Completo"
      btnBackup.title="Exportar backup ampliado do Harmonia Care"
    }

    if(!document.getElementById("hcRestoreInput")){
      const inp=document.createElement("input")
      inp.type="file"
      inp.accept=".json,application/json"
      inp.id="hcRestoreInput"
      inp.style.display="none"
      inp.addEventListener("change",async e=>{
        const arq=e.target.files?.[0]
        if(arq)await window.restaurarBackupHarmonia(arq)
        e.target.value=""
      })
      document.body.appendChild(inp)
    }

    if(btnBackup && !document.getElementById("btnRestaurarBackup")){
      const b=document.createElement("button")
      b.id="btnRestaurarBackup"
      b.className="hc-btn-restore"
      b.textContent="♻️ Restaurar Backup"
      b.onclick=()=>document.getElementById("hcRestoreInput")?.click()
      btnBackup.insertAdjacentElement("afterend",b)
    }

    const painel=document.getElementById("painelAdmin")
    if(painel && !document.getElementById("hcBackupCard")){
      const card=document.createElement("div")
      card.id="hcBackupCard"
      card.className="hc-backup-card"
      const h=document.createElement("h3")
      h.textContent="💾 Backup e Recuperação"
      const p=document.createElement("p")
      p.textContent="Exporte os principais dados do sistema e recupere um backup JSON por mesclagem, sem apagar a base atual."
      const actions=document.createElement("div")
      actions.className="hc-backup-actions"
      const b1=document.createElement("button")
      b1.className="btn-primary"
      b1.textContent="💾 Gerar backup agora"
      b1.addEventListener("click",()=>window.backupCompleto())
      const b2=document.createElement("button")
      b2.className="hc-btn-restore"
      b2.textContent="♻️ Recuperar arquivo"
      b2.addEventListener("click",()=>document.getElementById("hcRestoreInput")?.click())
      actions.appendChild(b1)
      actions.appendChild(b2)
      card.appendChild(h)
      card.appendChild(p)
      card.appendChild(actions)
      painel.prepend(card)
    }
  }

  function iniciar(){
    criarInterfaceBackup()
    const obs=new MutationObserver(()=>criarInterfaceBackup())
    obs.observe(document.body,{childList:true,subtree:true})
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",iniciar)
  else iniciar()
})()
