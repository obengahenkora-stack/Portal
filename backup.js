/* ===== Backup extras: Excel workbook, last-backup date, 30-day reminder ===== */
(function(){
var K='ceLastBackup';
function $(i){ return document.getElementById(i); }
function last(){ try{ return localStorage.getItem(K)||''; }catch(e){ return ''; } }
function stamp(){ try{ localStorage.setItem(K,new Date().toISOString()); }catch(e){} refresh(); }
function days(){ var l=last(); if(!l) return null; return Math.floor((Date.now()-new Date(l).getTime())/86400000); }
function nk(x){ return String(x||'').trim().toLowerCase(); }

// remember when a full backup was downloaded
var _db=window.downloadBackup;
if(typeof _db==='function') window.downloadBackup=async function(){ var r=await _db.apply(this,arguments); stamp(); return r; };

function refresh(){
  var d=days(), card=$('backupCard');
  if(card){
    var s=$('bkStatus'); if(!s){ s=document.createElement('div'); s.id='bkStatus'; s.style.cssText='margin:10px 0;padding:10px 12px;border-radius:12px;border:1px solid var(--line);font-size:.85rem'; var h=card.querySelector('.hint'); if(h) h.after(s); else card.appendChild(s); }
    s.innerHTML=d===null?'<b>No backup downloaded from this device yet.</b>':'Last backup from this device: <b>'+(d===0?'today':d+' day'+(d===1?'':'s')+' ago')+'</b>';
    s.style.borderColor=(d===null||d>=30)?'#f59e0b':'var(--line)';
  }
  var old=$('bkReminder'); if(old) old.remove();
  var hero=$('hubHero'); var own=false; try{ own=isAdmin(); }catch(e){}
  if(hero && own && (d===null||d>=30)){
    var b=document.createElement('div'); b.id='bkReminder';
    b.style.cssText='margin:0 0 14px;padding:12px 14px;border-radius:14px;border:1px solid var(--line);border-left:4px solid #f59e0b;background:var(--card);display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;font-size:.86rem';
    b.innerHTML='<span><b>Time for a backup.</b> '+(d===null?'You have not downloaded one yet.':'Your last backup was '+d+' days ago.')+'</span><button type="button" style="white-space:nowrap;padding:7px 14px !important;border-radius:999px !important;font-size:.8rem !important;font-weight:700 !important;background:#16a34a !important;color:#fff !important;border:0 !important;box-shadow:none !important;text-transform:none !important;letter-spacing:0 !important" onclick="switchTab(\'teacher\');tchGo(\'backupCard\')">Back up now</button>';
    hero.after(b);
  }
}
window.bkRefresh=refresh;

window.bkExcel=async function(){
  var msg=$('backupMsg'); if(msg) msg.innerHTML='<div class="msg ok">Building the workbook...</div>';
  try{
    if(!window.XLSX) throw new Error('The Excel library did not load. Reload the page.');
    var data=await fetchSupabaseData(true), bin=await fetchBin();
    var names={}; Object.keys(data.rosters||{}).forEach(function(c){ (data.rosters[c]||[]).forEach(function(s){ names[nk(s.indexNumber)]=s.name||names[nk(s.indexNumber)]||''; }); });
    var am=bin.assessmentMax||{};
    var scores=[['Course','Assessment','Index number','Name','Score','Marked out of']];
    (bin.records||[]).forEach(function(r){ var mx=''; try{ mx=am[amKey(r.course||'General',r.assessmentName||'Untitled')]||''; }catch(e){} scores.push([r.course||'General',r.assessmentName||'Untitled',r.indexNumber,names[nk(r.indexNumber)]||'',r.score,mx]); });
    var att=[['Course','Date','Index number','Name','Status','Check-in time']];
    (data.attendance||[]).forEach(function(a){ var ct=a.checkInTimes||{};
      (a.present||[]).forEach(function(p){ att.push([a.course,a.date,p,names[nk(p)]||'','Present',ct[p]||'']); });
      (a.excused||[]).forEach(function(p){ att.push([a.course,a.date,p,names[nk(p)]||'','Excused','']); }); });
    var ros=[['Course','Index number','Name']];
    Object.keys(data.rosters||{}).forEach(function(c){ (data.rosters[c]||[]).forEach(function(s){ ros.push([c,s.indexNumber,s.name||'']); }); });
    var wb=XLSX.utils.book_new();
    [['Scores',scores],['Attendance',att],['Class lists',ros]].forEach(function(x){ var ws=XLSX.utils.aoa_to_sheet(x[1]); ws['!cols']=x[1][0].map(function(){ return {wch:20}; }); XLSX.utils.book_append_sheet(wb,ws,x[0]); });
    // exam attendance, if the exam records are reachable
    try{
      var j=await teamApi({action:'exam_sessions'});
      if(j&&j.ok&&(j.sessions||[]).length){
        var ex=[['Course','Exam date','Index number','Name','Room','Time']];
        var ls=await Promise.all(j.sessions.map(function(s){ return teamApi({action:'exam_list',course:s.course,date:s.date}); }));
        j.sessions.forEach(function(s,i){ ((ls[i]&&ls[i].items)||[]).forEach(function(it){ ex.push([s.course,s.date,it.idx,names[nk(it.idx)]||'',it.room||'',it.at||'']); }); });
        var we=XLSX.utils.aoa_to_sheet(ex); we['!cols']=ex[0].map(function(){ return {wch:20}; }); XLSX.utils.book_append_sheet(wb,we,'Exam attendance');
      }
    }catch(e){}
    XLSX.writeFile(wb,'Portal data '+new Date().toISOString().slice(0,10)+'.xlsx');
    stamp();
    if(msg) msg.innerHTML='<div class="msg ok">Excel workbook downloaded.</div>';
  }catch(e){ if(msg) msg.innerHTML='<div class="msg err">Could not build it: '+(e.message||'error')+'</div>'; }
};
document.addEventListener('DOMContentLoaded',function(){ setTimeout(refresh,1500); setInterval(refresh,60000); });
})();
