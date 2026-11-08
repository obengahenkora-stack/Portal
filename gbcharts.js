/* ===== Gradebook charts: class summary, grade spread, assessment averages ===== */
(function(){
var css=document.createElement('style');
css.textContent='#gbCharts{margin-top:18px}'
+'#gbCharts .gc-h{font-weight:700;font-size:1rem;margin:0 0 10px}'
+'#gbCharts .gc-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}'
+'#gbCharts .gc-s{border:1px solid var(--line);border-radius:14px;padding:12px;background:var(--card);text-align:center}'
+'#gbCharts .gc-s b{display:block;font-size:1.35rem;font-weight:800;line-height:1.1}'
+'#gbCharts .gc-s span{font-size:.7rem;color:var(--muted);font-weight:600}'
+'#gbCharts .gc-box{border:1px solid var(--line);border-radius:16px;padding:14px;background:var(--card);margin-bottom:14px}'
+'#gbCharts .gc-sub{font-size:.76rem;color:var(--muted);margin:-4px 0 12px}'
+'#gbCharts .gc-cols{display:flex;align-items:flex-end;gap:6px;height:150px;padding-top:18px}'
+'#gbCharts .gc-col{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;min-width:0}'
+'#gbCharts .gc-col i{display:block;width:100%;border-radius:8px 8px 0 0;background:linear-gradient(180deg,#0ea5e9,#0d9488);min-height:2px}'
+'#gbCharts .gc-col em{font-style:normal;font-size:.72rem;font-weight:700;margin-bottom:3px}'
+'#gbCharts .gc-lab{display:flex;gap:6px;margin-top:6px}'
+'#gbCharts .gc-lab span{flex:1;text-align:center;font-size:.64rem;color:var(--muted);min-width:0}'
+'#gbCharts .gc-row{display:grid;grid-template-columns:minmax(80px,34%) 1fr 44px;gap:8px;align-items:center;margin:8px 0;font-size:.8rem}'
+'#gbCharts .gc-row .n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
+'#gbCharts .gc-bar{height:12px;border-radius:99px;background:rgba(127,127,127,.18);overflow:hidden}'
+'#gbCharts .gc-bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#16a34a,#0d9488)}'
+'#gbCharts .gc-row b{text-align:right}';
document.head.appendChild(css);
function esc(t){ return String(t).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function num(v){ var n=parseFloat(String(v==null?'':v).replace(/[^0-9.\-]/g,'')); return isFinite(n)?n:null; }
function r1(x){ return Math.round(x*10)/10; }
window.gbCharts=function(){
  var box=document.getElementById('gbCharts'); if(!box) return;
  var g=window._gb||(typeof _gb!=='undefined'?_gb:null);
  if(!g || !g.rows || !g.rows.length || !g.cols || !g.cols.length){ box.innerHTML=''; return; }
  var finals=g.rows.map(function(r){ return num(r.final); }).filter(function(x){ return x!==null; });
  var h='';
  if(finals.length){
    var sorted=finals.slice().sort(function(a,b){ return a-b; }), n=sorted.length, sum=sorted.reduce(function(a,b){ return a+b; },0);
    var med=n%2?sorted[(n-1)/2]:(sorted[n/2-1]+sorted[n/2])/2, pass=sorted.filter(function(x){ return x>=20; }).length;
    h+='<div class="gc-h">Class summary</div><div class="gc-stats">'
      +[['Average',r1(sum/n)+' / 40'],['Median',r1(med)+' / 40'],['Pass rate',Math.round(pass*100/n)+'%'],['Highest',r1(sorted[n-1])],['Lowest',r1(sorted[0])],['Students',n]].map(function(x){ return '<div class="gc-s"><b>'+x[1]+'</b><span>'+x[0]+'</span></div>'; }).join('')+'</div>';
    var bins=[0,0,0,0,0,0,0,0], labs=['0-5','5-10','10-15','15-20','20-25','25-30','30-35','35-40'];
    finals.forEach(function(f){ var i=Math.min(7,Math.max(0,Math.floor(f/5))); bins[i]++; });
    var mx=Math.max.apply(null,bins)||1;
    h+='<div class="gc-box"><div class="gc-h">Grade spread</div><div class="gc-sub">Number of students by Final mark (out of 40). Pass mark is 20.</div><div class="gc-cols">'
      +bins.map(function(c){ return '<div class="gc-col"><em>'+(c||'')+'</em><i style="height:'+Math.round(c*100/mx)+'%"></i></div>'; }).join('')+'</div><div class="gc-lab">'+labs.map(function(l){ return '<span>'+l+'</span>'; }).join('')+'</div></div>';
  } else {
    h+='<div class="gc-box"><div class="gc-sub">Enter the "marked out of" total for each assessment and save, and the class summary and grade spread will appear here.</div></div>';
  }
  var rowsA=g.cols.map(function(c,i){
    var vals=g.rows.map(function(r){ return num(r.vals[i]); }).filter(function(x){ return x!==null; });
    if(!vals.length) return null; var avg=vals.reduce(function(a,b){ return a+b; },0)/vals.length, mxv=num(g.maxes[i]);
    return {name:c,avg:avg,max:mxv,pct:mxv>0?Math.min(100,avg*100/mxv):null};
  }).filter(Boolean);
  if(rowsA.length){
    h+='<div class="gc-box"><div class="gc-h">Average per assessment</div><div class="gc-sub">Class average as a share of the marks available.</div>'
      +rowsA.map(function(a){ var p=a.pct; return '<div class="gc-row"><div class="n" title="'+esc(a.name)+'">'+esc(a.name)+'</div><div class="gc-bar"><i style="width:'+(p===null?0:Math.round(p))+'%"></i></div><b>'+(p===null?r1(a.avg):Math.round(p)+'%')+'</b></div>'; }).join('')+'</div>';
  }
  box.innerHTML=h;
};
try{ var _rg=window.renderGradebook; if(typeof _rg==='function'){ window.renderGradebook=async function(){ var r=await _rg.apply(this,arguments); try{ gbCharts(); }catch(e){} return r; }; } }catch(e){}
})();
