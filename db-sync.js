/* one-time clear of saved class lists on every device (26 Nov 2026 roster fix) */
try{ if(localStorage.getItem('ceCacheV')!=='2611b'){ Object.keys(localStorage).forEach(function(k){ if(k.indexOf('ceGA:')===0||k.indexOf('ceGR:')===0) localStorage.removeItem(k); }); Object.keys(sessionStorage).forEach(function(k){ if(k.indexOf('ceGA:')===0) sessionStorage.removeItem(k); }); localStorage.setItem('ceCacheV','2611b'); } }catch(e){}
/* call tally: adds the action name to server call addresses so the logs show which calls are busiest (no data is added) */
(function(){try{var f=window.fetch;if(!f||window.__actTag)return;window.__actTag=1;window.fetch=function(u,o){try{var s=typeof u==='string'?u:'';if(s.indexOf('/functions/v1/')>0&&s.indexOf('?')<0&&o&&typeof o.body==='string'){var m=/"action":"([a-z_0-9]{1,40})"/.exec(o.body.slice(0,300));if(m)u=s+'?a='+m[1];}}catch(e){}return f.call(this,u,o);};}catch(e){}})();
/* db-sync.js — keeps attendance & class lists in real database tables (no more whole-file overwrites).
   Pages keep using data.attendance / data.rosters exactly as before; this layer reads them from the tables
   and, on save, writes only the rows that changed. Active only after the owner runs the migration
   (site-data.json then carries dbMigrated:true). Before that, nothing changes. */
(function(){
  var nk=function(s){ return String(s==null?'':s).trim().toLowerCase().replace(/\s+/g,''); };
  var DBS={
    url:'', key:'',
    init:function(url,key){ this.url=url; this.key=key; },
    H:function(extra){ return Object.assign({apikey:this.key,Authorization:'Bearer '+this.key},extra||{}); },
    err:function(m){ var e=new Error(m); e.dbs=true; return e; },
    api:async function(payload){
      var cl=null, adm=null; try{ cl=(0,eval)('typeof supabaseClient!=="undefined"?supabaseClient:null'); }catch(e){} try{ adm=window._adminViaStaff||null; }catch(e){}
      var get=async function(c){ try{ var r=await c.auth.getSession(); return r&&r.data&&r.data.session?r.data.session.access_token:''; }catch(e){ return ''; } };
      var tok=adm?await get(adm):''; if(!tok&&cl) tok=await get(cl);
      var h={'Content-Type':'application/json',apikey:this.key};
      if(tok){ var iss=''; try{ iss=JSON.parse(atob(tok.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).iss||''; }catch(e){} h[iss.indexOf('qqnsbuirelhwfrshafay')>=0?'x-student-token':'x-staff-token']=tok; }
      if(payload.action==='checkin'||payload.action==='qr_check'){ try{ Object.keys(sessionStorage).forEach(function(k){ if(k.indexOf('ceGA:')===0) sessionStorage.removeItem(k); }); }catch(e){} }
      if(h['x-student-token'] && payload.action==='db_op' && payload.op==='getAll'){
        try{
          var li=String(window._lookIdx||''), ck='ceGA:'+payload.table+':'+(payload.order||'')+':'+li, now=Date.now();
          var st=payload.table==='roster_entries'?localStorage:sessionStorage;
          try{ var c0=JSON.parse(st.getItem(ck)||'null'); if(c0&&now-c0.t<(payload.table==='roster_entries'?1800000:300000)&&c0.j&&c0.j.ok) return c0.j; }catch(e){}
          var rl=await fetch(this.url+'/functions/v1/lite',{method:'POST',headers:h,body:JSON.stringify({action:'getall',table:payload.table,order:payload.order,idx:li})});
          var jl=await rl.json(); if(jl&&jl.ok){ try{ if(!jl.rows||!jl.rows.length) throw 0; var sj=JSON.stringify({t:now,j:jl}); if(sj.length<1500000) st.setItem(ck,sj); }catch(e){} return jl; }
        }catch(e){}
      }
      /* staff reading a whole table: the light service answers (remembered there for a minute); the main one is the fallback */
      /* remembered in this page only, so repeated reads do not download the same tables again: class lists 10 minutes (they rarely change), attendance 15 seconds (this also joins reads that arrive together). Any save by this page clears that table. */
      var GC=(window.__dbsGC=window.__dbsGC||{});
      if(payload.action==='db_op' && payload.op!=='getAll' && payload.table){ Object.keys(GC).forEach(function(k){ if(k.indexOf(payload.table+'|')===0) delete GC[k]; }); try{ Object.keys(localStorage).forEach(function(k){ if(k.indexOf('ceGR:'+payload.table+'|')===0||k.indexOf('ceGA:'+payload.table+':')===0) localStorage.removeItem(k); }); }catch(e){} }
      if(h['x-staff-token'] && payload.action==='db_op' && payload.op==='getAll'){
        var gk=payload.table+'|'+(payload.order||''), ttl=payload.table==='roster_entries'?600000:15000, g0=GC[gk];
        if(g0 && Date.now()-g0.t<ttl){ try{ return await g0.p; }catch(e){ delete GC[gk]; } }
        var rk='ceGR:'+gk, isR=payload.table==='roster_entries';
        if(isR){ try{ var r0=JSON.parse(localStorage.getItem(rk)||'null'); if(r0&&Date.now()-r0.t<600000&&r0.j&&r0.j.ok){ GC[gk]={t:r0.t,p:Promise.resolve(r0.j)}; return r0.j; } }catch(e){} }
        var pr=(async function(self){
          var rs=await fetch(self.url+'/functions/v1/lite',{method:'POST',headers:h,body:JSON.stringify({action:'getall',table:payload.table,order:payload.order})});
          var js=await rs.json(); if(js&&js.ok){ if(isR){ try{ var sj2=JSON.stringify({t:Date.now(),j:js}); if(js.rows&&js.rows.length&&sj2.length<1500000) localStorage.setItem(rk,sj2); }catch(e){} } return js; } throw 0;
        })(this);
        GC[gk]={t:Date.now(),p:pr};
        try{ return await pr; }catch(e){ delete GC[gk]; }
      }
      /* check-in, QR check and selfies use their own small service; if it cannot be reached the main one answers */
      var fast=(payload.action==='checkin'||payload.action==='qr_check'||payload.action==='selfie_put');
      var r=null;
      if(fast){ try{ r=await fetch(this.url+'/functions/v1/attend',{method:'POST',headers:h,body:JSON.stringify(payload)}); if(r.status>=500) r=null; }catch(e){ r=null; } }
      if(!r) r=await fetch(this.url+'/functions/v1/api',{method:'POST',headers:h,body:JSON.stringify(payload)});
      var j=null; try{ j=await r.json(); }catch(e){}
      if(!j||!j.ok) throw this.err((j&&j.error)||('The back end did not answer ('+r.status+')'));
      return j;
    },
    getAll:async function(table,order){
      var j=await this.api({action:'db_op',op:'getAll',table:table,order:order});
      return j.rows||[];
    },
    upsert:async function(table,rows,conflict,ignore){
      if(!rows.length) return;
      await this.api({action:'db_op',op:'upsert',table:table,rows:rows,conflict:conflict,ignore:!!ignore});
    },
    del:async function(table,filter){
      await this.api({action:'db_op',op:'del',table:table,filter:filter});
    },
    inList:function(vals){ return 'in.('+vals.map(function(v){ return '"'+String(v).replace(/"/g,'\\"')+'"'; }).join(',')+')'; },

    /* read: fill raw.attendance and raw.rosters from the tables (only when migrated) */
    load:async function(raw){
      if(!raw || !raw.dbMigrated) return raw;
      var res=await Promise.all([this.getAll('attendance_sessions','session_key'),this.getAll('attendance_marks','session_key,index_number'),this.getAll('roster_entries','course,index_number')]);
      var sess=res[0], marks=res[1], ros=res[2];
      var att={}, order=[];
      sess.forEach(function(s){ att[s.session_key]={sessionKey:s.session_key,course:s.course,date:s.date,present:[],excused:[],checkInTimes:{},takenBy:s.taken_by||undefined,editedBy:s.edited_by||undefined}; order.push(s.session_key); });
      marks.forEach(function(m){ var a=att[m.session_key]; if(!a){ return; } if(m.excused){ a.excused.push(m.index_number); return; } a.present.push(m.index_number); if(m.checked_at) a.checkInTimes[m.index_number]=m.checked_at; });
      var rosters={}; ros.forEach(function(r){ (rosters[r.course]=rosters[r.course]||[]).push({indexNumber:r.index_number,name:r.name||''}); });
      var attList=order.map(function(k){ var a=att[k]; if(!a.excused.length) delete a.excused; if(!a.takenBy) delete a.takenBy; if(!a.editedBy) delete a.editedBy; return a; });
      raw.attendance=attList; raw.rosters=rosters;
      // snapshot of what the database held when this copy was read (used to work out what changed on save)
      var sa={}, sr={};
      attList.forEach(function(a){ var m={}, ex={}; a.present.forEach(function(p){ m[nk(p)]=p; }); (a.excused||[]).forEach(function(p){ ex[nk(p)]=p; }); sa[a.sessionKey]={course:a.course,date:a.date,tb:JSON.stringify(a.takenBy||null),eb:JSON.stringify(a.editedBy||null),marks:m,exc:ex}; });
      Object.keys(rosters).forEach(function(c){ var m={}; rosters[c].forEach(function(e){ m[nk(e.indexNumber)]={index:e.indexNumber,name:e.name||''}; }); sr[c]=m; });
      Object.defineProperty(raw,'__snap',{value:{att:sa,ros:sr},enumerable:false,writable:true,configurable:true});
      return raw;
    },

    /* write: send only the changes to the tables; return the object to store in site-data.json */
    persist:async function(data){
      if(!data || !data.dbMigrated) return data;
      var snap=data.__snap || {att:{},ros:{}}, now=new Date().toISOString(), self=this;
      var nAtt={};
      (data.attendance||[]).forEach(function(a){
        if(!a) return;
        var course=String(a.course||'').trim(), date=String(a.date||'').trim().slice(0,10);
        var key=a.sessionKey||(course+'__'+date);
        var t=nAtt[key]; if(!t){ t=nAtt[key]={course:course,date:date,tb:JSON.stringify(a.takenBy||null),eb:JSON.stringify(a.editedBy||null),takenBy:a.takenBy||null,editedBy:a.editedBy||null,marks:{},exc:{},times:{}}; }
        (a.present||[]).forEach(function(p){ var k=nk(p); if(k && !t.marks[k]) t.marks[k]=String(p).trim(); });
        (a.excused||[]).forEach(function(p){ var k=nk(p); if(k && !t.exc[k]) t.exc[k]=String(p).trim(); });
        var ct=a.checkInTimes||{}; Object.keys(ct).forEach(function(k){ t.times[nk(k)]=ct[k]; });
      });
      Object.keys(nAtt).forEach(function(key){ var t=nAtt[key]; Object.keys(t.exc).forEach(function(k){ if(t.marks[k]) delete t.exc[k]; }); });
      var sessUp=[], markUp=[], sessDel=[], markDel={};
      Object.keys(nAtt).forEach(function(key){
        var n=nAtt[key], o=snap.att[key];
        if(!o || o.course!==n.course || o.date!==n.date || o.tb!==n.tb || o.eb!==n.eb)
          sessUp.push({session_key:key,course:n.course,date:n.date,taken_by:n.takenBy,edited_by:n.editedBy,updated_at:now});
        Object.keys(n.marks).forEach(function(k){ if(!o || !(k in o.marks)) markUp.push({session_key:key,index_number:n.marks[k],checked_at:n.times[k]||now,excused:false}); });
        Object.keys(n.exc).forEach(function(k){ if(!o || !o.exc || !(k in o.exc)) markUp.push({session_key:key,index_number:n.exc[k],checked_at:now,excused:true}); });
        if(o){ Object.keys(o.marks).forEach(function(k){ if(!(k in n.marks) && !(k in n.exc)){ (markDel[key]=markDel[key]||[]).push(o.marks[k]); } });
          Object.keys(o.exc||{}).forEach(function(k){ if(!(k in n.exc) && !(k in n.marks)){ (markDel[key]=markDel[key]||[]).push(o.exc[k]); } }); }
      });
      Object.keys(snap.att).forEach(function(key){ if(!(key in nAtt)) sessDel.push(key); });

      var nRos={}; Object.keys(data.rosters||{}).forEach(function(c){ var m={}; (data.rosters[c]||[]).forEach(function(e){ if(!e) return; var k=nk(e.indexNumber); if(k && !m[k]) m[k]={index:String(e.indexNumber).trim(),name:e.name||''}; }); nRos[c]=m; });
      var rosUp=[], rosDel={}, rosDelCourse=[];
      Object.keys(nRos).forEach(function(c){
        var o=snap.ros[c]||{}, n=nRos[c];
        Object.keys(n).forEach(function(k){ if(!(k in o) || o[k].name!==n[k].name || o[k].index!==n[k].index) rosUp.push({course:c,index_number:n[k].index,name:n[k].name}); });
        Object.keys(o).forEach(function(k){ if(!(k in n)){ (rosDel[c]=rosDel[c]||[]).push(o[k].index); } });
      });
      Object.keys(snap.ros).forEach(function(c){ if(!(c in nRos)) rosDelCourse.push(c); });

      // sessions first, then marks; removals last
      if(sessUp.length) await self.upsert('attendance_sessions',sessUp,'session_key');
      if(markUp.length) await self.upsert('attendance_marks',markUp,'session_key,index_number');
      for(var key in markDel){ var list=markDel[key]; for(var i=0;i<list.length;i+=80){ await self.del('attendance_marks','session_key=eq.'+encodeURIComponent(key)+'&index_number='+encodeURIComponent(self.inList(list.slice(i,i+80)))); } }
      for(var s=0;s<sessDel.length;s++){ await self.del('attendance_marks','session_key=eq.'+encodeURIComponent(sessDel[s])); await self.del('attendance_sessions','session_key=eq.'+encodeURIComponent(sessDel[s])); }
      if(rosUp.length) await self.upsert('roster_entries',rosUp,'course,index_number');
      for(var c in rosDel){ var l2=rosDel[c]; for(var j=0;j<l2.length;j+=80){ await self.del('roster_entries','course=eq.'+encodeURIComponent(c)+'&index_number='+encodeURIComponent(self.inList(l2.slice(j,j+80)))); } }
      for(var d=0;d<rosDelCourse.length;d++) await self.del('roster_entries','course=eq.'+encodeURIComponent(rosDelCourse[d]));

      // refresh the snapshot so a second save of the same object only sends new changes
      var sa={}, sr={};
      Object.keys(nAtt).forEach(function(k){ var n=nAtt[k]; sa[k]={course:n.course,date:n.date,tb:n.tb,eb:n.eb,marks:Object.assign({},n.marks),exc:Object.assign({},n.exc)}; });
      Object.keys(nRos).forEach(function(c){ sr[c]=Object.assign({},nRos[c]); });
      try{ Object.defineProperty(data,'__snap',{value:{att:sa,ros:sr},enumerable:false,writable:true,configurable:true}); }catch(e){}

      // site-data.json keeps only course names for rosters (other pages build course drop-downs from them)
      var out=Object.assign({},data); delete out.attendance;
      var stubs={}; Object.keys(nRos).forEach(function(c){ stubs[c]=[]; }); out.rosters=stubs;
      return out;
    },

    /* QR check-in: the back end checks the QR code, time and place, then adds one student to one session */
    qrCheckIn:async function(course,date,token,idx,lat,lng,pass,acc){
      var j=await this.api({action:'checkin',course:course,date:date,token:token,pass:pass||'',idx:String(idx).trim(),lat:lat,lng:lng,acc:acc});
      return !!j.had;
    },

    /* one-time copy of the old data into the tables; returns counts that were verified */
    migrate:async function(attendance,rosters){
      var sess=[], marks=[], ros=[], seen={};
      (attendance||[]).forEach(function(a){
        var course=String(a.course||'').trim(), date=String(a.date||'').trim().slice(0,10), key=a.sessionKey||(course+'__'+date);
        if(!seen[key]){ seen[key]={}; sess.push({session_key:key,course:course,date:date,taken_by:a.takenBy||null,edited_by:a.editedBy||null}); }
        var ct=a.checkInTimes||{}, ctn={}; Object.keys(ct).forEach(function(k){ ctn[nk(k)]=ct[k]; });
        (a.present||[]).forEach(function(p){ var k=nk(p); if(!k||seen[key][k]) return; seen[key][k]=1; marks.push({session_key:key,index_number:String(p).trim(),checked_at:ctn[k]||new Date().toISOString()}); });
      });
      (attendance||[]).forEach(function(a){ var course=String(a.course||'').trim(), date=String(a.date||'').trim().slice(0,10), key=a.sessionKey||(course+'__'+date); (a.excused||[]).forEach(function(p){ var k=nk(p); if(!k||(seen[key]&&seen[key][k])) return; seen[key]=seen[key]||{}; seen[key][k]=1; marks.push({session_key:key,index_number:String(p).trim(),checked_at:new Date().toISOString(),excused:true}); }); });
      var rseen={};
      Object.keys(rosters||{}).forEach(function(c){ (rosters[c]||[]).forEach(function(e){ var k=c+'||'+nk(e.indexNumber); if(!nk(e.indexNumber)||rseen[k]) return; rseen[k]=1; ros.push({course:c,index_number:String(e.indexNumber).trim(),name:e.name||''}); }); });
      await this.upsert('attendance_sessions',sess,'session_key');
      await this.upsert('attendance_marks',marks,'session_key,index_number');
      await this.upsert('roster_entries',ros,'course,index_number');
      var chk=await Promise.all([this.getAll('attendance_sessions','session_key'),this.getAll('attendance_marks','session_key,index_number'),this.getAll('roster_entries','course,index_number')]);
      var ok = chk[0].length>=sess.length && chk[1].length>=marks.length && chk[2].length>=ros.length;
      return {ok:ok,sessions:sess.length,marks:marks.length,rosterEntries:ros.length,inDb:{sessions:chk[0].length,marks:chk[1].length,rosterEntries:chk[2].length}};
    },

    /* read the tables back as the old structure (used to revert) */
    dump:async function(){ var raw={dbMigrated:true}; await this.load(raw); return {attendance:raw.attendance,rosters:raw.rosters}; }
  };
  window.DBS=DBS;
})();
