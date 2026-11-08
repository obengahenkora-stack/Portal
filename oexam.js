/* ===== Online Exams (staff): create exams, build questions, set time and camera-snapshot rules ===== */
(function(){
function $(i){ return document.getElementById(i); }
function esc(t){ return String(t==null?'':t).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function uid(){ return 'q'+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function pad(n){ return ('0'+n).slice(-2); }
function toLocal(iso){ var d=new Date(iso); if(isNaN(d)) return ''; return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes()); }
function fmt(iso){ try{ return new Date(iso).toLocaleString([], {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}); }catch(e){ return iso; } }
var css=document.createElement('style');
css.textContent='#onlineExamCard,#onlineExamCard *{font-family:inherit}'
+'#onlineExamCard .oe-l{font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:0 0 5px}'
+'#onlineExamCard .oe-f{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;margin:14px 0}'
+'#onlineExamCard input:not([type=checkbox]):not([type=radio]),#onlineExamCard select,#onlineExamCard textarea{width:100% !important;max-width:100% !important;box-sizing:border-box !important;min-width:0;margin:0 !important}'
+'#onlineExamCard textarea{min-height:76px}'
+'#onlineExamCard .oe-two{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px}#onlineExamCard .oe-two>div{min-width:0}'
+'#onlineExamCard .oe-box,#onlineExamCard .oe-q,#onlineExamCard .oe-card{box-sizing:border-box;max-width:100%}#onlineExamCard .oe-box{border:1px solid var(--line);border-radius:16px;padding:14px;background:var(--card);margin-top:12px}'
+'#onlineExamCard .oe-h{font-weight:700;margin:0 0 4px}'
+'#onlineExamCard .oe-sub{font-size:.78rem;color:var(--muted);margin:0 0 10px}'
+'#onlineExamCard .oe-sw{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px dashed var(--line);font-size:.88rem}'
+'#onlineExamCard .oe-sw:first-of-type{border-top:0}'
+'#onlineExamCard .oe-sw small{display:block;color:var(--muted);font-size:.74rem}'
+'#onlineExamCard .oe-tg:not(#z){flex:0 0 48px;width:48px !important;height:28px;padding:0 !important;border-radius:999px !important;background:rgba(127,127,127,.35) !important;border:0 !important;box-shadow:none !important;position:relative}'
+'#onlineExamCard .oe-tg i{position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:left .2s}'
+'#onlineExamCard .oe-tg.on:not(#z){background:#16a34a !important}#onlineExamCard .oe-tg.on i{left:23px}'
+'#onlineExamCard .oe-q{border:1px solid var(--line);border-radius:16px;padding:14px;margin-top:12px;background:var(--card)}'
+'#onlineExamCard .oe-qt{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}'
+'#onlineExamCard .oe-n{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#0ea5e9,#0d9488);color:#fff;font-weight:800;font-size:.8rem;display:flex;align-items:center;justify-content:center}'
+'#onlineExamCard .oe-opt{display:flex;align-items:center;gap:8px;margin-top:8px}'
+'#onlineExamCard .oe-opt input[type=radio]{width:20px !important;height:20px;flex:0 0 20px;margin:0 !important;accent-color:#16a34a}'
+'#onlineExamCard .oe-mini:not(#z){width:auto !important;padding:6px 11px !important;font-size:.76rem !important;border-radius:999px !important;background:var(--card) !important;color:var(--ink) !important;border:1px solid var(--line) !important;box-shadow:none !important;font-weight:700 !important;letter-spacing:0 !important;text-transform:none !important;white-space:nowrap}'
+'#onlineExamCard .oe-mini.x:not(#z){color:#dc2626 !important}'
+'#onlineExamCard .oe-btn:not(#z){width:100% !important;padding:12px !important;border-radius:14px !important;font-weight:700 !important;font-size:.9rem !important;text-transform:none !important;letter-spacing:0 !important}'
+'#onlineExamCard .oe-btn.s:not(#z){background:var(--card) !important;color:var(--ink) !important;border:1px solid var(--line) !important;box-shadow:none !important}'
+'#onlineExamCard .oe-row{display:flex;gap:8px;margin-top:12px}#onlineExamCard .oe-row>*{flex:1 1 0}'
+'#onlineExamCard .oe-card{border:1px solid var(--line);border-left:4px solid #d97706;border-radius:16px;padding:14px;margin-top:10px;background:var(--card)}'
+'#onlineExamCard .oe-card.pub{border-left-color:#16a34a}'
+'#onlineExamCard .oe-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}'
+'#onlineExamCard .oe-nm{font-weight:700;line-height:1.25;overflow-wrap:anywhere}'
+'#onlineExamCard .oe-st{flex:0 0 auto;padding:3px 10px;border-radius:999px;font-size:.72rem;font-weight:700;background:rgba(217,119,6,.15);color:#b45309}'
+'#onlineExamCard .oe-st.pub{background:rgba(22,163,74,.15);color:#15803d}'
+'#onlineExamCard .oe-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}'
+'#onlineExamCard .oe-chip{padding:3px 10px;border-radius:999px;font-size:.73rem;font-weight:700;background:rgba(14,165,233,.12);color:#0369a1}'
+'#onlineExamCard .oe-chip.g{background:rgba(127,127,127,.16);color:var(--ink)}'
+'#onlineExamCard .oe-sum{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}'
+'#onlineExamCard .oe-sum div{border:1px solid var(--line);border-radius:12px;padding:10px;text-align:center;background:var(--card)}'
+'#onlineExamCard .oe-sum b{display:block;font-size:1.2rem}#onlineExamCard .oe-sum span{font-size:.68rem;color:var(--muted);font-weight:600}';
document.head.appendChild(css);

var LIST=[], E=null, COURSES=[];
function msg(h){ var m=$('oeMsg'); if(m) m.innerHTML=h||''; }

window.oeInit=async function(){
  var box=$('oeBody'); if(!box) return;
  box.innerHTML='<div class="empty">Loading...</div>';
  try{
    var d=null; try{ d=await fetchSupabaseData(); }catch(e){}
    var names=[]; try{ names=visibleCourses(Object.keys((d&&d.rosters)||{})); }catch(e){}
    var seen={}; COURSES=[]; names.forEach(function(n){ var b=lmBase(n); if(!seen[b.toLowerCase()]){ seen[b.toLowerCase()]=1; COURSES.push(b); } }); COURSES.sort();
    var j=await teamApi({action:'oe_list'}); if(!j||!j.ok) throw new Error((j&&j.error)||'Back end not updated yet (deploy step 39)');
    LIST=j.exams||[]; E=null; renderList();
  }catch(e){ box.innerHTML='<div class="empty">Could not load ('+esc(e.message||'error')+')</div>'; }
};

function renderList(){
  var box=$('oeBody'); msg('');
  var h='<button type="button" class="oe-btn" onclick="oeNew()" style="margin-top:12px">+ Create an exam</button>';
  if(!LIST.length) h+='<div class="empty" style="margin-top:14px">No online exams yet.</div>';
  h+=LIST.map(function(x,i){
    var pub=x.status==='published', n=(x.questions||[]).length, marks=(x.questions||[]).reduce(function(t,q){ return t+(q.marks||0); },0);
    return '<div class="oe-card'+(pub?' pub':'')+'"><div class="oe-top"><div><div class="oe-nm">'+esc(x.title)+'</div><div style="font-size:.78rem;color:var(--muted);margin-top:2px">'+esc(x.course)+'</div></div><span class="oe-st'+(pub?' pub':'')+'">'+(pub?'Published':'Draft')+'</span></div>'
      +'<div class="oe-chips"><span class="oe-chip">'+esc(fmt(x.start))+' to '+esc(fmt(x.end))+'</span><span class="oe-chip g">'+x.durationMin+' min</span><span class="oe-chip g">'+n+' question'+(n===1?'':'s')+' &middot; '+marks+' marks</span><span class="oe-chip g">Photo every '+x.snapEverySec+'s</span></div>'
      +'<div class="oe-row"><button type="button" class="oe-mini" onclick="oeEdit('+i+')">Edit</button><button type="button" class="oe-mini" onclick="oeCopy('+i+')">Duplicate</button><button type="button" class="oe-mini x" onclick="oeDel('+i+')">Delete</button></div></div>';
  }).join('');
  box.innerHTML=h;
}

window.oeNew=function(){
  var s=new Date(); s.setDate(s.getDate()+1); s.setHours(9,0,0,0); var e=new Date(s.getTime()+2*3600*1000);
  E={id:'',course:COURSES[0]||'',title:'',instructions:'',start:s.toISOString(),end:e.toISOString(),durationMin:30,pickN:0,shuffleQ:true,shuffleOpt:true,oneWay:false,snapEverySec:30,maxLeaves:3,code:'',status:'draft',questions:[]};
  addQ('mcq'); renderEdit();
};
window.oeEdit=function(i){ E=JSON.parse(JSON.stringify(LIST[i])); renderEdit(); };
window.oeCopy=function(i){ E=JSON.parse(JSON.stringify(LIST[i])); E.id=''; E.title=E.title+' (copy)'; E.status='draft'; E.questions.forEach(function(q){ q.id=uid(); }); renderEdit(); };
window.oeDel=async function(i){
  var x=LIST[i]; if(!x||!confirm('Delete "'+x.title+'"?\n\nThis removes the exam and its questions. This cannot be undone.')) return;
  try{ var r=await teamApi({action:'oe_delete',id:x.id}); if(!r||!r.ok) throw new Error((r&&r.error)||'Failed'); oeInit(); }catch(e){ msg('<div class="msg err">'+esc(e.message||'error')+'</div>'); }
};
function addQ(type){ E.questions.push(type==='text'?{id:uid(),type:'text',text:'',marks:5,guide:''}:{id:uid(),type:'mcq',text:'',options:['','','',''],answer:0,marks:1}); }
window.oeAddQ=function(t){ sync(); addQ(t); renderEdit(true); };
window.oeRemQ=function(i){ sync(); if(!confirm('Remove question '+(i+1)+'?')) return; E.questions.splice(i,1); renderEdit(); };
window.oeMove=function(i,d){ sync(); var j=i+d; if(j<0||j>=E.questions.length) return; var t=E.questions[i]; E.questions[i]=E.questions[j]; E.questions[j]=t; renderEdit(); };
window.oeAddOpt=function(i){ sync(); var q=E.questions[i]; if(q.options.length<6){ q.options.push(''); renderEdit(); } };
window.oeRemOpt=function(i,k){ sync(); var q=E.questions[i]; if(q.options.length>2){ q.options.splice(k,1); if(q.answer>=q.options.length) q.answer=0; else if(q.answer>k) q.answer--; renderEdit(); } };
window.oeTog=function(k){ sync(); E[k]=!E[k]; renderEdit(); };
window.oeType=function(i,t){ sync(); var q=E.questions[i]; if(t==='text'){ q.type='text'; q.guide=q.guide||''; } else { q.type='mcq'; q.options=q.options&&q.options.length?q.options:['','','','']; q.answer=q.answer||0; } renderEdit(); };

/* copy what is typed in the form back into E */
function sync(){
  if(!E||!$('oeTitle')) return;
  E.course=$('oeCourse').value; E.title=$('oeTitle').value; E.instructions=$('oeIns').value;
  var s=$('oeStart').value, e=$('oeEnd').value; if(s) E.start=new Date(s).toISOString(); if(e) E.end=new Date(e).toISOString();
  E.durationMin=parseInt($('oeDur').value,10)||30; E.snapEverySec=parseInt($('oeSnap').value,10)||30; E.maxLeaves=parseInt($('oeLeaves').value,10); if(!(E.maxLeaves>=0)) E.maxLeaves=3;
  E.pickN=parseInt($('oePick').value,10)||0; E.code=$('oeCode').value;
  E.questions.forEach(function(q,i){
    var t=$('oeQt'+i); if(!t) return; q.text=t.value; q.marks=parseFloat($('oeQm'+i).value); if(!(q.marks>=0)) q.marks=1;
    if(q.type==='mcq'){ q.options=[].slice.call(document.querySelectorAll('.oeQo'+i)).map(function(o){ return o.value; }); var r=document.querySelector('input[name=oeA'+i+']:checked'); if(r) q.answer=parseInt(r.value,10); }
    else { var g=$('oeQg'+i); if(g) q.guide=g.value; }
  });
}
function sw(k,label,sub){ return '<div class="oe-sw"><div><b style="font-size:.88rem">'+label+'</b><small>'+sub+'</small></div><button type="button" class="oe-tg'+(E[k]?' on':'')+'" role="switch" aria-checked="'+(E[k]?'true':'false')+'" onclick="oeTog(\''+k+'\')"><i></i></button></div>'; }

function renderEdit(scrollEnd){
  var box=$('oeBody'); msg('');
  var marks=E.questions.reduce(function(t,q){ return t+(parseFloat(q.marks)||0); },0);
  var h='<div class="oe-f"><div><div class="oe-l">Course</div><select id="oeCourse">'+(COURSES.indexOf(E.course)<0&&E.course?'<option>'+esc(E.course)+'</option>':'')+COURSES.map(function(c){ return '<option'+(c===E.course?' selected':'')+'>'+esc(c)+'</option>'; }).join('')+'</select></div>'
   +'<div><div class="oe-l">Exam title</div><input type="text" id="oeTitle" value="'+esc(E.title)+'" placeholder="e.g. Mid-semester Exam"></div>'
   +'<div><div class="oe-l">Instructions for students</div><textarea id="oeIns" placeholder="Shown before the exam starts">'+esc(E.instructions)+'</textarea></div>'
   +'<div class="oe-two"><div><div class="oe-l">Opens</div><input type="datetime-local" id="oeStart" value="'+toLocal(E.start)+'"></div><div><div class="oe-l">Closes</div><input type="datetime-local" id="oeEnd" value="'+toLocal(E.end)+'"></div></div>'
   +'<div class="oe-two"><div><div class="oe-l">Time allowed (minutes)</div><input type="number" id="oeDur" min="1" max="300" value="'+E.durationMin+'"></div><div><div class="oe-l">Questions per student</div><input type="number" id="oePick" min="0" value="'+(E.pickN||0)+'" placeholder="0 = all"></div></div></div>'
   +'<div class="oe-box"><div class="oe-h">Security</div><div class="oe-sub">The camera is always required. Photos are shrunk to about 15 KB each.</div>'
   +'<div class="oe-two"><div><div class="oe-l">Photo every (seconds)</div><input type="number" id="oeSnap" min="10" max="300" value="'+E.snapEverySec+'"></div><div><div class="oe-l">Page leaves allowed</div><input type="number" id="oeLeaves" min="0" max="50" value="'+E.maxLeaves+'"></div></div>'
   +'<div style="margin-top:12px"><div class="oe-l">Exam code (optional)</div><input type="text" id="oeCode" value="'+esc(E.code)+'" placeholder="Students must type this to start"></div>'
   +sw('shuffleQ','Shuffle questions','Each student sees a different order.')+sw('shuffleOpt','Shuffle answer options','Options are mixed for every student.')+sw('oneWay','One question at a time, no going back','Harder to look things up.')+'</div>'
   +'<div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:18px"><div class="oe-h" style="font-size:1.05rem">Questions</div><div style="font-size:.8rem;color:var(--muted)">'+E.questions.length+' &middot; '+marks+' marks</div></div>';
  h+=E.questions.map(function(q,i){
    var body='<textarea id="oeQt'+i+'" placeholder="Type the question">'+esc(q.text)+'</textarea>';
    if(q.type==='mcq'){
      body+='<div class="oe-l" style="margin-top:10px">Options (tick the correct one)</div>'+q.options.map(function(o,k){ return '<div class="oe-opt"><input type="radio" name="oeA'+i+'" value="'+k+'"'+(q.answer===k?' checked':'')+'><input type="text" class="oeQo'+i+'" value="'+esc(o)+'" placeholder="Option '+String.fromCharCode(65+k)+'">'+(q.options.length>2?'<button type="button" class="oe-mini x" onclick="oeRemOpt('+i+','+k+')">&times;</button>':'')+'</div>'; }).join('')
        +(q.options.length<6?'<button type="button" class="oe-mini" style="margin-top:8px" onclick="oeAddOpt('+i+')">+ Add option</button>':'');
    } else body+='<div class="oe-l" style="margin-top:10px">Marking guide (only you see this)</div><textarea id="oeQg'+i+'" placeholder="What a good answer includes">'+esc(q.guide||'')+'</textarea>';
    return '<div class="oe-q"><div class="oe-qt"><div style="display:flex;align-items:center;gap:8px"><span class="oe-n">'+(i+1)+'</span><select style="width:auto !important" onchange="oeType('+i+',this.value)"><option value="mcq"'+(q.type==='mcq'?' selected':'')+'>Multiple choice</option><option value="text"'+(q.type==='text'?' selected':'')+'>Written answer</option></select></div>'
      +'<div style="display:flex;gap:6px"><button type="button" class="oe-mini" onclick="oeMove('+i+',-1)">&uarr;</button><button type="button" class="oe-mini" onclick="oeMove('+i+',1)">&darr;</button><button type="button" class="oe-mini x" onclick="oeRemQ('+i+')">Remove</button></div></div>'
      +body+'<div style="margin-top:10px;max-width:140px"><div class="oe-l">Marks</div><input type="number" id="oeQm'+i+'" min="0" step="0.5" value="'+(q.marks==null?1:q.marks)+'"></div></div>';
  }).join('');
  h+='<div class="oe-row"><button type="button" class="oe-btn s" onclick="oeAddQ(\'mcq\')">+ Multiple choice</button><button type="button" class="oe-btn s" onclick="oeAddQ(\'text\')">+ Written answer</button></div>'
    +'<div class="oe-row" style="margin-top:18px"><button type="button" class="oe-btn s" onclick="oeSave(false)">Save draft</button><button type="button" class="oe-btn" onclick="oeSave(true)">Publish</button></div>'
    +'<button type="button" class="oe-btn s" style="margin-top:10px" onclick="oeInit()">Close without saving</button>';
  box.innerHTML=h;
  if(scrollEnd){ try{ var qs=box.querySelectorAll('.oe-q'); qs[qs.length-1].scrollIntoView({behavior:'smooth',block:'center'}); }catch(e){} }
}

window.oeSave=async function(publish){
  sync();
  if(!E.title.trim()){ msg('<div class="msg err">Give the exam a title.</div>'); return; }
  if(!E.course){ msg('<div class="msg err">Choose the course.</div>'); return; }
  if(new Date(E.end)<=new Date(E.start)){ msg('<div class="msg err">The closing time must be after the opening time.</div>'); return; }
  for(var i=0;i<E.questions.length;i++){ var q=E.questions[i];
    if(!q.text.trim()){ msg('<div class="msg err">Question '+(i+1)+' is empty.</div>'); return; }
    if(q.type==='mcq' && q.options.filter(function(o){ return o.trim(); }).length<2){ msg('<div class="msg err">Question '+(i+1)+' needs at least two options.</div>'); return; }
  }
  if(publish && !E.questions.length){ msg('<div class="msg err">Add at least one question before publishing.</div>'); return; }
  if(publish && !confirm('Publish "'+E.title+'"?\n\nStudents on '+E.course+' will see it from '+fmt(E.start)+'.')) return;
  /* drop blank options but keep the correct answer pointing at the right one */
  var ex=JSON.parse(JSON.stringify(E)); ex.status=publish?'published':'draft';
  ex.questions.forEach(function(q){ if(q.type==='mcq'){ var keep=[], na=0; q.options.forEach(function(o,k){ if(o.trim()){ if(k===q.answer) na=keep.length; keep.push(o.trim()); } }); q.options=keep; q.answer=na; } });
  msg('<div class="msg ok">Saving...</div>');
  try{ var r=await teamApi({action:'oe_save',exam:ex}); if(!r||!r.ok) throw new Error((r&&r.error)||'Could not save'); await oeInit(); msg('<div class="msg ok">'+(publish?'Published.':'Saved as a draft.')+'</div>'); }
  catch(e){ msg('<div class="msg err">'+esc(e.message||'error')+'</div>'); }
};
})();
