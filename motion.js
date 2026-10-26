/* Home page motion: floating blueprint shapes, scroll reveals, draggable expertise bubbles, flip credentials. Additive and safe: any failure leaves the page as it was. */
(function(){
try{
var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var st=document.createElement('style');
st.textContent=`
.mo-reveal{opacity:0;transform:translateY(28px);transition:opacity .7s ease,transform .7s cubic-bezier(.2,.7,.2,1)}
.mo-reveal.in{opacity:1;transform:none}
#moBg{position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.5}
body.landing #moBg{opacity:1}
body.landing > #moBg#moBg{display:block!important;z-index:1}
body.landing > #moGlow#moGlow{display:block!important}
#moRing{position:fixed;pointer-events:none;z-index:2;border-radius:50%;border:2px dashed var(--c1,#0ea5e9);opacity:.7;display:none}
#moRing2{position:fixed;pointer-events:none;z-index:2;border-radius:50%;border:2px solid transparent;border-top-color:var(--c3,#8b5cf6);border-bottom-color:var(--c2,#22c55e);opacity:.8;display:none}
body.landing > #moRing#moRing,body.landing > #moRing2#moRing2{display:block!important}
.mo-sec{max-width:1100px;margin:0 auto;padding:70px 24px 20px;position:relative;z-index:1}
.mo-sec h2{font-size:clamp(1.6rem,3.4vw,2.4rem);font-weight:700;margin:0 0 6px;letter-spacing:-.02em;color:var(--ink)}
.mo-sec p.sub{margin:0 0 22px;color:var(--muted);font-size:.95rem}
#moBubbles{position:relative;height:380px;border:1px solid var(--line);border-radius:18px;overflow:hidden;background:var(--contrast);touch-action:pan-y}
.mo-b{position:absolute;left:0;top:0;padding:12px 20px;border-radius:999px;font-weight:600;font-size:.95rem;color:#fff;cursor:grab;user-select:none;white-space:nowrap;box-shadow:0 8px 22px rgba(0,0,0,.18);will-change:transform}
.mo-b:active{cursor:grabbing}
#moCards{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px}
.mo-card{perspective:900px;height:150px;cursor:pointer;outline:none}
.mo-in{position:relative;width:100%;height:100%;transition:transform .7s cubic-bezier(.2,.7,.2,1);transform-style:preserve-3d}
.mo-card:hover .mo-in,.mo-card:focus .mo-in,.mo-card.flip .mo-in{transform:rotateY(180deg)}
.mo-f,.mo-k{position:absolute;inset:0;border-radius:16px;backface-visibility:hidden;-webkit-backface-visibility:hidden;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:16px;box-sizing:border-box}
.mo-f{background:linear-gradient(135deg,var(--c1,#0ea5e9),var(--c3,#8b5cf6));color:#fff}
.mo-f b{font-size:1.5rem;letter-spacing:-.01em}.mo-f span{font-size:.75rem;opacity:.85;margin-top:6px}
.mo-k{transform:rotateY(180deg);background:var(--card);border:1px solid var(--line);color:var(--ink);font-size:.9rem;line-height:1.4}
.mo-glow{position:fixed;width:380px;height:380px;border-radius:50%;pointer-events:none;z-index:0;background:radial-gradient(circle,rgba(14,165,233,.14),transparent 70%);transform:translate(-50%,-50%);left:-999px;top:-999px}
@media (max-width:640px){#moBubbles{height:320px}.mo-glow{display:none}}
@media (prefers-reduced-motion:reduce){.mo-reveal{opacity:1;transform:none;transition:none}}
`;
document.head.appendChild(st);

/* 1. Floating blueprint shapes + cursor glow */
var cv=document.createElement('canvas');cv.id='moBg';document.body.insertBefore(cv,document.body.firstChild);
var cx=cv.getContext('2d'),W=0,H=0,sh=[];
function size(){W=cv.width=innerWidth;H=cv.height=innerHeight;}
size();addEventListener('resize',size);
var N=innerWidth<640?9:18;
for(var i=0;i<N;i++)sh.push({x:Math.random()*W,y:Math.random()*H,r:14+Math.random()*34,t:i%4,a:Math.random()*6,v:.12+Math.random()*.3,s:(Math.random()-.5)*.006});
function col(){return document.documentElement.getAttribute('data-theme')==='dark'?'rgba(125,211,252,.35)':'rgba(14,100,160,.28)';}
function draw(now){
  if(document.body.classList.contains('landing')&&window.__moLanding){window.__moLanding(now||performance.now());if(!RM)requestAnimationFrame(draw);return;}
  cx.clearRect(0,0,W,H);cx.strokeStyle=col();cx.lineWidth=1.4;
  sh.forEach(function(o){
    if(!RM){o.y-=o.v;o.a+=o.s;if(o.y<-60){o.y=H+60;o.x=Math.random()*W;}}
    cx.save();cx.translate(o.x,o.y);cx.rotate(o.a);cx.beginPath();
    if(o.t===0)cx.rect(-o.r,-o.r*.7,o.r*2,o.r*1.4);
    else if(o.t===1){cx.moveTo(-o.r,o.r*.6);cx.lineTo(0,-o.r*.8);cx.lineTo(o.r,o.r*.6);cx.closePath();}
    else if(o.t===2){cx.arc(0,0,o.r*.8,0,6.283);}
    else{cx.moveTo(-o.r,0);cx.lineTo(o.r,0);cx.moveTo(0,-o.r);cx.lineTo(0,o.r);}
    cx.stroke();cx.restore();
  });
  if(!RM)requestAnimationFrame(draw);
}
draw();
if(!RM&&matchMedia('(pointer:fine)').matches){var g=document.createElement('div');g.className='mo-glow';g.id='moGlow';document.body.appendChild(g);addEventListener('pointermove',function(e){g.style.left=e.clientX+'px';g.style.top=e.clientY+'px';},{passive:true});}

/* 2. Expertise bubbles + credentials, inserted before the Explore section */
var anchor=document.getElementById('processSec');
if(anchor){
  var sec=document.createElement('section');sec.className='mo-sec';sec.id='moSec';
  sec.innerHTML='<h2 class="mo-reveal">Areas of expertise</h2><p class="sub mo-reveal">Drag, throw or shake them.</p><div id="moBubbles" class="mo-reveal"></div>'+
   '<h2 class="mo-reveal" style="margin-top:56px">Credentials</h2><p class="sub mo-reveal">Hover or tap a card to flip it.</p><div id="moCards"></div>';
  anchor.parentNode.insertBefore(sec,anchor);
  var tags=['Construction Management','Quantity Surveying','Cost Planning','Procurement','Project Management','Research Methods','Structural Analysis','Site Health & Safety','Contract Administration','Training','Report Writing','Materials Pricing'];
  var colors=['#0ea5e9','#8b5cf6','#f43f5e','#f59e0b','#22c55e','#0891b2','#ec4899','#ea580c'];
  var box=document.getElementById('moBubbles'),bs=[];
  function layout(){var bw=box.clientWidth,bh=box.clientHeight;bs.forEach(function(b){b.x=Math.min(b.x,bw-b.w);b.y=Math.min(b.y,bh-b.h);});return [bw,bh];}
  tags.forEach(function(t,i){
    var el=document.createElement('div');el.className='mo-b';el.textContent=t;el.style.background=colors[i%colors.length];box.appendChild(el);
    bs.push({el:el,x:0,y:0,vx:(Math.random()-.5)*1.6,vy:(Math.random()-.5)*1.6,w:0,h:0,drag:false});
  });
  function init(){var bw=box.clientWidth,bh=box.clientHeight;bs.forEach(function(b){b.w=b.el.offsetWidth;b.h=b.el.offsetHeight;b.x=Math.random()*(bw-b.w);b.y=Math.random()*(bh-b.h);b.el.style.transform='translate('+b.x+'px,'+b.y+'px)';});}
  var inited=false;function tryInit(){if(!inited&&box.clientWidth>50){init();inited=true;}}
  addEventListener('resize',function(){if(inited)init();});
  var cur=null,lx=0,ly=0,lt=0;
  bs.forEach(function(b){
    b.el.addEventListener('pointerdown',function(e){cur=b;b.drag=true;var r=box.getBoundingClientRect();b.ox=e.clientX-r.left-b.x;b.oy=e.clientY-r.top-b.y;lx=e.clientX;ly=e.clientY;lt=performance.now();b.el.setPointerCapture(e.pointerId);e.preventDefault();});
    b.el.addEventListener('pointermove',function(e){if(cur!==b)return;var r=box.getBoundingClientRect();var nx=e.clientX-r.left-b.ox,ny=e.clientY-r.top-b.oy;var now=performance.now(),dt=Math.max(now-lt,8);b.vx=(e.clientX-lx)/dt*16;b.vy=(e.clientY-ly)/dt*16;lx=e.clientX;ly=e.clientY;lt=now;b.x=Math.max(0,Math.min(box.clientWidth-b.w,nx));b.y=Math.max(0,Math.min(box.clientHeight-b.h,ny));});
    function up(){if(cur===b){b.drag=false;cur=null;}}
    b.el.addEventListener('pointerup',up);b.el.addEventListener('pointercancel',up);
  });
  function tick(){
    tryInit();if(!inited){requestAnimationFrame(tick);return;}
    var bw=box.clientWidth,bh=box.clientHeight;
    bs.forEach(function(b){
      if(!b.drag){
        b.x+=b.vx;b.y+=b.vy;b.vx*=.995;b.vy*=.995;
        if(Math.abs(b.vx)<.25)b.vx+=(Math.random()-.5)*.05;if(Math.abs(b.vy)<.25)b.vy+=(Math.random()-.5)*.05;
        if(b.x<0){b.x=0;b.vx=Math.abs(b.vx);}if(b.x>bw-b.w){b.x=bw-b.w;b.vx=-Math.abs(b.vx);}
        if(b.y<0){b.y=0;b.vy=Math.abs(b.vy);}if(b.y>bh-b.h){b.y=bh-b.h;b.vy=-Math.abs(b.vy);}
      }
    });
    for(var i=0;i<bs.length;i++)for(var j=i+1;j<bs.length;j++){
      var a=bs[i],c=bs[j];
      if(a.x<c.x+c.w&&a.x+a.w>c.x&&a.y<c.y+c.h&&a.y+a.h>c.y){
        var ox=Math.min(a.x+a.w-c.x,c.x+c.w-a.x),oy=Math.min(a.y+a.h-c.y,c.y+c.h-a.y);
        if(ox<oy){var s=a.x<c.x?-1:1;if(!a.drag)a.x+=s*ox/2;if(!c.drag)c.x-=s*ox/2;var t=a.vx;a.vx=c.vx;c.vx=t;}
        else{var s2=a.y<c.y?-1:1;if(!a.drag)a.y+=s2*oy/2;if(!c.drag)c.y-=s2*oy/2;var t2=a.vy;a.vy=c.vy;c.vy=t2;}
      }
    }
    bs.forEach(function(b){b.el.style.transform='translate('+b.x+'px,'+b.y+'px)';});
    requestAnimationFrame(tick);
  }
  if(!RM)requestAnimationFrame(tick);else setTimeout(function(){tryInit();bs.forEach(function(b,i){b.x=(i%4)*(box.clientWidth/4);b.y=Math.floor(i/4)*70+20;b.el.style.transform='translate('+b.x+'px,'+b.y+'px)';});},300);

  var creds=[['Ph.D','Doctor of Philosophy','Doctorate in construction-related research and practice.'],
   ['PE.IET-GH','Professional Engineer','Institution of Engineering and Technology (Ghana).'],
   ['MGIOC','Corporate Member','Ghana Institute of Construction.'],
   ['SM-CIOB','Student Member','Chartered Institute of Building.'],
   ['SM-CIArb','Dispute resolution','Chartered Institute of Arbitrators.']];
  var cc=document.getElementById('moCards');
  creds.forEach(function(c){var d=document.createElement('div');d.className='mo-card mo-reveal';d.tabIndex=0;d.innerHTML='<div class="mo-in"><div class="mo-f"><b>'+c[0]+'</b><span>'+c[1]+'</span></div><div class="mo-k">'+c[2]+'</div></div>';d.addEventListener('click',function(){d.classList.toggle('flip');});cc.appendChild(d);});
}

/* Landing: magic book. Pages flip one after another while sparkles rise from the spine. */
(function(){
  var css=document.createElement('style');
  css.textContent=`
  #moBook{position:fixed;left:50%;bottom:12px;width:min(380px,74vw);height:min(150px,27vw);transform:translateX(-50%);z-index:2;display:none;perspective:1400px;pointer-events:none}
  body.landing > #moBook#moBook{display:block!important}
  @media (max-height:700px){body.landing > #moBook#moBook{transform:translateX(-50%) scale(.7);transform-origin:bottom center}}
  #moBook .aura{position:absolute;left:-30%;right:-30%;bottom:20%;height:260%;background:radial-gradient(ellipse at 50% 80%,rgba(250,204,21,.42),rgba(168,85,247,.22) 38%,transparent 68%);filter:blur(10px);animation:moAura 3.2s ease-in-out infinite}
  @keyframes moAura{0%,100%{opacity:.55;transform:scale(.94)}50%{opacity:1;transform:scale(1.06)}}
  #moBook .beam{position:absolute;left:20%;right:20%;bottom:60%;height:260%;background:linear-gradient(to top,rgba(253,224,71,.28),transparent 80%);clip-path:polygon(25% 100%,75% 100%,100% 0,0 0);filter:blur(6px);animation:moBeam 4s ease-in-out infinite}
  @keyframes moBeam{0%,100%{opacity:.4}50%{opacity:.9}}
  #moBook .cover{position:absolute;inset:6% -2.5% -4% -2.5%;border-radius:8px;background:linear-gradient(135deg,#1e3a8a,#6d28d9);box-shadow:0 20px 40px rgba(0,0,0,.35),0 0 40px rgba(168,85,247,.45);transform:rotateX(6deg)}
  #moBook .half{position:absolute;top:2%;height:96%;width:50%;background:linear-gradient(90deg,#f3e9cf,#fdf6e3);box-shadow:inset 0 0 18px rgba(120,80,20,.25)}
  #moBook .hl{left:0;border-radius:6px 0 0 6px}
  #moBook .hr{left:50%;border-radius:0 6px 6px 0;background:linear-gradient(270deg,#f3e9cf,#fdf6e3)}
  #moBook .pg{position:absolute;left:50%;top:2%;height:96%;width:50%;transform-origin:left center;transform-style:preserve-3d;will-change:transform}
  #moBook .f,#moBook .b{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:0 6px 6px 0;box-sizing:border-box;padding:10% 9%;background:linear-gradient(270deg,#f3e9cf,#fdf6e3);color:#5b3a12;overflow:hidden}
  #moBook .b{transform:rotateY(180deg);border-radius:6px 0 0 6px;background:linear-gradient(90deg,#f3e9cf,#fdf6e3)}
  #moBook .f b{display:block;font:700 clamp(.9rem,2.4vw,1.25rem) Georgia,serif;color:#7c2d12;margin-bottom:8%}
  #moBook .ln{height:5%;margin:6% 0;background:repeating-linear-gradient(90deg,rgba(91,58,18,.28) 0 70%,transparent 70% 74%,rgba(91,58,18,.28) 74% 100%);border-radius:2px}
  #moBook .ln.s{width:62%}
  #moBook .spine{position:absolute;left:calc(50% - 2px);top:2%;width:4px;height:96%;background:linear-gradient(#b45309,#78350f);z-index:50}
  `;
  document.head.appendChild(css);
  var bk=document.createElement('div');bk.id='moBook';
  var titles=['Cost &amp; QS','Procurement','Safety','Training','Research','Building'];
  var ph='<div class="aura"></div><div class="beam"></div><div class="cover"></div><div class="half hl"></div><div class="half hr"></div>';
  titles.forEach(function(tt,k){ph+='<div class="pg" data-k="'+k+'"><div class="f"><b>'+tt+'</b><div class="ln"></div><div class="ln s"></div><div class="ln"></div><div class="ln s"></div></div><div class="b"><div class="ln"></div><div class="ln s"></div><div class="ln"></div><div class="ln"></div><div class="ln s"></div></div></div>';});
  ph+='<div class="spine"></div>';
  bk.innerHTML=ph;document.body.appendChild(bk);
  var pages=[].slice.call(bk.querySelectorAll('.pg')),N=pages.length;
  var sp=[],cols=['253,230,138','125,211,252','196,181,253','249,168,212','255,255,255'],t0=performance.now(),lastFlip=-1;
  var stars=[];for(var q=0;q<40;q++)stars.push({x:Math.random(),y:Math.random()*.7,p:Math.random()*6,r:.8+Math.random()*1.6});
  function emit(x,y,n,burst){for(var i=0;i<n;i++){var a=burst?Math.random()*6.283:-1.57+(Math.random()-.5)*1.1,v=burst?.8+Math.random()*2.4:.6+Math.random()*1.5;sp.push({x:x+(Math.random()-.5)*(burst?10:bk.clientWidth*.5),y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:0,m:70+Math.random()*90,s:2+Math.random()*4,c:cols[(Math.random()*cols.length)|0],w:Math.random()*6});}}
  function star(x,y,r,a,c){cx.save();cx.translate(x,y);cx.fillStyle='rgba('+c+','+a+')';cx.shadowColor='rgba('+c+',.9)';cx.shadowBlur=r*3;cx.beginPath();cx.moveTo(0,-r*1.8);cx.quadraticCurveTo(0,0,r*1.8,0);cx.quadraticCurveTo(0,0,0,r*1.8);cx.quadraticCurveTo(0,0,-r*1.8,0);cx.quadraticCurveTo(0,0,0,-r*1.8);cx.fill();cx.restore();}
  var ease=function(x){x=Math.max(0,Math.min(1,x));return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;};
  window.__moLanding=function(now){
    var t=(now-t0)/1000,GAP=.95,DUR=1.25,hold=N*GAP+DUR,T=hold+2.4,u=t%T;
    pages.forEach(function(p,k){
      var f=ease((u-k*GAP)/DUR),ang=-180*f;
      if(u>hold+.8){ang=-180*(1-ease((u-hold-.8)/.9));}
      p.style.transform='rotateY('+ang+'deg)';
      p.style.zIndex=ang<-90?k+1:N-k+10;
    });
    var cur=u<hold?Math.floor(u/GAP):-1;
    var r=bk.getBoundingClientRect();
    if(cur!==lastFlip&&cur>=0&&cur<N&&u-cur*GAP<.2){lastFlip=cur;emit(r.left+r.width/2,r.top+r.height*.35,34,true);}
    if(cur===-1)lastFlip=-1;
    cx.clearRect(0,0,W,H);
    stars.forEach(function(s){var a=.25+.55*Math.abs(Math.sin(t*1.2+s.p));star(s.x*W,s.y*H,s.r,a,'253,230,138');});
    emit(r.left+r.width/2,r.top+r.height*.4,2,false);
    for(var i=sp.length-1;i>=0;i--){var p=sp[i];p.l++;p.x+=p.vx+Math.sin((p.l+p.w*20)*.07)*.6;p.y+=p.vy;p.vy-=.006;p.vx*=.992;
      if(p.l>p.m){sp.splice(i,1);continue;}
      var a=Math.sin(p.l/p.m*3.1416);star(p.x,p.y,p.s*.55,a,p.c);}
    if(sp.length>420)sp.splice(0,sp.length-420);
  };
})();

/* 3. Scroll reveals (also catches CV rows filled in after load) */
var io=('IntersectionObserver' in window)?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.12}):null;
function scan(){document.querySelectorAll('.pro-row,.step,.cvl,.mo-reveal').forEach(function(el){if(el.dataset.mo)return;el.dataset.mo=1;if(!io){el.classList.add('in');return;}if(!el.classList.contains('mo-reveal'))el.classList.add('mo-reveal');io.observe(el);});}
scan();var n=0,iv=setInterval(function(){scan();if(++n>20)clearInterval(iv);},500);
}catch(e){console.warn('motion.js',e);}
})();
