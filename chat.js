/* Student chat: online list, rooms (Everyone + own courses) and direct messages.
   Several conversations can be open at once, side by side. Uses Supabase Realtime
   (presence + broadcast) on the data project. Message history is kept in the
   chat_messages table if it exists; if not, chat still works live. Messages last 24 hours. */
(function(){
'use strict';
if(window.ChatUI) return;

var S={ rt:null, me:null, pres:null, chans:{}, sendCh:{}, msgs:{}, unread:{}, online:{}, dms:{}, gen:{}, readAt:{}, sq:'', sr:null, sT:null, mute:false, open:false, cur:null, confirmDel:null, embed:null, wantEmbed:null, cl:{}, wins:[],
        histOK:true, genCol:true, loaded:{}, lastSend:0, rooms:[], root:null, started:false, renderT:null };

function G(expr){ try{ return (0,eval)(expr); }catch(e){ return undefined; } }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function hash(s){ var h=5381; s=String(s); for(var i=0;i<s.length;i++){ h=((h<<5)+h+s.charCodeAt(i))|0; } return (h>>>0).toString(36); }
function slug(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
function baseCourse(n){ var s=String(n||'').trim(); var m=s.match(/^(.*\d)\s*[-_\/]?\s*\(?\s*(?:group|grp|class|section|sec)?\s*[A-Za-z]\s*\)?$/i); return m?m[1].trim():s; }
function shortName(n){ var t=String(n||'').trim().replace(/\s+/g,' '); return t?t.slice(0,60):'Student'; }
function colorFor(id){ var cols=['#0ea5e9','#22c55e','#8b5cf6','#f43f5e','#f59e0b','#14b8a6','#ec4899','#6366f1']; var n=0; for(var i=0;i<id.length;i++) n+=id.charCodeAt(i); return cols[n%cols.length]; }
function now(){ return Date.now(); }
var TTL=24*60*60*1000;
var OWNER_CHAT_ID=null; function ownerId(){ if(!OWNER_CHAT_ID) OWNER_CHAT_ID='s'+hash('obengahenkora@gmail.com'); return OWNER_CHAT_ID; }
var FOREVER=100*365*24*3600*1000;
function cutoffIso(){ return new Date(Date.now()-TTL).toISOString(); }
function fmtTime(ts){ try{ return new Date(ts).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}); }catch(e){ return ''; } }
function isMobile(){ return window.innerWidth<=560; }

function identity(){
  var a=G('typeof studentCurrentAccount!=="undefined"?studentCurrentAccount:null');
  var em=G('typeof studentCurrentEmail!=="undefined"?studentCurrentEmail:null');
  var adm=!!G('typeof isAdminUser==="function"&&isAdminUser()');
  if(!em) return null;
  if(a && a.indexNumber) return { id:'s'+hash(String(em).toLowerCase()), name:shortName(a.name), staff:adm, g:a.gender||'' };
  if(adm) return { id:'s'+hash(String(em).toLowerCase()), name:(String(em).toLowerCase()==='obengahenkora@gmail.com'?OWNER_FULL:'Lecturer'), staff:true, g:'' };
  return null;
}
function portalIdentity(){
  var role=G('typeof currentUserRole!=="undefined"?currentUserRole:null');
  var em=G('typeof currentUserEmail!=="undefined"?currentUserEmail:null');
  if(!role||!em) return null;
  var nm=G('typeof currentUserName!=="undefined"?currentUserName:null')||'';
  var label={owner:'Owner',admin:'Admin',lecturer:'Lecturer',ta:'TA'}[role]||'Staff';
  var cs=G('typeof currentUserCourses!=="undefined"?currentUserCourses:null');
  window.__myCourses=Array.isArray(cs)?cs:[];
  return { id:'s'+hash(String(em).toLowerCase()), name:role==='owner'?OWNER_FULL:(nm&&nm!=='Owner'?shortName(nm):label), staff:role!=='ta', role:label, g:'' };
}
function myRooms(){
  var rooms=[{id:'everyone',title:'Everyone',kind:'room'}];
  var cs=window.__myCourses||[], seen={};
  cs.forEach(function(c){ var b=baseCourse(c); var id='course:'+slug(b); if(!slug(b)||seen[id]) return; seen[id]=1; rooms.push({id:id,title:b,kind:'course'}); });
  return rooms;
}
function dmRoom(a,b){ return 'dm:'+[a,b].sort().join('|'); }
function isDm(r){ return String(r).indexOf('dm:')===0; }
function peerOf(room){ var ids=String(room).slice(3).split('|'); return ids[0]===S.me.id?ids[1]:ids[0]; }
function namesGet(){ try{ return JSON.parse(localStorage.getItem('ceChatNames')||'{}'); }catch(e){ return {}; } }
function rememberName(id,n){ if(!id||!n||id===(S.me&&S.me.id)) return; try{ var o=namesGet(); if(o[id]===n) return; o[id]=n; var k=Object.keys(o); if(k.length>300) delete o[k[0]]; localStorage.setItem('ceChatNames',JSON.stringify(o)); }catch(e){} }
function nameOf(id){ return (S.dir&&S.dir[id])||S.dn[id]||(S.online[id]&&S.online[id].name)||namesGet()[id]||''; }
function apiCall(payload){
  var cl=null; try{ cl=G('typeof supabaseClient!=="undefined"?supabaseClient:null'); }catch(e){}
  var adm=null; try{ adm=window._adminViaStaff||null; }catch(e){}
  var get=function(c){ return (c&&c.auth&&c.auth.getSession)?c.auth.getSession().then(function(r){ return r&&r.data&&r.data.session?r.data.session.access_token:''; }).catch(function(){ return ''; }):Promise.resolve(''); };
  return get(adm).then(function(t){ return t?t:get(cl); }).then(function(tok){
    var h={'Content-Type':'application/json',apikey:G('SUPABASE_KEY')};
    if(tok){ var iss=''; try{ iss=JSON.parse(atob(tok.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).iss||''; }catch(e){} h[iss.indexOf('qqnsbuirelhwfrshafay')>=0?'x-student-token':'x-staff-token']=tok; }
    _hc=h;
    return fetch(G('SUPABASE_URL')+'/functions/v1/api',{method:'POST',headers:h,body:JSON.stringify(payload)}).then(function(r){ return r.json(); });
  });
}
var _hc=null;
function chatOp(op,extra,ka){
  var p=Object.assign({action:'chat_op',op:op},extra||{});
  if(ka&&_hc) return fetch(G('SUPABASE_URL')+'/functions/v1/api',{method:'POST',keepalive:true,headers:_hc,body:JSON.stringify(p)}).then(function(r){ return r.json(); }).catch(function(){ return {ok:false}; });
  return apiCall(p);
}
function loadDir(){ if(S.dir||S.dirLoading) return; S.dirLoading=1; var d={};
  var page=function(){ return apiCall({action:'stu_dir'}).then(function(j){ if(j&&j.ok&&j.names) Object.keys(j.names).forEach(function(k){ d[k]=j.names[k]; }); }); };
  var staff=function(){ return fetch(G('SUPABASE_URL')+'/functions/v1/api',{method:'POST',headers:{'Content-Type':'application/json',apikey:G('SUPABASE_KEY')},body:JSON.stringify({action:'staff_names'})}).then(function(r){ return r.ok?r.json():null; }).then(function(j){ if(j&&j.ok&&j.names){ Object.keys(j.names).forEach(function(k){ d[k]=j.names[k]; }); return; } return staff2(); }).catch(function(){ return staff2(); }); };
  var staff2=function(){ try{ var f=G('typeof fetchSupabaseData==="function"?fetchSupabaseData:null'); if(!f) return Promise.resolve(); return Promise.resolve(f()).then(function(data){
    ((data&&data.teamMembers)||[]).forEach(function(m){ if(m&&m.email&&m.name) d['s'+hash(String(m.email).toLowerCase())]=String(m.name).trim().replace(/\s+/g,' '); });
    try{ var oe=G('typeof OWNER_EMAIL!=="undefined"?OWNER_EMAIL:""'); if(oe) d['s'+hash(String(oe).toLowerCase())]=OWNER_FULL; }catch(e){} }).catch(function(){}); }catch(e){ return Promise.resolve(); } };
  page().catch(function(){}).then(staff).then(function(){
    S.dir=d; applyNames(d);
    try{ if(S.me&&S.me.id===ownerId()&&d[ownerId()]&&S.me.name!==d[ownerId()]){ S.me.name=d[ownerId()]; if(S.lounge) track(S.lounge); } }catch(e){}
    var ids=[]; Object.keys(S.msgs).forEach(function(k){ S.msgs[k].forEach(function(m){ ids.push(m.from_id); }); }); Object.keys(S.dms).forEach(function(k){ if(S.dms[k].peer) ids.push(S.dms[k].peer); }); lsNeed(ids); }); }
var OWNER_FULL='Engr. Nana Kwame Obeng-Ahenkora';
function rememberGender(id,g){ if(id&&(g==='Male'||g==='Female')) S.gen[id]=g; }

/* ---------- sound + seen ---------- */
var _ac=null;
try{ S.mute=localStorage.getItem('ceChatMute')==='1'; S.cl=JSON.parse(localStorage.getItem('ceChatCleared')||'{}')||{}; }catch(e){}
document.addEventListener('click',function(){ try{ if(!_ac){ var AC=window.AudioContext||window.webkitAudioContext; if(AC) _ac=new AC(); } if(_ac&&_ac.state==='suspended') _ac.resume(); }catch(e){} },true);
function beep(){
  if(S.mute||!_ac||_ac.state!=='running') return;
  try{ var t=_ac.currentTime; [[880,0],[1175,.13]].forEach(function(n){ var o=_ac.createOscillator(), g=_ac.createGain(); o.type='sine'; o.frequency.value=n[0]; g.gain.setValueAtTime(0,t+n[1]); g.gain.linearRampToValueAtTime(.18,t+n[1]+.02); g.gain.exponentialRampToValueAtTime(.001,t+n[1]+.18); o.connect(g); g.connect(_ac.destination); o.start(t+n[1]); o.stop(t+n[1]+.2); }); }catch(e){}
}
function toast(m){
  try{
    var name=m.from_name||'Someone', txt=String(m.text||'').slice(0,90);
    var el=document.getElementById('ceToast');
    if(!el){ el=document.createElement('div'); el.id='ceToast'; document.body.appendChild(el); }
    el.innerHTML='<span class="tt-av"></span><span class="tt-tx"><b></b><span></span></span><span class="tt-x" aria-label="Dismiss">&times;</span>';
    el.querySelector('.tt-av').innerHTML=avatar(m.from_id,name,true,m.from_g,false);
    el.querySelector('b').textContent=(isDm(m.room)?name:name+' in '+roomTitle(m.room));
    el.querySelector('.tt-tx span').textContent=txt;
    el.className='show';
    el.onclick=function(e){ if(e.target.closest('.tt-x')){ el.className=''; return; } el.className=''; goChat(m.room); };
    clearTimeout(el.__t); el.__t=setTimeout(function(){ el.className=''; },6500);
  }catch(e){}
  try{ if(document.visibilityState==='hidden'&&window.Notification&&Notification.permission==='granted'){ var n=new Notification((m.from_name||'New message'),{body:String(m.text||'').slice(0,120),tag:'ce-'+m.room}); n.onclick=function(){ window.focus(); openRoom(m.room); n.close(); }; } }catch(e){}
}
function goChat(room){
  try{
    var ah=document.getElementById('adminHub');
    if(ah&&!ah.classList.contains('hidden')&&window.adminTab) window.adminTab('adminChat');
    else if(document.getElementById('dashChatCard')&&window.dashTab) window.dashTab('dashChatCard');
    else if(document.getElementById('chatView')&&typeof G('switchTab')==='function') G('switchTab')('chat');
  }catch(e){}
  openRoom(room);
}
var VAPID_PUB='BLZ2Kqbanm86QxK37rReWj_JmiPX4EKKS4zNjlGvhpR2wcudGhrknUzo-uXpcoS9CJNjOeyD6G4gcFHdkjAeBlc';
function b64u(s){ var p='='.repeat((4-s.length%4)%4), b=atob((s+p).replace(/-/g,'+').replace(/_/g,'/')), a=new Uint8Array(b.length); for(var i=0;i<b.length;i++) a[i]=b.charCodeAt(i); return a; }
function pushSub(){ try{ if(!S.me||!window.Notification||Notification.permission!=='granted'||!('serviceWorker' in navigator)||!('PushManager' in window)) return;
  navigator.serviceWorker.ready.then(function(reg){ return reg.pushManager.getSubscription().then(function(sub){ return sub||reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u(VAPID_PUB)}); }); })
  .then(function(sub){ if(!sub) return; var key=S.me.id+'|'+sub.endpoint; if(S.pushKey===key) return; S.pushKey=key;
    return chatOp('push_sub',{endpoint:sub.endpoint,sub:sub.toJSON()}); }).catch(function(){}); }catch(e){} }
function askNotify(){ try{ if(window.Notification&&Notification.permission==='default'){ var p=Notification.requestPermission(); if(p&&p.then) p.then(pushSub); } else pushSub(); }catch(e){} }
function seenGet(){ try{ return JSON.parse(localStorage.getItem('ceChatSeen')||'{}'); }catch(e){ return {}; } }
function markSeen(room){ try{ var o=seenGet(); o[room]=Date.now(); localStorage.setItem('ceChatSeen',JSON.stringify(o)); }catch(e){} seenPush(); }
function seenPush(){ if(!S.me||!S.histOK) return; clearTimeout(S.spT); S.spT=setTimeout(function(){ try{ var id='seen:'+S.me.id;
  var row={id:id,room:id,from_id:S.me.id,from_name:'-',text:JSON.stringify(seenGet()),created_at:new Date().toISOString()};
  if(S.genCol) row.expires_at=new Date(Date.now()+400*24*3600*1000).toISOString();
  upsertRow(row); }catch(e){} },1500); }
function seenPull(cb){ if(!S.me||!S.histOK) return cb(); chatOp('kv_get',{ids:['seen:'+S.me.id]}).then(function(j){ return (j&&j.rows)||[]; }).then(function(rows){
  try{ var rem=JSON.parse((rows[0]&&rows[0].text)||'{}'), o=seenGet(); Object.keys(rem).forEach(function(k){ if((rem[k]||0)>(o[k]||0)) o[k]=rem[k]; }); localStorage.setItem('ceChatSeen',JSON.stringify(o)); }catch(e){} cb(); }).catch(function(){ cb(); }); }

/* ---------- encryption (AES-GCM; text is scrambled before it is sent or stored) ---------- */
var _keys={};
function b64(buf){ var a=new Uint8Array(buf),s='';for(var i=0;i<a.length;i++)s+=String.fromCharCode(a[i]);return btoa(s); }
function unb64(t){ var s=atob(t),a=new Uint8Array(s.length);for(var i=0;i<s.length;i++)a[i]=s.charCodeAt(i);return a; }
function keyFor(room){
  if(_keys[room]) return _keys[room];
  var enc=new TextEncoder();
  _keys[room]=crypto.subtle.importKey('raw',enc.encode('ce-chat-v1|'+room),'PBKDF2',false,['deriveKey']).then(function(k){
    return crypto.subtle.deriveKey({name:'PBKDF2',salt:enc.encode('obeng-ahenkora.xyz/chat'),iterations:60000,hash:'SHA-256'},k,{name:'AES-GCM',length:256},false,['encrypt','decrypt']); });
  return _keys[room];
}
/* ---------- end-to-end encryption for direct messages ----------
   Each person has a private key that never leaves their own signed-in account (kept in their login profile,
   not in the chat table). Only the public half is shared. Nobody else, including the site owner reading the
   database, can open a direct message without one of the two private keys. */
function me2(){ return S.me&&S.me.id; }
function authClient(){ return G('window._adminViaStaff||(typeof supabaseClient!=="undefined"?supabaseClient:null)'); }
function peerOfRoom(room){ var m=String(room).replace(/^dm:/,'').split('|'); return m[0]===me2()?m[1]:m[0]; }
function e2Ready(){
  if(S.e2p&&S.e2for===me2()) return S.e2p; S.e2for=me2();
  var lk='ceE2E:'+me2(), cl=authClient();
  var load=function(o){ return Promise.all([crypto.subtle.importKey('jwk',o.priv,{name:'ECDH',namedCurve:'P-256'},false,['deriveKey']),Promise.resolve(o.pub)]).then(function(a){ return {priv:a[0],pub:a[1]}; }); };
  var local=null; try{ local=JSON.parse(localStorage.getItem(lk)||'null'); }catch(e){}
  var fromMeta=(!cl||!cl.auth||!cl.auth.getUser)?Promise.resolve({ok:false}):cl.auth.getUser().then(function(r){ var u=r&&r.data&&r.data.user; if(!u) return {ok:false}; var m=u.user_metadata&&u.user_metadata.ce_e2e; if(m&&m.priv&&m.pub) return {ok:true,o:m}; return {ok:true,o:null}; }).catch(function(){ return {ok:false}; });
  S.e2p=fromMeta.then(function(r){
    if(r.ok&&r.o){ try{ localStorage.setItem(lk,JSON.stringify(r.o)); }catch(e){} return r.o; }
    if(local) { if(r.ok&&cl&&cl.auth.updateUser) cl.auth.updateUser({data:{ce_e2e:local}}).catch(function(){}); return local; }
    return crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveKey']).then(function(kp){
      return Promise.all([crypto.subtle.exportKey('jwk',kp.privateKey),crypto.subtle.exportKey('jwk',kp.publicKey)]).then(function(a){
        var o={priv:a[0],pub:a[1]}; try{ localStorage.setItem(lk,JSON.stringify(o)); }catch(e){}
        if(r.ok&&cl&&cl.auth.updateUser) cl.auth.updateUser({data:{ce_e2e:o}}).catch(function(){});
        return o; }); });
  }).then(function(o){ S.e2pub=o.pub; e2Publish(o.pub); return load(o); }).catch(function(){ S.e2p=null; return null; });
  return S.e2p;
}
function e2Publish(pub){ if(!S.histOK||!S.me) return; var id='pk:'+S.me.id, t=JSON.stringify(pub); if(S.e2pubSent===t) return; S.e2pubSent=t;
  var row={id:id,room:id,from_id:S.me.id,from_name:'-',text:t,created_at:new Date().toISOString()}; if(S.genCol) row.expires_at=new Date(Date.now()+400*24*3600*1000).toISOString(); upsertRow(row); }
S.pk=S.pk||{};
function e2Peer(peer,force){ if(!force&&S.pk[peer]!==undefined&&(S.pk[peer]||Date.now()-(S.pkT&&S.pkT[peer]||0)<30000)) return Promise.resolve(S.pk[peer]);
  S.pkT=S.pkT||{}; S.pkT[peer]=Date.now();
  return chatOp('kv_get',{ids:['pk:'+peer]}).then(function(j){ return (j&&j.rows)||[]; }).then(function(a){
    var j=null; try{ j=a&&a[0]?JSON.parse(a[0].text):null; }catch(e){}
    if(j&&JSON.stringify(j)!==JSON.stringify(S.pk[peer])){ S.pk[peer]=j; delete S.e2k[peer]; scheduleRender(); } else if(!j) S.pk[peer]=null; return S.pk[peer]; }).catch(function(){ return S.pk[peer]||null; }); }
S.e2k=S.e2k||{};
function e2Key(peer){ if(S.e2k[peer]) return S.e2k[peer];
  S.e2k[peer]=Promise.all([e2Ready(),e2Peer(peer)]).then(function(a){ var mine=a[0], pj=a[1]; if(!mine||!pj) { delete S.e2k[peer]; return null; }
    return crypto.subtle.importKey('jwk',pj,{name:'ECDH',namedCurve:'P-256'},false,[]).then(function(pub){ return crypto.subtle.deriveKey({name:'ECDH',public:pub},mine.priv,{name:'AES-GCM',length:256},false,['encrypt','decrypt']); }); }).catch(function(){ delete S.e2k[peer]; return null; });
  return S.e2k[peer]; }
function enc(room,text){
  if(!(window.crypto&&crypto.subtle)) return Promise.resolve(text);
  var legacy=function(){ return keyFor(room).then(function(k){ var iv=crypto.getRandomValues(new Uint8Array(12)); return crypto.subtle.encrypt({name:'AES-GCM',iv:iv},k,new TextEncoder().encode(text)).then(function(ct){ return 'e1:'+b64(iv)+'.'+b64(ct); }); }).catch(function(){ return text; }); };
  if(!isDm(room)) return legacy();
  return e2Key(peerOfRoom(room)).then(function(k){ if(!k) return legacy(); var iv=crypto.getRandomValues(new Uint8Array(12)); return crypto.subtle.encrypt({name:'AES-GCM',iv:iv},k,new TextEncoder().encode(text)).then(function(ct){ return 'e2:'+b64(iv)+'.'+b64(ct); }); }).catch(legacy);
}
function dec(room,text){
  var t=String(text);
  if(t.indexOf('e2:')===0){
    if(!(window.crypto&&crypto.subtle)) return Promise.resolve('[encrypted message]');
    var p=t.slice(3).split('.'), peer=peerOfRoom(room);
    var go=function(){ return e2Key(peer).then(function(k){ if(!k) throw 0; return crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(p[0])},k,unb64(p[1])); }).then(function(b){ return new TextDecoder().decode(b); }); };
    return go().catch(function(){ return e2Peer(peer,true).then(function(){ delete S.e2k[peer]; return go(); }); }).catch(function(){ return '[locked message: open it on the device where you first signed in]'; });
  }
  if(t.indexOf('e1:')!==0) return Promise.resolve(text);
  if(!(window.crypto&&crypto.subtle)) return Promise.resolve('[encrypted message]');
  var p1=t.slice(3).split('.');
  return keyFor(room).then(function(k){ return crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(p1[0])},k,unb64(p1[1])); }).then(function(b){ return new TextDecoder().decode(b); }).catch(function(){ return '[could not decrypt]'; });
}
function inMsg(p){ if(!p||!p.payload) return; var m=p.payload; dec(m.room,m.text).then(function(t){ m.text=t; addMsg(m); }); }
function inEdit(p){ if(!p||!p.payload) return; var e=p.payload; dec(e.room,e.text).then(function(t){ applyEdit(e.room,e.id,t); }); }
function applyEdit(room,id,t){ var l=S.msgs[room]||[]; for(var i=0;i<l.length;i++){ if(l[i].id===id){ l[i].text=t; l[i].edited=true; } } scheduleRender(); }
function editMsg(room,id,text){
  text=String(text||'').trim().slice(0,500); if(!text) return;
  var l=S.msgs[room]||[], m=l.filter(function(x){return x.id===id;})[0]; if(!m||m.from_id!==S.me.id||text===m.text) return;
  applyEdit(room,id,text);
  enc(room,text).then(function(ct){
    if(S.histOK) chatOp('edit',{id:id,text:ct}).catch(function(){});
    var p={room:room,id:id,text:ct};
    if(isDm(room)) sendTo('inbox:'+peerOf(room),'edit',p).catch(function(){}); else sendTo('room:'+room,'edit',p).catch(function(){});
  });
}
function inClear(p){ if(!p||!p.payload) return; var c=p.payload, l=S.msgs[c.room]; if(!l) return; S.msgs[c.room]=l.filter(function(x){return x.from_id!==c.from_id;}); scheduleRender(); }
function deleteChat(room){
  if(!isDm(room)) return;
  var peer=peerOf(room);
  S.cl[room]=now(); try{ localStorage.setItem('ceChatCleared',JSON.stringify(S.cl)); }catch(e){}
  S.msgs[room]=[]; delete S.dms[room]; S.unread[room]=0; S.confirmDel=null;
  if(S.histOK) chatOp('del_room',{room:room}).catch(function(){});
  sendTo('inbox:'+peer,'clear',{room:room,from_id:S.me.id}).catch(function(){});
  closeWin(room,true); S.cur=null; render();
}
function inRead(p){ if(!p||!p.payload) return; var r=p.payload; if(r.room&&r.ts){ S.readAt[r.room]=Math.max(S.readAt[r.room]||0,r.ts); scheduleRender(); } }
function sendRead(room){
  if(!isDm(room)||!S.me) return;
  if(!(S.open&&S.cur===room)||document.visibilityState==='hidden') return;
  sendTo('inbox:'+peerOf(room),'read',{room:room,ts:now()}).catch(function(){});
}

/* ---------- storage (history) ---------- */
function cf(u,o){ return (window.GATE&&GATE.chatFetch)?GATE.chatFetch(u,o):fetch(u,o); }
function hdr(){ var k=G('SUPABASE_KEY'); return {apikey:k,Authorization:'Bearer '+k,'Content-Type':'application/json'}; }
function tUrl(){ return G('SUPABASE_URL')+'/rest/v1/chat_messages'; }
function persist(m){
  if(!S.histOK) return;
  var row={id:m.id,room:m.room,from_id:m.from_id,from_name:m.from_name,text:m.text,created_at:new Date(m.ts).toISOString()};
  var body=Object.assign({},row);
  if(S.genCol){ if(m.from_g) body.from_gender=m.from_g; if(isDm(m.room)){ var tn=(S.dms[m.room]&&S.dms[m.room].name)||nameOf(peerOf(m.room)); if(tn) body.to_name=tn; } var offline=isDm(m.room)&&!S.online[peerOf(m.room)]; body.expires_at=new Date(m.ts+(m.from_id===ownerId()?FOREVER:(offline?30*24*3600*1000:TTL))).toISOString(); }
  chatOp('put',{row:body}).catch(function(){});
}
function expOf(x){ return x.expires_at?new Date(x.expires_at).getTime():new Date(x.created_at).getTime()+TTL; }
function loadHistory(room){
  if(S.loaded[room]||!S.histOK) return Promise.resolve();
  S.loaded[room]=1;
  return chatOp('room_msgs',{room:room})
   .then(function(j){ if(!j||!j.ok) throw new Error('x'); return j.rows||[]; })
   .then(function(rows){ return Promise.all(rows.reverse().filter(function(x){ return expOf(x)>Date.now(); }).map(function(x){ rememberGender(x.from_id,x.from_gender); return dec(x.room,x.text).then(function(t){ addMsg({id:x.id,room:x.room,from_id:x.from_id,from_name:x.from_name,from_g:x.from_gender||'',text:t,ts:new Date(x.created_at).getTime(),exp:expOf(x)},true); }); })); })
   .catch(function(){});
}
function loadDmList(){ seenPull(_loadDm); }
function _loadDm(){
  if(!S.histOK) return;
  var pick=S.genCol?chatOp('pick').catch(function(){}):Promise.resolve();
  pick.then(function(){ return chatOp('dm_msgs'); })
   .then(function(j){ if(!j||!j.ok) throw new Error('x'); return j.rows||[]; })
   .then(function(rows){ var seen=seenGet(), fresh=0;
     rows.forEach(function(x){ if(expOf(x)<=Date.now()||new Date(x.created_at).getTime()<=(S.cl[x.room]||0)) return; var peer=peerOf(x.room); if(!S.dms[x.room]) S.dms[x.room]={peer:peer,name:nameOf(peer)}; S.dms[x.room].until=Math.max(S.dms[x.room].until||0,expOf(x));
       if(x.from_id===S.me.id && x.to_name){ S.dms[x.room].name=x.to_name; rememberName(peer,x.to_name); }
       if(x.from_id!==S.me.id){ if(x.from_name) S.dms[x.room].name=(S.dir&&S.dir[x.from_id])||x.from_name; rememberGender(x.from_id,x.from_gender);
         if(new Date(x.created_at).getTime()>(seen[x.room]||0) && !winOpen(x.room)){ S.unread[x.room]=(S.unread[x.room]||0)+1; fresh++; } } });
     if(fresh) beep(); scheduleRender(); })
   .catch(function(){});
}
function purgeOld(){
  if(!S.histOK) return;
  chatOp('purge').catch(function(){});
}
function winOpen(room){ return S.wins.some(function(w){return w.room===room;}); }
function pruneLocal(){
  var cut=Date.now()-TTL, changed=false;
  Object.keys(S.msgs).forEach(function(r){ var l=S.msgs[r], n=l.filter(function(m){return (m.exp||m.ts+TTL)>Date.now();}); if(n.length!==l.length){ S.msgs[r]=n; changed=true; } });
  Object.keys(S.dms).forEach(function(r){ if(!(S.msgs[r]&&S.msgs[r].length) && !winOpen(r) && !S.dms[r].keep && !((S.dms[r].until||0)>Date.now())){ delete S.dms[r]; changed=true; } });
  if(changed) scheduleRender();
}
function removeRow(id){ if(!S.histOK) return; chatOp('del',{id:id}).catch(function(){}); }

/* ---------- messages ---------- */
function addMsg(m,silent){
  if(m&&m.from_id===ownerId()&&!m.exp) m.exp=Date.now()+FOREVER;
  if(S.dir&&S.dir[m.from_id]) m.from_name=S.dir[m.from_id];
  if(m.ts<=(S.cl[m.room]||0)) return false;
  var list=S.msgs[m.room]||(S.msgs[m.room]=[]);
  if(list.some(function(x){return x.id===m.id;})) return false;
  rememberGender(m.from_id,m.from_g); if(m.from_id!==S.me.id) rememberName(m.from_id,m.from_name);
  list.push(m); list.sort(function(a,b){return a.ts-b.ts;});
  if(isDm(m.room)){ var d=S.dms[m.room]||(S.dms[m.room]={peer:peerOf(m.room),name:''}); if(m.from_id!==S.me.id && m.from_name) d.name=m.from_name; }
  if(!silent && m.from_id!==S.me.id){
    if(!(S.open&&S.cur===m.room)) S.unread[m.room]=(S.unread[m.room]||0)+1; else { sendRead(m.room); markSeen(m.room); }
    beep();
    if(!(S.open&&S.cur===m.room&&document.visibilityState==='visible')) toast(m);
    render();
  }
  scheduleRender();
  return true;
}
function delMsg(room,id){ var l=S.msgs[room]; if(!l) return; S.msgs[room]=l.filter(function(x){return x.id!==id;}); scheduleRender(); }

function getChan(topic,setup){
  if(S.chans[topic]) return S.chans[topic];
  var ch=S.rt.channel(topic,{config:{broadcast:{self:false}}});
  setup(ch); ch.subscribe(); S.chans[topic]=ch; return ch;
}
function joinRoom(r){
  getChan('room:'+r.id,function(ch){
    ch.on('broadcast',{event:'msg'},inMsg);
    ch.on('broadcast',{event:'edit'},inEdit);
    ch.on('broadcast',{event:'del'},function(p){ if(p&&p.payload) delMsg(p.payload.room,p.payload.id); });
  });
}
function joinInbox(){
  getChan('inbox:'+S.me.id,function(ch){
    ch.on('broadcast',{event:'msg'},inMsg);
    ch.on('broadcast',{event:'read'},inRead);
    ch.on('broadcast',{event:'clear'},inClear);
    ch.on('broadcast',{event:'edit'},inEdit);
    ch.on('broadcast',{event:'del'},function(p){ if(p&&p.payload) delMsg(p.payload.room,p.payload.id); });
  });
}
function warm(topic){ if(S.chans[topic]||S.sendCh[topic]) return; var ch=S.rt.channel(topic,{config:{broadcast:{self:false}}}); ch.__ready=new Promise(function(res){ ch.subscribe(function(st){ if(st==='SUBSCRIBED') res(); }); }); S.sendCh[topic]=ch; }
function sendTo(topic,event,payload){
  if(S.chans[topic]&&!S.sendCh[topic]){ var jc=S.chans[topic]; try{ return Promise.resolve(jc.send({type:'broadcast',event:event,payload:payload})); }catch(e){} }
  var ch=S.sendCh[topic];
  if(!ch){ ch=S.rt.channel(topic,{config:{broadcast:{self:false}}}); ch.__ready=new Promise(function(res){ ch.subscribe(function(st){ if(st==='SUBSCRIBED') res(); }); }); S.sendCh[topic]=ch; }
  return ch.__ready.then(function(){ return ch.send({type:'broadcast',event:event,payload:payload}); });
}
function send(room,text){
  text=String(text||'').trim().slice(0,500); if(!text) return;
  var t=now(); if(t-S.lastSend<700) return; S.lastSend=t;
  var m={id:t.toString(36)+Math.random().toString(36).slice(2,8),room:room,from_id:S.me.id,from_name:S.me.name,from_g:S.me.g||'',text:text,ts:t};
  addMsg(m,true);
  enc(room,text).then(function(ct){
    var w=Object.assign({},m,{text:ct}); persist(w);
    if(isDm(room)) sendTo('inbox:'+peerOf(room),'msg',w).catch(function(){});
    else sendTo('room:'+room,'msg',w).catch(function(){});
  });
}
function removeMsg(room,id){
  delMsg(room,id); removeRow(id);
  var p={room:room,id:id};
  if(isDm(room)) sendTo('inbox:'+peerOf(room),'del',p).catch(function(){}); else sendTo('room:'+room,'del',p).catch(function(){});
}
function canDelete(m){ return m.from_id===S.me.id || S.me.staff; }

/* ---------- presence ---------- */
S.ls={}; S.lsAsk={}; S.dn={};
function upsertRow(row,ka){ return chatOp('put',{row:row},ka).catch(function(){}); }
function applyNames(map){ Object.keys(S.msgs).forEach(function(k){ S.msgs[k].forEach(function(m){ if(map[m.from_id]) m.from_name=map[m.from_id]; }); });
  Object.keys(S.dms).forEach(function(k){ var p=S.dms[k]&&S.dms[k].peer; if(p&&map[p]) S.dms[k].name=map[p]; }); scheduleRender(); }
function myFullName(){ var n=(S.me&&S.me.name)||''; return n; }
function lsPush(ka){ if(!S.me||!S.histOK) return; try{ var id='ls:'+S.me.id, row={id:id,room:id,from_id:S.me.id,from_name:'-',text:JSON.stringify({t:Date.now(),n:myFullName()}),created_at:new Date().toISOString()};
  if(S.genCol) row.expires_at=new Date(Date.now()+400*24*3600*1000).toISOString();
  upsertRow(row,ka); }catch(e){} }
function lsNeed(ids){ if(!S.histOK) return; var need=[]; ids.forEach(function(i){ if(i&&i!==(S.me&&S.me.id)&&need.indexOf(i)<0&&(!S.lsAsk[i]||Date.now()-S.lsAsk[i]>60000)) need.push(i); }); if(!need.length) return;
  need.forEach(function(i){ S.lsAsk[i]=Date.now(); });
  for(var p=0;p<need.length;p+=40) (function(part){
  chatOp('kv_get',{ids:part.map(function(i){ return 'ls:'+i; })}).then(function(j){ return (j&&j.rows)||[]; }).then(function(rows){
    var ch=0, nm={}; (rows||[]).forEach(function(x){ var id=String(x.id).slice(3), t=0, n=''; try{ var o=JSON.parse(x.text); t=o.t||0; n=o.n||''; }catch(e){ t=parseInt(x.text,10)||0; }
      if(t&&S.ls[id]!==t){ S.ls[id]=t; ch=1; } if(n&&n!=='Owner'&&n!=='Lecturer'&&n!=='TA'&&n!=='Admin'&&n!=='Student'&&S.dn[id]!==n){ S.dn[id]=n; if(!(S.dir&&S.dir[id])) nm[id]=n; } });
    var miss=part.filter(function(i){ return !S.ls[i]; }).slice(0,8);
    if(miss.length) chatOp('last_msg',{ids:miss}).then(function(j){ var tm=(j&&j.times)||{}; Object.keys(tm).forEach(function(k){ var t=new Date(tm[k]).getTime(); if(t&&!S.ls[k]){ S.ls[k]=t; scheduleRender(); } }); }).catch(function(){});
    if(Object.keys(nm).length) applyNames(nm); else if(ch) scheduleRender(); }).catch(function(){}); })(need.slice(p,p+40)); }
function lsLocal(){ try{ return JSON.parse(localStorage.getItem('ceChatLS')||'{}'); }catch(e){ return {}; } }
function stText(id){ if(S.online[id]) return 'Online'; var t=lsText(id); return t?t.charAt(0).toUpperCase()+t.slice(1):'Offline'; }
function lsText(id){ var t=Math.max(S.ls[id]||0,lsLocal()[id]||0); if(!t) return ''; var m=Math.floor((Date.now()-t)/60000);
  if(m<1) return 'last seen just now'; if(m<60) return 'last seen '+m+' min ago'; var h=Math.floor(m/60); if(h<24) return 'last seen '+h+' hr ago';
  var d=Math.floor(h/24); if(d<2) return 'last seen yesterday'; return 'last seen '+d+' days ago'; }
function setupPresence(){
  lsPush(); clearInterval(S.lsT); S.lsT=setInterval(function(){ if(document.visibilityState!=='hidden'){ lsPush(); S.lsAsk={}; scheduleRender(); } },60000);
  if(!S.lsBound){ S.lsBound=1; document.addEventListener('visibilitychange',function(){ if(document.visibilityState==='hidden') lsPush(true); }); window.addEventListener('pagehide',function(){ lsPush(true); }); }
  var ch=S.rt.channel('ce-lounge',{config:{presence:{key:S.me.id}}});
  S.lounge=ch;
  ch.on('presence',{event:'sync'},function(){
    var st=ch.presenceState(), o={};
    Object.keys(st).forEach(function(k){ var arr=st[k]; if(arr&&arr.length){ var m=arr[arr.length-1]; rememberName(k,m.name); o[k]={id:k,name:m.name||'Student',staff:!!m.staff,role:m.role||'',g:m.g||'',rooms:m.rooms||[]}; rememberGender(k,m.g); } });
    try{ Object.keys(S.online||{}).forEach(function(k){ if(!o[k]&&k!==S.me.id){ S.ls[k]=Date.now(); var q=lsLocal(); q[k]=S.ls[k]; localStorage.setItem('ceChatLS',JSON.stringify(q)); } }); }catch(e){}
    S.online=o; scheduleRender();
  });
  ch.subscribe(function(status){ if(status==='SUBSCRIBED'){ track(ch); } });
  S.pres=ch; S.chans['ce-lounge']=ch;
}
function track(ch){ try{ ch.track({id:S.me.id,name:S.me.name,staff:S.me.staff,role:S.me.role||'',g:S.me.g||'',rooms:S.rooms.map(function(r){return r.id;}),t:now()}); }catch(e){} }

/* ---------- icons ---------- */
var ICON_M='<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" fill="#cfe3ff"/><path d="M5 40 Q6 28 20 27 Q34 28 35 40Z" fill="#2f7dd1"/><rect x="17" y="22" width="6" height="7" rx="2" fill="#8a5a3b"/><circle cx="20" cy="17" r="9" fill="#8a5a3b"/><path d="M11 16 Q11 7 20 7 Q29 7 29 16 Q26 11 20 11 Q14 11 11 16Z" fill="#1d1512"/><circle cx="17" cy="18" r="1.1" fill="#1d1512"/><circle cx="23" cy="18" r="1.1" fill="#1d1512"/><path d="M17 21.5 Q20 24 23 21.5" stroke="#1d1512" stroke-width="1.1" fill="none" stroke-linecap="round"/></svg>';
var ICON_F='<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" fill="#ffd9e8"/><path d="M5 40 Q6 28 20 27 Q34 28 35 40Z" fill="#e0568a"/><rect x="17" y="22" width="6" height="7" rx="2" fill="#8a5a3b"/><circle cx="9" cy="10" r="4.6" fill="#1d1512"/><circle cx="31" cy="10" r="4.6" fill="#1d1512"/><circle cx="20" cy="17" r="9" fill="#8a5a3b"/><path d="M11 16 Q11 7 20 7 Q29 7 29 16 Q26 11 20 11 Q14 11 11 16Z" fill="#1d1512"/><circle cx="17" cy="18" r="1.1" fill="#1d1512"/><circle cx="23" cy="18" r="1.1" fill="#1d1512"/><path d="M17 21.5 Q20 24 23 21.5" stroke="#1d1512" stroke-width="1.1" fill="none" stroke-linecap="round"/><circle cx="14.5" cy="21" r="1.5" fill="#e98a7a" opacity=".5"/><circle cx="25.5" cy="21" r="1.5" fill="#e98a7a" opacity=".5"/></svg>';
function avatar(id,name,on,g,small){
  g=g||S.gen[id]||'';
  var cls='cc-av'+(on?' on':'')+(small?' sm':'');
  if(g==='Male') return '<span class="'+cls+'">'+ICON_M+'</span>';
  if(g==='Female') return '<span class="'+cls+'">'+ICON_F+'</span>';
  return '<span class="'+cls+'" style="background:'+colorFor(id)+'">'+esc((name||'?').charAt(0).toUpperCase())+'</span>';
}

/* ---------- UI ---------- */
function css(){
  if(document.getElementById('ceChatCss')) return;
  var st=document.createElement('style'); st.id='ceChatCss';
  st.textContent=
  '#ceChatBtn{position:fixed;right:16px;bottom:16px;z-index:9500;display:flex;align-items:center;gap:8px;padding:12px 18px;border:none;border-radius:999px;cursor:pointer;background:var(--accent,#3f7a32);color:#fff;font:600 .9rem "IBM Plex Sans",sans-serif;box-shadow:0 8px 22px rgba(0,0,0,.25);transition:transform .15s}'
 +'#ceChatBtn:hover{transform:translateY(-2px)}'
 +'#ceChatBtn{text-transform:none !important;letter-spacing:0 !important}'
 +'@media(max-width:700px){#whoBar{bottom:78px !important;max-width:calc(100vw - 24px) !important}}'
 +'html[data-theme="dark"] #ceChatBtn{color:#08161d}'
 +'#ceChatBtn .dot{width:9px;height:9px;border-radius:50%;background:#4ade80;box-shadow:0 0 0 3px rgba(74,222,128,.3)}'
 +'#ceChatBtn .bd{background:#f43f5e;color:#fff;border-radius:999px;font-size:.7rem;padding:1px 7px;min-width:18px;text-align:center}'
 +'#ceDock{position:fixed;right:16px;bottom:76px;z-index:9500;display:flex;flex-direction:row-reverse;align-items:flex-end;gap:12px;max-width:calc(100vw - 32px);pointer-events:none}'
 +'#ceDock>*{pointer-events:auto}'
 +'.cc-box{display:flex;flex-direction:column;width:340px;max-width:calc(100vw - 24px);background:var(--card,#fff);color:var(--ink,#111);border:1px solid var(--line,#ddd);border-radius:18px;box-shadow:0 24px 60px rgba(0,0,0,.28);overflow:hidden;font-family:"IBM Plex Sans",sans-serif}'
 +'#ceChatPanel{height:min(560px,76vh)}'
 +'.cc-win{flex:1;min-height:0;display:none;flex-direction:column}'
 +'.cc-lock{font-size:.68rem;text-align:center;padding:4px 8px;color:var(--muted,#5b6b73);opacity:.85}'
 +'.cc-home{display:flex;flex-direction:column;flex:1;min-height:0}'
 +'.cc-views{display:none;flex:1;min-height:0;flex-direction:column}'
 +'.cc-dc{align-items:center;gap:8px;padding:8px 12px;font-size:.74rem;background:rgba(244,63,94,.12);border-bottom:1px solid var(--line,#ddd)}.cc-dc span{flex:1}.cc-dc button{border:none !important;border-radius:999px !important;padding:5px 12px !important;font-size:.74rem !important;cursor:pointer;background:#f43f5e !important;color:#fff !important}.cc-dc button[data-a=dcno]{background:transparent !important;color:inherit !important;text-decoration:underline}'
 +'.cc-embed{position:static !important;width:100% !important;max-width:none !important;height:min(72vh,640px) !important;box-shadow:none !important;display:flex}.cc-embed [data-a=close]{display:none !important}'
 +'#ceToast{position:fixed;top:14px;left:50%;transform:translate(-50%,-140%);z-index:10000;display:flex;align-items:center;gap:10px;min-width:260px;max-width:min(92vw,420px);padding:10px 14px;border-radius:16px;background:var(--card,#fff);color:var(--ink,#111);border:1px solid var(--line,#ddd);box-shadow:0 14px 40px rgba(0,0,0,.28);cursor:pointer;transition:transform .35s cubic-bezier(.2,.9,.3,1.2);font:500 .85rem "IBM Plex Sans",sans-serif}'
 +'#ceToast.show{transform:translate(-50%,0)}'
 +'#ceToast .tt-tx{display:flex;flex-direction:column;min-width:0;flex:1}#ceToast b{font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#ceToast .tt-tx span{color:var(--muted,#666);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#ceToast .tt-x{opacity:.6;font-size:1.1rem;padding:0 4px}#ceToast .cc-av{width:34px;height:34px}'
 +'.cc-tabs{display:flex;gap:6px;padding:6px 8px;overflow-x:auto;border-bottom:1px solid var(--line,#ddd);flex:0 0 auto}'
 +'.cc-tab{flex:0 0 auto;display:flex;align-items:center;gap:6px;padding:4px 9px;border-radius:999px;background:rgba(120,160,120,.14);font-size:.74rem;cursor:pointer;max-width:150px;user-select:none}'
 +'.cc-tab.act{background:var(--accent,#3f7a32);color:#fff}html[data-theme="dark"] .cc-tab.act{color:#08161d}'
 +'.cc-tab .nm{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cc-tab .x{opacity:.75;padding:0 2px}.cc-tab .cc-av.sm{width:18px;height:18px}.cc-tab .cc-un{font-size:.6rem;padding:0 6px}'
 +'.cc-h{display:flex;align-items:center;gap:8px;padding:11px 12px;border-bottom:1px solid var(--line,#ddd);font-weight:700}'
 +'.cc-h .t{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
 +'.cc-h button{background:transparent !important;color:var(--ink,#111) !important;border:none !important;padding:2px 8px !important;font-size:1.1rem;line-height:1;cursor:pointer;box-shadow:none !important;transform:none !important}'
 +'.cc-b{flex:1;overflow-y:auto;padding:12px 14px}'
 +'.cc-sec{font:600 .68rem "IBM Plex Mono",monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--muted,#777);margin:12px 0 8px}'
 +'.cc-row{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:9px 10px;margin-bottom:6px;border:1px solid var(--line,#ddd);border-radius:12px;background:transparent !important;color:var(--ink,#111) !important;cursor:pointer;font:500 .9rem "IBM Plex Sans",sans-serif;box-shadow:none !important;transform:none !important}'
 +'.cc-row:hover{background:rgba(120,160,120,.12) !important}'
 +'.cc-row.act{border-color:var(--accent,#3f7a32)}'
 +'.cc-av{flex:0 0 auto;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:.85rem;position:relative}'
 +'.cc-av svg{width:100%;height:100%;border-radius:50%;display:block}'
 +'.cc-av.sm{width:26px;height:26px;font-size:.72rem}'
 +'.cc-av.on::after{content:"";position:absolute;right:-1px;bottom:-1px;width:10px;height:10px;border-radius:50%;background:#22c55e;border:2px solid var(--card,#fff)}'
 +'.cc-nm{flex:1;min-width:0;white-space:normal !important;overflow:hidden;line-height:1.2;font-size:.74rem !important;word-break:break-word;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}'
 +'.cc-tag{font-size:.65rem;padding:2px 7px;border-radius:999px;background:rgba(120,160,120,.18);color:var(--muted,#555)}'
 +'.cc-un{background:#f43f5e;color:#fff;border-radius:999px;font-size:.68rem;padding:1px 7px}'
 +'.cc-line{display:flex;gap:7px;align-items:flex-end;margin-bottom:9px;max-width:92%}'
 +'.cc-line.me{margin-left:auto;flex-direction:row-reverse}'
 +'.cc-msg{display:flex;flex-direction:column;min-width:0}'
 +'.cc-line.me .cc-msg{align-items:flex-end}'
 +'.cc-bub{padding:8px 12px;border-radius:14px;background:rgba(120,160,120,.16);word-break:break-word;white-space:pre-wrap;font-size:.9rem;line-height:1.4}'
 +'.cc-line.me .cc-bub{background:var(--accent,#3f7a32);color:#fff}'
 +'html[data-theme="dark"] .cc-line.me .cc-bub{color:#08161d}'
 +'.cc-meta{font-size:.68rem;color:var(--muted,#777);margin:0 4px 2px}'
 +'.cc-x{margin-left:6px;cursor:pointer;opacity:.6}'
 +'.cc-note{font-size:.74rem;color:var(--muted,#777);text-align:center;margin:6px 0 10px}'
 +'.cc-in{display:flex;gap:8px;padding:10px 12px;border-top:1px solid var(--line,#ddd)}'
 +'.cc-in textarea{flex:1;min-width:0;margin:0 !important;min-height:0 !important;height:42px;box-sizing:border-box !important;overflow-y:auto;padding:10px 14px !important;border-radius:18px !important;resize:none;font:400 16px/1.35 "IBM Plex Sans",sans-serif;max-height:110px;border:1px solid var(--line,#ddd);background:transparent;color:inherit}'
 +'.cc-in{align-items:flex-end}'
 +'.cc-box button{text-transform:none !important;letter-spacing:0 !important}'
 +'.cc-box{border-radius:20px;font-size:14px}'
 +'.cc-h{padding:12px 14px;font-size:.95rem;border-bottom:none;background:linear-gradient(135deg,var(--accent,#3f7a32),#1f5f8b);color:#fff}'
 +'.cc-h .t small{display:block;font-weight:500;font-size:.68rem;opacity:.9;line-height:1.1;margin-top:1px;white-space:nowrap}.cc-h .t{font-weight:700}.cc-h button{color:#fff !important;opacity:.9}'
 +'.cc-s{padding:10px 12px 6px;border-bottom:none}.cc-s input{background:rgba(120,160,120,.12) !important;border:1px solid transparent !important;font-size:14px !important;padding:9px 14px !important}.cc-s input:focus{border-color:var(--accent,#3f7a32) !important;outline:none}'
 +'.cc-b{padding:4px 8px 10px}'
 +'.cc-sec{font:600 .64rem "IBM Plex Mono",monospace !important;letter-spacing:.08em !important;text-transform:uppercase !important;margin:12px 6px 4px;opacity:.75}'
 +'.cc-row{border:none !important;margin:0 0 2px !important;padding:6px 8px !important;border-radius:12px !important;font-size:.78rem !important;font-weight:500 !important;gap:10px}'
 +'.cc-row.act{background:rgba(120,160,120,.18) !important}'
 +'.cc-av{width:32px;height:32px;font-size:.74rem}.cc-av.sm{width:24px;height:24px;font-size:.66rem}'
 +'.cc-tag{font-size:.62rem;padding:2px 8px}'
 +'.cc-note{font-size:.7rem;margin:4px 8px 6px}'
 +'.cc-bub{font-size:.8rem;padding:6px 10px}.cc-meta{font-size:.64rem}'
 +'.cc-win .cc-h .t{font-size:.9rem}.cc-un{font-size:.62rem}'
 +'.cc-wrap{white-space:normal !important;overflow:visible !important;line-height:1.25;text-transform:none}.cc-wrap b{display:block;font-size:.8rem;font-weight:600;word-break:break-word}.cc-wrap small{display:block;font-size:.72rem;color:var(--muted,#777);font-weight:400}'
 +'.cc-s{padding:8px 12px;border-bottom:1px solid var(--line,#ddd)}.cc-s input{width:100%;box-sizing:border-box;margin:0 !important;padding:9px 14px !important;border-radius:999px !important;font-size:16px !important}'
 +'.cc-eb{align-items:center;justify-content:space-between;padding:6px 12px;font-size:.78rem;background:rgba(245,158,11,.15);border-top:1px solid var(--line,#ddd)}'
 +'.cc-eb button{background:transparent !important;color:inherit !important;border:none !important;text-decoration:underline;padding:2px 6px !important;box-shadow:none !important;text-transform:none !important}'
 +'.cc-tk{margin-left:6px;font-size:.66rem;opacity:.8}.cc-tk.rd{color:#0ea5e9;opacity:1;font-weight:600}'
 +'.cc-in button{padding:10px 16px !important;border-radius:999px !important}'
 +'@media(max-width:560px){#ceDock{left:8px;right:8px;bottom:70px;max-width:none}.cc-box{width:100%;max-width:none}#ceChatPanel{height:var(--ccH,min(78vh,600px));max-height:92vh}}';
  document.head.appendChild(st);
}
function build(){
  css();
  var root=document.createElement('div'); root.id='ceChat';
  root.innerHTML='<button id="ceChatBtn" type="button" aria-label="Open chat"><span class="dot"></span><span>Chat</span><span id="ceChatCount" style="opacity:.9;font-weight:500"></span><span id="ceChatBd" class="bd" style="display:none"></span></button>'
   +'<div id="ceDock"><div id="ceChatPanel" class="cc-box" role="dialog" aria-label="Student chat" style="display:none"></div></div>';
  document.body.appendChild(root); S.root=root;
  document.getElementById('ceChatBtn').addEventListener('click',toggleHome);
}
function toggleHome(){
  S.open=!S.open; askNotify();
  if(S.open && S.cur){ S.unread[S.cur]=0; markSeen(S.cur); sendRead(S.cur); }
  scheduleRender(); render();
}
function scheduleRender(){ if(S.renderT) return; S.renderT=setTimeout(function(){ S.renderT=null; render(); },60); }
function totalUnread(){ var n=0; Object.keys(S.unread).forEach(function(k){ n+=S.unread[k]||0; }); return n; }

function render(){
  if(!S.root) return;
  var onl=Object.keys(S.online).length;
  var c=document.getElementById('ceChatCount'); if(c) c.textContent=onl?('· '+onl+' online'):'';
  var bd=document.getElementById('ceChatBd'); var u=totalUnread(); if(S.lastU!==u){ S.lastU=u; try{ if(!S.baseTitle) S.baseTitle=document.title.replace(/^\(\d+\+?\)\s*/,''); document.title=(u?'('+(u>99?'99+':u)+') ':'')+S.baseTitle; window.dispatchEvent(new CustomEvent('ce-chat-unread',{detail:u})); }catch(e){} } if(bd){ bd.style.display=u?'inline-block':'none'; bd.textContent=u>99?'99+':u; }
  var panel=document.getElementById('ceChatPanel');
  if(S.open){ panel.style.display='flex'; renderHome(panel); renderTabs(panel); renderWins(); } else panel.style.display='none';
}
function renderHome(p){
  var h='';
  if(S.sq.trim().length>=3){
    h+='<div class="cc-sec">Search results</div>';
    if(S.sr===null) h+='<div class="cc-note">Searching...</div>';
    else if(!S.sr.length) h+='<div class="cc-note">No student found with that name.</div>';
    else S.sr.forEach(function(x){ if(x.id===S.me.id) return; var on=!!S.online[x.id]; h+='<button class="cc-row" type="button" data-dm="'+esc(x.id)+'" data-nm="'+esc(x.name)+'" data-g="'+esc(x.gender||'')+'">'+avatar(x.id,x.name,on,x.gender)+'<span class="cc-nm cc-wrap"><b>'+esc(x.name)+'</b><small>'+(x.info?esc(x.info)+' · ':'')+(on?'Online now':(lsText(x.id)?esc(lsText(x.id))+' · leave a message':'Offline, leave a message'))+'</small></span></button>'; });
  }
  h+='<div class="cc-note">\ud83d\udd12 Chats are encrypted. Be kind and respectful. Messages are deleted after 24 hours.'+(S.histOK?'':' History is off, messages disappear when you close the page.')+'</div>';
  h+='<div class="cc-sec">Rooms</div>';
  S.rooms.forEach(function(r){ var u=S.unread[r.id]||0; h+='<button class="cc-row'+(winOpen(r.id)?' act':'')+'" type="button" data-room="'+esc(r.id)+'">'+avatar(r.id,r.kind==='course'?'#':'*',false,'x')+'<span class="cc-nm">'+esc(r.title)+'</span>'+(u?'<span class="cc-un">'+u+'</span>':'')+'</button>'; });
  var dmKeys=Object.keys(S.dms);
  if(dmKeys.length){ h+='<div class="cc-sec">Direct messages</div>'; dmKeys.forEach(function(k){ var d=S.dms[k]; var nm=d.name||nameOf(d.peer)||'Student'; var u=S.unread[k]||0; h+='<button class="cc-row'+(winOpen(k)?' act':'')+'" type="button" data-room="'+esc(k)+'">'+avatar(d.peer,nm,!!S.online[d.peer])+'<span class="cc-nm cc-wrap"><b>'+esc(nm)+'</b><small>'+(S.online[d.peer]?'&#9679; Online':esc(stText(d.peer)))+'</small></span>'+(u?'<span class="cc-un">'+u+'</span>':'')+'</button>'; }); lsNeed(dmKeys.map(function(k){ return S.dms[k].peer; })); }
  var ids=Object.keys(S.online);
  h+='<div class="cc-sec">Online now ('+ids.length+')</div>';
  var mine={}; S.rooms.forEach(function(r){ mine[r.id]=1; });
  ids.sort(function(a,b){ return S.online[a].name.localeCompare(S.online[b].name); }).forEach(function(id){
    var o=S.online[id], me=id===S.me.id;
    var same=(o.rooms||[]).some(function(r){ return r!=='everyone'&&mine[r]; });
    h+='<button class="cc-row" type="button" '+(me?'disabled style="opacity:.7;cursor:default"':'data-dm="'+esc(id)+'" data-nm="'+esc(o.name)+'"')+'>'+avatar(id,o.name,true,o.g)+'<span class="cc-nm">'+esc(o.name)+(me?' (you)':'')+'</span>'+(o.staff||o.role?'<span class="cc-tag">'+esc(o.role||'Lecturer')+'</span>':(same&&!me?'<span class="cc-tag">Same course</span>':''))+'</button>';
  });
  if(ids.length<=1) h+='<div class="cc-note">No one else is online right now.</div>';
  if(!p.__sk){
    p.innerHTML='<div class="cc-h"><span class="t">Student chat</span><button type="button" data-a="delchat" title="Delete this chat" aria-label="Delete this chat" style="display:none">&#128465;</button><button type="button" data-a="myname" title="Change my chat name" aria-label="Change my chat name" style="display:none">&#9998;</button><button type="button" data-a="mute" aria-label="Sound on or off"></button><button type="button" data-a="close" aria-label="Close">&times;</button></div><div class="cc-tabs" style="display:none"></div><div class="cc-dc" style="display:none"><span>Delete this chat? Everything you sent is removed for both of you, with no trace.</span><button type="button" data-a="dcyes">Delete</button><button type="button" data-a="dcno">Cancel</button></div><div class="cc-home"><div class="cc-s"><input id="ceSearch" type="search" placeholder="Search any student by name..." autocomplete="off"></div><div class="cc-b"></div></div><div class="cc-views"></div>';
    p.querySelector('.cc-tabs').addEventListener('click',function(e){ var x=e.target.closest('[data-tclose]'); if(x){ closeWin(x.getAttribute('data-tclose')); return; } var t=e.target.closest('[data-tab]'); if(!t) return; var r=t.getAttribute('data-tab'); if(r==='home'){ S.cur=null; render(); } else openRoom(r); });
    p.__sk=1;
    p.querySelector('[data-a=close]').onclick=toggleHome;
    p.querySelector('[data-a=delchat]').onclick=function(){ S.confirmDel=S.cur; render(); };
    p.querySelector('[data-a=dcno]').onclick=function(){ S.confirmDel=null; render(); };
    p.querySelector('[data-a=dcyes]').onclick=function(){ if(S.confirmDel) deleteChat(S.confirmDel); };
    p.querySelector('[data-a=myname]').onclick=function(){
      if(!S.me||S.me.id!==ownerId()) return;
      var v=prompt('Your chat name (what everyone sees). Leave empty to use your full name:',S.me.name||'');
      if(v===null) return; v=v.trim().slice(0,60);
      chatOp('owner_name_set',{name:v}).then(function(j){
        if(!j||!j.ok){ alert('Could not change the name: '+((j&&j.error)||'try again')); return; }
        S.me.name=j.name; S.dir=S.dir||{}; S.dir[ownerId()]=j.name; var m={}; m[ownerId()]=j.name; applyNames(m);
        try{ if(S.lounge) track(S.lounge); }catch(e){} lsPush(); scheduleRender();
      }).catch(function(){ alert('Could not change the name. Please try again.'); });
    };
    p.querySelector('[data-a=mute]').onclick=function(){ S.mute=!S.mute; try{ localStorage.setItem('ceChatMute',S.mute?'1':'0'); }catch(e){} render(); };
    p.querySelector('#ceSearch').addEventListener('input',function(e){ doSearch(e.target.value); });
  }
  p.querySelector('[data-a=delchat]').style.display=(S.cur&&isDm(S.cur))?'':'none';
  p.querySelector('.cc-dc').style.display=(S.confirmDel&&S.confirmDel===S.cur)?'flex':'none';
  p.querySelector('[data-a=mute]').innerHTML=S.mute?'&#128263;':'&#128276;';
  p.querySelector('.cc-home').style.display=S.cur?'none':'flex'; p.querySelector('.cc-views').style.display=S.cur?'flex':'none';
  try{ var mb=p.querySelector('[data-a=myname]'); if(mb) mb.style.display=(S.me&&S.me.id===ownerId())?'':'none'; }catch(e){}
  var tt=p.querySelector('.cc-h .t'), peer=S.cur&&isDm(S.cur)&&S.dms[S.cur]?S.dms[S.cur].peer:'';
  if(peer){ lsNeed([peer]); var html=esc(roomTitle(S.cur))+'<small style="'+(S.online[peer]?'color:#7CFFB0':'')+'">'+(S.online[peer]?'&#9679; ':'')+esc(stText(peer))+'</small>'; if(tt.getAttribute('data-h')!==html){ tt.innerHTML=html; tt.setAttribute('data-h',html); } }
  else { var tx=S.cur?roomTitle(S.cur):'Student chat'; if(tt.getAttribute('data-h')!==tx){ tt.textContent=tx; tt.setAttribute('data-h',tx); } }
  var nb=p.querySelector('.cc-home .cc-b'), st=nb.scrollTop; nb.innerHTML=h; nb.scrollTop=st;
  p.querySelectorAll('.cc-home [data-room]').forEach(function(b){ b.onclick=function(){ openRoom(b.getAttribute('data-room')); }; });
  p.querySelectorAll('[data-dm]').forEach(function(b){ b.onclick=function(){ var id=b.getAttribute('data-dm'); rememberGender(id,b.getAttribute('data-g')); rememberName(id,b.getAttribute('data-nm')); var rm=dmRoom(S.me.id,id); S.dms[rm]=S.dms[rm]||{peer:id,name:b.getAttribute('data-nm')}; if(!S.dms[rm].name) S.dms[rm].name=b.getAttribute('data-nm'); S.dms[rm].keep=true; openRoom(rm); }; });
}
function doSearch(q){
  S.sq=q; clearTimeout(S.sT);
  if(q.trim().length<3){ S.sr=null; scheduleRender(); return; }
  S.sr=null; scheduleRender();
  S.sT=setTimeout(function(){
    var words=q.trim().split(/\s+/).map(function(w){return w.replace(/[^A-Za-z0-9'.\-]/g,'');}).filter(Boolean).slice(0,3);
    if(!words.length){ S.sr=[]; scheduleRender(); return; }
    var src=apiCall({action:'stu_search',q:q}).then(function(j){ return (j&&j.ok&&j.rows)?j.rows:[]; });
    src.then(function(rows){
      if(S.sq!==q) return;
      lsNeed(rows.map(function(x){ return x.id; }));
      S.sr=rows.map(function(x){ return {id:x.id,name:String(x.name).trim().replace(/\s+/g,' '),gender:x.gender||'',info:[x.level?('Level '+String(x.level).replace(/^level\s*/i,'')):'',x.department||''].filter(Boolean).join(' \u00b7 ')}; });
      scheduleRender();
    }).catch(function(){ if(S.sq===q){ S.sr=[]; scheduleRender(); } });
  },350);
}
function roomTitle(room){
  if(isDm(room)){ var d=S.dms[room]||{}; return d.name||nameOf(d.peer)||'Direct message'; }
  var r=S.rooms.filter(function(x){return x.id===room;})[0]; return r?r.title:'Chat';
}

/* ----- conversation windows (several can be open side by side) ----- */
function winEl(room){ return document.getElementById('ceWin-'+hash(room)); }
function openRoom(room){
  if(!S.wins.some(function(x){return x.room===room;})) S.wins.push({room:room});
  while(S.wins.length>8){ var old=S.wins.filter(function(x){return x.room!==room;})[0]; closeWin(old.room,true); }
  S.cur=room; S.open=true; askNotify();
  if(isDm(room)) warm('inbox:'+peerOf(room));
  S.unread[room]=0; markSeen(room);
  render();
  var el2=winEl(room); if(el2){ var inp=el2.querySelector('textarea'); if(inp && !isMobile()) inp.focus(); }
  loadHistory(room).then(function(){ renderWins(); sendRead(room); });
}
function closeWin(room,quiet){
  S.wins=S.wins.filter(function(x){return x.room!==room;});
  var el=winEl(room); if(el&&el.parentNode) el.parentNode.removeChild(el);
  if(S.cur===room) S.cur=null;
  if(!quiet) render();
}
function renderTabs(p){
  var t=p.querySelector('.cc-tabs'); if(!t) return;
  if(!S.wins.length){ t.style.display='none'; t.innerHTML=''; t.__h=''; return; }
  t.style.display='flex';
  var h='<div class="cc-tab'+(S.cur?'':' act')+'" data-tab="home" title="All chats"><span class="nm">&#9776; Chats</span></div>';
  S.wins.forEach(function(w){
    var d=S.dms[w.room]||{}, u=S.unread[w.room]||0, nm=roomTitle(w.room);
    h+='<div class="cc-tab'+(S.cur===w.room?' act':'')+'" data-tab="'+esc(w.room)+'">'+(isDm(w.room)?avatar(d.peer,nm,!!S.online[d.peer],'',true):'')+'<span class="nm">'+esc(nm)+'</span>'+(u?'<span class="cc-un">'+u+'</span>':'')+'<span class="x" data-tclose="'+esc(w.room)+'" title="Close">&times;</span></div>';
  });
  if(t.__h!==h){ t.innerHTML=h; t.__h=h; }
}
function ensureWin(room){
  var el=winEl(room); if(el) return el;
  el=document.createElement('div'); el.id='ceWin-'+hash(room); el.className='cc-win';
  el.innerHTML='<div class="cc-b" style="display:flex;flex-direction:column"></div>'
   +'<div class="cc-eb" style="display:none"><span>Editing message</span><button type="button" data-a="ecancel">Cancel</button></div>'
   +'<div class="cc-lock">\ud83d\udd12 '+(isDm(room)?'Private chat':'Encrypted room')+' \u00b7 messages disappear after 24 hours</div>'
   +'<div class="cc-in"><textarea rows="1" maxlength="500" placeholder="Type a message..." autocomplete="off" enterkeyhint="send"></textarea><button type="button">Send</button></div>';
  var inp=el.querySelector('textarea'), grow=function(){ inp.style.height='auto'; inp.style.height=Math.min(inp.scrollHeight,110)+'px'; }, stopEdit=function(){ el.__edit=null; el.querySelector('.cc-eb').style.display='none'; inp.value=''; grow(); }, go=function(){ var v=inp.value; if(!v.trim()) return; if(el.__edit){ editMsg(room,el.__edit,v); stopEdit(); } else send(room,v); inp.value=''; grow(); inp.focus(); };
  el.querySelector('[data-a=ecancel]').onclick=stopEdit;
  inp.addEventListener('input',function(){ grow(); var b=el.querySelector('.cc-b'); b.scrollTop=b.scrollHeight; });
  el.querySelector('.cc-in button').onclick=go;
  inp.onkeydown=function(e){ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); go(); } else if(e.key==='Escape'&&el.__edit){ stopEdit(); } };
  el.querySelector('.cc-b').addEventListener('click',function(e){ var x=e.target.closest('[data-del]'); if(x){ removeMsg(room,x.getAttribute('data-del')); return; } var ed=e.target.closest('[data-edit]'); if(ed){ var id=ed.getAttribute('data-edit'), m=(S.msgs[room]||[]).filter(function(q){return q.id===id;})[0]; if(!m) return; el.__edit=id; inp.value=m.text; el.querySelector('.cc-eb').style.display='flex'; grow(); inp.focus(); } });
  inp.addEventListener('focus',function(){ if(S.unread[room]){ S.unread[room]=0; scheduleRender(); } markSeen(room); sendRead(room); setTimeout(fitKeyboard,300); });
  return el;
}
function renderWins(){
  var host=document.querySelector('#ceChatPanel .cc-views'); if(!host) return;
  S.wins.forEach(function(w){
    var el=ensureWin(w.room);
    if(el.parentNode!==host) host.appendChild(el);
    if(S.cur!==w.room){ el.style.display='none'; var bb=el.querySelector('.cc-b'); if(bb) bb.removeAttribute('data-init'); return; }
    el.style.display='flex';
    var isDmRoom=isDm(w.room), d=S.dms[w.room]||{};
    var b=el.querySelector('.cc-b'), near=(b.scrollHeight-b.scrollTop-b.clientHeight)<80;
    var list=S.msgs[w.room]||[], h='';
    if(isDmRoom){ e2Ready(); e2Peer(d.peer); h+=S.pk[d.peer]?'<div class="cc-note">&#128274; End-to-end encrypted. Only you and this person can read these messages.</div>':'<div class="cc-note">&#128275; Not end-to-end encrypted yet. It turns on once this person opens the updated chat.</div>'; }
    if(isDmRoom&&!S.online[d.peer]) h+='<div class="cc-note">'+esc(roomTitle(w.room))+' is offline'+(lsText(d.peer)?' ('+esc(lsText(d.peer))+')':'')+'. Your message is saved and delivered when they sign in.</div>'; if(isDmRoom&&!S.online[d.peer]) lsNeed([d.peer]);
    if(!list.length) h+='<div class="cc-note">No messages yet. Say hello.</div>';
    list.forEach(function(m){
      var me=m.from_id===S.me.id;
      h+='<div class="cc-line'+(me?' me':'')+'">'+(me?'':avatar(m.from_id,m.from_name,false,m.from_g,true))+'<div class="cc-msg"><div class="cc-meta">'+(me?'':esc(m.from_name)+' &middot; ')+esc(fmtTime(m.ts))+(me&&isDmRoom?(m.ts<=(S.readAt[w.room]||0)?'<span class="cc-tk rd">&#10003;&#10003; Read</span>':'<span class="cc-tk">&#10003; Sent</span>'):'')+(m.edited?'<span class="cc-tk">(edited)</span>':'')+(me?'<span class="cc-x" data-edit="'+esc(m.id)+'" title="Edit">&#9998;</span>':'')+(canDelete(m)?'<span class="cc-x" data-del="'+esc(m.id)+'" title="Delete">&times;</span>':'')+'</div><div class="cc-bub">'+esc(m.text)+'</div></div></div>';
    });
    var key=list.length+':'+(list.length?list[list.length-1].id:'')+':'+Object.keys(S.gen).length+':'+(S.readAt[w.room]||0)+':'+(S.online[d.peer]?1:0)+':'+list.reduce(function(a,m){return a+m.text.length;},0);
    if(b.getAttribute('data-k')!==key||!b.getAttribute('data-init')){ b.innerHTML=h; b.setAttribute('data-k',key); if(near||!b.getAttribute('data-init')){ b.scrollTop=b.scrollHeight; b.setAttribute('data-init','1'); } }
  });
}

/* ---------- lifecycle ---------- */
function start(me){
  var lib=window.supabase; if(!lib||!lib.createClient) return;
  S.me=me; S.rooms=myRooms(); rememberGender(me.id,me.g);
  try{ S.rt=lib.createClient(G('SUPABASE_URL'),G('SUPABASE_KEY'),{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},realtime:{params:{eventsPerSecond:10}}}); }catch(e){ return; }
  build(); S.rooms.forEach(joinRoom); joinInbox(); setupPresence(); loadDir(); loadDmList(); e2Ready(); purgeOld(); S.started=true; pushSub(); render(); if(S.wantEmbed) embed(S.wantEmbed);
}
function stop(){
  try{ Object.keys(S.chans).forEach(function(k){ S.rt.removeChannel(S.chans[k]); }); Object.keys(S.sendCh).forEach(function(k){ S.rt.removeChannel(S.sendCh[k]); }); }catch(e){}
  if(S.root&&S.root.parentNode) S.root.parentNode.removeChild(S.root);
  S.e2p=null; S.e2k={}; S.pk={}; S.e2pubSent=''; S.rt=null; S.me=null; S.chans={}; S.sendCh={}; S.msgs={}; S.unread={}; S.online={}; S.dms={}; S.gen={}; S.loaded={}; S.wins=[]; S.cur=null; S.embed=null; S.confirmDel=null; S.open=false; S.root=null; S.started=false;
}
var _lastPurge=0;
function tick(){
  var me=identity()||portalIdentity();
  if(!me){ if(S.started) stop(); return; }
  if(!S.started){ start(me); return; }
  if(S.me.id!==me.id){ stop(); start(me); return; }
  if(S.me.g!==me.g){ S.me.g=me.g; rememberGender(me.id,me.g); if(S.pres) track(S.pres); scheduleRender(); }
  pruneLocal(); if(Date.now()-_lastPurge>30*60*1000){ _lastPurge=Date.now(); purgeOld(); }
  var rooms=myRooms();
  if(rooms.length!==S.rooms.length){ var have={}; S.rooms.forEach(function(r){have[r.id]=1;}); rooms.forEach(function(r){ if(!have[r.id]) joinRoom(r); }); S.rooms=rooms; if(S.pres) track(S.pres); scheduleRender(); }
}
function fitKeyboard(){
  var dock=document.getElementById('ceDock'); if(!dock) return;
  var vv=window.visualViewport;
  if(!isMobile()||!vv){ dock.style.bottom=''; dock.style.setProperty('--ccH',''); return; }
  var kb=Math.max(0,window.innerHeight-vv.height-vv.offsetTop);
  if(kb>80){ dock.style.bottom=(kb+8)+'px'; dock.style.setProperty('--ccH',(vv.height-16)+'px'); }
  else { dock.style.bottom=''; dock.style.setProperty('--ccH',''); }
  dock.querySelectorAll('.cc-win .cc-b').forEach(function(b){ b.scrollTop=b.scrollHeight; });
}
if(window.visualViewport){ visualViewport.addEventListener('resize',fitKeyboard); visualViewport.addEventListener('scroll',fitKeyboard); }
window.addEventListener('resize',function(){ fitKeyboard(); if(S.started) scheduleRender(); });
function embed(host){
  if(!host) return; S.wantEmbed=host;
  if(!S.started) return;
  var panel=document.getElementById('ceChatPanel'); if(!panel) return;
  Array.prototype.forEach.call(host.querySelectorAll('.cc-ph'),function(e){ e.style.display='none'; });
  host.appendChild(panel); panel.classList.add('cc-embed'); S.embed=host;
  var b=document.getElementById('ceChatBtn'); if(b) b.style.display='none';
  S.open=true; render();
}
function unembed(){
  S.wantEmbed=null;
  if(!S.embed) return; S.embed=null;
  var panel=document.getElementById('ceChatPanel'), dock=document.getElementById('ceDock');
  if(panel&&dock){ dock.appendChild(panel); panel.classList.remove('cc-embed'); }
  var b=document.getElementById('ceChatBtn'); if(b) b.style.display='';
  S.open=false; render();
}
window.ChatUI={tick:tick,stop:stop,embed:embed,unembed:unembed,_state:S};
setInterval(tick,1500);
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',tick); else setTimeout(tick,300);
})();
