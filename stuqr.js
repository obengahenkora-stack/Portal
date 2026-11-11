/* Student's own daily attendance QR. Changes every day; staff scan it in Scan tags. */
(function(){
  function $(i){ return document.getElementById(i); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  var css=document.createElement('style');
  css.textContent='#dashQrCard .sq-box{display:flex;flex-direction:column;align-items:center;gap:10px;padding:18px 8px}#dashQrCard .sq-img{background:#fff;padding:14px;border-radius:16px;border:1px solid var(--line);line-height:0}#dashQrCard .sq-img img,#dashQrCard .sq-img svg{width:min(260px,70vw);height:auto;display:block}#dashQrCard .sq-nm{font-weight:700;font-size:1.05rem;text-align:center}#dashQrCard .sq-ix{font-family:ui-monospace,Menlo,monospace;color:var(--muted);font-size:.9rem}#dashQrCard .sq-d{display:inline-block;background:rgba(31,138,76,.12);color:#1f8a4c;border-radius:999px;padding:3px 12px;font-size:.8rem;font-weight:700}#dashQrCard .sq-n{font-size:.8rem;color:var(--muted);text-align:center;max-width:320px}';
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
      box.innerHTML='<div class="sq-box"><div class="sq-img">'+q.createSvgTag({cellSize:6,margin:0,scalable:true})+'</div>'
        +(name?'<div class="sq-nm">'+esc(name)+'</div>':'')+'<div class="sq-ix">'+esc(ix)+'</div><span class="sq-d">Valid today: '+esc(fdate(j.date))+'</span>'
        +'<div class="sq-n">Show this code to your lecturer or TA when they scan tags. It changes every day, so an old screenshot will not work. Do not share it.</div></div>';
      clearTimeout(timer); var now=new Date(), nx=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()+1,0,0,5)); timer=setTimeout(function(){ if($('dashQrCard')&&!$('dashQrCard').classList.contains('hidden')) sqInit(); },Math.max(1000,nx-now));
    }catch(e){ box.innerHTML='<div class="empty">'+esc(e.message||'Could not load')+'</div>'; }
  };
  try{ var _dt=window.dashTab; if(typeof _dt==='function' && $('sqBody')){ window.dashTab=function(id){ var r=_dt.apply(this,arguments); if(id==='dashQrCard') sqInit(); return r; }; } }catch(e){}
  document.addEventListener('visibilitychange',function(){ try{ if(!document.hidden && $('dashQrCard') && !$('dashQrCard').classList.contains('hidden')) sqInit(); }catch(e){} });
})();
