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
+'#onlineExamCard .rv-lv{display:inline-block;color:#fff;border-radius:999px;font-size:.68rem;font-weight:700;padding:2px 9px;margin:5px 5px 0 0}#onlineExamCard .rv-lr{display:flex;justify-content:space-between;align-items:center;padding:3px 0;border-bottom:1px solid var(--line)}#onlineExamCard .rv-lr b{font-size:1.05rem}'
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
var RV=null, LVN={VS:'Very serious',S:'Serious',H:'High',M:'Medium',L:'Low'}, LVC={VS:'#7f1d1d',S:'#dc2626',H:'#ea580c',M:'#d97706',L:'#6b7280'};
function eff(r){ return (r.final!=null)?r.final:((r.mcq||0)+r.written); }
function rnd(x){ return Math.round(x*10)/10; }
function lvTag(l){ return l?'<span class="rv-lv" style="background:'+LVC[l]+'">'+LVN[l]+'</span>':''; }
function propTag(p){ return p==='cancel'?'<span class="rv-lv" style="background:#111">Proposed for cancellation</span>':(p==='review'?'<span class="rv-lv" style="background:#7c3aed">Needs review</span>':''); }
function mergeRv(){
  if(!RV||!D) return;
  var by={}; RV.rows.forEach(function(x){ if(x.email) by['e:'+x.email]=x; if(x.index) by['i:'+String(x.index).toLowerCase()]=x; });
  D.rows.forEach(function(r){ var x=by['e:'+String(r.email||'').toLowerCase()]||by['i:'+String(r.index||'').toLowerCase()]; r.lv=x?x.level:''; r.prop=x?x.proposal:''; r.final=(x&&x.final!=null)?x.final:null; r.reason=x?x.reason:''; r.kinds=x?x.kinds:{}; });
}
function stats(){
  var rows=D.rows, sub=rows.filter(function(r){return r.submittedAt;}), sc=sub.map(eff).sort(function(a,b){return a-b;}), n=sc.length;
  var sum=sc.reduce(function(a,b){return a+b;},0), med=n?(n%2?sc[(n-1)/2]:(sc[n/2-1]+sc[n/2])/2):0, tot=rows.length?rows[0].total:0;
  var lv={VS:0,S:0,H:0,M:0,L:0,none:0}, bands=[0,0,0,0,0], cancel=0, review=0, anyFlag=0;
  sub.forEach(function(r){ lv[r.lv||'none']++; if(r.prop==='cancel') cancel++; else if(r.prop==='review') review++; if(r.lv||(r.why&&r.why.length)||r.flags>0||r.leaves>0) anyFlag++; });
  if(tot>0) sc.forEach(function(s){ bands[Math.min(4,Math.floor(s/tot*5))]++; });
  return {sub:n, expected:rows.length+D.missing.length, missing:D.missing.length, avg:n?sum/n:0, med:med, hi:n?sc[n-1]:0, lo:n?sc[0]:0, tot:tot, lv:lv, bands:bands, cancel:cancel, review:review, anyFlag:anyFlag, pend:rows.filter(function(r){return r.submittedAt&&r.pending>0;}).length};
}
window.oeResults=async function(id){
  var box=$('oeBody'); box.innerHTML='<div class="empty">Loading results...</div>';
  try{ D=await api({action:'oe_results',id:id}); }catch(e){ box.innerHTML='<div class="empty">Could not load ('+esc(e.message)+')</div><button type="button" class="oe-btn s" onclick="oeInit()">Back</button>'; return; }
  RV=null; try{ RV=await api({action:'rv_summary',id:id}); }catch(e){ RV=null; }
  mergeRv(); oeRender();
  if(!RV) msg('<div class="rv-warn">Flag levels could not be loaded just now. Marks and photos still work. Open Results again to try once more.</div>');
};
window.oeRender=function(){
  var box=$('oeBody'), ex=D.exam, rows=D.rows, S=stats();
  var h='<button type="button" class="oe-mini" onclick="oeInit()">&larr; Back to exams</button><div class="oe-h" style="margin-top:12px">'+esc(ex.title)+'</div><div class="oe-sub">'+esc(ex.course)+'</div>'
  +'<div class="rv-t"><div><b>'+S.sub+' / '+S.expected+'</b><span>Submitted</span></div><div><b>'+rnd(S.avg)+'</b><span>Average score</span></div><div><b>'+rnd(S.hi)+'</b><span>Highest</span></div><div><b>'+rnd(S.lo)+'</b><span>Lowest</span></div><div><b>'+rnd(S.med)+'</b><span>Middle score</span></div><div><b>'+S.pend+'</b><span>Need marking</span></div></div>';
  h+='<div class="rv-q"><b>Flag levels</b><div class="oe-sub" style="margin:4px 0 8px">Each student is counted once, at their highest level. Out of '+S.sub+' submitted.</div>'
  +['VS','S','H','M','L'].map(function(k){ return '<div class="rv-lr"><span>'+lvTag(k)+'</span><b>'+S.lv[k]+'</b></div>'; }).join('')+'<div class="rv-lr"><span>No flags</span><b>'+S.lv.none+'</b></div>'
  +(RV?'<div class="rv-lr" style="margin-top:8px"><span>'+propTag('cancel')+'</span><b>'+S.cancel+'</b></div><div class="rv-lr"><span>'+propTag('review')+'</span><b>'+S.review+'</b></div><div class="oe-sub" style="margin:6px 0 0">The two lines above are for you only and are not in the printed report. Nobody is cancelled automatically: you decide.</div>':'')+'</div>';
  h+='<div class="oe-sw"><div>Record in the Gradebook out of<small>Scores are scaled to this total, for example 30 questions recorded out of 15. Students\' exam tile still shows the raw score.</small></div><input type="number" id="oeGbOut" min="1" max="1000" step="0.5" style="width:90px;flex:0 0 90px" value="'+esc(gbOutGet(ex.id,S.tot))+'" onchange="gbOutSet()"></div>'
  +'<div class="oe-sw"><div>Release results to students<small>They see score and comment on their Exams tile.</small></div><button type="button" class="oe-tg'+(ex.released?' on':'')+'" onclick="oeRelease('+(ex.released?'false':'true')+')"><i></i></button></div>'
  +'<div class="oe-row"><button type="button" class="oe-mini" onclick="oePrint()">Print report</button><button type="button" class="oe-mini" onclick="oeCsv()">Download results</button><button type="button" class="oe-mini" onclick="oeIntegrity()">Integrity check</button>'+(ex.hasPhotos?'<button type="button" class="oe-mini x" onclick="oePurge()">Delete photos</button>':'')+'</div>';
  h+='<div id="oeIntegrity"></div>';
  h+='<div class="oe-row" style="margin-top:12px"><select id="rvFil" onchange="oeFilter(this.value)" style="flex:1 1 auto"><option value="">Show: everyone</option><option value="p:cancel">Proposed for cancellation</option><option value="p:review">Needs review</option><option value="l:VS">Very serious</option><option value="l:S">Serious</option><option value="l:H">High</option><option value="l:M">Medium</option><option value="l:L">Low</option><option value="l:">No flags</option><option value="f:1">Has a Final mark</option></select></div>';
  rows.sort(function(a,b){return String(a.name).localeCompare(String(b.name));});
  h+=rows.map(function(r,i){var st=r.submittedAt?(r.how==='auto'||r.how==='time'?'Auto-submitted':'Submitted'):'Not finished';
    return '<div class="rv-r" data-lv="'+(r.lv||'')+'" data-prop="'+(r.prop||'')+'" data-fin="'+(r.final!=null?1:0)+'" onclick="oeOpenAtt('+i+')"><div class="n">'+esc(r.name||r.email)+' <span style="font-weight:400;color:var(--muted)">'+esc(r.index||'')+'</span></div><div class="s">'+st+' &middot; Score '+rnd(eff(r))+' / '+r.total+(r.final!=null?' (Final mark)':'')+(r.pending?' (marking pending)':'')+' &middot; Photos '+r.snaps+'</div>'+((r.lv||r.prop)?'<div>'+propTag(r.prop)+lvTag(r.lv)+'</div>':'')+(r.why&&r.why.length?'<div class="s" style="color:#dc2626;margin-top:4px">&#9888; '+r.why.map(esc).join(' &middot; ')+'</div>':'')+'</div>';}).join('');
  if(D.missing.length) h+='<div class="oe-sub" style="margin-top:16px">Did not start ('+D.missing.length+')</div><div class="oe-sub">'+D.missing.map(function(m){return esc(m.name||m.index);}).join(', ')+'</div>';
  box.innerHTML=h; msg(''); window.scrollTo(0,0);
};
window.oeFilter=function(v){
  var k=String(v||''), t=k.slice(0,1), val=k.slice(2);
  document.querySelectorAll('#oeBody .rv-r').forEach(function(el){
    var show=true;
    if(t==='p') show=el.getAttribute('data-prop')===val;
    else if(t==='l') show=el.getAttribute('data-lv')===val;
    else if(t==='f') show=el.getAttribute('data-fin')==='1';
    el.style.display=show?'':'none';
  });
};
/* Printable report: the overview only. No student names, and nothing about who is proposed for cancellation. */
window.oePrint=function(){
  if(!D) return; var S=stats(), ex=D.exam, d=function(t){ try{ return new Date(t).toLocaleDateString([], {day:'numeric',month:'long',year:'numeric'}); }catch(e){ return ''; } };
  var labels=['0-20%','20-40%','40-60%','60-80%','80-100%'], mx=Math.max.apply(null,S.bands.concat([1]));
  var bandRows=S.bands.map(function(c,i){ return '<tr><td>'+labels[i]+' of the total</td><td class="n">'+c+'</td><td><div class="bar" style="width:'+Math.round(c/mx*100)+'%"></div></td></tr>'; }).join('');
  var lvRows=['VS','S','H','M','L'].map(function(k){ return '<tr><td>'+LVN[k]+'</td><td class="n">'+S.lv[k]+'</td></tr>'; }).join('')+'<tr><td>No flags</td><td class="n">'+S.lv.none+'</td></tr>';
  var css='body{font:14px/1.5 Arial,Helvetica,sans-serif;color:#111;margin:28px}h1{font-size:22px;margin:0 0 2px}h2{font-size:15px;margin:14px 0 5px;border-bottom:1px solid #999;padding-bottom:3px}.sub{color:#555}table{border-collapse:collapse;width:100%}td,th{padding:3px 8px;border-bottom:1px solid #ddd;text-align:left}td.n{text-align:right;font-weight:700;width:90px}.bar{height:12px;background:#334155}.g{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.g div{border:1px solid #bbb;border-radius:8px;padding:8px;text-align:center}.g b{display:block;font-size:20px}.g span{font-size:11px;color:#555}.note{font-size:11px;color:#555;margin-top:10px}@media print{body{margin:8mm}}';
  var html='<!doctype html><html><head><meta charset="utf-8"><title>'+esc(ex.title)+' - report</title><style>'+css+'</style></head><body>'
   +'<h1>'+esc(ex.title)+'</h1><div class="sub">'+esc(ex.course)+(ex.start?' &middot; '+esc(d(ex.start)):'')+(ex.durationMin?' &middot; '+esc(ex.durationMin)+' minutes':'')+' &middot; Total marks: '+rnd(S.tot)+'</div>'
   +'<h2>Participation</h2><div class="g"><div><b>'+S.expected+'</b><span>Expected</span></div><div><b>'+S.sub+'</b><span>Submitted</span></div><div><b>'+S.missing+'</b><span>Did not start</span></div></div>'
   +'<h2>Scores (out of '+rnd(S.tot)+')</h2><div class="g"><div><b>'+rnd(S.avg)+'</b><span>Average</span></div><div><b>'+rnd(S.med)+'</b><span>Middle score</span></div><div><b>'+rnd(S.hi)+'</b><span>Highest</span></div><div><b>'+rnd(S.lo)+'</b><span>Lowest</span></div><div><b>'+S.pend+'</b><span>Scripts still being marked</span></div><div><b>'+S.sub+'</b><span>Scores counted</span></div></div>'
   +'<h2>How scores were spread</h2><table>'+bandRows+'</table>'
   +'<h2>Flag levels</h2><table>'+lvRows+'</table><div class="note">Flags are automatic warnings raised during the exam (for example the camera not seeing a face, or leaving the exam page). Each student is counted once, at their highest level. Students with flags at one or more levels will be reviewed, and may receive a penalty or other marked action.</div>'
   +'<div class="note">No student names appear in this report. Generated '+esc(new Date().toLocaleString())+'.</div>'
   +'<script>window.onload=function(){setTimeout(function(){window.print();},300);}<\/script></body></html>';
  var w=window.open('','_blank');
  if(!w){ msg('<div class="msg err">Your browser blocked the report window. Allow pop-ups for this site, then tap Print report again.</div>'); return; }
  w.document.open(); w.document.write(html); w.document.close();
};
function gbOutGet(id,tot){ try{ var v=localStorage.getItem('oeGbOut_'+id); if(v&&parseFloat(v)>0) return v; }catch(e){} return tot||''; }
window.gbOutSet=function(){ try{ var el=$('oeGbOut'); if(el&&D) localStorage.setItem('oeGbOut_'+D.exam.id,el.value); }catch(e){} };
async function gbSync(add){
  var ex=D.exam, key=function(r){return [(r.indexNumber||'').toLowerCase(),(r.course||'').toLowerCase(),(r.assessmentName||'').toLowerCase()].join('|');};
  var raw=D.rows.length?D.rows[0].total:0, gout=parseFloat(($('oeGbOut')||{}).value)||parseFloat(gbOutGet(ex.id,raw))||raw, f=(raw>0&&gout>0)?gout/raw:1;
  var recs=D.rows.filter(function(r){return r.submittedAt&&r.index;}).map(function(r){return {indexNumber:r.index,score:String(Math.round(eff(r)*f*100)/100),assessmentName:ex.title,course:ex.course,level:''};});
  var drop=new Set(recs.map(key)), tot=(raw>0&&gout>0)?gout:raw;
  var existing=await fetchAllRecords();
  var keep=existing.filter(function(r){return !drop.has(key(r));});
  await saveAllRecords(add?keep.concat(recs):keep, add&&tot>0?{name:ex.title,max:tot,courses:[lmBase(ex.course)]}:null);
  return recs.length;
}

/* ---- Integrity check: missing photos, unusually fast finishes, and students with matching wrong answers ---- */
window.oeIntegrity=async function(){
  var box=$('oeIntegrity'); if(!box||!D) return;
  var rows=D.rows.filter(function(r){return r.submittedAt&&r.startedAt;}), ex=D.exam;
  if(rows.length<2){ box.innerHTML='<div class="rv-warn">Not enough submitted attempts to check yet.</div>'; return; }
  box.innerHTML='<div class="rv-q">Checking... <span id="oeIgP">0</span> / '+rows.length+'</div>';
  var mins=function(r){ return (Date.parse(r.submittedAt)-Date.parse(r.startedAt))/60000; };
  /* 1 photos */
  var every=ex.snapEverySec||30, lowPh=[];
  rows.forEach(function(r){ var exp=mins(r)*60/every; if(exp>=4 && r.snaps<exp*0.4) lowPh.push({r:r,exp:Math.round(exp)}); });
  /* 2 fast */
  var ms=rows.map(mins).sort(function(a,b){return a-b;}), med=ms[Math.floor(ms.length/2)], fast=[];
  if(med>=3) rows.forEach(function(r){ if(mins(r)<med*0.35) fast.push(r); });
  /* 3 answers */
  var att=[], i=0, done=0, fail=0;
  async function worker(){ while(i<rows.length){ var r=rows[i++]; try{ var j=await api({action:'oe_attempt',id:ex.id,email:r.email}); att.push({r:r,items:j.attempt.items||[]}); }catch(e){ fail++; } done++; var p=$('oeIgP'); if(p) p.textContent=done; } }
  await Promise.all([worker(),worker(),worker(),worker(),worker()]);
  var info=att.map(function(a){ var m={}, wrong=0; a.items.forEach(function(q){ if(q.type!=='mcq'||q.chosen==null) return; if(!q.right){ wrong++; m[q.id]=String(q.options[q.chosen]||'').trim().toLowerCase(); } }); return {r:a.r,m:m,wrong:wrong}; });
  var pairs=[];
  for(var x=0;x<info.length;x++) for(var y=x+1;y<info.length;y++){
    var A=info[x], B=info[y], low=Math.min(A.wrong,B.wrong); if(low<4) continue; var same=0;
    Object.keys(A.m).forEach(function(k){ if(B.m[k]!==undefined && B.m[k]===A.m[k]) same++; });
    if(same>=4 && same/low>=0.6) pairs.push({a:A.r,b:B.r,same:same,low:low});
  }
  pairs.sort(function(p,q){return q.same-p.same;});
  var nm=function(r){ return esc(r.name||r.email)+' <span style="color:var(--muted)">'+esc(r.index||'')+'</span>'; };
  var h='<div class="rv-q"><b>Integrity check</b><div class="oe-sub" style="margin:4px 0 0">'+rows.length+' submitted attempts checked'+(fail?' ('+fail+' could not be read)':'')+'. These are hints to look at, not proof.</div></div>';
  h+='<div class="rv-q"><b>Matching wrong answers ('+pairs.length+')</b>'+(pairs.length?pairs.slice(0,30).map(function(p){ return '<div class="oe-sub" style="margin:8px 0 0">&#9888; '+nm(p.a)+' and '+nm(p.b)+': chose the <b>same wrong answer</b> on '+p.same+' of their '+p.low+' wrong questions.</div>'; }).join(''):'<div class="oe-sub" style="margin:6px 0 0">No pairs of students stand out.</div>')+'</div>';
  h+='<div class="rv-q"><b>Few photos ('+lowPh.length+')</b>'+(lowPh.length?lowPh.slice(0,30).map(function(p){ return '<div class="oe-sub" style="margin:8px 0 0">&#9888; '+nm(p.r)+': '+p.r.snaps+' photos, about '+p.exp+' expected.</div>'; }).join(''):'<div class="oe-sub" style="margin:6px 0 0">Photos arrived as expected.</div>')+'</div>';
  h+='<div class="rv-q"><b>Very fast finishes ('+fast.length+')</b>'+(fast.length?fast.slice(0,30).map(function(r){ return '<div class="oe-sub" style="margin:8px 0 0">&#9888; '+nm(r)+': '+Math.max(1,Math.round(mins(r)))+' min, while the middle student took '+Math.round(med)+' min.</div>'; }).join(''):'<div class="oe-sub" style="margin:6px 0 0">No unusually fast finishes.</div>')+'</div>';
  box.innerHTML=h;
};
window.oeRelease=async function(v){ try{ await api({action:'oe_release',id:D.exam.id,released:v}); await oeResults(D.exam.id); var n=await gbSync(v); var nt=''; if(v&&window.ceNotify){ try{ nt=ceNotifyText(await ceNotify('results',D.exam.course,D.exam.title)); }catch(_e){} } msg('<div class="msg ok">'+(v?'Results released and '+n+' scores added to the Gradebook as "'+esc(D.exam.title)+'".'+esc(nt):'Results hidden and removed from the Gradebook.')+'</div>'); }catch(e){ msg('<div class="msg err">'+esc(e.message)+'</div>'); } };
window.oePurge=async function(){ if(!confirm('Delete ALL photos for this exam?\n\nThis cannot be undone.')) return; try{ var r=await api({action:'oe_purge',id:D.exam.id}); await oeResults(D.exam.id); msg('<div class="msg ok">Deleted '+r.removed+' photos.</div>'); }catch(e){ msg('<div class="msg err">'+esc(e.message)+'</div>'); } };
window.oeCsv=function(){ var q=function(v){return '"'+String(v==null?'':v).replace(/"/g,'""')+'"';}; var L=[['Name','Index','Status','MCQ','Written','System score','Final mark','Score used','Out of','Flag level','Proposal','Left page','Flags (all)','Flag types','Photos'].map(q).join(',')];
  D.rows.forEach(function(r){L.push([r.name,r.index,r.submittedAt?'Submitted':'Not finished',r.mcq||0,r.written,(r.mcq||0)+r.written,r.final!=null?r.final:'',eff(r),r.total,r.lv?LVN[r.lv]:'',r.prop==='cancel'?'Proposed for cancellation':(r.prop==='review'?'Needs review':''),r.leaves,Object.keys(r.kinds||{}).reduce(function(s,k){return s+r.kinds[k];},0),Object.keys(r.kinds||{}).map(function(k){return k.replace(/_/g,' ')+' x'+r.kinds[k];}).join('; '),r.snaps].map(q).join(','));});
  D.missing.forEach(function(m){L.push([m.name,m.index,'Did not start',0,0,0,'',0,'','','','','',''].map(q).join(','));});
  var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob(['\ufeff'+L.join('\n')],{type:'text/csv'})); a.download=(D.exam.title||'exam').replace(/[^\w]+/g,'_')+'_results.csv'; a.click(); };
window.oeBig=function(src){ var d=document.createElement('div'); d.id='rvBig'; d.onclick=function(){d.remove();}; d.innerHTML='<img src="'+src+'">'; document.body.appendChild(d); };
window.oeOpenAtt=async function(i){
  var r=D.rows[i], box=$('oeBody'); box.innerHTML='<div class="empty">Loading...</div>';
  var A; try{ A=(await api({action:'oe_attempt',id:D.exam.id,email:r.email})).attempt; }catch(e){ msg('<div class="msg err">'+esc(e.message)+'</div>'); return oeResults(D.exam.id); }
  window._rvA=A; SN=[];
  var h='<button type="button" class="oe-mini" onclick="oeRender()">&larr; Back to results</button><div class="oe-h" style="margin-top:12px">'+esc(A.name||A.email)+'</div><div class="oe-sub">'+esc(A.index||'')+' &middot; Started '+tm(A.startedAt)+(A.submittedAt?' &middot; Submitted '+tm(A.submittedAt):' &middot; Not submitted')+' &middot; Left page '+A.leaves+'x</div>';
  if(A.flags.length) h+='<div class="rv-q"><b>Flags</b>'+A.flags.map(function(f){return '<div class="oe-sub" style="margin:4px 0 0">'+tm(f.t)+' &middot; '+esc(f.kind)+(f.note?' &middot; '+esc(f.note):'')+'</div>';}).join('')+'</div>';
  var kd=r.kinds||{}, kl=Object.keys(kd).map(function(k){ return esc(k.replace(/_/g,' '))+' &times;'+kd[k]; }).join(' &middot; ');
  h+='<div class="rv-q"><b>Final mark</b><div>'+propTag(r.prop)+lvTag(r.lv)+(r.lv||r.prop?'':'<span class="oe-sub">No flags</span>')+'</div>'+(kl?'<div class="oe-sub" style="margin:6px 0 0">'+kl+'</div>':'')
    +'<div class="oe-sub" style="margin:8px 0 0">System score: <b>'+rnd((r.mcq||0)+r.written)+' / '+r.total+'</b>'+(r.final!=null?' &middot; Final mark: <b>'+rnd(r.final)+'</b> (this is what counts)':'')+'</div>'
    +'<div class="oe-l" style="margin-top:10px">Mark you want to give (0 to '+r.total+')</div><input type="number" id="rvFin" step="0.5" min="0" max="'+r.total+'" value="'+(r.final==null?'':r.final)+'" placeholder="Leave empty to use the system score">'
    +'<div class="oe-l" style="margin-top:8px">Reason (only you see this)</div><input type="text" id="rvFinWhy" maxlength="500" value="'+esc(r.reason||'')+'">'
    +'<div class="oe-row" style="margin-top:10px"><button type="button" class="oe-mini" onclick="oeFinal('+i+',false)">Save final mark</button>'+(r.final!=null?'<button type="button" class="oe-mini x" onclick="oeFinal('+i+',true)">Remove final mark</button>':'')+'</div></div>';
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
window.oeFinal=async function(i,clear){
  var r=D.rows[i], v=clear?null:(($('rvFin')||{}).value||'');
  if(!clear && v===''){ msg('<div class="msg err">Type the mark you want to give, or leave things as they are.</div>'); return; }
  try{
    var why=clear?'':(($('rvFinWhy')||{}).value||'');
    var res=await api({action:'rv_final',id:D.exam.id,email:r.email,score:clear?null:Number(v),reason:why});
    r.final=(res.final!=null)?res.final:null; r.reason=clear?'':why;
    if(D.exam.released) await gbSync(true);
    await oeOpenAtt(i);
    msg('<div class="msg ok">'+(clear?'Final mark removed. The system score counts again.':'Final mark saved: '+rnd(r.final)+'.')+(D.exam.released?' Gradebook updated.':'')+'</div>');
  }catch(e){ msg('<div class="msg err">'+esc(e.message)+'</div>'); }
};
window.oeMore=async function(){
  var A=window._rvA, b=$('rvMore'); if(b) b.textContent='Loading...';
  try{ var r=await api({action:'oe_snaps',id:D.exam.id,email:A.email,offset:SN.length,limit:24});
    /* photos of exams written on the fast Cloudflare service are kept there: when none came back from the usual place, ask Cloudflare */
    if(r.photos.length && !r.photos.some(function(p){return p.img;})){
      try{
        var h={'Content-Type':'application/json'}, sess=(await supabaseClient.auth.getSession()).data.session;
        if(sess&&sess.access_token) h['x-staff-token']=sess.access_token;
        var rc=await fetch('https://exams-api.obengahenkora.workers.dev/',{method:'POST',headers:h,body:JSON.stringify({action:'staff_snaps',id:D.exam.id,email:A.email,offset:SN.length,limit:24})});
        var jc=await rc.json(); if(jc&&jc.ok) r=jc; else if(jc&&jc.error) throw new Error(jc.error);
      }catch(e2){ throw e2; }
    }
    r.photos.forEach(function(p){SN.push(p);});
    var bad=function(w){return w&&w!=='timer'&&w!=='random'&&w!=='start';};
    $('rvPh').innerHTML=SN.map(function(p,i){return '<div class="'+(bad(p.why)?'f':'')+'"><img src="'+p.img+'" onclick="oeBig(this.src)"><small>'+tm(p.t).split(', ').pop()+(bad(p.why)?' '+esc(p.why):'')+'</small></div>';}).join('');
    if(b){ if(SN.length<r.total){ b.textContent='Load more ('+(r.total-SN.length)+' left)'; } else b.remove(); } }catch(e){ if(b) b.textContent='Failed, tap to retry'; }
};
window.oeGrade=async function(){
  var A=window._rvA, g={}; document.querySelectorAll('#oeBody input[data-q]').forEach(function(i){g[i.getAttribute('data-q')]=i.value===''?null:Number(i.value);});
  try{ await api({action:'oe_grade',id:D.exam.id,email:A.email,grades:g,comment:($('rvCm')||{}).value||''}); await oeResults(D.exam.id); if(D.exam.released) await gbSync(true); msg('<div class="msg ok">Marks saved'+(D.exam.released?' and Gradebook updated':'')+'.</div>'); }catch(e){ msg('<div class="msg err">'+esc(e.message)+'</div>'); }
};
})();
