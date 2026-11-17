/* ===== Online Exams (staff): create exams, build questions, set time and camera-snapshot rules ===== */
(function(){
function $(i){ return document.getElementById(i); }
function esc(t){ return String(t==null?'':t).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function uid(){ return 'q'+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function pad(n){ return ('0'+n).slice(-2); }
function toLocal(iso){ var d=new Date(iso); if(isNaN(d)) return ''; return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes()); }
function fmt(iso){ try{ return new Date(iso).toLocaleString([], {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}); }catch(e){ return iso; } }
var css=document.createElement('style');
css.textContent='#onlineExamCard,#onlineExamCard *{font-family:inherit}'
+'#onlineExamCard .oe-l{font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:0 0 5px}'
+'#onlineExamCard .oe-f{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;margin:14px 0}'
+'#onlineExamCard input:not([type=checkbox]):not([type=radio]),#onlineExamCard select,#onlineExamCard textarea{width:100% !important;max-width:100% !important;box-sizing:border-box !important;min-width:0;margin:0 !important}'
+'#onlineExamCard textarea{min-height:76px}'
+'#onlineExamCard .oe-two{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px}#onlineExamCard .oe-two>div{min-width:0}'
+'#onlineExamCard .oe-box,#onlineExamCard .oe-q,#onlineExamCard .oe-card{box-sizing:border-box;max-width:100%}#onlineExamCard .oe-box{border:1px solid var(--line);border-radius:16px;padding:14px;background:var(--card);margin-top:12px}'
+'#onlineExamCard .oe-h{font-weight:700;margin:0 0 4px}'
+'#onlineExamCard .oe-sub{font-size:.78rem;color:var(--muted);margin:0 0 10px}'
+'#onlineExamCard .oe-sw{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px dashed var(--line);font-size:.88rem}'
+'#onlineExamCard .oe-sw:first-of-type{border-top:0}'
+'#onlineExamCard .oe-sw small{display:block;color:var(--muted);font-size:.74rem}'
+'#onlineExamCard .oe-tg:not(#z){flex:0 0 48px;width:48px !important;height:28px;padding:0 !important;border-radius:999px !important;background:rgba(127,127,127,.35) !important;border:0 !important;box-shadow:none !important;position:relative}'
+'#onlineExamCard .oe-tg i{position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:left .2s}'
+'#onlineExamCard .oe-tg.on:not(#z){background:#16a34a !important}#onlineExamCard .oe-tg.on i{left:23px}'
+'#onlineExamCard .oe-q{border:1px solid var(--line);border-radius:16px;padding:14px;margin-top:12px;background:var(--card)}'
+'#onlineExamCard .oe-qt{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}'
+'#onlineExamCard .oe-n{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#0ea5e9,#0d9488);color:#fff;font-weight:800;font-size:.8rem;display:flex;align-items:center;justify-content:center}'
+'#onlineExamCard .oe-opt{display:flex;align-items:center;gap:8px;margin-top:8px}'
+'#onlineExamCard .oe-opt input[type=radio]{width:20px !important;height:20px;flex:0 0 20px;margin:0 !important;accent-color:#16a34a}'
+'#onlineExamCard .oe-mini:not(#z){width:auto !important;padding:6px 11px !important;font-size:.76rem !important;border-radius:999px !important;background:var(--card) !important;color:var(--ink) !important;border:1px solid var(--line) !important;box-shadow:none !important;font-weight:700 !important;letter-spacing:0 !important;text-transform:none !important;white-space:nowrap}'
+'#onlineExamCard .oe-mini.x:not(#z){color:#dc2626 !important}'
+'#onlineExamCard .oe-btn:not(#z){width:100% !important;padding:12px !important;border-radius:14px !important;font-weight:700 !important;font-size:.9rem !important;text-transform:none !important;letter-spacing:0 !important}'
+'#onlineExamCard .oe-btn.s:not(#z){background:var(--card) !important;color:var(--ink) !important;border:1px solid var(--line) !important;box-shadow:none !important}'
+'#onlineExamCard .oe-row{display:flex;gap:8px;margin-top:12px}#onlineExamCard .oe-row>*{flex:1 1 0}'
+'#onlineExamCard .oe-card{border:1px solid var(--line);border-left:4px solid #d97706;border-radius:16px;padding:14px;margin-top:10px;background:var(--card)}'
+'#onlineExamCard .oe-card.pub{border-left-color:#16a34a}'
+'#onlineExamCard .oe-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}'
+'#onlineExamCard .oe-nm{font-weight:700;line-height:1.25;overflow-wrap:anywhere}'
+'#onlineExamCard .oe-st{flex:0 0 auto;padding:3px 10px;border-radius:999px;font-size:.72rem;font-weight:700;background:rgba(217,119,6,.15);color:#b45309}'
+'#onlineExamCard .oe-st.pub{background:rgba(22,163,74,.15);color:#15803d}'
+'#onlineExamCard .oe-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}'
+'#onlineExamCard .oe-chip{padding:3px 10px;border-radius:999px;font-size:.73rem;font-weight:700;background:rgba(14,165,233,.12);color:#0369a1}'
+'#onlineExamCard .oe-chip.g{background:rgba(127,127,127,.16);color:var(--ink)}'
+'#onlineExamCard .oe-sum{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}'
+'#onlineExamCard .oe-sum div{border:1px solid var(--line);border-radius:12px;padding:10px;text-align:center;background:var(--card)}'
+'#onlineExamCard .oe-sum b{display:block;font-size:1.2rem}#onlineExamCard .oe-sum span{font-size:.68rem;color:var(--muted);font-weight:600}';
document.head.appendChild(css);

var LIST=[], E=null, COURSES=[];
// ---- question variants: each student gets their own numbers; the server marks numeric answers by formula
const VARRE = /\[\[var:(\{[\s\S]*?\})\]\]/;
const varSpec = (q) => { if (!q || q.type !== 'text') return null; const m = VARRE.exec(String(q.guide || '')); if (!m) return null; try { const s = JSON.parse(m[1]); if (s && s.v && typeof s.f === 'string') return s; } catch { /* ignore */ } return null; };
const hash32 = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = (seed) => () => { seed = (seed + 0x6D2B79F5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const varVals = (spec, seedStr) => { const r = rng(hash32(seedStr)); const out = {}; for (const k of Object.keys(spec.v).slice(0, 12)) { const [lo, hi, st] = spec.v[k].map(Number); const step = st > 0 ? st : 1; const n = Math.max(0, Math.floor((hi - lo) / step + 1e-9)); const x = lo + Math.floor(r() * (n + 1)) * step; out[k] = Math.round(x * 1e6) / 1e6; } return out; };
const calcF = (src, vars) => {
  const t = String(src).replace(/\s+/g, '').match(/\d*\.?\d+(?:e[+-]?\d+)?|[A-Za-z_]\w*|[-+*/^(),]/gi) || []; let p = 0;
  const F = { sqrt: Math.sqrt, abs: Math.abs, sin: Math.sin, cos: Math.cos, tan: Math.tan, ln: Math.log, log: Math.log10, exp: Math.exp, asin: Math.asin, acos: Math.acos, atan: Math.atan };
  const prim = () => { const x = t[p++]; if (x === undefined) throw 1; if (x === '(') { const v = add(); if (t[p++] !== ')') throw 1; return v; } if (/^[\d.]/.test(x)) return parseFloat(x); if (F[x.toLowerCase()] && t[p] === '(') { p++; const v = add(); if (t[p++] !== ')') throw 1; return F[x.toLowerCase()](v); } if (x.toLowerCase() === 'pi') return Math.PI; if (Object.prototype.hasOwnProperty.call(vars, x)) return vars[x]; throw 1; };
  const un = () => { if (t[p] === '-') { p++; return -un(); } if (t[p] === '+') { p++; return un(); } return pw(); };
  const pw = () => { const b = prim(); if (t[p] === '^') { p++; return Math.pow(b, un()); } return b; };
  const mul = () => { let v = un(); while (t[p] === '*' || t[p] === '/') { const o = t[p++]; const r = un(); v = o === '*' ? v * r : v / r; } return v; };
  const add = () => { let v = mul(); while (t[p] === '+' || t[p] === '-') { const o = t[p++]; const r = mul(); v = o === '+' ? v + r : v - r; } return v; };
  const v = add(); if (p < t.length) throw 1; return v;
};
const varText = (text, vals) => String(text).replace(/\{(\w+)\}/g, (m, k) => (vals && Object.prototype.hasOwnProperty.call(vals, k) ? String(vals[k]) : m));
const varMark = (spec, vals, ans, marks) => { try { const exp = calcF(spec.f, vals); const m = /-?\d[\d,]*\.?\d*(?:e[+-]?\d+)?|-?\.\d+/i.exec(String(ans == null ? '' : ans).replace(/\s+/g, '')); if (!m || !isFinite(exp)) return { exp, ok: false }; const got = parseFloat(m[0].replace(/,/g, '')); const tol = Math.max(0, Number(spec.tol) || 0) / 100; const ok = Math.abs(got - exp) <= Math.max(Math.abs(exp) * tol, 1e-9, tol === 0 ? 1e-6 : 0); return { exp, ok, got, marks: ok ? marks : 0 }; } catch { return { exp: null, ok: false }; } };

function vrNames(t){ var o=[],m,re=/\{(\w+)\}/g; while((m=re.exec(t||''))){ if(o.indexOf(m[1])<0) o.push(m[1]); } return o; }
function vrBox(i,q){
  var on=q.vr&&q.vr.on, h='<div class="oe-sw" style="margin-top:12px"><div><b style="font-size:.88rem">Different numbers for each student</b><small>Write the numbers in the question as {L}, {w} ... Each student gets their own values and the system marks the answer for you.</small></div><input type="checkbox" '+(on?'checked ':'')+'onchange="oeVTog('+i+')" style="width:22px;height:22px"></div>';
  if(!on) return h;
  var v=q.vr, names=vrNames(q.text); v.v=v.v||{};
  h+='<div class="oe-box" style="margin-top:8px"><div class="oe-l">Numbers (write them in the question like {L})</div>';
  if(!names.length) h+='<div class="oe-sub">No numbers found yet. Type something like {L} in the question above, then press Update.</div>';
  names.forEach(function(k){ var r=v.v[k]||[1,10,1];
    h+='<div style="display:flex;gap:6px;align-items:center;margin-top:6px"><b style="min-width:44px">{'+esc(k)+'}</b>from <input type="number" id="oeVl'+i+'_'+k+'" value="'+r[0]+'" step="any" style="width:70px" oninput="oeVPrev('+i+')"> to <input type="number" id="oeVh'+i+'_'+k+'" value="'+r[1]+'" step="any" style="width:70px" oninput="oeVPrev('+i+')"> step <input type="number" id="oeVs'+i+'_'+k+'" value="'+r[2]+'" step="any" min="0" style="width:60px" oninput="oeVPrev('+i+')"></div>'; });
  h+='<button type="button" class="oe-mini" style="margin-top:8px" onclick="oeVRef('+i+')">Update numbers from question</button>'
    +'<div class="oe-two" style="margin-top:10px"><div><div class="oe-l">Correct answer (formula)</div><input type="text" id="oeVf'+i+'" value="'+esc(v.f||'')+'" placeholder="e.g. w*L^2/8" oninput="oeVPrev('+i+')"></div><div><div class="oe-l">Allowed error (%)</div><input type="number" id="oeVt'+i+'" min="0" step="0.1" value="'+(v.tol==null?1:v.tol)+'" oninput="oeVPrev('+i+')"></div></div>'
    +'<div class="oe-sub">Use + - * / ^ ( ) and sqrt, sin, cos, tan, ln, log, exp, abs, pi.</div>'
    +'<div id="oeVp'+i+'" style="margin-top:10px;background:rgba(21,128,61,.10);border-radius:10px;padding:10px"></div></div>';
  return h; }
function vrSync(i,q){
  if(!q.vr||!q.vr.on) return; var f=$('oeVf'+i); if(!f) return;
  q.vr.f=f.value; var t=parseFloat($('oeVt'+i).value); q.vr.tol=t>=0?t:0; q.vr.v=q.vr.v||{};
  vrNames($('oeQt'+i).value).forEach(function(k){ var l=$('oeVl'+i+'_'+k); if(!l) return; q.vr.v[k]=[parseFloat(l.value),parseFloat($('oeVh'+i+'_'+k).value),parseFloat($('oeVs'+i+'_'+k).value)||1]; }); }
var VSEED={};
window.oeVPrev=function(i){ var q=E.questions[i], b=$('oeVp'+i); if(!b) return; sync(); if(!VSEED[i]) VSEED[i]=Math.random()+'';
  var sp=vrSpecOf(q); if(!sp){ b.innerHTML='<div class="oe-sub">Fill in the numbers and the formula to see a preview.</div>'; return; }
  try{ var vals=varVals(sp,VSEED[i]+'a'), vals2=varVals(sp,VSEED[i]+'b');
    b.innerHTML='<b>What a student sees</b><div style="margin:6px 0">'+esc(varText(q.text,vals))+'</div><div class="oe-sub">Correct answer for this student: <b>'+(Math.round(calcF(sp.f,vals)*1e4)/1e4)+'</b> (error allowed '+sp.tol+'%)</div><div class="oe-sub">Another student: '+esc(JSON.stringify(vals2).replace(/[{}"]/g,'').replace(/,/g,', '))+' &rarr; answer <b>'+(Math.round(calcF(sp.f,vals2)*1e4)/1e4)+'</b></div><button type="button" class="oe-mini" style="margin-top:8px" onclick="oeVShuf('+i+')">Shuffle preview</button>';
  }catch(e){ b.innerHTML='<div class="msg err" style="margin:0">The formula does not work with these numbers. Check the letters match the {numbers} in the question.</div>'; } };
window.oeVShuf=function(i){ VSEED[i]=Math.random()+''; oeVPrev(i); };
function vrSpecOf(q){ if(!q.vr||!q.vr.on) return null; var names=vrNames(q.text), v={}; for(var k=0;k<names.length;k++){ var r=q.vr.v&&q.vr.v[names[k]]; if(!r||!isFinite(r[0])||!isFinite(r[1])||r[1]<r[0]) return null; v[names[k]]=r; } if(!names.length||!(q.vr.f||'').trim()) return null; return {v:v,f:q.vr.f,tol:q.vr.tol||0}; }
window.oeVTog=function(i){ sync(); var q=E.questions[i]; if(q.vr&&q.vr.on) q.vr.on=false; else q.vr=Object.assign({v:{},f:'',tol:1},q.vr||{},{on:true}); renderEdit(); setTimeout(function(){ oeVPrev(i); },0); };
window.oeVRef=function(i){ sync(); renderEdit(); setTimeout(function(){ oeVPrev(i); },0); };
var VRE=/\s*\[\[var:(\{[\s\S]*?\})\]\]/;

function msg(h){ var m=$('oeMsg'); if(m) m.innerHTML=h||''; }

var _cp=null;
function loadCourses(){ if(_cp) return _cp; _cp=(async function(){ try{ var d=await fetchSupabaseData(); var names=visibleCourses(Object.keys((d&&d.rosters)||{})); var seen={},out=[]; names.forEach(function(n){ var b=lmBase(n); if(!seen[b.toLowerCase()]){ seen[b.toLowerCase()]=1; out.push(b); } }); out.sort(); COURSES=out; }catch(e){ _cp=null; } })(); return _cp; }
window.oeInit=async function(){ window.RVFIL="";
  var box=$('oeBody'); if(!box) return;
  if(!box.innerHTML||/Loading|Could not/.test(box.innerHTML)) box.innerHTML='<div class="empty">Loading...</div>';
  loadCourses();
  try{
    var j=await teamApi({action:'oe_list'}); if(!j||!j.ok) throw new Error((j&&j.error)||'Back end not updated yet (deploy step 39)');
    LIST=j.exams||[]; E=null; renderList();
  }catch(e){ box.innerHTML='<div class="empty">Could not load ('+esc(e.message||'error')+')</div>'; }
};

function renderList(){
  var box=$('oeBody'); msg('');
  try{ var _n=Date.now(),_a=0,_u=0,_r=0; LIST.forEach(function(x){ if(x.status!=='published') return; var ts=Date.parse(x.start),te=Date.parse(x.end); if(isFinite(te)&&_n>te){ if(!x.released) _r++; } else if(isFinite(ts)&&_n<ts) _u++; else _a++; }); var g=function(i){ return document.getElementById(i); }; if(g('exaN1')){ g('exaN1').textContent=_a; g('exaN2').textContent=_u; g('exaN3').textContent=_r; } var lv=g('exaLive'); if(lv){ lv.style.display=_a?'':'none'; lv.textContent=_a+' live'; } }catch(e){}
  var h=(window.oeBanner?oeBanner(LIST):'')+'<button type="button" class="oe-btn" onclick="oeNew()" style="margin-top:12px">+ Create an exam</button>';
  if(!LIST.length) h+='<div class="empty" style="margin-top:14px">No online exams yet.</div>';
  h+=LIST.map(function(x,i){
    var pub=x.status==='published', n=(x.questions||[]).length, marks=(x.questions||[]).reduce(function(t,q){ return t+(q.marks||0); },0);
    var now=Date.now(), ts=Date.parse(x.start), te=Date.parse(x.end), ended=pub&&isFinite(te)&&now>te, upcoming=pub&&isFinite(ts)&&now<ts;
    var stTxt=!pub?'Draft':(ended?'Ended':(upcoming?'Upcoming':'Open now')), stSty=ended?' style="background:rgba(100,116,139,.18);color:#475569"':(upcoming?' style="background:rgba(14,165,233,.15);color:#0369a1"':'');
    return '<div class="oe-card'+(pub&&!ended?' pub':'')+'"><div class="oe-top"><div><div class="oe-nm">'+esc(x.title)+'</div><div style="font-size:.78rem;color:var(--muted);margin-top:2px">'+esc(x.course)+(ended?' &middot; Closed '+esc(fmt(x.end)):'')+'</div></div><span class="oe-st'+(pub&&!ended&&!upcoming?' pub':'')+'"'+stSty+'>'+stTxt+'</span></div>'
      +'<div class="oe-chips"><span class="oe-chip">'+esc(fmt(x.start))+' to '+esc(fmt(x.end))+'</span><span class="oe-chip g">'+x.durationMin+' min</span><span class="oe-chip g">'+n+' question'+(n===1?'':'s')+' &middot; '+marks+' marks</span><span class="oe-chip g">Photo every '+x.snapEverySec+'s</span></div>'
      +'<div class="oe-row">'+(pub?'<button type="button" class="oe-mini" onclick="oeLive(\''+x.id+'\')"><span style="color:#16a34a">&#9679;</span> Live</button><button type="button" class="oe-mini" onclick="oeResults(\''+x.id+'\')">Results</button>':'')+'<button type="button" class="oe-mini" onclick="oeEdit('+i+')">Edit</button><button type="button" class="oe-mini" onclick="oeCopy('+i+')">Duplicate</button><button type="button" class="oe-mini x" onclick="oeDel('+i+')">Delete</button></div>'+'</div>';
  }).join('');
  box.innerHTML=h; closeLive();
}

/* ---- exam health panel: while an exam is open, checks the services and the students every 30 s ---- */
var HT=0, HBUSY=false, HSEL='';
var H_CF='https://exams-api.obengahenkora.workers.dev/', H_AUTH='https://qqnsbuirelhwfrshafay.supabase.co', H_AUTHKEY='sb_publishable_i7IlRqbP0LRbHABx9iwQKQ_AYMWtzpQ';
function hOpen(){ var n=Date.now(); return (LIST||[]).filter(function(x){ var ts=Date.parse(x.start), te=Date.parse(x.end); return x.status==='published' && isFinite(ts) && isFinite(te) && n<=te; }); }
function hPing(url,opt){ var t=performance.now(), ac=(typeof AbortController!=='undefined')?new AbortController():null, to=ac?setTimeout(function(){ ac.abort(); },8000):0; if(ac) opt.signal=ac.signal;
  return fetch(url,opt).then(function(r){ clearTimeout(to); return {ms:Math.round(performance.now()-t),ok:r.status<500}; }).catch(function(){ clearTimeout(to); return {ms:Math.round(performance.now()-t),ok:false}; }); }
function hStart(){ if(HT){ clearInterval(HT); HT=0; } if(!$('oeHealth')) return; hRun(); HT=setInterval(function(){ if(!$('oeHealth')){ clearInterval(HT); HT=0; return; } hRun(); },30000); }
async function hRun(){
  if(HBUSY) return; HBUSY=true;
  try{
    var ex=HSEL?(LIST||[]).filter(function(x){ return x.id===HSEL; }):hOpen(); if(!ex.length){ HBUSY=false; return; }
    var js={method:'POST',headers:{'Content-Type':'text/plain'},body:'{"action":"ping"}'};
    var jk={method:'POST',headers:{'Content-Type':'text/plain',apikey:SUPABASE_KEY},body:'{"action":"ping"}'};
    var t0=performance.now();
    var res=await Promise.all([
      hPing(H_CF,js),
      hPing(SUPABASE_URL+'/functions/v1/exams',jk),
      Promise.all(ex.map(function(x){ return teamApi({action:'rv_live',id:x.id}); })).then(function(r){ return {ms:Math.round(performance.now()-t0),ok:r.every(function(q){ return q&&q.ok; }),r:r}; }).catch(function(){ return {ms:Math.round(performance.now()-t0),ok:false,r:[]}; }),
      hPing(H_AUTH+'/auth/v1/health',{method:'GET',headers:{apikey:H_AUTHKEY}})
    ]);
    var sv=[['Exam service (Cloudflare)',res[0]],['Exams function',res[1]],['Review / live function',res[2]],['Student sign-in service',res[3]]];
    var L=[],files=0,done=0,unk=0,ftot=0; (res[2].r||[]).forEach(function(q){ if(q&&q.ok){ L=L.concat(q.live||[]); files+=(q.files||0); done+=(q.submitted!=null?q.submitted:(q.doneRecent||0)); unk+=(q.unknown||0); ftot+=(q.flagTotal||0); } });
    var quiet=L.filter(function(x){ return x.seen>150; }).length, paused=L.filter(function(x){ return x.paused; }).length;
    var cnt=function(k){ return L.filter(function(x){ return x.last===k; }).length; };
    var sig=[['Camera turned off',cnt('camera_off')],['Network changes',cnt('network_change')],['Paused by face guard',paused],['Total flags, all students',ftot+(unk?'+':'')],['Left the exam page',L.filter(function(x){ return x.leaves>0; }).length]];
    var bad=[],warn=[];
    sv.forEach(function(p){ var r=p[1]; if(!r.ok) bad.push(p[0]+' is not answering'); else if(r.ms>4000) bad.push(p[0]+' is very slow ('+r.ms+' ms)'); else if(r.ms>1500) warn.push(p[0]+' is a little slow ('+r.ms+' ms)'); });
    var qLim=Math.max(3,Math.round(L.length*0.05)); if(L.length>=10 && quiet>=Math.max(6,Math.round(L.length*0.15))) bad.push(quiet+' students have gone quiet'); else if(quiet>=qLim) warn.push(quiet+' student'+(quiet===1?' has':'s have')+' gone quiet');
    var lvl=bad.length?'r':(warn.length?'a':'g'), C={g:['#dcfce7','#86efac','#166534','#16a34a','All good'],a:['#fef3c7','#fcd34d','#92400e','#f59e0b','Watch'],r:['#fee2e2','#fca5a5','#991b1b','#dc2626','Problem']}[lvl];
    var why=bad.concat(warn).join('. ')||('Everything is answering quickly'+(ex.length===1?' for '+ex[0].title:''));
    var now=new Date(), tm=now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'});
    function kp(n,t,c){ return '<div style="flex:1;min-width:70px;background:var(--card);border-radius:12px;padding:9px 4px;text-align:center"><b style="display:block;font-size:1.3rem'+(c?';color:'+c:'')+'">'+n+'</b><span style="font-size:.68rem;color:var(--muted)">'+t+'</span></div>'; }
    var h='<div style="display:flex;align-items:center;gap:12px;background:'+C[0]+';border:1px solid '+C[1]+';border-radius:14px;padding:12px 14px;margin-top:12px;flex-wrap:wrap"><i style="width:14px;height:14px;border-radius:50%;background:'+C[3]+';box-shadow:0 0 0 5px '+C[3]+'33;flex:0 0 auto"></i><div style="flex:1;min-width:180px"><b style="font-size:1.05rem;color:'+C[2]+'">'+C[4]+'</b><div style="font-size:.8rem;color:'+C[2]+'">'+esc(why)+'</div></div><span style="font-size:.72rem;color:'+C[2]+';opacity:.85">Checked '+esc(tm)+' &middot; every 30 s</span></div>'
     +'<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">'+kp(files,'started')+kp(Math.max(0,L.length-paused),'writing now')+kp(done+(unk?'+':''),'submitted')+kp(quiet,'gone quiet',quiet?'#d97706':'')+'</div>'
     +'<div style="margin-top:10px;border:1px solid var(--line);border-radius:12px;padding:4px 12px">'+sv.map(function(p){ var r=p[1], col=!r.ok||r.ms>4000?'#dc2626':(r.ms>1500?'#f59e0b':'#16a34a'); return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--line);font-size:.86rem"><span style="width:10px;height:10px;border-radius:50%;background:'+col+';flex:0 0 auto"></span>'+esc(p[0])+'<span style="margin-left:auto;color:var(--muted);font-size:.8rem;white-space:nowrap">'+(r.ok?r.ms+' ms'+(r.ms>1500?' &middot; slow':''):'not answering')+'</span></div>'; }).join('').replace('border-top:1px solid var(--line);','')+'</div>'
     +'<div style="margin-top:10px;border:1px solid var(--line);border-radius:12px;padding:4px 12px"><div style="font-size:.7rem;font-weight:800;color:var(--muted);padding:8px 0 2px;text-transform:uppercase;letter-spacing:.04em">Problem signs right now</div>'+sig.map(function(p){ return '<div style="display:flex;justify-content:space-between;font-size:.84rem;padding:6px 0;border-top:1px solid var(--line)"><span>'+p[0]+'</span><b>'+p[1]+'</b></div>'; }).join('')+'</div>';
    var box=$('oeHealth'); if(box) box.innerHTML=h;
  }catch(e){ var b2=$('oeHealth'); if(b2) b2.innerHTML='<div class="oe-sub" style="margin-top:12px">Health check could not run ('+esc(e.message||'error')+'). Trying again in 30 s.</div>'; }
  HBUSY=false;
}
/* ---- live strip on each open exam card (refreshes every 30 s while this list is on screen) ---- */
var LVT=0, LVALL={};
function lvStart(){ if(LVT){ clearInterval(LVT); LVT=0; } if(!document.querySelector('.oe-lv')) return; lvPoll(); LVT=setInterval(function(){ if(!document.querySelector('.oe-lv')){ clearInterval(LVT); LVT=0; return; } lvPoll(); },30000); }
async function lvPoll(){
  var els=[].slice.call(document.querySelectorAll('.oe-lv'));
  for(var k=0;k<els.length;k++){ var id=els[k].id.replace('oeLv_',''); try{ var r=await teamApi({action:'rv_live',id:id}); lvDraw(id,r); }catch(e){ var b=$('oeLv_'+id); if(b) b.innerHTML='<div class="oe-sub" style="margin:0">&#9679; LIVE: could not load ('+esc(e.message||'error')+'). Trying again in 30 s.</div>'; } }
}
function closeLive(){ var o=$('oeLvPop'); if(o) o.remove(); HSEL=''; document.body.style.overflow=''; if(HT){ clearInterval(HT); HT=0; } if(LVT){ clearInterval(LVT); LVT=0; } }
window.oeLive=function(id){
  var x=(LIST||[]).filter(function(q){ return q.id===id; })[0]; if(!x) return;
  closeLive(); HSEL=id; LVALL[id]=true;
  var o=document.createElement('div'); o.id='oeLvPop'; o.style.cssText='position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.55);display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:16px';
  o.onclick=function(e){ if(e.target===o) closeLive(); };
  o.innerHTML='<div style="background:var(--page,var(--bg,#fff));color:var(--ink);width:100%;max-width:780px;border-radius:18px;padding:16px 16px 20px;box-shadow:0 20px 60px rgba(0,0,0,.4)"><div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px"><div><div style="font-weight:800;font-size:1.05rem"><span style="color:#16a34a">&#9679;</span> Live &middot; '+esc(x.title)+'</div><div style="font-size:.78rem;color:var(--muted)">'+esc(x.course)+' &middot; '+esc(fmt(x.start))+' to '+esc(fmt(x.end))+'. Runs by itself every 30 s while this window is open.</div></div><button type="button" class="oe-mini" onclick="closeLive()">Close</button></div><div id="oeHealth"></div><div class="oe-lv" id="oeLv_'+id+'" style="margin-top:12px;border-top:1px solid var(--line);padding-top:10px"><div class="oe-sub" style="margin:0">&#9679; LIVE: loading...</div></div></div>';
  document.body.appendChild(o); document.body.style.overflow='hidden';
  hStart(); lvStart();
};
window.closeLive=closeLive;
try{ document.addEventListener('keydown',function(e){ if(e.key==='Escape' && $('oeLvPop')) closeLive(); }); }catch(e){}
window.oeLvAll=function(id){ LVALL[id]=!LVALL[id]; var b=$('oeLv_'+id); if(b&&b._r) lvDraw(id,b._r); };
function lvDraw(id,r){
  var b=$('oeLv_'+id); if(!b) return; b._r=r; var L=(r&&r.live)||[]; var paused=L.filter(function(x){return x.paused;}).length, flagged=L.filter(function(x){return x.flags>0||x.leaves>0;}).length, writing=L.length-paused;
  function kp(n,t,c){ return '<div style="flex:1;min-width:64px;border:1px solid var(--line);border-radius:12px;padding:7px 4px;text-align:center"><b style="display:block;font-size:1.15rem'+(c?';color:'+c:'')+'">'+n+'</b><span style="font-size:.68rem;color:var(--muted)">'+t+'</span></div>'; }
  var h='<div class="oe-sub" style="margin:0 0 8px"><b style="color:#16a34a">&#9679; LIVE</b> &middot; updates every 30 s</div><div style="display:flex;gap:6px;flex-wrap:wrap">'+kp(writing,'writing now')+kp(paused,'paused',paused?'#dc2626':'')+kp((r.flaggedStudents!=null?r.flaggedStudents:flagged)+(r.unknown?'+':''),'students flagged',(r.flaggedStudents!=null?r.flaggedStudents:flagged)?'#d97706':'')+kp((r.flagTotal!=null?r.flagTotal:0)+(r.unknown?'+':''),'total flags',(r.flagTotal||0)?'#d97706':'')+kp((r.submitted!=null?r.submitted:(r.doneRecent||0))+(r.unknown?'+':''),'submitted'+(r.unknown?' (counting...)':''))+kp(r.files||0,'started')+'</div>';
  var all=!!LVALL[id], rows=all?L:L.slice(0,5);
  h+=rows.map(function(x){ var st=x.paused?'border-color:#dc2626;background:rgba(220,38,38,.10)':(x.flags>0?'border-color:#d97706':''); var gone=x.seen>150;
    return '<div style="display:flex;justify-content:space-between;gap:8px;border:1px solid var(--line);border-radius:10px;padding:7px 10px;margin-top:6px;font-size:.8rem;'+st+'"><span style="overflow-wrap:anywhere">'+esc(x.name||x.index||'')+' <span style="color:var(--muted)">'+esc(x.index||'')+'</span></span><span style="text-align:right;white-space:nowrap">'+(x.paused?'<b style="color:#dc2626">PAUSED</b> &middot; ':'')+(gone?'<span style="color:var(--muted)">no signal '+Math.round(x.seen/60)+' min &middot; </span>':'')+'Q'+x.q+'/'+x.n+(x.flags?' &middot; '+x.flags+' flag'+(x.flags===1?'':'s'):'')+(x.leaves?' &middot; left page '+x.leaves+'x':'')+'</span></div>'; }).join('');
  if(!L.length){ var _x=(LIST||[]).filter(function(q){ return q.id===id; })[0], _w=_x&&Date.now()<Date.parse(_x.start); h+='<div class="oe-sub" style="margin:8px 0 0">'+(_w?'Waiting for students. This exam opens '+esc(fmt(_x.start))+'. Students appear here by themselves as they start.':'Nobody is writing right now.')+'</div>'; }
  if(L.length>5) h+='<button type="button" class="oe-mini" style="margin-top:8px" onclick="oeLvAll(\''+id+'\')">'+(all?'Show fewer':'Show all '+L.length)+'</button>';
  b.innerHTML=h;
}

window.oeNew=function(){
  var s=new Date(); s.setDate(s.getDate()+1); s.setHours(9,0,0,0); var e=new Date(s.getTime()+2*3600*1000);
  E={id:'',course:COURSES[0]||'',title:'',instructions:'',start:s.toISOString(),end:e.toISOString(),durationMin:30,pickN:0,shuffleQ:true,shuffleOpt:true,oneWay:false,bioStart:true,snapEverySec:30,maxLeaves:3,code:'',status:'draft',questions:[]};
  addQ('mcq'); renderEdit();
};
var GM=/\s*\[\[(?:faceguard|qtime=\d+|recheck=\d+)\]\]\s*/ig;
function gmOut(){ var rm2=/\[\[recheck=(\d+)\]\]/i.exec(E.instructions||''); E.reCheck=rm2?parseInt(rm2[1],10):0; var qm=/\[\[qtime=(\d+)\]\]/i.exec(E.instructions||''); E.qTime=qm?parseInt(qm[1],10):0; E.faceGuard=/\[\[faceguard\]\]/i.test(E.instructions||''); E.instructions=String(E.instructions||'').replace(GM,'').trim(); (E.questions||[]).forEach(function(q){ if(q.type==='text'){ var m=VRE.exec(q.guide||''); if(m){ try{ var o=JSON.parse(m[1]); q.vr={on:true,v:o.v||{},f:o.f||'',tol:o.tol==null?1:o.tol}; }catch(e){} q.guide=String(q.guide).replace(VRE,'').trim(); } } }); }
window.oeEdit=function(i){ E=JSON.parse(JSON.stringify(LIST[i])); gmOut(); renderEdit(); };
window.oeCopy=function(i){ E=JSON.parse(JSON.stringify(LIST[i])); gmOut(); E.id=''; E.title=E.title+' (copy)'; E.status='draft'; E.questions.forEach(function(q){ q.id=uid(); }); renderEdit(); };
window.oeDel=async function(i){
  var x=LIST[i]; if(!x||!confirm('Delete "'+x.title+'"?\n\nThis removes the exam and its questions. This cannot be undone.')) return;
  try{ var r=await teamApi({action:'oe_delete',id:x.id}); if(!r||!r.ok) throw new Error((r&&r.error)||'Failed'); oeInit(); }catch(e){ msg('<div class="msg err">'+esc(e.message||'error')+'</div>'); }
};
function addQ(type){ E.questions.push(type==='text'?{id:uid(),type:'text',text:'',marks:5,guide:''}:{id:uid(),type:'mcq',text:'',options:['','','',''],answer:0,marks:1}); }
window.oeImportInto=function(qs){ sync(); E.questions=E.questions.filter(function(q){ return !(q.type==='mcq'&&!q.text.trim()&&!q.options.some(function(x){return x.trim();})); }); qs.forEach(function(q){ delete q._check; E.questions.push(q); }); renderEdit(); msg('<div class="msg ok">Added '+qs.length+' question'+(qs.length===1?'':'s')+'. Check them, then save or publish.</div>'); };
window.oeSetTotal=function(){
  sync(); var T=parseFloat($('oeTot').value), L=E.questions.length, n=(E.pickN>0&&E.pickN<L)?E.pickN:L, m=$('oeTotMsg');
  var say=function(t,ok){ if(m){ m.style.color=ok?'#15803d':'#dc2626'; m.textContent=t; } };
  if(!(T>0)){ say('Type the total marks first.',false); return; }
  if(!L){ say('Add the questions first.',false); return; }
  T=Math.round(T*2)/2; var U=T*2;
  if(U<n){ say('The smallest mark per question is 0.5, so the exam total cannot be below '+(n/2)+'.',false); return; }
  var base=Math.floor(U/n), rem=U-base*n;
  if(n<L && rem){ say('Each student gets '+n+' random questions out of '+L+', so every question must carry the same marks. Use a total such as '+(base*n/2)+' or '+((base+1)*n/2)+'.',false); return; }
  if((base+(rem?1:0))/2>100){ say('A single question can carry at most 100 marks.',false); return; }
  E.questions.forEach(function(q,i){ q.marks=(base+(i<rem?1:0))/2; });
  renderEdit(false);
  var mm=$('oeTotMsg'); if($('oeTot')) $('oeTot').value=T;
  if(mm){ mm.style.color='#15803d'; mm.textContent=rem?('Done. '+rem+' question'+(rem===1?'':'s')+' carry '+((base+1)/2)+' marks and the other '+(L-rem)+' carry '+(base/2)+'. Total '+T+'.'):('Done. Every question carries '+(base/2)+' mark'+(base===2?'':'s')+'. Total '+T+'.'); }
};
window.oeAddQ=function(t){ sync(); addQ(t); renderEdit(true); };
window.oeRemQ=function(i){ sync(); if(!confirm('Remove question '+(i+1)+'?')) return; E.questions.splice(i,1); renderEdit(); };
window.oeMove=function(i,d){ sync(); var j=i+d; if(j<0||j>=E.questions.length) return; var t=E.questions[i]; E.questions[i]=E.questions[j]; E.questions[j]=t; renderEdit(); };
window.oeAddOpt=function(i){ sync(); var q=E.questions[i]; if(q.options.length<6){ q.options.push(''); renderEdit(); } };
window.oeRemOpt=function(i,k){ sync(); var q=E.questions[i]; if(q.options.length>2){ q.options.splice(k,1); if(q.answer>=q.options.length) q.answer=0; else if(q.answer>k) q.answer--; renderEdit(); } };
window.oeTog=function(k){ sync(); E[k]=!E[k]; renderEdit(); };
window.oeType=function(i,t){ sync(); var q=E.questions[i]; if(t==='text'){ q.type='text'; q.guide=q.guide||''; } else { q.type='mcq'; q.options=q.options&&q.options.length?q.options:['','','','']; q.answer=q.answer||0; } renderEdit(); };

/* copy what is typed in the form back into E */
function sync(){
  if(!E||!$('oeTitle')) return;
  E.course=$('oeCourse').value; E.title=$('oeTitle').value; E.instructions=$('oeIns').value; if($('oeQsec')){ E.qTime=parseInt($('oeQsec').value,10)||0; } if($('oeRsec')){ E.reCheck=parseInt($('oeRsec').value,10)||0; }
  var s=$('oeStart').value, e=$('oeEnd').value; if(s) E.start=new Date(s).toISOString(); if(e) E.end=new Date(e).toISOString();
  E.durationMin=parseInt($('oeDur').value,10)||30; E.snapEverySec=parseInt($('oeSnap').value,10)||30; E.maxLeaves=parseInt($('oeLeaves').value,10); if(!(E.maxLeaves>=0)) E.maxLeaves=3;
  E.pickN=parseInt($('oePick').value,10)||0; E.code=$('oeCode').value;
  E.questions.forEach(function(q,i){
    var t=$('oeQt'+i); if(!t) return; q.text=t.value; q.marks=parseFloat($('oeQm'+i).value); if(!(q.marks>=0)) q.marks=1;
    if(q.type==='mcq'){ q.options=[].slice.call(document.querySelectorAll('.oeQo'+i)).map(function(o){ return o.value; }); var r=document.querySelector('input[name=oeA'+i+']:checked'); if(r) q.answer=parseInt(r.value,10); }
    else { var g=$('oeQg'+i); if(g) q.guide=g.value; vrSync(i,q); }
  });
}
function sw(k,label,sub){ return '<div class="oe-sw"><div><b style="font-size:.88rem">'+label+'</b><small>'+sub+'</small></div><button type="button" class="oe-tg'+(E[k]?' on':'')+'" role="switch" aria-checked="'+(E[k]?'true':'false')+'" onclick="oeTog(\''+k+'\')"><i></i></button></div>'; }

function renderEdit(scrollEnd){
  var box=$('oeBody'); msg('');
  var marks=E.questions.reduce(function(t,q){ return t+(parseFloat(q.marks)||0); },0);
  var h='<div class="oe-f"><div><div class="oe-l">Course</div><select id="oeCourse">'+(COURSES.indexOf(E.course)<0&&E.course?'<option>'+esc(E.course)+'</option>':'')+COURSES.map(function(c){ return '<option'+(c===E.course?' selected':'')+'>'+esc(c)+'</option>'; }).join('')+'</select></div>'
   +'<div><div class="oe-l">Exam title</div><input type="text" id="oeTitle" value="'+esc(E.title)+'" placeholder="e.g. Mid-semester Exam"></div>'
   +'<div><div class="oe-l">Instructions for students</div><textarea id="oeIns" placeholder="Shown before the exam starts">'+esc(E.instructions)+'</textarea></div>'
   +'<div class="oe-two"><div><div class="oe-l">Opens</div><input type="datetime-local" id="oeStart" value="'+toLocal(E.start)+'"></div><div><div class="oe-l">Closes</div><input type="datetime-local" id="oeEnd" value="'+toLocal(E.end)+'"></div></div>'
   +'<div class="oe-two"><div><div class="oe-l">Time allowed (minutes)</div><input type="number" id="oeDur" min="1" max="300" value="'+E.durationMin+'"></div><div><div class="oe-l">Questions per student</div><input type="number" id="oePick" min="0" value="'+(E.pickN||0)+'" placeholder="0 = all"></div></div></div>'
   +'<div class="oe-box"><div class="oe-h">Security</div><div class="oe-sub">The camera is always required. Photos are shrunk to about 15 KB each.</div>'
   +'<div class="oe-two"><div><div class="oe-l">Photo every (seconds)</div><input type="number" id="oeSnap" min="10" max="300" value="'+E.snapEverySec+'"></div><div><div class="oe-l">Page leaves allowed</div><input type="number" id="oeLeaves" min="0" max="50" value="'+E.maxLeaves+'"></div></div>'
   +'<div style="margin-top:12px"><div class="oe-l">Exam code (optional)</div><input type="text" id="oeCode" value="'+esc(E.code)+'" placeholder="Students must type this to start"></div>'
   +sw('shuffleQ','Shuffle questions','Every student gets their own random order, picked fresh when they start. With 30 questions the same order will practically never repeat.')+sw('shuffleOpt','Shuffle answer options','The options of each question are mixed differently for every student.')+sw('oneWay','One question at a time, no going back','Harder to look things up.')+sw('bioStart','Fingerprint or face to start','Each student confirms with their phone before the exam begins.')+sw('faceGuard','Face guard (test on a practice exam first)','Students must show their face at the start. The moment their face leaves the oval they get a warning, and after 2 seconds the exam pauses and hides the questions. The same for every student. The timer keeps running. Each pause is logged for review.')+'<div class="oe-sw"><div><b style="font-size:.88rem">Seconds per question (0 = off)</b><small>Each question gets its own countdown. When it ends the exam moves on by itself (5 seconds grace) and students cannot go back. Test on a practice exam first.</small></div><input type="number" id="oeQsec" min="0" max="600" step="5" style="width:90px;flex:0 0 90px" value="'+(E.qTime||0)+'"></div><div class="oe-sw"><div><b style="font-size:.88rem">Random identity re-checks (0 = off)</b><small>1 to 3 times at random moments, students confirm again with fingerprint or face. Skipped checks are logged for review.</small></div><input type="number" id="oeRsec" min="0" max="3" step="1" style="width:90px;flex:0 0 90px" value="'+(E.reCheck||0)+'"></div></div>'
   +'<div class="oe-box" id="oeTotBox"><div class="oe-h">Overall marks</div><div class="oe-sub">Type the total marks for the whole exam and the marks are shared across the questions for you.</div><div style="display:flex;gap:10px;align-items:flex-end;margin-top:8px"><div style="flex:1"><div class="oe-l">Exam total (marks)</div><input type="number" id="oeTot" min="1" max="1000" value="'+marks+'"></div><button type="button" class="oe-btn" style="width:auto;padding:12px 18px;margin:0" onclick="oeSetTotal()">Apply</button></div><div id="oeTotMsg" class="oe-sub" style="margin-top:8px"></div></div>'
   +'<div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:18px"><div class="oe-h" style="font-size:1.05rem">Questions</div><div style="font-size:.8rem;color:var(--muted)">'+E.questions.length+' &middot; '+marks+' marks</div></div>';
  h+=E.questions.map(function(q,i){
    var body='<textarea id="oeQt'+i+'" placeholder="Type the question">'+esc(q.text)+'</textarea>';
    if(q.type==='mcq'){
      body+='<div class="oe-l" style="margin-top:10px">Options (tick the correct one)</div>'+q.options.map(function(o,k){ return '<div class="oe-opt"><input type="radio" name="oeA'+i+'" value="'+k+'"'+(q.answer===k?' checked':'')+'><input type="text" class="oeQo'+i+'" value="'+esc(o)+'" placeholder="Option '+String.fromCharCode(65+k)+'">'+(q.options.length>2?'<button type="button" class="oe-mini x" onclick="oeRemOpt('+i+','+k+')">&times;</button>':'')+'</div>'; }).join('')
        +(q.options.length<6?'<button type="button" class="oe-mini" style="margin-top:8px" onclick="oeAddOpt('+i+')">+ Add option</button>':'');
    } else body+='<div class="oe-l" style="margin-top:10px">Marking guide (only you see this)</div><textarea id="oeQg'+i+'" placeholder="What a good answer includes">'+esc(q.guide||'')+'</textarea>'+vrBox(i,q);
    return '<div class="oe-q"><div class="oe-qt"><div style="display:flex;align-items:center;gap:8px"><span class="oe-n">'+(i+1)+'</span><select style="width:auto !important" onchange="oeType('+i+',this.value)"><option value="mcq"'+(q.type==='mcq'?' selected':'')+'>Multiple choice</option><option value="text"'+(q.type==='text'?' selected':'')+'>Written answer</option></select></div>'
      +'<div style="display:flex;gap:6px"><button type="button" class="oe-mini" onclick="oeMove('+i+',-1)">&uarr;</button><button type="button" class="oe-mini" onclick="oeMove('+i+',1)">&darr;</button><button type="button" class="oe-mini x" onclick="oeRemQ('+i+')">Remove</button></div></div>'
      +body+'<div style="margin-top:10px;max-width:140px"><div class="oe-l">Marks</div><input type="number" id="oeQm'+i+'" min="0" step="0.5" value="'+(q.marks==null?1:q.marks)+'"></div></div>';
  }).join('');
  h+='<div class="oe-row"><button type="button" class="oe-btn" onclick="oeImpOpen()">Import from a document</button></div><div class="oe-row"><button type="button" class="oe-btn s" onclick="oeAddQ(\'mcq\')">+ Multiple choice</button><button type="button" class="oe-btn s" onclick="oeAddQ(\'text\')">+ Written answer</button></div>'
    +'<div class="oe-row" style="margin-top:18px"><button type="button" class="oe-btn s" onclick="oeSave(false)">Save draft</button><button type="button" class="oe-btn" onclick="oeSave(true)">Publish</button></div>'
    +'<button type="button" class="oe-btn s" style="margin-top:10px" onclick="oeInit()">Close without saving</button>';
  box.innerHTML=h;
  if(scrollEnd){ try{ var qs=box.querySelectorAll('.oe-q'); qs[qs.length-1].scrollIntoView({behavior:'smooth',block:'center'}); }catch(e){} }
}

window.oeSave=async function(publish){
  sync();
  if(!E.title.trim()){ msg('<div class="msg err">Give the exam a title.</div>'); return; }
  if(!E.course){ msg('<div class="msg err">Choose the course.</div>'); return; }
  if(new Date(E.end)<=new Date(E.start)){ msg('<div class="msg err">The closing time must be after the opening time.</div>'); return; }
  for(var i=0;i<E.questions.length;i++){ var q=E.questions[i];
    if(!q.text.trim()){ msg('<div class="msg err">Question '+(i+1)+' is empty.</div>'); return; }
    if(q.type==='text' && q.vr && q.vr.on){ var sp0=vrSpecOf(q); if(!sp0){ msg('<div class="msg err">Question '+(i+1)+': fill in the number ranges (from must not be above to) and the correct answer formula, or switch the different-numbers option off.</div>'); return; } try{ var cv=calcF(sp0.f,varVals(sp0,'t')); if(!isFinite(cv)) throw 1; }catch(e){ msg('<div class="msg err">Question '+(i+1)+': the answer formula does not work. Use the same letters as the {numbers} in the question.</div>'); return; } }
    if(q.type==='mcq' && q.options.filter(function(o){ return o.trim(); }).length<2){ msg('<div class="msg err">Question '+(i+1)+' needs at least two options.</div>'); return; }
  }
  if(publish && !E.questions.length){ msg('<div class="msg err">Add at least one question before publishing.</div>'); return; }
  if(publish && !confirm('Publish "'+E.title+'"?\n\nStudents on '+E.course+' will see it from '+fmt(E.start)+'.')) return;
  /* drop blank options but keep the correct answer pointing at the right one */
  var ex=JSON.parse(JSON.stringify(E)); ex.status=publish?'published':'draft'; ex.instructions=String(ex.instructions||'').replace(GM,'').trim()+(E.faceGuard?' [[faceguard]]':'')+(E.qTime>=10?' [[qtime='+Math.min(600,E.qTime)+']]':'')+(E.reCheck>0?' [[recheck='+Math.min(3,E.reCheck)+']]':''); delete ex.faceGuard; delete ex.qTime; delete ex.reCheck; ex.questions.forEach(function(q){ if(q.type==='text'){ var sp=vrSpecOf(q); delete q.vr; if(sp) q.guide=String(q.guide||'').replace(VRE,'').trim()+' [[var:'+JSON.stringify(sp)+']]'; } });
  ex.questions.forEach(function(q){ if(q.type==='mcq'){ var keep=[], na=0; q.options.forEach(function(o,k){ if(o.trim()){ if(k===q.answer) na=keep.length; keep.push(o.trim()); } }); q.options=keep; q.answer=na; } });
  msg('<div class="msg ok">Saving...</div>');
  try{ var r=await teamApi({action:'oe_save',exam:ex}); if(!r||!r.ok) throw new Error((r&&r.error)||'Could not save');
    var mk={}, frac=false; ex.questions.forEach(function(q){ mk[q.id]=q.marks; if(Math.round(q.marks)!==q.marks) frac=true; });
    if(frac){ var r2=await teamApi({action:'oe_marks',id:(r.exam&&r.exam.id)||ex.id,marks:mk}); if(!r2||!r2.ok) throw new Error('Saved, but the half marks could not be stored: '+((r2&&r2.error)||'try again')); }
    await oeInit(); msg('<div class="msg ok">'+(publish?'Published.':'Saved as a draft.')+'</div>'); }
  catch(e){ msg('<div class="msg err">'+esc(e.message||'error')+'</div>'); }
};
})();
