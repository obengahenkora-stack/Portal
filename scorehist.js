/* ===== Score History: every change to scores is logged, and a batch can be undone ===== */
(function(){
var CAP=4000;
function $(i){ return document.getElementById(i); }
function esc(t){ return String(t==null?'':t).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function key(r){ return [r.course||'General', r.assessmentName||'Untitled', String(r.indexNumber||'').toLowerCase()].join('\u0001'); }
function toMap(recs){ var m={}; (recs||[]).forEach(function(r){ m[key(r)]=r; }); return m; }
function who(){ try{ return currentUserName||currentUserEmail||'someone'; }catch(e){ return 'someone'; } }
function total(log){ return (log||[]).reduce(function(n,b){ return n+(b.e||[]).length; },0); }

/* ---- record the snapshot at load, and the differences at save ---- */
var _fb=window.fetchBin;
if(typeof _fb==='function') window.fetchBin=async function(){
  var b=await _fb.apply(this,arguments);
  try{ Object.defineProperty(b,'__snap',{value:toMap(b.records),enumerable:false,writable:true,configurable:true}); }catch(e){}
  return b;
};
var _sb=window.saveBin;
if(typeof _sb==='function') window.saveBin=async function(bin){
  var batch=null; try{ batch=logDiff(bin); }catch(e){ console.warn('score log',e); }
  var r=await _sb.apply(this,arguments);
  if(batch){ try{ await teamApi({action:'score_log_add',batch:batch}); }catch(e){} }
  return r;
};
function logDiff(bin){
  if(!bin || !bin.__snap) return null;
  var lab=bin.__label||''; try{ delete bin.__label; }catch(e){}
  var base=bin.__snap, now=toMap(bin.records), e=[], k, o, n;
  for(k in now){ n=now[k]; o=base[k];
    if(!o) e.push({i:n.indexNumber,c:n.course||'General',n:n.assessmentName||'Untitled',o:null,w:n.score});
    else if(String(o.score)!==String(n.score)) e.push({i:n.indexNumber,c:n.course||'General',n:n.assessmentName||'Untitled',o:o.score,w:n.score});
  }
  for(k in base){ if(!(k in now)){ o=base[k]; e.push({i:o.indexNumber,c:o.course||'General',n:o.assessmentName||'Untitled',o:o.score,w:null,r:o}); } }
  bin.__snap=now;
  if(!e.length) return null;
  return {id:Date.now()+'-'+Math.random().toString(36).slice(2,6),t:new Date().toISOString(),by:who(),label:lab,e:e};
}

/* ---- the screen ---- */
var _log=[];
window.shInit=async function(){
  var box=$('shBody'); if(!box) return;
  box.innerHTML='<div class="empty">Loading...</div>';
  try{
    var j=await teamApi({action:'score_log_get'}); if(!j||!j.ok) throw new Error((j&&j.error)||'Back end not updated yet (deploy step 34)'); _log=j.log||[]; render();
  }catch(e){ box.innerHTML='<div class="empty">Could not load ('+esc(e.message||'error')+')</div>'; }
};
function summary(b){
  var ch=0,ad=0,rm=0, cs={}, as={};
  b.e.forEach(function(x){ if(x.w===null) rm++; else if(x.o===null) ad++; else ch++; cs[x.c]=1; as[x.n]=1; });
  var parts=[]; if(ad) parts.push(ad+' added'); if(ch) parts.push(ch+' changed'); if(rm) parts.push(rm+' removed');
  return {parts:parts.join(', '), course:Object.keys(cs).join(', '), ass:Object.keys(as).slice(0,3).join(', ')+(Object.keys(as).length>3?'...':'')};
}
function when(iso){ try{ return new Date(iso).toLocaleString([], {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}); }catch(e){ return iso; } }
function canUndo(b){ var adm=false; try{ adm=isAdmin(); }catch(e){} return adm || b.by===who(); }
function render(){
  var box=$('shBody'); if(!_log.length){ box.innerHTML='<div class="empty">No score changes recorded yet. From now on every upload, edit and removal is listed here.</div>'; return; }
  box.innerHTML=_log.map(function(b,i){
    var s=summary(b);
    return '<div class="sh-row"><div style="min-width:0"><b>'+esc(b.label||s.ass||'Score change')+'</b><small>'+esc(s.course)+'</small><small>'+esc(s.parts)+' &middot; '+esc(b.by)+' &middot; '+esc(when(b.t))+'</small>'+(b.undone?'<span class="sh-tag">Undone</span>':'')+'</div>'
      +'<div class="sh-act"><button type="button" class="shb" onclick="shView('+i+')">Details</button>'+((!b.undone && canUndo(b) && !b.label)?'<button type="button" class="shb x" onclick="shUndo('+i+')">Undo</button>':'')+'</div></div><div id="shD'+i+'"></div>';
  }).join('');
}
window.shView=function(i){
  var d=$('shD'+i); if(!d) return; if(d.innerHTML){ d.innerHTML=''; return; }
  var b=_log[i]; var rows=b.e.slice(0,60).map(function(x){ return '<tr><td>'+esc(x.i)+'</td><td>'+esc(x.n)+'</td><td>'+(x.o===null?'<i>new</i>':esc(x.o))+'</td><td>'+(x.w===null?'<i>removed</i>':esc(x.w))+'</td></tr>'; }).join('');
  d.innerHTML='<div class="sh-det"><table><tr><th>Index</th><th>Assessment</th><th>Was</th><th>Now</th></tr>'+rows+'</table>'+(b.e.length>60?'<div class="hint">Showing 60 of '+b.e.length+'.</div>':'')+'</div>';
};
window.shUndo=async function(i){
  var b=_log[i]; if(!b) return;
  if(!confirm('Undo this change?\n\n'+summary(b).parts+' by '+b.by+' on '+when(b.t)+'.\n\nScores are put back to what they were before. Anything changed again since is left alone.')) return;
  var msg=$('shMsg'); msg.innerHTML='<div class="msg ok">Working...</div>';
  try{
    var bin=await fetchBin(), recs=bin.records||[], map=toMap(recs), done=0, skipped=0;
    b.e.forEach(function(x){
      var k=[x.c,x.n,String(x.i||'').toLowerCase()].join('\u0001'), cur=map[k];
      if(x.w===null){ if(cur){ skipped++; return; } recs.push(x.r); done++; }
      else if(x.o===null){ if(!cur){ skipped++; return; } if(String(cur.score)!==String(x.w)){ skipped++; return; } recs.splice(recs.indexOf(cur),1); done++; }
      else { if(!cur || String(cur.score)!==String(x.w)){ skipped++; return; } cur.score=x.o; done++; }
    });
    bin.records=recs; try{ Object.defineProperty(bin,'__label',{value:'Undo: '+(summary(b).ass||'score change'),enumerable:false,writable:true,configurable:true}); }catch(e){}
    await saveBin(bin);
    await teamApi({action:'score_log_mark',id:b.id,by:who()}); b.undone=true;
    msg.innerHTML='<div class="msg ok">Undone. '+done+' score'+(done===1?'':'s')+' restored'+(skipped?', '+skipped+' left alone because they changed again':'')+'.</div>';
    shInit();
  }catch(e){ msg.innerHTML='<div class="msg err">Could not undo: '+esc(e.message||'error')+'</div>'; }
};

var css=document.createElement('style');
css.textContent='#scoreHistCard .sh-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:11px 13px;border:1px solid var(--line);border-radius:14px;margin-top:8px;background:var(--card)}'
+'#scoreHistCard .sh-row small{display:block;color:var(--muted);margin-top:1px}'
+'#scoreHistCard .sh-act{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}'
+'#scoreHistCard .shb{width:auto !important;padding:7px 12px !important;font-size:.78rem !important;border-radius:999px !important;background:var(--card) !important;color:var(--ink) !important;border:1px solid var(--line) !important;box-shadow:none !important;font-weight:700 !important;letter-spacing:0 !important;text-transform:none !important}'
+'#scoreHistCard .shb.x{color:var(--danger) !important}'
+'#scoreHistCard .sh-tag{display:inline-block;margin-top:4px;padding:2px 9px;border-radius:999px;background:rgba(127,127,127,.2);font-size:.7rem;font-weight:700}'
+'#scoreHistCard .sh-det{margin:6px 0 0;border:1px solid var(--line);border-radius:12px;overflow:auto;max-height:260px}'
+'#scoreHistCard .sh-det table{width:100%;font-size:.78rem;border-collapse:collapse}'
+'#scoreHistCard .sh-det th,#scoreHistCard .sh-det td{padding:6px 8px;text-align:left;border-bottom:1px solid var(--line);font-family:inherit !important;text-transform:none !important;letter-spacing:0 !important}';
document.head.appendChild(css);
})();
