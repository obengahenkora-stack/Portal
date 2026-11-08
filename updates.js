/* What's new: shown once per update, after sign-in. To announce something new, add a note at the TOP of NOTES with a new id. */
(function(){
  var NOTES=[
    { id:'2026-11-08n', date:'8 Nov 2026', title:'Absence excuses',
      all:[],
      student:['New Absence Excuse tile: if you missed a class for a good reason, send your lecturer a request and see the reply there. If approved you are marked Excused.'],
      staff:['New Absence Excuses tile: approve or decline student requests. Approving marks the student Excused in that day\'s attendance session.'] },
    { id:'2026-11-08m', date:'8 Nov 2026', title:'Announcements on your dashboard',
      all:[],
      student:['Your lecturers\' latest announcements now show right on the dashboard with a counter for the ones you have not read, and the Lecture Hall tile shows how many new items are waiting.'],
      staff:[] },
    { id:'2026-11-08l', date:'8 Nov 2026', title:'Announcements by class',
      all:[],
      student:['Announcements can now be sent to one class (A, B or C) or to Weekend or Regular students only, so you only see the ones meant for you.'],
      staff:['In the Lecture Hall, an announcement has a new "Send to" choice: everyone, Class A, B or C, Weekend or Regular students.'] },
    { id:'2026-11-08k', date:'8 Nov 2026', title:'Usage dashboard',
      all:[],
      student:[],
      staff:['New Usage Dashboard tile: sessions per month, most active courses, attendance by course and who takes attendance, with an Excel download.'] },
    { id:'2026-11-08j', date:'8 Nov 2026', title:'Backup reminder and Excel workbook',
      all:[],
      student:[],
      staff:['The Backup Data tile now also gives an Excel workbook (scores, attendance, class lists and exam attendance), shows when you last backed up, and the Faculty Console reminds the owner when 30 days have passed.'] },
    { id:'2026-11-08i', date:'8 Nov 2026', title:'Attendance warning',
      all:[],
      student:['If your attendance in a course drops below 75%, a gentle Attendance warning card now appears on your dashboard. Tap Got it to hide it. It returns if your attendance changes.'],
      staff:[] },
    { id:'2026-11-08h', date:'8 Nov 2026', title:'Score History with Undo',
      all:[],
      student:[],
      staff:['New Score History tile in the Assessment Portal. Every upload, edit and removal of scores is recorded with who and when. Open Details to see each change, and tap Undo to put the scores back.'] },
    { id:'2026-11-08g', date:'8 Nov 2026', title:'Gradebook charts',
      all:[],
      student:[],
      staff:['The Gradebook now shows charts under the table: a class summary (average, median, pass rate, highest, lowest), a grade spread bar chart, and the average for each assessment.'] },
    { id:'2026-11-08f', date:'8 Nov 2026', title:'Regular and Weekend students',
      all:[],
      student:['New students are now asked to choose Regular or Weekend when they register.'],
      staff:['Every existing student is tagged Regular. New students choose Regular or Weekend at sign-up. The Students page shows each student\'s type, has a new Student type filter, and Edit lets you change it.'] },
    { id:'2026-11-08e', date:'8 Nov 2026', title:'Tidier score screens',
      all:[],
      student:[],
      staff:['Upload Scores and the Gradebook have a cleaner layout: calmer labels, full-width buttons, and a Gradebook table that keeps the index number and headings in view while you scroll.'] },
    { id:'2026-11-08d', date:'8 Nov 2026', title:'New score alerts',
      all:[],
      student:['Level 100 to 300 students are told about the scores already recorded for them. When new scores are posted, or one changes, a green "New scores posted" card now appears on your dashboard with a NEW tag on My Scores. Tap Got it and it goes away.'],
      staff:[] },
    { id:'2026-11-08c', date:'8 Nov 2026', title:'At-Risk Students',
      all:[],
      student:[],
      staff:['New At-Risk Students tile in the Attendance Portal. Pick a course and set your limits for attendance and scores. It lists the students who are falling behind, with the reason, and you can download the list as Excel.'] },
    { id:'2026-11-08b', date:'8 Nov 2026', title:'Exam Sessions',
      all:[],
      student:[],
      staff:['New Exam Sessions tile in the Attendance Portal: pick the course and exam date, then scan the barcode on each student\'s Exam Pass. Groups A, B and C of a course load together as one class list. Several phones can scan the same exam at once and everyone sees all the names. The list downloads as an Excel file, and it can download automatically when you tap Done after scanning. A new Past exam sessions button lists every saved exam so you can reopen or (owner only) delete one. You can also set a Room on each phone for a per-room count, add a student who is not on the class list as an extra candidate, print an exam attendance sheet, and see exam attendance inside Summary & Export. Exam records are kept separate from lecture attendance.'] },
    { id:'2026-11-08a', date:'8 Nov 2026', title:'Cleaner scanning',
      all:[],
      student:[],
      staff:['In Scan tags and QR code modes, the full class list is now hidden. Only students who are marked present show, and names appear as you scan or as students check in. Tick list works as before.','The scan beep is now louder and plays instantly when a tag is read.','When you reopen the scanner, the top number now shows everyone already present. The Back button and refresh no longer throw you out of a scan by mistake, and the Save Attendance button stays visible in Scan tags and QR code modes. It is now a bigger green button that stays at the bottom of the screen.','Main action buttons across the portal and dashboard (Save, Upload and similar) now share the same modern green look.'] },
    { id:'2026-11-07i', date:'7 Nov 2026', title:'Calmer home screens',
      all:[],
      student:['The big blue tiles on your dashboard (Lecture Hall, Chat, My Scores and the rest) are now neat list cards,.'],
      staff:['The greeting card and the student-count tiles on the Students Dashboard now use a calm card look instead of bright gradients.'] },
    { id:'2026-11-07h', date:'7 Nov 2026', title:'Cleaner navigation',
      all:['The Back buttons are now neat rounded red buttons with an arrow, and sit side by side so they take less room.'],
      student:['The Signed in line is now small and sits at the bottom of the page instead of floating over your screen.'],
      staff:['The Signed in line is now small and sits at the bottom of the page.','The Students page (Find a student and Registered students) has a calmer, tidier layout: one search box, four neat filters in a grid, and small rounded action buttons.','The tool tiles in the Assessment Portal, Attendance Portal and Faculty Console are now compact cards in a tidy list, with a coloured icon, a title and one short line, instead of big colour blocks.'] },
    { id:'2026-11-07c', date:'7 Nov 2026', title:'Take Attendance is tidier',
      all:[],
      student:[],
      staff:[
        'Take Attendance now has three clear choices at the top: Tick list, Scan tags and QR code. Only the one you pick is shown, so the page is much less crowded.',
        'The One phone = one student switch is now tucked under Options in the QR code choice.'
      ] },
    { id:'2026-11-07b', date:'7 Nov 2026', title:'New: scan student tags',
      all:[],
      student:[],
      staff:[
        'NEW: Scan student tags. In Take Attendance, pick the course and date, then tap Scan student tags. Hold each student\u2019s tag QR code to the camera: they are ticked present with their name and a beep. A tag scanned twice shows Already marked, and a student who is not on the class list is not marked.',
        'Changes made while scanning save automatically, including when the internet is off.'
      ] },
    { id:'2026-11-07a', date:'7 Nov 2026', title:'New: selfie at QR check-in',
      all:[],
      student:[
        'NEW: When you check in by scanning the QR code, your phone camera opens and takes a quick selfie. Face the camera in good light, with no cap or dark glasses, and allow camera access when asked.',
        'The selfie is only used to settle attendance complaints. Only your lecturer can see it, and it is deleted after 90 days.',
        'After you scan the QR code you now have about 6 minutes to finish, so there is no rush.',
        'Each phone can check in one student only. Do not use your phone to sign in for a friend.',
        'NOTICE: Please open My Attendance and check that every class you attended is counted. If anything is wrong or missing, use Report an Issue on your dashboard and say the course and the date, so it can be resolved.'
      ],
      staff:[
        'NEW: Selfie Review (Attendance, under Records) shows the check-in photos for a course and date. Tick Keep on a photo to stop it being deleted after 90 days, or print the photos as a PDF.',
        'Students now take a selfie when they check in by QR. Your own device skips the selfie.',
        'Before you start a QR session you can tick or untick One phone = one student. Untick it only for testing.',
        'After scanning, a student has about 6 minutes to finish checking in, even though the QR code itself changes every 90 seconds.'
      ] },
    { id:'2026-11-06e', date:'6 Nov 2026', title:'Important notice and what is new',
      all:[],
      student:[
        'NOTICE: Please open My Attendance and check that every class you attended is counted. If anything is wrong or missing, use Report an Issue on your dashboard and say the course and the date, so it can be resolved.',
        'Choose your class (A, B or C) the first time you sign in. Your attendance lists are set up from it, and you can change it later.',
        'Your Overview now shows your confirmed class and the class lists you are on.',
        'My Scores now shows what each assessment was marked out of, for example 5 / 10, and your continuous assessment total out of 40 once your lecturer turns it on.',
        'Absent with permission is now recorded and kept in your attendance.',
        'Your place on your class list stays as it is until you choose your class. Choosing No group never removes you from a list.'
      ],
      staff:[
        'NOTICE: Students have been asked to check My Attendance and report any problem through Report an Issue. Their reports arrive in your Reports list.',
        'Class List from Sign-ups builds separate A, B and C attendance lists from registered students.',
        'Connect lists you already uploaded, so a student who picks a class is added to the right lists, and moved with their attendance if they change class.',
        'Class Check shows each student\u2019s list class next to the class they confirmed.',
        'Registered Students now shows each student\u2019s class, with a filter for those who have not chosen yet.',
        'Absent with permission is now saved properly.',
        'Students already on your class lists stay on them until they choose a class, and choosing No group never removes anyone. A student is only moved when a real list for their new class exists.',
        'Assessment upload now reads any Excel or CSV file and finds the headings itself. Download Sheet to Fill gives you a ready sheet with the class list.',
        'Owner tools: Rename a Course changes a course name everywhere at once, with a preview first.',
        'Gradebook: edit a single score, set what each assessment is marked out of, and show the Final out of 40.'
      ] }
  ];
  var isStaffPage=/portal\.html/i.test(location.pathname)||/\/portal\/?$/i.test(location.pathname);
  var role=isStaffPage?'staff':'student';
  function seenId(){ try{ return localStorage.getItem('ceSeenUpdate_'+role)||''; }catch(e){ return ''; } }
  function markSeen(id){ try{ localStorage.setItem('ceSeenUpdate_'+role,id); }catch(e){} }
  function signedIn(){
    var el=document.getElementById(isStaffPage?'loginCard':'signedInCard'); if(!el) return false;
    return isStaffPage ? el.classList.contains('hidden') : !el.classList.contains('hidden');
  }
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function items(n){ return (n.all||[]).concat(n[role]||[]); }
  function unseen(){ var sid=seenId(), out=[]; for(var i=0;i<NOTES.length;i++){ if(NOTES[i].id===sid) break; out.push(NOTES[i]); } return out.slice(0,4).filter(function(n){ return items(n).length; }); }
  function show(arr,force){
    if(!arr||!arr.length||document.getElementById('ceUpdateBox')) return;
    var n=arr[0];
    var o=document.createElement('div'); o.id='ceUpdateBox';
    o.style.cssText='position:fixed;inset:0;z-index:99998;background:rgba(10,20,30,.7);display:flex;align-items:center;justify-content:center;padding:20px;';
    o.innerHTML='<div style="background:var(--card,#fff);color:var(--ink,#111);max-width:460px;width:100%;max-height:85vh;overflow:auto;border-radius:18px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.4);font-family:inherit;">'
      +arr.map(function(m,k){ return '<div style="'+(k?'margin-top:18px;padding-top:14px;border-top:1px solid var(--line,#ddd);':'')+'"><div style="font-size:.78rem;color:var(--muted,#667);margin-bottom:4px;">'+esc(m.date)+'</div>'
      +'<h2 style="margin:0 0 12px;">'+esc(m.title)+'</h2>'
      +'<ul style="margin:0 0 16px;padding-left:20px;line-height:1.5;">'+items(m).map(function(t){ return '<li style="margin-bottom:6px;">'+esc(t)+'</li>'; }).join('')+'</ul></div>'; }).join('')
      +'<button type="button" id="ceUpdateOk" style="width:100%;">Got it</button></div>';
    document.body.appendChild(o);
    document.getElementById('ceUpdateOk').onclick=function(){ markSeen(NOTES[0].id); o.remove(); };
  }
  window.ceShowUpdates=function(){ show(NOTES.filter(function(n){ return items(n).length; }).slice(0,1),true); };
  var tries=0;
  function tick(){
    if(signedIn()){ var u=unseen(); if(u.length) setTimeout(function(){ show(u); },900); return; }
    if(++tries<120) setTimeout(tick,1000);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',tick); else tick();
})();
