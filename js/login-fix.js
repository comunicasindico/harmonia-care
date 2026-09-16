/* =========================================================
HARMONIA CARE — LOGIN ROBUSTO
Evita travamento quando o Supabase demora a responder.
========================================================= */
(function(){
  const TIMEOUT_MS=12000;

  function resetBtn(btn,texto="Entrar"){
    if(!btn)return;
    btn.innerText=texto;
    btn.style.opacity="1";
    btn.style.transform="scale(1)";
    btn.disabled=false;
  }

  function comTimeout(promise,ms){
    return Promise.race([
      promise,
      new Promise((_,reject)=>setTimeout(()=>reject(new Error("TIMEOUT_SUPABASE")),ms))
    ]);
  }

  window.login=async function(){
    const btn=document.getElementById("btnEntrar");
    if(btn){
      btn.innerText="Entrando...";
      btn.style.opacity="0.7";
      btn.style.transform="scale(0.97)";
      btn.disabled=true;
    }

    try{
      const cliente=window.db;
      if(!cliente){
        resetBtn(btn);
        alert("Banco de dados ainda está conectando. Aguarde alguns segundos e tente novamente.");
        return;
      }

      const loginInput=(document.getElementById("usuario")?.value||"").trim().toLowerCase();
      const senha=(document.getElementById("senha")?.value||"").trim();

      if(!loginInput||!senha){
        resetBtn(btn);
        alert("Informe usuário e senha");
        return;
      }

      const resposta=await comTimeout(
        cliente.from("usuarios").select("*").eq("ativo",true),
        TIMEOUT_MS
      );

      const data=resposta?.data||[];
      const error=resposta?.error;
      if(error)throw error;

      const user=data.find(u=>{
        const apelido=String(u.nome_apelido||"").toLowerCase();
        const email=String(u.email||"").toLowerCase();
        const completo=String(u.nome_completo||"").toLowerCase();
        return (apelido===loginInput||email===loginInput||completo===loginInput) && String(u.senha_hash)===senha;
      });

      if(!user){
        resetBtn(btn);
        alert("Usuário ou senha inválidos");
        return;
      }

      const perfil=(user.perfil||"cuidador").toLowerCase();
      localStorage.setItem("painelAtual",perfil==="admin"?"painelAdmin":"painelEnfermagem");
      if(user.id)localStorage.setItem("usuario_id",String(user.id));

      if(user.tipo==="familiar"){
        localStorage.setItem("tipo_usuario","familiar");
        if(user.paciente_id)localStorage.setItem("paciente_id",user.paciente_id);
      }else{
        localStorage.setItem("tipo_usuario","enfermagem");
      }

      localStorage.setItem("usuario_nome",user.nome_completo||user.nome_apelido||"");
      localStorage.setItem("usuario_hierarquia",String(user.hierarquia||1));
      localStorage.setItem("perfil",user.perfil||"cuidador");
      localStorage.setItem("usuario_perfil",perfil);

      const EMPRESA_FIXA="d9f678e5-6c7a-485e-895c-cb4791db840e";
      localStorage.setItem("empresa_id",EMPRESA_FIXA);
      if(typeof EMPRESA_ID!=="undefined")EMPRESA_ID=EMPRESA_FIXA;

      const telaLogin=document.getElementById("login");
      const telaApp=document.getElementById("app");
      if(telaLogin)telaLogin.style.display="none";
      if(telaApp)telaApp.style.display="block";
      resetBtn(btn);

      // Carregamento posterior sem bloquear a entrada na aplicação.
      setTimeout(async()=>{
        try{
          if(typeof definirDataHoje==="function")definirDataHoje();
          if(typeof carregarEmpresa==="function")await carregarEmpresa();
          if(typeof carregarPacientesBusca==="function")await carregarPacientesBusca();
          if(typeof carregarRotinas==="function")await carregarRotinas();
          if(typeof carregarClinico==="function")await carregarClinico();
          if(typeof abrirPainel==="function")abrirPainel(localStorage.getItem("painelAtual")||"painelEnfermagem");
        }catch(e){
          console.error("Falha no carregamento pós-login",e);
        }
      },0);

    }catch(e){
      console.error("Falha de login",e);
      resetBtn(btn);
      if(e?.message==="TIMEOUT_SUPABASE"){
        alert("O banco demorou para responder. Como o Supabase foi reativado recentemente, aguarde alguns segundos e tente novamente.");
      }else{
        alert("Não foi possível concluir o login. Recarregue a página e tente novamente.");
      }
    }
  };

  document.addEventListener("keydown",function(e){
    if(e.key==="Enter" && document.getElementById("login")?.style.display!=="none"){
      const alvo=e.target;
      if(alvo?.id==="usuario"||alvo?.id==="senha"){
        e.preventDefault();
        window.login();
      }
    }
  });
})();
