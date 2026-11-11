/* Student's own daily attendance QR. Changes every day; staff scan it in Scan tags. */
(function(){
  function $(i){ return document.getElementById(i); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  var css=document.createElement('style');
  css.textContent='#dashQrCard{padding:0 !important;background:transparent !important;border:0 !important;box-shadow:none !important}#dashQrCard>h2,#dashQrCard>div:first-of-type{display:none}#dashQrCard .sq-badge{max-width:250px;margin:0 auto;border-radius:24px;overflow:hidden;background:var(--card,#fff);border:1px solid var(--line);box-shadow:0 18px 40px rgba(11,42,60,.16)}#dashQrCard .sq-hd{background:linear-gradient(135deg,#0b2a3c,#1d6a8a);color:#fff;padding:12px 14px;text-align:center}#dashQrCard .sq-hd b{display:block;font-size:.98rem;letter-spacing:0;text-transform:none;line-height:1.25}#dashQrCard .sq-hd span{display:block;font-size:.74rem;opacity:.85;margin-top:3px;text-transform:none;letter-spacing:0}#dashQrCard .sq-bd{padding:14px 12px 10px;display:flex;flex-direction:column;align-items:center;gap:6px;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}#dashQrCard .sq-img{position:relative;background:#fff;padding:10px;border-radius:14px;line-height:0;overflow:hidden;box-shadow:0 0 0 1px rgba(11,42,60,.12),0 8px 22px rgba(11,42,60,.12)}#dashQrCard .sq-img svg{width:min(160px,48vw);height:auto;display:block;pointer-events:none}#dashQrCard .sq-img:after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 40%,rgba(29,106,138,.28) 50%,transparent 60%);background-size:260% 100%;animation:sqSh 2.4s linear infinite;pointer-events:none}@keyframes sqSh{from{background-position:130% 0}to{background-position:-130% 0}}#dashQrCard .sq-live{font-family:ui-monospace,Menlo,monospace;font-size:.78rem;font-weight:700;color:#1d6a8a;margin-top:2px}#dashQrCard .sq-cover{display:none;position:absolute;inset:0;background:rgba(255,255,255,.97);align-items:center;justify-content:center;text-align:center;font-size:.8rem;font-weight:700;color:#0b2a3c;padding:10px;line-height:1.3}#dashQrCard .sq-img.off .sq-cover{display:flex}@media print{#dashQrCard{display:none !important}}#dashQrCard .sq-nm{display:none}#dashQrCard .sq-ix{font-family:ui-monospace,Menlo,monospace;font-weight:600;font-size:.85rem;background:rgba(11,42,60,.08);padding:2px 10px;border-radius:8px;letter-spacing:.06em}#dashQrCard .sq-d{display:inline-block;background:rgba(31,138,76,.14);color:#1a7a43;border-radius:999px;padding:4px 10px;font-size:.7rem;font-weight:700;margin-top:2px;text-align:center;text-transform:none;letter-spacing:0}#dashQrCard .sq-n{font-size:.68rem;color:var(--muted);text-align:center;margin-top:4px;line-height:1.45;text-transform:none;letter-spacing:0}#dashQrCard .sq-ft{border-top:1px dashed var(--line);padding:7px 10px;text-align:center;font-size:.66rem;color:var(--muted);text-transform:none;letter-spacing:0}';
  document.head.appendChild(css);
  var lib=null;
  function loadLib(){ if(window.qrcode) return Promise.resolve(); if(lib) return lib; lib=new Promise(function(res,rej){ var s=document.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js'; s.onload=res; s.onerror=function(){ lib=null; rej(new Error('Could not load the QR maker. Check your internet and try again.')); }; document.head.appendChild(s); }); return lib; }
  var timer=null;
  var liveT=null;
  function liveStart(){ clearInterval(liveT); function t(){ var e=$('sqLive'); if(!e){ clearInterval(liveT); return; } var d=new Date(); e.textContent='LIVE '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2)+':'+('0'+d.getSeconds()).slice(-2); } t(); liveT=setInterval(t,1000); }
  function cover(on){ var i=$('sqImg'); if(i) i.classList.toggle('off',!!on); }
  document.addEventListener('visibilitychange',function(){ if(document.hidden) cover(true); });
  window.addEventListener('blur',function(){ cover(true); });
  document.addEventListener('click',function(ev){ if(ev.target&&ev.target.closest&&ev.target.closest('#sqImg')) cover(false); });
  document.addEventListener('contextmenu',function(ev){ if(ev.target&&ev.target.closest&&ev.target.closest('#dashQrCard')) ev.preventDefault(); });

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
      var hdr=(name?esc(name):'Student')+' QR Tag';
      box.innerHTML='<div class="sq-badge" oncontextmenu="return false"><div class="sq-hd"><b>'+hdr+'</b><span>UENR Civil &amp; Environmental Engineering</span></div><div class="sq-bd"><div class="sq-img" id="sqImg">'+q.createSvgTag({cellSize:6,margin:0,scalable:true})+'<div class="sq-cover">Tap to show your code</div></div>'
        +'<div class="sq-live" id="sqLive"></div><div class="sq-ix">'+esc(ix)+'</div><span class="sq-d">Valid today &middot; '+esc(fdate(j.date))+'</span>'
        +'<div class="sq-n">Show this only to your lecturer or TA. It changes every day. Do not share or photograph it.</div></div></div>';
      liveStart();
      clearTimeout(timer); var now=new Date(), nx=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()+1,0,0,5)); timer=setTimeout(function(){ if($('dashQrCard')&&!$('dashQrCard').classList.contains('hidden')) sqInit(); },Math.max(1000,nx-now));
    }catch(e){ box.innerHTML='<div class="empty">'+esc(e.message||'Could not load')+'</div>'; }
  };
  var lastKey='';
  function key(){ var em=''; try{ em=(typeof studentCurrentEmail!=='undefined'&&studentCurrentEmail)||''; }catch(e){} return em+'|'+(window._asTest||'')+'|'+new Date().toISOString().slice(0,10); }
  function visible(){ var c=$('dashQrCard'); return c && c.offsetParent!==null; }
  setInterval(function(){ try{ var k=key(); if(k.charAt(0)!=='|' && visible() && k!==lastKey){ lastKey=k; sqInit(); } }catch(e){} },2000);
  document.addEventListener('visibilitychange',function(){ try{ if(!document.hidden && visible()) lastKey=''; }catch(e){} });
})();
