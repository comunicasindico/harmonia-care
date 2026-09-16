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

  function carregarHarmonia2026(){
    if(document.querySelector('script[data-hc2026]'))return;
    const s=document.createElement('script');
    s.src='js/harmonia-2026.js?cache=20260916c';
    s.defer=true;
    s.dataset.hc2026='1';
    document.head.appendChild(s);
  }

  document.addEventListener("DOMContentLoaded",()=>{
    carregarHarmonia2026();
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
