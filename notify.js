/* Course emails: tells the students on a class when material, an announcement or results are posted. */
(function(){
window.ceNotify=async function(kind,course,title,group){
  try{
    if(!course||typeof supabaseClient==='undefined') return {ok:false};
    var s=(await supabaseClient.auth.getSession()).data.session; if(!s) return {ok:false};
    var g=group||((String(course).match(/\s([ABC])\s*$/)||[])[1]||'');
    var r=await fetch(SUPABASE_URL+'/functions/v1/notify',{method:'POST',headers:{'Content-Type':'application/json',apikey:SUPABASE_KEY,'x-staff-token':s.access_token},body:JSON.stringify({action:'post',kind:kind,course:course,group:g,title:title||''})});
    return await r.json();
  }catch(e){ return {ok:false,error:e.message}; }
};
window.ceNotifyText=function(j){
  if(!j||!j.ok) return '';
  if(j.configured===false) return ' Email is not switched on yet, so no emails were sent.';
  if(!j.queued) return ' '+(j.message||'No emails to send.');
  return ' Emailing '+j.queued+' student'+(j.queued===1?'':'s')+(j.waiting?' ('+j.waiting+' will go out tomorrow because of the daily free limit)':'')+'.';
};
})();
