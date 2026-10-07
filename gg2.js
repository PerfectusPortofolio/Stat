javascript:(function(){
try{alert('GG2 loaded');
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
 var head=['id','home','away','status','h1','h2','h3','h4','h5','a1','a2','a3','a4','a5'];
 var rows=Object.keys(done).map(function(k){
  var r=done[k];var c=[r.id,r.home,r.away,r.status];
  for(var i=0;i<5;i++)c.push(cell(r.h[i]));
  for(var j=0;j<5;j++)c.push(cell(r.a[j]));
  return c.map(q).join(',');
 });
 return [head.join(',')].concat(rows).join(String.fromCharCode(10));
}
var box,statusEl,frameBox,out,ta;
function setStatus(t){statusEl.textContent=t;}
async function processUrl(url){
 var t=teams(url);var rec={id:idOf(url),url:url,home:t[0],away:t[1],status:'',h:[],a:[]};
 var fr=document.createElement('iframe');
 fr.src=url;fr.style.cssText='width:100vw;max-width:100vw;height:330px;border:1px solid gray;background:white;';
 frameBox.innerHTML='';frameBox.appendChild(fr);
 var doc=null;
 var ok=await waitFor(function(){doc=fr.contentDocument;return doc&&doc.querySelector(BTN);},30000);
 if(!ok){rec.status=doc?'NO_STATS_BUTTON':'FRAME_BLOCKED';frameBox.innerHTML='';return rec;}
 ok.click();
 var w=await waitFor(function(){return doc.querySelector(MATCH);},25000);
 if(!w){var all=doc.querySelectorAll(BTN);if(all[1]){all[1].click();w=await waitFor(function(){return doc.querySelector(MATCH);},15000);}}
 if(!w){rec.status='NO_WIDGET';frameBox.innerHTML='';return rec;}
 await sleep(1500);
 var f=readForm(doc);rec.h=f.left;rec.a=f.right;
 rec.status=(rec.h.length&&rec.a.length)?'OK':'PARTIAL';
 frameBox.innerHTML='';
 return rec;
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
var bClose=mk('Close',function(){stopFlag=true;box.style.display='none';});
box.appendChild(statusEl);box.appendChild(ta);
[bStart,bStop,bCopy,bDl,bClr,bClose].forEach(function(b){box.appendChild(b);});
box.appendChild(out);box.appendChild(frameBox);
document.body.appendChild(box);
window.__gg2=function(){box.style.display='block';};
}catch(e){alert('GG2 error: '+e.message);}
})();
