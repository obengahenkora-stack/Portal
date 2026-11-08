/* Online exam review: results, photos, marking (staff). */
(function(){
function $(i){return document.getElementById(i);}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function tm(t){try{return new Date(t).toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'});}catch(e){return t||'';}}
var css=document.createElement('style');
css.textContent='#onlineExamCard .rv-t{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:12px 0}#onlineExamCard .rv-t div{border:1px solid var(--line);border-radius:12px;padding:10px;text-align:center;background:var(--card)}#onlineExamCard .rv-t b{display:block;font-size:1.25rem}#onlineExamCard .rv-t span{font-size:.7rem;color:var(--muted);font-weight:600}'
+'#onlineExamCard .rv-r{border:1px solid var(--line);border-radius:14px;padding:11px 12px;margin-top:8px;background:var(--card);cursor:pointer}#onlineExamCard .rv-r .n{font-weight:700;overflow-wrap:anywhere}#onlineExamCard .rv-r .s{font-size:.76rem;color:var(--muted);margin-top:2px}'
+'#onlineExamCard .rv-p{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:8px}#onlineExamCard .rv-p img{width:100%;border-radius:8px;display:block;cursor:pointer}#onlineExamCard .rv-p .f img{outline:3px solid #dc2626}#onlineExamCard .rv-p small{display:block;font-size:.62rem;color:var(--muted);text-align:center}#onlineExamCard .rv-p .f small{color:#dc2626;font-weight:700}'
+'#onlineExamCard .rv-q{border:1px solid var(--line);border-radius:14px;padding:12px;margin-top:10px;background:var(--card)}#onlineExamCard .rv-ok{color:#15803d;font-weight:700}#onlineExamCard .rv-no{color:#dc2626;font-weight:700}'
+'#onlineExamCard .rv-warn{border:1px solid #d97706;background:rgba(217,119,6,.12);border-radius:12px;padding:10px;margin-top:12px;font-size:.84rem}'
+'#rvBig{position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:99999;display:flex;align-items:center;justify-content:center;padding:14px}#rvBig img{max-width:100%;max-height:100%;border-radius:10px}';
document.head.appendChild(css);
var X=null, D=null, SN=[];
function msg(h){var m=$('oeMsg'); if(m) m.innerHTML=h||'';}
async function api(o){var r=await teamApi(o); if(!r||!r.ok) throw new Error((r&&r.error)||'Failed'); return r;}
window.oeBanner=function(list){ // called from list: old photos reminder
  var old=(list||[]).filter(function(x){return x.hasPhotos && x.end && (Date.now()-new Date(x.end).getTime())>14*86400000;});
  if(!old.length) return '';
  return '<div class="rv-warn"><b>Photo clean-up reminder.</b> Exam photos for '+old.map(function(x){return esc(x.title);}).join(', ')+' are more than 14 days old. Open Results and tap "Delete photos" once you have finished reviewing, to free storage.</div>';
};
window.oeResults=async function(id){
  var box=$('oeBody'); box.innerHTML='<div class="empty">Loading results...</div>';
  try{ D=await api({action:'oe_results',id:id}); }catch(e){ box.innerHTML='<div class="empty">Could not load ('+esc(e.message)+')</div><button type="button" class="oe-btn s" onclick="oeInit()">Back</button>'; return; }
  var ex=D.exam, rows=D.rows;
  var sub=rows.filter(function(r){return r.submittedAt;}), tot=sub.map(function(r){return (r.mcq||0)+r.written;}), avg=tot.length?tot.reduce(function(a,b){return a+b;},0)/tot.length:0;
  var fl=rows.filter(function(r){return r.flags>0||r.leaves>0;}).length, pend=rows.filter(function(r){return r.submittedAt&&r.pending>0;}).length;
  var h='<button type="button" class="oe-mini" onclick="oeInit()">&larr; Back to exams</button><div class="oe-h" style="margin-top:12px">'+esc(ex.title)+'</div><div class="oe-sub">'+esc(ex.course)+'</div>'
  +'<div class="rv-t"><div><b>'+sub.length+' / '+(rows.length+D.missing.length)+'</b><span>Submitted</span></div><div><b>'+avg.toFixed(1)+'</b><span>Average score</span></div><div><b>'+fl+'</b><span>Flagged</span></div><div><b>'+pend+'</b><span>Need marking</span></div></div>'
  +'<div class="oe-sw"><div>Release results to students<small>They see score and comment on their Exams tile.</small></div><button type="button" class="oe-tg'+(ex.released?' on':'')+'" onclick="oeRelease('+(ex.released?'false':'true')+')"><i></i></button></div>'
  +'<div class="oe-row"><button type="button" class="oe-mini" onclick="oeCsv()">Download results</button>'+(ex.hasPhotos?'<button type="button" class="oe-mini x" onclick="oePurge()">Delete photos</button>':'')+'</div>';
  rows.sort(function(a,b){return String(a.name).localeCompare(String(b.name));});
  h+=rows.map(function(r,i){var st=r.submittedAt?(r.how==='auto'||r.how==='time'?'Auto-submitted':'Submitted'):'Not finished';
    return '<div class="rv-r" onclick="oeOpenAtt('+i+')"><div class="n">'+esc(r.name||r.email)+' <span style="font-weight:400;color:var(--muted)">'+esc(r.index||'')+'</span></div><div class="s">'+st+' &middot; Score '+((r.mcq||0)+r.written)+' / '+r.total+(r.pending?' (marking pending)':'')+' &middot; Left page '+r.leaves+'x &middot; Flags '+r.flags+' &middot; Photos '+r.snaps+'</div></div>';}).join('');
  if(D.missing.length) h+='<div class="oe-sub" style="margin-top:16px">Did not start ('+D.missing.length+')</div><div class="oe-sub">'+D.missing.map(function(m){return esc(m.name||m.index);}).join(', ')+'</div>';
  box.innerHTML=h; msg(''); window.scrollTo(0,0);
};
async function gbSync(add){
  var ex=D.exam, key=function(r){return [(r.indexNumber||'').toLowerCase(),(r.course||'').toLowerCase(),(r.assessmentName||'').toLowerCase()].join('|');};
  var recs=D.rows.filter(function(r){return r.submittedAt&&r.index;}).map(function(r){return {indexNumber:r.index,score:(r.mcq||0)+r.written,assessmentName:ex.title,course:ex.course,level:''};});
  var drop=new Set(recs.map(key)), tot=D.rows.length?D.rows[0].total:0;
  var existing=await fetchAllRecords();
  var keep=existing.filter(function(r){return !drop.has(key(r));});
  await saveAllRecords(add?keep.concat(recs):keep, add&&tot>0?{name:ex.title,max:tot,courses:[lmBase(ex.course)]}:null);
  return recs.length;
}
window.oeRelease=async function(v){ try{ await api({action:'oe_release',id:D.exam.id,released:v}); await oeResults(D.exam.id); var n=await gbSync(v); msg('<div class="msg ok">'+(v?'Results released and '+n+' scores added to the Gradebook as "'+esc(D.exam.title)+'".':'Results hidden and removed from the Gradebook.')+'</div>'); }catch(e){ msg('<div class="msg err">'+esc(e.message)+'</div>'); } };
window.oePurge=async function(){ if(!confirm('Delete ALL photos for this exam?\n\nThis cannot be undone.')) return; try{ var r=await api({action:'oe_purge',id:D.exam.id}); await oeResults(D.exam.id); msg('<div class="msg ok">Deleted '+r.removed+' photos.</div>'); }catch(e){ msg('<div class="msg err">'+esc(e.message)+'</div>'); } };
window.oeCsv=function(){ var q=function(v){return '"'+String(v==null?'':v).replace(/"/g,'""')+'"';}; var L=[['Name','Index','Status','MCQ','Written','Total','Out of','Left page','Flags','Photos'].map(q).join(',')];
  D.rows.forEach(function(r){L.push([r.name,r.index,r.submittedAt?'Submitted':'Not finished',r.mcq||0,r.written,(r.mcq||0)+r.written,r.total,r.leaves,r.flags,r.snaps].map(q).join(','));});
  D.missing.forEach(function(m){L.push([m.name,m.index,'Did not start',0,0,0,'','','',''].map(q).join(','));});
  var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob(['\ufeff'+L.join('\n')],{type:'text/csv'})); a.download=(D.exam.title||'exam').replace(/[^\w]+/g,'_')+'_results.csv'; a.click(); };
window.oeBig=function(src){ var d=document.createElement('div'); d.id='rvBig'; d.onclick=function(){d.remove();}; d.innerHTML='<img src="'+src+'">'; document.body.appendChild(d); };
window.oeOpenAtt=async function(i){
  var r=D.rows[i], box=$('oeBody'); box.innerHTML='<div class="empty">Loading...</div>';
  var A; try{ A=(await api({action:'oe_attempt',id:D.exam.id,email:r.email})).attempt; }catch(e){ msg('<div class="msg err">'+esc(e.message)+'</div>'); return oeResults(D.exam.id); }
  window._rvA=A; SN=[];
  var h='<button type="button" class="oe-mini" onclick="oeResults(\''+D.exam.id+'\')">&larr; Back to results</button><div class="oe-h" style="margin-top:12px">'+esc(A.name||A.email)+'</div><div class="oe-sub">'+esc(A.index||'')+' &middot; Started '+tm(A.startedAt)+(A.submittedAt?' &middot; Submitted '+tm(A.submittedAt):' &middot; Not submitted')+' &middot; Left page '+A.leaves+'x</div>';
  if(A.flags.length) h+='<div class="rv-q"><b>Flags</b>'+A.flags.map(function(f){return '<div class="oe-sub" style="margin:4px 0 0">'+tm(f.t)+' &middot; '+esc(f.kind)+(f.note?' &middot; '+esc(f.note):'')+'</div>';}).join('')+'</div>';
  h+='<div class="rv-q"><b>Photos ('+A.snaps.length+')</b><div class="rv-p" id="rvPh"></div>'+(A.snaps.length?'<button type="button" class="oe-mini" id="rvMore" style="margin-top:10px" onclick="oeMore()">Load photos</button>':'<div class="oe-sub">No photos.</div>')+'</div>';
  A.items.forEach(function(it,k){
    h+='<div class="rv-q"><div class="oe-sub" style="margin:0">Q'+(k+1)+' &middot; '+it.marks+' mark'+(it.marks===1?'':'s')+'</div><div style="font-weight:600;margin:4px 0 8px;overflow-wrap:anywhere">'+esc(it.text)+'</div>';
    if(it.type==='mcq'){ h+=it.options.map(function(o,j){var c=j===it.correct?'rv-ok':(j===it.chosen?'rv-no':''); return '<div class="'+c+'" style="margin-top:4px">'+(j===it.chosen?'&#9679; ':'&#9675; ')+esc(o)+(j===it.correct?' &#10003;':'')+'</div>';}).join('')+'<div class="oe-sub" style="margin-top:8px">'+(it.chosen==null?'Not answered':(it.right?'Correct':'Wrong'))+'</div>'; }
    else { h+='<div style="white-space:pre-wrap;border:1px solid var(--line);border-radius:10px;padding:10px;overflow-wrap:anywhere">'+(esc(it.answer)||'<i>No answer</i>')+'</div>'+(it.guide?'<div class="oe-sub" style="margin-top:8px">Marking guide: '+esc(it.guide)+'</div>':'')
      +'<div class="oe-l" style="margin-top:10px">Mark (0 to '+it.marks+')</div><input type="number" step="0.5" min="0" max="'+it.marks+'" data-q="'+it.id+'" value="'+(it.grade==null?'':it.grade)+'">'; }
    h+='</div>'; });
  h+='<div class="rv-q"><div class="oe-l">Comment to student (optional)</div><textarea id="rvCm">'+esc(A.comment)+'</textarea></div><button type="button" class="oe-btn" style="margin-top:12px" onclick="oeGrade()">Save marks</button>';
  box.innerHTML=h; window.scrollTo(0,0);
};
window.oeMore=async function(){
  var A=window._rvA, b=$('rvMore'); if(b) b.textContent='Loading...';
  try{ var r=await api({action:'oe_snaps',id:D.exam.id,email:A.email,offset:SN.length,limit:24}); r.photos.forEach(function(p){SN.push(p);});
    var bad=function(w){return w&&w!=='timer'&&w!=='random'&&w!=='start';};
    $('rvPh').innerHTML=SN.map(function(p,i){return '<div class="'+(bad(p.why)?'f':'')+'"><img src="'+p.img+'" onclick="oeBig(this.src)"><small>'+tm(p.t).split(', ').pop()+(bad(p.why)?' '+esc(p.why):'')+'</small></div>';}).join('');
    if(b){ if(SN.length<r.total){ b.textContent='Load more ('+(r.total-SN.length)+' left)'; } else b.remove(); } }catch(e){ if(b) b.textContent='Failed, tap to retry'; }
};
window.oeGrade=async function(){
  var A=window._rvA, g={}; document.querySelectorAll('#oeBody input[data-q]').forEach(function(i){g[i.getAttribute('data-q')]=i.value===''?null:Number(i.value);});
  try{ await api({action:'oe_grade',id:D.exam.id,email:A.email,grades:g,comment:($('rvCm')||{}).value||''}); await oeResults(D.exam.id); if(D.exam.released) await gbSync(true); msg('<div class="msg ok">Marks saved'+(D.exam.released?' and Gradebook updated':'')+'.</div>'); }catch(e){ msg('<div class="msg err">'+esc(e.message)+'</div>'); }
};
})();
