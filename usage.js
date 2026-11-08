/* ===== Usage dashboard: how the portal is being used, from data already saved ===== */
(function(){
function $(i){ return document.getElementById(i); }
function key(x){ return String(x||'').toUpperCase().replace(/[^A-Z0-9]/g,''); }
var css=document.createElement('style');
css.textContent='#usageCard .us-g{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:14px 0}'
+'#usageCard .us-s{border:1px solid var(--line);border-radius:14px;padding:12px;background:var(--card);text-align:center}'
+'#usageCard .us-s b{display:block;font-size:1.4rem;font-weight:800;line-height:1.1}'
+'#usageCard .us-s span{font-size:.7rem;color:var(--muted);font-weight:600}'
+'#usageCard .us-box{border:1px solid var(--line);border-radius:16px;padding:14px;background:var(--card);margin-bottom:14px}'
+'#usageCard .us-h{font-weight:700;margin:0 0 4px}'
+'#usageCard .us-sub{font-size:.76rem;color:var(--muted);margin:0 0 10px}'
+'#usageCard .us-cols{display:flex;align-items:flex-end;gap:6px;height:130px;padding-top:16px}'
+'#usageCard .us-col{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;min-width:0}'
+'#usageCard .us-col i{display:block;width:100%;border-radius:8px 8px 0 0;background:linear-gradient(180deg,#0ea5e9,#0d9488);min-height:2px}'
+'#usageCard .us-col em{font-style:normal;font-size:.7rem;font-weight:700;margin-bottom:3px}'
+'#usageCard .us-lab{display:flex;gap:6px;margin-top:6px}'
+'#usageCard .us-lab span{flex:1;text-align:center;font-size:.62rem;color:var(--muted);min-width:0}'
+'#usageCard .us-row{display:grid;grid-template-columns:minmax(70px,34%) 1fr 48px;gap:8px;align-items:center;margin:8px 0;font-size:.8rem}'
+'#usageCard .us-row .n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
+'#usageCard .us-bar{height:12px;border-radius:99px;background:rgba(127,127,127,.18);overflow:hidden}'
+'#usageCard .us-bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#16a34a,#0d9488)}'
+'#usageCard .us-row b{text-align:right}'
+'#usageCard .us-btn{width:100% !important;padding:11px !important;border-radius:14px !important;background:var(--card) !important;color:var(--ink) !important;border:1px solid var(--line) !important;box-shadow:none !important;font-weight:700 !important;font-size:.88rem !important;letter-spacing:0 !important;text-transform:none !important}';
document.head.appendChild(css);
function esc(t){ return String(t==null?'':t).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
var X=null;
function monthOf(d){ var m=String(d||'').match(/(\d{4})-(\d{2})/); if(m) return m[1]+'-'+m[2]; var t=new Date(d); return isNaN(t)?null:t.getFullYear()+'-'+('0'+(t.getMonth()+1)).slice(-2); }
function bars(items){ var mx=Math.max.apply(null,items.map(function(x){return x[1];}))||1;
  return '<div class="us-cols">'+items.map(function(x){ return '<div class="us-col"><em>'+(x[1]||'')+'</em><i style="height:'+Math.round(x[1]*100/mx)+'%"></i></div>'; }).join('')+'</div><div class="us-lab">'+items.map(function(x){ return '<span>'+esc(x[0])+'</span>'; }).join('')+'</div>'; }
function hbars(items,pct){ return items.map(function(x){ return '<div class="us-row"><div class="n" title="'+esc(x[0])+'">'+esc(x[0])+'</div><div class="us-bar"><i style="width:'+Math.round(pct?x[1]:x[1]*100/(items[0][1]||1))+'%"></i></div><b>'+x[1]+(pct?'%':'')+'</b></div>'; }).join(''); }
window.usageInit=async function(){
  var box=$('usageBody'); if(!box) return;
  box.innerHTML='<div class="empty">Working it out...</div>';
  try{
    var data=await fetchSupabaseData(true), bin=null; try{ bin=await fetchBin(); }catch(e){}
    var rosters=data.rosters||{}, att=data.attendance||[], recs=(bin&&bin.records)||[];
    var courses=Object.keys(rosters), studs={}; courses.forEach(function(c){ (rosters[c]||[]).forEach(function(s){ studs[key(s.indexNumber)]=1; }); });
    var totalPres=0, totalSlots=0, byMonth={}, byCourse={}, byTaker={};
    att.forEach(function(a){
      var base=lmBase(a.course||''), n=(a.present||[]).length, ro=Math.max(n,(rosters[a.course]||[]).length-(a.excused||[]).length);
      var m=monthOf(a.date); if(m) byMonth[m]=(byMonth[m]||0)+1;
      var c=byCourse[base]=byCourse[base]||{s:0,p:0,t:0,sc:0}; c.s++; c.p+=n; c.t+=ro||n;
      totalPres+=n; totalSlots+=ro||n;
      var w=a.takenBy&&(a.takenBy.name||a.takenBy.email); if(w) byTaker[w]=(byTaker[w]||0)+1;
    });
    recs.forEach(function(r){ var b=lmBase(r.course||'General'); (byCourse[b]=byCourse[b]||{s:0,p:0,t:0,sc:0}).sc++; });
    var avg=totalSlots?Math.round(totalPres*100/totalSlots):0;
    var months=Object.keys(byMonth).sort().slice(-6).map(function(m){ var d=new Date(m+'-01'); return [d.toLocaleString([], {month:'short'}),byMonth[m]]; });
    var h='<div class="us-g">'
      +[['Courses',(function(){ var b={}; courses.forEach(function(c){ b[lmBase(c).toLowerCase()]=1; }); return Object.keys(b).length; })()],['On class lists',Object.keys(studs).length],['Attendance sessions',att.length],['Average attendance',avg+'%'],['Scores recorded',recs.length],['Assessments',(function(){ var s={}; recs.forEach(function(r){ s[(r.course||'')+'|'+(r.assessmentName||'')]=1; }); return Object.keys(s).length; })()]]
        .map(function(x){ return '<div class="us-s"><b>'+x[1]+'</b><span>'+x[0]+'</span></div>'; }).join('')+'</div>';
    if(months.length) h+='<div class="us-box"><div class="us-h">Sessions per month</div><div class="us-sub">Attendance sessions taken, last 6 months with activity.</div>'+bars(months)+'</div>';
    var cl=Object.keys(byCourse).map(function(c){ return [c,byCourse[c]]; });
    var top=cl.filter(function(x){return x[1].s;}).sort(function(a,b){ return b[1].s-a[1].s; }).slice(0,8);
    if(top.length) h+='<div class="us-box"><div class="us-h">Most active courses</div><div class="us-sub">By attendance sessions taken.</div>'+hbars(top.map(function(x){ return [x[0],x[1].s]; }))+'</div>';
    var ap=cl.filter(function(x){return x[1].t;}).map(function(x){ return [x[0],Math.round(x[1].p*100/x[1].t)]; }).sort(function(a,b){ return b[1]-a[1]; }).slice(0,8);
    if(ap.length) h+='<div class="us-box"><div class="us-h">Attendance by course</div><div class="us-sub">Average share of the class present.</div>'+hbars(ap,true)+'</div>';
    var tk=Object.keys(byTaker).map(function(k){ return [k,byTaker[k]]; }).sort(function(a,b){ return b[1]-a[1]; }).slice(0,8);
    if(tk.length) h+='<div class="us-box"><div class="us-h">Who takes attendance</div><div class="us-sub">Sessions recorded per person.</div>'+hbars(tk)+'</div>';
    if(!att.length && !recs.length) h+='<div class="empty">Nothing recorded yet.</div>';
    X={att:att.length,courses:cl,months:byMonth,takers:byTaker,avg:avg,students:Object.keys(studs).length,scores:recs.length};
    h+='<button type="button" class="us-btn" onclick="usageDownload()">&#11015;&nbsp; Download summary (Excel)</button>';
    box.innerHTML=h;
  }catch(e){ box.innerHTML='<div class="empty">Could not load: '+esc(e.message||'error')+'</div>'; }
};
window.usageDownload=function(){
  if(!X||!window.XLSX) return;
  var wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['Measure','Value'],['Students on lists',X.students],['Attendance sessions',X.att],['Average attendance %',X.avg],['Scores recorded',X.scores]]),'Overview');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['Course','Sessions','Attendance %','Scores recorded']].concat(X.courses.map(function(x){ return [x[0],x[1].s,x[1].t?Math.round(x[1].p*100/x[1].t):'',x[1].sc]; }))),'Courses');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['Month','Sessions']].concat(Object.keys(X.months).sort().map(function(m){ return [m,X.months[m]]; }))),'Months');
  XLSX.writeFile(wb,'Usage summary - '+new Date().toISOString().slice(0,10)+'.xlsx');
};
})();
