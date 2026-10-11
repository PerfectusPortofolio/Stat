(function(){
try{
var NL=String.fromCharCode(10);
function txt(e){return (e&&e.innerText||'').split(NL).map(function(x){return x.trim();}).filter(Boolean);}
function isOdds(x){return /^[0-9]+(\.[0-9]+)?$/.test(x);}
function teamsFromUrl(u){
 var p=decodeURIComponent(u).split('?')[0].split('/').filter(Boolean);
 var s=p[p.length-2]||'';var x=s.split('_vs_');
 return {home:(x[0]||'').replace(/_/g,' '),away:(x[1]||'').replace(/_/g,' ')};
}
function idOf(u){var m=decodeURIComponent(u).match(/sr:match:([0-9]+)/);return m?m[1]:null;}
function leagueOf(u){var p=decodeURIComponent(u).split('?')[0].split('/').filter(Boolean);var i=p.indexOf('basketball');return i>=0?p.slice(i+1,i+3).join('/'):'';}
function parseOutcome(b){
 var t=txt(b);var odds=null,label=[];
 t.forEach(function(x){if(isOdds(x)&&odds===null&&t.indexOf(x)===t.length-1)odds=+x;else label.push(x);});
 if(odds===null){var last=t[t.length-1];if(isOdds(last)){odds=+last;label=t.slice(0,-1);}}
 return {label:label.join(' '),odds:odds};
}
var tm=teamsFromUrl(location.href);
var rec={id:idOf(location.href),home:tm.home,away:tm.away,league:leagueOf(location.href),url:location.href,
 time_text:(txt(document.querySelector('[data-op=event-detail-status-bar-prematch-time]'))||[]).join(' '),
 captured:new Date().toISOString(),markets:[]};
Array.prototype.forEach.call(document.querySelectorAll('[data-op=event-detail-market-list-adapter]'),function(m){
 var title=txt(m.querySelector('[data-op=event-detail-market-title]')).join(' ');
 var mk={title:title,outcomes:[],ladder:[],headers:[]};
 var rows=m.querySelectorAll('[data-op^=event-detail-market-content-specifier-combo-row]');
 if(rows.length){
  var hdr=m.querySelector('[data-op=event-detail-market-content-specifier-combo]');
  var ht=txt(hdr);var h=[];ht.forEach(function(x){if(!isOdds(x)&&!/^-?[0-9.]+$/.test(x)&&h.length<3)h.push(x);});
  mk.headers=h;
  Array.prototype.forEach.call(rows,function(r){
   var t=txt(r);var line=t[0];
   var odds=Array.prototype.map.call(r.querySelectorAll('[data-op=outcome-btn]'),function(b){var tt=txt(b);return +tt[tt.length-1];});
   mk.ladder.push({line:line,odds:odds});
  });
 }else{
  Array.prototype.forEach.call(m.querySelectorAll('[data-op=outcome-btn]'),function(b){mk.outcomes.push(parseOutcome(b));});
 }
 if(mk.title&&(mk.ladder.length||mk.outcomes.length))rec.markets.push(mk);
});
rec.market_count=rec.markets.length;
var json=JSON.stringify(rec,null,1);
var box=document.createElement('div');
box.style.cssText='position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:2147483647;background:white;padding:8px;box-sizing:border-box';
var ta=document.createElement('textarea');ta.style.cssText='width:100%;height:80%;font-size:11px';ta.value=json;
var c=document.createElement('button');c.textContent='Close';c.style.cssText='font-size:18px;padding:8px;margin:6px';c.onclick=function(){box.remove();};
var cp=document.createElement('button');cp.textContent='Copy';cp.style.cssText='font-size:18px;padding:8px;margin:6px';
cp.onclick=function(){ta.select();try{document.execCommand('copy');cp.textContent='Copied';}catch(e){cp.textContent='Copy manually';}};
box.appendChild(c);box.appendChild(cp);box.appendChild(ta);document.body.appendChild(box);
}catch(e){alert('BB odds error: '+e.message);}
})();
