(function(){
try{
if(window.__bbscan3){window.__bbscan3();return;}
var KEY='bb_scan_v3',stopFlag=false,NL=String.fromCharCode(10);
function load(){try{return JSON.parse(localStorage.getItem(KEY))||{};}catch(e){return {};}}
function save(s){try{localStorage.setItem(KEY,JSON.stringify(s));return true;}catch(e){return false;}}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}
async function waitFor(fn,ms){var t=Date.now();while(Date.now()-t<ms){try{var v=fn();if(v)return v;}catch(e){}await sleep(300);}return null;}
function idOf(u){var m=decodeURIComponent(u||'').match(/sr:match:([0-9]+)/);return m?m[1]:null;}
function teams(u){var p=decodeURIComponent(u).split('?')[0].split('/').filter(Boolean);var s=p[p.length-2]||'';var x=s.split('_vs_');return [(x[0]||'').replace(/_/g,' '),(x[1]||'').replace(/_/g,' ')];}
function leagueOf(u){var p=decodeURIComponent(u).split('?')[0].split('/').filter(Boolean);var i=p.indexOf('basketball');return i<0?'':p.slice(i+1,i+3).join('/');}
function tok(el,n){return String((el&&(el.innerText||el.textContent))||'').split(NL).map(function(x){return x.trim();}).filter(Boolean).join(' | ').slice(0,n);}
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
/* ---------- ODDS: capture EVERY market as raw rows; Python decodes later ---------- */
var AD='[data-op=event-detail-market-list-adapter]',OB='[data-op=outcome-btn]',TT='[data-op=event-detail-market-title]';
function snapshotMarkets(doc){
 var out=[];
 Array.prototype.forEach.call(doc.querySelectorAll(AD),function(a){
  var te=a.querySelector(TT),ide=a.querySelector('[data-market-id]'),ty=a.querySelector('[data-market-type]');
  out.push({title:te?tok(te,160):'',id:ide?ide.getAttribute('data-market-id'):null,type:ty?ty.getAttribute('data-market-type'):null,n:a.querySelectorAll(OB).length,t:tok(a,4000)});
 });
 return out;
}
function closedMarkets(doc){return Array.prototype.filter.call(doc.querySelectorAll(AD),function(a){return !a.querySelector(OB);});}
async function expandAll(doc){
 for(var pass=0;pass<3;pass++){
  var closed=closedMarkets(doc);
  if(!closed.length)break;
  for(var i=0;i<closed.length;i++){var te=closed[i].querySelector(TT);if(te){tap(te);await sleep(180);}}
  await sleep(1300);
 }
 return closedMarkets(doc).length;
}
async function sideTabs(doc,rec){
 var bar=doc.querySelector('[data-op=event-detail-market-bar-with-search]');
 if(!bar){rec.notes.push('no market bar');return;}
 rec.tab_markets={};
 var labels=['Players','Stats'];
 for(var i=0;i<labels.length;i++){
  var el=Array.prototype.slice.call(bar.querySelectorAll('*')).filter(function(e){return e.children.length===0&&e.textContent.trim()===labels[i];})[0];
  if(!el){rec.notes.push('tab '+labels[i]+' not found');continue;}
  tap(el);await sleep(1600);
  await expandAll(doc);
  var lst=doc.querySelector('[data-op=event-detail-market-list]');
  rec.tab_markets[labels[i]]={markets:snapshotMarkets(doc),text:tok(lst,6000)};
 }
}
/* ---------- STATS: Sportradar basketball widget (tabs: H2H, H2H(New), Table) ---------- */
function txt(e){return e?e.textContent.trim().replace(/\s+/g,' '):'';}
function mrow(w){
 var h=w.querySelectorAll('.sr-hth-match__home'),a=w.querySelectorAll('.sr-hth-match__away');
 return {date:txt(w.querySelector('.sr-hth-match__date')),comp:txt(w.querySelector('.sr-hth-match__tournament')),wdl:txt(w.querySelector('.sr-hth-match__wdl')),
  home:txt(h[0]),away:txt(a[0]),sh:txt(w.querySelector('.sr-hth-match__score-home')),sa:txt(w.querySelector('.sr-hth-match__score-away'))};
}
function hthColumns(doc){
 var cols=Array.prototype.slice.call(doc.querySelectorAll('.sr-hth-last-next-matches__team-column'));
 return {home:cols[0]?Array.prototype.map.call(cols[0].querySelectorAll('.sr-hth-match__wrapper'),mrow):[],
         away:cols[1]?Array.prototype.map.call(cols[1].querySelectorAll('.sr-hth-match__wrapper'),mrow):[]};
}
function widgetRaw(doc,n){var w=doc.querySelector('[data-sr-widget]');return tok(w,n||12000);}
function navByLabel(doc,label){
 var els=Array.prototype.slice.call(doc.querySelectorAll('.m-snap-nav-item'));
 for(var i=0;i<els.length;i++){if(els[i].textContent.trim()===label)return els[i];}
 return null;
}
function tableRows(doc){
 return Array.prototype.map.call(doc.querySelectorAll('.sr-livetable__tableRow.srm-dataRow'),function(tr,ix){
  var pos=txt(tr.querySelector('.sr-livetable__tablePosNum'))||String(ix+1),nm=txt(tr.querySelector('.sr-livetable__tableTeamName')),ab=txt(tr.querySelector('.sr-livetable__tableTeamAbbr'));
  var rest=Array.prototype.filter.call(tr.children,function(c){return !/srm-space|srm-pos|srm-team/.test(c.className);}).map(txt).filter(function(x){return x!=='';});
  return [pos,nm,ab].concat(rest).join(' | ');
 });
}
async function openTab(doc,label,readySel){
 var nav=navByLabel(doc,label);
 if(!nav)return false;
 tap(nav);
 var ok=await waitFor(function(){return doc.querySelector(readySel);},14000);
 if(!ok){tap(nav);ok=await waitFor(function(){return doc.querySelector(readySel);},8000);}
 if(ok)await sleep(1200);
 return !!ok;
}
async function readStats(doc,rec){
 var st=rec.stats={status:'',notes:[]};
 var icon=doc.querySelector('.event-widget-item[data-icon=statistics]');
 if(!icon){st.status='NO_STATS_ICON';return;}
 var targets=[icon];var wr=icon.closest('.event-widget-item-wrapper');if(wr)targets.push(wr);
 var w=null;
 for(var i=0;i<targets.length&&!w;i++){tap(targets[i]);w=await waitFor(function(){return doc.querySelector('[data-sr-widget]')&&doc.querySelector('.m-snap-nav-item');},12000);}
 if(!w){st.status='NO_WIDGET';return;}
 await sleep(1500);
 st.tabs=Array.prototype.map.call(doc.querySelectorAll('.m-snap-nav-item'),function(e){return e.textContent.trim();});
 var got=0;
 /* H2H (old): previous meetings with scores, last-5 margins, next matches (raw) */
 if(await openTab(doc,'H2H','.sr-meeting__match,.sr-last-matches__match')){
  st.h2h={raw:widgetRaw(doc),
   meetings:Array.prototype.map.call(doc.querySelectorAll('.sr-meeting__wrapper'),function(m){return tok(m,300);}),
   form_margins:Array.prototype.map.call(doc.querySelectorAll('.sr-last-matches__match'),function(m){return tok(m,120);})};
  got++;
 }else st.notes.push('H2H tab not read');
 /* H2H(New): last-5 scores with dates/competition, season PF/PA, matchup averages, threshold hit-rates */
 if(await openTab(doc,'H2H(New)','.sr-hth-last-next-matches__team-column .sr-hth-match__wrapper')){
  st.h2h_new={raw:widgetRaw(doc),last:hthColumns(doc)};
  var btns=Array.prototype.slice.call(doc.querySelectorAll('.sr-hth-toggle-button__button'));
  var nx=btns.filter(function(b){return /next/i.test(b.textContent);})[0];
  if(nx){tap(nx);await sleep(1800);st.h2h_new.next=hthColumns(doc);}
  got++;
 }else st.notes.push('H2H(New) tab not read');
 /* Table: league standings, Overall/Home/Away */
 if(await openTab(doc,'Table','.sr-livetable__tableRow')){
  st.table={overall:tableRows(doc)};
  var menus=Array.prototype.slice.call(doc.querySelectorAll('.sr-livetable__menu'));
  var labels=['Home','Away'];
  for(var k=0;k<2;k++){
   var m=menus.filter(function(e){return e.textContent.trim()===labels[k];})[0];
   if(!m){st.notes.push('table '+labels[k]+' toggle missing');continue;}
   var before=JSON.stringify(tableRows(doc));
   tap(m);
   await waitFor(function(){return JSON.stringify(tableRows(doc))!==before;},6000);
   await sleep(500);
   st.table[labels[k].toLowerCase()]=tableRows(doc);
  }
  got++;
 }else st.notes.push('Table tab not read');
 st.status=got===3?'OK':(got?'PARTIAL':'OPENED_UNREAD');
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
var statusEl=document.createElement('div');statusEl.style.cssText='font-weight:bold;margin:4px 0';
var ta=document.createElement('textarea');ta.style.cssText='width:100%;height:100px;font-size:11px';ta.placeholder='Match URLs, one per line';
var flt=document.createElement('input');flt.placeholder='only URLs containing (optional, e.g. NBA)';flt.style.cssText='width:100%;font-size:14px;padding:4px;box-sizing:border-box';
var out=document.createElement('textarea');out.style.cssText='width:100%;height:70px;font-size:11px';out.placeholder='JSON output';
var frameBox=document.createElement('div');
function btn(t,fn){var b=document.createElement('button');b.textContent=t;b.style.cssText='font-size:16px;padding:8px;margin:3px';b.onclick=fn;return b;}
function setStatus(t){statusEl.textContent=t;}
function all(){var st=load();return Object.keys(st).map(function(k){return st[k];});}
function stamp(){var d=new Date();function p(n){return (n<10?'0':'')+n;}return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'_'+p(d.getHours())+p(d.getMinutes());}
function download(){
 var arr=all();if(!arr.length){setStatus('Nothing stored yet');return;}
 var blob=new Blob([JSON.stringify(arr)],{type:'application/json'});
 var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='bb_scan_'+stamp()+'.json';
 document.body.appendChild(a);a.click();setTimeout(function(){a.remove();},1500);
 setStatus('Saved bb_scan_'+stamp()+'.json to Downloads ('+arr.length+' matches)');
}
function copyJson(){out.value=JSON.stringify(all());out.select();try{document.execCommand('copy');setStatus('Copied '+all().length+' matches');}catch(e){setStatus('Select all in the box and copy');}}
async function doCollect(){
 stopFlag=false;var urls={};collectNow(urls);
 for(var i=0;i<14&&!stopFlag;i++){window.scrollBy(0,Math.round(window.innerHeight*0.9));await sleep(700);collectNow(urls);setStatus('Collecting... '+Object.keys(urls).length+' links');}
 if(idOf(location.href)){var a=document.createElement('a');a.href=location.href;urls[idOf(location.href)]=a.href.split('?')[0];}
 var ks=Object.keys(urls);ta.value=ks.map(function(k){return urls[k];}).join(NL);
 setStatus(ks.length?('Found '+ks.length+' matches. Press Run.'):'No links found. Paste URLs manually.');
}
async function processUrl(url){
 var t=teams(url);
 var rec={id:idOf(url),home:t[0],away:t[1],league:leagueOf(url),url:url,captured:new Date().toISOString(),status:'',notes:[]};
 var fr=document.createElement('iframe');fr.src=url;
 fr.style.cssText='width:100vw;max-width:100vw;height:300px;border:1px solid gray;background:white;';
 frameBox.innerHTML='';frameBox.appendChild(fr);
 var doc=null;
 var ok=await waitFor(function(){doc=fr.contentDocument;return doc&&doc.querySelector(AD);},45000);
 if(!ok){rec.status=doc?'NO_MARKETS':'FRAME_BLOCKED';frameBox.innerHTML='';return rec;}
 await sleep(1200);
 rec.page_title=doc.title||'';
 var m=rec.page_title.match(/on (\d{1,2} \w{3}), (\d{1,2}:\d{2}) in (.*?) \|/);
 if(m){rec.kickoff_date=m[1];rec.kickoff_time=m[2];rec.league_name=m[3];}
 var left=await expandAll(doc);
 rec.markets=snapshotMarkets(doc);
 rec.markets_total=rec.markets.length;rec.markets_unexpanded=left;
 try{await sideTabs(doc,rec);}catch(e){rec.notes.push('tabs: '+(e.message||e));}
 try{await readStats(doc,rec);}catch(e){rec.notes.push('stats: '+(e.message||e));if(!rec.stats)rec.stats={status:'STATS_ERROR'};}
 rec.status='OK';
 frameBox.innerHTML='';
 return rec;
}
async function run(){
 stopFlag=false;var f=flt.value.trim().toLowerCase();
 var urls=ta.value.split(NL).map(function(u){return u.trim();}).filter(function(u){return idOf(u)&&(!f||u.toLowerCase().indexOf(f)>=0);});
 if(!urls.length){setStatus('No URLs. Press Collect links.');return;}
 var st=load(),done=0;
 for(var i=0;i<urls.length&&!stopFlag;i++){
  var id=idOf(urls[i]);
  if(st[id]&&st[id].status==='OK'){done++;continue;}
  setStatus('Match '+(i+1)+'/'+urls.length+': '+teams(urls[i]).join(' vs '));
  var rec=await processUrl(urls[i]);
  st=load();st[id]=rec;if(!save(st)){setStatus('Storage full. Saving file now.');download();return;}
 }
 setStatus((stopFlag?'Stopped. ':'Finished. ')+all().length+' matches stored.');
 download();
}
box.appendChild(statusEl);
box.appendChild(btn('Collect links',doCollect));box.appendChild(btn('Run',run));box.appendChild(btn('Stop',function(){stopFlag=true;setStatus('Stopping after this match...');}));
box.appendChild(btn('Download file',download));box.appendChild(btn('Copy JSON',copyJson));
box.appendChild(btn('Clear data',function(){if(confirm('Delete stored scans?')){localStorage.removeItem(KEY);setStatus('Cleared');}}));
box.appendChild(btn('Hide',function(){box.style.display='none';}));
box.appendChild(flt);box.appendChild(ta);box.appendChild(out);box.appendChild(frameBox);
document.body.appendChild(box);
window.__bbscan3=function(){box.style.display='block';};
setStatus('BB scan v3 ready. '+all().length+' matches stored.');
}catch(e){alert('BB scan v3 error: '+e.message);}
})();
