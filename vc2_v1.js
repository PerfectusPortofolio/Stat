(function(){
try{
if(window.__vc2){window.__vc2();return;}
var KEY='vc2_bm_v1';
var stopFlag=false;
var CAPS={reddit:5,x:10,email:20,other:10};
var DAY=86400000;
var SOURCES=[['forhire','video editor'],['forhire','editor'],['hireavideoeditor','editor'],['VideoEditingRequests','editor'],['slavelabour','video editor'],['DoneDirtCheap','video editor'],['NewTubers','looking for editor'],['PartneredYoutube','editor'],['youtubers','video editor']];
function blank(){return {leads:{},profile:{},sent:{d:'',counts:{}}};}
function load(){try{var s=JSON.parse(localStorage.getItem(KEY));return (s&&s.leads)?s:blank();}catch(e){return blank();}}
function save(s){try{localStorage.setItem(KEY,JSON.stringify(s));}catch(e){setStatus('Storage full. Copy all leads, then Clear saved.');}}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}
async function waitFor(fn,ms){var t=Date.now();while(Date.now()-t<ms){try{var v=fn();if(v)return v;}catch(e){}await sleep(300);}return null;}
function enc(v){return encodeURIComponent(v);}
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function today(){return new Date().toISOString().slice(0,10);}
function hash(s){var h=0;for(var i=0;i<s.length;i++){h=(h*31+s.charCodeAt(i))|0;}return Math.abs(h).toString(36);}
function usedToday(s,ch){return s.sent.d===today()?(s.sent.counts[ch]||0):0;}
function bump(s,ch){if(s.sent.d!==today())s.sent={d:today(),counts:{}};s.sent.counts[ch]=(s.sent.counts[ch]||0)+1;}
function onReddit(){return /reddit\.com$/.test(location.hostname);}
function onOld(){return location.hostname==='old.reddit.com';}
function ageDays(s){var m=(s||'').match(/(\d+)\s+(minute|hour|day|week|month|year)/i);if(!m)return null;var mult={minute:1/1440,hour:1/24,day:1,week:7,month:30,year:365};return (+m[1])*mult[m[2].toLowerCase()];}
function pageText(){var prev=box.style.display;box.style.display='none';var t=document.body.innerText||'';box.style.display=prev;return t;}
function emailsIn(txt){var seen={};var out=[];var links=Array.prototype.map.call(document.querySelectorAll('a[href^="mailto:"]'),function(a){return a.getAttribute('href').replace(/^mailto:/i,'').split('?')[0];});
 ((txt.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)||[]).concat(links)).forEach(function(e){e=e.trim().toLowerCase();if(seen[e]||/\.(png|jpg|gif|webp|svg)$/.test(e)||/^(noreply|no-reply|support|abuse|privacy|press)@/.test(e))return;seen[e]=1;out.push(e);});
 return out;}
function scorePost(d){
 var title=(d.title||'').toLowerCase();
 var t=title+' '+(d.selftext||'').toLowerCase();
 if(/\[for hire\]|\(for hire\)|for hire|\bi will\b|\bi am a\b|\bi'm a\b|my services|available for/.test(title))return -9;
 var s=0;
 if(/\[hiring\]|\(hiring\)|\bhiring\b|\bwanted\b|looking for|\bneed(ed)?\b|\bseeking\b/.test(title))s+=3;
 if(/video editor|video editing|editor|editing/.test(t))s+=2;
 if(/youtube|shorts|reels|tiktok|podcast|vsl|\bads?\b|commercial|promo|course|documentary|wedding/.test(t))s+=1;
 if(/\$\s?[0-9]|paid|budget|per video|\/video|\brate\b|compensat/.test(t))s+=2;
 if(/ongoing|long.?term|retainer|weekly|monthly|multiple videos|regular/.test(t))s+=2;
 if(/unpaid|exposure|rev.?share|for free|\bcollab\b|volunteer/.test(t))s-=4;
 var hrs=(Date.now()-d.created_utc*1000)/3600000;
 if(hrs<24)s+=2;else if(hrs<72)s+=1;
 return s;
}
function nicheOf(l){
 var t=(l.title+' '+(l.snippet||'')).toLowerCase();
 if(/shorts|reels|tiktok|short.?form/.test(t))return 'short-form content (Shorts, Reels, TikTok) with captions and tight pacing';
 if(/podcast/.test(t))return 'podcast episodes and clips';
 if(/\bads?\b|commercial|promo|vsl|sales/.test(t))return 'ads and promos built to convert';
 if(/wedding/.test(t))return 'wedding films';
 if(/youtube|long.?form|vlog/.test(t)||l.kind==='yt')return 'YouTube videos with a focus on retention';
 return 'video editing across most formats';
}
function emailOf(l){return l.kind==='email'?l.author:((l.extra&&l.extra.email)||'');}
function chanOf(l){if(l.kind==='reddit')return 'reddit';if(l.kind==='x')return 'x';if(emailOf(l))return 'email';return 'other';}
function build(l,s,note,follow,asEmail){
 var p=s.profile||{};
 var title=(l.title||'').replace(/\[[^\]]*\]/g,'').trim().slice(0,70);
 var link=p.link?(' My work: '+p.link):'';
 var proof=p.proof?(' '+p.proof):'';
 var sig='\n\nThanks,\n'+(p.name||'');
 var opt=asEmail?'\nIf this is not relevant, reply "no" and I will not email again.':'';
 var subject,body;
 if(follow){
  subject='Re: '+(l.kind==='reddit'||l.kind==='page'||l.kind==='x'?('"'+title.slice(0,40)+'"'):'my earlier note');
  body='Hi, just bumping my earlier message once in case it got buried. No worries at all if it is not a fit. The offer of a free 20-second sample edit from one of your clips still stands.'+link+opt+sig;
 }else if(l.kind==='reddit'||l.kind==='page'||l.kind==='x'){
  var open=pick(['Hi, I saw your post "'+title+'" and wanted to reach out.','Hello, your post "'+title+'" caught my eye, so I am reaching out directly.','Hey, I read your post "'+title+'" and think I can help.']);
  subject='Video editor for "'+title.slice(0,40)+'"';
  body=open+' I edit '+nicheOf(l)+'.'+proof+link+' If you send the length, style, deadline and budget, I can give you a quick quote. I am also happy to do a free 20-second sample edit from one of your clips so you can judge the fit.'+opt+sig;
 }else{
  var t0=(l.extra&&l.extra.titles&&l.extra.titles[0])||title;
  var hook=l.kind==='yt'?('I came across your video "'+String(t0).slice(0,70)+'"'+((l.extra&&l.extra.recent>=4)?' and saw that you upload regularly':'')+'.'):'I came across your work and wanted to introduce myself.';
  var nt=note?(' One thing I noticed: '+note.replace(/\.+$/,'')+'.'):'';
  subject=l.kind==='yt'?'Quick intro from a video editor':'Video editing help';
  body=hook+nt+' I am a freelance video editor who works on '+nicheOf(l)+'.'+proof+link+' If editing is something you could use help with, I can do a free 20-second sample from one of your clips so you can judge the fit.'+opt+sig;
 }
 return {subject:subject,body:body};
}
function shortX(l,s){
 var p=s.profile||{};
 var m='Hi! I edit '+nicheOf(l).split(' with ')[0]+'. Happy to send a free 20s sample from one of your clips.'+(p.link?(' '+p.link):'')+' DM open if easier.';
 return m.slice(0,270);
}
function composeUrl(l,m,rel){return (rel?'':'https://www.reddit.com')+'/message/compose/?to='+enc(l.author)+'&subject='+enc(m.subject)+'&message='+enc(m.body);}
var box,statusEl,frameBox,out,listEl,nameIn,linkIn,proofIn,minIn,capIn,nicheIn,mqIn;
function setStatus(t){statusEl.textContent=t;}
function saveProfile(){var s=load();s.profile={name:nameIn.value.trim(),link:linkIn.value.trim(),proof:proofIn.value.trim()};save(s);}
function ageText(ms){var h=Math.round((Date.now()-ms)/3600000);return h<48?(h+'h'):(Math.round(h/24)+'d');}
function capOk(s,ch){var u=usedToday(s,ch);return u<CAPS[ch]||confirm('You have already done '+u+' '+ch+' messages today (safe limit '+CAPS[ch]+'). Going over raises the risk of bans or spam flags. Continue anyway?');}
function openLead(l,follow){
 var s=load();var ch=chanOf(l);
 if(!capOk(s,ch))return;
 var note='';
 if(!follow&&(l.kind==='yt'||l.kind==='email'||l.kind==='manual')){
  var r=prompt('Open their page, watch about 30 seconds, and type ONE true thing you noticed (optional, blank is fine). Cancel to stop.','');
  if(r===null)return;
  note=r.trim();
 }
 var em=emailOf(l);var m=build(l,s,note,follow,!!em);
 if(l.kind==='reddit'){window.open(composeUrl(l,m,false),'_blank');}
 else if(l.kind==='x'){var idm=l.id.replace(/^x/,'');window.open('https://x.com/intent/post?in_reply_to='+idm+'&text='+enc(shortX(l,s)),'_blank');}
 else if(em){window.open('https://mail.google.com/mail/?view=cm&fs=1&to='+enc(em)+'&su='+enc(m.subject)+'&body='+enc(m.body),'_blank');}
 else{try{navigator.clipboard.writeText(m.body);}catch(e){}window.open(l.url,'_blank');setStatus('Message copied. Paste it into their DM, contact form or comments.');}
 s=load();
 if(follow){s.leads[l.id].state='followed';s.leads[l.id].followedAt=Date.now();}
 else{s.leads[l.id].state='contacted';s.leads[l.id].contactedAt=Date.now();if(note)s.leads[l.id].note=note;}
 bump(s,ch);save(s);render();
}
function setState(id,st){var s=load();if(s.leads[id]){s.leads[id].state=st;save(s);}render();}
function section(title,list,btns,max){
 if(!list.length)return;
 var h=document.createElement('div');h.style.cssText='margin:10px 0 4px;font-weight:bold;';h.textContent=title+' ('+list.length+')';listEl.appendChild(h);
 list.slice(0,max||15).forEach(function(l){
  var row=document.createElement('div');row.style.cssText='border:1px solid #999;padding:6px;margin:4px 0;';
  var tt=document.createElement('div');
  tt.textContent='['+l.score+'] '+l.kind+' | '+(l.kind==='reddit'?('r/'+l.sub+' u/'+l.author):l.author)+' | '+ageText(l.created)+' | '+(l.title||'').slice(0,100)+(emailOf(l)?' | has email':'');
  row.appendChild(tt);
  btns(l).forEach(function(b){row.appendChild(mk(b[0],b[1]));});
  listEl.appendChild(row);
 });
}
function render(){
 var s=load();var min=parseFloat(minIn.value)||5;var now=Date.now();
 var arr=Object.keys(s.leads).map(function(k){return s.leads[k];});
 var ready=arr.filter(function(l){return l.state==='new'&&l.score>=min;}).sort(function(a,b){return b.score-a.score;});
 var due=arr.filter(function(l){return l.state==='contacted'&&now-(l.contactedAt||0)>3*DAY;});
 var active=arr.filter(function(l){return (l.state==='contacted'&&now-(l.contactedAt||0)<=3*DAY)||l.state==='followed';});
 var replied=arr.filter(function(l){return l.state==='replied';});
 var won=arr.filter(function(l){return l.state==='won';}).length;
 var c=s.sent.d===today()?s.sent.counts:{};
 listEl.innerHTML='';
 var head=document.createElement('div');head.style.cssText='margin:6px 0;font-weight:bold;';
 head.textContent=ready.length+' ready | '+due.length+' follow-ups due | '+active.length+' waiting | '+replied.length+' replied | '+won+' won | today: reddit '+(c.reddit||0)+'/'+CAPS.reddit+', X '+(c.x||0)+'/'+CAPS.x+', email '+(c.email||0)+'/'+CAPS.email+', other '+(c.other||0)+'/'+CAPS.other;
 listEl.appendChild(head);
 section('Replied - move these forward',replied,function(l){return [['Won',function(){setState(l.id,'won');}],['Dead',function(){setState(l.id,'dead');}],['Open',function(){window.open(l.url,'_blank');}]];});
 section('Follow-ups due (once only)',due,function(l){return [['Follow up',function(){openLead(l,true);}],['Replied',function(){setState(l.id,'replied');}],['Dead',function(){setState(l.id,'dead');}]];});
 section('Ready to contact',ready,function(l){var b=[['Message',function(){openLead(l,false);}],['Skip',function(){setState(l.id,'skipped');}]];if(l.url)b.push(['Open',function(){window.open(l.url,'_blank');}]);return b;},20);
 section('Waiting for replies',active,function(l){return [['Replied',function(){setState(l.id,'replied');}],['Dead',function(){setState(l.id,'dead');}]];},10);
}
async function getJson(path){
 var base=onReddit()?'':'https://www.reddit.com';
 var r=await fetch(base+path,{credentials:'omit'});
 if(!r.ok)throw new Error('HTTP '+r.status);
 return r.json();
}
async function findReddit(){
 saveProfile();stopFlag=false;
 try{if(navigator.wakeLock)navigator.wakeLock.request('screen').catch(function(){});}catch(e){}
 var added=0,seen=0,fails=0;
 for(var i=0;i<SOURCES.length;i++){
  if(stopFlag){setStatus('Stopped.');render();return;}
  var sub=SOURCES[i][0],q=SOURCES[i][1];
  setStatus('Reddit '+(i+1)+' of '+SOURCES.length+': r/'+sub+' ('+q+')');
  try{
   var j=await getJson('/r/'+sub+'/search.json?q='+enc(q)+'&restrict_sr=1&sort=new&t=week&limit=50&raw_json=1');
   var kids=(j&&j.data&&j.data.children)||[];var st=load();
   kids.forEach(function(c){
    var d=c.data;seen++;
    if(!d||st.leads[d.id]||d.stickied||d.author==='[deleted]'||d.author==='AutoModerator')return;
    var sc=scorePost(d);if(sc<1)return;
    st.leads[d.id]={id:d.id,kind:'reddit',sub:d.subreddit,author:d.author,title:d.title,snippet:(d.selftext||'').slice(0,400),url:'https://www.reddit.com'+d.permalink,created:d.created_utc*1000,score:sc,state:'new',foundAt:Date.now()};
    added++;
   });
   save(st);
  }catch(e){fails++;setStatus('r/'+sub+' failed: '+e.message+'. Continuing.');await sleep(2000);}
  await sleep(2500+Math.random()*1500);
 }
 render();
 setStatus('Reddit done. '+seen+' posts checked, '+added+' new leads, '+fails+' sources failed.'+(fails>=SOURCES.length?' Open reddit.com first and run the tool from there.':''));
}
function scanX(st){
 var n=0;
 Array.prototype.forEach.call(document.querySelectorAll('article[data-testid="tweet"]'),function(a){
  var te=a.querySelector('[data-testid="tweetText"]');var tm=a.querySelector('time');
  if(!te||!tm)return;
  var lk=tm.closest('a');if(!lk)return;
  var m=(lk.getAttribute('href')||'').match(/^\/([^\/]+)\/status\/([0-9]+)/);if(!m)return;
  var id='x'+m[2];if(st.leads[id])return;
  var text=te.innerText;var created=new Date(tm.getAttribute('datetime')).getTime();
  var sc=scorePost({title:text,selftext:'',created_utc:created/1000});
  if(sc<1)return;
  st.leads[id]={id:id,kind:'x',sub:'x',author:m[1],title:text.replace(/\s+/g,' ').slice(0,200),snippet:text.slice(0,400),url:'https://x.com/'+m[1]+'/status/'+m[2],created:created,score:sc,state:'new',foundAt:Date.now()};
  n++;
 });
 return n;
}
async function runX(){
 if(!/(^|\.)(x|twitter)\.com$/.test(location.hostname)){setStatus('Open an X search page first (tap X: people hiring), then tap this again.');return;}
 stopFlag=false;var total=0;
 for(var i=0;i<25;i++){
  if(stopFlag)break;
  var st=load();total+=scanX(st);save(st);
  setStatus('Scanning X, step '+(i+1)+' of 25. '+total+' new leads.');
  window.scrollBy(0,1400);await sleep(1300+Math.random()*600);
 }
 render();setStatus('X scan done. '+total+' new leads.'+(total?'':' If zero, the page may not be a search results page, or X changed its layout.'));
}
function runYT(){
 if(!/youtube\.com$/.test(location.hostname)){setStatus('Open a YouTube search page or a channel Videos page first, then tap this again.');return;}
 var st=load();var n=0;var path=location.pathname;
 function put(nl){var old=st.leads[nl.id];if(old){nl.state=old.state;nl.contactedAt=old.contactedAt;nl.foundAt=old.foundAt;nl.note=old.note;}else n++;st.leads[nl.id]=nl;}
 if(/^\/results/.test(path)){
  Array.prototype.forEach.call(document.querySelectorAll('ytd-video-renderer'),function(v){
   var t=v.querySelector('#video-title');var ch=v.querySelector('ytd-channel-name a');
   if(!t||!ch)return;
   var h=((ch.getAttribute('href')||'').match(/\/@[^\/?]+|\/channel\/[^\/?]+/)||[])[0];if(!h)return;
   var id='y'+h;if(st.leads[id])return;
   var tt=t.textContent.trim().slice(0,120);
   put({id:id,kind:'yt',sub:'youtube',author:ch.textContent.trim(),title:tt,url:'https://www.youtube.com'+h,extra:{titles:[tt],recent:0,subs:'',email:''},created:Date.now(),score:4,state:'new',foundAt:Date.now()});
  });
  save(st);render();setStatus(n+' channels saved from this search. Open the best ones and tap this again on their Videos tab to add subscriber count, upload pace and email.');return;
 }
 var h=(path.match(/^\/@[^\/]+|^\/channel\/[^\/]+/)||[])[0];
 if(!h){setStatus('This is not a search or channel page.');return;}
 var seenT={},titles=[],recent=0;
 Array.prototype.forEach.call(document.querySelectorAll('a[href*="/watch?v="]'),function(a){
  var t=(a.getAttribute('title')||a.textContent||'').trim();
  if(t.length<8||/^[0-9:\s]+$/.test(t)||seenT[t]||titles.length>=8)return;
  var c=a.closest('ytd-rich-item-renderer,yt-lockup-view-model,ytd-grid-video-renderer,ytd-video-renderer')||a.parentElement;
  var tx=c?c.innerText:'';
  if(!/views?|ago/i.test(tx))return;
  seenT[t]=1;titles.push(t.slice(0,120));
  var ad=ageDays(tx);if(ad!==null&&ad<=30)recent++;
 });
 var bt=pageText();
 var nm=((document.querySelector('yt-page-header-renderer h1, ytd-channel-name #text, h1')||{}).textContent||h).trim();
 var sm=bt.match(/([0-9][0-9.,]*)\s?([KMB]?)\s+subscribers/i);
 var subs=sm?parseFloat(sm[1].replace(/,/g,''))*({'':1,K:1e3,M:1e6,B:1e9}[sm[2].toUpperCase()]):null;
 var em=emailsIn(bt);
 var sc=5;
 if(recent>=4)sc+=2;
 if(subs!==null){if(subs>=3000&&subs<=300000)sc+=2;else if(subs>1e6)sc-=4;else if(subs<1000)sc-=2;}
 put({id:'y'+h,kind:'yt',sub:'youtube',author:nm,title:titles[0]||'',url:'https://www.youtube.com'+h,extra:{titles:titles,recent:recent,subs:sm?sm[0]:'',email:em[0]||''},created:Date.now(),score:sc,state:'new',foundAt:Date.now()});
 save(st);render();
 setStatus('Saved '+nm+': '+(sm?sm[0]:'subs unknown')+', '+recent+' uploads in 30 days, '+titles.length+' recent titles read'+(em[0]?(', email '+em[0]):', no email visible (use their links or the manual queue)')+'.');
}
function runPage(){
 var st=load();var n=0;var seenTx={};
 Array.prototype.forEach.call(document.querySelectorAll('article,[role="article"],li,[class*="post"],[class*="job"],[class*="card"]'),function(el){
  if(box.contains(el))return;
  var tx=(el.innerText||'').trim();
  if(tx.length<60||tx.length>2000)return;
  var key=tx.slice(0,80);if(seenTx[key])return;seenTx[key]=1;
  var sc=scorePost({title:tx.slice(0,200),selftext:tx,created_utc:Date.now()/1000});
  if(sc<4)return;
  var a=el.querySelector('a[href]');var id='p'+hash(key);
  if(st.leads[id])return;
  var em=emailsIn(tx);
  st.leads[id]={id:id,kind:'page',sub:location.hostname,author:location.hostname,title:tx.replace(/\s+/g,' ').slice(0,160),snippet:tx.slice(0,400),url:a?a.href:location.href,extra:{email:em[0]||''},created:Date.now(),score:sc,state:'new',foundAt:Date.now()};
  n++;
 });
 save(st);render();setStatus(n+' possible job posts found on this page (LinkedIn, Facebook groups, Upwork, Contra, forums). Scroll down and tap again to catch more.');
}
function runEmails(){
 var em=emailsIn(pageText());var st=load();var n=0;
 em.forEach(function(e){var id='e:'+e;if(st.leads[id])return;st.leads[id]={id:id,kind:'email',sub:'web',author:e,title:(document.title||location.hostname).slice(0,100),snippet:'',url:location.href,created:Date.now(),score:5,state:'new',foundAt:Date.now()};n++;});
 save(st);render();setStatus(n?(n+' email(s) saved.'):'No new emails on this page.');
}
function addManual(){
 var lines=mqIn.value.split(String.fromCharCode(10)).map(function(x){return x.trim();}).filter(Boolean);
 var st=load();var n=0;
 lines.forEach(function(x){
  var id='m'+hash(x);if(st.leads[id])return;
  var url=/^https?:/i.test(x)?x:('https://www.instagram.com/'+x.replace(/^@/,'')+'/');
  st.leads[id]={id:id,kind:'manual',sub:'manual',author:x,title:x,snippet:'',url:url,extra:{email:/@.+\./.test(x)&&!/^@/.test(x)&&!/^https?:/i.test(x)?x:''},created:Date.now(),score:5,state:'new',foundAt:Date.now()};
  n++;
 });
 save(st);mqIn.value='';render();setStatus(n+' added to the queue.');
}
async function autoSend(l,m){
 var fr=document.createElement('iframe');
 fr.src=composeUrl(l,m,true);
 fr.style.cssText='width:100%;height:260px;border:1px solid gray;background:white;';
 frameBox.innerHTML='';frameBox.appendChild(fr);
 var f=await waitFor(function(){var d=fr.contentDocument;return d&&d.querySelector('textarea[name=text]');},30000);
 if(!f)return 'NO_FORM';
 var d=fr.contentDocument;
 if(!f.value.trim()){f.value=m.body;f.dispatchEvent(new Event('input',{bubbles:true}));}
 if(d.querySelector('.capimage,input[name=captcha],iframe[src*=captcha]'))return 'CAPTCHA';
 var btn=Array.prototype.slice.call(d.querySelectorAll('button,input[type=submit]')).filter(function(b){return /send/i.test(b.textContent||b.value||'');})[0];
 if(!btn)return 'NO_SEND_BUTTON';
 btn.click();
 var res=await waitFor(function(){var dd=fr.contentDocument;var tx=(dd&&dd.body&&dd.body.innerText)||'';return (/delivered|message sent/i.test(tx)||/too much|ratelimit|try again in/i.test(tx))?tx:null;},20000);
 frameBox.innerHTML='';
 if(!res)return 'UNCONFIRMED';
 return /delivered|message sent/i.test(res)?'SENT':'RATE_LIMIT';
}
async function autoRun(){
 saveProfile();
 if(!onOld()){setStatus('Auto-send only works on old.reddit.com. Open old.reddit.com, log in, run the tool there, then tap Reddit auto-send.');return;}
 var cap=parseInt(capIn.value,10)||5;var min=parseFloat(minIn.value)||5;
 stopFlag=false;
 try{if(navigator.wakeLock)navigator.wakeLock.request('screen').catch(function(){});}catch(e){}
 while(true){
  if(stopFlag){setStatus('Stopped.');render();return;}
  var s=load();
  if(usedToday(s,'reddit')>=cap){setStatus('Daily cap reached ('+cap+'). Come back tomorrow.');render();return;}
  var next=Object.keys(s.leads).map(function(k){return s.leads[k];}).filter(function(l){return l.kind==='reddit'&&l.state==='new'&&l.score>=min;}).sort(function(a,b){return b.score-a.score;})[0];
  if(!next){setStatus('No more Reddit leads above the minimum score.');render();return;}
  setStatus('Sending to u/'+next.author+' ('+(usedToday(s,'reddit')+1)+' of '+cap+' today)');
  var r=await autoSend(next,build(next,s,'',false,false));
  s=load();
  if(r==='SENT'){s.leads[next.id].state='contacted';s.leads[next.id].contactedAt=Date.now();s.leads[next.id].via='auto';bump(s,'reddit');save(s);render();}
  else if(r==='CAPTCHA'||r==='RATE_LIMIT'||r==='NO_SEND_BUTTON'||r==='NO_FORM'){s.leads[next.id].note=r;save(s);setStatus('Stopped: '+r+'. Use the Message buttons for the rest.');render();return;}
  else{s.leads[next.id].state='check';s.leads[next.id].note=r;save(s);render();setStatus('Could not confirm delivery to u/'+next.author+'. Check your Reddit sent messages. Stopping.');return;}
  var wait=Math.round(120+Math.random()*120);
  for(var k=wait;k>0;k--){if(stopFlag){setStatus('Stopped.');return;}setStatus('Sent. Next message in '+k+'s (Stop to cancel).');await sleep(1000);}
 }
}
function q(v){var Q=String.fromCharCode(34);return Q+String(v==null?'':v).split(Q).join(Q+Q)+Q;}
function csvOf(rows){return rows.map(function(r){return r.map(q).join(',');}).join(String.fromCharCode(10));}
function leadsCsv(){
 var s=load();
 var rows=[['id','kind','source','contact','title','url','score','state','via','note','posted']];
 Object.keys(s.leads).forEach(function(k){var l=s.leads[k];rows.push([l.id,l.kind,l.sub,l.author,l.title,l.url,l.score,l.state,l.via||'',l.note||'',new Date(l.created).toISOString()]);});
 return csvOf(rows);
}
function mailerCsv(){
 var s=load();var min=parseFloat(minIn.value)||5;var rows=[['to','subject','body','status']];var n=0;
 Object.keys(s.leads).forEach(function(k){
  var l=s.leads[k];var em=emailOf(l);
  if(!em||l.state!=='new'||l.score<min)return;
  var m=build(l,s,'',false,true);rows.push([em,m.subject,m.body,'']);l.state='queued';n++;
 });
 save(s);render();
 return {csv:csvOf(rows),n:n};
}
function showOut(text,msg){out.style.display='block';out.value=text;try{navigator.clipboard.writeText(text).then(function(){setStatus(msg+' (copied)');},function(){out.select();setStatus(msg+'. Copy from the box.');});}catch(e){out.select();setStatus(msg+'. Copy from the box.');}}
function mergeIn(){
 var inc;try{inc=JSON.parse(out.value);}catch(e){setStatus('Paste the copied leads into the box first, then tap Merge.');return;}
 if(!inc||!inc.leads){setStatus('That does not look like copied leads.');return;}
 var s=load();var n=0;
 Object.keys(inc.leads).forEach(function(k){var a=inc.leads[k],b=s.leads[k];if(!b){s.leads[k]=a;n++;}else if(b.state==='new'&&a.state!=='new'){s.leads[k]=a;n++;}});
 if(!s.profile.name&&inc.profile)s.profile=inc.profile;
 save(s);render();setStatus('Merged '+n+' leads.');
}
function dl(name,text,type){var bl=new Blob([text],{type:type});var a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download=name;document.body.appendChild(a);a.click();a.remove();}
function mk(label,fn){var b=document.createElement('button');b.textContent=label;b.style.cssText='margin:3px 3px 0 0;padding:8px 10px;font-size:14px;';b.onclick=fn;return b;}
function field(ph,val){var i=document.createElement('input');i.placeholder=ph;i.value=val||'';i.style.cssText='display:block;width:94vw;box-sizing:border-box;margin:3px 0;padding:6px;';i.onchange=saveProfile;return i;}
function lbl(t){var s=document.createElement('div');s.style.cssText='margin:10px 0 2px;font-weight:bold;';s.textContent=t;return s;}
var SEARCHES=[
 ['X: people hiring',function(){return 'https://x.com/search?q='+enc('("need a video editor" OR "looking for a video editor" OR "hiring a video editor" OR "need an editor") -filter:replies')+'&f=live';}],
 ['X: shorts editors',function(){return 'https://x.com/search?q='+enc('("short form editor" OR "shorts editor" OR "reels editor") (hiring OR need OR looking) -filter:replies')+'&f=live';}],
 ['YouTube: niche',function(){return 'https://www.youtube.com/results?search_query='+enc(nicheIn.value||'vlog')+'&sp=CAI%253D';}],
 ['LinkedIn posts',function(){return 'https://www.google.com/search?q='+enc('site:linkedin.com/posts "hiring" "video editor"')+'&tbs=qdr:w';}],
 ['Facebook posts',function(){return 'https://www.facebook.com/search/posts?q='+enc('need video editor');}],
 ['Upwork jobs',function(){return 'https://www.upwork.com/nx/search/jobs/?q=video%20editor&sort=recency';}],
 ['Reddit r/forhire',function(){return 'https://www.reddit.com/r/forhire/new/';}]
];
var p0=load().profile||{};
box=document.createElement('div');
box.style.cssText='position:fixed;left:0;top:0;right:0;bottom:0;overflow:auto;background:white;color:black;z-index:2147483647;padding:8px;font:14px sans-serif;';
statusEl=document.createElement('div');statusEl.style.cssText='font-weight:bold;margin-bottom:6px;';
statusEl.textContent='Ready. '+Object.keys(load().leads).length+' leads saved on this site.';
nameIn=field('Your name',p0.name);
linkIn=field('Portfolio link (unlisted YouTube playlist, Drive folder, free site)',p0.link);
proofIn=field('One TRUE line of proof, e.g. Edited 40+ videos for creators',p0.proof);
nicheIn=document.createElement('input');nicheIn.placeholder='Niche for YouTube search, e.g. gaming commentary';nicheIn.style.cssText='display:block;width:94vw;box-sizing:border-box;margin:3px 0;padding:6px;';
minIn=document.createElement('input');minIn.type='number';minIn.value='5';minIn.style.cssText='width:44px;margin:3px 3px 0 0;padding:6px;';minIn.onchange=render;
capIn=document.createElement('input');capIn.type='number';capIn.value='5';capIn.style.cssText='width:44px;margin:3px 3px 0 0;padding:6px;';
mqIn=document.createElement('textarea');mqIn.placeholder='Instagram handles, profile URLs or emails, one per line';mqIn.style.cssText='width:94vw;height:60px;box-sizing:border-box;';
out=document.createElement('textarea');out.style.cssText='width:94vw;height:70px;box-sizing:border-box;display:none;margin-top:6px;';
frameBox=document.createElement('div');frameBox.style.cssText='margin-top:6px;';
listEl=document.createElement('div');
box.appendChild(statusEl);box.appendChild(nameIn);box.appendChild(linkIn);box.appendChild(proofIn);
var l1=document.createElement('span');l1.textContent=' min score: ';
var l2=document.createElement('span');l2.textContent=' Reddit auto-send cap/day: ';
box.appendChild(l1);box.appendChild(minIn);box.appendChild(l2);box.appendChild(capIn);
box.appendChild(lbl('1. Open a source (opens in a new tab; run this tool again there)'));
box.appendChild(nicheIn);
SEARCHES.forEach(function(x){box.appendChild(mk(x[0],function(){window.open(x[1](),'_blank');}));});
box.appendChild(lbl('2. Scan the page you are on'));
[mk('Reddit scan',findReddit),mk('X scan (auto-scroll)',runX),mk('YouTube scan',runYT),mk('Job-post scan (any site)',runPage),mk('Grab emails',runEmails),mk('Stop',function(){stopFlag=true;})].forEach(function(b){box.appendChild(b);});
box.appendChild(lbl('3. Instagram and anything else'));
box.appendChild(mqIn);box.appendChild(mk('Add to queue',addManual));
box.appendChild(lbl('4. Send, export, move leads between sites'));
[mk('Reddit auto-send',autoRun),
 mk('Export email queue',function(){var r=mailerCsv();showOut(r.csv,r.n+' emails queued for the Google Sheet mailer');}),
 mk('Copy all leads',function(){showOut(JSON.stringify(load()),'All leads copied');}),
 mk('Merge pasted leads',mergeIn),
 mk('Download CSV',function(){dl('vc2_leads.csv',leadsCsv(),'text/csv');}),
 mk('Clear saved',function(){if(confirm('Delete all saved leads on this site?')){localStorage.removeItem(KEY);setStatus('Cleared.');render();}}),
 mk('Close',function(){stopFlag=true;box.style.display='none';})].forEach(function(b){box.appendChild(b);});
box.appendChild(out);box.appendChild(frameBox);box.appendChild(listEl);
document.body.appendChild(box);
window.__vc2=function(){box.style.display='block';render();};
render();
}catch(e){alert('VC2 error: '+e.message);}
})();
