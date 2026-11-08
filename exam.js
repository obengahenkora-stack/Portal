/* ===== Exam Sessions: scan the barcode on a student's Exam Pass to mark them present ===== */
(function(){
var QK='ceExamQueue';
var S={course:'',date:'',roster:[],present:{},ready:false,busy:false};
var SC=null, _flushing=null, _retryT=null, _inited=false;
function $(i){ return document.getElementById(i); }
function key(x){ return String(x||'').toUpperCase().replace(/[^A-Z0-9]/g,''); }
function qGet(){ try{ return JSON.parse(localStorage.getItem(QK)||'[]'); }catch(e){ return []; } }
function qSet(a){ try{ localStorage.setItem(QK,JSON.stringify(a)); }catch(e){} }
function today(){ try{ return new Date().toLocaleDateString('en-CA'); }catch(e){ return new Date().toISOString().slice(0,10); } }
function hhmm(iso){ try{ return new Date(iso).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}); }catch(e){ return ''; } }

var css=document.createElement('style');
css.textContent='#examCard .ex-sum{display:flex;justify-content:space-between;align-items:baseline;margin:16px 0 6px}'
+'#examCard .ex-sum b{font-size:1.5rem}'
+'#examCard .ex-bar{height:8px;border-radius:99px;background:rgba(127,127,127,.18);overflow:hidden;margin-bottom:12px}'
+'#examCard .ex-bar i{display:block;height:100%;background:linear-gradient(90deg,#16a34a,#0d9488);width:0;transition:width .3s}'
+'#examCard .ex-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;margin-bottom:8px;background:var(--card)}'
+'#examCard .ex-row small{color:var(--muted);display:block}'
+'#examCard .ex-row .ex-t{font-size:.78rem;color:var(--ok);font-weight:700;white-space:nowrap}'
+'#examCard .exb{width:auto !important;display:inline-flex !important;align-items:center;gap:6px;padding:8px 14px !important;font-size:.82rem !important;border-radius:999px !important;background:transparent !important;color:var(--ink) !important;border:1px solid var(--line) !important;box-shadow:none !important;font-weight:700 !important;letter-spacing:0 !important;text-transform:none !important}'
+'#examCard .exb.go{background:#0b2e1f !important;color:#fff !important;border:0 !important;padding:10px 20px !important;font-size:.9rem !important}'
+'#examCard .exb.dl{background:rgba(22,163,74,.10) !important;color:#15803d !important;border:1px solid rgba(22,163,74,.45) !important}'
+'#examCard .exb.x{color:var(--danger) !important}'
+'#examCard .ex-st{font-size:.78rem;color:var(--muted);margin-top:8px}';
document.head.appendChild(css);

/* ---------- loading ---------- */
var GROUPS={};
async function loadCourses(){
  var sel=$('exCourse'); if(!sel) return;
  var rosters=null;
  try{ var d=await fetchSupabaseData(); rosters=d.rosters||null; }catch(e){}
  if(!rosters || !Object.keys(rosters).length){ try{ rosters=_offlineRosters(); }catch(e){} }
  var names=visibleCourses(Object.keys(rosters||{}));
  GROUPS={}; names.forEach(function(n){ var b=lmBase(n); (GROUPS[b]=GROUPS[b]||[]).push(n); });
  var keep=sel.value;
  sel.innerHTML='<option value="">Select course...</option>'+Object.keys(GROUPS).sort().map(function(c){ var g=GROUPS[c].length; return '<option value="'+escapeHtml(c)+'">'+escapeHtml(c)+(g>1?' (all '+g+' groups)':'')+'</option>'; }).join('');
  if(keep) sel.value=keep;
}
window.examInit=function(){
  if(!_inited){ _inited=true; var d=$('exDate'); if(d && !d.value) d.value=today(); }
  loadCourses();
  if(qGet().length) flush();
};
window.examLoad=async function(){
  var course=$('exCourse').value, date=$('exDate').value;
  S.course=course; S.date=date; S.ready=false;
  var box=$('exBody'); if(!course||!date){ box.innerHTML='<div class="empty">Pick the course and the exam date to begin.</div>'; return; }
  box.innerHTML='<div class="empty">Loading class list...</div>';
  var data=null;
  try{ data=await fetchSupabaseData(true); }catch(e){ var rc=null; try{ rc=_offlineRosters(); }catch(_){} if(rc) data={rosters:rc}; }
  if(!data){ box.innerHTML='<div class="empty">Could not load the class list. Check your internet and try again.</div>'; return; }
  var seen={}, list=[]; (GROUPS[course]||[course]).forEach(function(n){ ((data.rosters&&data.rosters[n])||[]).forEach(function(s){ var k=key(s.indexNumber); if(k && !seen[k]){ seen[k]=1; list.push(s); } }); });
  S.roster=list;
  if(!S.roster.length){ box.innerHTML='<div class="empty">No class list uploaded for this course yet.</div>'; return; }
  S.present={}; S.ready=true; await poll(true);
};
var _pollT=0, _sig='';
async function poll(force){
  if(!S.ready) return;
  var j=await teamApi({action:'exam_list',course:S.course,date:S.date});
  if(!j || !j.ok){ S.err=(j&&j.error)||'Could not reach the server'; if(force){ render(); } else status(); return; } S.err='';
  if(S.course!==$('exCourse').value) return;
  var m={}; (j.items||[]).forEach(function(it){ m[key(it.idx)]=it.at||new Date().toISOString(); });
  qGet().forEach(function(o){ if(o.course===S.course && o.date===S.date){ if(o.present) m[key(o.index)]=new Date(o.ts).toISOString(); else delete m[key(o.index)]; } });
  var sig=Object.keys(m).sort().join(',');
  S.present=m;
  if(force || sig!==_sig){ _sig=sig; render(); var c=$('exN'); if(c) c.textContent=Object.keys(S.present).length+' of '+S.roster.length; }
}
setInterval(function(){ var c=$('examCard'); if(c && !c.classList.contains('hidden') && !c.classList.contains('pane-off') && S.ready && !document.hidden) poll(false); },4000);
function find(idx){ var k=key(idx); for(var i=0;i<S.roster.length;i++){ if(key(S.roster[i].indexNumber)===k) return S.roster[i]; } return null; }

/* ---------- render ---------- */
var showAbsent=false;
function render(){
  if(!S.ready) return;
  var tot=S.roster.length, rows=S.roster.filter(function(s){ return S.present[key(s.indexNumber)]; });
  rows.sort(function(a,b){ return String(S.present[key(b.indexNumber)]).localeCompare(String(S.present[key(a.indexNumber)])); });
  var abs=S.roster.filter(function(s){ return !S.present[key(s.indexNumber)]; });
  var h='<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px"><button type="button" class="exb go" onclick="examScan()">&#128247;&nbsp; Scan exam passes</button><button type="button" class="exb dl" onclick="examDownload()">&#11015;&nbsp; Download Excel</button></div><label style="display:flex;gap:8px;align-items:center;margin-top:10px;font-size:.82rem;font-weight:500;text-transform:none;letter-spacing:0;cursor:pointer"><input type="checkbox" '+(autoOn()?'checked':'')+' onchange="examAutoSet(this.checked)" style="width:auto"> Download the list automatically when I tap Done</label>'
   +'<div class="ex-sum"><span>Present</span><span><b>'+rows.length+'</b> of '+tot+'</span></div><div class="ex-bar"><i style="width:'+(tot?Math.round(rows.length*100/tot):0)+'%"></i></div>';
  h+= rows.length ? rows.map(function(s){ var ix=escapeHtml(s.indexNumber); return '<div class="ex-row"><div><b>'+escapeHtml(s.name||s.indexNumber)+'</b><small>'+ix+'</small></div><div style="text-align:right"><div class="ex-t">'+hhmm(S.present[key(s.indexNumber)])+'</div><button type="button" class="exb x" style="margin-top:4px" onclick="examRemove(\''+ix.replace(/'/g,'')+'\')">Remove</button></div></div>'; }).join('')
    : '<div class="empty">No one yet. Scan an exam pass and the name appears here.</div>';
  h+='<div style="margin-top:12px"><button type="button" class="exb" onclick="examToggleAbs()">'+(showAbsent?'Hide':'Show')+' not yet present ('+abs.length+')</button></div>';
  if(showAbsent) h+='<div style="margin-top:10px">'+abs.map(function(s){ var ix=escapeHtml(s.indexNumber); return '<div class="ex-row"><div><b>'+escapeHtml(s.name||s.indexNumber)+'</b><small>'+ix+'</small></div><button type="button" class="exb" onclick="examAdd(\''+ix.replace(/'/g,'')+'\')">Mark present</button></div>'; }).join('')+'</div>';
  h+='<div class="ex-st" id="exSt"></div>';
  $('exBody').innerHTML=h; status();
}
function status(){
  var e=$('exSt'); if(!e) return; var n=qGet().length; if(S.err){ e.textContent='Could not load saved scans ('+S.err+'). If this says Unknown action, the backend step 30 has not been deployed yet.'; return; }
  e.textContent=n?(navigator.onLine===false?('Offline. '+n+' change'+(n===1?'':'s')+' will save when the internet returns.'):('Saving '+n+' change'+(n===1?'':'s')+'...')):'All changes saved.';
}
window.examDownload=examDownload;
window.examToggleAbs=function(){ showAbsent=!showAbsent; render(); };

/* ---------- marking and saving ---------- */
function mark(idx,present){
  var s=find(idx); if(!s) return false;
  if(present) S.present[key(s.indexNumber)]=new Date().toISOString(); else delete S.present[key(s.indexNumber)];
  var q=qGet(); q.push({id:Date.now()+'-'+Math.random().toString(36).slice(2),course:S.course,date:S.date,index:s.indexNumber,present:!!present,ts:Date.now()}); qSet(q);
  flush(); return true;
}
window.examAdd=function(i){ mark(i,true); render(); };
window.examRemove=function(i){ var s=find(i); if(!s) return; if(!confirm('Remove '+(s.name||s.indexNumber)+' from the present list?')) return; mark(i,false); render(); };
async function flush(){
  if(_flushing) return _flushing;
  _flushing=(async function(){
    try{
      var q=qGet(); if(!q.length){ status(); return; }
      if(navigator.onLine===false) throw new Error('offline');
      for(var i=0;i<q.length;i++){
        var o=q[i], j=await teamApi({action:'exam_mark',course:o.course,date:o.date,idx:o.index,present:!!o.present});
        if(!j || !j.ok) throw new Error((j&&j.error)||'failed');
        qSet(qGet().filter(function(x){ return x.id!==o.id; })); status();
      }
      status();
    }catch(e){ status(); clearTimeout(_retryT); _retryT=setTimeout(flush,10000); }
  })();
  var r=await _flushing; _flushing=null; return r;
}
window.addEventListener('online',function(){ if(qGet().length) flush(); });
window.addEventListener('beforeunload',function(e){ if(SC || qGet().some(function(o){ return o.course===S.course; })){ if(SC || qGet().length){ e.preventDefault(); e.returnValue=''; } } });

/* ---------- download ---------- */
window.examCsv=function(){ examDownload(); };
function examDownload(){
  if(!S.ready) return;
  var rows=[['No.','Index number','Name','Status','Time']], n=0;
  S.roster.forEach(function(s){ var t=S.present[key(s.indexNumber)]; rows.push([++n,s.indexNumber,s.name||'',t?'Present':'Absent',t?hhmm(t):'']); });
  var base=('Exam - '+S.course+' - '+S.date).replace(/[\\\/:*?"<>|]/g,'-');
  if(window.XLSX){
    var ws=XLSX.utils.aoa_to_sheet(rows); ws['!cols']=[{wch:6},{wch:16},{wch:40},{wch:10},{wch:10}];
    var wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Exam attendance'); XLSX.writeFile(wb,base+'.xlsx'); return;
  }
  var q=function(v){ v=String(v==null?'':v); return '"'+v.replace(/"/g,'""')+'"'; };
  var blob=new Blob(['\ufeff'+rows.map(function(r){ return r.map(q).join(','); }).join('\r\n')],{type:'text/csv;charset=utf-8'});
  var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=base+'.csv'; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); },800);
}
function autoOn(){ try{ return localStorage.getItem('ceExamAuto')!=='0'; }catch(e){ return true; } }
window.examAutoSet=function(on){ try{ localStorage.setItem('ceExamAuto',on?'1':'0'); }catch(e){} };

/* ---------- scanner ---------- */
function loadLib(){ return new Promise(function(res,rej){ if(window.ZXing) return res(); var s=document.createElement('script'); s.src='zxing.js?v=1'; s.onload=function(){ window.ZXing?res():rej(new Error('Could not load the scanner.')); }; s.onerror=function(){ rej(new Error('Could not load the scanner. Check your internet.')); }; document.head.appendChild(s); }); }
function beep(ok){ try{ var C=window.AudioContext||window.webkitAudioContext; if(C){ SC.ac=SC.ac||new C(); var ac=SC.ac; if(ac.state==='suspended') ac.resume(); var t=ac.currentTime, g=ac.createGain(); g.connect(ac.destination); g.gain.setValueAtTime(1,t); g.gain.exponentialRampToValueAtTime(.001,t+(ok?.4:.55)); (ok?[[988,0,.14],[1319,.14,.26]]:[[300,0,.2],[200,.22,.3]]).forEach(function(x){ var o=ac.createOscillator(); o.type='square'; o.frequency.value=x[0]; o.connect(g); o.start(t+x[1]); o.stop(t+x[1]+x[2]); }); } }catch(e){} try{ if(navigator.vibrate) navigator.vibrate(ok?60:[80,60,80]); }catch(e){} }
function show(kind,html){ var r=$('exRes'); if(!r) return; r.style.background=kind==='ok'?'#1f8a4c':(kind==='warn'?'#b7791f':'#8a1f15'); r.innerHTML=html; }
function idxFrom(t){ t=String(t||'').trim(); var m=t.match(/[A-Za-z]{3}\d{7}/); if(m) return m[0].toUpperCase(); var k=key(t); return (k.length>=5&&k.length<=16)?k:''; }
function handle(text){
  var idx=idxFrom(text), now=Date.now();
  if(!idx) return;
  if(idx===SC.last && now-SC.lastAt<3000) return; SC.last=idx; SC.lastAt=now;
  var s=find(idx);
  if(!s){ beep(false); show('bad','<div style="font-size:1.1rem">'+escapeHtml(idx)+'</div>Not on this class list. Not marked.'); return; }
  if(S.present[key(s.indexNumber)]){ beep(false); show('warn','<div style="font-size:1.1rem">'+escapeHtml(s.name||idx)+'</div>Already marked present'); return; }
  beep(true); mark(s.indexNumber,true); SC.n++;
  var c=$('exN'); if(c) c.textContent=Object.keys(S.present).length+' of '+S.roster.length;
  show('ok','<div style="font-size:1.2rem">&#10003; '+escapeHtml(s.name||idx)+'</div>'+escapeHtml(s.indexNumber)+' marked present');
}
function popBack(){ if(SC) close(true); }
window.examScan=async function(){
  if(SC) return; if(!S.ready){ alert('Pick the course and date and wait for the names to appear first.'); return; }
  SC={n:0,last:'',lastAt:0,stream:null,t:0,hs:0};
  try{ history.pushState({ex:1},''); SC.hs=1; window.addEventListener('popstate',popBack); }catch(e){}
  var o=document.createElement('div'); o.id='exOv'; o.style.cssText='position:fixed;inset:0;z-index:99990;background:#000;color:#fff;display:flex;flex-direction:column;font-family:inherit';
  o.innerHTML='<div style="padding:12px 14px;display:flex;justify-content:space-between;align-items:center;gap:10px;background:#0b2e1f"><div><div style="font-weight:700">'+escapeHtml(S.course)+'</div><div style="font-size:.8rem;opacity:.85">'+escapeHtml(S.date)+' · present <b id="exN">'+Object.keys(S.present).length+' of '+S.roster.length+'</b></div></div><button type="button" id="exDone" style="background:#fff;color:#0b2e1f;border:0;border-radius:10px;padding:10px 16px;font-weight:700">Done</button></div>'
   +'<div style="position:relative;flex:1;min-height:0"><video id="exVid" playsinline muted autoplay style="width:100%;height:100%;object-fit:cover"></video><div style="position:absolute;left:50%;top:50%;width:92%;height:34%;transform:translate(-50%,-50%);border:3px solid rgba(255,255,255,.9);border-radius:16px;box-shadow:0 0 0 9999px rgba(0,0,0,.4)"></div><div style="position:absolute;left:0;right:0;top:8%;text-align:center;font-size:.85rem;opacity:.9;padding:0 16px">Hold the exam pass flat so the barcode sits inside the box</div></div>'
   +'<div id="exRes" style="padding:16px;text-align:center;font-weight:700;min-height:84px;background:#0b2e1f">Ready. Scan an exam pass.</div><canvas id="exCv" style="display:none"></canvas>';
  document.body.appendChild(o); $('exDone').onclick=function(){ var got=SC&&SC.n>0; close(false); if(got && autoOn()) examDownload(); };
  try{
    await loadLib();
    SC.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}},audio:false});
    var v=$('exVid'); v.srcObject=SC.stream; await v.play().catch(function(){});
  }catch(e){ var r=$('exRes'); r.style.background='#8a1f15'; r.textContent=(e&&e.name==='NotAllowedError')?'Camera access was refused. Allow the camera for this page, then try again.':('Could not start the camera. '+(e&&e.message||'')); return; }
  var Z=window.ZXing, hints=new Map();
  hints.set(Z.DecodeHintType.TRY_HARDER,true);
  hints.set(Z.DecodeHintType.POSSIBLE_FORMATS,[Z.BarcodeFormat.CODE_128,Z.BarcodeFormat.CODE_39,Z.BarcodeFormat.QR_CODE]);
  var reader=new Z.MultiFormatReader(); reader.setHints(hints);
  var cv=$('exCv'), g=cv.getContext('2d',{willReadFrequently:true});
  function tryDecode(sx,sy,sw,sh){
    var scale=Math.min(1,1100/sw); cv.width=Math.round(sw*scale); cv.height=Math.round(sh*scale);
    g.drawImage($('exVid'),sx,sy,sw,sh,0,0,cv.width,cv.height);
    var im=g.getImageData(0,0,cv.width,cv.height), d=im.data, n=cv.width*cv.height, lum=new Uint8ClampedArray(n);
    for(var i=0;i<n;i++) lum[i]=(d[i*4]*299+d[i*4+1]*587+d[i*4+2]*114)/1000;
    var src=new Z.RGBLuminanceSource(lum,cv.width,cv.height);
    var bins=[Z.HybridBinarizer,Z.GlobalHistogramBinarizer];
    for(var b=0;b<bins.length;b++){ try{ return reader.decode(new Z.BinaryBitmap(new bins[b](src))).getText(); }catch(e){} }
    return null;
  }
  var tick=0;
  (function loop(){
    if(!SC) return; var v=$('exVid');
    if(v && v.videoWidth){
      var W=v.videoWidth, H=v.videoHeight, t=null;
      t=tryDecode(Math.round(W*.02),Math.round(H*.28),Math.round(W*.96),Math.round(H*.44));       // the guide box area
      if(!t && (tick++%3===0)) t=tryDecode(0,0,W,H);                                              // whole picture now and then
      if(t) handle(t);
    }
    SC.t=setTimeout(loop,120);
  })();
};
function close(fromBack){
  if(!SC) return; clearTimeout(SC.t); try{ if(SC.stream) SC.stream.getTracks().forEach(function(t){ t.stop(); }); }catch(e){}
  window.removeEventListener('popstate',popBack); var hs=SC.hs; SC=null;
  var o=$('exOv'); if(o) o.remove();
  if(hs && fromBack!==true){ try{ history.back(); }catch(e){} }
  render();
}
})();
