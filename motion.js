/* Home page motion: floating blueprint shapes, scroll reveals, draggable expertise bubbles, flip credentials. Additive and safe: any failure leaves the page as it was. */
(function(){
try{
var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var st=document.createElement('style');
st.textContent=`
.mo-reveal{opacity:0;transform:translateY(28px);transition:opacity .7s ease,transform .7s cubic-bezier(.2,.7,.2,1)}
.mo-reveal.in{opacity:1;transform:none}
#moBg{position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.5}
body.landing #moBg{opacity:.35}
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
function draw(){
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
if(!RM&&matchMedia('(pointer:fine)').matches){var g=document.createElement('div');g.className='mo-glow';document.body.appendChild(g);addEventListener('pointermove',function(e){g.style.left=e.clientX+'px';g.style.top=e.clientY+'px';},{passive:true});}

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

/* 3. Scroll reveals (also catches CV rows filled in after load) */
var io=('IntersectionObserver' in window)?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.12}):null;
function scan(){document.querySelectorAll('.pro-row,.step,.cvl,.mo-reveal').forEach(function(el){if(el.dataset.mo)return;el.dataset.mo=1;if(!io){el.classList.add('in');return;}if(!el.classList.contains('mo-reveal'))el.classList.add('mo-reveal');io.observe(el);});}
scan();var n=0,iv=setInterval(function(){scan();if(++n>20)clearInterval(iv);},500);
}catch(e){console.warn('motion.js',e);}
})();
