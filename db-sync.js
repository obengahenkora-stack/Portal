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
    getAll:async function(table,order){
      var out=[], size=1000;
      for(var off=0;;off+=size){
        var r=await fetch(this.url+'/rest/v1/'+table+'?select=*&order='+order+'&limit='+size+'&offset='+off,{headers:this.H(),cache:'no-store'});
        if(!r.ok) throw this.err('Could not read '+table+' ('+r.status+'). Has the database set-up SQL been run?');
        var rows=await r.json(); for(var i=0;i<rows.length;i++) out.push(rows[i]);
        if(rows.length<size) break;
      }
      return out;
    },
    upsert:async function(table,rows,conflict,ignore){
      for(var i=0;i<rows.length;i+=400){
        var r=await fetch(this.url+'/rest/v1/'+table+'?on_conflict='+conflict,{method:'POST',
          headers:this.H({'Content-Type':'application/json','Prefer':'resolution='+(ignore?'ignore':'merge')+'-duplicates,return=minimal'}),
          body:JSON.stringify(rows.slice(i,i+400))});
        if(!r.ok) throw this.err('Could not write '+table+' ('+r.status+' '+(await r.text().catch(function(){return '';}))+')');
      }
    },
    del:async function(table,filter){
      var r=await fetch(this.url+'/rest/v1/'+table+'?'+filter,{method:'DELETE',headers:this.H({'Prefer':'return=minimal'})});
      if(!r.ok) throw this.err('Could not delete from '+table+' ('+r.status+')');
    },
    inList:function(vals){ return 'in.('+vals.map(function(v){ return '"'+String(v).replace(/"/g,'\\"')+'"'; }).join(',')+')'; },

    /* read: fill raw.attendance and raw.rosters from the tables (only when migrated) */
    load:async function(raw){
      if(!raw || !raw.dbMigrated) return raw;
      var res=await Promise.all([this.getAll('attendance_sessions','session_key'),this.getAll('attendance_marks','session_key,index_number'),this.getAll('roster_entries','course,index_number')]);
      var sess=res[0], marks=res[1], ros=res[2];
      var att={}, order=[];
      sess.forEach(function(s){ att[s.session_key]={sessionKey:s.session_key,course:s.course,date:s.date,present:[],checkInTimes:{},takenBy:s.taken_by||undefined,editedBy:s.edited_by||undefined}; order.push(s.session_key); });
      marks.forEach(function(m){ var a=att[m.session_key]; if(!a){ return; } a.present.push(m.index_number); if(m.checked_at) a.checkInTimes[m.index_number]=m.checked_at; });
      var rosters={}; ros.forEach(function(r){ (rosters[r.course]=rosters[r.course]||[]).push({indexNumber:r.index_number,name:r.name||''}); });
      var attList=order.map(function(k){ var a=att[k]; if(!a.takenBy) delete a.takenBy; if(!a.editedBy) delete a.editedBy; return a; });
      raw.attendance=attList; raw.rosters=rosters;
      // snapshot of what the database held when this copy was read (used to work out what changed on save)
      var sa={}, sr={};
      attList.forEach(function(a){ var m={}; a.present.forEach(function(p){ m[nk(p)]=p; }); sa[a.sessionKey]={course:a.course,date:a.date,tb:JSON.stringify(a.takenBy||null),eb:JSON.stringify(a.editedBy||null),marks:m}; });
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
        var t=nAtt[key]; if(!t){ t=nAtt[key]={course:course,date:date,tb:JSON.stringify(a.takenBy||null),eb:JSON.stringify(a.editedBy||null),takenBy:a.takenBy||null,editedBy:a.editedBy||null,marks:{},times:{}}; }
        (a.present||[]).forEach(function(p){ var k=nk(p); if(k && !t.marks[k]) t.marks[k]=String(p).trim(); });
        var ct=a.checkInTimes||{}; Object.keys(ct).forEach(function(k){ t.times[nk(k)]=ct[k]; });
      });
      var sessUp=[], markUp=[], sessDel=[], markDel={};
      Object.keys(nAtt).forEach(function(key){
        var n=nAtt[key], o=snap.att[key];
        if(!o || o.course!==n.course || o.date!==n.date || o.tb!==n.tb || o.eb!==n.eb)
          sessUp.push({session_key:key,course:n.course,date:n.date,taken_by:n.takenBy,edited_by:n.editedBy,updated_at:now});
        Object.keys(n.marks).forEach(function(k){ if(!o || !(k in o.marks)) markUp.push({session_key:key,index_number:n.marks[k],checked_at:n.times[k]||now}); });
        if(o) Object.keys(o.marks).forEach(function(k){ if(!(k in n.marks)){ (markDel[key]=markDel[key]||[]).push(o.marks[k]); } });
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
      Object.keys(nAtt).forEach(function(k){ var n=nAtt[k]; sa[k]={course:n.course,date:n.date,tb:n.tb,eb:n.eb,marks:Object.assign({},n.marks)}; });
      Object.keys(nRos).forEach(function(c){ sr[c]=Object.assign({},nRos[c]); });
      try{ Object.defineProperty(data,'__snap',{value:{att:sa,ros:sr},enumerable:false,writable:true,configurable:true}); }catch(e){}

      // site-data.json keeps only course names for rosters (other pages build course drop-downs from them)
      var out=Object.assign({},data); delete out.attendance;
      var stubs={}; Object.keys(nRos).forEach(function(c){ stubs[c]=[]; }); out.rosters=stubs;
      return out;
    },

    /* QR check-in: add one student to one session without touching anything else */
    checkIn:async function(sessionKey,course,date,idx,startedBy){
      await this.upsert('attendance_sessions',[Object.assign({session_key:sessionKey,course:course,date:date,updated_at:new Date().toISOString()},startedBy?{taken_by:Object.assign({},startedBy,{how:'QR check-in'})}:{})],'session_key',true);
      await this.upsert('attendance_marks',[{session_key:sessionKey,index_number:String(idx).trim(),checked_at:new Date().toISOString()}],'session_key,index_number',true);
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
