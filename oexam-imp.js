/* ===== Online Exams: import questions from a document (Word, PDF, text) or pasted text ===== */
(function(){
function $(i){ return document.getElementById(i); }
function esc(t){ return String(t==null?'':t).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function uid(){ return 'q'+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }

/* ---------- parser: text in, questions out ---------- */
var QSTART=/^\s*(?:Q(?:uestion)?\.?\s*)?(\d{1,3})\s*[.)\]:\-]\s*(.*)$/i;
var OPT=/^\s*\(?([A-Ea-e])\s*[.)\]:]\s*(.*)$/;
var ANS=/^\s*(?:correct\s+)?(?:answer|ans|key)\s*(?:is)?\s*[:\-=]?\s*\(?\s*([A-Ea-e])\b/i;
function splitInlineOptions(line){
  // "A. x  B. y  C. z  D. w" on one line
  var re=/(?:^|\s)\(?([A-Ea-e])[.)]\s+/g, m, idx=[];
  while((m=re.exec(line))){ idx.push({k:m[1].toUpperCase(),s:m.index+(m[0].match(/^\s/)?1:0),e:re.lastIndex}); }
  if(idx.length<2||idx[0].k!=='A') return null;
  var out=[]; for(var i=0;i<idx.length;i++){ out.push(line.slice(idx[i].e,i+1<idx.length?idx[i+1].s:line.length).trim()); }
  return {pre:line.slice(0,idx[0].s).trim(),opts:out};
}
function takeMarks(s){
  var m=s.match(/[\[(]\s*(\d+(?:\.\d+)?)\s*(?:marks?|mks?|pts?|points?)\s*[\])]/i)||s.match(/\b(\d+(?:\.\d+)?)\s*marks?\b/i);
  if(!m) return {text:s,marks:null};
  return {text:s.replace(m[0],'').replace(/\s{2,}/g,' ').trim(),marks:parseFloat(m[1])};
}
window.oeParse=function(raw,opt){
  opt=opt||{}; var mM=opt.mcqMarks==null?1:opt.mcqMarks, tM=opt.textMarks==null?5:opt.textMarks;
  var lines=String(raw||'').replace(/\r/g,'').replace(/ /g,' ').split('\n');
  // answer key section: "Answer Key" / "Answers" heading followed by "1. B 2. C ..."
  var keyAt=-1; for(var i=0;i<lines.length;i++){ if(/^\s*(?:answer\s*key|answers?|marking\s*scheme\s*\(mcq\))\s*:?\s*$/i.test(lines[i])){ keyAt=i; } }
  var keys={}; if(keyAt>=0){ var kt=lines.slice(keyAt+1).join(' '), km, kr=/(\d{1,3})\s*[.):\-]?\s*\(?([A-Ea-e])\)?(?=\s|,|;|$)/g; while((km=kr.exec(kt))){ keys[km[1]]=km[2].toUpperCase().charCodeAt(0)-65; } lines=lines.slice(0,keyAt); }
  var blocks=[], cur=null;
  lines.forEach(function(l){
    var t=l.trim(); if(!t){ return; }
    if(/^(section|part)\s+[A-Za-z0-9IVX]+\b.{0,60}$/i.test(t) && !QSTART.test(t)){ if(cur) cur.lastOpt=cur.opts.length?cur.lastOpt:-1; cur=null; return; }
    var qs=t.match(QSTART);
    if(qs && !(cur&&cur.opts.length&&OPT.test(t)&&false)){ cur={n:qs[1],stem:[qs[2]],opts:[],ans:null,lastOpt:-1}; blocks.push(cur); return; }
    if(!cur) return;
    var a=t.match(ANS); if(a){ cur.ans=a[1].toUpperCase().charCodeAt(0)-65; return; }
    var inl=splitInlineOptions(t);
    if(inl){ if(inl.pre&&!cur.opts.length) cur.stem.push(inl.pre); inl.opts.forEach(function(o){ cur.opts.push(o); }); cur.lastOpt=cur.opts.length-1; return; }
    var o=t.match(OPT);
    if(o && o[1].toUpperCase().charCodeAt(0)-65===cur.opts.length){ cur.opts.push(o[2]); cur.lastOpt=cur.opts.length-1; return; }
    if(cur.opts.length) cur.opts[cur.lastOpt]+=' '+t; else cur.stem.push(t);
  });
  var out=[], flagged=0;
  blocks.forEach(function(b){
    var tm=takeMarks(b.stem.join(' ').replace(/\s{2,}/g,' ').trim());
    if(!tm.text) return;
    if(b.opts.length>=2){
      var ans=b.ans!=null?b.ans:(keys[b.n]!=null?keys[b.n]:null);
      if(ans==null||ans>=b.opts.length){ ans=0; flagged++; var fl=true; }
      out.push({id:uid(),type:'mcq',text:tm.text,options:b.opts.map(function(x){return x.trim();}),answer:ans,marks:tm.marks!=null?tm.marks:mM,_check:!!fl});
    } else {
      out.push({id:uid(),type:'text',text:tm.text,marks:tm.marks!=null?tm.marks:tM,guide:''});
    }
  });
  out.flagged=flagged; return out;
};

/* ---------- reading files ---------- */
function loadScript(src){ return new Promise(function(res,rej){ var s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=function(){ rej(new Error('Could not load a helper. Check your internet.')); }; document.head.appendChild(s); }); }
async function readFile(f){
  var n=f.name.toLowerCase();
  if(/\.(txt|md|csv)$/.test(n)) return await f.text();
  if(/\.docx$/.test(n)){
    if(!window.mammoth) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js');
    var r=await window.mammoth.extractRawText({arrayBuffer:await f.arrayBuffer()}); return r.value;
  }
  if(/\.pdf$/.test(n)){
    if(!window.pdfjsLib){ await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'); window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; }
    var doc=await window.pdfjsLib.getDocument({data:new Uint8Array(await f.arrayBuffer())}).promise, txt='';
    for(var p=1;p<=doc.numPages;p++){
      var pg=await doc.getPage(p), tc=await pg.getTextContent(), y=null, line='';
      tc.items.forEach(function(it){ var yy=Math.round(it.transform[5]); if(y!==null&&Math.abs(yy-y)>3){ txt+=line+'\n'; line=''; } y=yy; line+=it.str+(it.hasEOL?'':' '); });
      txt+=line+'\n';
    }
    return txt;
  }
  throw new Error('Use a Word (.docx), PDF or text file. Old .doc files: open in Word and Save As .docx.');
}

/* ---------- screen ---------- */
var Q=[];
window.oeImpOpen=function(){
  var o=document.createElement('div'); o.id='oeImp';
  o.style.cssText='position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.55);display:flex;align-items:flex-start;justify-content:center;padding:14px;overflow:auto';
  o.innerHTML='<div class="card" style="max-width:560px;width:100%;margin:auto"><h3 style="margin-top:0">Import questions</h3>'
   +'<div style="font-size:.88rem;color:var(--muted);margin-bottom:10px">Upload a Word, PDF or text file with your questions. Multiple choice (with options A, B, C, D) and written questions are found automatically and added to this exam. You can upload more than one file.</div>'
   +'<input type="file" id="oiF" accept=".docx,.pdf,.txt" multiple style="margin-bottom:10px">'
   +'<div style="display:flex;gap:10px"><div style="flex:1"><div style="font-size:.78rem">Marks per multiple choice</div><input type="number" id="oiM" value="1" min="0" step="0.5"></div><div style="flex:1"><div style="font-size:.78rem">Marks per written question</div><input type="number" id="oiT" value="5" min="0" step="0.5"></div></div>'
   +'<div style="font-size:.78rem;margin-top:10px">Or paste the questions here</div><textarea id="oiP" rows="5" placeholder="1. What is ...?&#10;A. ...&#10;B. ...&#10;Answer: B"></textarea>'
   +'<div id="oiMsg" style="margin-top:10px"></div><div id="oiPrev"></div>'
   +'<div style="display:flex;gap:10px;margin-top:12px"><button type="button" id="oiGo" style="flex:1">Find questions</button><button type="button" id="oiCancel" style="flex:1">Cancel</button></div></div>';
  document.body.appendChild(o);
  $('oiCancel').onclick=function(){ o.remove(); };
  $('oiGo').onclick=async function(){
    var b=$('oiGo'); if(b.getAttribute('data-add')==='1'){ if(!Q.length) return; window.oeImportInto(Q); o.remove(); return; }
    b.disabled=true; $('oiMsg').innerHTML='<div class="msg">Reading...</div>';
    try{
      var txt=''; var fs=$('oiF').files; for(var i=0;i<fs.length;i++){ txt+='\n'+await readFile(fs[i]); }
      txt+='\n'+$('oiP').value;
      if(!txt.trim()) throw new Error('Choose a file or paste some questions.');
      Q=oeParse(txt,{mcqMarks:parseFloat($('oiM').value),textMarks:parseFloat($('oiT').value)});
      if(!Q.length) throw new Error('No questions found. Number them like "1." and put options as "A." "B." "C." "D.".');
      var mc=Q.filter(function(q){return q.type==='mcq';}).length, tx=Q.length-mc;
      $('oiMsg').innerHTML='<div class="msg ok">Found '+mc+' multiple choice and '+tx+' written question'+(tx===1?'':'s')+'.'+(Q.flagged?' <b>'+Q.flagged+' multiple choice have no answer marked</b>: they are set to A, so check them after adding.':'')+'</div>';
      $('oiPrev').innerHTML=Q.slice(0,5).map(function(q,i){ return '<div style="font-size:.82rem;border-top:1px solid var(--line);padding:6px 0">'+(i+1)+'. '+esc(q.text.slice(0,110))+' <span style="color:var(--muted)">('+(q.type==='mcq'?q.options.length+' options':'written')+')</span></div>'; }).join('')+(Q.length>5?'<div style="font-size:.8rem;color:var(--muted)">and '+(Q.length-5)+' more</div>':'');
      b.textContent='Add '+Q.length+' to this exam'; b.setAttribute('data-add','1');
    }catch(e){ $('oiMsg').innerHTML='<div class="msg err">'+esc(e.message)+'</div>'; }
    b.disabled=false;
  };
};
})();
