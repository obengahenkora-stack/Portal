/* filestore.js — saves the shared data files through the back end (the public key can no longer write them). */
(function(){
  function sess(c){ try{ return c&&c.auth&&c.auth.getSession?c.auth.getSession().then(function(r){ return r&&r.data&&r.data.session?r.data.session.access_token:''; }).catch(function(){ return ''; }):Promise.resolve(''); }catch(e){ return Promise.resolve(''); } }
  function client(){ try{ return (0,eval)('typeof supabaseClient!=="undefined"?supabaseClient:null'); }catch(e){ return null; } }
  function cfg(k){ try{ return (0,eval)(k); }catch(e){ return ''; } }
  async function call(payload, fn){
    var adm=null; try{ adm=window._adminViaStaff||null; }catch(e){}
    var tok=adm?await sess(adm):''; if(!tok) tok=await sess(client());
    var h={'Content-Type':'application/json',apikey:cfg('SUPABASE_KEY')};
    if(tok){ var iss=''; try{ iss=JSON.parse(atob(tok.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).iss||''; }catch(e){} h[iss.indexOf('qqnsbuirelhwfrshafay')>=0?'x-student-token':'x-staff-token']=tok; }
    var r=await fetch(cfg('SUPABASE_URL')+'/functions/v1/'+(fn||'api'),{method:'POST',headers:h,body:JSON.stringify(payload)});
    var j=null; try{ j=await r.json(); }catch(e){}
    return {ok:!!(j&&j.ok), status:r.status, error:j&&j.error, json:j};
  }
  /* looks like a fetch Response so pages keep their existing "if(!res.ok)" checks */
  window._bkPutRes=async function(path,obj,opts){
    var o=await call({action:'file_put',path:path,data:obj,restore:!!(opts&&opts.restore)});
    return {ok:o.ok,status:o.status,text:async function(){ return o.error||''; },json:async function(){ return o.json; }};
  };
  window._bkAnon=async function(payload){
    var o=await call(payload);
    if(!o.ok) throw new Error(o.error||'Could not save');
    return true;
  };
  window._bkScores=function(p){ return call(p,'scores'); };
  window._bkGameScore=async function(entry){
    var o=await call({action:'add',entry:entry},'scores'); /* the public file keeps no index number; the full entry goes to a private file */
    if(!o.ok) throw new Error(o.error||'Could not save your score');
    return true;
  };
})();

/* sdFetch: students and visitors read site-data.json through the cache worker (30 s copy, saves Supabase data); anyone signed in as staff, or any failure, reads Supabase directly. */
(function(){
  var PC='https://portal-cache.obengahenkora.workers.dev/site-data';
  function staff(){ try{ for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); if(k&&k.indexOf('sb-mdbhlndjuddymvderuun')===0&&k.indexOf('auth-token')>0&&localStorage.getItem(k)) return true; } }catch(e){ return true; } return false; }
  window.sdFetch=async function(url,opts){
    try{
      if(String(url).indexOf('/object/public/portal-data/site-data.json')>0 && !staff()){
        var r=await fetch(PC); if(r.ok) return r;
      }
    }catch(e){}
    return fetch(url,opts);
  };
})();
