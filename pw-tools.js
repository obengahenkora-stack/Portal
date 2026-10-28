/* Show/hide + confirm-password helpers shared by all sign-in pages */
(function(){
  var BTN='position:absolute;right:8px;top:50%;transform:translateY(-50%);padding:4px 10px;font-size:12px;line-height:1.2;border:1px solid rgba(128,128,128,.5);background:rgba(128,128,128,.12);color:inherit;border-radius:6px;cursor:pointer;width:auto;margin:0;min-width:0;';
  function wrap(inp){
    if(!inp || inp._pwWrapped) return inp;
    var w=document.createElement('div'); w.style.cssText='position:relative;display:flow-root;';
    var cs=getComputedStyle(inp), mt=parseFloat(cs.marginTop)||0, mb=parseFloat(cs.marginBottom)||0;
    inp.parentNode.insertBefore(w,inp); w.appendChild(inp);
    inp.style.paddingRight='70px';
    var b=document.createElement('button'); b.type='button'; b.textContent='Show'; b.setAttribute('aria-label','Show or hide password'); b.style.cssText=BTN; b.style.top='calc(50% + '+((mt-mb)/2)+'px)';
    b.onclick=function(e){ e.preventDefault(); var hid=inp.type==='password'; inp.type=hid?'text':'password'; b.textContent=hid?'Hide':'Show'; };
    w.appendChild(b); inp._pwWrapped=true; inp._pwBox=w; return inp;
  }
  function makeConfirm(inp){
    if(inp._pwConfirm) return inp._pwConfirm;
    var lab=document.createElement('label'); lab.textContent='Confirm Password';
    var c=document.createElement('input'); c.type='password'; c.placeholder='Re-enter your password'; c.autocomplete='new-password';
    if(inp.className) c.className=inp.className;
    c.id=(inp.id||'pw')+'__confirm';
    var anchor=inp._pwBox||inp;
    anchor.parentNode.insertBefore(lab,anchor.nextSibling);
    lab.parentNode.insertBefore(c,lab.nextSibling);
    wrap(c);
    inp._pwConfirm=c; c._pwLabel=lab;
    return c;
  }
  function say(msgEl,text){ if(!msgEl) return; msgEl.innerHTML='<div class="msg err">'+text+'</div>'; }
  var PW={
    wrap:wrap,
    // always show a confirm box under this field (change / reset password)
    pair:function(id){ var i=document.getElementById(id); if(!i) return; wrap(i); makeConfirm(i); },
    // sign-up: first press reveals the confirm box, second press checks it
    confirmSignup:function(id,msgEl){
      var i=document.getElementById(id); if(!i) return true; wrap(i);
      var c=i._pwConfirm;
      if(!c){ c=makeConfirm(i); say(msgEl,'Please re-enter your password in the new Confirm Password box, then press Create Account again.'); try{c.focus();}catch(e){} return false; }
      if(c.value!==i.value){ say(msgEl,'The two passwords do not match. Please check and try again.'); try{c.focus();}catch(e){} return false; }
      return true;
    },
    // for pair() fields
    matches:function(id,msgEl){
      var i=document.getElementById(id); if(!i) return true;
      var c=i._pwConfirm; if(!c) return true;
      if(c.value!==i.value){ say(msgEl,'The two passwords do not match. Please check and try again.'); return false; }
      return true;
    },
    reset:function(id){ var i=document.getElementById(id); if(i&&i._pwConfirm) i._pwConfirm.value=''; }
  };
  window.PW=PW;
  function init(){ document.querySelectorAll('input[type=password]').forEach(function(i){ wrap(i); }); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
