/* ===== Assignments (staff): set tasks with deadlines, review hand-ins, mark, release to Gradebook ===== */
(function(){
function $(i){return document.getElementById(i);}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function pad(n){return ('0'+n).slice(-2);}
function toLocal(iso){var d=new Date(iso); if(isNaN(d)) return ''; return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes());}
function fmt(iso){try{return new Date(iso).toLocaleString([], {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});}catch(e){return iso;}}
var css=document.createElement('style');
css.textContent='#assignCard,#assignCard *{font-family:inherit}#assignCard .as-f{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;margin:14px 0}'
+'#assignCard input:not([type=checkbox]),#assignCard select,#assignCard textarea{width:100% !important;max-width:100% !important;box-sizing:border-box !important;margin:0 !important}#assignCard textarea{min-height:90px}'
+'#assignCard .as-l{font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:0 0 5px}'
+'#assignCard .as-card,#assignCard .as-r,#assignCard .as-q{border:1px solid var(--line);border-radius:14px;padding:12px;margin-top:10px;background:var(--card);box-sizing:border-box;max-width:100%}'
+'#assignCard .as-card{border-left:4px solid #d97706}#assignCard .as-card.pub{border-left-color:#16a34a}#assignCard .as-r{cursor:pointer}'
+'#assignCard .as-nm{font-weight:700;overflow-wrap:anywhere}#assignCard .as-s{font-size:.76rem;color:var(--muted);margin-top:3px}'
+'#assignCard .as-row{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}'
+'#assignCard .as-mini:not(#z){width:auto !important;padding:6px 12px !important;font-size:.76rem !important;border-radius:999px !important;background:var(--card) !important;color:var(--ink) !important;border:1px solid var(--line) !important;box-shadow:none !important;font-weight:700 !important;letter-spacing:0 !important;text-transform:none !important}#assignCard .as-mini.x:not(#z){color:#dc2626 !important}'
+'#assignCard .as-btn:not(#z){width:100% !important;padding:12px !important;border-radius:14px !important;font-weight:700 !important;font-size:.9rem !important;text-transform:none !important;letter-spacing:0 !important;margin-top:12px}#assignCard .as-btn.s:not(#z){background:var(--card) !important;color:var(--ink) !important;border:1px solid var(--line) !important;box-shadow:none !important}'
+'#assignCard .as-t{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:12px 0}#assignCard .as-t div{border:1px solid var(--line);border-radius:12px;padding:10px;text-align:center;background:var(--card)}#assignCard .as-t b{display:block;font-size:1.2rem}#assignCard .as-t span{font-size:.7rem;color:var(--muted);font-weight:600}'
+'#assignCard .as-sw{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;font-size:.88rem}#assignCard .as-sw small{display:block;color:var(--muted);font-size:.74rem}'
+'#assignCard .as-tg:not(#z){flex:0 0 48px;width:48px !important;height:28px;padding:0 !important;border-radius:999px !important;background:rgba(127,127,127,.35) !important;border:0 !important;box-shadow:none !important;position:relative}#assignCard .as-tg i{position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:left .2s}#assignCard .as-tg.on:not(#z){background:#16a34a !important}#assignCard .as-tg.on i{left:23px}'
+'#assignCard .as-late{color:#dc2626;font-weight:700}#assignCard img.as-ph{max-width:100%;border-radius:10px;margin-top:8px;cursor:pointer}';
document.head.appendChild(css);
var FILE=null, RMF=false, LIST=[], E=null, COURSES=[], D=null, CUR=null;
function msg(h){var m=$('asMsg'); if(m) m.innerHTML=h||'';}
async function api(o){var r=await teamApi(o); if(!r||!r.ok) throw new Error((r&&r.error)||'Failed'); return r;}
window.asInit=async function(){
  var box=$('asBody'); if(!box) return; box.innerHTML='<div class="empty">Loading...</div>';
  try{
    var d=null; try{ d=await fetchSupabaseData(); }catch(e){}
    var names=[]; try{ names=visibleCourses(Object.keys((d&&d.rosters)||{})); }catch(e){}
    var seen={}; COURSES=[]; names.forEach(function(n){var b=lmBase(n); if(!seen[b.toLowerCase()]){seen[b.toLowerCase()]=1; COURSES.push(b);}}); COURSES.sort();
    var j=await api({action:'as_list'}); LIST=(j.items||[]).sort(function(a,b){return Date.parse(b.due)-Date.parse(a.due);}); E=null; list();
  }catch(e){ box.innerHTML='<div class="empty">Could not load ('+esc(e.message)+')</div>'; }
};
function list(){
  msg(''); var h='<button type="button" class="as-btn" onclick="asNew()">+ Set an assignment</button>';
  if(!LIST.length) h+='<div class="empty" style="margin-top:14px">No assignments yet.</div>';
  h+=LIST.map(function(x,i){var pub=x.status==='published';
    return '<div class="as-card'+(pub?' pub':'')+'"><div class="as-nm">'+esc(x.title)+'</div><div class="as-s">'+esc(x.course)+' &middot; Due '+esc(fmt(x.due))+' &middot; out of '+x.max+' &middot; '+(pub?'Published':'Draft')+(x.att?' &middot; File attached':'')+(x.released?' &middot; Results released':'')+'</div>'
    +'<div class="as-row">'+(pub?'<button type="button" class="as-mini" onclick="asSubs(\''+x.id+'\')">Hand-ins</button>':'')+'<button type="button" class="as-mini" onclick="asEdit('+i+')">Edit</button><button type="button" class="as-mini x" onclick="asDel('+i+')">Delete</button></div></div>';}).join('');
  h+='<div class="as-s" style="margin-top:18px"><span style="text-decoration:underline;cursor:pointer" onclick="asB2Test()">Test file storage (Backblaze)</span></div>';
  $('asBody').innerHTML=h;
}
window.asB2Test=async function(){ msg('<div class="msg ok">Testing...</div>'); try{ var j=await teamApi({action:'b2_test'}); if(!j||!j.ok) throw new Error((j&&j.error)||'Failed'); if(!j.on){ msg('<div class="msg err">'+esc(j.note||'Not set up')+'</div>'); return; } if(j.error){ msg('<div class="msg err">Could not reach Backblaze: '+esc(j.error)+'</div>'); return; } if(j.status>=200&&j.status<300){ msg('<div class="msg ok">Backblaze works. A test file was saved.</div>'); return; } msg('<div class="msg err">Backblaze said '+j.status+': '+esc(String(j.body||'').replace(/<[^>]+>/g,' ').slice(0,300))+' (key ID starts '+esc(j.idStart||'')+', length '+j.idLen+', key length '+j.keyLen+')</div>'); }catch(e){ msg('<div class="msg err">'+esc(e.message)+'</div>'); } };
window.asNew=function(){var d=new Date(); d.setDate(d.getDate()+7); d.setHours(17,0,0,0); E={id:'',course:COURSES[0]||'',title:'',instructions:'',due:d.toISOString(),max:10,allowLate:false,status:'draft'}; edit();};
window.asEdit=function(i){E=JSON.parse(JSON.stringify(LIST[i])); edit();};
function readFile(f,cb){ if(f.size>4194304){ cb(null,'That file is too large (4 MB at most).'); return; } var r=new FileReader(); r.onload=function(){ cb({name:f.name,data:r.result}); }; r.onerror=function(){ cb(null,'Could not read the file.'); }; r.readAsDataURL(f); }
function dl(j){ var a=document.createElement('a'); a.href=j.data; a.download=j.name; document.body.appendChild(a); a.click(); a.remove(); }
function edit(){ FILE=null; RMF=false;
  var opts=COURSES.slice(); if(E.course && opts.indexOf(E.course)<0) opts.unshift(E.course);
  $('asBody').innerHTML='<div class="as-f"><div><div class="as-l">Course</div><select id="asC">'+opts.map(function(c){return '<option'+(c===E.course?' selected':'')+'>'+esc(c)+'</option>';}).join('')+'</select></div>'
  +'<div><div class="as-l">Title</div><input id="asT" value="'+esc(E.title)+'" placeholder="e.g. Assignment 1"></div>'
  +'<div><div class="as-l">Instructions</div><textarea id="asI">'+esc(E.instructions)+'</textarea></div>'
  +'<div><div class="as-l">Deadline</div><input type="datetime-local" id="asD" value="'+esc(toLocal(E.due))+'"></div>'
  +'<div><div class="as-l">Marked out of</div><input type="number" id="asM" min="1" step="0.5" value="'+esc(E.max)+'"></div>'
  +'<div><div class="as-l">Attach a file for students (optional, 4 MB at most)</div>'+(E.att?'<div class="as-s" id="asAtt">Current file: '+esc(E.att.name)+' <span style="text-decoration:underline;cursor:pointer;color:#dc2626" onclick="asRmAtt()">Remove</span></div>':'')+'<input type="file" id="asF" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.jpg,.jpeg,.png"><div class="as-s">PDF, Word, Excel, PowerPoint, text, zip or a photo.</div></div>'
  +'<div class="as-sw"><div>Accept late hand-ins<small>Late work is marked "late" for you to see.</small></div><button type="button" class="as-tg'+(E.allowLate?' on':'')+'" id="asL" onclick="this.classList.toggle(\'on\')"><i></i></button></div></div>'
  +'<button type="button" class="as-btn" onclick="asSave(true)">Publish to students</button><button type="button" class="as-btn s" onclick="asSave(false)">Save as draft</button><button type="button" class="as-btn s" onclick="asInit()">Cancel</button>';
}
window.asRmAtt=function(){ RMF=true; var a=$('asAtt'); if(a) a.innerHTML='File will be removed when you save.'; };
window.asSave=async function(pub){
  var fi=$('asF'); FILE=null;
  if(fi&&fi.files&&fi.files[0]){ var done=false, err=''; await new Promise(function(res){ readFile(fi.files[0],function(f,e){ FILE=f; err=e||''; res(); }); }); if(!FILE){ msg('<div class="msg err">'+esc(err||'Could not read the file.')+'</div>'); return; } }
  var x={id:E.id,course:$('asC').value,title:$('asT').value,instructions:$('asI').value,due:$('asD').value?new Date($('asD').value).toISOString():'',max:Number($('asM').value),allowLate:$('asL').classList.contains('on'),status:pub?'published':'draft'}; if(FILE) x.file=FILE; if(RMF) x.removeFile=true;
  try{ await api({action:'as_save',assignment:x}); await asInit(); msg('<div class="msg ok">'+(pub?'Published.':'Saved as a draft.')+'</div>'); }catch(e){ msg('<div class="msg err">'+esc(e.message)+'</div>'); }
};
window.asDel=async function(i){var x=LIST[i]; if(!x||!confirm('Delete "'+x.title+'" and all hand-ins?\n\nThis cannot be undone.')) return; try{ await api({action:'as_delete',id:x.id}); asInit(); }catch(e){ msg('<div class="msg err">'+esc(e.message)+'</div>'); }};
async function gbSync(add){
  var a=D.assignment, key=function(r){return [(r.indexNumber||'').toLowerCase(),(r.course||'').toLowerCase(),(r.assessmentName||'').toLowerCase()].join('|');};
  var recs=D.rows.filter(function(r){return r.grade!=null&&r.index;}).map(function(r){return {indexNumber:r.index,score:String(r.grade),assessmentName:a.title,course:a.course,level:''};});
  var drop=new Set(recs.map(key)); var existing=await fetchAllRecords(); var keep=existing.filter(function(r){return !drop.has(key(r));});
  await saveAllRecords(add?keep.concat(recs):keep, add?{name:a.title,max:a.max,courses:[lmBase(a.course)]}:null); return recs.length;
}
window.asSubs=async function(id){
  var box=$('asBody'); box.innerHTML='<div class="empty">Loading...</div>';
  try{ D=await api({action:'as_subs',id:id}); }catch(e){ box.innerHTML='<div class="empty">Could not load ('+esc(e.message)+')</div><button type="button" class="as-btn s" onclick="asInit()">Back</button>'; return; }
  var a=D.assignment, rows=D.rows, graded=rows.filter(function(r){return r.grade!=null;}), avg=graded.length?graded.reduce(function(t,r){return t+r.grade;},0)/graded.length:0, late=rows.filter(function(r){return r.late;}).length;
  var h='<button type="button" class="as-mini" onclick="asInit()">&larr; Back</button><div class="as-nm" style="margin-top:12px">'+esc(a.title)+'</div><div class="as-s">'+esc(a.course)+' &middot; Due '+esc(fmt(a.due))+' &middot; out of '+a.max+'</div>'
  +'<div class="as-t"><div><b>'+rows.length+' / '+(rows.length+D.missing.length)+'</b><span>Handed in</span></div><div><b>'+late+'</b><span>Late</span></div><div><b>'+(rows.length-graded.length)+'</b><span>Not marked</span></div><div><b>'+avg.toFixed(1)+'</b><span>Average mark</span></div></div>'
  +'<div class="as-sw"><div>Release marks to students<small>They see mark and comment, and it goes into the Gradebook.</small></div><button type="button" class="as-tg'+(a.released?' on':'')+'" onclick="asRelease('+(a.released?'false':'true')+')"><i></i></button></div>'
  +'<div class="as-row"><button type="button" class="as-mini" onclick="asCsv()">Download marks</button><button type="button" class="as-mini x" onclick="asPurge()">Delete files</button></div>';
  rows.sort(function(x,y){return String(x.name).localeCompare(String(y.name));});
  h+=rows.map(function(r,i){return '<div class="as-r" onclick="asOpen('+i+')"><div class="as-nm">'+esc(r.name||r.email)+' <span style="font-weight:400;color:var(--muted)">'+esc(r.index||'')+'</span></div><div class="as-s">'+esc(fmt(r.at))+(r.late?' <span class="as-late">LATE</span>':'')+' &middot; '+(r.grade!=null?'Mark '+r.grade+' / '+a.max:'Not marked')+' &middot; '+[r.hasText?'text':'',r.hasLink?'link':'',r.hasPhoto?'file':'',r.photoRemoved?'file deleted':''].filter(Boolean).join(', ')+'</div></div>';}).join('');
  if(D.missing.length) h+='<div class="as-s" style="margin-top:16px">Not handed in ('+D.missing.length+'): '+D.missing.map(function(m){return esc(m.name||m.index);}).join(', ')+'</div>';
  box.innerHTML=h; msg(''); window.scrollTo(0,0);
};
window.asRelease=async function(v){try{ await api({action:'as_release',id:D.assignment.id,released:v}); await asSubs(D.assignment.id); var n=await gbSync(v); msg('<div class="msg ok">'+(v?'Released. '+n+' marks added to the Gradebook as "'+esc(D.assignment.title)+'".':'Hidden and removed from the Gradebook.')+'</div>'); }catch(e){ msg('<div class="msg err">'+esc(e.message)+'</div>'); }};
window.asPurge=async function(){ if(!confirm('Delete ALL student files for this assignment?\n\nThis cannot be undone.')) return; try{ var r=await api({action:'as_purge',id:D.assignment.id}); await asSubs(D.assignment.id); msg('<div class="msg ok">Deleted '+r.removed+' files.</div>'); }catch(e){ msg('<div class="msg err">'+esc(e.message)+'</div>'); } };
window.asCsv=function(){var q=function(v){return '"'+String(v==null?'':v).replace(/"/g,'""')+'"';}; var L=[['Name','Index','Handed in','Late','Mark','Out of'].map(q).join(',')];
  D.rows.forEach(function(r){L.push([r.name,r.index,r.at,r.late?'yes':'',r.grade==null?'':r.grade,D.assignment.max].map(q).join(','));}); D.missing.forEach(function(m){L.push([m.name,m.index,'not handed in','','',D.assignment.max].map(q).join(','));});
  var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob(['﻿'+L.join('\n')],{type:'text/csv'})); a.download=(D.assignment.title||'assignment').replace(/[^\w]+/g,'_')+'_marks.csv'; a.click();};
window.asOpen=async function(i){
  var r=D.rows[i], box=$('asBody'); box.innerHTML='<div class="empty">Loading...</div>';
  try{ var j=await api({action:'as_sub',id:D.assignment.id,email:r.email}); CUR=j.sub; var s=j.sub;
    var linkOk=/^https?:\/\//i.test(s.link);
    box.innerHTML='<button type="button" class="as-mini" onclick="asSubs(\''+D.assignment.id+'\')">&larr; Back to hand-ins</button><div class="as-nm" style="margin-top:12px">'+esc(s.name||s.email)+'</div><div class="as-s">'+esc(s.index||'')+' &middot; Handed in '+esc(fmt(s.at))+(s.late?' <span class="as-late">LATE</span>':'')+'</div>'
    +(s.text?'<div class="as-q"><div class="as-l">Answer</div><div style="white-space:pre-wrap;overflow-wrap:anywhere">'+esc(s.text)+'</div></div>':'')
    +(s.link?'<div class="as-q"><div class="as-l">Link</div>'+(linkOk?'<a href="'+esc(s.link)+'" target="_blank" rel="noopener noreferrer" style="overflow-wrap:anywhere">'+esc(s.link)+'</a>':esc(s.link))+'</div>':'')
    +(s.img?'<div class="as-q"><div class="as-l">Photo</div><img class="as-ph" src="'+s.img+'" onclick="asBig(this.src)"></div>':'')
    +(s.hasFile&&!s.img?'<div class="as-q"><div class="as-l">File</div><div class="as-nm" style="overflow-wrap:anywhere">'+esc(s.fname)+'</div><button type="button" class="as-mini" style="margin-top:8px" onclick="asGetFile(\''+esc(s.email)+'\')">Download</button></div>':'')
    +'<div class="as-q"><div class="as-l">Mark (0 to '+j.max+')</div><input type="number" id="asG" step="0.5" min="0" max="'+j.max+'" value="'+(s.grade==null?'':s.grade)+'"><div class="as-l" style="margin-top:12px">Comment to student (optional)</div><textarea id="asCm">'+esc(s.comment)+'</textarea></div>'
    +'<button type="button" class="as-btn" onclick="asGrade(\''+esc(s.email)+'\')">Save mark</button>'; window.scrollTo(0,0);
  }catch(e){ msg('<div class="msg err">'+esc(e.message)+'</div>'); asSubs(D.assignment.id); }
};
window.asGetFile=async function(em){ try{ var j=await api({action:'as_file',id:D.assignment.id,email:em}); dl(j); }catch(e){ msg('<div class="msg err">'+esc(e.message)+'</div>'); } };
window.asBig=function(src){var d=document.createElement('div'); d.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:99999;display:flex;align-items:center;justify-content:center;padding:14px'; d.onclick=function(){d.remove();}; d.innerHTML='<img src="'+src+'" style="max-width:100%;max-height:100%;border-radius:10px">'; document.body.appendChild(d);};
window.asGrade=async function(em){var v=$('asG').value; try{ await api({action:'as_grade',id:D.assignment.id,email:em,grade:v===''?null:Number(v),comment:$('asCm').value}); await asSubs(D.assignment.id); if(D.assignment.released) await gbSync(true); msg('<div class="msg ok">Mark saved'+(D.assignment.released?' and Gradebook updated':'')+'.</div>'); }catch(e){ msg('<div class="msg err">'+esc(e.message)+'</div>'); }};
try{ var _oi=window.oeInit; if(typeof _oi==='function'){ window.oeInit=function(){ var r=_oi.apply(this,arguments); try{ asInit(); }catch(e){} return r; }; } }catch(e){}
})();
