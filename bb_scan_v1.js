(function(){
try{
if(window.__bbscan){window.__bbscan();return;}
var KEY='bb_scan_v1',RAW_N=2,stopFlag=false,NL=String.fromCharCode(10);
function load(){try{return JSON.parse(localStorage.getItem(KEY))||{};}catch(e){return {};}}
function save(s){try{localStorage.setItem(KEY,JSON.stringify(s));}catch(e){alert('Storage full: copy JSON then Clear data');}}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}
async function waitFor(fn,ms){var t=Date.now();while(Date.now()-t<ms){try{var v=fn();if(v)return v;}catch(e){}await sleep(300);}return null;}
function idOf(u){var m=decodeURIComponent(u||'').match(/sr:match:([0-9]+)/);return m?m[1]:null;}
function teams(u){var p=decodeURIComponent(u).split('?')[0].split('/').filter(Boolean);var s=p[p.length-2]||'';var x=s.split('_vs_');return [(x[0]||'').replace(/_/g,' '),(x[1]||'').replace(/_/g,' ')];}
function leagueOf(u){var p=decodeURIComponent(u).split('?')[0].split('/').filter(Boolean);var i=p.indexOf('basketball');return i<0?'':p.slice(i+1,i+3).join('/');}
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
 fire('mousedown',w.MouseEvent,{buttons:1});fire('mouseup',w.MouseEvent,{});fire('click',w.MouseEvent,{});
}
/* ---------- odds parsing ---------- */
var NUM=/^[+-]?[0-9]+(\.[0-9]+)?$/;
function parseMarkets(doc){
 var out=[],seen={};
 Array.prototype.forEach.call(doc.querySelectorAll('[data-op=event-detail-market-list-adapter]'),function(m){
  var te=m.querySelector('[data-op=event-detail-market-title]');var title=te?te.textContent.trim():'';
  if(!title)return;
  var v=seen[title]=(seen[title]===undefined?0:seen[title]+1);
  var mk={title:title,variant:v,outcomes:[],ladder:[],headers:[]};
  var rows=m.querySelectorAll('[data-op^=event-detail-market-content-specifier-combo-row]');
  if(rows.length){
   var hdr=m.querySelector('[data-op=event-detail-market-content-specifier-combo]');var hs=[];
   if(hdr)Array.prototype.forEach.call(hdr.querySelectorAll('*'),function(e){if(e.children.length)return;var t=e.textContent.trim();if(/^[A-Za-z][A-Za-z ]{0,20}$/.test(t)&&hs.indexOf(t)<0&&hs.length<3)hs.push(t);});
   mk.headers=hs;var sl={};
   Array.prototype.forEach.call(rows,function(r){
    var toks=(r.innerText||r.textContent||'').split(/\s+/).filter(Boolean);var line=toks[0];
    if(!NUM.test(line||''))return;
    if(sl[line]){mk.repeats=true;return;}
    sl[line]=1;
    var odds=Array.prototype.map.call(r.querySelectorAll('[data-op=outcome-btn]'),function(b){var t=(b.innerText||b.textContent||'').trim().split(/\s+/);var x=parseFloat(t[t.length-1]);return isNaN(x)?null:x;});
    if(!odds.length)odds=toks.slice(1).map(parseFloat).filter(function(x){return !isNaN(x);});
    mk.ladder.push({line:+line,odds:odds});
   });
  }else{
   Array.prototype.forEach.call(m.querySelectorAll('[data-op=outcome-btn]'),function(b){
    var t=(b.innerText||b.textContent||'').split(/\s+/).filter(Boolean);var o=parseFloat(t[t.length-1]);
    mk.outcomes.push({label:t.slice(0,-1).join(' '),odds:isNaN(o)?null:o});
   });
  }
  if(mk.ladder.length||mk.outcomes.length)out.push(mk);
 });
 return out;
}
function mergeMarkets(into,list){
 var have={};into.forEach(function(m){have[m.title+'#'+m.variant]=1;});
 list.forEach(function(m){var k=m.title+'#'+m.variant;if(!have[k]){have[k]=1;into.push(m);}});
}
async function extraTabs(doc,markets,note){
 var bar=doc.querySelector('[data-op=event-detail-market-bar-with-search]');
 if(!bar){note.push('no market bar');return;}
 var labels=['Main','Points','Half','Quarters','Specials'];
 for(var i=0;i<labels.length;i++){
  var el=Array.prototype.slice.call(bar.querySelectorAll('*')).filter(function(e){return e.children.length===0&&e.textContent.trim()===labels[i];})[0];
  if(!el){note.push('tab '+labels[i]+' not found');continue;}
  tap(el);await sleep(1300);
  mergeMarkets(markets,parseMarkets(doc));
 }
}
/* ---------- stats parsing ---------- */
function parseRes(wdl,raw,opp){
 var m=(raw||'').match(/([0-9]+)[^0-9]+([0-9]+)/);
 if(!m)return {wdl:wdl,pf:null,pa:null,opp:opp};
 var a=+m[1],b=+m[2],hi=Math.max(a,b),lo=Math.min(a,b);
 return {wdl:wdl,pf:wdl==='W'?hi:lo,pa:wdl==='W'?lo:hi,opp:opp};
}
function readForm(doc){
 var out={left:[],right:[]};
 Array.prototype.slice.call(doc.querySelectorAll('.sr-teamform__lastXTeam')).forEach(function(b,i){
  var side=b.className.indexOf('srm-left')>=0?'left':(b.className.indexOf('srm-right')>=0?'right':(i===0?'left':'right'));
  Array.prototype.forEach.call(b.querySelectorAll('.sr-last-matches__match'),function(m){
   function t(s){var e=m.querySelector(s);return e?e.textContent.trim():'';}
   out[side].push(parseRes(t('.sr-last-matches__wdl'),t('.sr-last-matches__result'),t('.sr-last-matches__team-full')||t('.sr-last-matches__team')));
  });
 });
 return out;
}
function clip(s,n){return String(s||'').split(NL).map(function(x){return x.trim();}).filter(Boolean).join(' | ').slice(0,n);}
async function readStats(doc,rec,raw){
 var ICON='.event-widget-item[data-icon=statistics]';
 var icon=doc.querySelector(ICON);
 if(!icon){rec.stats_status='NO_STATS_ICON';return;}
 var targets=[icon];var wr=icon.closest('.event-widget-item-wrapper');if(wr)targets.push(wr);
 var w=null;
 for(var i=0;i<targets.length&&!w;i++){tap(targets[i]);w=await waitFor(function(){return doc.querySelector('.sr-last-matches__match')||doc.querySelector('.m-snap-nav-item');},9000);}
 if(!w){rec.stats_status='NO_WIDGET';return;}
 await sleep(1500);
 rec.stats_tabs=Array.prototype.map.call(doc.querySelectorAll('.m-snap-nav-item'),function(e){return e.textContent.trim();});
 var f=readForm(doc);rec.form_home=f.left;rec.form_away=f.right;
 rec.stats_status=(f.left.length&&f.right.length)?'OK':'PARTIAL';
 if(raw){
  rec.stats_raw={};
  var navs=Array.prototype.slice.call(doc.querySelectorAll('.m-snap-nav-item')).slice(0,8);
  for(var k=0;k<navs.length;k++){
   var label=navs[k].textContent.trim();
   tap(navs[k]);await sleep(1800);
   var ws=Array.prototype.slice.call(doc.querySelectorAll('[data-sr-widget]'));
   rec.stats_raw[label]=ws.map(function(x){return x.getAttribute('data-sr-widget')+': '+clip(x.innerText,1800);});
  }
 }
}
/* ---------- link collection ---------- */
function collectNow(into){
 function add(h){if(!h)return;var d;try{d=decodeURIComponent(h);}catch(e){d=h;}
  if(d.indexOf('/sport/basketball/')<0)return;var m=d.match(/sr:match:[0-9]+/);if(!m)return;
  var a=document.createElement('a');a.href=h;into[m[0]]=a.href.split('?')[0];}
 Array.prototype.forEach.call(document.querySelectorAll('a[href]'),function(a){add(a.getAttribute('href'));});
 Array.prototype.forEach.call(document.querySelectorAll('[data-href],[data-url],[data-link]'),function(e){add(e.getAttribute('data-href')||e.getAttribute('data-url')||e.getAttribute('data-link'));});
}
/* ---------- UI ---------- */
var box=document.createElement('div');
box.style.cssText='position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:2147483647;background:white;padding:6px;box-sizing:border-box;overflow:auto;font:14px sans-serif';
var statusEl=document.createElement('div');statusEl.style.cssText='font-weight:bold;margin:4px 0';statusEl.textContent='BB scan v1 ready';
var ta=document.createElement('textarea');ta.style.cssText='width:100%;height:110px;font-size:11px';ta.placeholder='Match URLs, one per line';
var out=document.createElement('textarea');out.style.cssText='width:100%;height:90px;font-size:11px';out.placeholder='JSON output appears here';
var frameBox=document.createElement('div');
var deep=document.createElement('input');deep.type='checkbox';deep.checked=true;
var lbl=document.createElement('label');lbl.appendChild(deep);lbl.appendChild(document.createTextNode(' scan extra odds tabs'));
function btn(t,fn){var b=document.createElement('button');b.textContent=t;b.style.cssText='font-size:16px;padding:8px;margin:3px';b.onclick=fn;return b;}
function setStatus(t){statusEl.textContent=t;}
function count(){return Object.keys(load()).length;}
async function doCollect(){
 var urls={};collectNow(urls);
 for(var i=0;i<14&&!stopFlag;i++){window.scrollBy(0,Math.round(window.innerHeight*0.9));await sleep(700);collectNow(urls);setStatus('Collecting... '+Object.keys(urls).length+' links');}
 if(/sr:match:/.test(decodeURIComponent(location.href))){var a=document.createElement('a');a.href=location.href;urls[idOf(location.href)]=a.href.split('?')[0];}
 var ks=Object.keys(urls);
 ta.value=ks.map(function(k){return urls[k];}).join(NL);
 setStatus(ks.length?('Found '+ks.length+' matches. Press Run.'):'No links found. Paste URLs manually.');
}
async function processUrl(url,idx,raw){
 var t=teams(url);
 var rec={id:idOf(url),home:t[0],away:t[1],league:leagueOf(url),url:url,captured:new Date().toISOString(),status:'',notes:[],markets:[]};
 var fr=document.createElement('iframe');fr.src=url;
 fr.style.cssText='width:100vw;max-width:100vw;height:300px;border:1px solid gray;background:white;';
 frameBox.innerHTML='';frameBox.appendChild(fr);
 var doc=null;
 var ok=await waitFor(function(){doc=fr.contentDocument;return doc&&doc.querySelector('[data-op=event-detail-market-list-adapter]');},45000);
 if(!ok){rec.status=doc?'NO_MARKETS':'FRAME_BLOCKED';frameBox.innerHTML='';return rec;}
 await sleep(1000);
 var hd=doc.querySelector('[data-op=event-detail-score-section]');rec.header_text=clip(hd&&hd.innerText,200);
 var ct=doc.querySelector('[data-op=event-detail-countdown-timer]');rec.countdown=clip(ct&&ct.innerText,60);
 rec.markets=parseMarkets(doc);
 if(deep.checked)await extraTabs(doc,rec.markets,rec.notes);
 try{await readStats(doc,rec,raw);}catch(e){rec.stats_status='STATS_ERROR';rec.notes.push(String(e.message||e));}
 rec.status=rec.markets.length?'OK':'NO_MARKETS';
 frameBox.innerHTML='';
 return rec;
}
async function run(){
 stopFlag=false;
 var urls=ta.value.split(NL).map(function(u){return u.trim();}).filter(function(u){return idOf(u);});
 if(!urls.length){setStatus('No URLs. Press Collect links.');return;}
 var st=load();
 for(var i=0;i<urls.length&&!stopFlag;i++){
  var id=idOf(urls[i]);
  if(st[id]&&st[id].status==='OK'){continue;}
  setStatus('Match '+(i+1)+'/'+urls.length+': '+teams(urls[i]).join(' vs '));
  var rec=await processUrl(urls[i],i,count()<RAW_N);
  st=load();st[id]=rec;save(st);
 }
 setStatus((stopFlag?'Stopped. ':'Done. ')+count()+' matches stored. Press Copy JSON.');
}
function copyJson(){
 var st=load();var arr=Object.keys(st).map(function(k){return st[k];});
 out.value=JSON.stringify(arr);out.select();
 try{document.execCommand('copy');setStatus('Copied '+arr.length+' matches. Paste into bb_scan.json');}catch(e){setStatus('Select all in the box and copy manually');}
}
box.appendChild(statusEl);
box.appendChild(btn('Collect links',doCollect));box.appendChild(btn('Run',run));box.appendChild(btn('Stop',function(){stopFlag=true;setStatus('Stopping after this match...');}));
box.appendChild(btn('Copy JSON',copyJson));box.appendChild(btn('Clear data',function(){if(confirm('Delete stored scans?')){localStorage.removeItem(KEY);setStatus('Cleared');}}));
box.appendChild(btn('Hide',function(){box.style.display='none';}));
box.appendChild(document.createElement('br'));box.appendChild(lbl);box.appendChild(ta);box.appendChild(out);box.appendChild(frameBox);
document.body.appendChild(box);
window.__bbscan=function(){box.style.display='block';};
setStatus('BB scan v1 ready. '+count()+' matches stored.');
}catch(e){alert('BB scan error: '+e.message);}
})();
