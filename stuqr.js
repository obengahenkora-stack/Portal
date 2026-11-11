/* Student's own daily attendance QR. Changes every day; staff scan it in Scan tags. */
(function(){
  function $(i){ return document.getElementById(i); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  var css=document.createElement('style');
  css.textContent='#dashQrCard{padding:0 !important;background:transparent !important;border:0 !important;box-shadow:none !important}#dashQrCard>h2,#dashQrCard>div:first-of-type{display:none}#dashQrCard .sq-badge{max-width:250px;margin:0 auto;border-radius:24px;overflow:hidden;background:var(--card,#fff);border:1px solid var(--line);box-shadow:0 18px 40px rgba(11,42,60,.16)}#dashQrCard .sq-hd{background:linear-gradient(135deg,#0b2a3c,#1d6a8a);color:#fff;padding:12px 14px;text-align:center}#dashQrCard .sq-hd b{display:block;font-size:.98rem;letter-spacing:0;text-transform:none;line-height:1.25}#dashQrCard .sq-hd span{display:block;font-size:.74rem;opacity:.85;margin-top:3px;text-transform:none;letter-spacing:0}#dashQrCard .sq-bd{padding:14px 12px 10px;display:flex;flex-direction:column;align-items:center;gap:6px;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}#dashQrCard .sq-img{position:relative;background:#fff;padding:10px;border-radius:14px;line-height:0;overflow:hidden;box-shadow:0 0 0 1px rgba(11,42,60,.12),0 8px 22px rgba(11,42,60,.12)}#dashQrCard .sq-img svg{width:min(160px,48vw);height:auto;display:block;pointer-events:none}#dashQrCard .sq-img:after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 40%,rgba(29,106,138,.28) 50%,transparent 60%);background-size:260% 100%;animation:sqSh 2.4s linear infinite;pointer-events:none}@keyframes sqSh{from{background-position:130% 0}to{background-position:-130% 0}}#dashQrCard .sq-live{font-family:ui-monospace,Menlo,monospace;font-size:.78rem;font-weight:700;color:#1d6a8a;margin-top:2px}#dashQrCard .sq-cover{display:none;position:absolute;inset:0;background:rgba(255,255,255,.97);align-items:center;justify-content:center;text-align:center;font-size:.8rem;font-weight:700;color:#0b2a3c;padding:10px;line-height:1.3}#dashQrCard .sq-img.off .sq-cover{display:flex}@media print{#dashQrCard{display:none !important}}#dashQrCard .sq-nm{display:none}#dashQrCard .sq-fn{font-size:.72rem;font-weight:600;text-align:center;text-transform:none;letter-spacing:0;color:var(--ink,inherit)}#dashQrCard .sq-ix{font-family:ui-monospace,Menlo,monospace;font-weight:600;font-size:.85rem;background:rgba(11,42,60,.08);padding:2px 10px;border-radius:8px;letter-spacing:.06em}#dashQrCard .sq-d{display:inline-block;background:rgba(31,138,76,.14);color:#1a7a43;border-radius:999px;padding:4px 10px;font-size:.7rem;font-weight:700;margin-top:2px;text-align:center;text-transform:none;letter-spacing:0}#dashQrCard .sq-n{font-size:.68rem;color:var(--muted);text-align:center;margin-top:4px;line-height:1.45;text-transform:none;letter-spacing:0}#dashQrCard .sq-ft{border-top:1px dashed var(--line);padding:7px 10px;text-align:center;font-size:.66rem;color:var(--muted);text-transform:none;letter-spacing:0}';
  document.head.appendChild(css);
  var lib=null;
  function loadLib(){ if(window.qrcode) return Promise.resolve(); if(lib) return lib; lib=new Promise(function(res,rej){ var s=document.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js'; s.onload=res; s.onerror=function(){ lib=null; rej(new Error('Could not load the QR maker. Check your internet and try again.')); }; document.head.appendChild(s); }); return lib; }
  var timer=null;
  var liveT=null;
  function liveStart(){ clearInterval(liveT); function t(){ var e=$('sqLive'); if(!e){ clearInterval(liveT); return; } var d=new Date(Date.now()+(B?B.off:0)); e.textContent='LIVE '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2)+':'+('0'+d.getSeconds()).slice(-2); } t(); liveT=setInterval(t,1000); }
  function cover(on){ var i=$('sqImg'); if(i) i.classList.toggle('off',!!on); }
  document.addEventListener('visibilitychange',function(){ if(document.hidden) cover(true); });
  window.addEventListener('blur',function(){ cover(true); });
  document.addEventListener('click',function(ev){ if(ev.target&&ev.target.closest&&ev.target.closest('#sqImg')) cover(false); });
  document.addEventListener('contextmenu',function(ev){ if(ev.target&&ev.target.closest&&ev.target.closest('#dashQrCard')) ev.preventDefault(); });

  function fdate(d){ try{ return new Date(d+'T00:00:00').toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long',year:'numeric'}); }catch(e){ return d; } }
  function myName(){ try{ return (typeof studentCurrentAccount!=='undefined'&&studentCurrentAccount&&studentCurrentAccount.name)||''; }catch(e){ return ''; } }
  var B=null, tick=null, shown=-1, fetching=false;
  async function fetchBatch(){
    if(fetching) return; fetching=true;
    try{ var t0=Date.now(); var j=await _stu({action:'stu_exc_tagcode'}); if(!j||!j.ok) throw new Error((j&&j.error)||'Could not get your code');
      var t1=Date.now(); B={idx:j.idx,slot:j.slot,step:j.step||4,sigs:j.sigs||[],off:(j.now||t1)-Math.round((t0+t1)/2),fetchedAt:t1,date:new Date((j.now||t1)).toISOString().slice(0,10)}; }
    finally{ fetching=false; }
  }
  function curSlot(){ return Math.floor((Date.now()+B.off)/(B.step*1000)); }
  function paint(){
    var box=$('sqBody'); if(!box||!B) return;
    var sl=curSlot(), i=sl-B.slot, left=B.sigs.length-i;
    if(left<75 && !fetching && (Date.now()-B.fetchedAt>20000)){ fetchBatch().catch(function(){}); }
    var img=$('sqImg'); if(!img) return;
    if(i<0||i>=B.sigs.length){ img.classList.add('off'); var cv=img.querySelector('.sq-cover'); if(cv) cv.textContent='No signal. Reconnect to refresh your code.'; shown=-1; return; }
    if(sl===shown) return; shown=sl;
    var q=window.qrcode(0,'M'); q.addData('UT2.'+B.idx+'.'+sl+'.'+B.sigs[i]); q.make();
    var holder=img.querySelector('.sq-svg'); if(holder) holder.innerHTML=q.createSvgTag({cellSize:6,margin:0,scalable:true});
    var cv2=img.querySelector('.sq-cover'); if(cv2 && cv2.textContent.indexOf('No signal')===0){ cv2.textContent='Tap to show your code'; img.classList.remove('off'); }
  }
  window.sqInit=async function(){
    var box=$('sqBody'); if(!box) return;
    box.innerHTML='<div class="empty">Loading your code...</div>';
    try{
      await fetchBatch(); await loadLib(); shown=-1;
      var name=myName();
      var first=name?name.trim().split(/\s+/)[0]:''; first=first?first.charAt(0).toUpperCase()+first.slice(1).toLowerCase():''; var hdr=(first?esc(first):'Student')+' QR Tag';
      box.innerHTML='<div class="sq-badge" oncontextmenu="return false"><div class="sq-hd"><b>'+hdr+'</b><span>UENR Civil &amp; Environmental Engineering</span></div><div class="sq-bd"><div class="sq-img" id="sqImg"><div class="sq-svg"></div><div class="sq-cover">Tap to show your code</div></div>'
        +'<div class="sq-live" id="sqLive"></div>'+(name?'<div class="sq-fn">'+esc(name)+'</div>':'')+'<div class="sq-ix">'+esc(B.idx)+'</div><span class="sq-d">Live code &middot; '+esc(fdate(B.date))+'</span>'
        +'<div class="sq-n">Show this only to your lecturer or TA. The code changes every few seconds, so a screenshot or photo will not work. Do not share it.</div></div></div>';
      liveStart(); paint(); clearInterval(tick); tick=setInterval(paint,500);
    }catch(e){ box.innerHTML='<div class="empty">'+esc(e.message||'Could not load')+'</div>'; }
  };
  var lastKey='';
  function key(){ var em=''; try{ em=(typeof studentCurrentEmail!=='undefined'&&studentCurrentEmail)||''; }catch(e){} return em+'|'+(window._asTest||'')+'|'+myName()+'|'+new Date().toISOString().slice(0,10); }
  function visible(){ var c=$('dashQrCard'); return c && c.offsetParent!==null; }
  setInterval(function(){ try{ var k=key(); if(k.charAt(0)!=='|' && visible() && k!==lastKey){ lastKey=k; sqInit(); } }catch(e){} },2000);
  document.addEventListener('visibilitychange',function(){ try{ if(!document.hidden && visible()) lastKey=''; }catch(e){} });
})();
