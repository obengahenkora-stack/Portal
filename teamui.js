/* ===== Team Access: modern layout (cards, role chips, course chips, tidy tools) ===== */
(function(){
var css=document.createElement('style');
css.textContent='#teamAccessCard .tm-add{margin:14px 0 4px;border:1px solid var(--line);border-radius:16px;background:var(--card);overflow:hidden}'
+'#teamAccessCard .tm-add>summary{list-style:none;cursor:pointer;padding:13px 16px;font-weight:700;display:flex;align-items:center;gap:10px}'
+'#teamAccessCard .tm-add>summary::-webkit-details-marker{display:none}'
+'#teamAccessCard .tm-add>summary:before{content:"+";display:inline-flex;width:26px;height:26px;border-radius:50%;background:rgba(14,165,233,.15);color:#0284c7;align-items:center;justify-content:center;font-weight:800}'
+'#teamAccessCard .tm-add[open]>summary:before{content:"\\2212"}'
+'#teamAccessCard .tm-form{padding:2px 16px 16px;display:grid;gap:10px}'
+'#teamAccessCard .tm-form input,#teamAccessCard .tm-form select{width:100% !important;max-width:100% !important;box-sizing:border-box !important;margin:0 !important}'
+'#teamAccessCard .tm-l{font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:4px}'
+'#teamAccessCard .tm-go{width:100% !important;padding:12px !important;border-radius:14px !important;font-weight:700 !important;text-transform:none !important;letter-spacing:0 !important}'
+'#teamAccessCard .tm-sum{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 4px}'
+'#teamAccessCard .tm-sum span{padding:5px 12px;border-radius:999px;border:1px solid var(--line);background:var(--card);font-size:.76rem;font-weight:700}'
+'#teamAccessCard .tm-card{border:1px solid var(--line);border-radius:16px;padding:14px;margin-top:10px;background:var(--card)}'
+'#teamAccessCard .tm-top{display:flex;gap:12px;align-items:center}'
+'#teamAccessCard .tm-av{flex:0 0 44px;width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;background:linear-gradient(135deg,#0ea5e9,#0d9488)}'
+'#teamAccessCard .tm-nm{font-weight:700;line-height:1.2;overflow-wrap:anywhere}'
+'#teamAccessCard .tm-em{font-size:.78rem;color:var(--muted);overflow-wrap:anywhere}'
+'#teamAccessCard .tm-chips{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 0}'
+'#teamAccessCard .tm-chip{padding:3px 10px;border-radius:999px;font-size:.72rem;font-weight:700;background:rgba(14,165,233,.12);color:#0369a1;white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}'
+'#teamAccessCard .tm-tog{border:0 !important;width:auto !important;cursor:pointer;box-shadow:none !important;text-transform:none !important;letter-spacing:0 !important;background:rgba(14,165,233,.16) !important;color:#0369a1 !important;padding:3px 10px !important;font-size:.72rem !important}'
+'#teamAccessCard .tm-chip.r{background:rgba(139,92,246,.14);color:#6d28d9}'
+'#teamAccessCard .tm-chip.a{background:rgba(245,158,11,.16);color:#b45309}'
+'#teamAccessCard .tm-chip.g{background:rgba(127,127,127,.16);color:var(--muted)}'
+'#teamAccessCard .tm-act{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}'
+'#teamAccessCard .tm-b{flex:1 1 0;width:auto !important;min-width:0;padding:9px 10px !important;font-size:.8rem !important;border-radius:999px !important;background:var(--card) !important;color:var(--ink) !important;border:1px solid var(--line) !important;box-shadow:none !important;font-weight:700 !important;letter-spacing:0 !important;text-transform:none !important;white-space:nowrap}'
+'#teamAccessCard .tm-b.x{color:#dc2626 !important;flex:0 0 auto}'
+'#teamAccessCard .tm-tools{margin-top:18px;border:1px dashed var(--line);border-radius:14px;padding:2px 14px}'
+'#teamAccessCard .tm-tools>summary{cursor:pointer;padding:11px 0;font-weight:700;font-size:.85rem;color:var(--muted)}'
+'#teamAccessCard .tm-tools .tm-grid{display:grid;gap:8px;padding:4px 0 12px}'
+'#teamAccessCard .tm-tools button{width:100% !important;margin:0 !important;padding:10px 12px !important;font-size:.8rem !important;border-radius:12px !important;text-align:left;text-transform:none !important;letter-spacing:0 !important;font-weight:600 !important;background:transparent !important;color:var(--ink) !important;border:1px solid var(--line) !important;box-shadow:none !important}';
document.head.appendChild(css);

function esc(t){ return String(t==null?'':t).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
var ROLE={admin:'Admin',lecturer:'Lecturer',ta:'Teaching Assistant'};

/* one-time restructure of the card: collapsible add form + collapsible tools */
function shape(){
  var card=document.getElementById('teamAccessCard'); if(!card || card.getAttribute('data-shaped')) return;
  var nm=document.getElementById('teamMemberNameInput'), em=document.getElementById('teamMemberEmailInput'), rl=document.getElementById('teamMemberRoleSelect');
  var msg=document.getElementById('teamMemberMsg'), tm=document.getElementById('backendTestMsg'), list=document.getElementById('teamMemberList');
  if(!nm||!em||!rl||!list) return;
  var hint=card.querySelector('.hint'); if(hint) hint.textContent='Add lecturers or teaching assistants by email. They must sign in with that exact email and their role applies automatically.';
  var oldBtn=card.querySelector('button[onclick="addTeamMember()"]');
  var tools=[].slice.call(card.querySelectorAll('button')).filter(function(b){ return /testBackend|copyScores|dataSummary|stripOld|stripTeam|migrateTeam/.test(b.getAttribute('onclick')||''); });
  /* strip the old pieces (labels and wrappers) */
  [].slice.call(card.children).forEach(function(c){ if(c.tagName==='LABEL' && c!==card.querySelector('label')) c.remove(); });
  var add=document.createElement('details'); add.className='tm-add';
  add.innerHTML='<summary>Add a team member</summary><div class="tm-form" id="tmForm"></div>';
  var f=add.querySelector('#tmForm');
  function fld(label,el){ var d=document.createElement('div'); d.innerHTML='<div class="tm-l">'+label+'</div>'; el.removeAttribute('style'); d.appendChild(el); f.appendChild(d); }
  fld('Name',nm); fld('Email',em); fld('Role',rl);
  if(oldBtn){ oldBtn.className='tm-go'; oldBtn.removeAttribute('style'); oldBtn.textContent='Add team member'; f.appendChild(oldBtn); }
  if(msg) f.appendChild(msg);
  var tl=document.createElement('details'); tl.className='tm-tools'; tl.innerHTML='<summary>Maintenance tools (rarely needed)</summary><div class="tm-grid"></div>';
  var g=tl.querySelector('.tm-grid'); tools.forEach(function(b){ b.removeAttribute('style'); b.className=''; g.appendChild(b); });
  if(tm){ tm.style.cssText='font-size:.84rem;padding-bottom:10px'; tl.appendChild(tm); }
  /* remove leftover wrapper that held the old tool buttons */
  [].slice.call(card.children).forEach(function(c){ if(c!==list && c!==add && c!==tl && c.tagName==='DIV' && !c.classList.contains('hint') && !c.querySelector('#teamMemberList') && !c.contains(add)) { if(!c.querySelector('button')) c.remove(); } });
  var oldWrap=card.querySelector('div[style*="border-top:1px dashed"]'); if(oldWrap && !oldWrap.querySelector('button')) oldWrap.remove();
  card.insertBefore(add,list);
  var sum=document.createElement('div'); sum.id='tmSum'; sum.className='tm-sum'; card.insertBefore(sum,list);
  card.appendChild(tl);
  card.setAttribute('data-shaped','1');
}

window.loadTeamMemberList=async function(){
  shape();
  var box=document.getElementById('teamMemberList'); if(!box) return;
  box.innerHTML='<div class="empty">Loading...</div>';
  try{
    var members=null, tl=await teamApi({action:'team_list'});
    if(tl && tl.ok && Array.isArray(tl.members) && tl.members.length) members=tl.members;
    if(!members){ var d=await fetchSupabaseData(); members=d.teamMembers||[]; }
    var s=document.getElementById('tmSum');
    if(s){ var n={admin:0,lecturer:0,ta:0}; members.forEach(function(m){ if(n[m.role]!==undefined) n[m.role]++; }); s.innerHTML='<span>'+members.length+' member'+(members.length===1?'':'s')+'</span>'+(n.admin?'<span>'+n.admin+' admin'+(n.admin===1?'':'s')+'</span>':'')+(n.lecturer?'<span>'+n.lecturer+' lecturer'+(n.lecturer===1?'':'s')+'</span>':'')+(n.ta?'<span>'+n.ta+' TA'+(n.ta===1?'':'s')+'</span>':''); }
    if(!members.length){ box.innerHTML='<div class="empty">No additional team members added yet.</div>'; return; }
    box.innerHTML=members.map(function(m){
      var init=String(m.name||m.email||'?').trim().split(/\s+/).slice(0,2).map(function(w){ return w[0]; }).join('').toUpperCase();
      var crs=null, chips='<span class="tm-chip r">'+esc(ROLE[m.role]||m.role)+'</span>';
      if(Array.isArray(m.perms)) chips+='<span class="tm-chip a">Custom access: '+m.perms.length+'</span>';
      if(m.role==='admin') chips+='<span class="tm-chip g">All courses</span>';
      else if(Array.isArray(m.courses)){
        if(!m.courses.length) chips+='<span class="tm-chip g">No courses assigned</span>';
        else { chips+='<button type="button" class="tm-chip tm-tog" onclick="var n=this.parentNode.nextSibling;n.style.display=n.style.display===\'flex\'?\'none\':\'flex\';this.classList.toggle(\'on\')">'+m.courses.length+' course'+(m.courses.length===1?'':'s')+' &#9662;</button>'; crs=m.courses; }
      } else chips+='<span class="tm-chip g">All courses</span>';
      var e=esc(m.email), q=esc(m.email).replace(/'/g,"\\'");
      return '<div class="tm-card"><div class="tm-top"><div class="tm-av">'+esc(init)+'</div><div style="min-width:0"><div class="tm-nm">'+esc(m.name||m.email)+'</div><div class="tm-em">'+e+'</div></div></div>'
        +'<div class="tm-chips">'+chips+'</div>'+'<div class="tm-chips tm-list" style="display:none">'+(crs?crs.map(function(c){ return '<span class="tm-chip" title="'+esc(c)+'">'+esc(c)+'</span>'; }).join(''):'')+'</div>'
        +'<div class="tm-act">'+(m.role==='admin'?'':'<button type="button" class="tm-b" data-email="'+e+'" onclick="openPerms(this.dataset.email)">Access</button><button type="button" class="tm-b" data-email="'+e+'" onclick="assignCourses(this.dataset.email)">Courses</button>')+'<button type="button" class="tm-b x" onclick="removeTeamMember(\''+q+'\')">Remove</button></div></div>';
    }).join('');
  }catch(err){ box.innerHTML='<div class="empty">Could not load team members.</div>'; }
};
document.addEventListener('DOMContentLoaded',shape);
})();
