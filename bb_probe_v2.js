(function(){
try{
var NL=String.fromCharCode(10);
function docs(){
 var out=[document];
 Array.prototype.forEach.call(document.querySelectorAll('iframe'),function(f){try{if(f.contentDocument&&f.contentDocument.body)out.push(f.contentDocument);}catch(e){}});
 return out;
}
function srClasses(root){
 var seen={},list=[];
 Array.prototype.forEach.call(root.querySelectorAll('*'),function(e){
  String(e.className&&e.className.baseVal!==undefined?e.className.baseVal:e.className).split(' ').forEach(function(c){
   if(/^(sr-|srm-|m-snap)/.test(c)&&!seen[c]){seen[c]=1;list.push(c);}
  });
 });
 return list.slice(0,60);
}
var report=[];
report.push('BB PROBE v2');
report.push('url: '+location.href);
report.push('time: '+new Date().toISOString());
docs().forEach(function(d,di){
 report.push(NL+'=== document '+di+(di?' (iframe)':' (top)')+' ===');
 var nav=Array.prototype.map.call(d.querySelectorAll('.m-snap-nav-item'),function(e){return e.textContent.trim();});
 report.push('nav tabs: '+JSON.stringify(nav));
 var opc={};Array.prototype.forEach.call(d.querySelectorAll('[data-op]'),function(e){var k=e.getAttribute('data-op');opc[k]=(opc[k]||0)+1;});
 report.push('data-op counts: '+JSON.stringify(opc));
 var icons=Array.prototype.map.call(d.querySelectorAll('.event-widget-item'),function(e){return e.getAttribute('data-icon')+(e.className?' ['+String(e.className).slice(0,60)+']':'');});
 report.push('widget icons: '+JSON.stringify(icons));
 var odds=[];Array.prototype.forEach.call(d.querySelectorAll('[data-op*=market],[data-op*=outcome],[data-op*=odds]'),function(e,i){if(i<25)odds.push((e.getAttribute('data-op')||'')+' => '+(e.innerText||'').split(NL).join(' | ').slice(0,120));});
 report.push('market/outcome elements: '+JSON.stringify(odds));
 var widgets=d.querySelectorAll('[data-sr-widget]');
 report.push('sr widgets: '+widgets.length);
 Array.prototype.forEach.call(widgets,function(w,i){
  report.push(NL+'--- widget '+i+': '+w.getAttribute('data-sr-widget')+' | tables='+w.querySelectorAll('table').length+' ---');
  report.push('classes: '+srClasses(w).join(' '));
  report.push('text: '+(w.innerText||'').split(NL).map(function(x){return x.trim();}).filter(Boolean).join(' | ').slice(0,2500));
 });
 var ms=d.querySelectorAll('.sr-last-matches__match');
 report.push(NL+'last-match rows found: '+ms.length);
 Array.prototype.slice.call(ms,0,4).forEach(function(m,i){report.push('row'+i+' html: '+m.outerHTML.slice(0,700));});
 var body=(d.body?d.body.innerText:'').toLowerCase();
 report.push(NL+'keyword flags: '+JSON.stringify({injur:/injur/.test(body),suspen:/suspen/.test(body),missing:/missing/.test(body),lineup:/line-?up/.test(body),h2h:/head.to.head|h2h/.test(body),pace:/pace|possess/.test(body),rebounds:/rebound/.test(body),dateLike:/\b\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4}\b/.test(body)}));
});
var text=report.join(NL);
var box=document.createElement('div');
box.style.cssText='position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:2147483647;background:white;padding:8px;box-sizing:border-box';
var ta=document.createElement('textarea');
ta.style.cssText='width:100%;height:80%;font-size:11px';
ta.value=text;
var btn=document.createElement('button');
btn.textContent='Close';btn.style.cssText='font-size:18px;padding:8px;margin:6px';
btn.onclick=function(){box.remove();};
var cp=document.createElement('button');
cp.textContent='Copy';cp.style.cssText='font-size:18px;padding:8px;margin:6px';
cp.onclick=function(){ta.select();try{document.execCommand('copy');cp.textContent='Copied';}catch(e){cp.textContent='Select all and copy manually';}};
box.appendChild(btn);box.appendChild(cp);box.appendChild(ta);
document.body.appendChild(box);
}catch(e){alert('BB probe error: '+e.message);}
})();
