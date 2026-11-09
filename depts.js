/* Departments list: editable by the owner, used by every department dropdown. */
(function(){
var IDS=['deptGateSelect','linkDeptInput','profileDeptInput','adminRegisteredDeptFilter'], KEY='ceDepts', LIST=['Civil Engineering','Environmental Engineering'];
try{ var c=JSON.parse(localStorage.getItem(KEY)||'null'); if(Array.isArray(c)&&c.length) LIST=c; }catch(e){}
window.ceDepts=function(){return LIST.slice();};
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function apply(){
  IDS.forEach(function(id){ var sel=document.getElementById(id); if(!sel) return; var cur=sel.value, keep=[], tail=[];
    [].slice.call(sel.options).forEach(function(o){ if(o.value===''||/^select|^choose/i.test(o.text)||/^all /i.test(o.text)) keep.push(o); else if(o.value==='missing') tail.push(o); });
    sel.innerHTML=''; keep.forEach(function(o){sel.appendChild(o);});
    LIST.forEach(function(d){ var o=document.createElement('option'); o.value=d; o.textContent=d; sel.appendChild(o); });
    tail.forEach(function(o){sel.appendChild(o);});
    if(cur && (LIST.indexOf(cur)>=0||cur==='missing')) sel.value=cur; });
  draw();
}
async function load(){
  try{ var r=await fetch(SUPABASE_URL+'/functions/v1/api',{method:'POST',headers:{'Content-Type':'application/json',apikey:SUPABASE_KEY},body:JSON.stringify({action:'dept_list'})}); var j=await r.json();
    if(j&&j.ok&&Array.isArray(j.list)&&j.list.length){ LIST=j.list; try{ localStorage.setItem(KEY,JSON.stringify(LIST)); }catch(e){} apply(); } }catch(e){}
}
function panel(){
  if(document.getElementById('deptPanel')) return document.getElementById('deptPanel');
  var anchor=document.querySelector('button[onclick="openIndexCheck()"]'); if(!anchor) return null;
  var b=document.createElement('button'); b.className='adm-chip'; b.type='button'; b.textContent='Departments'; b.onclick=function(){ var p=document.getElementById('deptPanel'); p.style.display=p.style.display==='none'?'block':'none'; draw(); };
  anchor.parentNode.insertBefore(b,anchor.nextSibling);
  var p=document.createElement('div'); p.id='deptPanel'; p.style.cssText='display:none;border:1px solid var(--line);border-radius:14px;padding:12px;margin:10px 0;background:var(--card)';
  anchor.parentNode.parentNode.insertBefore(p,anchor.parentNode.nextSibling); return p;
}
function draw(){
  var p=panel(); if(!p) return;
  p.innerHTML='<div style="font-weight:700;margin-bottom:8px">Departments</div><div style="font-size:.78rem;color:var(--muted);margin-bottom:8px">These appear in every department list. Removing one does not change students already set to it.</div>'
  +LIST.map(function(d,i){return '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-top:1px dashed var(--line)"><span style="overflow-wrap:anywhere">'+esc(d)+'</span><button type="button" class="adm-chip" style="color:#dc2626" onclick="ceDeptRemove('+i+')">Remove</button></div>';}).join('')
  +'<div style="display:flex;gap:8px;margin-top:10px"><input id="deptNew" placeholder="New department name" style="flex:1;min-width:0"><button type="button" class="adm-chip" onclick="ceDeptAdd()">Add</button></div><div id="deptMsg" style="margin-top:8px"></div>';
}
async function save(list){
  var m=document.getElementById('deptMsg'); if(m) m.innerHTML='<div class="msg ok">Saving...</div>';
  try{ var j=await _stu({action:'stu_dept_set',list:list}); if(!j||!j.ok) throw new Error((j&&j.error)||'Failed'); LIST=j.list; try{ localStorage.setItem(KEY,JSON.stringify(LIST)); }catch(e){} apply(); var m2=document.getElementById('deptMsg'); if(m2) m2.innerHTML='<div class="msg ok">Saved.</div>'; }
  catch(e){ if(m) m.innerHTML='<div class="msg err">'+esc(e.message||'error')+'</div>'; }
}
window.ceDeptAdd=function(){ var v=(document.getElementById('deptNew').value||'').trim(); if(!v) return; save(LIST.concat([v])); };
window.ceDeptRemove=function(i){ if(LIST.length<2){ alert('Keep at least one department.'); return; } if(!confirm('Remove "'+LIST[i]+'" from the lists?')) return; save(LIST.filter(function(_,k){return k!==i;})); };
function boot(){ apply(); load(); setInterval(function(){ if(document.getElementById('adminRegisteredDeptFilter') && !document.getElementById('deptPanel')) { panel(); draw(); } },1500); }
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
