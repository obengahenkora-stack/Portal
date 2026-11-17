/* Online exam review: results, photos, marking (staff). */
(function(){
function $(i){return document.getElementById(i);}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function tm(t){try{return new Date(t).toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'});}catch(e){return t||'';}}
var css=document.createElement('style');
css.textContent='#onlineExamCard .rvf{border-bottom:1px solid var(--line);padding:9px 0}#onlineExamCard .rvf:last-child{border:0}#onlineExamCard .rvf-b{display:flex;gap:6px;margin-top:7px;flex-wrap:wrap}#onlineExamCard .rvf-c{background:#fee2e2;border-color:#fca5a5;color:#991b1b}#onlineExamCard .rvf-d{background:#dcfce7;border-color:#86efac;color:#166534}'
+'#onlineExamCard .rv-t{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:12px 0}#onlineExamCard .rv-t div{border:1px solid var(--line);border-radius:12px;padding:10px;text-align:center;background:var(--card)}#onlineExamCard .rv-t b{display:block;font-size:1.25rem}#onlineExamCard .rv-t span{font-size:.7rem;color:var(--muted);font-weight:600}'
+'#onlineExamCard .rv-r{border:1px solid var(--line);border-radius:14px;padding:11px 12px;margin-top:8px;background:var(--card);cursor:pointer}#onlineExamCard .rv-r .n{font-weight:700;overflow-wrap:anywhere}#onlineExamCard .rv-r .s{font-size:.76rem;color:var(--muted);margin-top:2px}'
+'#onlineExamCard .rv-p{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:8px}#onlineExamCard .rv-p img{width:100%;border-radius:8px;display:block;cursor:pointer}#onlineExamCard .rv-p .f img{outline:3px solid #dc2626}#onlineExamCard .rv-p small{display:block;font-size:.62rem;color:var(--muted);text-align:center}#onlineExamCard .rv-p .f small{color:#dc2626;font-weight:700}'
+'#onlineExamCard .rv-q{border:1px solid var(--line);border-radius:14px;padding:12px;margin-top:10px;background:var(--card)}#onlineExamCard .rv-ok{color:#15803d;font-weight:700}#onlineExamCard .rv-no{color:#dc2626;font-weight:700}'
+'#onlineExamCard .rv-warn{border:1px solid #d97706;background:rgba(217,119,6,.12);border-radius:12px;padding:10px;margin-top:12px;font-size:.84rem}'
+'#onlineExamCard .rv-lv{display:inline-block;color:#fff;border-radius:999px;font-size:.68rem;font-weight:700;padding:2px 9px;margin:5px 5px 0 0}#onlineExamCard .rv-lr{display:flex;justify-content:space-between;align-items:center;padding:3px 0;border-bottom:1px solid var(--line)}#onlineExamCard .rv-lr b{font-size:1.05rem}'
+'#rvBig{position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:99999;display:flex;align-items:center;justify-content:center;padding:14px}#rvBig img{max-width:100%;max-height:100%;border-radius:10px}';
css.textContent+='#onlineExamCard .rvh-seg{display:flex;background:rgba(15,118,110,.10);border-radius:14px;padding:4px;margin:12px 0}#onlineExamCard .rvh-seg button{flex:1;border:0;background:transparent;padding:10px 6px;border-radius:11px;font:700 .88rem inherit;font-family:inherit;color:var(--muted);cursor:pointer}#onlineExamCard .rvh-seg button.on{background:var(--card);color:var(--ink);box-shadow:0 1px 4px rgba(11,42,58,.18)}'
+'#onlineExamCard .rvh-k{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:0 0 4px}#onlineExamCard .rvh-k div{border:1px solid var(--line);border-radius:14px;padding:11px 6px;text-align:center;background:var(--card)}#onlineExamCard .rvh-k b{display:block;font:700 1.35rem/1 Georgia,serif}#onlineExamCard .rvh-k span{font-size:.72rem;color:var(--muted)}'
+'#onlineExamCard .rvh-bar{display:flex;height:14px;border-radius:99px;overflow:hidden;margin:10px 0 12px;background:#d8e8e3}#onlineExamCard .rvh-bar i{display:block;height:100%}'
+'#onlineExamCard .rvh-leg{display:grid;grid-template-columns:1fr 1fr;gap:9px 16px;font-size:.82rem}#onlineExamCard .rvh-leg div{display:flex;align-items:center;gap:7px}#onlineExamCard .rvh-leg b{margin-left:auto}#onlineExamCard .rvh-d{width:10px;height:10px;border-radius:50%;display:inline-block;flex:0 0 10px}'
+'#onlineExamCard .rvh-row{display:flex;align-items:center;gap:10px;border:1px solid var(--line);border-radius:14px;background:var(--card);padding:10px 12px;margin-top:8px;cursor:pointer}#onlineExamCard .rvh-row .m{flex:1;min-width:0}#onlineExamCard .rvh-row .n{font-weight:700;font-size:.92rem;overflow-wrap:anywhere}#onlineExamCard .rvh-row .s{font-size:.74rem;color:var(--muted);margin-top:2px}#onlineExamCard .rvh-row .sc{font:700 1rem Georgia,serif;white-space:nowrap}#onlineExamCard .rvh-row .sc small{font:.72rem sans-serif;color:var(--muted)}'
+'#onlineExamCard .rvh-act{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}';
document.head.appendChild(css);
var X=null, D=null, SN=[];
function msg(h){var m=$('oeMsg'); if(m) m.innerHTML=h||'';}
async function api(o){var r=await teamApi(o); if(!r||!r.ok) throw new Error((r&&r.error)||'Failed'); return r;}
window.oeBanner=function(list){ // called from list: old photos reminder
  var old=(list||[]).filter(function(x){return x.hasPhotos && x.end && (Date.now()-new Date(x.end).getTime())>14*86400000;});
  if(!old.length) return '';
  return '<div class="rv-warn"><b>Photo clean-up reminder.</b> Exam photos for '+old.map(function(x){return esc(x.title);}).join(', ')+' are more than 14 days old. Open Results and tap "Delete photos" once you have finished reviewing, to free storage.</div>';
};
var RV=null, LVN={VS:'Very serious',S:'Serious',H:'High',M:'Medium',L:'Low'}, LVC={VS:'#7f1d1d',S:'#dc2626',H:'#ea580c',M:'#d97706',L:'#6b7280'};
function eff(r){ return (r.final!=null)?r.final:((r.mcq||0)+r.written); }
function rnd(x){ return Math.round(x*10)/10; }
function lvTag(l){ return l?'<span class="rv-lv" style="background:'+LVC[l]+'">'+LVN[l]+'</span>':''; }
var RAWLV={phone_seen:'VS',other_device:'VS',multi_face:'S',leave:'S',fullscreen_exit:'S',head_turn:'H',face_changed:'H',camera_off:'M',no_face:'L',flash:'L',guard_pause:'M',network_change:'L',recheck_failed:'M'};
function lvLive(kinds,kc){ var best='',o=['VS','S','H','M','L'],n=0; Object.keys(kinds||{}).forEach(function(k){ var l=RAWLV[k]; if(!l) return; var dis=((kc||{})[k]||[0,0])[1]||0, left=(kinds[k]||0)-dis; if(left>0){ n+=left; if(!best||o.indexOf(l)<o.indexOf(best)) best=l; } });
  /* repeat escalation: 3 or more flags move a student up one level, 6 or more up two; never above Serious, and Very serious is only for a phone or another device */
  if(best && best!=='VS' && best!=='S'){ var up=n>=6?2:(n>=3?1:0), i=o.indexOf(best); best=o[Math.max(1,i-up)]; }
  return best; }
function rawLv(r){ var best='',o=['VS','S','H','M','L']; Object.keys(r.kinds||{}).forEach(function(k){ var l=RAWLV[k]; if(l&&(!best||o.indexOf(l)<o.indexOf(best))) best=l; }); return best; }
function stTag(r){ if(r.st==='toreview') return '<span class="rv-lv" style="background:#94a3b8">To review</span>'; if(r.st==='cleared') return '<span class="rv-lv" style="background:#16a34a">Cleared</span>'; return ''; }
function propTag(p){ return p==='cancel'?'<span class="rv-lv" style="background:#111">Proposed for cancellation</span>':(p==='review'?'<span class="rv-lv" style="background:#7c3aed">Needs review</span>':''); }
function mergeRv(){
  if(!RV||!D) return;
  var by={}; RV.rows.forEach(function(x){ if(x.email) by['e:'+x.email]=x; if(x.index) by['i:'+String(x.index).toLowerCase()]=x; });
  D.rows.forEach(function(r){ var x=by['e:'+String(r.email||'').toLowerCase()]||by['i:'+String(r.index||'').toLowerCase()]; r.lv=x?lvLive(x.kinds,x.kc):''; r.prop=x?x.proposal:''; r.final=(x&&x.final!=null)?x.final:null; r.reason=x?x.reason:''; r.kinds=x?x.kinds:{}; r.st=x?(x.status||'none'):'none'; r.nf=x?(x.nflags||0):0; r.nc=x?(x.nconf||0):0; r.nd=x?(x.ndis||0):0; r.vd=x?(x.verdicts||{}):{}; r.pz=x?(x.pauses||0):0; r.fs=x?(x.fast||0):0; r.tm=x?(x.timed||0):0; r.sh=x?(x.shared||0):0; r.kc=x?(x.kc||{}):{}; r.vv=x?!!x.viva:false; });
}
function stats(){
  var rows=D.rows, sub=rows.filter(function(r){return r.submittedAt;}), sc=sub.map(eff).sort(function(a,b){return a-b;}), n=sc.length;
  var sum=sc.reduce(function(a,b){return a+b;},0), med=n?(n%2?sc[(n-1)/2]:(sc[n/2-1]+sc[n/2])/2):0, tot=rows.length?rows[0].total:0;
  var lv={VS:0,S:0,H:0,M:0,L:0,none:0}, st={none:0,toreview:0,cleared:0,confirmed:0}, bands=[0,0,0,0,0], cancel=0, review=0, anyFlag=0;
  sub.forEach(function(r){ lv[r.lv||'none']++; st[r.st||'none']=(st[r.st||'none']||0)+1; if(r.prop==='cancel') cancel++; else if(r.prop==='review') review++; if(r.lv||(r.why&&r.why.length)||r.flags>0||r.leaves>0) anyFlag++; });
  if(tot>0) sc.forEach(function(s){ bands[Math.min(4,Math.floor(s/tot*5))]++; });
  return {sub:n, expected:rows.length+D.missing.length, missing:D.missing.length, avg:n?sum/n:0, med:med, hi:n?sc[n-1]:0, lo:n?sc[0]:0, tot:tot, lv:lv, st:st, bands:bands, cancel:cancel, review:review, anyFlag:anyFlag, pend:rows.filter(function(r){return r.submittedAt&&r.pending>0;}).length};
}
window.oeResults=async function(id){
  var box=$('oeBody'); box.innerHTML='<div class="empty">Loading results...</div>';
  try{ D=await api({action:'oe_results',id:id}); }catch(e){ box.innerHTML='<div class="empty">Could not load ('+esc(e.message)+')</div><button type="button" class="oe-btn s" onclick="oeInit()">Back</button>'; return; }
  if(window.__rvId!==id){ TAB='ov'; window.__rvId=id; }
  RV=null; try{ RV=await api({action:'rv_summary',id:id}); }catch(e){ RV=null; }
  mergeRv(); oeRender();
  if(!RV) msg('<div class="rv-warn">Flag levels could not be loaded just now. Marks and photos still work. Open Results again to try once more.</div>');
};
var TAB='ov';
var LVT=0;
window.oeTab=function(t){ TAB=t; clearInterval(LVT); LVT=0; oeRender(); if(t==='lv'){ oeLive(); LVT=setInterval(oeLive,15000); } };
async function oeLive(){ var b=$('rvLive'); if(!b||TAB!=='lv'){ clearInterval(LVT); LVT=0; return; }
  try{ var j=await api({action:'rv_live',id:D.exam.id}); var L=j.live||[], pz=L.filter(function(x){return x.paused;}).length, off=L.filter(function(x){return x.seen>90;}).length;
    var h='<div class="oe-sub" style="margin:8px 0">Updates every 30 seconds. Quiet means the student saved nothing in the last 90 seconds. Students not shown have submitted or are no longer active.</div><div class="rvh-leg" style="margin-bottom:8px"><div>Writing now<b>'+L.length+'</b></div><div>Paused now<b>'+pz+'</b></div><div>Quiet 90 s+<b>'+off+'</b></div><div>Submitted recently<b>'+j.doneRecent+'</b></div></div>';
    h+=L.length?L.map(function(x){ var tag=x.paused?'<span class="rv-lv" style="background:#b45309">Paused</span>':(x.seen>90?'<span class="rv-lv" style="background:#94a3b8">Quiet '+x.seen+' s</span>':'<span class="rv-lv" style="background:#16a34a">Online</span>'); return '<div class="rvh-row"><div style="flex:1"><b>'+esc(x.name||x.index)+'</b> '+tag+'<div class="s">'+esc(x.index)+' &middot; question '+x.q+' of '+x.n+' &middot; '+x.answered+' answered &middot; '+x.flags+' flag'+(x.flags===1?'':'s')+(x.pauses?' &middot; paused '+x.pauses+'x':'')+(x.leaves?' &middot; left page '+x.leaves+'x':'')+(x.last?' &middot; last: '+esc(x.last.replace(/_/g,' ')):'')+'</div></div></div>'; }).join(''):'<div class="oe-sub">Nobody is writing right now.</div>';
    b.innerHTML=h; }catch(e){ b.innerHTML='<div class="msg err">'+esc(e.message)+'</div>'; } }
window.oeRender=function(){
  var box=$('oeBody'), ex=D.exam, rows=D.rows, S=stats(), tot=Math.max(1,S.sub);
  var h='<button type="button" class="oe-mini" onclick="oeInit()">&larr; Back to exams</button><div class="oe-h" style="margin-top:12px">'+esc(ex.title)+'</div><div class="oe-sub">'+esc(ex.course)+' &middot; '+S.sub+' of '+S.expected+' submitted</div>'
  +'<div class="rvh-seg"><button type="button" class="'+(TAB==='ov'?'on':'')+'" onclick="oeTab(\'ov\')">Overview</button><button type="button" class="'+(TAB==='st'?'on':'')+'" onclick="oeTab(\'st\')">Students</button><button type="button" class="'+(TAB==='lv'?'on':'')+'" onclick="oeTab(\'lv\')">Live</button><button type="button" class="'+(TAB==='se'?'on':'')+'" onclick="oeTab(\'se\')">Settings</button></div>';
  var KS=['VS','S','H','M','L'];
  if(TAB==='ov'){
    h+='<div class="rvh-k"><div><b>'+rnd(S.avg)+'</b><span>Average</span></div><div><b>'+rnd(S.hi)+'</b><span>Highest</span></div><div><b>'+rnd(S.lo)+'</b><span>Lowest</span></div></div>'
    +'<div class="rvh-k" style="margin-top:8px"><div><b>'+rnd(S.med)+'</b><span>Middle score</span></div><div><b>'+S.sub+' / '+S.expected+'</b><span>Submitted</span></div><div><b>'+S.pend+'</b><span>Need marking</span></div></div>';
    var fl=S.st.toreview+S.st.cleared+S.st.confirmed, dn=S.st.cleared+S.st.confirmed, pc=fl?Math.round(dn/fl*100):100;
    h+='<div class="rv-q"><b>Flag review</b><div class="oe-sub" style="margin:4px 0 0">'+dn+' of '+fl+' students with flags reviewed ('+pc+'%). Levels count flags not yet dismissed, so waiting flags are included. Confirm or dismiss each one to settle it.</div>'
    +'<div class="rvh-bar"><i style="width:'+(fl?S.st.confirmed/fl*100:0)+'%;background:#dc2626"></i><i style="width:'+(fl?S.st.cleared/fl*100:0)+'%;background:#16a34a"></i><i style="width:'+(fl?S.st.toreview/fl*100:0)+'%;background:#94a3b8"></i></div>'
    +'<div class="rvh-leg"><div><span class="rvh-d" style="background:#94a3b8"></span>To review<b>'+S.st.toreview+'</b></div><div><span class="rvh-d" style="background:#16a34a"></span>Cleared<b>'+S.st.cleared+'</b></div><div><span class="rvh-d" style="background:#dc2626"></span>Confirmed<b>'+S.st.confirmed+'</b></div><div><span class="rvh-d" style="background:#d8e8e3"></span>No flags<b>'+S.st.none+'</b></div></div></div>'
    +'<div class="rv-q"><b>Levels from flags</b><div class="oe-sub" style="margin:4px 0 0">Each student is counted once, at their highest level among flags not dismissed. Three or more flags raise a student one level, and six or more raise two levels, up to Serious.</div>'
    +'<div class="rvh-bar">'+KS.map(function(k){ return '<i style="width:'+(S.lv[k]/tot*100)+'%;background:'+LVC[k]+'"></i>'; }).join('')+'</div>'
    +'<div class="rvh-leg">'+KS.map(function(k){ return '<div><span class="rvh-d" style="background:'+LVC[k]+'"></span>'+LVN[k]+'<b>'+S.lv[k]+'</b></div>'; }).join('')+'<div><span class="rvh-d" style="background:#d8e8e3"></span>No flags<b>'+S.lv.none+'</b></div></div></div>';
    var AC={}; rows.forEach(function(r){ var k=r.kc||{}; Object.keys(k).forEach(function(n){ AC[n]=AC[n]||[0,0]; AC[n][0]+=k[n][0]; AC[n][1]+=k[n][1]; }); });
    var ak=Object.keys(AC).filter(function(n){ return AC[n][0]+AC[n][1]>0; }).sort(function(a,b){ return (AC[b][0]+AC[b][1])-(AC[a][0]+AC[a][1]); });
    h+='<div class="rv-q"><b>How accurate is each detector?</b><div class="oe-sub" style="margin:4px 0 6px">Share of the flags you reviewed that a person confirmed. A low share means the detector is mostly guessing and its settings should be loosened or removed.</div>'+(ak.length?ak.map(function(n){ var c=AC[n][0], d=AC[n][1], pc=Math.round(c/(c+d)*100); return '<div class="rvh-row"><div style="flex:1">'+esc(n.replace(/_/g,' '))+'<div class="s">'+(c+d)+' reviewed &middot; '+c+' confirmed &middot; '+d+' dismissed</div></div><b>'+pc+'%</b></div>'; }).join(''):'<div class="oe-sub">This appears after you start confirming or dismissing flags.</div>')+'</div>';
    if(RV) h+='<div class="rv-q"><div style="display:flex;justify-content:space-between"><b>For your decision</b><span class="oe-sub">owner only</span></div><div class="rv-lr" style="margin-top:8px"><span>'+propTag('cancel')+'</span><b>'+S.cancel+'</b></div><div class="rv-lr"><span>'+propTag('review')+'</span><b>'+S.review+'</b></div><div class="oe-sub" style="margin:6px 0 0">These two lines are not in the printed report. Nobody is cancelled automatically: you decide.</div></div>';
    h+='<div class="rvh-act"><button type="button" class="oe-mini" onclick="oePrint()">Print report</button><button type="button" class="oe-mini" onclick="oeCsv()">Download results</button></div>';
  } else if(TAB==='lv'){
    h+='<div id="rvLive"><div class="oe-sub" style="margin-top:10px">Loading...</div></div>';
  } else if(TAB==='se'){
    h+='<div class="oe-sw"><div>Record in the Gradebook out of<small>Scores are scaled to this total, for example 30 questions recorded out of 15. Students\' exam tile still shows the raw score.</small></div><input type="number" id="oeGbOut" min="1" max="1000" step="0.5" style="width:90px;flex:0 0 90px" value="'+esc(gbOutGet(ex.id,S.tot))+'" onchange="gbOutSet()"></div>'
    +'<div class="oe-sw"><div>Release results to students<small>They see score and comment on their Exams tile.</small></div><button type="button" class="oe-tg'+(ex.released?' on':'')+'" onclick="oeRelease('+(ex.released?'false':'true')+')"><i></i></button></div>'
    +'<div class="rvh-act"><button type="button" class="oe-mini" onclick="oeIntegrity()">Integrity check</button>'+(ex.hasPhotos?'<button type="button" class="oe-mini x" onclick="oePurge()">Delete photos</button>':'')+'</div><div id="oeIntegrity"></div>';
  } else {
    h+='<div class="oe-row" style="margin-top:2px"><select id="rvFil" onchange="oeFilter(this.value)" style="flex:1 1 auto"><option value="">Show: everyone</option><option value="p:cancel">Proposed for cancellation</option><option value="p:review">Needs review</option><option value="l:VS">Very serious</option><option value="l:S">Serious</option><option value="l:H">High</option><option value="l:M">Medium</option><option value="l:L">Low</option><option value="s:toreview">To review</option><option value="s:cleared">Cleared</option><option value="s:confirmed">Has confirmed flags</option><option value="l:">No confirmed flags</option><option value="v:1">Referred to viva</option><option value="f:1">Has a Final mark</option></select></div>';
    rows.sort(function(a,b){return String(a.name).localeCompare(String(b.name));});
    h+=rows.map(function(r,i){var st=r.submittedAt?(r.how==='auto'||r.how==='time'?'Auto-submitted':'Submitted'):'Not finished';
      return '<div class="rvh-row rv-r" data-lv="'+(r.lv||'')+'" data-st="'+(r.st||'')+'" data-vv="'+(r.vv?1:0)+'" data-prop="'+(r.prop||'')+'" data-fin="'+(r.final!=null?1:0)+'" onclick="window.RVY=window.scrollY;oeOpenAtt('+i+')"><span class="rvh-d" style="background:'+(r.lv?LVC[r.lv]:(r.st==='toreview'?'#94a3b8':(r.st==='cleared'?'#16a34a':'#d8e8e3')))+'"></span><div class="m"><div class="n">'+esc(r.name||r.email)+'</div><div class="s">'+esc(r.index||'')+' &middot; '+st+(r.final!=null?' &middot; Final mark':'')+(r.pending?' &middot; marking pending':'')+' &middot; Photos '+r.snaps+'</div>'+((r.lv||r.prop||r.st==='toreview'||r.st==='cleared'||r.vv)?'<div>'+propTag(r.prop)+lvTag(r.lv)+stTag(r)+(r.vv?'<span class="rv-lv" style="background:#7c3aed">Viva</span>':'')+'</div>':'')+(r.nf?'<div class="s">'+r.nf+' flag'+(r.nf===1?'':'s')+' &middot; '+r.nc+' confirmed &middot; '+r.nd+' dismissed'+(r.pz?' &middot; paused '+r.pz+'x':'')+(r.st==='toreview'&&rawLv(r)?' &middot; AI-suggested: '+LVN[rawLv(r)]:'')+'</div>':'')+(r.why&&r.why.length?'<div class="s" style="color:#dc2626;margin-top:4px">&#9888; '+r.why.map(esc).join(' &middot; ')+'</div>':'')+'</div><div class="sc">'+rnd(eff(r))+'<small>/'+r.total+'</small></div></div>';}).join('');
    if(D.missing.length) h+='<div class="oe-sub" style="margin-top:16px">Did not start ('+D.missing.length+')</div><div class="oe-sub">'+D.missing.map(function(m){return esc(m.name||m.index);}).join(', ')+'</div>';
  }
  var _y=window.scrollY; box.innerHTML=h; msg('');
  if(TAB==='st'&&window.RVFIL){ var _f=$('rvFil'); if(_f){ _f.value=window.RVFIL; oeFilter(window.RVFIL); window.scrollTo(0,window.RVY||0); } } else window.scrollTo(0,0);
};
window.oeFilter=function(v){
  window.RVFIL=String(v||'');
  var k=String(v||''), t=k.slice(0,1), val=k.slice(2);
  document.querySelectorAll('#oeBody .rv-r').forEach(function(el){
    var show=true;
    if(t==='p') show=el.getAttribute('data-prop')===val;
    else if(t==='s') show=el.getAttribute('data-st')===val;
    else if(t==='l') show=el.getAttribute('data-lv')===val;
    else if(t==='v') show=el.getAttribute('data-vv')==='1';
    else if(t==='f') show=el.getAttribute('data-fin')==='1';
    el.style.display=show?'':'none';
  });
};
/* Printable report: the overview only. No student names, and nothing about who is proposed for cancellation. */
window.oePrint=function(){
  if(!D) return; var S=stats(), ex=D.exam, d=function(t){ try{ return new Date(t).toLocaleDateString([], {day:'numeric',month:'long',year:'numeric'}); }catch(e){ return ''; } };
  var labels=['0-20%','20-40%','40-60%','60-80%','80-100%'], mx=Math.max.apply(null,S.bands.concat([1]));
  var bandRows=S.bands.map(function(c,i){ return '<tr><td>'+labels[i]+' of the total</td><td class="n">'+c+'</td><td><div class="bar" style="width:'+Math.round(c/mx*100)+'%"></div></td></tr>'; }).join('');
  var lvRows=['VS','S','H','M','L'].map(function(k){ return '<tr><td>'+LVN[k]+'</td><td class="n">'+S.lv[k]+'</td></tr>'; }).join('')+'<tr><td>No flags</td><td class="n">'+S.lv.none+'</td></tr><tr><td>Flags still being reviewed</td><td class="n">'+S.st.toreview+'</td></tr>';
  var css='body{font:14px/1.5 Arial,Helvetica,sans-serif;color:#111;margin:28px}h1{font-size:22px;margin:0 0 2px}h2{font-size:15px;margin:14px 0 5px;border-bottom:1px solid #999;padding-bottom:3px}.sub{color:#555}table{border-collapse:collapse;width:100%}td,th{padding:3px 8px;border-bottom:1px solid #ddd;text-align:left}td.n{text-align:right;font-weight:700;width:90px}.bar{height:12px;background:#334155}.g{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.g div{border:1px solid #bbb;border-radius:8px;padding:8px;text-align:center}.g b{display:block;font-size:20px}.g span{font-size:11px;color:#555}.note{font-size:11px;color:#555;margin-top:10px}@media print{body{margin:8mm}}';
  var html='<!doctype html><html><head><meta charset="utf-8"><title>'+esc(ex.title)+' - report</title><style>'+css+'</style></head><body>'
   +'<h1>'+esc(ex.title)+'</h1><div class="sub">'+esc(ex.course)+(ex.start?' &middot; '+esc(d(ex.start)):'')+(ex.durationMin?' &middot; '+esc(ex.durationMin)+' minutes':'')+' &middot; Total marks: '+rnd(S.tot)+'</div>'
   +'<h2>Participation</h2><div class="g"><div><b>'+S.expected+'</b><span>Expected</span></div><div><b>'+S.sub+'</b><span>Submitted</span></div><div><b>'+S.missing+'</b><span>Did not start</span></div></div>'
   +'<h2>Scores (out of '+rnd(S.tot)+')</h2><div class="g"><div><b>'+rnd(S.avg)+'</b><span>Average</span></div><div><b>'+rnd(S.med)+'</b><span>Middle score</span></div><div><b>'+rnd(S.hi)+'</b><span>Highest</span></div><div><b>'+rnd(S.lo)+'</b><span>Lowest</span></div><div><b>'+S.pend+'</b><span>Scripts still being marked</span></div><div><b>'+S.sub+'</b><span>Scores counted</span></div></div>'
   +'<h2>How scores were spread</h2><table>'+bandRows+'</table>'
   +'<h2>Flag levels</h2><table>'+lvRows+'</table><div class="note">Flags are automatic warnings raised during the exam (for example the camera not seeing a face, or leaving the exam page). Levels count every flag that has not been dismissed, so flags still waiting for review are included; if a flag is dismissed the count drops. Three or more flags raise a student one level, and six or more raise two (up to Serious). Each student is counted once, at their highest level. Students with flags at one or more levels will be reviewed, and may receive a penalty or other marked action.</div>'
   +'<div class="note">No student names appear in this report. Generated '+esc(new Date().toLocaleString())+'.</div>'
   +'<script>window.onload=function(){setTimeout(function(){window.print();},300);}<\/script></body></html>';
  var w=window.open('','_blank');
  if(!w){ msg('<div class="msg err">Your browser blocked the report window. Allow pop-ups for this site, then tap Print report again.</div>'); return; }
  w.document.open(); w.document.write(html); w.document.close();
};
function gbOutGet(id,tot){ try{ var v=localStorage.getItem('oeGbOut_'+id); if(v&&parseFloat(v)>0) return v; }catch(e){} return tot||''; }
window.gbOutSet=function(){ try{ var el=$('oeGbOut'); if(el&&D) localStorage.setItem('oeGbOut_'+D.exam.id,el.value); }catch(e){} };
async function gbSync(add){
  var ex=D.exam, key=function(r){return [(r.indexNumber||'').toLowerCase(),(r.course||'').toLowerCase(),(r.assessmentName||'').toLowerCase()].join('|');};
  var raw=D.rows.length?D.rows[0].total:0, gout=parseFloat(($('oeGbOut')||{}).value)||parseFloat(gbOutGet(ex.id,raw))||raw, f=(raw>0&&gout>0)?gout/raw:1;
  var recs=D.rows.filter(function(r){return r.submittedAt&&r.index;}).map(function(r){return {indexNumber:r.index,score:String(Math.round(eff(r)*f*100)/100),assessmentName:ex.title,course:ex.course,level:''};});
  var drop=new Set(recs.map(key)), tot=(raw>0&&gout>0)?gout:raw;
  var existing=await fetchAllRecords();
  var keep=existing.filter(function(r){return !drop.has(key(r));});
  await saveAllRecords(add?keep.concat(recs):keep, add&&tot>0?{name:ex.title,max:tot,courses:[lmBase(ex.course)]}:null);
  return recs.length;
}

/* ---- Integrity check: missing photos, unusually fast finishes, and students with matching wrong answers ---- */
window.oeIntegrity=async function(){
  var box=$('oeIntegrity'); if(!box||!D) return;
  var rows=D.rows.filter(function(r){return r.submittedAt&&r.startedAt;}), ex=D.exam;
  if(rows.length<2){ box.innerHTML='<div class="rv-warn">Not enough submitted attempts to check yet.</div>'; return; }
  box.innerHTML='<div class="rv-q">Checking... <span id="oeIgP">0</span> / '+rows.length+'</div>';
  var mins=function(r){ return (Date.parse(r.submittedAt)-Date.parse(r.startedAt))/60000; };
  /* 1 photos */
  var every=ex.snapEverySec||30, lowPh=[];
  rows.forEach(function(r){ var exp=mins(r)*60/every; if(exp>=4 && r.snaps<exp*0.4) lowPh.push({r:r,exp:Math.round(exp)}); });
  /* 2 fast */
  var ms=rows.map(mins).sort(function(a,b){return a-b;}), med=ms[Math.floor(ms.length/2)], fast=[];
  if(med>=3) rows.forEach(function(r){ if(mins(r)<med*0.35) fast.push(r); });
  /* 3 answers */
  var att=[], i=0, done=0, fail=0;
  async function worker(){ while(i<rows.length){ var r=rows[i++]; try{ var j=await api({action:'oe_attempt',id:ex.id,email:r.email}); att.push({r:r,items:j.attempt.items||[]}); }catch(e){ fail++; } done++; var p=$('oeIgP'); if(p) p.textContent=done; } }
  await Promise.all([worker(),worker(),worker(),worker(),worker()]);
  var info=att.map(function(a){ var m={}, wrong=0; a.items.forEach(function(q){ if(q.type!=='mcq'||q.chosen==null) return; if(!q.right){ wrong++; m[q.id]=String(q.options[q.chosen]||'').trim().toLowerCase(); } }); return {r:a.r,m:m,wrong:wrong}; });
  var pairs=[];
  for(var x=0;x<info.length;x++) for(var y=x+1;y<info.length;y++){
    var A=info[x], B=info[y], low=Math.min(A.wrong,B.wrong); if(low<4) continue; var same=0;
    Object.keys(A.m).forEach(function(k){ if(B.m[k]!==undefined && B.m[k]===A.m[k]) same++; });
    if(same>=4 && same/low>=0.6) pairs.push({a:A.r,b:B.r,same:same,low:low});
  }
  pairs.sort(function(p,q){return q.same-p.same;});
  var nm=function(r){ return esc(r.name||r.email)+' <span style="color:var(--muted)">'+esc(r.index||'')+'</span>'; };
  var h='<div class="rv-q"><b>Integrity check</b><div class="oe-sub" style="margin:4px 0 0">'+rows.length+' submitted attempts checked'+(fail?' ('+fail+' could not be read)':'')+'. These are hints to look at, not proof.</div></div>';
  h+='<div class="rv-q"><b>Matching wrong answers ('+pairs.length+')</b>'+(pairs.length?pairs.slice(0,30).map(function(p){ return '<div class="oe-sub" style="margin:8px 0 0">&#9888; '+nm(p.a)+' and '+nm(p.b)+': chose the <b>same wrong answer</b> on '+p.same+' of their '+p.low+' wrong questions.</div>'; }).join(''):'<div class="oe-sub" style="margin:6px 0 0">No pairs of students stand out.</div>')+'</div>';
  h+='<div class="rv-q"><b>Few photos ('+lowPh.length+')</b>'+(lowPh.length?lowPh.slice(0,30).map(function(p){ return '<div class="oe-sub" style="margin:8px 0 0">&#9888; '+nm(p.r)+': '+p.r.snaps+' photos, about '+p.exp+' expected.</div>'; }).join(''):'<div class="oe-sub" style="margin:6px 0 0">Photos arrived as expected.</div>')+'</div>';
  h+='<div class="rv-q"><b>Very fast finishes ('+fast.length+')</b>'+(fast.length?fast.slice(0,30).map(function(r){ return '<div class="oe-sub" style="margin:8px 0 0">&#9888; '+nm(r)+': '+Math.max(1,Math.round(mins(r)))+' min, while the middle student took '+Math.round(med)+' min.</div>'; }).join(''):'<div class="oe-sub" style="margin:6px 0 0">No unusually fast finishes.</div>')+'</div>';
  box.innerHTML=h;
};
window.oeRelease=async function(v){ try{ await api({action:'oe_release',id:D.exam.id,released:v}); await oeResults(D.exam.id); var n=await gbSync(v); var nt=''; if(v&&window.ceNotify){ try{ nt=ceNotifyText(await ceNotify('results',D.exam.course,D.exam.title)); }catch(_e){} } msg('<div class="msg ok">'+(v?'Results released and '+n+' scores added to the Gradebook as "'+esc(D.exam.title)+'".'+esc(nt):'Results hidden and removed from the Gradebook.')+'</div>'); }catch(e){ msg('<div class="msg err">'+esc(e.message)+'</div>'); } };
window.oePurge=async function(){ if(!confirm('Delete ALL photos for this exam?\n\nThis cannot be undone.')) return; try{ var r=await api({action:'oe_purge',id:D.exam.id}); await oeResults(D.exam.id); msg('<div class="msg ok">Deleted '+r.removed+' photos.</div>'); }catch(e){ msg('<div class="msg err">'+esc(e.message)+'</div>'); } };
window.oeCsv=function(){ var q=function(v){return '"'+String(v==null?'':v).replace(/"/g,'""')+'"';}; var L=[['Name','Index','Status','MCQ','Written','System score','Final mark','Score used','Out of','Flag level (confirmed)','Proposal','Left page','Flags (all)','Flag types','Viva','Photos'].map(q).join(',')];
  D.rows.forEach(function(r){L.push([r.name,r.index,r.submittedAt?'Submitted':'Not finished',r.mcq||0,r.written,(r.mcq||0)+r.written,r.final!=null?r.final:'',eff(r),r.total,r.lv?LVN[r.lv]:'',r.prop==='cancel'?'Proposed for cancellation':(r.prop==='review'?'Needs review':''),r.leaves,Object.keys(r.kinds||{}).reduce(function(s,k){return s+r.kinds[k];},0),Object.keys(r.kinds||{}).map(function(k){return k.replace(/_/g,' ')+' x'+r.kinds[k];}).join('; '),r.vv?'Referred to viva':'',r.snaps].map(q).join(','));});
  D.missing.forEach(function(m){L.push([m.name,m.index,'Did not start',0,0,0,'',0,'','','','','','',''].map(q).join(','));});
  var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob(['\ufeff'+L.join('\n')],{type:'text/csv'})); a.download=(D.exam.title||'exam').replace(/[^\w]+/g,'_')+'_results.csv'; a.click(); };
window.oeBig=function(src){ var d=document.createElement('div'); d.id='rvBig'; d.onclick=function(){d.remove();}; d.innerHTML='<img src="'+src+'">'; document.body.appendChild(d); };
var FACT={leave:1,fullscreen_exit:1,phone_seen:1,other_device:1};
var INFOK={guard_resume:1,guard_report:1,guard_nocheck:1,recheck_ok:1};
var INFOT={guard_report:'Student tapped "Report a problem" (face not seen)',guard_nocheck:'Started without the face check (it was not working)',recheck_ok:'Passed a random identity re-check'};
function pauseLen(A,k){ var fl=A.flags||[],t0=Date.parse(fl[k].t); for(var j=k+1;j<fl.length;j++){ if(fl[j].kind==='guard_resume'){ var s=Math.round((Date.parse(fl[j].t)-t0)/1000); return s>=0?s:null; } } return null; }
function flagRow(r,f,k,A){ var v=(r.vd||{})[String(k)], l=RAWLV[f.kind];
  if(f.kind==='guard_resume') return '';
  if(INFOK[f.kind]) return '<div class="rvf"><div class="rvf-t"><b>'+esc(INFOT[f.kind]||f.kind)+'</b></div><div class="oe-sub" style="margin:2px 0 0">'+tm(f.t)+'</div></div>';
  if(f.kind==='guard_pause'){ var pl=pauseLen(A,k); f=Object.assign({},f,{note:(f.note?f.note+' \u00b7 ':'')+(pl!=null?'paused for '+pl+' s':'still paused or closed while paused')}); }
  return '<div class="rvf"><div class="rvf-t"><b>'+esc(String(f.kind).replace(/_/g,' '))+'</b>'+(l?' <span class="rv-lv" style="background:'+LVC[l]+';margin:0">'+LVN[l]+'</span>':'')+(!FACT[f.kind]&&v!=='c'?' <span class="oe-sub">AI-suggested</span>':'')+'</div><div class="oe-sub" style="margin:2px 0 0">'+tm(f.t)+(f.note?' &middot; '+esc(f.note):'')+'</div>'
  +'<div class="rvf-b"><button type="button" class="oe-mini'+(v==='c'?' rvf-c':'')+'" onclick="oeVerdict('+k+',\'c\')">'+(v==='c'?'&#10003; Confirmed':'Confirm')+'</button><button type="button" class="oe-mini'+(v==='d'?' rvf-d':'')+'" onclick="oeVerdict('+k+',\'d\')">'+(v==='d'?'&#10003; Dismissed':'Dismiss')+'</button>'+(v?'<button type="button" class="oe-mini" onclick="oeVerdict('+k+',null)">Undo</button>':'')+'</div></div>'; }
function flagBox(r,A){
  var fl=A.flags||[]; if(!fl.length){ var e0=''; if(r.tm>=5) e0+='<div class="oe-sub">Answer speed: '+r.fs+' of '+r.tm+' answered questions in under 3 seconds'+(r.fs/r.tm>=.4?' &mdash; unusually fast, worth a look.':'.')+'</div>'; if(r.sh>0) e0+='<div class="oe-sub">Network: same connection as '+r.sh+' other student'+(r.sh===1?'':'s')+' (weak evidence on its own).</div>'; return e0?'<div class="rv-q"><b>Checks</b>'+e0+'</div>':''; }
  var fa=[],gu=[]; fl.forEach(function(f,k){ (FACT[f.kind]?fa:gu).push(flagRow(r,f,k,A)); });
  var ex2=''; if(r.tm>=5) ex2+='<div class="oe-sub" style="margin:0 0 4px">Answer speed: '+r.fs+' of '+r.tm+' answered questions in under 3 seconds'+(r.fs/r.tm>=.4?' &mdash; unusually fast, worth a look.':'.')+'</div>'; if(r.sh>0) ex2+='<div class="oe-sub" style="margin:0 0 4px">Network: same connection as '+r.sh+' other student'+(r.sh===1?'':'s')+'. Shared campus or hostel Wi-Fi is common, so this is weak evidence on its own.</div>';
  var sm=ex2+'<div class="oe-sub" style="margin:0 0 6px">Level now: '+(r.lv?lvTag(r.lv):'<b>'+(r.st==='cleared'?'Cleared':'Not yet reviewed')+'</b>')+' &middot; '+r.nc+' confirmed, '+r.nd+' dismissed, '+(r.nf-r.nc-r.nd)+' waiting. Levels count confirmed and waiting flags (dismissed ones do not), and many flags raise the level. Proposals use confirmed flags only.</div>';
  return '<div class="rv-q"><b>Recorded by the system (facts)</b>'+sm+(fa.join('')||'<div class="oe-sub">None.</div>')+'</div><div class="rv-q" style="background:rgba(100,116,139,.06)"><b>Camera guesses (AI-suggested, need your eyes)</b><div class="oe-sub" style="margin:4px 0 6px">Check the photos below before confirming.</div>'+(gu.join('')||'<div class="oe-sub">None.</div>')+'</div>';
}
function vivaBox(r){ return '<div class="rv-q"><b>Viva (short oral check)</b><div class="oe-sub" style="margin:4px 0 8px">'+(r.vv?'This student is on the viva list. Ask a few questions from the exam and note the outcome yourself.':'If the evidence is unclear, you can refer the student for a short oral check instead of deciding from photos alone.')+'</div><button type="button" class="oe-mini'+(r.vv?' rvf-c':'')+'" onclick="oeViva()">'+(r.vv?'On viva list (tap to remove)':'Refer to viva')+'</button></div>'; }
window.oeViva=async function(){ var A=window._rvA, r=window._rvR; if(!A||!r) return; try{ var res=await api({action:'rv_viva',id:D.exam.id,email:A.email,v:!r.vv}); r.vv=!!res.viva; var b=$('rvViva'); if(b) b.innerHTML=vivaBox(r); }catch(e){ msg('<div class="msg err">'+esc(e.message)+'</div>'); } };
window.oeVerdict=async function(k,v){
  var A=window._rvA, r=window._rvR; if(!A||!r) return;
  try{ var res=await api({action:'rv_verdict',id:D.exam.id,email:A.email,i:k,v:v});
    r.vd=res.verdicts||{}; r.st=res.status; r.nf=res.nflags; r.nc=res.nconf; r.nd=res.ndis; r.lv=lvLive(res.kinds,res.kc); r.prop=res.proposal;
    var b=$('rvFlags'); if(b) b.innerHTML=flagBox(r,A);
  }catch(e){ msg('<div class="msg err">'+esc(e.message)+'</div>'); }
};
window.oeOpenAtt=async function(i){
  var r=D.rows[i], box=$('oeBody'); box.innerHTML='<div class="empty">Loading...</div>';
  var A; try{ A=(await api({action:'oe_attempt',id:D.exam.id,email:r.email})).attempt; }catch(e){ msg('<div class="msg err">'+esc(e.message)+'</div>'); return oeResults(D.exam.id); }
  var VR={}; try{ VR=(await api({action:'rv_vars',id:D.exam.id,email:r.email})).vars||{}; }catch(e){ VR={}; }
  window._rvA=A; window._rvR=r; SN=[];
  var h='<button type="button" class="oe-mini" onclick="oeRender()">&larr; Back to results</button><div class="oe-h" style="margin-top:12px">'+esc(A.name||A.email)+'</div><div class="oe-sub">'+esc(A.index||'')+' &middot; Started '+tm(A.startedAt)+(A.submittedAt?' &middot; Submitted '+tm(A.submittedAt):' &middot; Not submitted')+' &middot; Left page '+A.leaves+'x</div>';
  h+='<div id="rvFlags">'+flagBox(r,A)+'</div><div id="rvViva">'+vivaBox(r)+'</div>';
  var kd=r.kinds||{}, kl=Object.keys(kd).map(function(k){ return esc(k.replace(/_/g,' '))+' &times;'+kd[k]; }).join(' &middot; ');
  h+='<div class="rv-q"><b>Final mark</b><div>'+propTag(r.prop)+lvTag(r.lv)+(r.lv||r.prop?'':'<span class="oe-sub">No flags</span>')+'</div>'+(kl?'<div class="oe-sub" style="margin:6px 0 0">'+kl+'</div>':'')
    +'<div class="oe-sub" style="margin:8px 0 0">System score: <b>'+rnd((r.mcq||0)+r.written)+' / '+r.total+'</b>'+(r.final!=null?' &middot; Final mark: <b>'+rnd(r.final)+'</b> (this is what counts)':'')+'</div>'
    +'<div class="oe-l" style="margin-top:10px">Mark you want to give (0 to '+r.total+')</div><input type="number" id="rvFin" step="0.5" min="0" max="'+r.total+'" value="'+(r.final==null?'':r.final)+'" placeholder="Leave empty to use the system score">'
    +'<div class="oe-l" style="margin-top:8px">Reason (only you see this)</div><input type="text" id="rvFinWhy" maxlength="500" value="'+esc(r.reason||'')+'">'
    +'<div class="oe-row" style="margin-top:10px"><button type="button" class="oe-mini" onclick="oeFinal('+i+',false)">Save final mark</button>'+(r.final!=null?'<button type="button" class="oe-mini x" onclick="oeFinal('+i+',true)">Remove final mark</button>':'')+'</div></div>';
  h+='<div class="rv-q"><b>Photos ('+A.snaps.length+')</b><div class="rv-p" id="rvPh"></div>'+(A.snaps.length?'<button type="button" class="oe-mini" id="rvMore" style="margin-top:10px" onclick="oeMore()">Load photos</button>':'<div class="oe-sub">No photos.</div>')+'</div>';
  A.items.forEach(function(it,k){
    h+='<div class="rv-q"><div class="oe-sub" style="margin:0">Q'+(k+1)+' &middot; '+it.marks+' mark'+(it.marks===1?'':'s')+'</div><div style="font-weight:600;margin:4px 0 8px;overflow-wrap:anywhere">'+esc(VR[it.id]?VR[it.id].text:it.text)+'</div>';
    if(it.type==='mcq'){ h+=it.options.map(function(o,j){var c=j===it.correct?'rv-ok':(j===it.chosen?'rv-no':''); return '<div class="'+c+'" style="margin-top:4px">'+(j===it.chosen?'&#9679; ':'&#9675; ')+esc(o)+(j===it.correct?' &#10003;':'')+'</div>';}).join('')+'<div class="oe-sub" style="margin-top:8px">'+(it.chosen==null?'Not answered':(it.right?'Correct':'Wrong'))+'</div>'; }
    else { h+='<div style="white-space:pre-wrap;border:1px solid var(--line);border-radius:10px;padding:10px;overflow-wrap:anywhere">'+(esc(it.answer)||'<i>No answer</i>')+'</div>'+(VR[it.id]?'<div class="oe-sub" style="margin-top:8px">Numbers this student got: <b>'+esc(JSON.stringify(VR[it.id].vals).replace(/[{}"]/g,'').replace(/,/g,', ').replace(/:/g,' = '))+'</b> &middot; Correct answer: <b>'+(VR[it.id].exp==null?'?':VR[it.id].exp)+'</b> (error allowed '+VR[it.id].tol+'%)'+(VR[it.id].auto?' &middot; marked by the system, you can change the mark':'')+'</div>':'')+(String(it.guide||'').replace(/\s*\[\[var:[\s\S]*?\]\]/,'').trim()?'<div class="oe-sub" style="margin-top:8px">Marking guide: '+esc(String(it.guide).replace(/\s*\[\[var:[\s\S]*?\]\]/,'').trim())+'</div>':'')
      +'<div class="oe-l" style="margin-top:10px">Mark (0 to '+it.marks+')</div><input type="number" step="0.5" min="0" max="'+it.marks+'" data-q="'+it.id+'" value="'+(it.grade==null?'':it.grade)+'">'; }
    h+='</div>'; });
  h+='<div class="rv-q"><div class="oe-l">Comment to student (optional)</div><textarea id="rvCm">'+esc(A.comment)+'</textarea></div><button type="button" class="oe-btn" style="margin-top:12px" onclick="oeGrade()">Save marks</button>';
  box.innerHTML=h; window.scrollTo(0,0);
};
window.oeFinal=async function(i,clear){
  var r=D.rows[i], v=clear?null:(($('rvFin')||{}).value||'');
  if(!clear && v===''){ msg('<div class="msg err">Type the mark you want to give, or leave things as they are.</div>'); return; }
  try{
    var why=clear?'':(($('rvFinWhy')||{}).value||'');
    var res=await api({action:'rv_final',id:D.exam.id,email:r.email,score:clear?null:Number(v),reason:why});
    r.final=(res.final!=null)?res.final:null; r.reason=clear?'':why;
    if(D.exam.released) await gbSync(true);
    await oeOpenAtt(i);
    msg('<div class="msg ok">'+(clear?'Final mark removed. The system score counts again.':'Final mark saved: '+rnd(r.final)+'.')+(D.exam.released?' Gradebook updated.':'')+'</div>');
  }catch(e){ msg('<div class="msg err">'+esc(e.message)+'</div>'); }
};
window.oeMore=async function(){
  var A=window._rvA, b=$('rvMore'); if(b) b.textContent='Loading...';
  try{ var r=await api({action:'oe_snaps',id:D.exam.id,email:A.email,offset:SN.length,limit:24});
    /* photos of exams written on the fast Cloudflare service are kept there: when none came back from the usual place, ask Cloudflare */
    if(r.photos.length && !r.photos.some(function(p){return p.img;})){
      try{
        var h={'Content-Type':'application/json'}, sess=(await supabaseClient.auth.getSession()).data.session;
        if(sess&&sess.access_token) h['x-staff-token']=sess.access_token;
        var rc=await fetch('https://exams-api.obengahenkora.workers.dev/',{method:'POST',headers:h,body:JSON.stringify({action:'staff_snaps',id:D.exam.id,email:A.email,offset:SN.length,limit:24})});
        var jc=await rc.json(); if(jc&&jc.ok) r=jc; else if(jc&&jc.error) throw new Error(jc.error);
      }catch(e2){ throw e2; }
    }
    r.photos.forEach(function(p){SN.push(p);});
    var bad=function(w){return w&&w!=='timer'&&w!=='random'&&w!=='start';};
    $('rvPh').innerHTML=SN.map(function(p,i){return '<div class="'+(bad(p.why)?'f':'')+'"><img src="'+p.img+'" onclick="oeBig(this.src)"><small>'+tm(p.t).split(', ').pop()+(bad(p.why)?' '+esc(p.why):'')+'</small></div>';}).join('');
    if(b){ if(SN.length<r.total){ b.textContent='Load more ('+(r.total-SN.length)+' left)'; } else b.remove(); } }catch(e){ if(b) b.textContent='Failed, tap to retry'; }
};
window.oeGrade=async function(){
  var A=window._rvA, g={}; document.querySelectorAll('#oeBody input[data-q]').forEach(function(i){g[i.getAttribute('data-q')]=i.value===''?null:Number(i.value);});
  try{ await api({action:'oe_grade',id:D.exam.id,email:A.email,grades:g,comment:($('rvCm')||{}).value||''}); await oeResults(D.exam.id); if(D.exam.released) await gbSync(true); msg('<div class="msg ok">Marks saved'+(D.exam.released?' and Gradebook updated':'')+'.</div>'); }catch(e){ msg('<div class="msg err">'+esc(e.message)+'</div>'); }
};
})();
