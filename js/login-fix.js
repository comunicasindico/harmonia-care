/* Harmonia Care login watchdog - safe */
(function(){
  "use strict";
  if(window.__HC_LOGIN_WATCHDOG__)return;
  window.__HC_LOGIN_WATCHDOG__=true;

  function resetarBotao(){
    const b=document.getElementById("btnEntrar");
    if(!b)return;
    b.disabled=false;
    b.style.opacity="1";
    b.style.transform="scale(1)";
    b.textContent="Entrar";
  }

  document.addEventListener("DOMContentLoaded",()=>{
    const b=document.getElementById("btnEntrar");
    if(!b)return;
    b.addEventListener("click",()=>{
      setTimeout(()=>{
        if(b.disabled || /Entrando/i.test(b.textContent||"")){
          resetarBotao();
          console.warn("Login watchdog: botão liberado após timeout.");
        }
      },12000);
    });
  },{once:true});
})();
