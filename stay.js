/* Keep students signed in: "Remember this device" and weak-signal recovery. */
(function(){
  function $(i){ return document.getElementById(i); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function hasToken(){ try{ return Object.keys(localStorage).some(function(k){ return /^sb-qqnsbuirelhwfrshafay-auth-token/.test(k); }); }catch(e){ return false; } }
  /* 1. remember-this-device tick box under the password */
  function addBox(){
    var pw=$('studentAuthPassword'); if(!pw||$('stayChk')) return;
    var d=document.createElement('label'); d.className='si-check';
    d.innerHTML='<input type="checkbox" id="stayChk" checked> <span>Remember this device</span>';
    var h=pw.parentNode; if(h.id||h.tagName!=='DIV'||h.children.length>3) h=pw; var t=(h===pw)?pw:h; t.parentNode.insertBefore(d,t.nextSibling);
  }
  var _si=window.studentSignIn;
  if(typeof _si==='function') window.studentSignIn=function(){ try{ var c=$('stayChk'); if(c&&!c.checked) localStorage.setItem('ceNoRemember','1'); else localStorage.removeItem('ceNoRemember'); }catch(e){} return _si.apply(this,arguments); };
  var _su=window.studentSignUp;
  if(typeof _su==='function') window.studentSignUp=function(){ try{ var c=$('stayChk'); if(c&&!c.checked) localStorage.setItem('ceNoRemember','1'); else localStorage.removeItem('ceNoRemember'); }catch(e){} return _su.apply(this,arguments); };
  /* 2. weak signal: the saved sign-in is kept, so keep retrying quietly and show the QR meanwhile */
  var lib=null; function loadLib(){ if(window.qrcode) return Promise.resolve(); if(lib) return lib; lib=new Promise(function(res,rej){ var s=document.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js'; s.onload=res; s.onerror=function(){ lib=null; rej(); }; document.head.appendChild(s); }); return lib; }
  function cached(){ try{ var c=JSON.parse(localStorage.getItem('ceQrBatch')||'null'); if(!c||!c.B) return null; var B=c.B, sl=Math.floor((Date.now()+B.off)/(B.step*1000))-B.slot; return (sl>=0&&sl<B.sigs.length)?c:null; }catch(e){ return null; } }
  var timer=null, qrT=null;
  function banner(){
    var b=$('stayBar'); if(b) return b;
    b=document.createElement('div'); b.id='stayBar'; b.style.cssText='margin:12px auto;max-width:520px;padding:14px 16px;border:1px solid var(--line,#ddd);border-radius:14px;background:var(--card,#fff);color:var(--ink,#111);font-size:.88rem;text-align:center';
    var host=$('studentAuthCard'); if(host&&host.parentNode) host.parentNode.insertBefore(b,host); else document.body.insertBefore(b,document.body.firstChild);
    return b;
  }
  function paintQr(){
    var c=cached(), box=$('stayQr'); if(!box) return;
    if(!c||!window.qrcode){ box.innerHTML=''; return; }
    var B=c.B, sl=Math.floor((Date.now()+B.off)/(B.step*1000)), i=sl-B.slot;
    var q=window.qrcode(0,'M'); q.addData('UT2.'+B.idx+'.'+sl+'.'+B.sigs[i]); q.make();
    var first=(c.name||'').trim().split(/\s+/)[0]||''; first=first?first.charAt(0).toUpperCase()+first.slice(1).toLowerCase():'Student';
    box.innerHTML='<div style="font-weight:700;margin:10px 0 6px">'+esc(first)+' QR Tag (works offline)</div><div style="display:inline-block;background:#fff;padding:10px;border-radius:12px;line-height:0;box-shadow:0 0 0 1px rgba(11,42,60,.15)">'+q.createSvgTag({cellSize:6,margin:0,scalable:true}).replace('<svg','<svg style="width:150px;height:150px"')+'</div><div style="font-family:ui-monospace,monospace;font-size:.8rem;margin-top:6px">'+esc(B.idx)+'</div>';
  }
  function watch(){
    if(!hasToken()) return;
    var si=$('signedInCard'); if(si&&!si.classList.contains('hidden')) return;
    var b=banner(); b.innerHTML='<b>Reconnecting to your account...</b><div style="color:var(--muted,#64748b);margin-top:4px">You are still signed in on this device. The signal looks weak, so we keep trying. You do not need to sign in again.</div><div id="stayQr"></div>';
    loadLib().then(function(){ paintQr(); clearInterval(qrT); qrT=setInterval(paintQr,1000); }).catch(function(){});
    clearInterval(timer); timer=setInterval(async function(){
      try{ var r=await supabaseClient.auth.getSession(); if(r&&r.data&&r.data.session){ clearInterval(timer); clearInterval(qrT); var x=$('stayBar'); if(x) x.remove(); await onStudentSignedIn(); } }catch(e){}
    },5000);
  }
  document.addEventListener('DOMContentLoaded',function(){ addBox(); setTimeout(watch,2500); });
  window.addEventListener('online',function(){ setTimeout(watch,300); });
})();
