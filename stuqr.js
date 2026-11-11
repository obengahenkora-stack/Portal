/* Student's own daily attendance QR. Changes every day; staff scan it in Scan tags. */
(function(){
  function $(i){ return document.getElementById(i); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  var css=document.createElement('style');
  css.textContent='#dashQrCard{padding:0 !important;background:transparent !important;border:0 !important;box-shadow:none !important}#dashQrCard>h2,#dashQrCard>div:first-of-type{display:none}#dashQrCard .sq-badge{max-width:340px;margin:0 auto;border-radius:24px;overflow:hidden;background:var(--card,#fff);border:1px solid var(--line);box-shadow:0 18px 40px rgba(11,42,60,.16)}#dashQrCard .sq-hd{background:linear-gradient(135deg,#0b2a3c,#1d6a8a);color:#fff;padding:16px 18px;text-align:center}#dashQrCard .sq-hd b{display:block;font-size:1.02rem;letter-spacing:.04em;text-transform:uppercase}#dashQrCard .sq-hd span{display:block;font-size:.74rem;opacity:.85;margin-top:3px;text-transform:none;letter-spacing:0}#dashQrCard .sq-bd{padding:22px 18px 18px;display:flex;flex-direction:column;align-items:center;gap:8px}#dashQrCard .sq-img{position:relative;background:#fff;padding:16px;border-radius:18px;line-height:0;box-shadow:0 0 0 1px rgba(11,42,60,.12),0 8px 22px rgba(11,42,60,.12)}#dashQrCard .sq-img svg{width:min(240px,66vw);height:auto;display:block}#dashQrCard .sq-nm{font-weight:700;font-size:1.2rem;text-align:center;margin-top:10px;text-transform:none;letter-spacing:0}#dashQrCard .sq-ix{font-family:ui-monospace,Menlo,monospace;font-weight:600;font-size:.95rem;background:rgba(11,42,60,.08);padding:3px 12px;border-radius:8px;letter-spacing:.06em}#dashQrCard .sq-d{display:inline-block;background:rgba(31,138,76,.14);color:#1a7a43;border-radius:999px;padding:5px 14px;font-size:.78rem;font-weight:700;margin-top:6px;text-align:center;text-transform:none;letter-spacing:0}#dashQrCard .sq-n{font-size:.76rem;color:var(--muted);text-align:center;margin-top:8px;line-height:1.45;text-transform:none;letter-spacing:0}#dashQrCard .sq-ft{border-top:1px dashed var(--line);padding:10px 14px;text-align:center;font-size:.72rem;color:var(--muted);text-transform:none;letter-spacing:0}';
  document.head.appendChild(css);
  var lib=null;
  function loadLib(){ if(window.qrcode) return Promise.resolve(); if(lib) return lib; lib=new Promise(function(res,rej){ var s=document.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js'; s.onload=res; s.onerror=function(){ lib=null; rej(new Error('Could not load the QR maker. Check your internet and try again.')); }; document.head.appendChild(s); }); return lib; }
  var timer=null;
  function fdate(d){ try{ return new Date(d+'T00:00:00').toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long',year:'numeric'}); }catch(e){ return d; } }
  window.sqInit=async function(){
    var box=$('sqBody'); if(!box) return;
    box.innerHTML='<div class="empty">Loading your code...</div>';
    try{
      var j=await _stu({action:'stu_exc_tagcode'}); if(!j||!j.ok) throw new Error((j&&j.error)||'Could not get your code');
      await loadLib();
      var q=window.qrcode(0,'M'); q.addData(j.code); q.make();
      var name=''; try{ name=(window.studentCurrentAccount&&studentCurrentAccount.name)||''; }catch(e){}
      var ix=j.code.split('.')[1]||'';
      box.innerHTML='<div class="sq-badge"><div class="sq-hd"><b>My QR Tag</b><span>UENR Civil &amp; Environmental Engineering</span></div><div class="sq-bd"><div class="sq-img">'+q.createSvgTag({cellSize:6,margin:0,scalable:true})+'</div>'
        +(name?'<div class="sq-nm">'+esc(name)+'</div>':'')+'<div class="sq-ix">'+esc(ix)+'</div><span class="sq-d">Valid today &middot; '+esc(fdate(j.date))+'</span>'
        +'<div class="sq-n">Show this to your lecturer or TA when they scan. It changes every day, so an old screenshot will not work. Do not share it.</div></div><div class="sq-ft">Refreshes automatically at midnight</div></div>';
      clearTimeout(timer); var now=new Date(), nx=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()+1,0,0,5)); timer=setTimeout(function(){ if($('dashQrCard')&&!$('dashQrCard').classList.contains('hidden')) sqInit(); },Math.max(1000,nx-now));
    }catch(e){ box.innerHTML='<div class="empty">'+esc(e.message||'Could not load')+'</div>'; }
  };
  var lastKey='';
  function key(){ var em=''; try{ em=(typeof studentCurrentEmail!=='undefined'&&studentCurrentEmail)||''; }catch(e){} return em+'|'+(window._asTest||'')+'|'+new Date().toISOString().slice(0,10); }
  function visible(){ var c=$('dashQrCard'); return c && c.offsetParent!==null; }
  setInterval(function(){ try{ var k=key(); if(k.charAt(0)!=='|' && visible() && k!==lastKey){ lastKey=k; sqInit(); } }catch(e){} },2000);
  document.addEventListener('visibilitychange',function(){ try{ if(!document.hidden && visible()) lastKey=''; }catch(e){} });
})();
