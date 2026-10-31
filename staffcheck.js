/* staffcheck.js - asks the back end "who is this signed-in person?" (role, features, courses).
   Falls back to the old method if the back end cannot be reached. */
window._bkMe=async function(session,email,fallback){
  try{
    var r=await fetch(SUPABASE_URL+'/functions/v1/api',{method:'POST',headers:{'Content-Type':'application/json',apikey:SUPABASE_KEY,'x-staff-token':session.access_token},body:JSON.stringify({action:'whoami'})});
    if(r.ok){ var j=await r.json(); if(j&&j.ok&&j.signedIn) return j.role?{role:j.role,name:j.name,perms:j.perms,courses:j.courses}:null; }
  }catch(e){}
  return await fallback();
};
