(function(){
try{alert('GG2 v4 loaded');
if(window.__gg2){window.__gg2();return;}
var KEY='gg2_bm_v1';
var BTN='button[data-op=event-detail-market-stats-button]';
var MATCH='.sr-last-matches__match';
var stopFlag=false;
function load(){try{return JSON.parse(localStorage.getItem(KEY))||{done:{}};}catch(e){return {done:{}};}}
function save(s){localStorage.setItem(KEY,JSON.stringify(s));}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}
async function waitFor(fn,ms){var t=Date.now();while(Date.now()-t<ms){try{var v=fn();if(v)return v;}catch(e){}await sleep(300);}return null;}
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
function setStatus(t){statusEl.textContent=t;}
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
async function processUrl(url){
 var ICON='.event-widget-item[data-icon=statistics]';
 var t=teams(url);var rec={id:idOf(url),url:url,league:leagueOf(url),home:t[0],away:t[1],status:'',via:'',note:'',h:[],a:[]};
 var fr=document.createElement('iframe');
 fr.src=url;fr.style.cssText='width:100vw;max-width:100vw;height:420px;border:1px solid gray;background:white;';
 frameBox.innerHTML='';frameBox.appendChild(fr);
 var doc=null;var manual=false;
 var icon=await waitFor(function(){doc=fr.contentDocument;return doc&&doc.querySelector(ICON);},45000);
 if(!icon){rec.status=doc?(doc.querySelector(BTN)?'NO_STATS_ICON':'NO_STATS_BUTTON'):'FRAME_BLOCKED';frameBox.innerHTML='';return rec;}
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
 if(!w){setStatus('Tap the stats icon in the frame now (25 seconds).');w=await waitFor(function(){return doc.querySelector(MATCH);},25000);}
 if(!w){rec.status='NO_WIDGET';frameBox.innerHTML='';return rec;}
 rec.via=manual?'manual':'auto';
 await sleep(1500);
 var f=readForm(doc);rec.h=f.left;rec.a=f.right;
 rec.status=(rec.h.length&&rec.a.length)?'OK':'PARTIAL';
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
function tablesLoad(){try{return JSON.parse(localStorage.getItem('gg2_tables_v1'))||{};}catch(e){return {};}}
function tablesSave(t){localStorage.setItem('gg2_tables_v1',JSON.stringify(t));}
function pickPhase(v){
 var best={};var multi=false;
 v.overall.forEach(function(r){if(best[r.team]){multi=true;}if(!best[r.team]||r.P>best[r.team].P)best[r.team]={P:r.P,g:r.g};});
 var out={multi:multi};
 ['overall','home','away'].forEach(function(k){out[k]=v[k].filter(function(r){return best[r.team]&&r.g===best[r.team].g;});});
 return out;
}
async function readLeague(url){
 var ICON='.event-widget-item[data-icon=statistics]';
 var lg=leagueOf(url);var rec={league:lg,url:url,status:'',note:'',views:{}};
 if(isCup(lg)){rec.status='SKIPPED_CUP';return rec;}
 var fr=document.createElement('iframe');
 fr.src=url;fr.style.cssText='width:100vw;max-width:100vw;height:420px;border:1px solid gray;background:white;';
 frameBox.innerHTML='';frameBox.appendChild(fr);
 var doc=null;
 var icon=await waitFor(function(){doc=fr.contentDocument;return doc&&doc.querySelector(ICON);},45000);
 if(!icon){rec.status=doc?'NO_STATS_ICON':'FRAME_BLOCKED';frameBox.innerHTML='';return rec;}
 var targets=[icon];var wr=icon.closest('.event-widget-item-wrapper');if(wr)targets.push(wr);
 var nav=null;
 for(var i=0;i<targets.length&&!nav;i++){
  setStatus('Opening stats for '+lg+' ...');
  tap(targets[i]);
  nav=await waitFor(function(){return navItem(doc,'Table');},9000);
 }
 if(!nav){setStatus('Tap the stats icon in the frame now (25 seconds).');nav=await waitFor(function(){return navItem(doc,'Table');},25000);}
 if(!nav){rec.status='NO_TABLE_TAB';frameBox.innerHTML='';return rec;}
 tap(nav);
 var overall=await waitFor(function(){var r=parseTable(tableText(doc));return r.length>=4?r:null;},20000);
 if(!overall){setStatus('Tap the Table tab in the frame now (25 seconds).');overall=await waitFor(function(){var r=parseTable(tableText(doc));return r.length>=4?r:null;},25000);}
 if(!overall){rec.status='NO_TABLE';frameBox.innerHTML='';return rec;}
 rec.views.overall=overall;
 var prev=JSON.stringify(overall);
 var names=['home','away'];
 for(var k=0;k<2;k++){
  var label=k===0?'Home':'Away';
  var el=toggleEl(doc,label);
  var got=null;
  if(el){
   tap(el);
   got=await waitFor(function(){var r=parseTable(tableText(doc));return (r.length>=4&&JSON.stringify(r)!==prev)?r:null;},9000);
   if(!got&&el.parentElement){tap(el.parentElement);got=await waitFor(function(){var r=parseTable(tableText(doc));return (r.length>=4&&JSON.stringify(r)!==prev)?r:null;},9000);}
  }
  if(!got){setStatus('Tap '+label+' in the frame now (20 seconds).');got=await waitFor(function(){var r=parseTable(tableText(doc));return (r.length>=4&&JSON.stringify(r)!==prev)?r:null;},20000);}
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
  if(st[lg]&&st[lg].status==='OK')continue;
  setStatus('League table '+(i+1)+' of '+list.length+': '+lg);
  var rec=await readLeague(list[i]);
  st=tablesLoad();st[lg]=rec;tablesSave(st);
  await sleep(1500+Math.random()*1500);
 }
 var all=tablesLoad();var ok=Object.keys(all).filter(function(k){return all[k].status==='OK';}).length;
 setStatus('Tables finished. '+ok+' of '+Object.keys(all).length+' leagues OK. Tap Copy tables.');
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
  var rec=await processUrl(urls[i]);
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
var bClr=mk('Clear saved',function(){if(confirm('Delete saved results?')){localStorage.removeItem(KEY);setStatus('Cleared.');}});
var bTab=mk('Read tables',runTables);
var bTabCopy=mk('Copy tables',async function(){var c=tablesCsv(tablesLoad());out.style.display='block';out.value=c;try{await navigator.clipboard.writeText(c);setStatus('Tables copied.');}catch(e){out.select();setStatus('Copy from the box below.');}});
var bClose=mk('Close',function(){stopFlag=true;box.style.display='none';});
box.appendChild(statusEl);box.appendChild(ta);
[bStart,bStop,bCopy,bDl,bTab,bTabCopy,bClr,bClose].forEach(function(b){box.appendChild(b);});
box.appendChild(out);box.appendChild(frameBox);
document.body.appendChild(box);
window.__gg2=function(){box.style.display='block';};
window.__gg2t={parseTable:parseTable,tableText:tableText,tablesCsv:tablesCsv,leagueOf:leagueOf,isCup:isCup};
}catch(e){alert('GG2 error: '+e.message);}
})();
