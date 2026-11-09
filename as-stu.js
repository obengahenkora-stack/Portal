/* ===== Assignments (student): see tasks, hand in a typed answer, link or small photo, see marks ===== */
(function(){
function $(i){return document.getElementById(i);}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function fmt(iso){try{return new Date(iso).toLocaleString([], {weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});}catch(e){return iso;}}
var css=document.createElement('style');
css.textContent='.asu-c{border:1px solid var(--line);border-left:4px solid #0ea5e9;border-radius:16px;padding:14px;margin-top:12px;background:var(--card)}.asu-c.done{border-left-color:#16a34a}.asu-c.late{border-left-color:#dc2626}'
+'.asu-nm{font-weight:700;overflow-wrap:anywhere}.asu-s{font-size:.8rem;color:var(--muted);margin-top:3px}.asu-in{margin-top:10px;white-space:pre-wrap;overflow-wrap:anywhere;font-size:.9rem}'
+'.asu-f textarea,.asu-f input:not([type=file]){width:100% !important;box-sizing:border-box !important;margin:6px 0 0 !important}.asu-f textarea{min-height:90px}.asu-f .l{font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-top:12px}'
+'.asu-b:not(#z){width:100% !important;padding:12px !important;border-radius:14px !important;font-weight:700 !important;font-size:.9rem !important;text-transform:none !important;letter-spacing:0 !important;margin-top:14px}'
+'.asu-res{margin-top:10px;font-size:1.05rem;font-weight:700}.asu-late{color:#dc2626;font-weight:700}';
document.head.appendChild(css);
var ITEMS=[], PH={}, OFF=0;
function shrink(file,cb){var r=new FileReader(); r.onload=function(){var im=new Image(); im.onload=function(){var m=1280, w=im.width, h=im.height, k=Math.min(1,m/Math.max(w,h)); w=Math.round(w*k); h=Math.round(h*k); var c=document.createElement('canvas'); c.width=w; c.height=h; c.getContext('2d').drawImage(im,0,0,w,h); var q=.72, d=c.toDataURL('image/jpeg',q); while(d.length>480000 && q>.3){ q-=.1; d=c.toDataURL('image/jpeg',q);} cb(d.length>590000?null:d); }; im.onerror=function(){cb(null);}; im.src=r.result; }; r.onerror=function(){cb(null);}; r.readAsDataURL(file);}
window.asuInit=async function(){
  var box=$('asuBody'); if(!box) return; box.innerHTML='<div class="empty">Loading...</div>';
  try{ var j=await _stu({action:'stu_as_list'}); if(!j||!j.ok) throw new Error((j&&j.error)||'Could not load'); OFF=j.now-Date.now(); ITEMS=(j.items||[]).sort(function(a,b){return Date.parse(a.due)-Date.parse(b.due);}); draw(); }
  catch(e){ box.innerHTML='<div class="empty">Could not load ('+esc(e.message||'error')+')</div>'; }
};
function draw(){
  var box=$('asuBody'); if(!ITEMS.length){ box.innerHTML='<div class="empty" style="margin-top:12px">No assignments yet.</div>'; return; }
  box.innerHTML=ITEMS.map(function(x,i){
    var now=Date.now()+OFF, over=now>Date.parse(x.due), open=!over||x.allowLate, s=x.sub, locked=x.marked;
    var cls='asu-c'+(s?' done':(over?' late':''));
    var h='<div class="'+cls+'"><div class="asu-nm">'+esc(x.title)+'</div><div class="asu-s">'+esc(x.course)+' &middot; Due '+esc(fmt(x.due))+' &middot; out of '+x.max+(over?' &middot; <span class="asu-late">'+(open?'Deadline passed (late work accepted)':'Closed')+'</span>':'')+'</div>';
    if(x.instructions) h+='<div class="asu-in">'+esc(x.instructions)+'</div>';
    if(x.result) h+='<div class="asu-res">Your mark: '+x.result.grade+' / '+x.result.max+'</div>'+(x.result.comment?'<div class="asu-s">Lecturer: '+esc(x.result.comment)+'</div>':'');
    else if(s && x.marked) h+='<div class="asu-s" style="margin-top:8px">Marked. Your mark will show when your lecturer releases it.</div>';
    if(s) h+='<div class="asu-s" style="margin-top:8px"><b>Handed in</b> '+esc(fmt(s.at))+(s.late?' <span class="asu-late">(late)</span>':'')+'</div>';
    if(!locked && open){
      h+='<div class="asu-f" id="asf'+i+'" style="display:none"><div class="l">Your answer (optional)</div><textarea id="ast'+i+'">'+esc(s?s.text:'')+'</textarea><div class="l">Link to your work (optional)</div><input id="asl'+i+'" placeholder="https://..." value="'+esc(s?s.link:'')+'"><div class="l">Photo of your work (optional)</div><input type="file" accept="image/*" id="asp'+i+'" style="margin-top:6px">'+(s&&s.hasPhoto?'<div class="asu-s">A photo is already attached. Choose another to replace it.</div>':'')+'<div id="asm'+i+'"></div><button type="button" class="asu-b" onclick="asuSend('+i+')">'+(s?'Update hand-in':'Hand in')+'</button></div>'
        +'<button type="button" class="asu-b" id="asb'+i+'" onclick="document.getElementById(\'asf'+i+'\').style.display=\'block\';this.style.display=\'none\'">'+(s?'Change my hand-in':'Hand in work')+'</button>';
    } else if(!s && over && !x.allowLate) h+='<div class="asu-s" style="margin-top:8px">You did not hand this in before the deadline.</div>';
    return h+'</div>';
  }).join('');
}
window.asuSend=async function(i){
  var x=ITEMS[i], m=$('asm'+i), f=$('asp'+i).files[0];
  async function go(photo){
    m.innerHTML='<div class="msg ok">Sending...</div>';
    try{ var j=await _stu({action:'stu_as_submit',id:x.id,text:$('ast'+i).value,link:$('asl'+i).value,photo:photo||'',keepPhoto:!photo&&!!(x.sub&&x.sub.hasPhoto)}); if(!j||!j.ok) throw new Error((j&&j.error)||'Could not send'); await asuInit(); }
    catch(e){ m.innerHTML='<div class="msg err">'+esc(e.message||'error')+'</div>'; }
  }
  if(f){ m.innerHTML='<div class="msg ok">Preparing photo...</div>'; shrink(f,function(d){ if(!d){ m.innerHTML='<div class="msg err">That photo is too large or unreadable. Try another.</div>'; return; } go(d); }); } else go('');
};
try{ var _dt=window.dashTab; if(typeof _dt==='function' && $('asuBody')){ window.dashTab=function(id){ var r=_dt.apply(this,arguments); if(id==='dashAssignCard') asuInit(); return r; }; } }catch(e){}
})();
