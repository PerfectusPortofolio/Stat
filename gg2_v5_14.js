(function(){
try{alert('GG2 v5.14 loaded');
if(window.__gg2){window.__gg2();return;}
var KEY='gg2_bm_v1';
var BTN='button[data-op=event-detail-market-stats-button]';
var MATCH='.sr-last-matches__match';
var stopFlag=false;var skipFlag=false;var timedOut=false;
function load(){try{return JSON.parse(localStorage.getItem(KEY))||{done:{}};}catch(e){return {done:{}};}}
function save(s){localStorage.setItem(KEY,JSON.stringify(s));}
function skipWords(){try{return (localStorage.getItem('gg2_skipwords_v1')||'').toLowerCase().split(',').map(function(x){return x.trim().split(/\s+/).join('_');}).filter(function(x){return x;});}catch(e){return [];}}
function skipHit(u){var w=skipWords();var l=decodeURIComponent(u||'').toLowerCase();for(var i=0;i<w.length;i++){if(l.indexOf(w[i])>=0)return true;}return false;}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}
async function waitFor(fn,ms){var t=Date.now();while(Date.now()-t<ms&&!skipFlag){try{var v=fn();if(v)return v;}catch(e){}await sleep(300);}return null;}
function idOf(u){var m=decodeURIComponent(u||'').match(/sr:match:([0-9]+)/);return m?m[1]:null;}
function teams(u){var p=decodeURIComponent(u).split('?')[0].split('/').filter(Boolean);var s=p[p.length-2]||'';var x=s.split('_vs_');return [(x[0]||'').replace(/_/g,' '),(x[1]||'').replace(/_/g,' ')];}
function parseRes(wdl,raw,opp,iconD){
 var m=(raw||'').match(/([0-9]+)[^0-9]+([0-9]+)/);var pens=/[A-Za-z]/.test(raw||'');
 var v=iconD?(iconD.indexOf('M12.32.17')>=0?'H':'A'):null;
 if(!m)return {wdl:wdl,gf:null,ga:null,opp:opp,pens:pens,v:v,vo:null};
 var a=+m[1],b=+m[2],hi=Math.max(a,b),lo=Math.min(a,b),gf=null,ga=null,vo=null;
 if(wdl==='W'){gf=hi;ga=lo;vo=a>b?'H':(a<b?'A':null);}else if(wdl==='L'){gf=lo;ga=hi;vo=a<b?'H':(a>b?'A':null);}else if(wdl==='D'){gf=a;ga=b;}
 return {wdl:wdl,gf:gf,ga:ga,opp:opp,pens:pens,v:v||vo,vo:vo};
}
function readForm(doc){
 var out={left:[],right:[]};
 var blocks=Array.prototype.slice.call(doc.querySelectorAll('.sr-teamform__lastXTeam'));
 blocks.forEach(function(b,i){
  var side=b.className.indexOf('srm-left')>=0?'left':(b.className.indexOf('srm-right')>=0?'right':(i===0?'left':'right'));
  Array.prototype.forEach.call(b.querySelectorAll(MATCH),function(m){
   function t(s){var e=m.querySelector(s);return e?e.textContent.trim():'';}
   var ip=m.querySelector('.sr-last-matches__icon path');
   out[side].push(parseRes(t('.sr-last-matches__wdl'),t('.sr-last-matches__result'),t('.sr-last-matches__team-full')||t('.sr-last-matches__team'),ip?ip.getAttribute('d'):''));
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

function oddsNum(t){var m=String(t||'').replace(/,/g,'').match(/[0-9]+(\.[0-9]+)?/);return m?+m[0]:null;}
function mktBlocks(doc){return Array.prototype.slice.call(doc.querySelectorAll('[data-op=event-detail-market-list-adapter]'));}
function mktTitle(b){var p=b.querySelector('[data-op=event-detail-market-title] p');return p?p.textContent.trim():'';}
function mktOutcomes(b){
 var out=[];
 Array.prototype.forEach.call(b.querySelectorAll('[data-op=outcome-btn]'),function(btn){
  var sp=btn.querySelectorAll('span');
  if(sp.length>=2){out.push({label:sp[0].textContent.trim(),odds:oddsNum(sp[sp.length-1].textContent)});}
  else if(sp.length===1){out.push({label:'',odds:oddsNum(sp[0].textContent)});}
 });
 return out;
}
async function openMkt(doc,b){
 if(b.querySelector('[data-op=event-detail-market-content-normal]')||b.querySelector('[data-op^=event-detail-market-content-specifier-combo-row]'))return true;
 var t=b.querySelector('[data-op=event-detail-market-toggle-all]');
 var ttl=b.querySelector('[data-op=event-detail-market-title]');
 var tg=[t,ttl].filter(function(x){return x;});
 for(var i=0;i<tg.length;i++){
  try{tg[i].scrollIntoView({block:'center'});}catch(e){}
  tap(tg[i]);
  var ok=await waitFor(function(){return b.querySelector('[data-op=event-detail-market-content-normal]')||b.querySelector('[data-op^=event-detail-market-content-specifier-combo-row]');},4000);
  if(ok)return true;
  if(skipFlag)return false;
 }
 return false;
}
function comboRows(b){
 var res={};
 Array.prototype.forEach.call(b.querySelectorAll('[data-op^=event-detail-market-content-specifier-combo-row]'),function(r){
  var p=r.querySelector('p');var line=p?p.textContent.trim():'';
  var v=Array.prototype.map.call(r.querySelectorAll('[data-op=outcome-btn]'),function(btn){return oddsNum(btn.textContent);});
  if(/^[0-9]+\.5$/.test(line)&&v.length>=1&&v[0]&&!res[line])res[line]=[v[0],v[1]||null];
 });
 return res;
}
async function readOdds(doc){
 var o={gg2y:null,gg2n:null,h:null,d:null,a:null,ou:{},note:''};
 var blocks=await waitFor(function(){var b=mktBlocks(doc);return b.length>=3?b:null;},10000);
 if(!blocks){o.note='no markets';return o;}
 var gg=null,x12=null,ou=null,i;var ex={};
 for(i=0;i<blocks.length;i++){
  var t=mktTitle(blocks[i]);
  if(!gg&&t==='GG/NG 2+')gg=blocks[i];
  if(!x12&&t.toUpperCase()==='1X2')x12=blocks[i];
  if(!ou&&t==='Over/Under')ou=blocks[i];
  if(!ex[t]&&(t==='Home Over/Under'||t==='Away Over/Under'||t==='1st Half - Over/Under'||t==='GG/NG'))ex[t]=blocks[i];
 }
 var cands=[x12];
 blocks.forEach(function(b){if(b!==x12&&mktTitle(b).toUpperCase()==='1X2')cands.push(b);});
 if(gg){
  if(await openMkt(doc,gg)){
   mktOutcomes(gg).forEach(function(z){if(/^yes$/i.test(z.label))o.gg2y=z.odds;else if(/^no$/i.test(z.label))o.gg2n=z.odds;});
  }else o.note+='gg2 market would not open; ';
 }else o.note+='no GG/NG 2+ market; ';
 for(i=0;i<cands.length;i++){
  if(!cands[i])continue;
  if(!cands[i].querySelector('[data-op=event-detail-market-content-normal]'))await openMkt(doc,cands[i]);
  var h=null,d=null,a=null;
  mktOutcomes(cands[i]).forEach(function(z){if(z.label==='Home')h=z.odds;else if(z.label==='Draw')d=z.odds;else if(z.label==='Away')a=z.odds;});
  if(h&&d&&a){o.h=h;o.d=d;o.a=a;break;}
 }
 if(o.h===null)o.note+='no 1X2; ';
 if(ou){
  Array.prototype.forEach.call(ou.querySelectorAll('[data-op^=event-detail-market-content-specifier-combo-row]'),function(r){
   var p=r.querySelector('p');var line=p?p.textContent.trim():'';
   var v=Array.prototype.map.call(r.querySelectorAll('[data-op=outcome-btn]'),function(btn){return oddsNum(btn.textContent);});
   if(/^[0-9]+\.5$/.test(line)&&v.length>=2&&v[0]&&v[1]&&!o.ou[line])o.ou[line]=[v[0],v[1]];
  });
 }
 var xm=[['th','Home Over/Under'],['ta','Away Over/Under'],['h1','1st Half - Over/Under']];
 for(i=0;i<xm.length;i++){
  var b=ex[xm[i][1]];if(!b)continue;
  if(!b.querySelector('[data-op^=event-detail-market-content-specifier-combo-row]'))await openMkt(doc,b);
  var cr=comboRows(b);if(Object.keys(cr).length)o[xm[i][0]]=cr;
 }
 if(ex['GG/NG']){
  if(await openMkt(doc,ex['GG/NG'])){
   var gy=null,gn=null;
   mktOutcomes(ex['GG/NG']).forEach(function(z){if(/^yes$/i.test(z.label))gy=z.odds;else if(/^no$/i.test(z.label))gn=z.odds;});
   if(gy&&gn)o.gg=[gy,gn];
  }
 }
 return o;
}
function trimStats(tk){
 var i=-1,k,j;
 for(k=0;k<tk.length;k++){if(String(tk[k]).toLowerCase()==='matches played'){i=k;break;}}
 if(i<3)return tk;
 j=tk.length;
 for(k=i;k<tk.length;k++){if(String(tk[k]).toLowerCase()==='total cards'){j=Math.min(tk.length,k+4);break;}}
 return tk.slice(i-3,j);
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
function skipRec(rec){rec.status=timedOut?'TIMEOUT':'SKIPPED';frameBox.innerHTML='';return rec;}
async function processUrl(url,opts){
 var ICON='.event-widget-item[data-icon=statistics]';
 var t=teams(url);var rec={readAt:Date.now(),id:idOf(url),url:url,league:leagueOf(url),home:t[0],away:t[1],status:'',via:'',note:'',h:[],a:[]};
 var fr=document.createElement('iframe');
 fr.src=url;fr.style.cssText='width:100vw;max-width:100vw;height:420px;border:1px solid gray;background:white;';
 frameBox.innerHTML='';frameBox.appendChild(fr);
 var doc=null;var manual=false;
 var ready=await waitFor(function(){doc=fr.contentDocument;return doc&&doc.querySelector('[data-op^=event-detail]');},40000);
 if(skipFlag){return skipRec(rec);}
 if(!ready){rec.status=doc?'NO_STATS_BUTTON':'FRAME_BLOCKED';frameBox.innerHTML='';return rec;}
 var si=startInfo(doc);rec.kickoff=si.text;
 if(si.started){rec.status='LIVE_OR_FINISHED';frameBox.innerHTML='';return rec;}
 try{setStatus('Reading odds ('+rec.home+' vs '+rec.away+')');rec.odds=await readOdds(doc);rec.odds.t=Date.now();}catch(e){rec.odds={note:'odds error: '+e.message};}
 if(skipFlag){return skipRec(rec);}
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
  var s2=function(a){return a.filter(function(x){return x.gf!==null&&x.gf>=2;}).length;};
  rec.gate=(s2(rec.h)>=opts.minScore&&s2(rec.a)>=opts.minScore)?'PASS':'REJECT';
  if(rec.gate==='REJECT'&&opts.statsAll&&!skipFlag){
   try{
    rec.tabs={};rec.tabstatus={};
    setStatus('Reading team stats ('+rec.home+' vs '+rec.away+')');
    var cur0=await stable(doc);
    var tr0=await readTab(doc,'H2H(New)',cur0.join('~'));
    rec.tabs['H2H(New)']=trimStats(tr0.tokens);rec.tabstatus['H2H(New)']=tr0.status;
   }catch(e){rec.tabs=null;delete rec.tabstatus;}
  }
  if(rec.gate==='PASS'){
   rec.tabs={};rec.tabstatus={};
   rec.tabs['H2H']=await stable(doc);
   var prev=rec.tabs['H2H'].join('~');
   for(var ti=0;ti<EXTRA_TABS.length;ti++){
    setStatus('Reading tab '+EXTRA_TABS[ti]+' ('+rec.home+' vs '+rec.away+')');
    var tr=await readTab(doc,EXTRA_TABS[ti],prev);
    rec.tabs[EXTRA_TABS[ti]]=tr.tokens;rec.tabstatus[EXTRA_TABS[ti]]=tr.status;
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
function tablesLoad(){try{return JSON.parse(localStorage.getItem('gg2_tables_v1'))||{};}catch(e){return {};}}
function tablesSave(t){localStorage.setItem('gg2_tables_v1',JSON.stringify(t));}
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
function resLoad(){try{return JSON.parse(localStorage.getItem('gg2_results_v1'))||{};}catch(e){return {};}}
function resSave(r){localStorage.setItem('gg2_results_v1',JSON.stringify(r));}
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
var RESULTS_BATCH=60;
async function freeFrame(){var f=frameBox.querySelector('iframe');if(f){try{f.src='about:blank';}catch(e){}await sleep(250);}frameBox.innerHTML='';}
async function readResultPage(url){var r=await readResultPage0(url);await freeFrame();return r;}
async function readResultPage0(url){
 var t=teams(url);var rec={readAt:Date.now(),id:idOf(url),url:url,home:t[0],away:t[1],status:''};
 var fr=document.createElement('iframe');
 fr.src=url;fr.style.cssText='width:100vw;max-width:100vw;height:300px;border:1px solid gray;background:white;';
 frameBox.innerHTML='';frameBox.appendChild(fr);
 var doc=null;
 var ready=await waitFor(function(){
  doc=fr.contentDocument;if(!doc)return null;
  if(doc.querySelector('[data-op=event-detail-team-name-with-score]'))return 'score';
  if(doc.querySelector('[data-op^=event-detail]')){var s0=startInfo(doc);if(s0.text&&!s0.started)return 'future';}
  return null;
 },40000);
 if(skipFlag){rec.status=timedOut?'TIMEOUT':'SKIPPED';frameBox.innerHTML='';return rec;}
 if(!ready){rec.status=doc?'NO_SCORE':'FRAME_BLOCKED';frameBox.innerHTML='';return rec;}
 if(ready==='future'){rec.status='NOT_STARTED';rec.kickoff=startInfo(doc).text;frameBox.innerHTML='';return rec;}
 var s1=startInfo(doc);
 if(s1.text&&!s1.started){rec.status='NOT_STARTED';rec.kickoff=s1.text;frameBox.innerHTML='';return rec;}
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
 var urls=ta.value.split(String.fromCharCode(10)).join(' ').split(' ').map(function(u){return u.trim();}).filter(function(u){return idOf(u);});
 var R=resLoad();var early=0,gaveUp=0,noData=0,crashed=0,listed=0;
 if(!urls.length){
  var d=load().done;
  urls=Object.keys(d).map(function(k){return d[k];}).filter(function(r){
   if(!r.url||(R[r.id]&&R[r.id].status==='ENDED'))return false;
   var k=parseKick(r.kickoff);
   if(!k&&r.status!=='OK'){noData++;return false;}
   if(k&&(Date.now()-k.getTime())<150*60000){early++;return false;}
   var o=R[r.id];
   if(o&&o.status==='OPENING'){crashed++;return false;}
   if(o&&o.tries>=2&&k&&(Date.now()-k.getTime())>36*3600000){gaveUp++;return false;}
   return true;
  }).map(function(r){return r.url;});
 }else{
  var dn=load().done;
  urls=urls.filter(function(u){var r=dn[idOf(u)];var k=r&&parseKick(r.kickoff);if(k&&(Date.now()-k.getTime())<150*60000){early++;return false;}var o=R[idOf(u)];if(o&&o.status==='OPENING'){crashed++;return false;}return true;});
 }
 urls=urls.filter(function(u){if(skipHit(u)){listed++;return false;}return true;});
 var seen={};urls=urls.filter(function(u){var i=idOf(u);if(seen[i]||(R[i]&&R[i].status==='ENDED'))return false;seen[i]=1;return true;});
 if(!urls.length){setStatus('Nothing to open. '+early+' not played yet, '+gaveUp+' never finished (postponed?), '+crashed+' crashed or were interrupted last time, '+noData+' had no usable data, '+listed+' on your skip list (all skipped without opening). Paste match links, or run a Full run first (without clearing).');return;}
 stopFlag=false;
 try{if(navigator.wakeLock)navigator.wakeLock.request('screen').catch(function(){});}catch(e){}
 var opened=0;
 for(var i=0;i<urls.length;i++){
  if(stopFlag){setStatus('Stopped.');return;}
  if(opened>=RESULTS_BATCH){setStatus('Opened '+opened+' pages; '+(urls.length-i)+' left. Reload the football.com page to free memory, tap the bookmarklet, then tap Read results again to continue.');return;}
  setStatus('Result '+(i+1)+' of '+urls.length+': '+teams(urls[i]).join(' vs '));
  var tn=teams(urls[i]);var id0=idOf(urls[i]);R=resLoad();var pv0=R[id0];
  R[id0]={readAt:Date.now(),id:id0,url:urls[i],home:tn[0],away:tn[1],status:'OPENING',tries:((pv0&&pv0.tries)||0)+1};
  try{resSave(R);}catch(e){setStatus('Storage full. Tap Save all first.');return;}
  opened++;
  skipFlag=false;timedOut=false;var ct=setTimeout(function(){timedOut=true;skipFlag=true;},70000);
  var rec=await readResultPage(urls[i]);
  clearTimeout(ct);skipFlag=false;timedOut=false;
  R=resLoad();var pr=R[rec.id];rec.tries=(pr&&pr.tries)||1;R[rec.id]=rec;try{resSave(R);}catch(e){setStatus('Storage full. Tap Save all first.');return;}
  if(rec.status!=='NOT_STARTED')await sleep(800+Math.random()*800);
 }
 R=resLoad();var v=Object.keys(R).map(function(k){return R[k];});
 var c=function(st){return v.filter(function(r){return r.status===st;}).length;};
 setStatus('Results: '+c('ENDED')+' final scores read, '+(c('NOT_ENDED')+c('NOT_STARTED'))+' not finished or not started yet, '+(v.length-c('ENDED')-c('NOT_ENDED')-c('NOT_STARTED'))+' unreadable. Skipped without opening: '+early+' not played yet, '+gaveUp+' never finished, '+crashed+' crashed or interrupted before, '+noData+' without usable data, '+listed+' on your skip list. Tap Save new.');
}
async function runFull(){
 var minScore=parseInt(scoreBox.value,10)||3;
 var urls=ta.value.split(String.fromCharCode(10)).join(' ').split(' ').map(function(u){return u.trim();}).filter(function(u){return idOf(u);});
 var seen={};urls=urls.filter(function(u){var i=idOf(u);if(seen[i])return false;seen[i]=1;return true;});
 if(!urls.length){setStatus('Paste match URLs first.');return;}
 stopFlag=false;
 try{if(navigator.wakeLock)navigator.wakeLock.request('screen').catch(function(){});}catch(e){}
 var passUrls=[];var okUrls=[];
 for(var i=0;i<urls.length;i++){
  if(stopFlag){setStatus('Stopped.');return;}
  var id=idOf(urls[i]);var st=load();var old=st.done[id];
  if(skipHit(urls[i]))continue;
  if(old&&old.status==='OPENING')continue;
  var fresh=old&&old.readAt&&(Date.now()-old.readAt)<6*3600000;
  if(old&&fresh&&(old.status==='LIVE_OR_FINISHED'||old.status==='NO_STATS_BUTTON'||old.status==='NO_STATS_ICON'))continue;
  if(old&&old.status==='OK'&&fresh&&(old.gate==='REJECT'||(old.gate==='PASS'&&old.tabs))){if(old.gate==='PASS')passUrls.push(urls[i]);okUrls.push(urls[i]);continue;}
  setStatus('Match '+(i+1)+' of '+urls.length+': '+teams(urls[i]).join(' vs '));
  var tn=teams(urls[i]);st=load();st.done[id]={readAt:Date.now(),id:id,url:urls[i],league:leagueOf(urls[i]),home:tn[0],away:tn[1],status:'OPENING',via:'',note:'',h:[],a:[]};
  try{save(st);}catch(e){setStatus('Storage full. Tap Save all, then Clear saved.');return;}
  skipFlag=false;timedOut=false;var capTimer=setTimeout(function(){timedOut=true;skipFlag=true;},210000);
  var rec=await processUrl(urls[i],{full:true,minScore:minScore,statsAll:statsBox.checked});
  clearTimeout(capTimer);
  if(skipFlag||timedOut){rec.status=timedOut?'TIMEOUT':'SKIPPED';delete rec.tabs;delete rec.tabstatus;delete rec.gate;frameBox.innerHTML='';}
  skipFlag=false;timedOut=false;
  st=load();st.done[rec.id]=rec;
  try{save(st);}catch(e){setStatus('Storage full. Tap Save all, then Clear saved.');return;}
  if(rec.gate==='PASS')passUrls.push(urls[i]);
  if(rec.status==='OK')okUrls.push(urls[i]);
  await sleep(1500+Math.random()*1500);
 }
 var seenL={};var tl=tablesLoad();
 var leagueUrls=allBox.checked?okUrls:passUrls;
 for(var j=0;j<leagueUrls.length;j++){
  if(stopFlag){setStatus('Stopped.');return;}
  var lg=leagueOf(leagueUrls[j]);
  if(!lg||seenL[lg]||isCup(lg)||(tl[lg]&&tl[lg].status==='OK'&&tl[lg].readAt&&(Date.now()-tl[lg].readAt)<12*3600000))continue;
  if(skipHit(leagueUrls[j]))continue;
  if(tl[lg]&&tl[lg].status==='OPENING'&&tl[lg].url===leagueUrls[j])continue;
  seenL[lg]=1;
  setStatus('League table: '+lg);
  tl[lg]={readAt:Date.now(),league:lg,url:leagueUrls[j],status:'OPENING',note:'',views:{}};tablesSave(tl);
  skipFlag=false;timedOut=false;var capT2=setTimeout(function(){timedOut=true;skipFlag=true;},150000);
  var tr=await readLeague(leagueUrls[j]);
  clearTimeout(capT2);skipFlag=false;timedOut=false;
  tl=tablesLoad();tl[lg]=tr;tablesSave(tl);
 }
 var d=load().done;var vals=Object.keys(d).map(function(k){return d[k];});
 var pass=vals.filter(function(r){return r.gate==='PASS';}).length;
 var rej=vals.filter(function(r){return r.gate==='REJECT';}).length;
 var cnt=function(f){return vals.filter(f).length;};
 setStatus('Finished. '+pass+' passed the scoring gate (full read), '+rej+' rejected. Skipped: '+cnt(function(r){return r.status==='LIVE_OR_FINISHED';})+' already started, '+cnt(function(r){return r.status==='NO_STATS_BUTTON'||r.status==='NO_STATS_ICON';})+' without stats, '+cnt(function(r){return r.status==='SKIPPED'||r.status==='TIMEOUT';})+' skipped or timed out. Tap Save new.');
}
function markLoad(){return +localStorage.getItem('gg2_export_mark_v1')||0;}
function everythingJson(all){
 var mark=all?0:markLoad();var st=load();var m={};
 Object.keys(st.done).forEach(function(k){var r=st.done[k];if((r.readAt||0)>mark)m[k]=r;});
 var R=resLoad();var res={};
 Object.keys(R).forEach(function(k){if((R[k].readAt||0)>mark)res[k]=R[k];});
 var T=tablesLoad();var tb={};var cutoff=Date.now()-48*3600000;
 Object.keys(T).forEach(function(k){if(all||(T[k].readAt||0)>cutoff)tb[k]=T[k];});
 return {json:JSON.stringify({format:'gg2-everything-1',created:new Date().toISOString(),scope:all?'everything stored in the browser':'only matches read since the last save',matches:m,tables:tb,results:res}),
  nm:Object.keys(m).length,nr:Object.keys(res).length,total:Object.keys(st.done).length};
}
function saveFile(text){var bl=new Blob([text],{type:'application/json'});var a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download='gg2_everything.json';document.body.appendChild(a);a.click();a.remove();}
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
statusEl.textContent='Ready. '+Object.keys(load().done).length+' saved from before.';
ta=document.createElement('textarea');ta.placeholder='Paste match URLs, one per line';ta.style.cssText='width:94vw;height:80px;box-sizing:border-box;';
out=document.createElement('textarea');out.style.cssText='width:94vw;height:70px;box-sizing:border-box;display:none;margin-top:6px;';
frameBox=document.createElement('div');frameBox.style.cssText='margin-top:6px;';
var bStart=mk('Start',run);
var bStop=mk('Stop',function(){stopFlag=true;});
var bCopy=mk('Copy CSV',async function(){var c=toCsv(load().done);out.style.display='block';out.value=c;try{await navigator.clipboard.writeText(c);setStatus('Copied.');}catch(e){out.select();setStatus('Copy from the box below.');}});
var bDl=mk('Download',function(){var bl=new Blob([toCsv(load().done)],{type:'text/csv'});var a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download='gg2_results.csv';document.body.appendChild(a);a.click();a.remove();});
var bClr=mk('Clear saved',function(){if(confirm('Delete saved results and league tables?')){localStorage.removeItem(KEY);localStorage.removeItem('gg2_tables_v1');localStorage.removeItem('gg2_results_v1');localStorage.removeItem('gg2_export_mark_v1');setStatus('Cleared.');}});
var bTab=mk('Read tables',runTables);
var bTabCopy=mk('Copy tables',async function(){var c=tablesCsv(tablesLoad());if(c.split(String.fromCharCode(10)).length<2){setStatus('Nothing to copy yet. Tap Table status to see why.');return;}out.style.display='block';out.value=c;try{await navigator.clipboard.writeText(c);setStatus('Tables copied.');}catch(e){out.select();setStatus('Copy from the box below.');}});
var bTabStat=mk('Table status',function(){var t=tablesLoad();var ks=Object.keys(t);out.style.display='block';out.value=ks.length?ks.map(function(k){var r=t[k];return k+': '+r.status+(r.note?' ('+r.note+')':'')+(r.status==='OK'?' - '+r.views.overall.length+' teams':'')+(r.readAt?', read '+Math.round((Date.now()-r.readAt)/360000)/10+'h ago':'');}).join(String.fromCharCode(10)):'No leagues read yet.';});
var bTabDl=mk('Download tables',function(){var c=tablesCsv(tablesLoad());if(c.split(String.fromCharCode(10)).length<2){setStatus('Nothing to download yet. Tap Table status to see why.');return;}var bl=new Blob([c],{type:'text/csv'});var a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download='gg2_tables.csv';document.body.appendChild(a);a.click();a.remove();});
var scoreBox=document.createElement('input');scoreBox.type='number';scoreBox.value='3';scoreBox.style.cssText='width:44px;margin:3px 3px 0 0;padding:6px;';
var scoreLbl=document.createElement('span');scoreLbl.textContent=' min 2+ goal games (of 5): ';
var bFull=mk('Full run',runFull);
var bRes=mk('Read results',runResults);
var bEvDl=mk('Save new',function(){
 var e=everythingJson(false);
 if(!e.nm&&!e.nr){setStatus('Nothing new since your last save. Tap Save all if you want everything stored.');return;}
 saveFile(e.json);localStorage.setItem('gg2_export_mark_v1',String(Date.now()));
 setStatus('Saved '+e.nm+' new matches and '+e.nr+' results. '+(e.total-e.nm)+' older matches stay in the browser but will not be in the next save.');
});
var bEvCopy=mk('Copy new',async function(){
 var e=everythingJson(false);
 if(!e.nm&&!e.nr){setStatus('Nothing new since your last save. Tap Save all if you want everything stored.');return;}
 out.style.display='block';out.value=e.json;
 try{await navigator.clipboard.writeText(e.json);localStorage.setItem('gg2_export_mark_v1',String(Date.now()));setStatus('Copied '+e.nm+' new matches and '+e.nr+' results.');}
 catch(x){out.select();setStatus('Select all in the box below and copy it. (Not marked as saved yet.)');}
});
var bEvAll=mk('Save all',function(){var e=everythingJson(true);saveFile(e.json);setStatus('Saved all '+e.nm+' stored matches (older ones included).');});
var statsBox=document.createElement('input');statsBox.type='checkbox';statsBox.checked=true;statsBox.style.cssText='margin:6px 4px 0 6px;transform:scale(1.4);';
var statsLbl=document.createElement('span');statsLbl.textContent=' Read season team stats for EVERY fixture (slower; needed to test them without bias)';
var allBox=document.createElement('input');allBox.type='checkbox';allBox.checked=true;allBox.style.cssText='margin:6px 4px 0 6px;transform:scale(1.4);';
var allLbl=document.createElement('span');allLbl.textContent=' Read the table of EVERY league scanned (season context + learning)';
var skipBoxW=document.createElement('input');skipBoxW.type='text';skipBoxW.placeholder='Skip list: words in the match link, comma separated (e.g. cyprus,montenegro)';skipBoxW.style.cssText='width:94vw;box-sizing:border-box;margin:4px 0;padding:6px;';
try{skipBoxW.value=localStorage.getItem('gg2_skipwords_v1')||'';}catch(e){}
skipBoxW.oninput=function(){try{localStorage.setItem('gg2_skipwords_v1',skipBoxW.value);}catch(e){}};
var bForget=mk('Forget crash marks',function(){
 var n=0;var R=resLoad();Object.keys(R).forEach(function(k){if(R[k].status==='OPENING'){delete R[k];n++;}});resSave(R);
 var st=load();Object.keys(st.done).forEach(function(k){if(st.done[k].status==='OPENING'){delete st.done[k];n++;}});save(st);
 var T=tablesLoad();Object.keys(T).forEach(function(k){if(T[k].status==='OPENING'){delete T[k];n++;}});tablesSave(T);
 setStatus('Forgot '+n+' crash marks. Those pages will be tried again.');
});
var bSkip=mk('Skip this match',function(){skipFlag=true;setStatus('Skipping this match...');});
var unBox=document.createElement('input');unBox.type='checkbox';unBox.checked=true;unBox.style.cssText='margin:6px 4px 0 6px;transform:scale(1.4);';
var unLbl=document.createElement('span');unLbl.textContent=' Unattended (never wait for my taps)';
var bClose=mk('Close',function(){stopFlag=true;box.style.display='none';});
box.appendChild(statusEl);box.appendChild(bSkip);box.appendChild(document.createElement('br'));box.appendChild(ta);box.appendChild(skipBoxW);
box.appendChild(scoreLbl);box.appendChild(scoreBox);box.appendChild(document.createElement('br'));box.appendChild(unBox);box.appendChild(unLbl);box.appendChild(document.createElement('br'));box.appendChild(allBox);box.appendChild(allLbl);box.appendChild(document.createElement('br'));box.appendChild(statsBox);box.appendChild(statsLbl);box.appendChild(document.createElement('br'));
[bFull,bRes,bEvDl,bEvCopy,bEvAll,bStart,bStop,bTab,bTabStat,bForget,bClr,bClose].forEach(function(b){box.appendChild(b);});
box.appendChild(out);box.appendChild(frameBox);
document.body.appendChild(box);
window.__gg2=function(){box.style.display='block';};
window.__gg2t={readResult:readResult,tokensOf:tokensOf,readRows:readRows,parseTable:parseTable,tableText:tableText,tablesCsv:tablesCsv,leagueOf:leagueOf,isCup:isCup};
}catch(e){alert('GG2 error: '+e.message);}
})();
