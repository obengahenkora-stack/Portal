/* ===== At-Risk Students: low attendance or low scores, per course ===== */
(function(){
function $(i){ return document.getElementById(i); }
function key(x){ return String(x||'').toUpperCase().replace(/[^A-Z0-9]/g,''); }
var G={}, rows=[], inited=false;
var css=document.createElement('style');
css.textContent='#atRiskCard .atr-f{display:grid;gap:12px;margin:14px 0}'
+'#atRiskCard .atr-f select,#atRiskCard .atr-f input{width:100% !important;max-width:100% !important;box-sizing:border-box !important;min-width:0}'
+'#atRiskCard .atr-l{font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:5px}'
+'#atRiskCard .atr-two{display:grid;grid-template-columns:1fr 1fr;gap:10px}'
+'#atRiskCard .atr-sum{margin:14px 0 10px;padding:14px 16px;border-radius:16px;border:1px solid var(--line);background:linear-gradient(135deg,rgba(239,68,68,.08),rgba(245,158,11,.06))}'
+'#atRiskCard .atr-sum b{font-size:2rem;font-weight:800}'
+'#atRiskCard .atr-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:11px 13px;border:1px solid var(--line);border-radius:14px;margin-bottom:8px;background:var(--card)}'
+'#atRiskCard .atr-row small{display:block;color:var(--muted);margin-top:1px}'
+'#atRiskCard .atr-chip{display:inline-block;padding:3px 9px;border-radius:999px;font-size:.74rem;font-weight:700;margin:2px 0 2px 4px;white-space:nowrap}'
+'#atRiskCard .atr-chip.a{background:rgba(239,68,68,.13);color:#b91c1c}'
+'#atRiskCard .atr-chip.s{background:rgba(245,158,11,.16);color:#b45309}'
+'#atRiskCard .atr-btn{width:100% !important;display:flex !important;align-items:center;justify-content:center;gap:8px;padding:11px !important;border-radius:14px !important;background:var(--card) !important;color:var(--ink) !important;border:1px solid var(--line) !important;box-shadow:none !important;font-weight:700 !important;font-size:.88rem !important;letter-spacing:0 !important;text-transform:none !important;margin-top:6px}';
document.head.appendChild(css);

window.atrInit=async function(){
  var sel=$('atrCourse'); if(!sel) return;
  if(!inited){ inited=true; }
  var rosters=null;
  try{ var d=await fetchSupabaseData(); rosters=d.rosters||null; }catch(e){}
  if(!rosters || !Object.keys(rosters).length){ try{ rosters=_offlineRosters(); }catch(e){} }
  var names=visibleCourses(Object.keys(rosters||{}));
  G={}; names.forEach(function(n){ var b=lmBase(n); (G[b]=G[b]||[]).push(n); });
  var keep=sel.value;
  sel.innerHTML='<option value="">Select course...</option>'+Object.keys(G).sort().map(function(c){ var g=G[c].length; return '<option value="'+escapeHtml(c)+'">'+escapeHtml(c)+(g>1?' (all '+g+' groups)':'')+'</option>'; }).join('');
  if(keep) sel.value=keep;
};

window.atrRun=async function(){
  var course=$('atrCourse').value, box=$('atrBody');
  if(!course){ box.innerHTML='<div class="empty">Pick a course to see who needs attention.</div>'; return; }
  var attMin=parseFloat($('atrAtt').value), scMin=parseFloat($('atrSc').value);
  if(!(attMin>=0)) attMin=75; if(!(scMin>=0)) scMin=50;
  box.innerHTML='<div class="empty">Working it out...</div>';
  try{
    var data=await fetchSupabaseData(true), bin=null;
    try{ bin=await fetchBin(); }catch(e){}
    var names=G[course]||[course], seen={}, roster=[];
    names.forEach(function(n){ ((data.rosters&&data.rosters[n])||[]).forEach(function(s){ var k=key(s.indexNumber); if(k&&!seen[k]){ seen[k]=1; roster.push(s); } }); });
    if(!roster.length){ box.innerHTML='<div class="empty">No class list for this course yet.</div>'; return; }
    var base=course.toLowerCase(), nameSet={}; names.forEach(function(n){ nameSet[n]=1; });
    var sess=(data.attendance||[]).filter(function(a){ return nameSet[a.course] || lmBase(a.course||'').toLowerCase()===base; });
    // scores
    var recs=bin&&bin.records?bin.records.filter(function(r){ return lmBase(r.course||'General').toLowerCase()===base; }):[];
    var cols=[]; recs.forEach(function(r){ var a=String(r.assessmentName||'Untitled'); if(cols.indexOf(a)<0) cols.push(a); });
    var byIdx={}; recs.forEach(function(r){ var k=key(r.indexNumber); (byIdx[k]=byIdx[k]||{})[String(r.assessmentName||'Untitled')]=r.score; });
    rows=[];
    roster.forEach(function(s){
      var k=key(s.indexNumber), held=0, pres=0;
      sess.forEach(function(a){ var ex=(a.excused||[]).some(function(p){ return key(p)===k; }); if(ex) return; held++; if((a.present||[]).some(function(p){ return key(p)===k; })) pres++; });
      var attPct=held?Math.round(pres*100/held):null;
      var scPct=null; if(bin && byIdx[k]){ var f=finalOf(course,byIdx[k],cols,bin); if(f) scPct=Math.round(f.final/40*100); }
      var why=[]; if(attPct!==null && attPct<attMin) why.push('a'); if(scPct!==null && scPct<scMin) why.push('s');
      rows.push({idx:s.indexNumber,name:s.name||'',held:held,pres:pres,att:attPct,sc:scPct,why:why});
    });
    var risk=rows.filter(function(r){ return r.why.length; });
    risk.sort(function(a,b){ return (b.why.length-a.why.length) || ((a.att==null?101:a.att)-(b.att==null?101:b.att)); });
    var sessN=sess.length;
    var h='<div class="atr-sum"><b>'+risk.length+'</b> of '+rows.length+' students need attention<div style="font-size:.8rem;color:var(--muted);margin-top:6px">Attendance below '+attMin+'%'+(cols.length?' or score below '+scMin+'%':'')+'. Based on '+sessN+' attendance session'+(sessN===1?'':'s')+(cols.length?' and '+cols.length+' assessment'+(cols.length===1?'':'s'):'')+'.</div></div>';
    if(!risk.length) h+='<div class="empty">Nobody is below the limits. Well done.</div>';
    h+=risk.map(function(r){ return '<div class="atr-row"><div style="min-width:0"><b>'+escapeHtml(r.name||r.idx)+'</b><small>'+escapeHtml(r.idx)+'</small></div><div style="text-align:right">'
      +(r.why.indexOf('a')>=0?'<span class="atr-chip a">Attendance '+r.att+'%</span>':'')+(r.why.indexOf('s')>=0?'<span class="atr-chip s">Score '+r.sc+'%</span>':'')+'</div></div>'; }).join('');
    if(risk.length) h+='<button type="button" class="atr-btn" onclick="atrDownload()">&#11015;&nbsp; Download list (Excel)</button>';
    box.innerHTML=h;
    window._atrRisk=risk;
  }catch(e){ box.innerHTML='<div class="empty">Could not load: '+escapeHtml(e.message||'error')+'</div>'; }
};
window.atrDownload=function(){
  var risk=window._atrRisk||[]; if(!risk.length) return;
  var aoa=[['Index number','Name','Sessions held','Sessions present','Attendance %','Score %','Reason']];
  risk.forEach(function(r){ aoa.push([r.idx,r.name,r.held,r.pres,r.att==null?'':r.att,r.sc==null?'':r.sc,r.why.map(function(w){ return w==='a'?'Low attendance':'Low score'; }).join(' + ')]); });
  var base=('At-risk - '+$('atrCourse').value+' - '+new Date().toISOString().slice(0,10)).replace(/[\\\/:*?"<>|]/g,'-');
  if(window.XLSX){ var wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(aoa),'At risk'); XLSX.writeFile(wb,base+'.xlsx'); }
};
})();
