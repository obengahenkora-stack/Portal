/* ===== Absence excuses: students ask, lecturers approve, and the session is marked Excused ===== */
(function(){
function $(i){ return document.getElementById(i); }
function esc(t){ return String(t==null?'':t).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function key(x){ return String(x||'').toUpperCase().replace(/[^A-Z0-9]/g,''); }
function fd(d){ try{ return new Date(d+'T00:00:00').toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}); }catch(e){ return d; } }
function chip(st){ var c=st==='approved'?'#16a34a':st==='declined'?'#dc2626':'#d97706', l=st==='approved'?'Approved':st==='declined'?'Declined':'Waiting'; return '<span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:.72rem;font-weight:700;color:'+c+';border:1px solid '+c+'">'+l+'</span>'; }
var css=document.createElement('style');
css.textContent='.abs-row{padding:12px 14px;border:1px solid var(--line);border-radius:14px;margin-top:8px;background:var(--card)}'
+'.abs-row small{display:block;color:var(--muted);margin-top:2px}'
+'.abs-f{display:grid;gap:10px;margin:12px 0}'
+'.abs-f select,.abs-f input,.abs-f textarea{width:100% !important;max-width:100% !important;box-sizing:border-box !important}'
+'.abs-f textarea{min-height:90px}'
+'.abs-b{width:auto !important;padding:8px 16px !important;font-size:.82rem !important;border-radius:999px !important;background:var(--card) !important;color:var(--ink) !important;border:1px solid var(--line) !important;box-shadow:none !important;font-weight:700 !important;letter-spacing:0 !important;text-transform:none !important;white-space:nowrap}'
+'.abs-b.ok{color:#16a34a !important;border-color:#16a34a !important}.abs-b.no{color:#dc2626 !important}'
+'.abs-go{width:100% !important;padding:12px !important;border-radius:14px !important;font-weight:700 !important;text-transform:none !important;letter-spacing:0 !important}';
document.head.appendChild(css);

/* ---------- student side (dashboard.html) ---------- */
window.absStuInit=async function(){
  var box=$('absBody'); if(!box) return;
  var courses=[]; try{ courses=(_dlhMine||[]).slice().sort(); }catch(e){}
  var today=new Date().toISOString().slice(0,10);
  box.innerHTML='<div class="abs-f"><select id="absCourse"><option value="">Course you missed...</option>'+courses.map(function(c){ return '<option>'+esc(c)+'</option>'; }).join('')+'</select>'
    +'<input type="date" id="absDate"><textarea id="absReason" maxlength="600" placeholder="Why were you absent? (e.g. sick, family emergency, official duty)"></textarea>'
    +'<div><div style="font-size:.78rem;color:var(--muted);margin-bottom:4px">Proof (optional): photo of a medical note or letter</div><input type="file" id="absFile" accept="image/*"></div>'
    +'<button type="button" class="abs-go" onclick="absSend()">Send request</button><div id="absMsg"></div></div><div id="absList"><div class="empty">Loading...</div></div>';
  absStuList();
};
async function absStuList(){
  var l=$('absList'); if(!l) return;
  try{
    var j=await _stu({action:'stu_exc_mine'}), a=j.list||[];
    l.innerHTML=a.length?'<div style="font-weight:700;margin:6px 0 0">My requests</div>'+a.map(function(x){ return '<div class="abs-row"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b>'+esc(x.course)+'</b>'+chip(x.status)+'</div><small>'+esc(fd(x.date))+'</small><small>'+esc(x.reason)+'</small>'+(x.note?'<small><b>Lecturer:</b> '+esc(x.note)+'</small>':'')+viewBtn(x)+'</div>'; }).join(''):'<div class="empty">No requests yet.</div>';
  }catch(e){ l.innerHTML='<div class="empty">Could not load ('+esc(e.message||'error')+'). The back end may not be updated yet.</div>'; }
}
function shrink(file){ return new Promise(function(res,rej){
  var img=new Image(), u=URL.createObjectURL(file);
  img.onload=function(){ var M=1100, k=Math.min(1,M/Math.max(img.width,img.height)), c=document.createElement('canvas'); c.width=Math.round(img.width*k); c.height=Math.round(img.height*k); c.getContext('2d').drawImage(img,0,0,c.width,c.height); URL.revokeObjectURL(u); var q=.72, d=c.toDataURL('image/jpeg',q); while(d.length>480000 && q>.3){ q-=.1; d=c.toDataURL('image/jpeg',q); } res(d); };
  img.onerror=function(){ rej(new Error('That file is not a photo')); }; img.src=u; }); }
window.absView=async function(id,btn){
  var slot=document.getElementById('absImg_'+id); if(!slot) return; if(slot.innerHTML){ slot.innerHTML=''; return; }
  slot.innerHTML='<small>Loading photo...</small>';
  try{ var j; try{ j=await _stu({action:'stu_exc_file',id:id}); }catch(e1){ j=await teamApi({action:'stu_exc_file',id:id}); if(!j||!j.ok) throw e1; } slot.innerHTML='<img src="'+j.photo+'" style="max-width:100%;border-radius:10px;margin-top:8px;border:1px solid var(--line)">'; }
  catch(e){ slot.innerHTML='<small>Could not load the photo.</small>'; }
};
function viewBtn(x){ return x.hasFile?'<button type="button" class="abs-b" style="margin-top:8px" onclick="absView(\''+x.id+'\')">View photo</button><div id="absImg_'+x.id+'"></div>':''; }
window.absSend=async function(){
  var m=$('absMsg'), c=$('absCourse').value, d=$('absDate').value, r=$('absReason').value.trim();
  if(!c||!d){ m.innerHTML='<div class="msg err">Choose the course and the date.</div>'; return; }
  if(r.length<5){ m.innerHTML='<div class="msg err">Please give a reason.</div>'; return; }
  m.innerHTML='<div class="msg ok">Sending...</div>';
  try{ var ph=''; var f=$('absFile')&&$('absFile').files[0]; if(f) ph=await shrink(f);
    await _stu({action:'stu_exc_submit',course:c,date:d,reason:r,photo:ph}); if($('absFile')) $('absFile').value=''; m.innerHTML='<div class="msg ok">Sent. Your lecturer will reply here.</div>'; $('absReason').value=''; $('absDate').value=''; absStuList(); }
  catch(e){ m.innerHTML='<div class="msg err">'+esc(e.message||'Could not send')+'</div>'; }
};
document.addEventListener('click',function(e){ var t=e.target.closest&&e.target.closest('[data-go="dashExcuseCard"]'); if(t) setTimeout(function(){ if($('absBody')) absStuInit(); },30); },true);

/* ---------- lecturer side (portal.html) ---------- */
var _L=[];
var _cache=null;
window.absExcusedFor=async function(course,date){
  try{
    if(!_cache || Date.now()-_cache.t>30000){ var j=await teamApi({action:'stu_exc_list'}); _cache={t:Date.now(),list:(j&&j.ok&&j.list)||[]}; }
    var base=String(lmBase(course||'')).toLowerCase(), d=String(date).slice(0,10);
    return _cache.list.filter(function(x){ return x.status==='approved' && x.date===d && String(lmBase(x.course||'')).toLowerCase()===base; }).map(function(x){ return x.index; });
  }catch(e){ return []; }
};
/* every save of attendance (tick list, QR, scanner, edits) also applies approved excuses */
try{ var _sv=window.saveSupabaseData; if(typeof _sv==='function' && typeof teamApi==='function' && $('absStaffBody')!==undefined){
  window.saveSupabaseData=async function(data){
    try{
      if(data && Array.isArray(data.attendance) && data.attendance.length){
        if(!_cache || Date.now()-_cache.t>30000){ var j=await teamApi({action:'stu_exc_list'}); _cache={t:Date.now(),list:(j&&j.ok&&j.list)||[]}; }
        var ap=_cache.list.filter(function(x){ return x.status==='approved'; });
        if(ap.length) data.attendance.forEach(function(r){
          var d=String(r.date||'').slice(0,10), b=String(lmBase(r.course||'')).toLowerCase();
          ap.forEach(function(x){
            if(x.date!==d || String(lmBase(x.course||'')).toLowerCase()!==b) return; var k=key(x.index);
            if((r.present||[]).some(function(p){ return key(p)===k; })) return;
            r.excused=r.excused||[]; if(!r.excused.some(function(p){ return key(p)===k; })) r.excused.push(x.index);
          });
        });
      }
    }catch(e){}
    return _sv.apply(this,arguments);
  };
} }catch(e){}
window.absInit=async function(){ _cache=null;
  var box=$('absStaffBody'); if(!box) return;
  box.innerHTML='<div class="empty">Loading...</div>';
  try{ var j=await teamApi({action:'stu_exc_list'}); if(!j||!j.ok) throw new Error((j&&j.error)||'Back end not updated yet (deploy step 35)'); _L=j.list||[]; absRender(); }
  catch(e){ box.innerHTML='<div class="empty">Could not load ('+esc(e.message||'error')+')</div>'; }
};
function absRender(){
  var box=$('absStaffBody'), pend=_L.filter(function(x){ return x.status==='pending'; });
  var vis=null; try{ var v=visibleCourses(_L.map(function(x){ return x.course; })); vis={}; v.forEach(function(c){ vis[c]=1; }); }catch(e){}
  var rows=_L.filter(function(x){ return !vis||vis[x.course]; });
  if(!rows.length){ box.innerHTML='<div class="empty">No absence requests yet.</div>'; return; }
  box.innerHTML='<div style="margin:10px 0;font-weight:700">'+pend.length+' waiting for a reply</div>'+rows.slice(0,100).map(function(x){
    var i=_L.indexOf(x);
    return '<div class="abs-row"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b>'+esc(x.name||x.index)+'</b>'+chip(x.status)+'</div><small>'+esc(x.index)+' &middot; '+esc(x.course)+' &middot; missed '+esc(fd(x.date))+'</small><small>'+esc(x.reason)+'</small>'+viewBtn(x)
      +(x.status==='pending'?'<div style="display:flex;gap:8px;margin-top:10px"><button type="button" class="abs-b ok" onclick="absDecide('+i+',\'approved\')">Approve</button><button type="button" class="abs-b no" onclick="absDecide('+i+',\'declined\')">Decline</button></div>':'<small>'+(x.note?esc(x.note)+' &middot; ':'')+esc(x.by||'')+'</small>'+(x.status==='approved'?'<button type="button" class="abs-b" style="margin-top:8px" onclick="absApply('+i+')">Apply to attendance</button>':''))+'</div>'; }).join('');
}
window.absApply=async function(i){
  var x=_L[i]; if(!x) return; var msg=$('absStaffMsg'); msg.innerHTML='<div class="msg ok">Checking attendance...</div>';
  try{
    var data=await fetchSupabaseData(true), base=String(lmBase(x.course)).toLowerCase(), k=key(x.index), hit=0, already=0, pres=0, dates=[];
    (data.attendance||[]).forEach(function(r){
      if(String(lmBase(r.course||'')).toLowerCase()!==base) return; var d=String(r.date).slice(0,10); dates.push(d);
      if(d!==x.date) return;
      if((r.present||[]).some(function(p){ return key(p)===k; })){ pres++; return; }
      r.excused=r.excused||[]; if(r.excused.some(function(p){ return key(p)===k; })) already++; else { r.excused.push(x.index); hit++; }
    });
    if(hit){ await saveSupabaseData(data); msg.innerHTML='<div class="msg ok">Done. '+esc(x.name||x.index)+' is now marked Excused for '+esc(fd(x.date))+'. Ask the student to refresh.</div>'; }
    else if(already) msg.innerHTML='<div class="msg ok">Already marked Excused for '+esc(fd(x.date))+' in the saved attendance. If the student still sees Absent, they should close and reopen the page.</div>';
    else if(pres) msg.innerHTML='<div class="msg ok">That student was ticked Present that day, so Present is kept.</div>';
    else msg.innerHTML='<div class="msg err">No saved attendance for '+esc(x.course)+' on '+esc(x.date)+'. Saved dates for this course: '+(dates.length?esc(dates.sort().join(', ')):'none')+'. If you have not taken attendance that day yet, the excuse will apply automatically when you do.</div>';
  }catch(e){ msg.innerHTML='<div class="msg err">'+esc(e.message||'error')+'</div>'; }
};
window.absDecide=async function(i,st){
  var x=_L[i]; if(!x) return; var note='';
  if(st==='declined'){ note=prompt('Reason to show the student (optional):')||''; }
  var msg=$('absStaffMsg'); msg.innerHTML='<div class="msg ok">Working...</div>';
  try{
    var extra='';
    if(st==='approved'){
      var data=await fetchSupabaseData(true), base=String(x.course).toLowerCase(), hit=0, k=key(x.index);
      (data.attendance||[]).forEach(function(a){
        if(String(a.date).slice(0,10)!==x.date || lmBase(a.course||'').toLowerCase()!==base) return;
        var pres=(a.present||[]).some(function(p){ return key(p)===k; });
        if(!pres){ a.excused=a.excused||[]; if(!a.excused.some(function(p){ return key(p)===k; })) a.excused.push(x.index); hit++; }
      });
      if(hit){ await saveSupabaseData(data); extra=' Marked Excused in '+hit+' session'+(hit>1?'s':'')+'.'; }
      else extra=' No attendance session for that date yet. It will be applied automatically when you take attendance that day.';
    }
    var by=''; try{ by=currentUserName||currentUserEmail||''; }catch(e){}
    var r=await teamApi({action:'stu_exc_decide',id:x.id,status:st,note:note,by:by}); if(!r||!r.ok) throw new Error((r&&r.error)||'Failed');
    msg.innerHTML='<div class="msg ok">'+(st==='approved'?'Approved.':'Declined.')+extra+'</div>'; absInit();
  }catch(e){ msg.innerHTML='<div class="msg err">'+esc(e.message||'error')+'</div>'; }
};
})();
