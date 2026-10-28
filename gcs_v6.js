(function(){
try{alert('GCS v6.2 loaded');
if(window.__gcs){window.__gcs();return;}
var KEY='gcs_bm_v1';var VERSION='gcs-v6.2';
var BTN='button[data-op=event-detail-market-stats-button]';
var MATCH='.sr-last-matches__match';
var stopFlag=false;var skipFlag=false;var timedOut=false;
function load(){try{return JSON.parse(localStorage.getItem(KEY))||{done:{}};}catch(e){return {done:{}};}}
function save(s){localStorage.setItem(KEY,JSON.stringify(s));}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}
async function waitFor(fn,ms){var t=Date.now();while(Date.now()-t<ms&&!skipFlag){try{var v=fn();if(v)return v;}catch(e){}await sleep(300);}return null;}
function idOf(u){var m=decodeURIComponent(u||'').match(/sr:match:([0-9]+)/);return m?m[1]:null;}
function teams(u){var p=decodeURIComponent(u).split('?')[0].split('/').filter(Boolean);var s=p[p.length-2]||'';var x=s.split('_vs_');return [(x[0]||'').replace(/_/g,' '),(x[1]||'').replace(/_/g,' ')];}
function parseRes(wdl,raw,opp){
 var m=(raw||'').match(/([0-9]+)[^0-9]+([0-9]+)/);var pens=/[A-Za-z]/.test(raw||'');
 if(!m)return {wdl:wdl,gf:null,ga:null,opp:opp,pens:pens};
 var a=+m[1],b=+m[2],hi=Math.max(a,b),lo=Math.min(a,b),gf=null,ga=null;
 if(wdl==='W'){gf=hi;ga=lo;}else if(wdl==='L'){gf=lo;ga=hi;}else if(wdl==='D'){gf=a;ga=b;}
 return {wdl:wdl,gf:gf,ga:ga,opp:opp,pens:pens};
}
function readForm(doc){
 var out={left:[],right:[]};
 var blocks=Array.prototype.slice.call(doc.querySelectorAll('.sr-teamform__lastXTeam'));
 blocks.forEach(function(b,i){
  var side=b.className.indexOf('srm-left')>=0?'left':(b.className.indexOf('srm-right')>=0?'right':(i===0?'left':'right'));
  Array.prototype.forEach.call(b.querySelectorAll(MATCH),function(m){
   function t(s){var e=m.querySelector(s);return e?e.textContent.trim():'';}
   out[side].push(parseRes(t('.sr-last-matches__wdl'),t('.sr-last-matches__result'),t('.sr-last-matches__team-full')||t('.sr-last-matches__team')));
  });
 });
 return out;
}
function cell(r){return r?(r.wdl+' '+r.gf+'-'+r.ga+' '+r.opp+(r.pens?'*':'')):'';}
function q(v){var Q=String.fromCharCode(34);return Q+String(v==null?'':v).split(Q).join(Q+Q)+Q;}
function toCsv(done){
 var head=['id','home','away','league','status','via','note','h1','h2','h3','h4','h5','a1','a2','a3','a4','a5'];
 var rows=Object.keys(done).map(function(k){
  var r=done[k];var c=[r.id,r.home,r.away,r.league||'',r.status,r.via||'',r.note||''];
  for(var i=0;i<5;i++)c.push(cell(r.h[i]));
  for(var j=0;j<5;j++)c.push(cell(r.a[j]));
  return c.map(q).join(',');
 });
 return [head.join(',')].concat(rows).join(String.fromCharCode(10));
}
var box,statusEl,frameBox,out,ta;
function setStatus(t){statusEl.textContent=t;statusEl.style.background=/^Tap/.test(t)?'yellow':'none';statusEl.style.padding=/^Tap/.test(t)?'6px':'0';}
function tap(el){
 var d=el.ownerDocument,w=d.defaultView,r=el.getBoundingClientRect();
 var x=r.left+r.width/2,y=r.top+r.height/2;
 var base={bubbles:true,cancelable:true,view:w,clientX:x,clientY:y,button:0};
 function fire(type,C,extra){try{el.dispatchEvent(new C(type,Object.assign({},base,extra)));}catch(e){}}
 function touch(type,ended){try{var t=new w.Touch({identifier:7,target:el,clientX:x,clientY:y});
  el.dispatchEvent(new w.TouchEvent(type,{bubbles:true,cancelable:true,touches:ended?[]:[t],targetTouches:ended?[]:[t],changedTouches:[t]}));}catch(e){}}
 fire('pointerover',w.PointerEvent,{pointerType:'touch',isPrimary:true});
 fire('pointerdown',w.PointerEvent,{pointerType:'touch',isPrimary:true,buttons:1});
 touch('touchstart',false);
 fire('pointerup',w.PointerEvent,{pointerType:'touch',isPrimary:true});
 touch('touchend',true);
 fire('mousedown',w.MouseEvent,{buttons:1});
 fire('mouseup',w.MouseEvent,{});
 fire('click',w.MouseEvent,{});
}
function tokensOf(doc){
 var out=[];var roots=doc.querySelectorAll('[data-sr-widget]');
 for(var i=0;i<roots.length;i++){
  var w=doc.createTreeWalker(roots[i],4,null);var n;
  while((n=w.nextNode())){
   var p=n.parentElement;if(p&&/^(SCRIPT|STYLE)$/.test(p.tagName))continue;
   var t=n.nodeValue.trim();if(t)out.push(t);
  }
 }
 return out;
}
var EXTRA_TABS=['H2H(New)','Comparison','Lineups','Standings','Commentary','Probability'];
async function stable(doc){
 var prev=tokensOf(doc).join('~');var same=0;
 for(var i=0;i<14&&!skipFlag;i++){
  await sleep(500);
  var cur=tokensOf(doc).join('~');
  if(cur===prev){same++;if(same>=2)break;}else{same=0;prev=cur;}
 }
 return tokensOf(doc);
}
async function readTab(doc,label,prevSig){
 var nav=navItem(doc,label);
 if(!nav)return {status:'NO_TAB',tokens:[]};
 tap(nav);
 var got=await waitFor(function(){var t=tokensOf(doc);return (t.length>0&&t.join('~')!==prevSig)?t:null;},12000);
 var tk=await stable(doc);
 return {status:got?'OK':'UNCHANGED',tokens:tk};
}
function startInfo(doc){
 var tk=[];var w=doc.createTreeWalker(doc.body,4,null);var n;
 while((n=w.nextNode())&&tk.length<200){
  var p=n.parentElement;if(p&&/^(SCRIPT|STYLE)$/.test(p.tagName))continue;
  var t=n.nodeValue.trim();if(t)tk.push(t);
 }
 var MON={Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
 for(var i=0;i<tk.length-1;i++){
  var m=tk[i].match(/^([0-9]{1,2}) ([A-Za-z]{3}), [A-Za-z]+$/);
  if(m&&/^[0-9]{2}:[0-9]{2}$/.test(tk[i+1])&&MON[m[2]]!==undefined){
   var now=new Date();var hm=tk[i+1].split(':');
   var d=new Date(now.getFullYear(),MON[m[2]],+m[1],+hm[0],+hm[1]);
   if(d.getTime()-now.getTime()>180*86400000)d=new Date(now.getFullYear()-1,MON[m[2]],+m[1],+hm[0],+hm[1]);
   if(now.getTime()-d.getTime()>180*86400000)d=new Date(now.getFullYear()+1,MON[m[2]],+m[1],+hm[0],+hm[1]);
   return {started:d.getTime()<=now.getTime(),text:tk[i]+' '+tk[i+1]};
  }
 }
 return {started:false,text:''};
}
function sumAvg(a,k){var s=0,n=0;a.slice(0,5).forEach(function(x){if(x[k]!==null&&x[k]!==undefined){s+=x[k];n++;}});return n?s/n:null;}
function gcsGate(rec,opts){
 var h=rec.h.slice(0,5),a=rec.a.slice(0,5);
 var full=function(r){return r.length>=5&&r.every(function(x){return x.gf!==null&&x.ga!==null;});};
 if(!full(h)||!full(a))return {pass:false,why:'fewer than 5 complete results'};
 var hf=sumAvg(h,'gf'),ha=sumAvg(h,'ga'),af=sumAvg(a,'gf'),aa=sumAvg(a,'ga');
 var lam=(hf+aa)/2,mu=(af+ha)/2,T=lam+mu;
 var pensH=h.filter(function(x){return x.pens;}).length,pensA=a.filter(function(x){return x.pens;}).length;
 var q={lam:Math.round(lam*100)/100,mu:Math.round(mu*100)/100,T:Math.round(T*100)/100,lo:opts.tLo,hi:opts.tHi};
 if(T<opts.tLo)return {pass:false,why:'quick total '+q.T+' below '+opts.tLo,quick:q};
 if(T>opts.tHi)return {pass:false,why:'quick total '+q.T+' above '+opts.tHi,quick:q};
 if(pensH+pensA>=4)return {pass:false,why:'too many penalty-decided games in last 5',quick:q};
 return {pass:true,why:'quick total '+q.T+' inside '+opts.tLo+'-'+opts.tHi,quick:q};
}
function skipRec(rec){rec.status=timedOut?'TIMEOUT':'SKIPPED';frameBox.innerHTML='';return rec;}
async function processUrl(url,opts){
 var ICON='.event-widget-item[data-icon=statistics]';
 var t=teams(url);var rec={readAt:Date.now(),tzo:new Date().getTimezoneOffset(),id:idOf(url),url:url,league:leagueOf(url),home:t[0],away:t[1],status:'',via:'',note:'',h:[],a:[]};
 var fr=document.createElement('iframe');
 fr.src=url;fr.style.cssText='width:100vw;max-width:100vw;height:420px;border:1px solid gray;background:white;';
 frameBox.innerHTML='';frameBox.appendChild(fr);
 var doc=null;var manual=false;
 var ready=await waitFor(function(){doc=fr.contentDocument;return doc&&doc.querySelector('[data-op^=event-detail]');},40000);
 if(skipFlag){return skipRec(rec);}
 if(!ready){rec.status=doc?'NO_STATS_BUTTON':'FRAME_BLOCKED';frameBox.innerHTML='';return rec;}
 var si=startInfo(doc);rec.kickoff=si.text;
 if(si.started){rec.status='LIVE_OR_FINISHED';frameBox.innerHTML='';return rec;}
 var icon=await waitFor(function(){return doc.querySelector(ICON);},12000);
 if(skipFlag){return skipRec(rec);}
 if(!icon){rec.status=doc.querySelector(BTN)?'NO_STATS_ICON':'NO_STATS_BUTTON';frameBox.innerHTML='';return rec;}
 si=startInfo(doc);rec.kickoff=si.text;
 if(si.started){rec.status='LIVE_OR_FINISHED';frameBox.innerHTML='';return rec;}
 ['pointerdown','touchstart','mousedown'].forEach(function(ev){doc.addEventListener(ev,function(e){if(e.isTrusted&&e.target.closest&&e.target.closest('.event-widget-container'))manual=true;},true);});
 rec.note='icon found';
 try{icon.scrollIntoView({block:'center'});}catch(e){}
 var targets=[icon];var wr=icon.closest('.event-widget-item-wrapper');if(wr)targets.push(wr);
 var w=null;
 for(var i=0;i<targets.length&&!w;i++){
  setStatus('Auto-tapping the stats icon ('+(i+1)+'). If nothing opens, tap the stats icon yourself.');
  tap(targets[i]);
  w=await waitFor(function(){return doc.querySelector(MATCH);},9000);
 }
 if(!w&&!unBox.checked&&!skipFlag){setStatus('Tap the stats icon in the frame now (25 seconds).');w=await waitFor(function(){return doc.querySelector(MATCH);},25000);}
 if(skipFlag){return skipRec(rec);}
 if(!w){rec.status='NO_WIDGET';frameBox.innerHTML='';return rec;}
 rec.via=manual?'manual':'auto';
 await sleep(1500);
 var f=readForm(doc);rec.h=f.left;rec.a=f.right;
 rec.status=(rec.h.length&&rec.a.length)?'OK':'PARTIAL';
 if(opts&&opts.full&&rec.status==='OK'){
  var gg=gcsGate(rec,opts);rec.gate=gg.pass?'PASS':'REJECT';rec.gateWhy=gg.why;rec.quick=gg.quick;
  if(rec.gate==='PASS'||opts.broad){
   if(rec.gate!=='PASS')rec.broad=true;
   rec.tabs={};rec.tabstatus={};
   rec.tabs['H2H']=await stable(doc);rec.tabstatus['H2H']=rec.tabs['H2H'].length>=5?'OK':'EMPTY';
   var prev=rec.tabs['H2H'].join('~');
   for(var ti=0;ti<EXTRA_TABS.length;ti++){
    setStatus('Reading tab '+EXTRA_TABS[ti]+' ('+rec.home+' vs '+rec.away+')');
    var tr=await readTab(doc,EXTRA_TABS[ti],prev);
    rec.tabs[EXTRA_TABS[ti]]=tr.tokens;rec.tabstatus[EXTRA_TABS[ti]]=tr.status;rec.tabcount=rec.tabcount||{};rec.tabcount[EXTRA_TABS[ti]]=tr.tokens.length;
    prev=tr.tokens.join('~');
   }
  }
 }
 frameBox.innerHTML='';
 return rec;
}
function leagueOf(u){var p=decodeURIComponent(u).split('?')[0].split('/').filter(Boolean);var i=p.indexOf('football');if(i<0||p.length<i+3)return '';return p[i+1]+'/'+p[i+2];}
function isCup(l){return /cup|cupa|copa|coupe|pokal|taca|beker|trophy|shield|friendl|qualif/i.test(l);}
function tableText(doc){
 var ws=doc.querySelectorAll('[data-sr-widget]');
 for(var i=0;i<ws.length;i++){var t=ws[i].innerText||'';if(t.indexOf('Form')>=0&&t.indexOf('Overall')>=0)return t;}
 return '';
}
function parseTable(text){
 var NL=String.fromCharCode(10);
 var tk=text.split(NL).map(function(x){return x.trim();}).filter(function(x){return x;});
 var isInt=function(x){return /^[0-9]+$/.test(x||'');};
 var rows=[];var i=0;var g=0;var lastPos=0;
 while(i<tk.length){
  var m=(tk[i+7]||'').match(/^([0-9]+):([0-9]+)$/);
  if(m&&isInt(tk[i])&&tk[i+1]&&!isInt(tk[i+1])&&isInt(tk[i+3])&&isInt(tk[i+4])&&isInt(tk[i+5])&&isInt(tk[i+6])&&isInt(tk[i+9])){
   if(+tk[i]<=lastPos)g++;
   lastPos=+tk[i];
   rows.push({pos:+tk[i],team:tk[i+1],P:+tk[i+3],W:+tk[i+4],D:+tk[i+5],L:+tk[i+6],GF:+m[1],GA:+m[2],pts:+tk[i+9],g:g});
   i+=10;
   while(i<tk.length&&/^[WDL]$/.test(tk[i]))i++;
  }else i++;
 }
 return rows;
}
function navItem(doc,label){
 var els=Array.prototype.slice.call(doc.querySelectorAll('.m-snap-nav-item'));
 for(var i=0;i<els.length;i++){if(els[i].textContent.trim()===label)return els[i];}
 return null;
}
function toggleEl(doc,label){
 var ws=doc.querySelectorAll('[data-sr-widget]');
 for(var i=0;i<ws.length;i++){
  var leaves=Array.prototype.slice.call(ws[i].querySelectorAll('*')).filter(function(e){return e.children.length===0&&e.textContent.trim()===label;});
  if(leaves.length)return leaves[0];
 }
 return null;
}
function parseTableDom(doc){
 var rows=[];
 var tables=Array.prototype.slice.call(doc.querySelectorAll('table')).filter(function(t){return t.querySelector('.sr-livetable__tableTeamName');});
 tables.forEach(function(t,g){
  Array.prototype.forEach.call(t.querySelectorAll('tr'),function(tr){
   var nm=tr.querySelector('.sr-livetable__tableTeamName');
   if(!nm)return;
   var cells=Array.prototype.map.call(tr.children,function(c){return c.textContent.trim();});
   var gi=-1;
   for(var i=0;i<cells.length;i++){if(/^[0-9]+:[0-9]+$/.test(cells[i])){gi=i;break;}}
   if(gi<5)return;
   var ok=[cells[gi-4],cells[gi-3],cells[gi-2],cells[gi-1],cells[gi+2]].every(function(x){return /^[0-9]+$/.test(x||'');});
   if(!ok)return;
   var m=cells[gi].split(':');
   var posEl=tr.querySelector('.srm-pos');
   var pos=posEl?+posEl.textContent.trim():rows.length+1;
   rows.push({pos:pos,team:nm.textContent.trim(),P:+cells[gi-4],W:+cells[gi-3],D:+cells[gi-2],L:+cells[gi-1],GF:+m[0],GA:+m[1],pts:+cells[gi+2],g:g});
  });
 });
 return rows;
}
function readRows(doc){var r=parseTableDom(doc);if(r.length)return r;return parseTable(tableText(doc));}
function tablesLoad(){try{return JSON.parse(localStorage.getItem('gcs_tables_v1'))||{};}catch(e){return {};}}
function tablesSave(t){localStorage.setItem('gcs_tables_v1',JSON.stringify(t));}
function pickPhase(v){
 var best={};var multi=false;
 v.overall.forEach(function(r){if(best[r.team]){multi=true;}if(!best[r.team]||r.P>best[r.team].P)best[r.team]={P:r.P,g:r.g};});
 var out={multi:multi};
 ['overall','home','away'].forEach(function(k){out[k]=v[k].filter(function(r){return best[r.team]&&r.g===best[r.team].g;});});
 return out;
}
function seen(doc){
 var tx=(doc.body?doc.body.innerText:'').split(String.fromCharCode(10)).join(' ').slice(0,90);
 return 'tables='+doc.querySelectorAll('table').length+', team cells='+doc.querySelectorAll('.sr-livetable__tableTeamName').length+', tabs='+doc.querySelectorAll('.m-snap-nav-item').length+', text='+tx;
}
async function readLeague(url){
 var ICON='.event-widget-item[data-icon=statistics]';
 var lg=leagueOf(url);var rec={readAt:Date.now(),league:lg,url:url,status:'',note:'',views:{}};
 if(isCup(lg)){rec.status='SKIPPED_CUP';return rec;}
 var fr=document.createElement('iframe');
 fr.src=url;fr.style.cssText='width:100vw;max-width:100vw;height:420px;border:1px solid gray;background:white;';
 frameBox.innerHTML='';frameBox.appendChild(fr);
 var doc=null;
 var icon=await waitFor(function(){doc=fr.contentDocument;return doc&&doc.querySelector(ICON);},45000);
 if(skipFlag){rec.status=timedOut?'TIMEOUT':'SKIPPED';frameBox.innerHTML='';return rec;}
 if(!icon){rec.status=doc?'NO_STATS_ICON':'FRAME_BLOCKED';frameBox.innerHTML='';return rec;}
 var targets=[icon];var wr=icon.closest('.event-widget-item-wrapper');if(wr)targets.push(wr);
 var nav=null;
 for(var i=0;i<targets.length&&!nav;i++){
  setStatus('Opening stats for '+lg+' ...');
  tap(targets[i]);
  nav=await waitFor(function(){return navItem(doc,'Table');},9000);
 }
 if(!nav&&!unBox.checked&&!skipFlag){setStatus('Tap the stats icon in the frame now (25 seconds).');nav=await waitFor(function(){return navItem(doc,'Table');},25000);}
 if(!nav){rec.status='NO_TABLE_TAB';rec.note=seen(doc);frameBox.innerHTML='';return rec;}
 tap(nav);
 var overall=await waitFor(function(){var r=readRows(doc);return r.length>=4?r:null;},20000);
 if(!overall&&doc.querySelector('table')){rec.status='TABLE_UNREADABLE';rec.note=seen(doc);frameBox.innerHTML='';return rec;}
 if(!overall&&!unBox.checked&&!skipFlag){setStatus('Tap the Table tab in the frame now (25 seconds).');overall=await waitFor(function(){var r=readRows(doc);return r.length>=4?r:null;},25000);}
 if(!overall){rec.status='NO_TABLE';rec.note=seen(doc);frameBox.innerHTML='';return rec;}
 rec.views.overall=overall;
 var hl=[];
 Array.prototype.forEach.call(doc.querySelectorAll('table tr'),function(tr){
  var nm=tr.querySelector('.sr-livetable__tableTeamName');if(!nm)return;
  var act=Array.prototype.some.call(tr.querySelectorAll('td'),function(td){return /is-active/.test(td.className);});
  var n=nm.textContent.trim();if(act&&hl.indexOf(n)<0)hl.push(n);
 });
 rec.highlight=hl;
 var prev=JSON.stringify(overall);
 var names=['home','away'];
 for(var k=0;k<2;k++){
  var label=k===0?'Home':'Away';
  var el=toggleEl(doc,label);
  var got=null;
  if(el){
   tap(el);
   got=await waitFor(function(){var r=readRows(doc);return (r.length>=4&&JSON.stringify(r)!==prev)?r:null;},9000);
   if(!got&&el.parentElement){tap(el.parentElement);got=await waitFor(function(){var r=readRows(doc);return (r.length>=4&&JSON.stringify(r)!==prev)?r:null;},9000);}
  }
  if(!got&&!unBox.checked&&!skipFlag){setStatus('Tap '+label+' in the frame now (20 seconds).');got=await waitFor(function(){var r=readRows(doc);return (r.length>=4&&JSON.stringify(r)!==prev)?r:null;},20000);}
  if(!got){rec.status='NO_'+label.toUpperCase();frameBox.innerHTML='';return rec;}
  rec.views[names[k]]=got;prev=JSON.stringify(got);
 }
 var pk=pickPhase(rec.views);rec.views={overall:pk.overall,home:pk.home,away:pk.away};
 var o={};rec.views.overall.forEach(function(r){o[r.team]=r;});
 var h={};rec.views.home.forEach(function(r){h[r.team]=r;});
 var a={};rec.views.away.forEach(function(r){a[r.team]=r;});
 var bad=0;
 Object.keys(o).forEach(function(t){if(!h[t]||!a[t]||o[t].P!==h[t].P+a[t].P||o[t].GF!==h[t].GF+a[t].GF||o[t].GA!==h[t].GA+a[t].GA)bad++;});
 var gfSum=function(v){return v.reduce(function(s,r){return s+r.GF;},0);};
 rec.status=bad?'INCONSISTENT':'OK';
 rec.note=bad?(bad+' teams do not add up'):(pk.multi?'multi-phase table: latest phase used':'');
 if(!bad&&gfSum(rec.views.home)<gfSum(rec.views.away))rec.note='CHECK_LABELS: home goals below away goals';
 frameBox.innerHTML='';
 return rec;
}
function tablesCsv(tables){
 var lines=['league,view,pos,team,P,W,D,L,GF,GA,pts,status'];
 Object.keys(tables).forEach(function(k){
  var r=tables[k];if(r.status!=='OK')return;
  ['overall','home','away'].forEach(function(v){
   r.views[v].forEach(function(x){lines.push([k,v,x.pos,x.team,x.P,x.W,x.D,x.L,x.GF,x.GA,x.pts,r.note||'ok'].map(q).join(','));});
  });
 });
 return lines.join(String.fromCharCode(10));
}
function resLoad(){try{return JSON.parse(localStorage.getItem('gcs_results_v1'))||{};}catch(e){return {};}}
function resSave(r){localStorage.setItem('gcs_results_v1',JSON.stringify(r));}
function dayStart(){var d=new Date();d.setHours(0,0,0,0);return d.getTime();}
function isCurrent(r){var k=parseKick(r&&r.kickoff);return k?k.getTime()>=dayStart():((r&&r.readAt)||0)>=dayStart();}
function exportMatches(){var d=load().done,o={};Object.keys(d).forEach(function(k){if(allBox.checked||isCurrent(d[k]))o[k]=d[k];});return o;}
function exportResults(){var R=resLoad(),o={},now=Date.now();Object.keys(R).forEach(function(k){if(allBox.checked||!R[k].exp||now-R[k].exp<12*3600000)o[k]=R[k];});return o;}
function exportTables(ms){var T=tablesLoad(),o={},lg={};Object.keys(ms).forEach(function(k){lg[ms[k].league]=1;});Object.keys(T).forEach(function(k){if(allBox.checked||lg[k]||(T[k].readAt||0)>=dayStart())o[k]=T[k];});return o;}
function markExported(ms,rs){var now=Date.now(),st=load();Object.keys(ms).forEach(function(k){if(st.done[k])st.done[k].exp=now;});try{save(st);}catch(e){}var R=resLoad();Object.keys(rs).forEach(function(k){if(R[k]&&!R[k].exp)R[k].exp=now;});try{resSave(R);}catch(e){}}
function pruneOld(){
 var st=load(),R=resLoad(),n=0,now=Date.now();
 Object.keys(st.done).forEach(function(k){var r=st.done[k];if(isCurrent(r))return;
  var done=r.exp&&R[r.id]&&R[r.id].status==='ENDED';var age=now-((r.readAt)||0);
  if(done||age>14*86400000){delete st.done[k];n++;}});
 Object.keys(R).forEach(function(k){if(R[k].exp&&now-R[k].exp>7*86400000){delete R[k];}});
 if(n){try{save(st);}catch(e){}}try{resSave(R);}catch(e){}
 return n;
}
function parseKick(text){
 var m=(text||'').match(/^([0-9]{1,2}) ([A-Za-z]{3}), [A-Za-z]+ ([0-9]{2}):([0-9]{2})$/);
 var MON={Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
 if(!m||MON[m[2]]===undefined)return null;
 var now=new Date();var d=new Date(now.getFullYear(),MON[m[2]],+m[1],+m[3],+m[4]);
 if(d.getTime()-now.getTime()>180*86400000)d=new Date(now.getFullYear()-1,MON[m[2]],+m[1],+m[3],+m[4]);
 return d;
}
function readResult(doc){
 var sec=doc.querySelector('[data-op=event-detail-team-name-with-score]');
 var tag=doc.querySelector('[data-op=event-detail-status-bar-ended-tag]');
 var out={found:!!sec,ended:!!tag,tag:tag?tag.textContent.trim():'',nums:[]};
 if(sec&&sec.children.length>=2){
  var all=sec.children[1].querySelectorAll('*');
  for(var i=0;i<all.length;i++){if(all[i].children.length===0){var t=all[i].textContent.trim();if(/^[0-9]+$/.test(t))out.nums.push(+t);}}
 }
 return out;
}
async function readResultPage(url){
 var t=teams(url);var rec={readAt:Date.now(),id:idOf(url),url:url,home:t[0],away:t[1],status:''};
 var fr=document.createElement('iframe');
 fr.src=url;fr.style.cssText='width:100vw;max-width:100vw;height:300px;border:1px solid gray;background:white;';
 frameBox.innerHTML='';frameBox.appendChild(fr);
 var doc=null;
 var ready=await waitFor(function(){doc=fr.contentDocument;return doc&&doc.querySelector('[data-op=event-detail-team-name-with-score]');},40000);
 if(skipFlag){rec.status=timedOut?'TIMEOUT':'SKIPPED';frameBox.innerHTML='';return rec;}
 if(!ready){rec.status=doc?'NO_SCORE':'FRAME_BLOCKED';frameBox.innerHTML='';return rec;}
 await sleep(1500);
 var a=readResult(doc);await sleep(1000);var b=readResult(doc);
 if(JSON.stringify(a)!==JSON.stringify(b)){await sleep(2500);b=readResult(doc);}
 rec.tag=b.tag;rec.nums=b.nums;
 if(!b.ended){rec.status='NOT_ENDED';}
 else if(b.nums.length===2){rec.status='ENDED';rec.hg=b.nums[0];rec.ag=b.nums[1];}
 else{rec.status='AMBIGUOUS_SCORE';}
 frameBox.innerHTML='';
 return rec;
}
async function runResults(){
 pruneOld();
 var urls=ta.value.split(String.fromCharCode(10)).join(' ').split(' ').map(function(u){return u.trim();}).filter(function(u){return idOf(u);});
 var R=resLoad();
 if(!urls.length){
  var d=load().done;
  urls=Object.keys(d).map(function(k){return d[k];}).filter(function(r){
   if(!r.url||(R[r.id]&&R[r.id].status==='ENDED'))return false;
   var k=parseKick(r.kickoff);return !k||((Date.now()-k.getTime())>=150*60000&&(Date.now()-k.getTime())<=3*86400000);
  }).map(function(r){return r.url;});
 }
 var seen={};urls=urls.filter(function(u){var i=idOf(u);if(seen[i]||(R[i]&&R[i].status==='ENDED'))return false;seen[i]=1;return true;});
 if(!urls.length){setStatus('Nothing to check. Paste match links, or run a Full run first (without clearing).');return;}
 stopFlag=false;
 try{if(navigator.wakeLock)navigator.wakeLock.request('screen').catch(function(){});}catch(e){}
 for(var i=0;i<urls.length;i++){
  if(stopFlag){setStatus('Stopped.');return;}
  setStatus('Result '+(i+1)+' of '+urls.length+': '+teams(urls[i]).join(' vs '));
  skipFlag=false;timedOut=false;var ct=setTimeout(function(){timedOut=true;skipFlag=true;},70000);
  var rec=await readResultPage(urls[i]);
  clearTimeout(ct);skipFlag=false;timedOut=false;
  R=resLoad();R[rec.id]=rec;try{resSave(R);}catch(e){setStatus('Storage full. Tap Save everything first.');return;}
  await sleep(800+Math.random()*800);
 }
 R=resLoad();var v=Object.keys(R).map(function(k){return R[k];});
 var c=function(st){return v.filter(function(r){return r.status===st;}).length;};
 setStatus('Results: '+c('ENDED')+' final scores read, '+c('NOT_ENDED')+' not finished yet, '+(v.length-c('ENDED')-c('NOT_ENDED'))+' unreadable. Tap Save everything.');
}
async function runFull(){
 pruneOld();
 var tLo=parseFloat(scoreBox.value)||1.2;var tHi=parseFloat(scoreBox2.value)||4.0;
 var urls=ta.value.split(String.fromCharCode(10)).join(' ').split(' ').map(function(u){return u.trim();}).filter(function(u){return idOf(u);});
 var seen={};urls=urls.filter(function(u){var i=idOf(u);if(seen[i])return false;seen[i]=1;return true;});
 if(!urls.length){setStatus('Paste match URLs first.');return;}
 stopFlag=false;
 try{if(navigator.wakeLock)navigator.wakeLock.request('screen').catch(function(){});}catch(e){}
 var passUrls=[];
 for(var i=0;i<urls.length;i++){
  if(stopFlag){setStatus('Stopped.');return;}
  var id=idOf(urls[i]);var st=load();var old=st.done[id];
  var fresh=old&&old.readAt&&(Date.now()-old.readAt)<6*3600000;
  if(old&&fresh&&(old.status==='LIVE_OR_FINISHED'||old.status==='NO_STATS_BUTTON'||old.status==='NO_STATS_ICON'))continue;
  if(old&&old.status==='OK'&&fresh&&((old.gate==='REJECT'&&(!broadBox.checked||old.tabs))||(old.gate==='PASS'&&old.tabs))){if(old.gate==='PASS'||(broadBox.checked&&old.tabs))passUrls.push(urls[i]);continue;}
  setStatus('Match '+(i+1)+' of '+urls.length+': '+teams(urls[i]).join(' vs '));
  skipFlag=false;timedOut=false;var capTimer=setTimeout(function(){timedOut=true;skipFlag=true;},210000);
  var rec=await processUrl(urls[i],{full:true,tLo:tLo,tHi:tHi,broad:broadBox.checked});
  clearTimeout(capTimer);
  if(skipFlag||timedOut){rec.status=timedOut?'TIMEOUT':'SKIPPED';delete rec.tabs;delete rec.tabstatus;delete rec.gate;frameBox.innerHTML='';}
  skipFlag=false;timedOut=false;
  st=load();st.done[rec.id]=rec;
  try{save(st);}catch(e){setStatus('Storage full. Tap Save everything, then Clear saved.');return;}
  if(rec.gate==='PASS'||(broadBox.checked&&rec.tabs))passUrls.push(urls[i]);
  await sleep(1500+Math.random()*1500);
 }
 var seenL={};var tl=tablesLoad();
 for(var j=0;j<passUrls.length;j++){
  if(stopFlag){setStatus('Stopped.');return;}
  var lg=leagueOf(passUrls[j]);
  if(!lg||seenL[lg]||isCup(lg)||(tl[lg]&&tl[lg].status==='OK'&&tl[lg].readAt&&(Date.now()-tl[lg].readAt)<12*3600000))continue;
  seenL[lg]=1;
  setStatus('League table: '+lg);
  skipFlag=false;timedOut=false;var capT2=setTimeout(function(){timedOut=true;skipFlag=true;},150000);
  var tr=await readLeague(passUrls[j]);
  clearTimeout(capT2);skipFlag=false;timedOut=false;
  tl=tablesLoad();tl[lg]=tr;tablesSave(tl);
 }
 var d=load().done;var vals=Object.keys(d).map(function(k){return d[k];}).filter(isCurrent);
 var pass=vals.filter(function(r){return r.gate==='PASS';}).length;
 var rej=vals.filter(function(r){return r.gate==='REJECT';}).length;
 var cnt=function(f){return vals.filter(f).length;};
 setStatus('Finished. '+pass+' passed the quick total gate (full read), '+rej+' rejected. Skipped: '+cnt(function(r){return r.status==='LIVE_OR_FINISHED';})+' already started, '+cnt(function(r){return r.status==='NO_STATS_BUTTON'||r.status==='NO_STATS_ICON';})+' without stats, '+cnt(function(r){return r.status==='SKIPPED'||r.status==='TIMEOUT';})+' skipped or timed out. Tap Save everything.');
}
function everythingJson(){var ms=exportMatches(),rs=exportResults();var s=JSON.stringify({format:'gcs-everything-1',collector:VERSION,created:new Date().toISOString(),scope:allBox.checked?'all saved days':'today and later only',matches:ms,tables:exportTables(ms),results:rs});markExported(ms,rs);return s;}
async function runTables(){
 var urls=ta.value.split(String.fromCharCode(10)).join(' ').split(' ').map(function(u){return u.trim();}).filter(function(u){return idOf(u);});
 var seen={};var list=[];
 urls.forEach(function(u){var l=leagueOf(u);if(l&&!seen[l]){seen[l]=1;list.push(u);}});
 if(!list.length){setStatus('Paste match URLs first (one per league is enough).');return;}
 stopFlag=false;
 try{if(navigator.wakeLock)navigator.wakeLock.request('screen').catch(function(){});}catch(e){}
 for(var i=0;i<list.length;i++){
  if(stopFlag){setStatus('Stopped.');return;}
  var lg=leagueOf(list[i]);var st=tablesLoad();
  if(st[lg]&&st[lg].status==='OK'&&st[lg].readAt&&(Date.now()-st[lg].readAt)<12*3600000)continue;
  setStatus('League table '+(i+1)+' of '+list.length+': '+lg);
  var rec=await readLeague(list[i]);skipFlag=false;
  st=tablesLoad();st[lg]=rec;tablesSave(st);
  await sleep(1500+Math.random()*1500);
 }
 var all=tablesLoad();var ok=Object.keys(all).filter(function(k){return all[k].status==='OK';}).length;
 setStatus('Tables finished. '+ok+' of '+Object.keys(all).length+' leagues OK.'+(ok<Object.keys(all).length?' Tap Table status to see why.':' Tap Copy tables or Download tables.'));
}
async function run(){
 var urls=ta.value.split(String.fromCharCode(10)).join(' ').split(' ').map(function(u){return u.trim();}).filter(function(u){return idOf(u);});
 var seen={};urls=urls.filter(function(u){var i=idOf(u);if(seen[i])return false;seen[i]=1;return true;});
 if(!urls.length){setStatus('Paste match URLs first.');return;}
 stopFlag=false;
 try{if(navigator.wakeLock)navigator.wakeLock.request('screen').catch(function(){});}catch(e){}
 for(var i=0;i<urls.length;i++){
  if(stopFlag){setStatus('Stopped.');return;}
  var id=idOf(urls[i]);var st=load();
  if(st.done[id]&&st.done[id].status==='OK')continue;
  setStatus('Reading '+(i+1)+' of '+urls.length+': '+teams(urls[i]).join(' vs '));
  var rec=await processUrl(urls[i]);skipFlag=false;
  st=load();st.done[rec.id]=rec;save(st);
  await sleep(1500+Math.random()*1500);
 }
 var d=load().done;var n=Object.keys(d).length;
 setStatus('Finished. '+n+' saved. Tap Copy CSV.');
}
function mk(label,fn){var b=document.createElement('button');b.textContent=label;b.style.cssText='margin:3px 3px 0 0;padding:8px 10px;font-size:14px;';b.onclick=fn;return b;}
box=document.createElement('div');
box.style.cssText='position:fixed;left:0;top:0;right:0;bottom:0;overflow:auto;background:white;color:black;z-index:2147483647;padding:8px;font:14px sans-serif;';
statusEl=document.createElement('div');statusEl.style.cssText='font-weight:bold;margin-bottom:6px;';
statusEl.textContent='Ready.';
ta=document.createElement('textarea');ta.placeholder='Paste match URLs, one per line';ta.style.cssText='width:94vw;height:80px;box-sizing:border-box;';
out=document.createElement('textarea');out.style.cssText='width:94vw;height:70px;box-sizing:border-box;display:none;margin-top:6px;';
frameBox=document.createElement('div');frameBox.style.cssText='margin-top:6px;';
var bStart=mk('Start',run);
var bStop=mk('Stop',function(){stopFlag=true;});
var bCopy=mk('Copy CSV',async function(){var c=toCsv(exportMatches());out.style.display='block';out.value=c;try{await navigator.clipboard.writeText(c);setStatus('Copied.');}catch(e){out.select();setStatus('Copy from the box below.');}});
var bDl=mk('Download',function(){var bl=new Blob([toCsv(exportMatches())],{type:'text/csv'});var a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download='gcs_results.csv';document.body.appendChild(a);a.click();a.remove();});
var bClr=mk('Clear saved',function(){if(confirm('Delete saved results and league tables?')){localStorage.removeItem(KEY);localStorage.removeItem('gcs_tables_v1');localStorage.removeItem('gcs_results_v1');setStatus('Cleared.');}});
var bTab=mk('Read tables',runTables);
var bTabCopy=mk('Copy tables',async function(){var c=tablesCsv(tablesLoad());if(c.split(String.fromCharCode(10)).length<2){setStatus('Nothing to copy yet. Tap Table status to see why.');return;}out.style.display='block';out.value=c;try{await navigator.clipboard.writeText(c);setStatus('Tables copied.');}catch(e){out.select();setStatus('Copy from the box below.');}});
var bTabStat=mk('Table status',function(){var t=tablesLoad();var ks=Object.keys(t);out.style.display='block';out.value=ks.length?ks.map(function(k){var r=t[k];return k+': '+r.status+(r.note?' ('+r.note+')':'')+(r.status==='OK'?' - '+r.views.overall.length+' teams':'')+(r.readAt?', read '+Math.round((Date.now()-r.readAt)/360000)/10+'h ago':'');}).join(String.fromCharCode(10)):'No leagues read yet.';});
var bTabDl=mk('Download tables',function(){var c=tablesCsv(tablesLoad());if(c.split(String.fromCharCode(10)).length<2){setStatus('Nothing to download yet. Tap Table status to see why.');return;}var bl=new Blob([c],{type:'text/csv'});var a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download='gcs_tables.csv';document.body.appendChild(a);a.click();a.remove();});
var scoreBox=document.createElement('input');scoreBox.type='number';scoreBox.step='0.1';scoreBox.value='1.2';scoreBox.style.cssText='width:56px;margin:3px 3px 0 0;padding:6px;';
var scoreBox2=document.createElement('input');scoreBox2.type='number';scoreBox2.step='0.1';scoreBox2.value='4.0';scoreBox2.style.cssText='width:56px;margin:3px 3px 0 0;padding:6px;';
var scoreLbl=document.createElement('span');scoreLbl.textContent=' quick expected total goals, from ';
var bFull=mk('Full run',runFull);
var bRes=mk('Read results',runResults);
var bEvDl=mk('Save everything',function(){var bl=new Blob([everythingJson()],{type:'application/json'});var a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download='gcs_everything.json';document.body.appendChild(a);a.click();a.remove();});
var bEvCopy=mk('Copy everything',async function(){var c=everythingJson();out.style.display='block';out.value=c;try{await navigator.clipboard.writeText(c);setStatus('Copied '+c.length+' characters.');}catch(e){out.select();setStatus('Copy from the box below.');}});
var bSkip=mk('Skip this match',function(){skipFlag=true;setStatus('Skipping this match...');});
var unBox=document.createElement('input');unBox.type='checkbox';unBox.checked=true;unBox.style.cssText='margin:6px 4px 0 6px;transform:scale(1.4);';
var unLbl=document.createElement('span');unLbl.textContent=' Unattended (never wait for my taps)';
var allBox=document.createElement('input');allBox.type='checkbox';allBox.checked=false;allBox.style.cssText='margin:6px 4px 0 6px;transform:scale(1.4);';
var allLbl=document.createElement('span');allLbl.textContent=' Save/copy ALL stored days (normally only today and later is exported)';
var broadBox=document.createElement('input');broadBox.type='checkbox';broadBox.checked=false;broadBox.style.cssText='margin:6px 4px 0 6px;transform:scale(1.4);';
var broadLbl=document.createElement('span');broadLbl.textContent=' Broad: also read all tabs for matches the quick total gate rejects (slower; builds an unfiltered comparison set)';
var bClose=mk('Close',function(){stopFlag=true;box.style.display='none';});
box.appendChild(statusEl);box.appendChild(bSkip);box.appendChild(document.createElement('br'));box.appendChild(ta);
box.appendChild(scoreLbl);box.appendChild(scoreBox);var toL=document.createElement('span');toL.textContent=' to ';box.appendChild(toL);box.appendChild(scoreBox2);box.appendChild(document.createElement('br'));box.appendChild(unBox);box.appendChild(unLbl);box.appendChild(document.createElement('br'));box.appendChild(broadBox);box.appendChild(broadLbl);box.appendChild(document.createElement('br'));box.appendChild(allBox);box.appendChild(allLbl);box.appendChild(document.createElement('br'));
[bFull,bRes,bEvDl,bEvCopy,bStart,bStop,bTab,bTabStat,bClr,bClose].forEach(function(b){box.appendChild(b);});
box.appendChild(out);box.appendChild(frameBox);
document.body.appendChild(box);
function openingStatus(){var pr=pruneOld();var d=load().done,c=0,o=0;Object.keys(d).forEach(function(k){if(isCurrent(d[k]))c++;else o++;});
 statusEl.textContent='Ready. Today and later: '+c+' matches saved. Earlier days still stored: '+o+' (kept only so Read results can fetch their scores; never included when you save).'+(pr?' Removed '+pr+' finished earlier matches that were already exported.':'');}
openingStatus();
window.__gcs=function(){box.style.display='block';openingStatus();};
window.__gcst={readResult:readResult,tokensOf:tokensOf,readRows:readRows,parseTable:parseTable,tableText:tableText,tablesCsv:tablesCsv,leagueOf:leagueOf,isCup:isCup};
}catch(e){alert('GCS error: '+e.message);}
})();
