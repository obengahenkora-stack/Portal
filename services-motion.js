/* Services page motion: drifting aurora, wave-in heading, sweeping service rows with a spotlight that follows the pointer. */
(function(){
try{
var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var st=document.createElement('style');
st.textContent=`
#svAurora{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}
#svAurora i{position:absolute;width:55vmax;height:55vmax;border-radius:50%;filter:blur(70px);opacity:.15;will-change:transform}
#svAurora i:nth-child(1){background:#0ea5e9;left:-15vmax;top:-10vmax;animation:sv1 18s ease-in-out infinite alternate}
#svAurora i:nth-child(2){background:#8b5cf6;right:-18vmax;top:10vmax;animation:sv2 22s ease-in-out infinite alternate}
#svAurora i:nth-child(3){background:#22c55e;left:10vmax;bottom:-25vmax;animation:sv3 26s ease-in-out infinite alternate}
#svAurora i:nth-child(4){background:#f59e0b;right:5vmax;bottom:-20vmax;opacity:.1;animation:sv1 30s ease-in-out infinite alternate-reverse}
@keyframes sv1{to{transform:translate(18vmax,12vmax) scale(1.2)}}
@keyframes sv2{to{transform:translate(-20vmax,8vmax) scale(.85)}}
@keyframes sv3{to{transform:translate(14vmax,-14vmax) scale(1.15)}}
.hero,.wrap,.hero-tabs{position:relative;z-index:1}
.hero h1{animation:svH 1s cubic-bezier(.2,.8,.2,1) both}
.hero p{animation:svH 1s cubic-bezier(.2,.8,.2,1) .25s both}
@keyframes svH{from{opacity:0;transform:translateY(36px);filter:blur(8px)}to{opacity:1;transform:none;filter:none}}
.cvl.sv-row{padding-left:12px;position:relative;overflow:hidden;opacity:0;transform:translateX(-40px);transition:opacity .7s ease,transform .7s cubic-bezier(.2,.8,.2,1),background .3s,padding-left .3s}
.cvl.sv-row.in{opacity:1;transform:none}
.cvl.sv-row::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(#0ea5e9,#8b5cf6);transform:scaleY(0);transform-origin:top;transition:transform .5s ease .2s}
.cvl.sv-row.in::before{transform:scaleY(1)}
.cvl.sv-row::after{content:"";position:absolute;inset:0;background:radial-gradient(260px circle at var(--mx,50%) var(--my,50%),rgba(14,165,233,.16),transparent 70%);opacity:0;transition:opacity .3s;pointer-events:none}
.cvl.sv-row:hover::after{opacity:1}
.cvl.sv-row:hover{padding-left:22px}
@media (prefers-reduced-motion:reduce){.hero h1,.hero p,.cvl.sv-row{opacity:1;transform:none;animation:none;transition:none}#svAurora i{animation:none}}
`;
document.head.appendChild(st);
var au=document.createElement('div');au.id='svAurora';au.innerHTML='<i></i><i></i><i></i><i></i>';document.body.insertBefore(au,document.body.firstChild);
var rows=[].slice.call(document.querySelectorAll('.cvl'));
rows.forEach(function(r,i){r.classList.add('sv-row');r.style.transitionDelay=Math.min(i*0.06,.5)+'s';
  r.addEventListener('pointermove',function(e){var b=r.getBoundingClientRect();r.style.setProperty('--mx',(e.clientX-b.left)+'px');r.style.setProperty('--my',(e.clientY-b.top)+'px');});});
if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.1});rows.forEach(function(r){io.observe(r);});}
else rows.forEach(function(r){r.classList.add('in');});
}catch(e){console.warn('services-motion',e);}
})();
