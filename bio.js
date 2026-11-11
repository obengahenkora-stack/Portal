/* Fingerprint / face unlock for sign-in (this device only). Works on both the student dashboard and the staff portal. */
(function(){
var STUDENT=typeof window.studentSignIn==='function', STAFF=!STUDENT && typeof window.signInUser==='function';
if(!STUDENT && !STAFF) return;
var KEY=STUDENT?'ceBio_student':'ceBio_staff', NO='ceBioNo_'+(STUDENT?'s':'t');
var ok=!!(window.PublicKeyCredential && navigator.credentials && navigator.credentials.create && window.isSecureContext);
function load(){ try{ return JSON.parse(localStorage.getItem(KEY)||'null'); }catch(e){ return null; } }
function save(o){ try{ localStorage.setItem(KEY,JSON.stringify(o)); }catch(e){} }
function b64(buf){ var s='',u=new Uint8Array(buf); for(var i=0;i<u.length;i++) s+=String.fromCharCode(u[i]); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function unb64(t){ t=t.replace(/-/g,'+').replace(/_/g,'/'); while(t.length%4) t+='='; var s=atob(t),u=new Uint8Array(s.length); for(var i=0;i<s.length;i++) u[i]=s.charCodeAt(i); return u; }
function rnd(n){ var a=new Uint8Array(n); crypto.getRandomValues(a); return a; }
function msg(h){ var m=document.getElementById(STUDENT?'studentAuthMsg':'authMsg'); if(m) m.innerHTML=h||''; }
function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
async function enroll(session){
  var em=session.user.email;
  var cred=await navigator.credentials.create({publicKey:{challenge:rnd(32),rp:{name:'UENR Civil & Environmental Engineering',id:location.hostname},user:{id:rnd(16),name:em,displayName:em},pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required',residentKey:'discouraged'},timeout:60000,attestation:'none'}});
  save({email:em,cid:b64(cred.rawId),at:session.access_token,rt:session.refresh_token});
  try{ localStorage.removeItem(NO+'_'+em); }catch(e){}
}
async function offer(){
  if(!ok) return;
  try{
    var r=await supabaseClient.auth.getSession(), s=r&&r.data&&r.data.session; if(!s) return;
    var b=load(); if(b && b.email===s.user.email) return;
    if(localStorage.getItem(NO+'_'+s.user.email)) return;
    if(!confirm('Use your fingerprint or face (Face ID) to sign in next time on this device?\n\nYour password is not stored. You can still sign in with your password anytime.')){ try{ localStorage.setItem(NO+'_'+s.user.email,'1'); }catch(e){} return; }
    await enroll(s); alert('Done. Next time use "Sign in with fingerprint or face".'); drawBtn();
  }catch(e){ console.warn('bio enroll',e); }
}
async function unlock(){
  var b=load(); if(!b) return;
  msg('<div class="msg ok">Waiting for your fingerprint or face...</div>');
  try{
    await navigator.credentials.get({publicKey:{challenge:rnd(32),allowCredentials:[{type:'public-key',id:unb64(b.cid),transports:['internal']}],userVerification:'required',timeout:60000}});
  }catch(e){ msg('<div class="msg err">Not confirmed ('+esc((e&&e.name)||'error')+(e&&e.message?': '+esc(String(e.message).slice(0,120)):'')+'). Use your password instead.</div>'); return; }
  var res=await supabaseClient.auth.setSession({access_token:b.at,refresh_token:b.rt});
  if(res.error||!res.data||!res.data.session){ localStorage.removeItem(KEY); msg('<div class="msg err">This device’s fingerprint sign-in expired. Please sign in with your password once more.</div>'); drawBtn(); return; }
  save({email:b.email,cid:b.cid,at:res.data.session.access_token,rt:res.data.session.refresh_token});
  if(STUDENT) await onStudentSignedIn(); else { try{ markSessionStart(); }catch(e){} await onAuthReady(true); }
}
function drawBtn(){
  var old=document.getElementById('bioRow'); if(old) old.remove();
  var b=load(); if(!ok||!b) return;
  var anchor=document.querySelector(STUDENT?'button[onclick="studentSignIn()"]':'button[onclick="signInUser()"]'); if(!anchor) return;
  var row=document.createElement('div'); row.id='bioRow'; row.style.cssText='margin-top:10px;display:flex;gap:10px;align-items:center;flex-wrap:wrap';
  row.innerHTML='<button type="button" class="secondary" id="bioGo" style="text-transform:none !important">&#128274; Fingerprint or face sign in</button><span id="bioOff" style="display:block;margin-top:10px;text-align:center;font-size:.78rem;color:var(--muted);text-decoration:underline;cursor:pointer">Turn off on this device</span>';
  var host=anchor.parentNode; host.parentNode.insertBefore(row,host.nextSibling);
  document.getElementById('bioGo').onclick=unlock;
  document.getElementById('bioOff').onclick=function(){ if(confirm('Turn off fingerprint sign-in on this device?')){ localStorage.removeItem(KEY); drawBtn(); } };
}
function wrap(name){ var f=window[name]; window[name]=async function(){ var r=await f.apply(this,arguments); offer(); return r; }; }
wrap(STUDENT?'studentSignIn':'signInUser');
try{ supabaseClient.auth.onAuthStateChange(function(ev,s){ var b=load(); if(b&&s&&s.user&&s.user.email===b.email&&(ev==='TOKEN_REFRESHED'||ev==='SIGNED_IN')){ b.at=s.access_token; b.rt=s.refresh_token; save(b); } }); }catch(e){}
try{ var _so=supabaseClient.auth.signOut.bind(supabaseClient.auth); supabaseClient.auth.signOut=function(o){ return _so(load()?{scope:'local'}:o); }; }catch(e){}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',drawBtn); else drawBtn();
})();
