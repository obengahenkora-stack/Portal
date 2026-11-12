/* Student home (v1): notifications, rings, low-attendance alert and service cards.
   It sits on top of the existing tabs. Nothing here changes how a tab works: every card opens through dashTab(). */
(function(){
'use strict';
var ICON={
 trophy:'<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3"/>',
 check:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
 doc:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
 book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M9 7h6"/>',
 cal:'<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4M16 3v4M4 10h16M9 15l2 2 4-4"/>',
 warn:'<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.5"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17v.5"/>',
 bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M10 21a2 2 0 0 0 4 0"/>',
 chat:'<path d="M4 5h16v11H9l-5 4z"/>',
 task:'<path d="M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/>'
};
function svg(k,c,s){ s=s||22; return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="'+c+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+ICON[k]+'</svg>'; }
function $(id){ return document.getElementById(id); }
function esc(t){ return String(t==null?'':t).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function acct(){ try{ if(adminViewing()&&window._adminViewAcct) return window._adminViewAcct; return studentCurrentAccount||null; }catch(e){ return null; } }
function email(){ try{ return String(studentCurrentEmail||'').toLowerCase(); }catch(e){ return ''; } }
function go(id){ try{ if(typeof window.dashTab==='function') window.dashTab(id); }catch(e){ console.warn('stuhome go',e); } }

/* ---------- styles ---------- */
var css=document.createElement('style');
css.textContent=[
'#dashOverviewCard.sh-on>h2,#dashOverviewCard.sh-on #ovClassLine,#dashOverviewCard.sh-on #dashOverview,#dashOverviewCard.sh-on #ovLinks,#dashOverviewCard.sh-on #scoreNotice,#dashOverviewCard.sh-on #attWarn{display:none !important}',
'body.sh-dash #signedInCard,body.sh-dash #editDetailsLink{display:none !important}',
'body.sh-dash .hero:not(#z),body.sh-dash .page-head:not(#z),body.sh-dash #introCard:not(#z){display:none !important}',
'#shPage h2:before,#shPage h2:after,#shHome h1:before,#shHome h1:after{display:none !important;content:none !important}',
'#dashOverviewCard.sh-on{background:transparent !important;border:0 !important;box-shadow:none !important;padding:0 !important}',
'#shHome{display:block}#shHead{display:block;padding-top:14px}',
'#shHome *{box-sizing:border-box}',
'.sh-top{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:0 0 6px}',
'.sh-date{font-size:.82rem;color:var(--muted);margin:0}',
'.sh-hi{font-size:1.65rem;font-weight:800;letter-spacing:-.02em;line-height:1.15;margin:2px 0 0;color:var(--ink)}',
'.sh-av{width:64px;height:78px;flex:none;margin:-6px 0 -8px}.sh-av svg{width:100%;height:100%;overflow:visible}',
'.sh-chips{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 14px}',
'.sh-chips span,.sh-chips button:not(#z){font-size:.78rem !important;font-weight:600 !important;background:var(--tint) !important;color:var(--ink) !important;border:0 !important;border-radius:999px !important;padding:6px 12px !important;width:auto !important;min-width:0 !important;box-shadow:none !important;text-transform:none !important;letter-spacing:0 !important;font-family:inherit !important;line-height:1.2 !important}',
/* notification card */
'.sh-nx{background:#14213d;color:#fff;border-radius:24px;padding:16px 18px;position:relative;overflow:hidden;margin-bottom:14px}',
'.sh-nx:after{content:"";position:absolute;right:-34px;top:-34px;width:120px;height:120px;border-radius:50%;background:rgba(252,163,17,.16);pointer-events:none}',
'.sh-nx .k{color:#fca311;font-weight:700;letter-spacing:.08em;font-size:.68rem;text-transform:uppercase;position:relative;z-index:1}',
'.sh-nx .one{display:flex;gap:12px;align-items:center;margin:12px 0 14px;position:relative;z-index:1}',
'.sh-nx .ic{width:42px;height:42px;border-radius:13px;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;flex:none}',
'.sh-nx .tt{font-size:1rem;font-weight:700;color:#fff;line-height:1.25}.sh-nx .ss{font-size:.78rem;color:#aab4c8;margin-top:2px}',
'.sh-nx .many{display:flex;align-items:center;gap:14px;margin:12px 0 14px;position:relative;z-index:1}',
'.sh-nx .n{font-size:2.6rem;font-weight:800;line-height:1;color:#fff}',
'.sh-nx .stk{display:flex;margin-left:auto}.sh-nx .stk span{width:32px;height:32px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;margin-left:-10px;border:2px solid #14213d}',
'.sh-nx .an{border-top:1px solid rgba(255,255,255,.16);margin-top:14px;padding-top:14px;position:relative;z-index:1;cursor:pointer}.sh-nx .none{margin:10px 0 2px;color:#aab4c8;font-size:.9rem;position:relative;z-index:1}',
'.sh-nx button:not(#z){background:#fca311 !important;color:#14213d !important;border:0 !important;border-radius:13px !important;padding:10px 16px !important;font-weight:800 !important;font-size:.84rem !important;width:auto !important;box-shadow:none !important;text-transform:none !important;letter-spacing:0 !important;position:relative;z-index:1;font-family:inherit !important}',
/* rings */
'.sh-rings{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}',
'.sh-ring{background:var(--card);border:1px solid var(--line);border-radius:22px;padding:14px 8px;text-align:center}',
'.sh-ring .r{width:84px;height:84px;border-radius:50%;margin:0 auto 8px;display:flex;align-items:center;justify-content:center;background:conic-gradient(var(--c,#fca311) calc(var(--p,0)*1%),rgba(127,127,127,.2) 0)}',
'.sh-ring .r u{width:64px;height:64px;border-radius:50%;background:var(--card);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.05rem;color:var(--ink);text-decoration:none}',
'.sh-ring b{display:block;font-size:.84rem;color:var(--ink)}.sh-ring small{display:block;font-size:.74rem;color:var(--muted);margin-top:3px}.sh-ring small.w{color:#b45309;font-weight:700}',
/* alert */
'.sh-al{display:flex;align-items:center;gap:12px;background:var(--card);border:1.5px solid #f3c4c0;border-left:5px solid #e5534b;border-radius:18px;padding:11px 14px;margin:0 0 14px;cursor:pointer;width:100%;text-align:left;font-family:inherit}',
'.sh-al .ic{width:32px;height:32px;border-radius:50%;background:#e5534b;display:flex;align-items:center;justify-content:center;flex:none;animation:shp 2.4s ease-in-out infinite}',
'.sh-al b{display:block;font-size:.92rem;color:var(--ink)}.sh-al small{font-size:.78rem;color:var(--muted)}.sh-al .ch{margin-left:auto;color:var(--muted);font-size:1.4rem}',
'@keyframes shp{50%{transform:scale(1.08)}}',
'@media (prefers-reduced-motion:reduce){.sh-al .ic,.sh-r i{animation:none !important}}',
/* services */
'.sh-h2{font-size:1rem;font-weight:700;margin:6px 2px 10px;color:var(--ink)}',
'.sh-r{display:flex;align-items:center;gap:14px;background:var(--card);border:1px solid var(--line);border-radius:20px;padding:12px 14px 12px 18px;margin:0 0 10px;position:relative;overflow:hidden;cursor:pointer;width:100%;text-align:left;font-family:inherit;color:var(--ink)}',
'.sh-r .st{position:absolute;left:0;top:14px;bottom:14px;width:5px;border-radius:0 4px 4px 0}',
'.sh-r i{width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex:none}',
'.sh-r .tx{flex:1;min-width:0}.sh-r .tx b{display:block;font-size:.95rem;color:var(--ink);line-height:1.2}.sh-r .tx small{display:block;font-size:.78rem;color:var(--muted);margin-top:2px}',
'.sh-r .bd{font-size:.76rem;font-weight:800;border-radius:999px;padding:5px 10px;white-space:nowrap}',
'.sh-foot{font-size:.78rem;color:var(--muted);text-align:center;margin:14px 0 4px}.sh-foot button:not(#z){background:none !important;border:0 !important;color:var(--ink) !important;font-weight:700 !important;padding:0 !important;width:auto !important;text-decoration:underline;font-size:.78rem !important;box-shadow:none !important;text-transform:none !important;letter-spacing:0 !important;font-family:inherit !important}',
/* switch inside merged tabs */
'.sh-seg{display:flex;gap:6px;background:var(--tint);border-radius:999px;padding:4px;margin:0 0 14px}',
'.sh-seg button:not(#z){flex:1;background:transparent !important;color:var(--muted) !important;border:0 !important;border-radius:999px !important;padding:9px 10px !important;font-size:.84rem !important;font-weight:700 !important;width:auto !important;box-shadow:none !important;text-transform:none !important;letter-spacing:0 !important;font-family:inherit !important}',
'.sh-seg button.on:not(#z){background:var(--card) !important;color:var(--ink) !important;box-shadow:0 2px 8px rgba(0,0,0,.12) !important}',
/* notifications page */
'#shPage{position:fixed;inset:0;z-index:99990;background:var(--bg,#fbfaf7);overflow-y:auto;-webkit-overflow-scrolling:touch}',
'#shPage .in{max-width:640px;margin:0 auto;padding:18px 16px 40px}',
'#shPage .hd{display:flex;align-items:center;gap:10px;margin-bottom:14px}#shPage .hd h2{flex:1;margin:0;font-size:1.3rem}',
'#shPage .hd button:not(#z){width:auto !important;background:transparent !important;border:0 !important;box-shadow:none !important;padding:6px 8px !important;color:var(--ink) !important;font-weight:700 !important;font-size:.84rem !important;text-transform:none !important;letter-spacing:0 !important;font-family:inherit !important}',
'#shPage .sec{font-size:.7rem;font-weight:800;color:var(--muted);letter-spacing:.08em;margin:14px 2px 8px;text-transform:uppercase}',
'#shPage .it{display:flex;gap:12px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:18px;padding:13px 14px 13px 20px;margin-bottom:10px;position:relative;cursor:pointer;width:100%;text-align:left;font-family:inherit;color:var(--ink)}',
'#shPage .it.rd{opacity:.65}#shPage .it .dot{position:absolute;left:7px;top:50%;width:8px;height:8px;margin-top:-4px;border-radius:50%;background:#fca311}',
'#shPage .it .ic{width:42px;height:42px;border-radius:13px;display:flex;align-items:center;justify-content:center;flex:none}',
'#shPage .it .tx{flex:1;min-width:0}#shPage .it b{display:block;font-size:.92rem}#shPage .it small{display:block;font-size:.78rem;color:var(--muted);margin-top:2px}#shPage .it .to{color:#1d6a8a;font-weight:700}#shPage .it .ch{color:var(--muted);font-size:1.4rem}',
'#shPage .empty{padding:26px 10px;text-align:center;color:var(--muted)}'
].join('\n');
document.head.appendChild(css);

/* ---------- storage: notifications ---------- */
var STORE=null;
function skey(){ return 'ceNotif_'+email(); }
function load(){ if(STORE&&STORE.__e===email()) return STORE; var o=null; try{ o=JSON.parse(localStorage.getItem(skey())||'null'); }catch(e){}
  if(!o||typeof o!=='object') o={}; o.seen=o.seen||{}; o.base=o.base||{}; o.list=Array.isArray(o.list)?o.list:[]; o.__e=email(); STORE=o; return o; }
function save(){ if(!STORE) return; var c={seen:STORE.seen,base:STORE.base,list:STORE.list}; try{ localStorage.setItem(skey(),JSON.stringify(c)); }catch(e){} }
function absorb(src,items){ /* items: [{k,title,sub,go,ic}] */
  var s=load(); if(!email()) return;
  if(!s.base[src]){ s.base[src]=1; items.forEach(function(x){ s.seen[x.k]=1; }); save(); return; }
  var add=0; items.forEach(function(x){ if(s.seen[x.k]) return; s.seen[x.k]=1; s.list.unshift({k:x.k,title:x.title,sub:x.sub,go:x.go,ic:x.ic,t:Date.now(),read:false}); add++; });
  if(add){ var cut=Date.now()-14*864e5; s.list=s.list.filter(function(n){ return !n.read||n.t>cut; }).slice(0,40); save(); renderNotif(); }
}
function ago(t){ var m=Math.max(0,Math.round((Date.now()-t)/60000)); if(m<1) return 'just now'; if(m<60) return m+' min ago'; var h=Math.round(m/60); if(h<24) return h+' h ago'; var d=Math.round(h/24); return d+' d ago'; }
function fdt(s){ try{ var d=new Date(s); if(isNaN(d)) return ''; return d.toLocaleDateString('en-GB',{day:'numeric',month:'short'}); }catch(e){ return ''; } }
var IC={score:['trophy','#d4a017','#fff1d6'],excuse:['cal','#16a085','#e1f4e6'],exam:['doc','#7b5cd6','#ece8fa'],asg:['task','#7b5cd6','#ece8fa'],report:['chat','#3a86c8','#e3f1f6']};

/* ---------- state ---------- */
var low=[], exams=[], asg=[], ready=false;

/* ---------- build ---------- */
function build(){
  var ov=$('dashOverviewCard'); if(!ov||$('shHome')) return;
  var h=document.createElement('div'); h.id='shHome';
  h.innerHTML='<div id="shNx" class="sh-nx"></div>'
   +'<div class="sh-rings"><div class="sh-ring"><div class="r" id="shRa"><u id="shRaV">–</u></div><b>Overall attendance</b><small id="shRaS"></small></div><div class="sh-ring"><div class="r" id="shRs" style="--c:#1d6a8a"><u id="shRsV">–</u></div><b>Average score</b><small id="shRsS"></small></div></div>'
   +'<div id="shAl"></div>'
   +'<div class="sh-h2">All services</div><div id="shSv"></div>'
   +'<div class="sh-foot" id="shFoot"></div>';
  ov.insertBefore(h,ov.firstChild);
  var rs0=$('dashResults'), hd=document.createElement('div'); hd.id='shHead';
  hd.innerHTML='<div class="sh-top"><div><p class="sh-date" id="shDate"></p><h1 class="sh-hi" id="shHi"></h1></div><div class="sh-av" id="shAv"></div></div><div class="sh-chips" id="shChips"></div>';
  if(rs0) rs0.insertBefore(hd,rs0.firstChild);
  hd.addEventListener('click',function(e){ if(e.target.closest('[data-prof]')){ try{ toggleProfileSection(); var p=$('profileSection'); if(p) p.scrollIntoView({behavior:'smooth',block:'start'}); }catch(x){} } if(e.target.closest('[data-out]')){ try{ localStorage.removeItem('ceStuHome'); }catch(y){} try{ studentSignOut(); }catch(x){} } });
  $('shNx').addEventListener('click',function(e){ if(e.target.closest('[data-an]')){ try{ window._ceAnnOpen&&window._ceAnnOpen(); }catch(x){} go('dashLectureHall'); return; } if(e.target.closest('button')) openPage(); });
  $('shSv').addEventListener('click',function(e){ var b=e.target.closest('[data-g]'); if(b) go(b.getAttribute('data-g')); });
  $('shAl').addEventListener('click',function(e){ if(e.target.closest('[data-g]')) go('dashAttCard'); });
  $('shFoot').addEventListener('click',function(e){ if(e.target.closest('[data-back]')){ try{ hideAdminViewedStudent(); }catch(x){} try{ window.scrollTo({top:0,behavior:'smooth'}); }catch(y){} return; } if(e.target.closest('[data-out]')){ try{ localStorage.removeItem('ceStuHome'); }catch(y){} try{ studentSignOut(); }catch(x){} } });
  /* keep announcements at the top, right under the notifications */
  new MutationObserver(function(){ var a=$('annHome'),nx=$('shNx'); if(a&&nx&&a.previousElementSibling!==nx) nx.after(a); }).observe(ov,{childList:true});
  /* mirror numbers that the existing code already fills in */
  ['ovAvgScore','ovAttendance','ovsScores','ovsAtt','ovsRep','ovReports'].forEach(function(id){ var e=$(id); if(e) new MutationObserver(paint).observe(e,{childList:true,characterData:true,subtree:true}); });
  ['dashScores','dashReports','dashAttendance'].forEach(function(id){ var e=$(id); if(e) new MutationObserver(function(){ clearTimeout(build._t); build._t=setTimeout(function(){ scanDom(); paint(); },120); }).observe(e,{childList:true,subtree:true}); });
  ov.addEventListener('keydown',function(e){ if((e.key==='Enter'||e.key===' ')&&e.target.getAttribute&&e.target.getAttribute('role')==='button'){ e.preventDefault(); e.target.click(); } });
  seg();
  ready=true; paint();
}
function seg(){
  function mk(cardId,pairs,cur){ var c=$(cardId); if(!c||c.querySelector('.sh-seg')) return; var d=document.createElement('div'); d.className='sh-seg';
    d.innerHTML=pairs.map(function(p){ return '<button type="button" data-g="'+p[0]+'" class="'+(p[0]===cur?'on':'')+'">'+p[1]+'</button>'; }).join('');
    d.addEventListener('click',function(e){ var b=e.target.closest('[data-g]'); if(b&&b.getAttribute('data-g')!==cur) go(b.getAttribute('data-g')); });
    c.insertBefore(d,c.firstChild); }
  var A=[['dashAssignCard','Assignments'],['dashExamCard','Exams']], R=[['dashReportsCard','My reports'],['dashIssueCard','Report an issue']];
  mk('dashAssignCard',A,'dashAssignCard'); mk('dashExamCard',A,'dashExamCard'); mk('dashReportsCard',R,'dashReportsCard'); mk('dashIssueCard',R,'dashIssueCard');
}

/* ---------- paint ---------- */
function num(id){ var e=$(id); var t=e?String(e.textContent||'').trim():''; var v=parseFloat(t); return isNaN(v)?null:v; }
function txt(id){ var e=$(id); return e?String(e.textContent||'').trim():''; }
function paint(){
  if(!$('shHome')) return;
  var a=acct(), nm=(a&&a.name)?String(a.name).trim().split(/\s+/)[0]:'';
  var hr=new Date().getHours(), gr=hr<12?'Good morning':(hr<17?'Good afternoon':'Good evening');
  $('shDate').textContent=new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'});
  $('shHi').textContent=gr+(nm?', '+nm:'');
  var av=$('shAv'); var g=a&&a.gender; var want=g==='Female'?'F':(g==='Male'?'M':'');
  if(av.getAttribute('data-g')!==want){ av.setAttribute('data-g',want); try{ av.innerHTML=want==='F'?_AV_F:(want==='M'?_AV_M:''); }catch(e){ av.innerHTML=''; } av.style.display=want?'':'none'; }
  var ch=[]; if(a&&a.indexNumber) ch.push('<span>'+esc(a.indexNumber)+'</span>'); if(a&&a.level) ch.push('<span>Level '+esc(a.level)+'</span>'); if(!adminViewing()){ ch.push('<button type="button" data-prof="1">My Profile &rsaquo;</button>'); ch.push('<button type="button" data-out="1">Sign out</button>'); }
  $('shChips').innerHTML=ch.join('');
  /* rings */
  var at=num('ovAttendance'), sc=num('ovAvgScore');
  var ra=$('shRa'); ra.style.setProperty('--p',at==null?0:Math.max(0,Math.min(100,at))); $('shRaV').textContent=at==null?'–':Math.round(at)+'%';
  $('shRaS').className=(at!=null&&at<75)?'w':''; $('shRaS').textContent=at==null?'No attendance yet':(at<75?'Below 75%':'On track');
  var rs=$('shRs'); rs.style.setProperty('--p',sc==null?0:Math.max(0,Math.min(100,sc))); $('shRsV').textContent=sc==null?'–':String(sc);
  $('shRsS').textContent=txt('ovsScores')||'';
  /* alert */
  var al=$('shAl');
  if(low&&low.length){ al.innerHTML='<div role="button" tabindex="0" class="sh-al" data-g="dashAttCard"><span class="ic">'+svg('bell','#fff',18)+'</span><span><b>Low attendance</b><small>Below 75% in '+low.length+' course'+(low.length>1?'s':'')+'. Tap to check.</small></span><span class="ch">&rsaquo;</span></div>'; }
  else al.innerHTML='';
  /* services */
  var open=0, now=Date.now();
  try{ exams.forEach(function(x){ var st=Date.parse(x.start), en=Date.parse(x.end); if(x.state!=='submitted'&&now>=st&&now<=en) open++; }); }catch(e){}
  try{ asg.forEach(function(x){ if(!x.sub&&Date.parse(x.due)+(x.allowLate?1e12:0)>now) open++; }); }catch(e){}
  var rep=document.querySelectorAll('#dashReports .report-reply').length;
  var S=[
   ['dashLectureHall','book','#3a86c8','#e3f1f6','Lecture Hall',txt('ovsHall')||'Notes, videos and syllabus',''],
   ['dashScoresCard','trophy','#d4a017','#fff1d6','My Scores',txt('ovsScores')||'View your results',sc==null?'':String(sc)],
   ['dashAttCard','check','#16a085','#e1f4e6','My Attendance',txt('ovsAtt')||'View your attendance',at==null?'':Math.round(at)+'%'],
   ['dashAssignCard','doc','#7b5cd6','#ece8fa','Assignments &amp; Exams','Coursework and online exams',open?open+' open':''],
   ['dashExcuseCard','cal','#5d6d7e','#e8eef3','Absence Excuse','Tell your lecturer why you missed class',''],
   ['dashReportsCard','warn','#e0752b','#fdeadb','Reports',txt('ovsRep')||'Report an issue, see replies',rep?rep+' repl'+(rep>1?'ies':'y'):''],
   ['dashQaCard','help','#c0457a','#fbe3ee','Q&amp;A Board','Ask and answer questions','']
  ];
  $('shSv').innerHTML=S.map(function(r){ return '<div role="button" tabindex="0" class="sh-r" data-g="'+r[0]+'"><span class="st" style="background:'+r[2]+'"></span><i style="background:'+r[2]+'24">'+svg(r[1],r[2],24)+'</i><span class="tx"><b>'+r[4]+'</b><small>'+esc(r[5])+'</small></span>'+(r[6]?'<span class="bd" style="background:'+r[2]+'24;color:'+r[2]+'">'+esc(r[6])+'</span>':'')+'</div>'; }).join('');
  var who=(a&&a.name)||txt('studentWhoAmI');
  $('shFoot').innerHTML=adminViewing()?'<button type="button" data-back="1">Back to list</button>':'<button type="button" data-out="1">Sign out</button>';
  renderNotif();
}
function unread(){ return load().list.filter(function(n){ return !n.read; }); }
function annInBox(){
  var box=$('shNx'); var L=window._ceAnnList; if(!box||!L||!L.length||adminViewing()) return;
  var fd=function(t){ try{ return new Date(t).toLocaleDateString(undefined,{day:'numeric',month:'short'}); }catch(e){ return ''; } };
  var n0=box.querySelector('.none'); if(n0) n0.remove();
  var a=L[0], ttl=L.length===1?'New announcement':(L.length+' new announcements');
  box.insertAdjacentHTML('beforeend','<div class="an" data-an="1"><div class="one" style="margin:0 0 12px"><span class="ic">'+svg('chat','#ffd166',22)+'</span><div><div class="tt">'+ttl+'</div><div class="ss">'+esc(a.course||'')+' &middot; '+fd(a.t)+'</div></div></div><button type="button" data-anopen="1">Open announcement'+(L.length>1?'s':'')+'</button></div>');
}
function renderNotif(){ renderNotif0(); try{ annInBox(); }catch(e){} }
window.shRenderAnn=function(){ if($('shNx')) renderNotif(); };
function renderNotif0(){
  var box=$('shNx'); if(!box) return;
  if(adminViewing()){ box.innerHTML='<div class="k">Owner view</div><div class="none">You are looking at this student\'s dashboard, read-only.</div><div style="height:6px"></div>'; return; }
  var u=unread(), all=load().list;
  if(!u.length){ box.innerHTML='<div class="k">Notifications</div><div class="none">You are all caught up.</div>'+(all.length?'<button type="button" style="margin-top:10px">See earlier notifications</button>':'<div style="height:6px"></div>'); return; }
  if(u.length===1){ var n=u[0], m=IC[n.ic]||IC.score;
    box.innerHTML='<div class="k">New notification</div><div class="one"><span class="ic">'+svg(m[0],'#ffd166',22)+'</span><div><div class="tt">'+esc(n.title)+'</div><div class="ss">'+esc(n.sub)+' &middot; '+ago(n.t)+'</div></div></div><button type="button">Open notification</button>'; return; }
  var icons={}, st=''; u.forEach(function(n){ if(!icons[n.ic]&&Object.keys(icons).length<3){ icons[n.ic]=1; var m=IC[n.ic]||IC.score; st+='<span>'+svg(m[0],m[1],18)+'</span>'; } });
  box.innerHTML='<div class="k">Notifications</div><div class="many"><span class="n">'+u.length+'</span><div><div class="tt">New notifications</div><div class="ss">Tap below to see them</div></div><div class="stk">'+st+'</div></div><button type="button">See all notifications</button>';
}

/* ---------- notifications page ---------- */
function openPage(){
  closePage(); var s=load(), u=s.list.filter(function(n){ return !n.read; }), r=s.list.filter(function(n){ return n.read; });
  var p=document.createElement('div'); p.id='shPage';
  function row(n){ var m=IC[n.ic]||IC.score; return '<div role="button" tabindex="0" class="it'+(n.read?' rd':'')+'" data-k="'+esc(n.k)+'">'+(n.read?'':'<span class="dot"></span>')+'<span class="ic" style="background:'+m[1]+'24">'+svg(m[0],m[1],22)+'</span><span class="tx"><b>'+esc(n.title)+'</b><small>'+esc(n.sub)+' &middot; '+ago(n.t)+'</small></span><span class="ch">&rsaquo;</span></div>'; }
  p.innerHTML='<div class="in"><div class="hd"><button type="button" data-x="1" aria-label="Back">&lsaquo; Back</button><h2>Notifications</h2>'+(u.length?'<button type="button" data-all="1">Mark all read</button>':'')+'</div>'
   +(u.length?'<div class="sec">New</div>'+u.map(row).join(''):'')
   +(r.length?'<div class="sec">Earlier</div>'+r.map(row).join(''):'')
   +((!u.length&&!r.length)?'<div class="empty">Nothing here yet. New scores, excuse decisions, exams, assignments and report replies will show up here.</div>':'')+'</div>';
  p.addEventListener('click',function(e){
    if(e.target.closest('[data-x]')){ closePage(); return; }
    if(e.target.closest('[data-all]')){ var st=load(); st.list.forEach(function(n){ n.read=true; }); save(); renderNotif(); openPage(); return; }
    var b=e.target.closest('[data-k]'); if(!b) return;
    var st2=load(), n=null; st2.list.forEach(function(x){ if(x.k===b.getAttribute('data-k')) n=x; });
    if(n){ n.read=true; save(); renderNotif(); closePage(); go(n.go||'dashOverviewCard'); }
  });
  p.addEventListener('keydown',function(e){ if((e.key==='Enter'||e.key===' ')&&e.target.getAttribute&&e.target.getAttribute('role')==='button'){ e.preventDefault(); e.target.click(); } });
  document.body.appendChild(p); document.body.style.overflow='hidden'; p.scrollTop=0;
  document.addEventListener('keydown',escKey);
}
function escKey(e){ if(e.key==='Escape') closePage(); }
function closePage(){ var p=$('shPage'); if(p) p.remove(); document.body.style.overflow=''; document.removeEventListener('keydown',escKey); }

/* ---------- data: what is new ---------- */
function scanDom(){
  if(!email()) return;
  try{ var box=$('dashScores'), rows=box?box.querySelectorAll('table tr'):[], items=[];
    if(rows.length||(box&&/No scores found/i.test(box.textContent||''))){
      rows.forEach(function(tr){ var td=tr.querySelectorAll('td'); if(td.length<4) return; var c=td[0].textContent.trim(), a=td[2].textContent.trim(), s=td[3].textContent.trim();
        items.push({k:'score:'+c+'|'+a+'|'+s,title:'New score posted',sub:c+' · '+a,go:'dashScoresCard',ic:'score'}); });
      absorb('scores',items); } }catch(e){ console.warn('scan scores',e); }
  try{ var rb=$('dashReports'), ri=rb?rb.querySelectorAll('.report-item'):[], it2=[];
    if(ri.length||(rb&&/No issue reports/i.test(rb.textContent||''))){
      ri.forEach(function(el){ var rp=el.querySelector('.report-reply'); if(!rp) return; var c=(el.querySelector('.report-course')||{}).textContent||'', t=rp.textContent||'';
        it2.push({k:'rep:'+c+'|'+t.slice(0,80),title:'Reply to your report',sub:c.trim(),go:'dashReportsCard',ic:'report'}); });
      absorb('reports',it2); } }catch(e){ console.warn('scan reports',e); }
}
async function fetchAll(){
  if(adminViewing()){ exams=[]; asg=[]; return; }
  if(!email()||typeof _stu!=='function') return;
  try{ var j=await _stu({action:'stu_oe_list'}); var l=(j&&j.exams)||[]; exams=l; var it=[];
    l.forEach(function(x){ var id=x.id||(x.title+'|'+x.start); if(x.state!=='submitted') it.push({k:'exam:'+id,title:'New exam: '+x.title,sub:(x.course||'')+' · opens '+fdt(x.start),go:'dashExamCard',ic:'exam'});
      if(x.result) it.push({k:'examres:'+id,title:'Exam score released',sub:(x.title||'')+' · '+x.result.score+' / '+(x.result.max||x.result.total||''),go:'dashExamCard',ic:'exam'}); });
    absorb('exams',it); }catch(e){}
  try{ var a=await _stu({action:'stu_as_list'}); var l2=(a&&a.items)||[]; asg=l2; var it3=[];
    l2.forEach(function(x){ it3.push({k:'asg:'+x.id,title:'New assignment',sub:(x.title||'')+' · '+(x.course||'')+' · due '+fdt(x.due),go:'dashAssignCard',ic:'asg'});
      if(x.result) it3.push({k:'asgres:'+x.id,title:'Assignment marked',sub:(x.title||'')+' · '+x.result.grade+' / '+x.result.max,go:'dashAssignCard',ic:'asg'}); });
    absorb('assign',it3); }catch(e){}
  try{ var e2=await _stu({action:'stu_exc_mine'}); var l3=(e2&&e2.list)||[]; var it4=[];
    l3.forEach(function(x){ if(x.status==='approved'||x.status==='declined') it4.push({k:'exc:'+x.id+':'+x.status,title:'Absence excuse '+x.status,sub:(x.course||'')+' · '+fdt(x.date),go:'dashExcuseCard',ic:'excuse'}); });
    absorb('excuse',it4); }catch(e){}
  paint();
}

/* ---------- show / hide logic ---------- */
function adminViewing(){ var w=$('adminHideResultsWrap'); return !!(w&&!w.classList.contains('hidden')); }
function sync(){
  try{ document.documentElement.classList.toggle('ah-view',adminViewing()); }catch(e){}
  var r=$('dashResults'), ov=$('dashOverviewCard');
  var shown=!!(r&&!r.classList.contains('hidden')&&ov);
  if(shown&&!$('shHome')) build();
  if(ov) ov.classList.toggle('sh-on',shown);
  var hh=$('shHead'); if(hh) hh.style.display=shown?'':'none';
  var ahub=$('adminHub'); if(ahub&&!ahub.classList.contains('hidden')){ document.documentElement.classList.remove('sh-pre'); try{ localStorage.removeItem('ceStuHome'); }catch(e){} }
  var au=$('studentAuthCard'); if(shown){ try{ localStorage.setItem('ceStuHome','1'); }catch(e){} document.documentElement.classList.remove('sh-pre'); } else if(au&&!au.classList.contains('hidden')&&getComputedStyle(au).display!=='none'&&document.documentElement.classList.contains('sh-pre')&&!ready){ /* keep holding: sign-in card is hidden by sh-pre until the timer ends */ }
  document.body.classList.toggle('sh-dash',!!shown);
  document.body.classList.toggle('sh-on',!!(shown&&ov&&!ov.classList.contains('pane-off')));
  if(shown&&!sync._f){ sync._f=1; setTimeout(fetchAll,800); }
}
var _lastFetch=0;
function tick(){ if(document.hidden) return; var ov=$('dashOverviewCard'); if($('shHome')&&ov&&!ov.classList.contains('pane-off')&&Date.now()-_lastFetch>300000){ _lastFetch=Date.now(); fetchAll(); } }

window.shAdminSync=function(){ try{ sync(); if($('shHome')){ exams=[]; asg=[]; paint(); } }catch(e){} };
/* take over the old attendance warning: same numbers, new look, cannot be hidden by "Got it" */
(function(){ window.showAttWarn=function(l){ low=Array.isArray(l)?l:[]; try{ paint(); }catch(e){} }; })();

document.addEventListener('DOMContentLoaded',function(){
  var r=$('dashResults'), ov=$('dashOverviewCard'), ah=$('adminHideResultsWrap');
  var mo=new MutationObserver(sync);
  if(r) mo.observe(r,{attributes:true,attributeFilter:['class']});
  if(ov) mo.observe(ov,{attributes:true,attributeFilter:['class']});
  if(ah) mo.observe(ah,{attributes:true,attributeFilter:['class']});
  sync(); setInterval(tick,30000);
  document.addEventListener('visibilitychange',function(){ if(!document.hidden){ _lastFetch=0; tick(); } });
});
})();
