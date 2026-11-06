/* What's new: shown once per update, after sign-in. To announce something new, add a note at the TOP of NOTES with a new id. */
(function(){
  var NOTES=[
    { id:'2026-11-06', date:'6 Nov 2026', title:'What is new',
      all:[],
      student:[
        'Choose your class (A, B or C) the first time you sign in. Your attendance list is set up from it.',
        'Your scores now show what each assessment was marked out of, for example 5 / 10.',
        'Your Overview shows your confirmed class and the lists you are on.'
      ],
      staff:[
        'Class List from Sign-ups builds A, B and C attendance lists straight from registered students.',
        'Connect lists you already uploaded, so students who pick a class are added or moved automatically.',
        'Class Check shows each student’s list class next to the class they confirmed.',
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
