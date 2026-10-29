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
