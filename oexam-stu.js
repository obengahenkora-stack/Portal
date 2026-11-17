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
+'#oeRun{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}#oeRun textarea,#oeRun input{-webkit-user-select:text;user-select:text}'
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
+'#oeRun .oer-rec.gtl{left:10px;right:auto;top:8px;bottom:auto;width:88px;border-color:#16a34a}#oeRun .oer-rec.gtl video{height:66px}#oeRun .oer-rec.gtl svg{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none}'
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
var GMARK=/\[\[(?:faceguard|qtime=\d+|recheck=\d+)\]\]/ig;
function rcOn(x){ var m=/\[\[recheck=(\d+)\]\]/i.exec((x&&x.instructions)||''); var n=m?parseInt(m[1],10):0; return Math.max(0,Math.min(3,n)); }
function qtOn(x){ var m=/\[\[qtime=(\d+)\]\]/i.exec((x&&x.instructions)||''); var n=m?parseInt(m[1],10):0; return n>=10?Math.min(600,n):0; }
function gOn(x){ return !!(x&&/\[\[faceguard\]\]/i.test(x.instructions||'')); }
function insTxt(x){ return String((x&&x.instructions)||'').replace(GMARK,'').trim(); }
function run(h){ var r=$('oeRun'); if(!r){ r=document.createElement('div'); r.id='oeRun'; document.body.appendChild(r); document.body.style.overflow='hidden'; } r.innerHTML=h; return r; }
function closeRun(){ var r=$('oeRun'); if(r) r.remove(); document.body.style.overflow=''; }
function stopAll(){
  if(!S) return; clearInterval(S.tick); clearInterval(S.cam); clearInterval(S.monT); clearTimeout(S.snapT); clearTimeout(S.saveT);
  try{ S.stream&&S.stream.getTracks().forEach(function(t){ t.stop(); }); }catch(e){}
  document.removeEventListener('visibilitychange',S.onVis); window.removeEventListener('beforeunload',S.onUnload);
  ['copy','cut','paste','contextmenu','dragstart'].forEach(function(ev){ document.removeEventListener(ev,S.block,true); });
  document.removeEventListener('fullscreenchange',S.onFs);
  try{ document.removeEventListener('selectstart',S.noSel,true); document.removeEventListener('keydown',S.keys,true); if(S.wl) S.wl.release(); }catch(e){}
  try{ if(document.fullscreenElement) document.exitFullscreen(); }catch(e){}
  S.running=false;
}

window.oesOpen=function(i){
  var x=(window._oesList||[])[i]; if(!x) return;
  S={x:x,stream:null,running:false,ans:{},dirty:{},cur:0,q:[],queue:[]};
  var resume=x.state==='in_progress'; if(gOn(x)){ try{ fdLoad(); }catch(e){} }
  run('<div class="oer"><h2 style="margin:0">'+esc(x.title)+'</h2><div class="oes-sub">'+esc(x.course)+'</div>'
   +(insTxt(x)?'<div class="oer-q" style="-webkit-user-select:text;user-select:text">'+esc(insTxt(x))+'</div>':'')
   +'<div class="oer-q" style="-webkit-user-select:text;user-select:text"><b>Before you start</b><ul class="oer-rules"><li>You have <b>'+x.durationMin+' minutes</b>. The timer is kept by the server and keeps running if you leave.</li><li>Your <b>camera must stay on</b> for the whole exam. A small photo of you is taken about every '+x.snapEverySec+' seconds and your lecturer will review them.</li><li>Do not leave this page or switch apps. Each time is recorded'+(x.maxLeaves>0?'; after '+x.maxLeaves+' the exam is submitted automatically':'')+'.</li><li>Use <b>one device</b> only. Copying and pasting is blocked.</li>'+(gOn(x)?'<li><b>Face guard:</b> keep your face inside the oval. The moment it leaves, you get a warning, and after 2 seconds the exam pauses and the questions are hidden. The timer keeps running. Move back into the oval to continue.</li>':'')+'<li><b>Your camera photos:</b> the camera takes photos at random moments and when something unusual is noticed. They are used only to check the exam was taken fairly, are seen only by your lecturers and teaching assistants, and are deleted by your lecturer when no longer needed. Your fingerprint or face data stays on your phone; the portal only receives a yes or no. A flag is a question for a person to look at, not a decision.</li>'+(rcOn(x)?'<li><b>Identity re-check:</b> '+rcOn(x)+' time'+(rcOn(x)===1?'':'s')+' during the exam you will be asked to confirm with your fingerprint or face again. The timer keeps running.</li>':'')+(qtOn(x)?'<li><b>Each question has its own timer ('+qtOn(x)+' seconds).</b> When it runs out you move to the next question automatically and cannot come back. Unanswered questions get no marks.</li>':'')+(x.oneWay?'<li>Questions come <b>one at a time and you cannot go back</b>.</li>':'')+'</ul></div>'
   +'<div class="oer-q" style="text-align:center"><div style="position:relative;width:100%;max-width:320px;margin:12px auto"><video id="oerVid" class="oer-vid" style="margin:0" autoplay playsinline muted></video>'+(gOn(x)?'<svg id="oerOval" viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none"><ellipse cx="50" cy="48" rx="23" ry="35" fill="none" stroke="#f59e0b" stroke-width="1.6" stroke-dasharray="4 2" vector-effect="non-scaling-stroke" id="oerOvE"/></svg>':'')+'</div><div id="oerCamMsg" class="oes-sub">Tap the button and allow the camera.</div>'
   +'<button type="button" class="oes-btn s" id="oerCamBtn" onclick="oesCam()">Turn on camera</button>'
   +(gOn(x)?'<div id="oerGchk" class="oes-sub" style="margin-top:8px"></div>':'')
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
    m.textContent='Camera is on. Make sure your face is clearly visible.'; $('oerCamBtn').style.display='none'; if(gOn(S.x)) gCheck(); oesReady();
  }catch(e){ m.innerHTML='<span style="color:#dc2626">Camera blocked. Allow the camera for this site in your browser settings, then tap again. ('+esc(e.name==='NotAllowedError'?'permission denied':(e.message||'error'))+')</span>'; }
};
window.oesReady=function(){ var go=$('oerGo'); if(go) go.disabled=!(S&&S.stream&&S.stream.active&&$('oerAgree').checked&&(!gOn(S.x)||S.gOk)); };
/* ---- face guard: start check, saved baseline (items 11, 12, 18) ---- */
function faceInfo(f,v){
  var kp=f.keypoints||[], bb=f.boundingBox||{}; var W=v.videoWidth||1, H=v.videoHeight||1;
  var o={cx:(bb.originX+bb.width/2)/W, cy:(bb.originY+bb.height/2)/H, w:bb.width/W, yaw:0};
  if(kp.length>=3){ var mid=(kp[0].x+kp[1].x)/2, ww=Math.abs(kp[0].x-kp[1].x)||1; o.yaw=(kp[2].x-mid)/ww; }
  return o;
}
function ovCol(c){ var e=$('oerOvE'); if(e){ e.setAttribute('stroke',c); e.setAttribute('stroke-dasharray',c==='#16a34a'?'0':'4 2'); } }
function gCheck(){
  var G=S.gc={t0:Date.now(),good:[],tm:0}; var m=$('oerGchk'); if(m) m.textContent='Loading the face check...'; ovCol('#f59e0b');
  S.gOk=false; fdLoad();
  G.tm=setInterval(function(){
    if(!S||S.running||!$('oerGchk')){ clearInterval(G.tm); return; }
    var v=$('oerVid'), msg=$('oerGchk'), el=Date.now()-G.t0;
    if(!_fd){
      var sk='<div style="margin-top:6px"><button type="button" class="oes-btn s" onclick="oesGuardSkip()">Start without the face check (recorded)</button></div>';
      if(_fdErr){ ovCol('#9ca3af'); msg.innerHTML='<span style="color:#b45309">The face check could not load ('+esc(_fdErr)+').</span><div style="margin-top:6px"><button type="button" class="oes-btn s" onclick="oesFdRetry()">Try again</button></div>'+sk; clearInterval(G.tm); }
      else if(el>100000){ ovCol('#9ca3af'); msg.innerHTML='<span style="color:#b45309">The face check is taking too long. Check your internet, then try again.</span><div style="margin-top:6px"><button type="button" class="oes-btn s" onclick="oesFdRetry()">Try again</button></div>'+sk; clearInterval(G.tm); }
      else msg.innerHTML='<span style="color:#b45309">Loading the face check... '+Math.round(el/1000)+' s. The first time can take up to a minute on mobile data.</span>'+(el>30000?sk:'');
      return; }
    if(!v||v.readyState<2||!v.videoWidth) return;
    try{
      var r=_fd.detectForVideo(v,performance.now()), f=(r&&r.detections)||[];
      if(f.length===1){ var i=faceInfo(f[0],v); if(Math.abs(i.cx-.5)<.2&&Math.abs(i.cy-.5)<.25&&i.w>.15&&i.w<.75&&Math.abs(i.yaw)<.3){ G.good.push(i); ovCol('#16a34a'); msg.innerHTML='<span style="color:#15803d">Good. Hold still...</span>'; } else { G.good=[]; ovCol('#f59e0b'); msg.innerHTML='<span style="color:#b45309">Put your head inside the oval and look straight at the screen.</span>'; } }
      else { G.good=[]; ovCol('#dc2626'); msg.innerHTML='<span style="color:#b45309">'+(f.length?'Only one face should be in view.':'I cannot see your face yet. Move closer and add light.')+'</span>'; }
      if(G.good.length>=4){
        var med=function(k){ var a=G.good.map(function(x){return x[k];}).sort(function(a,b){return a-b;}); return a[Math.floor(a.length/2)]; };
        S.base={cx:med('cx'),cy:med('cy'),w:med('w'),yaw:med('yaw')}; S.gOk=true; ovCol('#16a34a'); msg.innerHTML='<span style="color:#15803d">&#10003; Face check passed. Your position is saved.</span>'; clearInterval(G.tm); oesReady();
      } else if(el>25000 && !S.gHelp){ S.gHelp=1; msg.innerHTML+='<div style="margin-top:6px"><button type="button" class="oes-btn s" onclick="oesGuardSkip()">Face check not working? Start anyway (recorded)</button></div>'; }
    }catch(e){}
  },700);
}
window.oesGuardSkip=function(){ if(!S) return; S.gOk='manual'; if(S.gc) clearInterval(S.gc.tm); var m=$('oerGchk'); if(m) m.innerHTML='<span style="color:#b45309">Starting without the face check. This will be recorded.</span>'; oesReady(); };

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
var _chain=Promise.resolve();
function call(p){ var run=function(){ return call1(p); }; var r=_chain.then(run,run); _chain=r.catch(function(){}); return r; }
async function call1(p){ p.device=device(); var j=await _stu(p); if(j&&j.now) _off=j.now-Date.now(); if(j&&j.submitted&&S&&S.running) finished('The exam was submitted.'); return j; }

function bioKey(){ try{ return JSON.parse(localStorage.getItem('ceBio_student')||'null'); }catch(e){ return null; } }
function rnd(n){ var a=new Uint8Array(n); crypto.getRandomValues(a); return a; }
function unb(t){ t=t.replace(/-/g,'+').replace(/_/g,'/'); while(t.length%4) t+='='; var s=atob(t),u=new Uint8Array(s.length); for(var i=0;i<s.length;i++) u[i]=s.charCodeAt(i); return u; }
async function bioCheck(){
  // returns 'ok' | 'unsupported' ; throws if the student cancels or fails
  if(!(window.PublicKeyCredential&&navigator.credentials&&navigator.credentials.get&&window.isSecureContext)) return 'unsupported';
  try{
    var b=bioKey();
    if(b&&b.cid){ await navigator.credentials.get({publicKey:{challenge:rnd(32),allowCredentials:[{type:'public-key',id:unb(b.cid),transports:['internal']}],userVerification:'required',timeout:60000}}); return 'ok'; }
    var em=(typeof studentCurrentEmail!=='undefined'&&studentCurrentEmail)||'student';
    await navigator.credentials.create({publicKey:{challenge:rnd(32),rp:{name:'UENR Civil & Environmental Engineering',id:location.hostname},user:{id:rnd(16),name:em,displayName:em},pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required'},timeout:60000}});
    return 'ok';
  }catch(e){ if(e&&(e.name==='NotSupportedError'||e.name==='SecurityError'||e.name==='InvalidStateError')) return 'unsupported'; throw new Error('Fingerprint or face not confirmed. Try again, or ask your lecturer.'); }
}
window.oesStart=async function(){
  var m=$('oerMsg'), go=$('oerGo'); go.disabled=true; m.innerHTML='<div class="msg ok">Starting...</div>';
  S.vid=$('oerVid'); var ph=shot('start');
  if(!ph){ m.innerHTML='<div class="msg err">The camera is not ready yet. Wait a second and try again.</div>'; go.disabled=false; return; }
  try{
    var bio='off'; if(S.x.bioStart!==false){ m.innerHTML='<div class="msg ok">Confirm with your fingerprint or face...</div>'; bio=await bioCheck(); m.innerHTML='<div class="msg ok">Starting...</div>'; }
    var cam=''; try{ cam=(S.stream.getVideoTracks()[0]||{}).label||''; }catch(e){}
    var j=await _stu({action:'stu_oe_start',id:S.x.id,device:device(),code:($('oerCode')||{}).value||'',photo:ph,bio:bio,cam:cam}); _off=j.now-Date.now(); S.me=j.me||null;
    S.q=j.questions; S.ans=j.answers||{}; S.cur=Math.min(j.cur||0,S.q.length-1); S.deadline=Date.parse(j.deadline); S.leaves=j.leaves||0; S.max=j.exam.maxLeaves; S.oneWay=j.exam.oneWay||!!qtOn(S.x); S.qT=qtOn(S.x); S.qAtSrv=(S.qT&&j.qAt)?Date.parse(j.qAt):0; if(S.qT&&j.qAt) S.cur=Math.min(S.q.length-1,Math.max(S.cur,j.qCur||0)); S.running=true; S.hiddenAt=0; S.pasteN=0;
    begin();
  }catch(e){ var t=e.message||'error'; m.innerHTML='<div class="msg err">'+esc(t)+'</div>'; go.disabled=false; }
};

function begin(){
  var stream=S.stream, x=S.x;
  try{ document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen().catch(function(){}); }catch(e){}
  qtStart(false);
  render();
  S.vid=$('oerRecV'); S.vid.srcObject=stream; S.vid.play().catch(function(){});
  S.tick=setInterval(tick,500); tick();
  S.cam=setInterval(camCheck,2000); S.dwT=Date.now(); S.dwI=S.cur; rcPlan(); S.g={on:gOn(x)&&S.gOk===true&&!!S.base,state:'run',offAt:0,okAt:0,hold:0,pauses:0,warnMs:0,pauseMs:2000,backMs:1500}; try{ monStart(); }catch(e){}
  if(gOn(x)&&S.gOk==='manual'){ try{ call({action:'stu_oe_leave',id:x.id,kind:'guard_nocheck'}); }catch(e){} }
  S.onVis=function(){ if(!S||!S.running) return; if(document.hidden){ S.hiddenAt=Date.now(); } else if(S.hiddenAt){ S.hiddenAt=0; leave('leave'); } };
  document.addEventListener('visibilitychange',S.onVis);
  S.onUnload=function(e){ if(S&&S.running){ e.preventDefault(); e.returnValue=''; } }; window.addEventListener('beforeunload',S.onUnload);
  S.block=function(e){ if(!S||!S.running) return; var t=e.target; if(e.type==='contextmenu'||e.type==='dragstart'||t&&t.closest&&t.closest('#oeRun')){ e.preventDefault(); if(e.type==='paste'||e.type==='copy'||e.type==='cut'){ if(S.pasteN++<5) leave('paste_attempt'); } } };
  ['copy','cut','paste','contextmenu','dragstart'].forEach(function(ev){ document.addEventListener(ev,S.block,true); });
  S.onFs=function(){ if(S&&S.running&&!document.fullscreenElement) leave('fullscreen_exit'); }; document.addEventListener('fullscreenchange',S.onFs);
  try{ var wm=document.createElement('div'); wm.id='oeWm'; var tx=((S.me&&S.me.index)||'')+' '+((S.me&&S.me.name)||''); var row=''; for(var i=0;i<8;i++) row+='<span>'+esc(tx)+'</span>'; var rows=''; for(var k=0;k<14;k++) rows+='<div>'+row+'</div>'; wm.innerHTML=rows; wm.style.cssText='position:fixed;inset:-20%;z-index:100001;pointer-events:none;overflow:hidden;transform:rotate(-24deg);opacity:.09;font:700 .95rem monospace;color:#000;line-height:3.2rem;white-space:nowrap;user-select:none'; $('oeRun').appendChild(wm); }catch(e){}
  S.noSel=function(e){ if(!S||!S.running) return; var t=e.target; if(!(t&&t.tagName==='TEXTAREA')) e.preventDefault(); }; document.addEventListener('selectstart',S.noSel,true);
  S.keys=function(e){ if(!S||!S.running) return; var k=(e.key||'').toLowerCase(); if(((e.ctrlKey||e.metaKey)&&['c','v','x','p','s','u','a'].indexOf(k)>=0&&!(k==='a'&&e.target&&e.target.tagName==='TEXTAREA'))||k==='printscreen'||k==='f12'){ e.preventDefault(); if(S.pasteN++<5) leave('paste_attempt'); } }; document.addEventListener('keydown',S.keys,true);
  try{ if(navigator.wakeLock) navigator.wakeLock.request('screen').then(function(l){ S.wl=l; }).catch(function(){}); }catch(e){}
  nextSnap();
}

/* ---- per-question timer: runs in the browser; remembered across a reload so refreshing does not give extra time ---- */
function qtKey(){ return 'ceQt_'+S.x.id; }
function qtStart(fresh){
  if(!S||!S.qT) return; var now=Date.now()+_off, end=now+S.qT*1000;
  if(!fresh&&S.qAtSrv){ end=S.qAtSrv+S.qT*1000; }
  else if(!fresh){ try{ var o=JSON.parse(localStorage.getItem(qtKey())||'null'); if(o&&o.cur===S.cur&&o.end>now-60000&&o.end<=end) end=o.end; }catch(e){} }
  S.qEnd=end; try{ localStorage.setItem(qtKey(),JSON.stringify({cur:S.cur,end:end})); }catch(e){}
}
function qtTick(){
  if(!S||!S.qT||!S.running||S.ending||S.qEnd==null) return; var left=S.qEnd-(Date.now()+_off), el=$('oerQt');
  if(el){ var sec=Math.max(0,Math.ceil(left/1000)); el.textContent=(left>0?'Question time ':'Moving on... ')+Math.floor(sec/60)+':'+('0'+(sec%60)).slice(-2); el.style.color=left<10000?'#dc2626':''; }
  if(left<=-5000){ if(S.cur>=S.q.length-1){ S.ending=true; submit('Time is up for the last question. Your exam was submitted.'); } else { window.oesGo(S.cur+1); } }
}
function render(){
  var r=$('oeRun'), q=S.q[S.cur], n=S.q.length, ans=S.ans[q.id];
  var body;
  if(q.type==='mcq'){ body=q.options.map(function(o,k){ return '<button type="button" class="oer-o'+(ans===k?' sel':'')+'" onclick="oesPick('+k+')"><b>'+String.fromCharCode(65+k)+'</b><span>'+esc(o)+'</span></button>'; }).join(''); }
  else body='<textarea id="oerText" placeholder="Type your answer here" oninput="oesText(this.value)">'+esc(ans||'')+'</textarea>';
  var pal=S.oneWay?'':'<div class="oer-pal">'+S.q.map(function(z,i){ var a=S.ans[z.id]; return '<button type="button" class="oer-p'+(a!==undefined&&a!==''?' ans':'')+(i===S.cur?' cur':'')+'" onclick="oesGo('+i+')">'+(i+1)+'</button>'; }).join('')+'</div>';
  var last=S.cur===n-1; var gTL=gOn(S.x)&&S.gOk===true&&!!S.base;
  r.innerHTML='<div class="oer-top"'+(gTL?' style="padding-left:108px;min-height:74px"':'')+'><div><div style="font-weight:700;font-size:.85rem;overflow-wrap:anywhere">'+esc(S.x.title)+'</div><div class="oes-sub" style="margin:0">Question '+(S.cur+1)+' of '+n+' &middot; '+q.marks+' mark'+(q.marks===1?'':'s')+'</div>'+(S.qT?'<div id="oerQt" class="oes-sub" style="margin:2px 0 0;font-weight:700"></div>':'')+'</div><div class="oer-tm" id="oerTm">--:--</div></div>'
   +'<div class="oer"><div class="oer-q"><div class="oer-qt">'+esc(q.text)+'</div>'+body+'</div>'
   +'<div class="oer-nav">'+(!S.oneWay&&S.cur>0?'<button type="button" class="oes-btn s" onclick="oesGo('+(S.cur-1)+')">Back</button>':'')+(last?'<button type="button" class="oes-btn" onclick="oesFinish()">Finish and submit</button>':'<button type="button" class="oes-btn" onclick="oesGo('+(S.cur+1)+')">'+(S.oneWay?'Next (cannot come back)':'Next')+'</button>')+'</div>'
   +pal+'<div id="oerSave" class="oes-sub" style="text-align:center;margin-top:12px"></div></div>'
   +'<div class="oer-rec'+(gTL?' gtl':'')+'"><video id="oerRecV" autoplay playsinline muted></video><span>REC</span>'+(gTL?'<svg viewBox="0 0 100 100" preserveAspectRatio="none"><ellipse id="oerRecE" cx="50" cy="48" rx="23" ry="35" fill="none" stroke="#16a34a" stroke-width="2.2" vector-effect="non-scaling-stroke"/></svg>':'')+'</div>';
  S.vid=$('oerRecV'); S.vid.srcObject=S.stream; S.vid.play().catch(function(){});
  tick();
}
function dwFlush(){ if(!S||!S.q||!S.q[S.dwI]) { S.dwT=Date.now(); S.dwI=S.cur; return; } var q=S.q[S.dwI], n=Date.now(); S.dw=S.dw||{}; S.dw[q.id]=(S.dw[q.id]||0)+Math.min(600000,n-(S.dwT||n)); S.dwT=n; S.dwI=S.cur; }
window.oesPick=function(k){ var q=S.q[S.cur]; S.ans[q.id]=k; S.dirty[q.id]=k; render(); saveSoon(); };
window.oesText=function(v){ var q=S.q[S.cur]; S.ans[q.id]=v; S.dirty[q.id]=v; saveSoon(); };
window.oesGo=function(i){ if(i<0||i>=S.q.length) return; dwFlush(); S.cur=i; dwFlush(); qtStart(true); render(); if(S.qT) flushNow(true); else { clearTimeout(S.navT); S.navT=setTimeout(function(){ try{ flushNow(true); }catch(e){} },1500); } window.scrollTo(0,0); var r=$('oeRun'); if(r) r.scrollTop=0; };
/* answers are saved together every few seconds (not after every tap) so hundreds of students do not overload the server; leaving the page and submitting always save everything */
function saveSoon(){ if(S.saveT) return; S.saveT=setTimeout(function(){ S.saveT=0; flushNow(); },10000); var s=$('oerSave'); if(s) s.textContent='Will save in a few seconds'; }
if(!window._oesFlushBound){ window._oesFlushBound=1; document.addEventListener('visibilitychange',function(){ if(document.visibilityState==='hidden'){ try{ flushNow(); }catch(e){} } }); window.addEventListener('pagehide',function(){ try{ flushNow(); }catch(e){} }); }
async function flushNow(force){
  if(!S||!S.running||(!Object.keys(S.dirty).length&&!force)) return; var d=S.dirty; S.dirty={};
  try{ dwFlush(); var jr=await call({action:'stu_oe_save',id:S.x.id,answers:d,cur:S.cur,dw:S.dw});
    if(jr&&jr.qAt&&S.qT&&S.running){ if(jr.qCur>S.cur){ S.cur=Math.min(S.q.length-1,jr.qCur); S.qEnd=Date.parse(jr.qAt)+S.qT*1000; render(); } else if(jr.qCur===S.cur){ S.qEnd=Date.parse(jr.qAt)+S.qT*1000; } }
    var s=$('oerSave'); if(s) s.textContent='Saved'; }
  catch(e){ Object.keys(d).forEach(function(k){ if(!(k in S.dirty)) S.dirty[k]=d[k]; }); var s2=$('oerSave'); if(s2) s2.textContent='Connection problem. Your answers are kept and will save when it returns.'; clearTimeout(S.saveT); S.saveT=setTimeout(function(){ S.saveT=0; flushNow(); },5000); }
}
async function leave(kind){
  if(!S||!S.running) return;
  try{ var j=await call({action:'stu_oe_leave',id:S.x.id,kind:kind});
    if(j&&j.submitted){ finished('The exam was submitted because you left the page too many times.'); return; }
    if(kind==='leave'){ sendSnap('leave'); warn('You left the exam page. This has been recorded.'+(S.max>0?' ('+j.leaves+' of '+S.max+' allowed. One more than that and the exam is submitted.)':'')); }
  }catch(e){}
}
function warn(t){ var r=$('oeRun'); if(!r) return; var o=document.createElement('div'); o.className='oer-ov'; o.innerHTML='<div><div style="font-weight:800;font-size:1.05rem;margin-bottom:8px">Warning</div><div style="line-height:1.5">'+esc(t)+'</div><button type="button" class="oes-btn" onclick="this.closest(\'.oer-ov\').remove();try{document.documentElement.requestFullscreen()}catch(e){}">Continue the exam</button></div>'; r.appendChild(o); }

/* ---- camera watch: flashes, head turns, no face, extra faces (runs on the phone; free) ---- */
var _fd=null, _fdTry=false, _fdErr='', _od=null, _odTry=false;
window.oesFdRetry=function(){ _fd=null; _fdTry=false; _fdErr=''; if(S&&$('oerGchk')){ S.gOk=false; gCheck(); } };
async function odLoad(){
  if(_od||_odTry) return _od; _odTry=true;
  try{
    var m=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs');
    var fs=await m.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
    _od=await m.ObjectDetector.createFromOptions(fs,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite'},runningMode:'VIDEO',scoreThreshold:.55,maxResults:6,categoryAllowlist:['cell phone']});
  }catch(e){ _od=null; }
  return _od;
}
async function fdLoad(){
  if(_fd||_fdTry) return _fd; _fdTry=true;
  try{
    var m=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs');
    var fs=await m.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
    _fd=await m.FaceDetector.createFromOptions(fs,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite'},runningMode:'VIDEO',minDetectionConfidence:.5});
  }catch(e){ _fd=null; _fdErr=String((e&&e.message)||e||'error').replace(/[<>]/g,'').slice(0,90); }
  return _fd;
}
function monStart(){
  var M=S.mon={last:{},lum:[],bad:{face:0,turn:0,multi:0},t0:Date.now(),n:0};
  var cv=document.createElement('canvas'); cv.width=48; cv.height=36; var cx=cv.getContext('2d',{willReadFrequently:true});
  M.open={}; M.seen={}; M.hb=[]; M.base=null;
  // one camera problem = one flag: a new flag is raised only after the condition has been absent for 10 seconds
  function flag(kind,note){ var now=Date.now(); var cont=M.open[kind]&&M.seen[kind]&&now-M.seen[kind]<10000; M.seen[kind]=now; M.open[kind]=true; if(cont) return; M.last[kind]=now; try{ call({action:'stu_oe_leave',id:S.x.id,kind:kind,note:note||''}); }catch(e){} try{ sendSnap(kind); }catch(e){} if(kind==='phone_seen'||kind==='multi_face'||kind==='head_turn'){ setTimeout(function(){ try{ if(S&&S.running) sendSnap(kind+'_after'); }catch(e){} },2500); } }
  fdLoad(); odLoad(); M.ph=0;
  S.monT=setInterval(function(){
    if(!S||!S.running) return; var v=S.vid; if(!v||v.readyState<2||!v.videoWidth) return; M.n++;
    // 1) flash: sudden bright spike compared with the last few seconds
    try{
      cx.drawImage(v,0,0,48,36); var d=cx.getImageData(0,0,48,36).data, sum=0; for(var i=0;i<d.length;i+=4) sum+=d[i]*.299+d[i+1]*.587+d[i+2]*.114;
      var lum=sum/(d.length/4); M.lum.push(lum); if(M.lum.length>12) M.lum.shift();
      if(M.lum.length>=6){ var base=0,c=0; for(var k=0;k<M.lum.length-1;k++){ base+=M.lum[k]; c++; } base/=c; if(lum-base>38 && lum>110 && M.n>8) flag('flash'); }
    }catch(e){}
    // 1b) a phone held up in view (checked about every 2 seconds)
    if(_od && M.n%3===0){ try{ var o=_od.detectForVideo(v,performance.now()); if(o&&o.detections&&o.detections.length){ M.ph++; M.phc=(o.detections[0].categories&&o.detections[0].categories[0]&&o.detections[0].categories[0].score)||0; if(M.ph>=3) flag('phone_seen','confidence '+M.phc.toFixed(2)+', '+M.ph+' checks'); } else M.ph=0; }catch(e){} }
    // 2) faces and head turns (only if the helper loaded)
    if(_fd && M.n%1===0){
      try{
        var r=_fd.detectForVideo(v,performance.now()), f=(r&&r.detections)||[];
        if(f.length===0){ M.bad.face++; M.bad.turn=0; M.bad.multi=0; if(M.bad.face>=5) flag('no_face','no face for '+M.bad.face+' looks'); gStep(false); }
        else{
          M.bad.face=0;
          var real2=false; if(f.length>1){ var A0=f[0].boundingBox||{}, B0=f[1].boundingBox||{}, a0=(A0.width||0)*(A0.height||0), b0=(B0.width||0)*(B0.height||0), big=a0>=b0?A0:B0, sm=a0>=b0?B0:A0, as=Math.max(a0,b0), bs=Math.min(a0,b0), sc2=(f[1].categories&&f[1].categories[0]&&f[1].categories[0].score)||1;
            // a real second face: big enough compared with the first, clearly in a different place, and confident
            real2=bs>=as*.3 && Math.abs((big.originX+big.width/2)-(sm.originX+sm.width/2))>big.width*.7 && sc2>=.7; }
          if(real2){ M.bad.multi++; if(M.bad.multi>=4) flag('multi_face',f.length+' faces, second is '+Math.round(bs/as*100)+'% of the first'); } else M.bad.multi=0;
          var kp=f[0].keypoints||[], bb=f[0].boundingBox||{};
          if(kp.length>=3){ var er=kp[0], el=kp[1], no=kp[2], mid=(er.x+el.x)/2, w=Math.abs(er.x-el.x)||1, yaw=Math.abs(no.x-mid)/w;
            var cxp=bb.originX+bb.width/2, cxn=cxp/v.videoWidth, sgn=(no.x-mid)/w;
            // judged against the student's own starting position (saved face-guard position, or the first 12 clear looks)
            if(!M.base){ if(S.base) M.base={yaw:S.base.yaw,cx:S.base.cx}; else if(f.length===1){ M.hb.push({yaw:sgn,cx:cxn}); if(M.hb.length>=12){ var ys=M.hb.map(function(x){return x.yaw;}).sort(function(a,b){return a-b;}), cs=M.hb.map(function(x){return x.cx;}).sort(function(a,b){return a-b;}); M.base={yaw:ys[6],cx:cs[6]}; } } }
            if(M.base){ if(Math.abs(sgn-M.base.yaw)>.42||Math.abs(cxn-M.base.cx)>.3){ M.bad.turn++; if(M.bad.turn>=4) flag('head_turn','turned '+Math.abs(sgn-M.base.yaw).toFixed(2)+', moved '+Math.abs(cxn-M.base.cx).toFixed(2)); } else M.bad.turn=0; } }
          if(S.g&&S.g.on){ var fi=faceInfo(f[0],v), B=S.base; gStep(Math.abs(fi.cx-B.cx)<.22&&Math.abs(fi.cy-B.cy)<.28&&fi.w>B.w*.55&&fi.w<B.w*1.8&&Math.abs(fi.yaw-B.yaw)<.4); }
        }
      }catch(e){}
    }
  },700);
}
/* ---- face guard in the exam: early warning, pause, report a problem, pause log (items 13-17) ---- */
function gLog(kind,snap){ try{ call({action:'stu_oe_leave',id:S.x.id,kind:kind}); }catch(e){} if(snap){ try{ sendSnap(kind); }catch(e){} } }
function recCol(ok){ var e=$('oerRecE'), b=e&&e.closest('.oer-rec'); if(!e) return; var c=ok?'#16a34a':'#dc2626'; e.setAttribute('stroke',c); if(b) b.style.borderColor=c; }
function gStep(ok){
  var G=S&&S.g; if(!G||!G.on||!S.running) return; var now=Date.now(); recCol(ok||G.hold>now);
  if(G.hold>now){ G.offAt=0; G.okAt=0; return; }
  if(ok){
    G.offAt=0; if(!G.okAt) G.okAt=now;
    if(G.state==='warn'){ G.state='run'; var w=$('oerGwarn'); if(w) w.remove(); }
    else if(G.state==='pause' && now-G.okAt>=G.backMs) gResume('face');
  } else {
    G.okAt=0; if(!G.offAt) G.offAt=now; var d=now-G.offAt;
    if(G.state!=='pause'){
      if(d>=G.pauseMs) gPause();
      else if(d>=G.warnMs){ G.state='warn'; var r=$('oeRun'), w=$('oerGwarn'); if(!w&&r){ w=document.createElement('div'); w.id='oerGwarn'; w.style.cssText='position:fixed;left:12px;right:12px;top:12px;z-index:6;background:#b45309;color:#fff;border-radius:14px;padding:12px 14px;font-weight:700;text-align:center;box-shadow:0 6px 20px #0006'; r.appendChild(w); }
        if(w) w.innerHTML='Your face is out of the oval. Move back now. The exam pauses in '+Math.max(1,Math.ceil((G.pauseMs-d)/1000))+' s.'; }
    }
  }
}
function gPause(){
  var G=S.g; G.state='pause'; G.pauses++; var w=$('oerGwarn'); if(w) w.remove();
  gLog('guard_pause',true);
  var r=$('oeRun'); if(!r) return; var o=document.createElement('div'); o.id='oerGuard'; o.style.cssText='position:fixed;inset:0;z-index:7;background:#0b2a3a;color:#fff;display:flex;align-items:center;justify-content:center;padding:20px;text-align:center';
  o.innerHTML='<div style="max-width:380px"><div style="font-weight:800;font-size:1.3rem;margin-bottom:8px">Exam paused</div><div style="line-height:1.5">We cannot see your face in the saved position. Look at the screen to continue.</div><div style="margin:16px 0;font:700 2rem Georgia,serif" id="oerGtm">--:--</div><div style="font-size:.85rem;opacity:.85">The timer is still running. Your answers are saved.</div><video id="oerGvid" autoplay playsinline muted style="width:150px;border-radius:12px;margin:14px auto 0;display:block;transform:scaleX(-1);background:#000"></video><button type="button" class="oes-btn s" style="margin-top:16px" onclick="oesGuardReport()">Report a problem</button></div>';
  r.appendChild(o); try{ var gv=$('oerGvid'); gv.srcObject=S.stream; gv.play().catch(function(){}); }catch(e){}
}
function gResume(how){
  var G=S.g; G.state='run'; G.offAt=0; G.okAt=0; var o=$('oerGuard'); if(o) o.remove(); var w=$('oerGwarn'); if(w) w.remove();
  gLog(how==='report'?'guard_report':'guard_resume',false); if(how==='report') gLog('guard_resume',false);
}
window.oesGuardReport=function(){ if(!S||!S.g||S.g.state!=='pause') return; S.g.hold=Date.now()+60000; gResume('report'); };
/* ---- random identity re-checks (item 25) ---- */
function rcPlan(){
  var n=rcOn(S.x); if(!n||!S.deadline) return; var t0=Date.now()+_off, span=S.deadline-t0; if(span<300000) return;
  S.rc=[]; for(var i=0;i<n;i++){ var a=t0+span*(.15+.7*(i+Math.random())/n); S.rc.push(a); }
}
function rcTick(){
  if(!S||!S.running||!S.rc||!S.rc.length||$('oerRc')||(S.g&&S.g.state==='pause')) return;
  if(Date.now()+_off>=S.rc[0]){ S.rc.shift(); rcAsk(); }
}
function rcAsk(){
  var r=$('oeRun'); if(!r) return; var o=document.createElement('div'); o.id='oerRc'; o.className='oer-ov';
  o.innerHTML='<div><div style="font-weight:800;font-size:1.05rem;margin-bottom:8px">Quick identity check</div><div style="line-height:1.5">Confirm with your fingerprint or face. The timer is still running.</div><button type="button" class="oes-btn" onclick="oesRcDo()">Confirm now</button><button type="button" class="oes-btn s" style="margin-top:8px" onclick="oesRcSkip()">I cannot do this</button><div id="oerRcM" class="oes-sub"></div></div>';
  r.appendChild(o); S.rcAt=Date.now();
}
window.oesRcDo=async function(){ var m=$('oerRcM'); try{ var b=await bioCheck(); if(b==='ok'){ var o=$('oerRc'); if(o) o.remove(); gLog('recheck_ok',false); try{ sendSnap('recheck_ok'); }catch(e){} } else if(b==='unsupported'){ var o2=$('oerRc'); if(o2) o2.remove(); } else if(m) m.textContent='That did not work. Try again.'; }catch(e){ if(m) m.textContent='That did not work. Try again.'; } };
window.oesRcSkip=function(){ var o=$('oerRc'); if(o) o.remove(); gLog('recheck_failed',true); };
function camCheck(){
  if(!S||!S.running) return; var t=S.stream&&S.stream.getVideoTracks()[0], ok=t&&t.readyState==='live'&&!t.muted&&S.stream.active;
  if(!ok && !$('oerCamOv')){ leave('camera_off'); var r=$('oeRun'); var o=document.createElement('div'); o.id='oerCamOv'; o.className='oer-ov'; o.innerHTML='<div><div style="font-weight:800;font-size:1.05rem;margin-bottom:8px">Camera is off</div><div style="line-height:1.5">Your camera must stay on during the exam. Turn it back on to continue. The timer is still running.</div><button type="button" class="oes-btn" onclick="oesCamBack()">Turn camera on</button><div id="oerCamErr" class="oes-sub"></div></div>'; r.appendChild(o); }
  else if(ok && $('oerCamOv')) $('oerCamOv').remove();
}
window.oesCamBack=async function(){ try{ S.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:480},height:{ideal:360}},audio:false}); S.vid.srcObject=S.stream; S.vid.play().catch(function(){}); var o=$('oerCamOv'); if(o) o.remove(); }catch(e){ var m=$('oerCamErr'); if(m) m.textContent='Still blocked. Allow the camera in your browser settings.'; } };
function tick(){
  if(!S||!S.running) return; var left=Math.max(0,S.deadline-(Date.now()+_off)), m=Math.floor(left/60000), s=Math.floor(left/1000)%60, t=$('oerTm');
  if(t){ t.textContent=('0'+m).slice(-2)+':'+('0'+s).slice(-2); t.classList.toggle('low',left<300000); var gt=$('oerGtm'); if(gt) gt.textContent=t.textContent; }
  qtTick(); rcTick();
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
  try{ dwFlush(); await call({action:'stu_oe_submit',id:S.x.id,answers:d,dw:S.dw}); finished(msg); }
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
