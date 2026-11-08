/* ===== Absence excuses: students ask, lecturers approve, and the session is marked Excused ===== */
(function(){
function $(i){ return document.getElementById(i); }
function esc(t){ return String(t==null?'':t).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function key(x){ return String(x||'').toUpperCase().replace(/[^A-Z0-9]/g,''); }
function fd(d){ try{ return new Date(d+'T00:00:00').toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}); }catch(e){ return d; } }
function chip(st){ var c=st==='approved'?'#16a34a':st==='declined'?'#dc2626':st==='cancelled'?'#6b7280':'#d97706', l=st==='approved'?'Approved':st==='declined'?'Declined':st==='cancelled'?'Cancelled':'Waiting'; return '<span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:.72rem;font-weight:700;color:'+c+';border:1px solid '+c+'">'+l+'</span>'; }
var css=document.createElement('style');
css.textContent='.abs-row{padding:12px 14px;border:1px solid var(--line);border-radius:14px;margin-top:8px;background:var(--card)}'
+'.abs-row small{display:block;color:var(--muted);margin-top:2px}'
+'.abs-f{display:grid;gap:10px;margin:12px 0}'
+'.abs-f select,.abs-f input,.abs-f textarea{width:100% !important;max-width:100% !important;box-sizing:border-box !important}'
+'.abs-f textarea{min-height:90px}'
+'.abs-b{width:auto !important;padding:8px 16px !important;font-size:.82rem !important;border-radius:999px !important;background:var(--card) !important;color:var(--ink) !important;border:1px solid var(--line) !important;box-shadow:none !important;font-weight:700 !important;letter-spacing:0 !important;text-transform:none !important;white-space:nowrap}'
+'.abs-b.ok{color:#16a34a !important;border-color:#16a34a !important}.abs-b.no{color:#dc2626 !important}'
+'.abs-go{width:100% !important;padding:12px !important;border-radius:14px !important;font-weight:700 !important;text-transform:none !important;letter-spacing:0 !important}';
css.textContent+='#absenceCard,#absenceCard *{font-family:inherit}'
+'#absenceCard .ab-set{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 16px;border:1px solid var(--line);border-radius:16px;background:var(--card);margin:14px 0 12px}'
+'#absenceCard .ab-set b{display:block;font-size:.92rem;text-transform:none;letter-spacing:0}'
+'#absenceCard .ab-set small{display:block;color:var(--muted);font-size:.78rem;margin-top:2px;text-transform:none;letter-spacing:0}'
+'#absenceCard .ab-sw:not(#z){flex:0 0 52px;width:52px !important;height:30px;padding:0 !important;border-radius:999px !important;background:rgba(127,127,127,.35) !important;border:0 !important;box-shadow:none !important;position:relative;transition:background .2s}'
+'#absenceCard .ab-sw i{position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.3)}'
+'#absenceCard .ab-sw.on:not(#z){background:#16a34a !important}#absenceCard .ab-sw.on i{left:25px}'
+'#absenceCard .ab-tabs{display:flex;gap:5px;overflow-x:auto;padding:2px 0 4px;margin-bottom:6px}'
+'#absenceCard .ab-tab:not(#z){flex:0 0 auto;width:auto !important;padding:8px 10px !important;border-radius:999px !important;background:var(--card) !important;color:var(--ink) !important;border:1px solid var(--line) !important;box-shadow:none !important;font-size:.78rem !important;font-weight:700 !important;text-transform:none !important;letter-spacing:0 !important;white-space:nowrap}'
+'#absenceCard .ab-tab span{opacity:.6;margin-left:4px}'
+'#absenceCard .ab-tab.on:not(#z){background:#0b3a45 !important;color:#fff !important;border-color:#0b3a45 !important}'
+'#absenceCard .ab-card{border:1px solid var(--line);border-left:4px solid #d97706;border-radius:16px;padding:14px;margin-top:10px;background:var(--card)}'
+'#absenceCard .ab-card.ok{border-left-color:#16a34a}#absenceCard .ab-card.no{border-left-color:#dc2626}'
+'#absenceCard .ab-top{display:flex;gap:12px;align-items:center}'
+'#absenceCard .ab-av{flex:0 0 40px;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.85rem;color:#fff;background:linear-gradient(135deg,#0ea5e9,#0d9488)}'
+'#absenceCard .ab-nm{font-weight:700;line-height:1.2;overflow-wrap:anywhere}#absenceCard .ab-ix{font-size:.76rem;color:var(--muted)}'
+'#absenceCard .ab-st{flex:0 0 auto;padding:3px 10px;border-radius:999px;font-size:.72rem;font-weight:700;background:rgba(217,119,6,.15);color:#b45309}'
+'#absenceCard .ab-st.ok{background:rgba(22,163,74,.15);color:#15803d}#absenceCard .ab-st.no{background:rgba(220,38,38,.14);color:#b91c1c}'
+'#absenceCard .ab-chips{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 0}'
+'#absenceCard .ab-chip{padding:3px 10px;border-radius:999px;font-size:.73rem;font-weight:700;background:rgba(14,165,233,.12);color:#0369a1;overflow-wrap:anywhere}#absenceCard .ab-chip.d{background:rgba(127,127,127,.16);color:var(--ink)}'
+'#absenceCard .ab-reason{margin-top:10px;padding:10px 12px;border-radius:12px;background:rgba(127,127,127,.09);font-size:.9rem;line-height:1.45;overflow-wrap:anywhere}'
+'#absenceCard .ab-by,#absenceCard .ab-note{margin-top:8px;font-size:.76rem;color:var(--muted)}'
+'#absenceCard .ab-act{display:flex;gap:8px;margin-top:12px}'
+'#absenceCard .ab-btn:not(#z){flex:1 1 0;width:auto !important;padding:10px 12px !important;border-radius:999px !important;background:var(--card) !important;color:var(--ink) !important;border:1px solid var(--line) !important;box-shadow:none !important;font-size:.82rem !important;font-weight:700 !important;text-transform:none !important;letter-spacing:0 !important;white-space:nowrap}'
+'#absenceCard .ab-btn.ok:not(#z){background:#16a34a !important;color:#fff !important;border-color:#16a34a !important}'
+'#absenceCard .ab-btn.no:not(#z){color:#dc2626 !important}';
document.head.appendChild(css);

/* ---------- student side (dashboard.html) ---------- */
function fillCourses(){
  var sel=$('absCourse'); if(!sel) return; var courses=[]; try{ courses=(_dlhMine||[]).slice().sort(); }catch(e){}
  var keep=sel.value; sel.innerHTML='<option value="">'+(courses.length?'Course you missed...':'Loading your courses...')+'</option>'+courses.map(function(c){ return '<option>'+esc(c)+'</option>'; }).join('');
  if(keep) sel.value=keep;
}
window.absStuInit=function(){
  var box=$('absBody'); if(!box) return;
  if(!$('absCourse')){
    box.innerHTML='<div class="abs-f"><select id="absCourse"></select>'
      +'<input type="date" id="absDate"><textarea id="absReason" maxlength="600" placeholder="Why were you absent? (e.g. sick, family emergency, official duty)"></textarea>'
      +'<div><div style="font-size:.78rem;color:var(--muted);margin-bottom:4px">Proof (optional): photo of a medical note or letter</div><input type="file" id="absFile" accept="image/*"></div>'
      +'<button type="button" class="abs-go" onclick="absSend()">Send request</button><div id="absMsg"></div></div><div id="absList"><div class="empty">Loading...</div></div>';
  }
  fillCourses(); absStuList();
};
function stuBtns(x){
  var today=new Date().toISOString().slice(0,10), b='';
  if(x.status==='pending' || (x.status==='approved' && x.date>today)) b='<button type="button" class="abs-b no" style="margin-top:8px" onclick="absStuCancel(\''+x.id+'\')">Cancel request</button>';
  else if(x.status==='declined' || x.status==='cancelled') b='<button type="button" class="abs-b no" style="margin-top:8px" onclick="absStuDelete(\''+x.id+'\')">Delete</button>';
  else if(x.status==='approved') b='<small>To withdraw this, ask your lecturer.</small>';
  return b;
}
window.absStuCancel=async function(id){ if(!confirm('Cancel this request?')) return; var m=$('absMsg'); try{ await _stu({action:'stu_exc_cancel',id:id}); if(m) m.innerHTML='<div class="msg ok">Request cancelled.</div>'; absStuList(); }catch(e){ if(m) m.innerHTML='<div class="msg err">'+esc(e.message||'Could not cancel')+'</div>'; } };
window.absStuDelete=async function(id){ if(!confirm('Delete this request from your list?')) return; var m=$('absMsg'); try{ await _stu({action:'stu_exc_delete',id:id}); if(m) m.innerHTML='<div class="msg ok">Deleted.</div>'; absStuList(); }catch(e){ if(m) m.innerHTML='<div class="msg err">'+esc(e.message||'Could not delete')+'</div>'; } };
async function absStuList(){
  var l=$('absList'); if(!l) return;
  try{
    var j=await _stu({action:'stu_exc_mine'}), a=j.list||[];
    l.innerHTML=a.length?'<div style="font-weight:700;margin:6px 0 0">My requests</div>'+a.map(function(x){ return '<div class="abs-row"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b>'+esc(x.course)+'</b>'+chip(x.status)+'</div><small>'+esc(fd(x.date))+'</small><small>'+esc(x.reason)+'</small>'+(x.note?'<small><b>Lecturer:</b> '+esc(x.note)+'</small>':'')+viewBtn(x)+stuBtns(x)+'</div>'; }).join(''):'<div class="empty">No requests yet.</div>';
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
function viewBtn(x){ return x.hasFile?'<button type="button" class="ab-btn" style="margin-top:8px;width:auto" onclick="absView(\''+x.id+'\')">View photo</button><div id="absImg_'+x.id+'"></div>':''; }
window.absSend=async function(){
  var m=$('absMsg'), c=$('absCourse').value, d=$('absDate').value, r=$('absReason').value.trim();
  if(!c||!d){ m.innerHTML='<div class="msg err">Choose the course and the date.</div>'; return; }
  if(r.length<5){ m.innerHTML='<div class="msg err">Please give a reason.</div>'; return; }
  m.innerHTML='<div class="msg ok">Sending...</div>';
  try{ var ph=''; var f=$('absFile')&&$('absFile').files[0]; if(f) ph=await shrink(f);
    await _stu({action:'stu_exc_submit',course:c,date:d,reason:r,photo:ph}); if($('absFile')) $('absFile').value=''; m.innerHTML='<div class="msg ok">Sent. Your lecturer will reply here.</div>'; $('absReason').value=''; $('absDate').value=''; absStuList(); }
  catch(e){ m.innerHTML='<div class="msg err">'+esc(e.message||'Could not send')+'</div>'; }
};
/* build the form the moment the screen opens (also after a reload), and fill courses when they arrive */
try{ var _dt=window.dashTab; if(typeof _dt==='function' && $('absBody')){ window.dashTab=function(id){ var r=_dt.apply(this,arguments); if(id==='dashExcuseCard') absStuInit(); return r; }; } }catch(e){}
try{ var _ih=window.initDashHall; if(typeof _ih==='function' && $('absBody')){ window.initDashHall=function(){ var r=_ih.apply(this,arguments); fillCourses(); return r; }; } }catch(e){}
if($('absBody')) document.addEventListener('DOMContentLoaded',function(){ absStuInit(); });

/* ---------- lecturer side (portal.html) ---------- */
var _L=[], _ta=false;
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
  try{ var j=await teamApi({action:'stu_exc_list'}); if(!j||!j.ok) throw new Error((j&&j.error)||'Back end not updated yet (deploy step 35)'); _L=j.list||[]; _ta=!!j.taApprove; absRender(); }
  catch(e){ box.innerHTML='<div class="empty">Could not load ('+esc(e.message||'error')+')</div>'; }
};
var _flt=null;
function ini(n){ return String(n||'?').trim().split(/\s+/).slice(0,2).map(function(w){ return w[0]; }).join('').toUpperCase(); }
window.absFilter=function(f){ _flt=f; absRender(); };
function absRender(){
  var box=$('absStaffBody');
  var vis=null; try{ var v=visibleCourses(_L.map(function(x){ return x.course; })); vis={}; v.forEach(function(c){ vis[c]=1; }); }catch(e){}
  var all=_L.filter(function(x){ return !vis||vis[x.course]; });
  var n={pending:0,approved:0,declined:0}; all.forEach(function(x){ if(n[x.status]!==undefined) n[x.status]++; });
  if(!_flt) _flt=n.pending?'pending':'all';
  var rows=_flt==='all'?all:all.filter(function(x){ return x.status===_flt; });
  var tog=''; try{ if(isAdmin()) tog='<div class="ab-set"><div><b>Let teaching assistants approve</b><small>'+(_ta?'On: TAs can approve for the courses assigned to them.':'Off: requests go to the lecturer assigned to the course.')+'</small></div><button type="button" role="switch" aria-checked="'+(_ta?'true':'false')+'" class="ab-sw'+(_ta?' on':'')+'" onclick="absSetTa(!'+(_ta?'true':'false')+')"><i></i></button></div>'; }catch(e){}
  var tabs=[['pending','Waiting',n.pending],['approved','Approved',n.approved],['declined','Declined',n.declined],['all','All',all.length]];
  var h=tog+'<div class="ab-tabs">'+tabs.map(function(t){ return '<button type="button" class="ab-tab'+(_flt===t[0]?' on':'')+'" onclick="absFilter(\''+t[0]+'\')">'+t[1]+' <span>'+t[2]+'</span></button>'; }).join('')+'</div>';
  if(!rows.length){ box.innerHTML=h+'<div class="empty">'+(all.length?'Nothing in this list.':'No absence requests yet.')+'</div>'; return; }
  box.innerHTML=h+rows.slice(0,100).map(function(x){
    var i=_L.indexOf(x), tone=x.status==='approved'?'ok':(x.status==='declined'||x.status==='cancelled')?'no':'wait';
    var acts;
    if(!x.canDecide) acts='<div class="ab-note">View only. This goes to the lecturer assigned to this course.</div>';
    else if(x.status==='pending') acts='<div class="ab-act"><button type="button" class="ab-btn ok" onclick="absDecide('+i+',\'approved\')">Approve</button><button type="button" class="ab-btn no" onclick="absDecide('+i+',\'declined\')">Decline</button></div>';
    else if(x.status==='cancelled') acts='';
    else if(x.status==='approved') acts='<div class="ab-act"><button type="button" class="ab-btn" onclick="absApply('+i+')">Apply to attendance</button><button type="button" class="ab-btn no" onclick="absRevoke('+i+')">Revoke</button></div>';
    else acts='';
    return '<div class="ab-card '+tone+'"><div class="ab-top"><div class="ab-av">'+esc(ini(x.name||x.index))+'</div><div style="min-width:0;flex:1"><div class="ab-nm">'+esc(x.name||x.index)+'</div><div class="ab-ix">'+esc(x.index)+'</div></div><span class="ab-st '+tone+'">'+(x.status==='approved'?'Approved':x.status==='declined'?'Declined':x.status==='cancelled'?'Cancelled by student':'Waiting')+'</span></div>'
      +'<div class="ab-chips"><span class="ab-chip">'+esc(x.course)+'</span><span class="ab-chip d">'+esc(fd(x.date))+'</span></div>'
      +'<div class="ab-reason">'+esc(x.reason)+'</div>'+viewBtn(x)
      +((x.status!=='pending'&&(x.note||x.by))?'<div class="ab-by">'+(x.note?esc(x.note)+' &middot; ':'')+esc(x.by||'')+'</div>':'')+acts+'</div>';
  }).join('');
}
window.absSetTa=async function(on){ var m=$('absStaffMsg'); try{ var r=await teamApi({action:'stu_exc_cfg_set',taApprove:on}); if(!r||!r.ok) throw new Error((r&&r.error)||'Failed'); _ta=on; absRender(); m.innerHTML='<div class="msg ok">'+(on?'Teaching assistants can now approve for their courses.':'Only lecturers can approve now.')+'</div>'; }catch(e){ m.innerHTML='<div class="msg err">'+esc(e.message||'error')+'</div>'; } };
window.absRevoke=async function(i){
  var x=_L[i]; if(!x) return;
  if(!confirm('Revoke this approval?\n\n'+(x.name||x.index)+' will no longer be excused for '+x.course+' on '+fd(x.date)+'. If they were marked Excused in attendance, that mark is removed.')) return;
  var msg=$('absStaffMsg'); msg.innerHTML='<div class="msg ok">Working...</div>';
  try{
    var by=''; try{ by=currentUserName||currentUserEmail||''; }catch(e){}
    var r=await teamApi({action:'stu_exc_decide',id:x.id,status:'declined',note:'Approval withdrawn',by:by}); if(!r||!r.ok) throw new Error((r&&r.error)||'Failed');
    _cache=null;
    var data=await fetchSupabaseData(true), base=String(lmBase(x.course)).toLowerCase(), k=key(x.index), n=0;
    (data.attendance||[]).forEach(function(rec){
      if(String(rec.date).slice(0,10)!==x.date || String(lmBase(rec.course||'')).toLowerCase()!==base || !rec.excused) return;
      var l=rec.excused.length; rec.excused=rec.excused.filter(function(p){ return key(p)!==k; }); if(rec.excused.length!==l) n++;
    });
    if(n) await saveSupabaseData(data);
    msg.innerHTML='<div class="msg ok">Approval revoked.'+(n?' The Excused mark was removed from attendance.':'')+'</div>'; absInit();
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
