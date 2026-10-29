/* Student chat: online list, rooms (Everyone + own courses) and direct messages.
   Uses Supabase Realtime (presence + broadcast) on the data project. Message history is
   kept in the chat_messages table if it exists; if not, chat still works live. */
(function(){
'use strict';
if(window.ChatUI) return;

var S={ rt:null, me:null, pres:null, chans:{}, sendCh:{}, msgs:{}, unread:{}, online:{}, dms:{}, open:false, cur:null,
        histOK:true, loaded:{}, lastSend:0, rooms:[], root:null, started:false, renderT:null };

function G(expr){ try{ return (0,eval)(expr); }catch(e){ return undefined; } }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function hash(s){ var h=5381; s=String(s); for(var i=0;i<s.length;i++){ h=((h<<5)+h+s.charCodeAt(i))|0; } return (h>>>0).toString(36); }
function slug(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
function baseCourse(n){ var s=String(n||'').trim(); var m=s.match(/^(.*\d)\s*[-_\/]?\s*\(?\s*(?:group|grp|class|section|sec)?\s*[A-Za-z]\s*\)?$/i); return m?m[1].trim():s; }
function shortName(n){ var t=String(n||'').trim().split(/\s+/).filter(Boolean); if(!t.length) return 'Student'; if(t.length===1) return t[0]; return t[0]+' '+t[t.length-1].charAt(0).toUpperCase()+'.'; }
function colorFor(id){ var cols=['#0ea5e9','#22c55e','#8b5cf6','#f43f5e','#f59e0b','#14b8a6','#ec4899','#6366f1']; var n=0; for(var i=0;i<id.length;i++) n+=id.charCodeAt(i); return cols[n%cols.length]; }
function now(){ return Date.now(); }
var TTL=24*60*60*1000;
function cutoffIso(){ return new Date(Date.now()-TTL).toISOString(); }
function fmtTime(ts){ try{ return new Date(ts).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}); }catch(e){ return ''; } }

function identity(){
  var a=G('typeof studentCurrentAccount!=="undefined"?studentCurrentAccount:null');
  var em=G('typeof studentCurrentEmail!=="undefined"?studentCurrentEmail:null');
  var adm=!!G('typeof isAdminUser==="function"&&isAdminUser()');
  if(!em) return null;
  if(a && a.indexNumber) return { id:'s'+hash(String(em).toLowerCase()), name:shortName(a.name), staff:adm };
  if(adm) return { id:'s'+hash(String(em).toLowerCase()), name:'Lecturer', staff:true };
  return null;
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

/* ---------- storage (history) ---------- */
function hdr(){ var k=G('SUPABASE_KEY'); return {apikey:k,Authorization:'Bearer '+k,'Content-Type':'application/json'}; }
function tUrl(){ return G('SUPABASE_URL')+'/rest/v1/chat_messages'; }
function persist(m){
  if(!S.histOK) return;
  fetch(tUrl(),{method:'POST',headers:Object.assign(hdr(),{Prefer:'return=minimal'}),body:JSON.stringify({id:m.id,room:m.room,from_id:m.from_id,from_name:m.from_name,text:m.text,created_at:new Date(m.ts).toISOString()})})
   .then(function(r){ if(!r.ok && (r.status===404||r.status===400)){ S.histOK=false; scheduleRender(); } }).catch(function(){});
}
function loadHistory(room){
  if(S.loaded[room]||!S.histOK) return Promise.resolve();
  S.loaded[room]=1;
  return fetch(tUrl()+'?select=*&room=eq.'+encodeURIComponent(room)+'&created_at=gte.'+encodeURIComponent(cutoffIso())+'&order=created_at.desc&limit=60',{headers:hdr(),cache:'no-store'})
   .then(function(r){ if(!r.ok){ if(r.status===404||r.status===400) S.histOK=false; throw new Error('x'); } return r.json(); })
   .then(function(rows){ rows.reverse().forEach(function(x){ if(new Date(x.created_at).getTime()<Date.now()-TTL) return; addMsg({id:x.id,room:x.room,from_id:x.from_id,from_name:x.from_name,text:x.text,ts:new Date(x.created_at).getTime()},true); }); })
   .catch(function(){});
}
function loadDmList(){
  if(!S.histOK) return;
  fetch(tUrl()+'?select=room,from_id,from_name,created_at&room=like.'+encodeURIComponent('dm:*'+S.me.id+'*')+'&created_at=gte.'+encodeURIComponent(cutoffIso())+'&order=created_at.desc&limit=200',{headers:hdr(),cache:'no-store'})
   .then(function(r){ if(!r.ok) throw new Error('x'); return r.json(); })
   .then(function(rows){ rows.forEach(function(x){ var peer=peerOf(x.room); if(!S.dms[x.room]) S.dms[x.room]={peer:peer,name:''}; if(x.from_id!==S.me.id && x.from_name) S.dms[x.room].name=x.from_name; }); scheduleRender(); })
   .catch(function(){});
}
function purgeOld(){
  if(!S.histOK) return;
  fetch(tUrl()+'?created_at=lt.'+encodeURIComponent(cutoffIso()),{method:'DELETE',headers:Object.assign(hdr(),{Prefer:'return=minimal'})}).catch(function(){});
}
function pruneLocal(){
  var cut=Date.now()-TTL, changed=false;
  Object.keys(S.msgs).forEach(function(r){ var l=S.msgs[r], n=l.filter(function(m){return m.ts>=cut;}); if(n.length!==l.length){ S.msgs[r]=n; changed=true; } });
  Object.keys(S.dms).forEach(function(r){ if(!(S.msgs[r]&&S.msgs[r].length) && S.cur!==r && !S.dms[r].keep){ delete S.dms[r]; changed=true; } });
  if(changed) scheduleRender();
}
function removeRow(id){ if(!S.histOK) return; fetch(tUrl()+'?id=eq.'+encodeURIComponent(id),{method:'DELETE',headers:hdr()}).catch(function(){}); }

/* ---------- messages ---------- */
function addMsg(m,silent){
  var list=S.msgs[m.room]||(S.msgs[m.room]=[]);
  if(list.some(function(x){return x.id===m.id;})) return false;
  list.push(m); list.sort(function(a,b){return a.ts-b.ts;});
  if(isDm(m.room)){ var d=S.dms[m.room]||(S.dms[m.room]={peer:peerOf(m.room),name:''}); if(m.from_id!==S.me.id && m.from_name) d.name=m.from_name; }
  if(!silent && m.from_id!==S.me.id && !(S.open && S.cur===m.room)){ S.unread[m.room]=(S.unread[m.room]||0)+1; }
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
    ch.on('broadcast',{event:'msg'},function(p){ if(p&&p.payload) addMsg(p.payload); });
    ch.on('broadcast',{event:'del'},function(p){ if(p&&p.payload) delMsg(p.payload.room,p.payload.id); });
  });
}
function joinInbox(){
  getChan('inbox:'+S.me.id,function(ch){
    ch.on('broadcast',{event:'msg'},function(p){ if(p&&p.payload) addMsg(p.payload); });
    ch.on('broadcast',{event:'del'},function(p){ if(p&&p.payload) delMsg(p.payload.room,p.payload.id); });
  });
}
function sendTo(topic,event,payload){
  var ch=S.sendCh[topic];
  if(!ch){ ch=S.rt.channel(topic,{config:{broadcast:{self:false}}}); ch.__ready=new Promise(function(res){ ch.subscribe(function(st){ if(st==='SUBSCRIBED') res(); }); }); S.sendCh[topic]=ch; }
  return ch.__ready.then(function(){ return ch.send({type:'broadcast',event:event,payload:payload}); });
}
function send(room,text){
  text=String(text||'').trim().slice(0,500); if(!text) return;
  var t=now(); if(t-S.lastSend<700) return; S.lastSend=t;
  var m={id:t.toString(36)+Math.random().toString(36).slice(2,8),room:room,from_id:S.me.id,from_name:S.me.name,text:text,ts:t};
  addMsg(m,true); persist(m);
  if(isDm(room)) sendTo('inbox:'+peerOf(room),'msg',m).catch(function(){});
  else sendTo('room:'+room,'msg',m).catch(function(){});
}
function removeMsg(room,id){
  delMsg(room,id); removeRow(id);
  var p={room:room,id:id};
  if(isDm(room)) sendTo('inbox:'+peerOf(room),'del',p).catch(function(){}); else sendTo('room:'+room,'del',p).catch(function(){});
}
function canDelete(m){ return m.from_id===S.me.id || S.me.staff; }

/* ---------- presence ---------- */
function setupPresence(){
  var ch=S.rt.channel('ce-lounge',{config:{presence:{key:S.me.id}}});
  ch.on('presence',{event:'sync'},function(){
    var st=ch.presenceState(), o={};
    Object.keys(st).forEach(function(k){ var arr=st[k]; if(arr&&arr.length){ var m=arr[arr.length-1]; o[k]={id:k,name:m.name||'Student',staff:!!m.staff,rooms:m.rooms||[]}; } });
    S.online=o; scheduleRender();
  });
  ch.subscribe(function(status){ if(status==='SUBSCRIBED'){ track(ch); } });
  S.pres=ch; S.chans['ce-lounge']=ch;
}
function track(ch){ try{ ch.track({id:S.me.id,name:S.me.name,staff:S.me.staff,rooms:S.rooms.map(function(r){return r.id;}),t:now()}); }catch(e){} }

/* ---------- UI ---------- */
function css(){
  if(document.getElementById('ceChatCss')) return;
  var st=document.createElement('style'); st.id='ceChatCss';
  st.textContent=
  '#ceChatBtn{position:fixed;right:16px;bottom:16px;z-index:9500;display:flex;align-items:center;gap:8px;padding:12px 18px;border:none;border-radius:999px;cursor:pointer;background:var(--accent,#3f7a32);color:#fff;font:600 .9rem "IBM Plex Sans",sans-serif;box-shadow:0 8px 22px rgba(0,0,0,.25);transition:transform .15s}'
 +'#ceChatBtn:hover{transform:translateY(-2px)}'
 +'html[data-theme="dark"] #ceChatBtn{color:#08161d}'
 +'#ceChatBtn .dot{width:9px;height:9px;border-radius:50%;background:#4ade80;box-shadow:0 0 0 3px rgba(74,222,128,.3)}'
 +'#ceChatBtn .bd{background:#f43f5e;color:#fff;border-radius:999px;font-size:.7rem;padding:1px 7px;min-width:18px;text-align:center}'
 +'#ceChatPanel{position:fixed;right:16px;bottom:76px;z-index:9500;width:370px;max-width:calc(100vw - 24px);height:min(580px,78vh);display:none;flex-direction:column;background:var(--card,#fff);color:var(--ink,#111);border:1px solid var(--line,#ddd);border-radius:20px;box-shadow:0 24px 60px rgba(0,0,0,.3);overflow:hidden;font-family:"IBM Plex Sans",sans-serif}'
 +'#ceChatPanel.open{display:flex}'
 +'.cc-h{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--line,#ddd);font-weight:700}'
 +'.cc-h .t{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
 +'.cc-h button{background:transparent !important;color:var(--ink,#111) !important;border:none !important;padding:4px 8px !important;font-size:1.1rem;cursor:pointer;box-shadow:none !important;transform:none !important}'
 +'.cc-b{flex:1;overflow-y:auto;padding:12px 14px}'
 +'.cc-sec{font:600 .68rem "IBM Plex Mono",monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--muted,#777);margin:12px 0 8px}'
 +'.cc-row{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:9px 10px;margin-bottom:6px;border:1px solid var(--line,#ddd);border-radius:12px;background:transparent !important;color:var(--ink,#111) !important;cursor:pointer;font:500 .9rem "IBM Plex Sans",sans-serif;box-shadow:none !important;transform:none !important}'
 +'.cc-row:hover{background:rgba(120,160,120,.12) !important}'
 +'.cc-av{flex:0 0 auto;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:.85rem;position:relative}'
 +'.cc-av.on::after{content:"";position:absolute;right:-1px;bottom:-1px;width:10px;height:10px;border-radius:50%;background:#22c55e;border:2px solid var(--card,#fff)}'
 +'.cc-nm{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
 +'.cc-tag{font-size:.65rem;padding:2px 7px;border-radius:999px;background:rgba(120,160,120,.18);color:var(--muted,#555)}'
 +'.cc-un{background:#f43f5e;color:#fff;border-radius:999px;font-size:.68rem;padding:1px 7px}'
 +'.cc-msg{display:flex;flex-direction:column;margin-bottom:9px;max-width:86%}'
 +'.cc-msg.me{align-self:flex-end;align-items:flex-end;margin-left:auto}'
 +'.cc-bub{padding:8px 12px;border-radius:14px;background:rgba(120,160,120,.16);word-break:break-word;white-space:pre-wrap;font-size:.9rem;line-height:1.4}'
 +'.cc-msg.me .cc-bub{background:var(--accent,#3f7a32);color:#fff}'
 +'html[data-theme="dark"] .cc-msg.me .cc-bub{color:#08161d}'
 +'.cc-meta{font-size:.68rem;color:var(--muted,#777);margin:0 4px 2px}'
 +'.cc-x{margin-left:6px;cursor:pointer;opacity:.6}'
 +'.cc-note{font-size:.74rem;color:var(--muted,#777);text-align:center;margin:6px 0 10px}'
 +'.cc-in{display:flex;gap:8px;padding:10px 12px;border-top:1px solid var(--line,#ddd)}'
 +'.cc-in input{flex:1;margin:0 !important;padding:10px 12px !important;border-radius:999px !important}'
 +'.cc-in button{padding:10px 16px !important;border-radius:999px !important}'
 +'@media(max-width:560px){#ceChatPanel{right:8px;left:8px;bottom:70px;width:auto;max-width:none;height:min(78vh,600px)}}';
  document.head.appendChild(st);
}
function build(){
  css();
  var root=document.createElement('div'); root.id='ceChat';
  root.innerHTML='<button id="ceChatBtn" type="button" aria-label="Open chat"><span class="dot"></span><span>Chat</span><span id="ceChatCount" style="opacity:.9;font-weight:500"></span><span id="ceChatBd" class="bd" style="display:none"></span></button>'
   +'<div id="ceChatPanel" role="dialog" aria-label="Student chat"></div>';
  document.body.appendChild(root); S.root=root;
  document.getElementById('ceChatBtn').addEventListener('click',toggle);
}
function toggle(){ S.open=!S.open; var p=document.getElementById('ceChatPanel'); p.classList.toggle('open',S.open); if(S.open){ if(S.cur){ S.unread[S.cur]=0; } render(); } scheduleRender(); }
function scheduleRender(){ if(S.renderT) return; S.renderT=setTimeout(function(){ S.renderT=null; render(); },60); }
function totalUnread(){ var n=0; Object.keys(S.unread).forEach(function(k){ n+=S.unread[k]||0; }); return n; }
function avatar(id,name,on){ return '<span class="cc-av'+(on?' on':'')+'" style="background:'+colorFor(id)+'">'+esc((name||'?').charAt(0).toUpperCase())+'</span>'; }

function render(){
  if(!S.root) return;
  var onl=Object.keys(S.online).length;
  var c=document.getElementById('ceChatCount'); if(c) c.textContent=onl?('· '+onl+' online'):'';
  var bd=document.getElementById('ceChatBd'); var u=totalUnread(); if(bd){ bd.style.display=u?'inline-block':'none'; bd.textContent=u>99?'99+':u; }
  if(!S.open) return;
  var p=document.getElementById('ceChatPanel');
  if(S.cur) renderConv(p); else renderHome(p);
}
function renderHome(p){
  var h='<div class="cc-h"><span class="t">Student chat</span><button type="button" data-a="close" aria-label="Close">&times;</button></div><div class="cc-b">';
  h+='<div class="cc-note">Be kind and respectful. Messages are deleted after 24 hours.'+(S.histOK?'':' History is off, messages disappear when you close the page.')+'</div>';
  h+='<div class="cc-sec">Rooms</div>';
  S.rooms.forEach(function(r){ var u=S.unread[r.id]||0; h+='<button class="cc-row" type="button" data-room="'+esc(r.id)+'">'+avatar(r.id,r.kind==='course'?'#':'*',false)+'<span class="cc-nm">'+esc(r.title)+'</span>'+(u?'<span class="cc-un">'+u+'</span>':'')+'</button>'; });
  var dmKeys=Object.keys(S.dms);
  if(dmKeys.length){ h+='<div class="cc-sec">Direct messages</div>'; dmKeys.forEach(function(k){ var d=S.dms[k]; var nm=d.name||(S.online[d.peer]&&S.online[d.peer].name)||'Student'; var u=S.unread[k]||0; h+='<button class="cc-row" type="button" data-room="'+esc(k)+'">'+avatar(d.peer,nm,!!S.online[d.peer])+'<span class="cc-nm">'+esc(nm)+'</span>'+(u?'<span class="cc-un">'+u+'</span>':'')+'</button>'; }); }
  var ids=Object.keys(S.online);
  h+='<div class="cc-sec">Online now ('+ids.length+')</div>';
  var mine={}; S.rooms.forEach(function(r){ mine[r.id]=1; });
  ids.sort(function(a,b){ return S.online[a].name.localeCompare(S.online[b].name); }).forEach(function(id){
    var o=S.online[id], me=id===S.me.id;
    var same=(o.rooms||[]).some(function(r){ return r!=='everyone'&&mine[r]; });
    h+='<button class="cc-row" type="button" '+(me?'disabled style="opacity:.7;cursor:default"':'data-dm="'+esc(id)+'" data-nm="'+esc(o.name)+'"')+'>'+avatar(id,o.name,true)+'<span class="cc-nm">'+esc(o.name)+(me?' (you)':'')+'</span>'+(o.staff?'<span class="cc-tag">Lecturer</span>':(same&&!me?'<span class="cc-tag">Same course</span>':''))+'</button>';
  });
  if(ids.length<=1) h+='<div class="cc-note">No one else is online right now.</div>';
  h+='</div>';
  p.innerHTML=h;
  p.querySelector('[data-a=close]').onclick=toggle;
  p.querySelectorAll('[data-room]').forEach(function(b){ b.onclick=function(){ openRoom(b.getAttribute('data-room')); }; });
  p.querySelectorAll('[data-dm]').forEach(function(b){ b.onclick=function(){ var id=b.getAttribute('data-dm'); var rm=dmRoom(S.me.id,id); S.dms[rm]=S.dms[rm]||{peer:id,name:b.getAttribute('data-nm')}; S.dms[rm].keep=true; if(!S.dms[rm].name) S.dms[rm].name=b.getAttribute('data-nm'); openRoom(rm); }; });
}
function roomTitle(room){
  if(isDm(room)){ var d=S.dms[room]||{}; return d.name||(S.online[d.peer]&&S.online[d.peer].name)||'Direct message'; }
  var r=S.rooms.filter(function(x){return x.id===room;})[0]; return r?r.title:'Chat';
}
function openRoom(room){ S.cur=room; S.unread[room]=0; scheduleRender(); renderConv(document.getElementById('ceChatPanel')); loadHistory(room).then(function(){ renderConv(document.getElementById('ceChatPanel')); }); }
function renderConv(p){
  var room=S.cur, list=S.msgs[room]||[];
  var keepInput=p.querySelector('#ceChatInput'), val=keepInput?keepInput.value:'';
  var h='<div class="cc-h"><button type="button" data-a="back" aria-label="Back">&larr;</button><span class="t">'+esc(roomTitle(room))+'</span><button type="button" data-a="close" aria-label="Close">&times;</button></div><div class="cc-b" id="ceChatBody" style="display:flex;flex-direction:column">';
  if(!list.length) h+='<div class="cc-note">No messages yet. Say hello.</div>';
  list.forEach(function(m){
    var me=m.from_id===S.me.id;
    h+='<div class="cc-msg'+(me?' me':'')+'"><div class="cc-meta">'+(me?'':esc(m.from_name)+' · ')+esc(fmtTime(m.ts))+(canDelete(m)?'<span class="cc-x" data-del="'+esc(m.id)+'" title="Delete">&times;</span>':'')+'</div><div class="cc-bub">'+esc(m.text)+'</div></div>';
  });
  h+='</div><div class="cc-in"><input type="text" id="ceChatInput" maxlength="500" placeholder="Type a message..." autocomplete="off"><button type="button" id="ceChatSend">Send</button></div>';
  p.innerHTML=h;
  var inp=p.querySelector('#ceChatInput'); inp.value=val;
  var body=p.querySelector('#ceChatBody'); body.scrollTop=body.scrollHeight;
  p.querySelector('[data-a=close]').onclick=toggle;
  p.querySelector('[data-a=back]').onclick=function(){ S.cur=null; render(); };
  p.querySelectorAll('[data-del]').forEach(function(x){ x.onclick=function(){ removeMsg(room,x.getAttribute('data-del')); }; });
  var go=function(){ var v=inp.value; if(!v.trim()) return; send(room,v); inp.value=''; };
  p.querySelector('#ceChatSend').onclick=go;
  inp.onkeydown=function(e){ if(e.key==='Enter'){ e.preventDefault(); go(); } };
  if(keepInput) inp.focus();
}

/* ---------- lifecycle ---------- */
function start(me){
  var lib=window.supabase; if(!lib||!lib.createClient) return;
  S.me=me; S.rooms=myRooms();
  try{ S.rt=lib.createClient(G('SUPABASE_URL'),G('SUPABASE_KEY'),{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},realtime:{params:{eventsPerSecond:10}}}); }catch(e){ return; }
  build(); S.rooms.forEach(joinRoom); joinInbox(); setupPresence(); loadDmList(); purgeOld(); S.started=true; render();
}
function stop(){
  try{ Object.keys(S.chans).forEach(function(k){ S.rt.removeChannel(S.chans[k]); }); Object.keys(S.sendCh).forEach(function(k){ S.rt.removeChannel(S.sendCh[k]); }); }catch(e){}
  if(S.root&&S.root.parentNode) S.root.parentNode.removeChild(S.root);
  S.rt=null; S.me=null; S.chans={}; S.sendCh={}; S.msgs={}; S.unread={}; S.online={}; S.dms={}; S.loaded={}; S.cur=null; S.open=false; S.root=null; S.started=false;
}
var _lastPurge=0;
function tick(){
  var me=identity();
  if(!me){ if(S.started) stop(); return; }
  if(!S.started){ start(me); return; }
  if(S.me.id!==me.id){ stop(); start(me); return; }
  pruneLocal(); if(Date.now()-_lastPurge>30*60*1000){ _lastPurge=Date.now(); purgeOld(); }
  // new courses appeared (dashboard finished loading)
  var rooms=myRooms();
  if(rooms.length!==S.rooms.length){ var have={}; S.rooms.forEach(function(r){have[r.id]=1;}); rooms.forEach(function(r){ if(!have[r.id]) joinRoom(r); }); S.rooms=rooms; if(S.pres) track(S.pres); scheduleRender(); }
}
window.ChatUI={tick:tick,stop:stop,_state:S};
setInterval(tick,1500);
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',tick); else setTimeout(tick,300);
})();
