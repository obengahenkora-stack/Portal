/* ===== Online Exams (student): list, camera check, timed exam, random photos, page-leave tracking ===== */
(function(){
function $(i){ return document.getElementById(i); }
function esc(t){ return String(t==null?'':t).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function fmt(iso){ try{ return new Date(iso).toLocaleString([], {weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}); }catch(e){ return iso; } }
function device(){ var k='ceDeviceId', v=null; try{ v=localStorage.getItem(k); }catch(e){} if(!v){ v='d'+Date.now().toString(36)+Math.random().toString(36).slice(2,10); try{ localStorage.setItem(k,v); }catch(e){} } return v; }
var css=document.createElement('style');
css.textContent='.oes-card{border:1px solid var(--line);border-left:4px solid #0ea5e9;border-radius:16px;padding:14px;margin-top:12px;background:var(--card)}'
+'.oes-card.go{border-left-color:#16a34a}.oes-card.done{border-left-color:#8b5cf6}.oes-card.off{border-left-color:#9ca3af}'
+'.oes-nm{font-weight:700;line-height:1.25;overflow-wrap:anywhere}.oes-sub{font-size:.8rem;color:var(--muted);margin-top:2px}'
+'.oes-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.oes-chip{padding:3px 10px;border-radius:999px;font-size:.73rem;font-weight:700;background:rgba(14,165,233,.12);color:#0369a1}.oes-chip.g{background:rgba(127,127,127,.16);color:var(--ink)}'
+'.oes-btn:not(#z){width:100% !important;margin-top:12px;padding:12px !important;border-radius:14px !important;font-weight:700 !important;text-transform:none !important;letter-spacing:0 !important;font-size:.92rem !important}'
+'.oes-btn.s:not(#z){background:transparent !important;color:var(--ink) !important;border:1px solid var(--line) !important;box-shadow:none !important}'
+'.oes-btn[disabled]{opacity:.5}'
+'#oeRun{position:fixed;inset:0;z-index:100000;background:var(--page,#f3f6f1);color:var(--ink);overflow-y:auto;-webkit-overflow-scrolling:touch}'
+'#oeRun .oer{max-width:720px;margin:0 auto;padding:16px 16px 120px}'
+'#oeRun .oer-top{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 16px;background:var(--page,#f3f6f1);border-bottom:1px solid var(--line)}'
+'#oeRun .oer-tm{font-weight:800;font-size:1.25rem;font-variant-numeric:tabular-nums}#oeRun .oer-tm.low{color:#dc2626}'
+'#oeRun .oer-q{border:1px solid var(--line);border-radius:18px;padding:18px;background:var(--card);margin-top:14px;-webkit-user-select:none;user-select:none}'
+'#oeRun .oer-qt{font-size:1.05rem;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}'
+'#oeRun .oer-o:not(#z){display:flex !important;width:100% !important;text-align:left;gap:12px;align-items:flex-start;margin-top:10px;padding:13px 14px !important;border-radius:14px !important;background:var(--bg,#fff) !important;color:var(--ink) !important;border:1.5px solid var(--line) !important;box-shadow:none !important;font-size:.95rem !important;font-weight:500 !important;text-transform:none !important;letter-spacing:0 !important}'
+'#oeRun .oer-o b{flex:0 0 26px;width:26px;height:26px;border-radius:50%;border:1.5px solid var(--line);display:flex;align-items:center;justify-content:center;font-size:.78rem}'
+'#oeRun .oer-o.sel:not(#z){border-color:#0ea5e9 !important;background:rgba(14,165,233,.1) !important}#oeRun .oer-o.sel b{background:#0ea5e9;color:#fff;border-color:#0ea5e9}'
+'#oeRun textarea{font-family:inherit !important;font-size:1rem !important;width:100% !important;box-sizing:border-box !important;min-height:180px;margin-top:12px;-webkit-user-select:text;user-select:text}'
+'#oeRun .oer-pal{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}'
+'#oeRun .oer-p:not(#z){width:36px !important;height:36px;padding:0 !important;border-radius:10px !important;background:var(--card) !important;color:var(--ink) !important;border:1px solid var(--line) !important;box-shadow:none !important;font-size:.8rem !important;font-weight:700 !important}'
+'#oeRun .oer-p.ans:not(#z){background:rgba(22,163,74,.18) !important;border-color:#16a34a !important}#oeRun .oer-p.cur:not(#z){outline:2px solid #0ea5e9}'
+'#oeRun .oer-nav{display:flex;gap:10px;margin-top:14px}#oeRun .oer-nav>*{flex:1 1 0}'
+'#oeRun .oer-rec{position:fixed;right:12px;bottom:12px;z-index:3;width:92px;border-radius:12px;overflow:hidden;border:2px solid #dc2626;background:#000;box-shadow:0 4px 14px rgba(0,0,0,.35)}'
+'#oeRun .oer-rec video{display:block;width:100%;height:70px;object-fit:cover;transform:scaleX(-1)}#oeRun .oer-rec span{position:absolute;left:5px;top:4px;font-size:.6rem;font-weight:800;color:#fff;background:#dc2626;border-radius:4px;padding:1px 5px}'
+'#oeRun .oer-vid{width:100%;max-width:320px;border-radius:14px;background:#000;display:block;margin:12px auto;transform:scaleX(-1)}'
+'#oeRun .oer-rules{margin:10px 0 0;padding-left:18px;font-size:.88rem;line-height:1.6}'
+'#oeRun .oer-ov{position:fixed;inset:0;z-index:5;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;padding:20px}'
+'#oeRun .oer-ov>div{max-width:420px;background:var(--bg,#fff);color:var(--ink);border-radius:18px;padding:22px;text-align:center}'
+'#oeRun input[type=text]{width:100% !important;box-sizing:border-box !important;margin-top:10px}';
document.head.appendChild(css);

/* ---------- list ---------- */
var _off=0;
window.oesInit=async function(){
  var box=$('oesBody'); if(!box) return;
  box.innerHTML='<div class="empty">Loading...</div>';
  try{
    var j=await _stu({action:'stu_oe_list'}); _off=(j.now||Date.now())-Date.now();
    var l=j.exams||[]; window._oesList=l; badge(l);
    if(!l.length){ box.innerHTML='<div class="empty">No exams for your courses yet.</div>'; return; }
    box.innerHTML=l.map(function(x,i){
      var now=Date.now()+_off, st=Date.parse(x.start), en=Date.parse(x.end), cls='', act='';
      if(x.state==='submitted'){ cls=' done'; act='<div class="oes-sub" style="margin-top:12px"><b>Submitted</b> '+esc(fmt(x.submittedAt))+'.'+(x.result?'</div><div class="oes-sub" style="margin-top:10px;font-size:1.1rem"><b>Your score: '+x.result.score+' / '+x.result.total+'</b>'+(x.result.pending?' <span style="font-size:.8rem">(some written answers are not marked yet)</span>':'')+(x.result.comment?'<div style="margin-top:6px;font-size:.85rem">Lecturer: '+esc(x.result.comment)+'</div>':'')+'</div>':' Your result will appear when your lecturer releases it.</div>'); }
      else if(x.state==='in_progress'){ cls=' go'; act='<button type="button" class="oes-btn" onclick="oesOpen('+i+')">Continue exam</button>'; }
      else if(now<st){ cls=' off'; act='<div class="oes-sub" style="margin-top:12px">Opens '+esc(fmt(x.start))+'.</div>'; }
      else if(now>en){ cls=' off'; act='<div class="oes-sub" style="margin-top:12px">This exam is closed.</div>'; }
      else { cls=' go'; act='<button type="button" class="oes-btn" onclick="oesOpen('+i+')">Start exam</button>'; }
      return '<div class="oes-card'+cls+'"><div class="oes-nm">'+esc(x.title)+'</div><div class="oes-sub">'+esc(x.course)+'</div><div class="oes-chips"><span class="oes-chip">'+esc(fmt(x.start))+' to '+esc(fmt(x.end))+'</span><span class="oes-chip g">'+x.durationMin+' min</span><span class="oes-chip g">'+x.nQ+' questions</span></div>'+act+'</div>';
    }).join('');
  }catch(e){ box.innerHTML='<div class="empty">Could not load ('+esc(e.message||'error')+')</div>'; }
};
function badge(l){
  var n=l.filter(function(x){ var now=Date.now()+_off; return x.state!=='submitted' && now>=Date.parse(x.start) && now<=Date.parse(x.end); }).length;
  var t=document.querySelector('.ov-link[data-go="dashExamCard"] b'), o=$('oesBadge'); if(o) o.remove();
  if(t && n){ var s=document.createElement('span'); s.id='oesBadge'; s.textContent=n+' open'; s.style.cssText='background:#f43f5e !important;color:#fff !important;border-radius:999px;font-size:.62rem;font-weight:700;padding:2px 7px;margin-left:6px;vertical-align:middle'; t.appendChild(s); }
}

/* ---------- running an exam ---------- */
var S=null; // state of the running exam
function run(h){ var r=$('oeRun'); if(!r){ r=document.createElement('div'); r.id='oeRun'; document.body.appendChild(r); document.body.style.overflow='hidden'; } r.innerHTML=h; return r; }
function closeRun(){ var r=$('oeRun'); if(r) r.remove(); document.body.style.overflow=''; }
function stopAll(){
  if(!S) return; clearInterval(S.tick); clearInterval(S.cam); clearTimeout(S.snapT); clearTimeout(S.saveT);
  try{ S.stream&&S.stream.getTracks().forEach(function(t){ t.stop(); }); }catch(e){}
  document.removeEventListener('visibilitychange',S.onVis); window.removeEventListener('beforeunload',S.onUnload);
  ['copy','cut','paste','contextmenu','dragstart'].forEach(function(ev){ document.removeEventListener(ev,S.block,true); });
  document.removeEventListener('fullscreenchange',S.onFs);
  try{ if(document.fullscreenElement) document.exitFullscreen(); }catch(e){}
  S.running=false;
}

window.oesOpen=function(i){
  var x=(window._oesList||[])[i]; if(!x) return;
  S={x:x,stream:null,running:false,ans:{},dirty:{},cur:0,q:[],queue:[]};
  var resume=x.state==='in_progress';
  run('<div class="oer"><h2 style="margin:0">'+esc(x.title)+'</h2><div class="oes-sub">'+esc(x.course)+'</div>'
   +(x.instructions?'<div class="oer-q" style="-webkit-user-select:text;user-select:text">'+esc(x.instructions)+'</div>':'')
   +'<div class="oer-q" style="-webkit-user-select:text;user-select:text"><b>Before you start</b><ul class="oer-rules"><li>You have <b>'+x.durationMin+' minutes</b>. The timer is kept by the server and keeps running if you leave.</li><li>Your <b>camera must stay on</b> for the whole exam. A small photo of you is taken about every '+x.snapEverySec+' seconds and your lecturer will review them.</li><li>Do not leave this page or switch apps. Each time is recorded'+(x.maxLeaves>0?'; after '+x.maxLeaves+' the exam is submitted automatically':'')+'.</li><li>Use <b>one device</b> only. Copying and pasting is blocked.</li>'+(x.oneWay?'<li>Questions come <b>one at a time and you cannot go back</b>.</li>':'')+'</ul></div>'
   +'<div class="oer-q" style="text-align:center"><video id="oerVid" class="oer-vid" autoplay playsinline muted></video><div id="oerCamMsg" class="oes-sub">Tap the button and allow the camera.</div>'
   +'<button type="button" class="oes-btn s" id="oerCamBtn" onclick="oesCam()">Turn on camera</button>'
   +(x.needsCode&&!resume?'<input type="text" id="oerCode" placeholder="Exam code from your lecturer" autocomplete="off">':'')
   +'<label style="display:flex;gap:10px;align-items:flex-start;text-align:left;margin-top:14px;font-size:.86rem;text-transform:none;letter-spacing:0"><input type="checkbox" id="oerAgree" style="width:auto !important;margin-top:3px" onchange="oesReady()"> <span>I agree to be photographed during this exam and to follow the rules above.</span></label>'
   +'<button type="button" class="oes-btn" id="oerGo" disabled onclick="oesStart()">'+(resume?'Continue exam':'Start exam')+'</button>'
   +'<button type="button" class="oes-btn s" onclick="oesCancel()">Not now</button><div id="oerMsg"></div></div></div>');
};
window.oesCancel=function(){ try{ S&&S.stream&&S.stream.getTracks().forEach(function(t){ t.stop(); }); }catch(e){} closeRun(); S=null; oesInit(); };
window.oesCam=async function(){
  var m=$('oerCamMsg');
  try{
    if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia) throw new Error('This browser cannot use the camera. Please use Chrome or Safari.');
    S.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:480},height:{ideal:360}},audio:false});
    var v=$('oerVid'); v.srcObject=S.stream; await v.play().catch(function(){});
    m.textContent='Camera is on. Make sure your face is clearly visible.'; $('oerCamBtn').style.display='none'; oesReady();
  }catch(e){ m.innerHTML='<span style="color:#dc2626">Camera blocked. Allow the camera for this site in your browser settings, then tap again. ('+esc(e.name==='NotAllowedError'?'permission denied':(e.message||'error'))+')</span>'; }
};
window.oesReady=function(){ var go=$('oerGo'); if(go) go.disabled=!(S&&S.stream&&S.stream.active&&$('oerAgree').checked); };

function shot(why){
  try{
    var v=S.vid; if(!v||!v.videoWidth) return null;
    var c=document.createElement('canvas'); c.width=240; c.height=180; var g=c.getContext('2d');
    var vw=v.videoWidth, vh=v.videoHeight, k=Math.max(240/vw,180/vh), w=vw*k, h=vh*k; g.drawImage(v,(240-w)/2,(180-h)/2,w,h);
    var q=.6, d=c.toDataURL('image/jpeg',q); while(d.length>20000 && q>.2){ q-=.08; d=c.toDataURL('image/jpeg',q); }
    return d;
  }catch(e){ return null; }
}
async function sendSnap(why){
  if(!S||!S.running) return; var d=shot(why); if(!d) return;
  S.queue.push({photo:d,why:why}); if(S.queue.length>10) S.queue.shift();
  await flushSnaps();
}
async function flushSnaps(){
  if(S.flushing) return; S.flushing=true;
  try{ while(S.queue.length){ var it=S.queue[0]; var j=await call({action:'stu_oe_snap',id:S.x.id,photo:it.photo,why:it.why}); S.queue.shift(); if(j&&j.submitted) return; } }catch(e){}
  S.flushing=false;
}
function nextSnap(){
  if(!S||!S.running) return; var I=S.x.snapEverySec*1000, d=I*.15+Math.random()*I*.8;
  S.snapT=setTimeout(function(){ sendSnap('random'); S.snapT=setTimeout(nextSnap,Math.max(500,I-d)); },d);
}
async function call(p){ p.device=device(); var j=await _stu(p); if(j&&j.now) _off=j.now-Date.now(); if(j&&j.submitted&&S&&S.running) finished('The exam was submitted.'); return j; }

window.oesStart=async function(){
  var m=$('oerMsg'), go=$('oerGo'); go.disabled=true; m.innerHTML='<div class="msg ok">Starting...</div>';
  S.vid=$('oerVid'); var ph=shot('start');
  if(!ph){ m.innerHTML='<div class="msg err">The camera is not ready yet. Wait a second and try again.</div>'; go.disabled=false; return; }
  try{
    var j=await _stu({action:'stu_oe_start',id:S.x.id,device:device(),code:($('oerCode')||{}).value||'',photo:ph}); _off=j.now-Date.now();
    S.q=j.questions; S.ans=j.answers||{}; S.cur=Math.min(j.cur||0,S.q.length-1); S.deadline=Date.parse(j.deadline); S.leaves=j.leaves||0; S.max=j.exam.maxLeaves; S.oneWay=j.exam.oneWay; S.running=true; S.hiddenAt=0; S.pasteN=0;
    begin();
  }catch(e){ var t=e.message||'error'; m.innerHTML='<div class="msg err">'+esc(t)+'</div>'; go.disabled=false; }
};

function begin(){
  var stream=S.stream, x=S.x;
  try{ document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen().catch(function(){}); }catch(e){}
  render();
  S.vid=$('oerRecV'); S.vid.srcObject=stream; S.vid.play().catch(function(){});
  S.tick=setInterval(tick,500); tick();
  S.cam=setInterval(camCheck,2000);
  S.onVis=function(){ if(!S||!S.running) return; if(document.hidden){ S.hiddenAt=Date.now(); } else if(S.hiddenAt){ S.hiddenAt=0; leave('leave'); } };
  document.addEventListener('visibilitychange',S.onVis);
  S.onUnload=function(e){ if(S&&S.running){ e.preventDefault(); e.returnValue=''; } }; window.addEventListener('beforeunload',S.onUnload);
  S.block=function(e){ if(!S||!S.running) return; var t=e.target; if(e.type==='contextmenu'||e.type==='dragstart'||t&&t.closest&&t.closest('#oeRun')){ e.preventDefault(); if(e.type==='paste'||e.type==='copy'||e.type==='cut'){ if(S.pasteN++<5) leave('paste_attempt'); } } };
  ['copy','cut','paste','contextmenu','dragstart'].forEach(function(ev){ document.addEventListener(ev,S.block,true); });
  S.onFs=function(){ if(S&&S.running&&!document.fullscreenElement) leave('fullscreen_exit'); }; document.addEventListener('fullscreenchange',S.onFs);
  nextSnap();
}

function render(){
  var r=$('oeRun'), q=S.q[S.cur], n=S.q.length, ans=S.ans[q.id];
  var body;
  if(q.type==='mcq'){ body=q.options.map(function(o,k){ return '<button type="button" class="oer-o'+(ans===k?' sel':'')+'" onclick="oesPick('+k+')"><b>'+String.fromCharCode(65+k)+'</b><span>'+esc(o)+'</span></button>'; }).join(''); }
  else body='<textarea id="oerText" placeholder="Type your answer here" oninput="oesText(this.value)">'+esc(ans||'')+'</textarea>';
  var pal=S.oneWay?'':'<div class="oer-pal">'+S.q.map(function(z,i){ var a=S.ans[z.id]; return '<button type="button" class="oer-p'+(a!==undefined&&a!==''?' ans':'')+(i===S.cur?' cur':'')+'" onclick="oesGo('+i+')">'+(i+1)+'</button>'; }).join('')+'</div>';
  var last=S.cur===n-1;
  r.innerHTML='<div class="oer-top"><div><div style="font-weight:700;font-size:.85rem;overflow-wrap:anywhere">'+esc(S.x.title)+'</div><div class="oes-sub" style="margin:0">Question '+(S.cur+1)+' of '+n+' &middot; '+q.marks+' mark'+(q.marks===1?'':'s')+'</div></div><div class="oer-tm" id="oerTm">--:--</div></div>'
   +'<div class="oer"><div class="oer-q"><div class="oer-qt">'+esc(q.text)+'</div>'+body+'</div>'
   +'<div class="oer-nav">'+(!S.oneWay&&S.cur>0?'<button type="button" class="oes-btn s" onclick="oesGo('+(S.cur-1)+')">Back</button>':'')+(last?'<button type="button" class="oes-btn" onclick="oesFinish()">Finish and submit</button>':'<button type="button" class="oes-btn" onclick="oesGo('+(S.cur+1)+')">'+(S.oneWay?'Next (cannot come back)':'Next')+'</button>')+'</div>'
   +pal+'<div id="oerSave" class="oes-sub" style="text-align:center;margin-top:12px"></div></div>'
   +'<div class="oer-rec"><video id="oerRecV" autoplay playsinline muted></video><span>REC</span></div>';
  S.vid=$('oerRecV'); S.vid.srcObject=S.stream; S.vid.play().catch(function(){});
  tick();
}
window.oesPick=function(k){ var q=S.q[S.cur]; S.ans[q.id]=k; S.dirty[q.id]=k; render(); saveSoon(); };
window.oesText=function(v){ var q=S.q[S.cur]; S.ans[q.id]=v; S.dirty[q.id]=v; saveSoon(); };
window.oesGo=function(i){ if(i<0||i>=S.q.length) return; flushNow(); S.cur=i; render(); window.scrollTo(0,0); var r=$('oeRun'); if(r) r.scrollTop=0; };
function saveSoon(){ clearTimeout(S.saveT); S.saveT=setTimeout(flushNow,1200); var s=$('oerSave'); if(s) s.textContent='Saving...'; }
async function flushNow(){
  if(!S||!S.running||!Object.keys(S.dirty).length) return; var d=S.dirty; S.dirty={};
  try{ await call({action:'stu_oe_save',id:S.x.id,answers:d,cur:S.cur}); var s=$('oerSave'); if(s) s.textContent='Saved'; }
  catch(e){ Object.keys(d).forEach(function(k){ if(!(k in S.dirty)) S.dirty[k]=d[k]; }); var s2=$('oerSave'); if(s2) s2.textContent='Connection problem. Your answers are kept and will save when it returns.'; clearTimeout(S.saveT); S.saveT=setTimeout(flushNow,4000); }
}
async function leave(kind){
  if(!S||!S.running) return;
  try{ var j=await call({action:'stu_oe_leave',id:S.x.id,kind:kind});
    if(j&&j.submitted){ finished('The exam was submitted because you left the page too many times.'); return; }
    if(kind==='leave'){ sendSnap('leave'); warn('You left the exam page. This has been recorded.'+(S.max>0?' ('+j.leaves+' of '+S.max+' allowed. One more than that and the exam is submitted.)':'')); }
  }catch(e){}
}
function warn(t){ var r=$('oeRun'); if(!r) return; var o=document.createElement('div'); o.className='oer-ov'; o.innerHTML='<div><div style="font-weight:800;font-size:1.05rem;margin-bottom:8px">Warning</div><div style="line-height:1.5">'+esc(t)+'</div><button type="button" class="oes-btn" onclick="this.closest(\'.oer-ov\').remove();try{document.documentElement.requestFullscreen()}catch(e){}">Continue the exam</button></div>'; r.appendChild(o); }
function camCheck(){
  if(!S||!S.running) return; var t=S.stream&&S.stream.getVideoTracks()[0], ok=t&&t.readyState==='live'&&!t.muted&&S.stream.active;
  if(!ok && !$('oerCamOv')){ leave('camera_off'); var r=$('oeRun'); var o=document.createElement('div'); o.id='oerCamOv'; o.className='oer-ov'; o.innerHTML='<div><div style="font-weight:800;font-size:1.05rem;margin-bottom:8px">Camera is off</div><div style="line-height:1.5">Your camera must stay on during the exam. Turn it back on to continue. The timer is still running.</div><button type="button" class="oes-btn" onclick="oesCamBack()">Turn camera on</button><div id="oerCamErr" class="oes-sub"></div></div>'; r.appendChild(o); }
  else if(ok && $('oerCamOv')) $('oerCamOv').remove();
}
window.oesCamBack=async function(){ try{ S.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:480},height:{ideal:360}},audio:false}); S.vid.srcObject=S.stream; S.vid.play().catch(function(){}); var o=$('oerCamOv'); if(o) o.remove(); }catch(e){ var m=$('oerCamErr'); if(m) m.textContent='Still blocked. Allow the camera in your browser settings.'; } };
function tick(){
  if(!S||!S.running) return; var left=Math.max(0,S.deadline-(Date.now()+_off)), m=Math.floor(left/60000), s=Math.floor(left/1000)%60, t=$('oerTm');
  if(t){ t.textContent=('0'+m).slice(-2)+':'+('0'+s).slice(-2); t.classList.toggle('low',left<300000); }
  if(left<=0 && !S.ending){ S.ending=true; submit('Time is up. Your exam was submitted.'); }
}
window.oesFinish=function(){
  var un=S.q.filter(function(z){ var a=S.ans[z.id]; return a===undefined||a===''; }).length;
  var r=$('oeRun'), o=document.createElement('div'); o.className='oer-ov';
  o.innerHTML='<div><div style="font-weight:800;font-size:1.05rem;margin-bottom:8px">Submit the exam?</div><div style="line-height:1.5">'+(un?'You have <b>'+un+'</b> unanswered question'+(un===1?'':'s')+'. ':'')+'You cannot change your answers after submitting.</div><button type="button" class="oes-btn" onclick="oesSubmit()">Yes, submit</button><button type="button" class="oes-btn s" onclick="this.closest(\'.oer-ov\').remove()">Go back</button></div>';
  r.appendChild(o);
};
window.oesSubmit=function(){ submit('Your exam has been submitted.'); };
async function submit(msg){
  if(!S) return; var d={}; S.q.forEach(function(z){ if(S.ans[z.id]!==undefined) d[z.id]=S.ans[z.id]; });
  try{ await call({action:'stu_oe_submit',id:S.x.id,answers:d}); finished(msg); }
  catch(e){ S.ending=false; var r=$('oeRun'); if(r) warn('Could not submit: '+(e.message||'connection problem')+'. Your answers are saved. Check your internet and press Finish again.'); }
}
function finished(msg){
  if(!S) return; stopAll(); var x=S.x;
  run('<div class="oer" style="text-align:center;padding-top:60px"><div style="font-size:3rem">&#9989;</div><h2>'+esc(msg)+'</h2><div class="oes-sub">'+esc(x.title)+'. Your lecturer will release your result.</div><button type="button" class="oes-btn" onclick="oesDone()">Back to my exams</button></div>');
}
window.oesDone=function(){ closeRun(); S=null; oesInit(); };

/* ---------- hooks ---------- */
try{ var _dt=window.dashTab; if(typeof _dt==='function' && $('oesBody')){ window.dashTab=function(id){ var r=_dt.apply(this,arguments); if(id==='dashExamCard') oesInit(); return r; }; } }catch(e){}
if($('oesBody')) document.addEventListener('DOMContentLoaded',function(){ setTimeout(function(){ try{ oesInit(); }catch(e){} },1500); });
})();
