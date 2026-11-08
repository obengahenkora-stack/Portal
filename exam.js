/* ===== Exam Sessions: scan the barcode on a student's Exam Pass to mark them present ===== */
(function(){
var QK='ceExamQueue';
var S={course:'',date:'',roster:[],present:{},ready:false,busy:false};
var SC=null, _flushing=null, _retryT=null, _inited=false;
function $(i){ return document.getElementById(i); }
function key(x){ return String(x||'').toUpperCase().replace(/[^A-Z0-9]/g,''); }
function roomGet(){ try{ return localStorage.getItem('ceExamRoom')||''; }catch(e){ return ''; } }
window.examRoomSet=function(v){ try{ localStorage.setItem('ceExamRoom',String(v||'').trim()); }catch(e){} };
function qGet(){ try{ return JSON.parse(localStorage.getItem(QK)||'[]'); }catch(e){ return []; } }
function qSet(a){ try{ localStorage.setItem(QK,JSON.stringify(a)); }catch(e){} }
function today(){ try{ return new Date().toLocaleDateString('en-CA'); }catch(e){ return new Date().toISOString().slice(0,10); } }
function hhmm(iso){ try{ return new Date(iso).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}); }catch(e){ return ''; } }

var css=document.createElement('style');
css.textContent='#examCard .ex-fields{display:grid;gap:12px;margin:14px 0}'
+'#examCard .ex-l{font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:5px}'
+'#examCard .ex-fields select,#examCard .ex-fields input{width:100% !important;max-width:100% !important;box-sizing:border-box !important;min-width:0}'
+'#examCard .ex-scan{width:100% !important;display:flex !important;align-items:center;justify-content:center;gap:10px;background:#0b2e1f !important;color:#fff !important;border:0 !important;border-radius:16px !important;padding:15px !important;font-size:1rem !important;font-weight:700 !important;letter-spacing:0 !important;text-transform:none !important;box-shadow:none !important}'
+'#examCard .ex-two{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:10px 0 4px}'
+'#examCard .exb{width:100% !important;display:flex !important;align-items:center;justify-content:center;gap:6px;padding:11px 12px !important;font-size:.88rem !important;border-radius:14px !important;background:var(--card) !important;color:var(--ink) !important;border:1px solid var(--line) !important;box-shadow:none !important;font-weight:700 !important;letter-spacing:0 !important;text-transform:none !important}'
+'#examCard .ex-row .exb{width:auto !important;padding:7px 12px !important;font-size:.78rem !important;border-radius:999px !important}'
+'#examCard .exb.x{color:var(--danger) !important}'
+'#examCard .ex-sw{font-family:inherit;display:flex;justify-content:space-between;align-items:center;gap:12px;margin:12px 2px 4px;font-size:.84rem;font-weight:500;text-transform:none;letter-spacing:0;cursor:pointer;color:var(--muted);position:relative}'
+'#examCard .ex-sw input{position:absolute;opacity:0;width:0;height:0}'
+'#examCard .ex-sw i{flex:0 0 42px;height:24px;border-radius:99px;background:rgba(127,127,127,.35);position:relative;transition:background .2s}'
+'#examCard .ex-sw i::after{content:"";position:absolute;left:3px;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .2s;box-shadow:0 1px 3px rgba(0,0,0,.3)}'
+'#examCard .ex-sw input:checked+i{background:#16a34a}'
+'#examCard .ex-sw input:checked+i::after{transform:translateX(18px)}'
+'#examCard .ex-stat{margin:16px 0 10px;padding:16px;border-radius:16px;border:1px solid var(--line);background:linear-gradient(135deg,rgba(22,163,74,.08),rgba(13,148,136,.06))}'
+'#examCard .ex-stat .ex-big{font-size:2.2rem;font-weight:800;line-height:1}'
+'#examCard .ex-stat .ex-of{color:var(--muted);font-weight:600;font-size:.95rem}'
+'#examCard .ex-bar{height:8px;border-radius:99px;background:rgba(127,127,127,.2);overflow:hidden;margin-top:12px}'
+'#examCard .ex-bar i{display:block;height:100%;background:linear-gradient(90deg,#16a34a,#0d9488);width:0;transition:width .3s}'
+'#examCard .ex-tabs{display:flex;gap:4px;padding:4px;border-radius:14px;background:rgba(127,127,127,.14);margin-bottom:12px}'
+'#examCard .ex-tabs button{flex:1;background:transparent !important;color:var(--muted) !important;border:0 !important;border-radius:11px !important;padding:9px !important;font-size:.85rem !important;font-weight:700 !important;box-shadow:none !important;text-transform:none !important;letter-spacing:0 !important;width:auto !important}'
+'#examCard .ex-tabs button.on{background:var(--card) !important;color:var(--ink) !important;box-shadow:0 1px 4px rgba(0,0,0,.12) !important}'
+'#examCard .ex-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:11px 13px;border:1px solid var(--line);border-radius:14px;margin-bottom:8px;background:var(--card)}'
+'#examCard .ex-row small{color:var(--muted);display:block;margin-top:1px}'
+'#examCard .ex-row .ex-t{font-size:.76rem;color:#15803d;font-weight:700;white-space:nowrap;margin-bottom:4px}'
+'#examCard .ex-st{font-size:.76rem;color:var(--muted);margin-top:10px;text-align:center}'
+'#exPast{margin-top:14px}';
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
  if(!_inited){ _inited=true; var d=$('exDate'); if(d && !d.value) d.value=today(); var au=$('exAuto'); if(au) au.checked=autoOn(); var rm=$('exRoom'); if(rm) rm.value=roomGet(); }
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
  var m={}; S.room={}; (j.items||[]).forEach(function(it){ m[key(it.idx)]=it.at||new Date().toISOString(); if(it.room) S.room[key(it.idx)]=it.room; });
  qGet().forEach(function(o){ if(o.course===S.course && o.date===S.date){ if(o.present){ m[key(o.index)]=new Date(o.ts).toISOString(); if(o.room) S.room[key(o.index)]=o.room; } else delete m[key(o.index)]; } });
  var sig=Object.keys(m).sort().map(function(k){ return k+(S.room[k]||''); }).join(',');
  S.present=m;
  if(force || sig!==_sig){ _sig=sig; render(); var c=$('exN'); if(c) c.textContent=Object.keys(S.present).length+' of '+S.roster.length; }
}
setInterval(function(){ var c=$('examCard'); if(c && !c.classList.contains('hidden') && !c.classList.contains('pane-off') && S.ready && !document.hidden) poll(false); },4000);
function find(idx){ var k=key(idx); for(var i=0;i<S.roster.length;i++){ if(key(S.roster[i].indexNumber)===k) return S.roster[i]; } return null; }

/* ---------- render ---------- */
var tab='in';
function extras(){ var inRos={}; S.roster.forEach(function(s){ inRos[key(s.indexNumber)]=1; }); return Object.keys(S.present).filter(function(k){ return !inRos[k]; }); }
function roomTxt(k){ var r=S.room&&S.room[k]; return r?' · '+escapeHtml(String(r).replace(/-/g,' ')):''; }
function render(){
  if(!S.ready) return;
  var tot=S.roster.length, rows=S.roster.filter(function(s){ return S.present[key(s.indexNumber)]; });
  rows.sort(function(a,b){ return String(S.present[key(b.indexNumber)]).localeCompare(String(S.present[key(a.indexNumber)])); });
  var abs=S.roster.filter(function(s){ return !S.present[key(s.indexNumber)]; });
  var ex=extras(), rc={}; Object.keys(S.present).forEach(function(k){ var r=(S.room&&S.room[k])||''; if(r) rc[r]=(rc[r]||0)+1; });
  var rooms=Object.keys(rc).sort().map(function(r){ return escapeHtml(r.replace(/-/g,' '))+' <b>'+rc[r]+'</b>'; }).join(' &nbsp;·&nbsp; ');
  var h='<div class="ex-stat"><div><span class="ex-big">'+rows.length+'</span> <span class="ex-of">of '+tot+' present'+(ex.length?' · +'+ex.length+' extra':'')+'</span></div><div class="ex-bar"><i style="width:'+(tot?Math.round(rows.length*100/tot):0)+'%"></i></div>'+(rooms?'<div style="font-size:.8rem;color:var(--muted);margin-top:10px">By room: '+rooms+'</div>':'')+'</div>'
   +'<div class="ex-tabs"><button type="button" class="'+(tab==='in'?'on':'')+'" onclick="examTab(\'in\')">Present ('+(rows.length+ex.length)+')</button><button type="button" class="'+(tab==='out'?'on':'')+'" onclick="examTab(\'out\')">Not yet ('+abs.length+')</button></div>';
  if(tab==='in'){
    var any=false;
    ex.forEach(function(k){ any=true; h+='<div class="ex-row" style="border-color:#f59e0b"><div><b>Extra candidate</b><small>'+escapeHtml(k)+roomTxt(k)+' · not on the class list</small></div><div style="text-align:right"><div class="ex-t">'+hhmm(S.present[k])+'</div><button type="button" class="exb x" onclick="examRemove(\''+escapeHtml(k)+'\')">Remove</button></div></div>'; });
    rows.forEach(function(s){ any=true; var ix=escapeHtml(s.indexNumber), k=key(s.indexNumber); h+='<div class="ex-row"><div><b>'+escapeHtml(s.name||s.indexNumber)+'</b><small>'+ix+roomTxt(k)+'</small></div><div style="text-align:right"><div class="ex-t">'+hhmm(S.present[k])+'</div><button type="button" class="exb x" onclick="examRemove(\''+ix.replace(/'/g,'')+'\')">Remove</button></div></div>'; });
    if(!any) h+='<div class="empty">No one yet. Scan an exam pass and the name appears here.</div>';
  } else h+= abs.length ? abs.map(function(s){ var ix=escapeHtml(s.indexNumber); return '<div class="ex-row"><div><b>'+escapeHtml(s.name||s.indexNumber)+'</b><small>'+ix+'</small></div><button type="button" class="exb" onclick="examAdd(\''+ix.replace(/'/g,'')+'\')">Mark present</button></div>'; }).join('') : '<div class="empty">Everyone is present.</div>';
  h+='<div class="ex-st" id="exSt"></div>';
  $('exBody').innerHTML=h; var au=$('exAuto'); if(au) au.checked=autoOn(); status();
}
window.examTab=function(t){ tab=t; render(); };
function status(){
  var e=$('exSt'); if(!e) return; var n=qGet().length; if(S.err){ e.textContent='Could not load saved scans ('+S.err+'). If this says Unknown action, the backend step 30 has not been deployed yet.'; return; }
  e.textContent=n?(navigator.onLine===false?('Offline. '+n+' change'+(n===1?'':'s')+' will save when the internet returns.'):('Saving '+n+' change'+(n===1?'':'s')+'...')):'All changes saved.';
}
window.examDownload=examDownload;


/* ---------- marking and saving ---------- */
function mark(idx,present,extra){
  var s=find(idx), ix=s?s.indexNumber:(extra||!present?String(idx||'').toUpperCase().replace(/[^A-Z0-9]/g,''):''); if(!ix) return false;
  var k=key(ix), room=roomGet(); if(!S.room) S.room={};
  if(present){ S.present[k]=new Date().toISOString(); if(room) S.room[k]=room.replace(/ +/g,'-'); } else delete S.present[k];
  var q=qGet(); q.push({id:Date.now()+'-'+Math.random().toString(36).slice(2),course:S.course,date:S.date,index:ix,present:!!present,room:room,ts:Date.now()}); qSet(q);
  flush(); return true;
}
window.examAdd=function(i){ mark(i,true); render(); };
window.examRemove=function(i){ var s=find(i); if(!confirm('Remove '+(s?(s.name||s.indexNumber):i)+' from the present list?')) return; mark(i,false); render(); };
window.examExtra=function(i){ if(mark(i,true,true)){ if(SC){ SC.n++; var c=$('exN'); if(c) c.textContent=Object.keys(S.present).length+' of '+S.roster.length; show('ok','<div style="font-size:1.2rem">&#10003; '+escapeHtml(i)+'</div>Added as an extra candidate'); } render(); } };
async function flush(){
  if(_flushing) return _flushing;
  _flushing=(async function(){
    try{
      var q=qGet(); if(!q.length){ status(); return; }
      if(navigator.onLine===false) throw new Error('offline');
      for(var i=0;i<q.length;i++){
        var o=q[i], j=await teamApi({action:'exam_mark',course:o.course,date:o.date,idx:o.index,room:o.room||'',present:!!o.present});
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


/* ---------- past sessions ---------- */
var _past=null, _pastOpen=false;
window.examPast=async function(){
  _pastOpen=!_pastOpen; var box=$('exPast'); if(!box) return;
  if(!_pastOpen){ box.innerHTML=''; $('exPastBtn').textContent='Past sessions'; return; }
  $('exPastBtn').textContent='Hide past';
  box.innerHTML='<div class="empty">Loading...</div>';
  var j=await teamApi({action:'exam_sessions'});
  if(!j||!j.ok){ box.innerHTML='<div class="empty">Could not load ('+escapeHtml((j&&j.error)||'no answer')+'). If this says Unknown action, deploy backend step 31.</div>'; return; }
  _past=j.sessions||[];
  if(!_past.length){ box.innerHTML='<div class="empty">No exam sessions saved yet.</div>'; return; }
  var own=false; try{ own=isOwner(); }catch(e){}
  box.innerHTML=_past.map(function(x,i){ return '<div class="ex-row"><div><b>'+escapeHtml(x.course)+'</b><small>'+escapeHtml(x.date)+' · '+x.count+' present</small></div><div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end"><button type="button" class="exb" onclick="examOpen('+i+')">Open</button>'+(own?'<button type="button" class="exb x" onclick="examDel('+i+')">Delete</button>':'')+'</div></div>'; }).join('');
};
window.examOpen=function(i){
  var x=_past&&_past[i]; if(!x) return; var sel=$('exCourse');
  if(![].some.call(sel.options,function(o){ return o.value===x.course; })){ var o=document.createElement('option'); o.value=x.course; o.textContent=x.course; sel.appendChild(o); }
  sel.value=x.course; $('exDate').value=x.date; examLoad(); window.scrollTo({top:0,behavior:'smooth'});
};
window.examDel=async function(i){
  var x=_past&&_past[i]; if(!x) return;
  if(!confirm('Delete the exam session for '+x.course+' on '+x.date+' ('+x.count+' present)? This cannot be undone.')) return;
  var j=await teamApi({action:'exam_delete',course:x.course,date:x.date});
  if(!j||!j.ok){ alert((j&&j.error)||'Could not delete'); return; }
  _pastOpen=false; examPast();
};

/* ---------- printable signed sheet ---------- */
window.examPrint=function(){
  if(!S.ready){ alert('Pick the course and date first.'); return; }
  var st=document.getElementById('exPrintCss'); if(!st){ st=document.createElement('style'); st.id='exPrintCss'; st.textContent='#exPrintArea{display:none}@media print{body.exPrinting>*:not(#exPrintArea){display:none!important}body.exPrinting #exPrintArea{display:block!important;position:static!important}}'; document.head.appendChild(st); }
  var a=document.getElementById('exPrintArea'); if(a) a.remove(); a=document.createElement('div'); a.id='exPrintArea';
  var n=0, pres=0, rows=S.roster.map(function(s){ var k=key(s.indexNumber), t=S.present[k]; if(t) pres++; return '<tr><td>'+(++n)+'</td><td>'+escapeHtml(s.indexNumber)+'</td><td>'+escapeHtml(s.name||'')+'</td><td>'+(t?'Present '+hhmm(t)+((S.room&&S.room[k])?' ('+escapeHtml(S.room[k].replace(/-/g,' '))+')':''):'ABSENT')+'</td></tr>'; }).join('');
  var ex=extras(); ex.forEach(function(k){ rows+='<tr><td>'+(++n)+'</td><td>'+escapeHtml(k)+'</td><td><i>Extra candidate</i></td><td>Present '+hhmm(S.present[k])+'</td><td></td></tr>'; });
  var who=''; try{ who=currentUserName||currentUserEmail||''; }catch(e){}
  a.innerHTML='<div style="font-family:sans-serif;color:#000;padding:8px"><h2 style="margin:0 0 4px">Exam Attendance Sheet</h2><div style="margin-bottom:10px;font-size:14px"><b>'+escapeHtml(S.course)+'</b><br>Date: '+escapeHtml(S.date)+' &nbsp; Present: '+pres+' of '+S.roster.length+(ex.length?' (+'+ex.length+' extra)':'')+'<br>Invigilator: '+escapeHtml(who)+'</div>'
   +'<table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:#eee">'+['No.','Index number','Name','Status'].map(function(h){ return '<th style="border:1px solid #444;padding:5px;text-align:left">'+h+'</th>'; }).join('')+'</tr></thead><tbody>'+rows.replace(/<td>/g,'<td style="border:1px solid #444;padding:5px;height:22px">')+'</tbody></table>'
   +'<div style="margin-top:34px;display:flex;justify-content:space-between;font-size:13px"><div>Invigilator: ______________________</div><div>Date: ______________</div></div></div>';
  document.body.appendChild(a); document.body.classList.add('exPrinting');
  var done=function(){ document.body.classList.remove('exPrinting'); window.removeEventListener('afterprint',done); };
  window.addEventListener('afterprint',done); setTimeout(function(){ window.print(); },100);
};

/* ---------- exam attendance inside Summary & Export ---------- */
async function exSummaryLoad(){
  var box=document.getElementById('exSummary'), sel=document.getElementById('attendanceSummaryCourseSelect'); if(!box||!sel) return;
  var course=sel.value; if(!course){ box.innerHTML=''; return; }
  var base; try{ base=lmBase(course); }catch(e){ base=course; }
  var j=await teamApi({action:'exam_sessions'});
  if(!j||!j.ok){ box.innerHTML=''; return; }
  var mine=(j.sessions||[]).filter(function(x){ try{ return lmBase(x.course)===base || x.course===course; }catch(e){ return x.course===course; } }).sort(function(a,b){ return a.date<b.date?-1:1; });
  if(!mine.length){ box.innerHTML=''; return; }
  var lists=await Promise.all(mine.map(function(x){ return teamApi({action:'exam_list',course:x.course,date:x.date}); }));
  var data=null; try{ data=await fetchSupabaseData(); }catch(e){}
  var seen={}, roster=[]; var names=(typeof GROUPS!=='undefined'&&GROUPS[base])||[course]; names.forEach(function(n){ ((data&&data.rosters&&data.rosters[n])||[]).forEach(function(s){ var k=key(s.indexNumber); if(k&&!seen[k]){ seen[k]=1; roster.push(s); } }); });
  var sets=lists.map(function(l){ var m={}; ((l&&l.items)||[]).forEach(function(it){ m[key(it.idx)]=1; }); return m; });
  var h='<div style="margin-bottom:16px;border:1px solid var(--line);border-radius:14px;padding:14px"><div style="font-weight:700;margin-bottom:8px">Exam attendance</div><div style="overflow:auto"><table style="border-collapse:collapse;font-size:.8rem;width:100%"><thead><tr><th style="text-align:left;padding:4px 8px">Student</th>'+mine.map(function(x){ return '<th style="padding:4px 8px;white-space:nowrap">'+escapeHtml(x.date)+'</th>'; }).join('')+'</tr></thead><tbody>'
   +roster.map(function(s){ var k=key(s.indexNumber); return '<tr><td style="padding:4px 8px;border-top:1px solid var(--line)">'+escapeHtml(s.name||s.indexNumber)+'<small style="display:block;color:var(--muted)">'+escapeHtml(s.indexNumber)+'</small></td>'+sets.map(function(m){ return '<td style="padding:4px 8px;text-align:center;border-top:1px solid var(--line);color:'+(m[k]?'#15803d':'#b91c1c')+';font-weight:700">'+(m[k]?'&#10003;':'&ndash;')+'</td>'; }).join('')+'</tr>'; }).join('')
   +'</tbody></table></div><div style="font-size:.76rem;color:var(--muted);margin-top:6px">Kept separate from lecture attendance percentages.</div></div>';
  box.innerHTML=h;
}
try{ var _ls=window.loadAttendanceSummary; if(typeof _ls==='function'){ window.loadAttendanceSummary=function(){ var r=_ls.apply(this,arguments); try{ exSummaryLoad(); }catch(e){} return r; }; } }catch(e){}

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
  if(!s){ beep(false); if(S.present[key(idx)]){ beep(false); show('warn','<div style="font-size:1.1rem">'+escapeHtml(idx)+'</div>Extra candidate, already added'); return; } show('bad','<div style="font-size:1.1rem">'+escapeHtml(idx)+'</div>Not on this class list<br><button type="button" onclick="examExtra(\''+escapeHtml(idx)+'\')" style="margin-top:8px;background:#fff;color:#8a1f15;border:0;border-radius:999px;padding:8px 16px;font-weight:700">Add as extra candidate</button>'); return; }
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
