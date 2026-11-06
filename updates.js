/* What's new: shown once per update, after sign-in. To announce something new, add a note at the TOP of NOTES with a new id. */
(function(){
  var NOTES=[
    { id:'2026-11-06c', date:'6 Nov 2026', title:'Important notice and what is new',
      all:[],
      student:[
        'NOTICE: Please open My Attendance and check that every class you attended is counted. If anything is wrong or missing, use Report an Issue on your dashboard and say the course and the date, so it can be resolved.',
        'Choose your class (A, B or C) the first time you sign in. Your attendance lists are set up from it, and you can change it later.',
        'Your Overview now shows your confirmed class and the class lists you are on.',
        'My Scores now shows what each assessment was marked out of, for example 5 / 10, and your continuous assessment total out of 40 once your lecturer turns it on.',
        'Absent with permission is now recorded and kept in your attendance.'
      ],
      staff:[
        'NOTICE: Students have been asked to check My Attendance and report any problem through Report an Issue. Their reports arrive in your Reports list.',
        'Class List from Sign-ups builds separate A, B and C attendance lists from registered students.',
        'Connect lists you already uploaded, so a student who picks a class is added to the right lists, and moved with their attendance if they change class.',
        'Class Check shows each student\u2019s list class next to the class they confirmed.',
        'Registered Students now shows each student\u2019s class, with a filter for those who have not chosen yet.',
        'Absent with permission is now saved properly.',
        'Gradebook: edit a single score, set what each assessment is marked out of, and show the Final out of 40.'
      ] }
  ];
  var isStaffPage=/portal\.html/i.test(location.pathname)||/\/portal\/?$/i.test(location.pathname);
  var role=isStaffPage?'staff':'student';
  function seenId(){ try{ return localStorage.getItem('ceSeenUpdate_'+role)||''; }catch(e){ return ''; } }
  function markSeen(id){ try{ localStorage.setItem('ceSeenUpdate_'+role,id); }catch(e){} }
  function signedIn(){
    var el=document.getElementById(isStaffPage?'loginCard':'signedInCard'); if(!el) return false;
    return isStaffPage ? el.classList.contains('hidden') : !el.classList.contains('hidden');
  }
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function items(n){ return (n.all||[]).concat(n[role]||[]); }
  function show(n,force){
    if(!n||document.getElementById('ceUpdateBox')) return;
    var list=items(n); if(!list.length) return;
    var o=document.createElement('div'); o.id='ceUpdateBox';
    o.style.cssText='position:fixed;inset:0;z-index:99998;background:rgba(10,20,30,.7);display:flex;align-items:center;justify-content:center;padding:20px;';
    o.innerHTML='<div style="background:var(--card,#fff);color:var(--ink,#111);max-width:460px;width:100%;max-height:85vh;overflow:auto;border-radius:18px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.4);font-family:inherit;">'
      +'<div style="font-size:.78rem;color:var(--muted,#667);margin-bottom:4px;">'+esc(n.date)+'</div>'
      +'<h2 style="margin:0 0 12px;">'+esc(n.title)+'</h2>'
      +'<ul style="margin:0 0 16px;padding-left:20px;line-height:1.5;">'+list.map(function(t){ return '<li style="margin-bottom:6px;">'+esc(t)+'</li>'; }).join('')+'</ul>'
      +'<button type="button" id="ceUpdateOk" style="width:100%;">Got it</button></div>';
    document.body.appendChild(o);
    document.getElementById('ceUpdateOk').onclick=function(){ markSeen(n.id); o.remove(); };
  }
  window.ceShowUpdates=function(){ show(NOTES[0],true); };
  var tries=0;
  function tick(){
    if(signedIn()){ if(seenId()!==NOTES[0].id) setTimeout(function(){ show(NOTES[0]); },900); return; }
    if(++tries<120) setTimeout(tick,1000);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',tick); else tick();
})();
