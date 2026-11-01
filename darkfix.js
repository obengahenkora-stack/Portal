/* Dark mode readability fixer: picks light or dark text for each button depending on what is behind it. */
(function(){
'use strict';
if(window.__darkfix) return; window.__darkfix=1;
var css='html[data-theme="dark"] button[data-ink="light"],html[data-theme="dark"] a[data-ink="light"]{color:#e8f6f2 !important}'
 +'html[data-theme="dark"] button[data-ink="dark"],html[data-theme="dark"] a[data-ink="dark"]{color:#08161d !important}'
 +'html[data-theme="dark"] .msg.err,html[data-theme="dark"] .err{color:#ff9b93 !important}'
 +'html[data-theme="dark"] .msg.ok{color:#8be0b0 !important}';
var st=document.createElement('style'); st.id='darkfixCss'; st.textContent=css; (document.head||document.documentElement).appendChild(st);
function parse(c){ var m=String(c).match(/rgba?\(([^)]+)\)/); if(!m) return null; var a=m[1].split(',').map(parseFloat); return {r:a[0],g:a[1],b:a[2],a:a.length>3?a[3]:1}; }
function lum(c){ function f(v){ v/=255; return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4); } return 0.2126*f(c.r)+0.7152*f(c.g)+0.0722*f(c.b); }
function behind(el){
  var layers=[], e=el;
  while(e&&e.nodeType===1){
    var cs=getComputedStyle(e);
    if(cs.backgroundImage&&cs.backgroundImage!=='none') return null;
    var c=parse(cs.backgroundColor);
    if(c&&c.a>0){ layers.push(c); if(c.a>=0.98) break; }
    e=e.parentElement;
  }
  var base={r:8,g:22,b:29};
  for(var i=layers.length-1;i>=0;i--){ var c2=layers[i]; base={r:c2.r*c2.a+base.r*(1-c2.a),g:c2.g*c2.a+base.g*(1-c2.a),b:c2.b*c2.a+base.b*(1-c2.a)}; }
  return base;
}
function scan(){
  if(document.documentElement.getAttribute('data-theme')!=='dark') return;
  var els=document.querySelectorAll('button,.cta-link,a.btn,a.button');
  for(var i=0;i<els.length;i++){
    var el=els[i], r=el.getBoundingClientRect(); if(!r.width&&!r.height) continue;
    var bg=behind(el); if(!bg){ el.removeAttribute('data-ink'); continue; }
    el.setAttribute('data-ink', lum(bg)<0.35?'light':'dark');
  }
}
var t=null; function later(){ clearTimeout(t); t=setTimeout(scan,200); }
new MutationObserver(later).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','class']});
function boot(){ scan(); new MutationObserver(later).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']}); setInterval(scan,2500); }
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();

/* Refresh button: a small round button on every page, for home-screen shortcuts that have no reload control. */
(function(){
'use strict';
if(window.__ceRefresh) return; window.__ceRefresh=1;
function add(){
  if(document.getElementById('ceRefreshBtn')) return;
  var st=document.createElement('style');
  st.textContent='#ceRefreshBtn{position:fixed;right:12px;top:calc(env(safe-area-inset-top,0px) + 74px);z-index:9998;box-sizing:border-box !important;width:40px !important;height:40px !important;min-width:40px !important;border-radius:50% !important;border:none !important;padding:0 !important;margin:0 !important;font-size:0 !important;line-height:0 !important;cursor:pointer;display:flex !important;align-items:center;justify-content:center;background:linear-gradient(135deg,#0ea5e9,#8b5cf6) !important;color:#fff !important;box-shadow:0 6px 16px rgba(30,41,90,.3);-webkit-tap-highlight-color:transparent;transition:transform .15s}'
   +'#ceRefreshBtn:hover,#ceRefreshBtn:focus,#ceRefreshBtn:active{background:linear-gradient(135deg,#0ea5e9,#8b5cf6) !important;color:#fff !important}'
   +'#ceRefreshBtn:active{transform:scale(.92)}'
   +'#ceRefreshBtn svg{display:block !important;width:20px !important;height:20px !important;fill:none !important;stroke:#fff !important;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;opacity:1 !important}#ceRefreshBtn svg *{stroke:#fff !important;fill:none !important}'
   +'#ceRefreshBtn.spin svg{animation:ceSpin .7s linear infinite}'
   +'@keyframes ceSpin{to{transform:rotate(360deg)}}'
   +'@media print{#ceRefreshBtn{display:none}}';
  document.head.appendChild(st);
  var b=document.createElement('button');
  b.id='ceRefreshBtn'; b.type='button'; b.setAttribute('aria-label','Refresh page'); b.title='Refresh';
  b.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 4 23 10 17 10"/><path d="M20.5 15a9 9 0 1 1-2.1-9.4L23 10"/></svg>';
  b.addEventListener('click',function(){ b.classList.add('spin'); setTimeout(function(){ location.reload(); },200); });
  document.body.appendChild(b);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',add); else add();
})();

/* ---- "Install this app" banner (shows only when the site is not already installed) ---- */
(function(){
var KEY='ceInstallHide', DAYS=14, dp=null;
function stored(){ try{ return parseInt(localStorage.getItem(KEY)||'0',10)||0; }catch(e){ return 0; } }
function hide(){ try{ localStorage.setItem(KEY,String(Date.now()+DAYS*864e5)); }catch(e){} var b=document.getElementById('ceInstall'); if(b&&b.parentNode) b.parentNode.removeChild(b); }
function installed(){
  try{ if(window.matchMedia&&(matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||matchMedia('(display-mode: minimal-ui)').matches)) return true; }catch(e){}
  if(window.navigator.standalone) return true;
  if(String(document.referrer).indexOf('android-app://')===0) return true;
  return false;
}
var ua=navigator.userAgent||'';
var IOS=/iPad|iPhone|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
var ANDROID=/Android/i.test(ua);
var INAPP=/FBAN|FBAV|Instagram|Line\/|MicroMessenger|WhatsApp|Snapchat|TikTok|; wv\)/i.test(ua);
var SAFARI=IOS&&/Safari/.test(ua)&&!/CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(ua)&&!INAPP;
window.addEventListener('beforeinstallprompt',function(e){ e.preventDefault(); dp=e; setTimeout(show,800); });
window.addEventListener('appinstalled',function(){ hide(); try{ localStorage.setItem(KEY,String(Date.now()+3650*864e5)); }catch(e){} });
function css(el,t){ el.style.cssText=t; }
function btn(txt,bg,fn){ var b=document.createElement('button'); b.type='button'; b.textContent=txt; css(b,'all:unset;box-sizing:border-box;cursor:pointer;padding:9px 16px !important;border-radius:999px !important;font:700 14px/1 system-ui,sans-serif !important;color:#fff !important;background:'+bg+' !important;margin:0 !important;border:none !important;'); b.addEventListener('click',fn); return b; }
function show(){
  if(document.getElementById('ceInstall')||installed()||Date.now()<stored()) return;
  var steps='', actions=[];
  if(dp){ steps='Add this portal to your home screen so it opens like an app.'; }
  else if(IOS&&SAFARI){ steps='Tap the Share button (square with an arrow), then choose Add to Home Screen, then Add.'; }
  else if(IOS){ steps='To install: open this page in Safari, tap Share, then Add to Home Screen.'; }
  else if(ANDROID){ steps='To install: tap the ⋮ menu in Chrome, then Install app (or Add to Home screen).'; }
  else return;
  var w=document.createElement('div'); w.id='ceInstall'; w.setAttribute('role','dialog'); w.setAttribute('aria-label','Install this app');
  css(w,'position:fixed;left:12px;bottom:calc(env(safe-area-inset-bottom,0px) + 12px);z-index:9997;max-width:340px;width:calc(100% - 24px);box-sizing:border-box;padding:14px 14px 12px !important;border-radius:16px !important;background:linear-gradient(135deg,#0b1e3a,#312e81) !important;color:#fff !important;box-shadow:0 10px 30px rgba(0,0,0,.35);font:500 14px/1.4 system-ui,sans-serif;');
  var t=document.createElement('div'); css(t,'font:800 15px/1.3 system-ui,sans-serif;margin:0 0 4px;color:#fff;'); t.textContent='Install the Obeng-Ahenkora app';
  var d=document.createElement('div'); css(d,'margin:0 0 10px;color:#e0e7ff;opacity:.95;'); d.textContent=steps;
  var row=document.createElement('div'); css(row,'display:flex;gap:8px;justify-content:flex-end;');
  row.appendChild(btn('Not now','rgba(255,255,255,.18)',hide));
  if(dp) row.appendChild(btn('Install','linear-gradient(135deg,#0ea5e9,#8b5cf6)',function(){ var p=dp; dp=null; try{ p.prompt(); p.userChoice.then(function(){ hide(); }); }catch(e){ hide(); } }));
  else row.appendChild(btn('Got it','linear-gradient(135deg,#0ea5e9,#8b5cf6)',hide));
  w.appendChild(t); w.appendChild(d); w.appendChild(row); document.body.appendChild(w);
}
function start(){ if(installed()) return; setTimeout(function(){ if(!dp) show(); },6000); }
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
