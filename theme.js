(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  try{ if(localStorage.getItem('siteTheme')==='dark') document.documentElement.setAttribute('data-theme','dark'); }catch(e){}
  function ready(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded',fn); }

  ready(function(){
    var oldTabs=document.querySelector('.hero-tabs'), hero=document.querySelector('.hero');
    var file=(location.pathname.split('/').pop()||'index.html').toLowerCase();
    if(!oldTabs){ return; }   /* standalone pages (e.g. check-in) keep their own layout */
    document.body.classList.add('themed');

    /* ---- page header: move the real title/subtitle into a two-column header ---- */
    var wrap=document.querySelector('.wrap');
    var head=document.createElement('section'); head.className='page-head';
    if(hero){
      var h1=hero.querySelector('h1'); var p=hero.querySelector('p:not(.hero-sub)');
      if(h1) head.appendChild(h1);
      if(p) head.appendChild(p);
    }
    if(wrap) wrap.parentNode.insertBefore(head,wrap);

    /* ---- top bar ---- */
    var map={ 'services.html':'Services','lecture-hall.html':'Lecture Hall','blog.html':'Lecture Hall','announcements.html':'Lecture Hall','videos.html':'Lecture Hall','course.html':'Lecture Hall','portal.html':'Staff','dashboard.html':'Students Dashboard' };
    var crumbMap={ 'services.html':'Services','lecture-hall.html':'Lecture Hall','blog.html':'Blog','announcements.html':'Announcements','videos.html':'Videos','course.html':'Course','portal.html':'Staff','dashboard.html':'Students Dashboard' };
    var current=map[file]||'';
    var items=[['Home','index.html'],['Services','services.html'],['Students Dashboard','dashboard.html'],['Staff','portal.html']];
    var top=document.createElement('header'); top.className='topbar';
    var left=document.createElement('div'); left.className='tb-left';
    left.innerHTML='Obeng-Ahenkora <span>/ '+(crumbMap[file]||'')+'</span>';
    left.addEventListener('click',function(){ go('index.html'); });
    var nav=document.createElement('nav'); nav.className='tb-tabs';
    items.forEach(function(it){
      var a=document.createElement('a'); a.className='tb-tab'+(it[0]===current?' active':''); a.href=it[1]; a.textContent=it[0];
      if(it[0]===current){
        /* keep an in-page "back to start" handler if the old tab had one (e.g. Faculty Console hub) */
        var orig=[].slice.call(oldTabs.querySelectorAll('.tab-static')).filter(function(t){ return t.textContent.trim()===it[0] && t.getAttribute('onclick'); })[0];
        if(orig) a.addEventListener('click',function(e){ e.preventDefault(); e.stopPropagation(); orig.click(); });
      }
      nav.appendChild(a);
    });
    var right=document.createElement('div'); right.className='tb-right'; right.id='tbClock'; right.innerHTML='&nbsp;';
    top.appendChild(left); top.appendChild(nav); top.appendChild(right);
    var tg=document.createElement('button'); tg.className='theme-toggle'; tg.setAttribute('aria-label','Toggle dark mode');
    function icon(){ tg.textContent=document.documentElement.getAttribute('data-theme')==='dark'?'☀️':'🌙'; }
    tg.addEventListener('click',function(){ var d=document.documentElement.getAttribute('data-theme')==='dark'; if(d) document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme','dark'); try{ localStorage.setItem('siteTheme',d?'light':'dark'); }catch(e){} icon(); });
    icon();
    document.body.insertBefore(top,document.body.firstChild); document.body.appendChild(tg);

    /* stagger the first few blocks */
    [].slice.call(head.children).forEach(function(c,i){ c.setAttribute('data-i',i+1); });
    if(wrap) [].slice.call(wrap.children).slice(0,8).forEach(function(c,i){ c.setAttribute('data-i',i+2); });

    /* ---- clock + weather ---- */
    var wx='';
    function tick(){ try{ var t=new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Africa/Accra'}).format(new Date()); right.textContent='SUNYANI  '+t+(wx?'  '+wx:''); }catch(e){} }
    tick(); setInterval(tick,30000);
    var names={0:'Clear',1:'Mostly clear',2:'Partly cloudy',3:'Cloudy',45:'Fog',48:'Fog',51:'Drizzle',53:'Drizzle',55:'Drizzle',61:'Rain',63:'Rain',65:'Heavy rain',80:'Showers',81:'Showers',82:'Heavy showers',95:'Storm',96:'Storm',99:'Storm'};
    try{ fetch('https://api.open-meteo.com/v1/forecast?latitude=7.33&longitude=-2.33&current=temperature_2m,weather_code').then(function(r){return r.json();}).then(function(d){ var c=d.current; wx=Math.round(c.temperature_2m)+'°C '+(names[c.weather_code]||''); tick(); }).catch(function(){}); }catch(e){}
  });

  /* ---- page leave: sink out, then navigate (same as index) ---- */
  function go(href){ if(reduce){ location.href=href; return; } document.body.classList.add('leaving'); setTimeout(function(){ location.href=href; },190); }
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href]'); if(!a||e.defaultPrevented) return;
    if(e.metaKey||e.ctrlKey||e.shiftKey||e.button) return;
    var h=a.getAttribute('href')||''; if(!h||h.charAt(0)==='#'||/^(mailto:|tel:|javascript:)/i.test(h)||a.target==='_blank'||a.hasAttribute('download')) return;
    if(a.origin && a.origin!==location.origin) return;
    e.preventDefault(); go(a.href);
  });
  window.addEventListener('pageshow',function(){ document.body.classList.remove('leaving'); });
})();
