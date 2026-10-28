(function(){
try{alert('DX v1.0 (draw engine) loaded');
if(window.__dx){window.__dx();return;}
var KEY='dx_bm_v1';
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
//PURE-START
var MKS=['X','H1','A1','H2','A2'];
var ABSF={X:0.310,H1:0.235,A1:0.210,H2:0.175,A2:0.150};
var K_SEASON=12,K_VENUE=14,RHO=-0.05,TAILS=0.2,FLOOR_RATIO=1.22,PRIOR_DR=0.26;
function poisL(l){var p=[Math.exp(-l)];for(var i=1;i<=10;i++)p.push(p[i-1]*l/i);return p;}
function scoreM(lam,mu,delta){
 var a=poisL(lam),b=poisL(mu),M=[],i,j,s=0;
 for(i=0;i<=10;i++){M.push([]);for(j=0;j<=10;j++)M[i].push(a[i]*b[j]);}
 M[0][0]*=Math.max(0,1-lam*mu*RHO);M[0][1]*=Math.max(0,1+lam*RHO);M[1][0]*=Math.max(0,1+mu*RHO);M[1][1]*=(1-RHO);
 for(i=0;i<=10;i++)M[i][i]*=(1+delta);
 for(i=0;i<=10;i++)for(j=0;j<=10;j++)s+=M[i][j];
 for(i=0;i<=10;i++)for(j=0;j<=10;j++)M[i][j]/=s;
 return M;
}
function marketP(lam,mu,delta){
 var M=scoreM(lam,mu,delta||0),o={X:0,H1:0,A1:0,H2:0,A2:0},i,j;
 for(i=0;i<=10;i++)for(j=0;j<=10;j++){var d=i-j,p=M[i][j];
  if(d===0)o.X+=p;else if(d===1)o.H1+=p;else if(d===-1)o.A1+=p;else if(d===2)o.H2+=p;else if(d===-2)o.A2+=p;}
 return o;
}
function clampx(x){return Math.max(0.15,Math.min(4.5,x));}
function rate(venue,overall,key,avgV,avgO){
 var no=overall?overall.P:0,season=1;
 if(no)season=(no*((overall[key]/no)/avgO)+K_SEASON)/(no+K_SEASON);
 var nv=venue.P;if(!nv)return season;
 var wv=nv/(nv+K_VENUE);
 return wv*((venue[key]/nv)/avgV)+(1-wv)*season;
}
function byTeam(rows){var o={};(rows||[]).forEach(function(r){o[r.team]=r;});return o;}
function sumOf(m,k){var s=0;for(var t in m)s+=m[t][k];return s;}
function buildModel(views){
 var mod={ok:false,why:''};
 if(!views||!views.overall||!views.home||!views.away){mod.why='table views missing';return mod;}
 var ov=byTeam(views.overall),hv=byTeam(views.home),av=byTeam(views.away);
 var hp=sumOf(hv,'P'),ap=sumOf(av,'P'),tot=sumOf(ov,'P'),nh=Math.max(Object.keys(hv).length,1);
 if(hp/nh<3||hp<40||ap===0||tot===0){mod.why='league table too young: '+hp+' home matches';return mod;}
 var s={hgf:sumOf(hv,'GF')/hp,hga:sumOf(hv,'GA')/hp,agf:sumOf(av,'GF')/ap,aga:sumOf(av,'GA')/ap};
 if(Math.min(s.hgf,s.hga,s.agf,s.aga)<=0){mod.why='table has no goals at one venue yet';return mod;}
 var og=sumOf(ov,'GF')/tot;
 mod.s=s;mod.haf=s.hgf/s.agf;mod.avgGames=tot/Math.max(Object.keys(ov).length,1);
 var matches=tot/2,obs=sumOf(ov,'D')/tot;
 mod.drawRate=(obs*matches+PRIOR_DR*60)/(matches+60);
 mod.ov=ov;mod.rk={};
 var teamsL=[];
 views.overall.forEach(function(r){var t=r.team;if(hv[t]&&av[t]&&!mod.rk[t]){
  mod.rk[t]=[rate(hv[t],ov[t],'GF',s.hgf,og),rate(hv[t],ov[t],'GA',s.hga,og),rate(av[t],ov[t],'GF',s.agf,og),rate(av[t],ov[t],'GA',s.aga,og)];teamsL.push(t);}});
 if(teamsL.length<6){mod.why='too few teams with both home and away rows';return mod;}
 var order=views.overall.slice().sort(function(a,b){return (b.pts-a.pts)||((b.GF-b.GA)-(a.GF-a.GA))||(b.GF-a.GF);});
 mod.pos={};order.forEach(function(r,i){mod.pos[r.team]=i+1;});mod.n=order.length;
 mod.lamMu=function(h,a){var x=mod.rk[h],y=mod.rk[a];return [clampx(s.hgf*x[0]*y[3]),clampx(s.agf*y[2]*x[1])];};
 var pairs=[];teamsL.forEach(function(i){teamsL.forEach(function(j){if(i!==j)pairs.push([i,j]);});});
 var step=pairs.length>1600?Math.max(1,Math.floor(pairs.length/1600)):1,rows=[];
 for(var k=0;k<pairs.length;k+=step){var lm=mod.lamMu(pairs[k][0],pairs[k][1]);rows.push(marketP(lm[0],lm[1],0));}
 var meanDraw=function(d){var t=0;rows.forEach(function(r){t+=((1+d)*r.X)/(1+d*r.X);});return t/rows.length;};
 var lo=-0.6,hi=1.5,it;
 for(it=0;it<40;it++){var mid=(lo+hi)/2;if(meanDraw(mid)<mod.drawRate)lo=mid;else hi=mid;}
 mod.delta=Math.max(-0.4,Math.min(0.6,(lo+hi)/2));
 mod.base={X:0,H1:0,A1:0,H2:0,A2:0};
 rows.forEach(function(r){var z=1+mod.delta*r.X;MKS.forEach(function(m){mod.base[m]+=(m==='X'?r[m]*(1+mod.delta):r[m])/z;});});
 MKS.forEach(function(m){mod.base[m]/=rows.length;});
 mod.ok=true;return mod;
}
function floorOf(mod,m){return Math.max(ABSF[m],FLOOR_RATIO*mod.base[m]);}
var STOPW={fc:1,sc:1,'if':1,cf:1,cd:1,afc:1,fk:1,sk:1,jk:1,ac:1,'as':1,ud:1,ca:1,sv:1,fsv:1,tsv:1,vfl:1,vfb:1,ff:1,ifk:1,bk:1,ik:1,sd:1,rc:1,club:1,de:1,the:1};
var TRANS={248:'o',246:'o',243:'o',228:'a',229:'a',230:'a',252:'u',223:'ss',322:'l',273:'d',240:'d',254:'th',339:'o',305:'i'};
var MARKRE=new RegExp('['+String.fromCharCode(768)+'-'+String.fromCharCode(879)+']','g');
function normToks(name){
 var s=String(name||'').toLowerCase(),o='',i;
 for(i=0;i<s.length;i++){var c=s.charCodeAt(i);o+=TRANS[c]!==undefined?TRANS[c]:s.charAt(i);}
 try{o=o.normalize('NFD').replace(MARKRE,'');}catch(e){}
 o=o.replace(/oe|ae|ue|aa/g,function(m){return m.charAt(0);});
 var all=o.replace(/[^a-z0-9]+/g,' ').split(' ').filter(function(x){return x;});
 var t=all.filter(function(x){return !STOPW[x];});
 return t.length?t:all;
}
function tokHit(a,b){var sh=a.length<=b.length?a:b,lg=a.length<=b.length?b:a;return a===b||(sh.length>=4&&lg.indexOf(sh)===0);}
function nameSim(x,y){
 var tx=normToks(x),ty=normToks(y),sh=tx.length<=ty.length?tx:ty,lg=tx.length<=ty.length?ty:tx;
 if(!sh.length)return 0;
 var allIn=sh.every(function(s){return lg.some(function(l){return tokHit(s,l);});});
 return allIn?1-0.02*(lg.length-sh.length):0;
}
function matchTeam(name,names){
 var best=null,bs=0,tie=false;
 names.forEach(function(t){var sc=nameSim(name,t);if(sc>bs+0.0001){bs=sc;best=t;tie=false;}else if(sc>0&&Math.abs(sc-bs)<=0.0001)tie=true;});
 return (bs>=0.75&&!tie)?best:null;
}
function tableScreen(mod,home,away,mode,slack){
 if(!mod.ok)return {pass:false,status:'NO_TABLE',markets:[],why:mod.why};
 var names=Object.keys(mod.rk),hn=matchTeam(home,names),an=matchTeam(away,names);
 if(!hn||!an)return {pass:true,status:'UNMATCHED',markets:['?'],why:'team name not matched in table ('+(hn?away:home)+'): reading anyway, the parser decides'};
 var lm=mod.lamMu(hn,an),lam=lm[0],mu=lm[1],raw=marketP(lam,mu,mod.delta),adj={},tot=lam+mu,dl=lam-mu;
 MKS.forEach(function(m){adj[m]=(1-TAILS)*raw[m]+TAILS*mod.base[m];});
 var oh=mod.ov[hn],oa=mod.ov[an],ph=oh.P?oh.pts/oh.P:0,pa=oa.P?oa.pts/oa.P:0;
 var strict=(mode==='strict'||mode==='strictx');
 var allowed=mode==='draw'||mode==='strictx'?['X']:(mode==='strict'?['X','H1','A1']:(mode==='hc'?['H1','A1','H2','A2']:MKS));
 var out=[],why=[],vet={};
 var posGap=Math.abs((mod.pos[hn]||0)-(mod.pos[an]||0)),gapMax=Math.floor(0.3*mod.n+0.5);
 allowed.forEach(function(m){
  var k=Math.abs(m==='X'?0:(m.charAt(1)==='1'?1:2)),fh=m.charAt(0)==='H',dlf=fh?dl:-dl,pf=fh?ph-pa:pa-ph,veto='';
  if(m==='X'){if(Math.abs(dl)>0.75)veto='gap';else if(tot>3.5)veto='total';else if(Math.abs(ph-pa)>0.9)veto='ppg';}
  else if(k===1){if(dlf<0.20||dlf>1.40)veto='window';else if(tot>3.7)veto='total';else if(pf<-0.3)veto='ppg';}
  else{if(dlf<0.70||dlf>2.30)veto='window';else if(tot>4.4||tot<2.0)veto='total';else if(pf<0.2)veto='ppg';}
  if(!veto&&strict){
   if(m==='X'){if(Math.abs(dl)>0.35)veto='strict G1';else if(tot>3.0)veto='strict G2';else if(posGap>gapMax)veto='strict G4';}
   else{if(dlf<0.35||dlf>1.00)veto='strict window';else if(tot>3.0)veto='strict G2';else if(pf<0.25)veto='strict ppg';}
  }
  vet[m]=!!veto;
  if(veto){why.push(m+' vetoed ('+veto+')');return;}
  var fl=floorOf(mod,m);
  if(adj[m]>=fl-slack){out.push(m);why.push(m+' '+Math.round(adj[m]*1000)/10+'pc vs floor '+Math.round(fl*1000)/10);}
  else why.push(m+' below floor');
 });
 var res={pass:out.length>0,status:'OK',vet:vet,markets:out,lam:+lam.toFixed(2),mu:+mu.toFixed(2),p:{},why:why.join('; ')};
 MKS.forEach(function(m){res.p[m]=+adj[m].toFixed(3);});
 return res;
}
function formOf(rows){
 var o={n:0,big:0};
 (rows||[]).forEach(function(r){
  if(!r||r.gf==null||r.ga==null)return;
  var m=r.gf-r.ga;o.n++;
  if(!(r.pens&&m!==0)&&Math.abs(m)>=3)o.big++;
 });
 return o;
}
function formGate(h,a,markets,strict){
 var fh=formOf((h||[]).slice(0,5)),fa=formOf((a||[]).slice(0,5));
 if(fh.n<4||fa.n<4)return {pass:false,markets:[],why:'THIN_HISTORY '+fh.n+'/'+fa.n};
 var blow=Math.max(fh.big,fa.big);
 var lim=strict?1:2;
 var out=markets.filter(function(m){return !(blow>=lim&&(m==='X'||m==='H1'||m==='A1'));});
 return {pass:out.length>0,markets:out,why:blow>=lim?'a side has '+lim+'+ results decided by 3+ goals':'form ok'};
}
var EXLG=/youth|junior|(^|[^a-z0-9])u(15|16|17|18|19|20|21|23)([^a-z0-9]|$)|women|femin|ladies|reserve|simulated|srl|esport|virtual|friendl/i;
var EXTM=/(^| )u(15|16|17|18|19|20|21|23)$|( ii| iii| b| youth)$|(^| )(jong|futuro|reserves?|women|ladies)( |$)/i;
function probOf(tk){var re=new RegExp('^[0-9]+'+String.fromCharCode(37)+'$'),p=(tk||[]).filter(function(t){return re.test(t);});
 if(p.length<3)return null;return {h:parseInt(p[0],10),d:parseInt(p[1],10),a:parseInt(p[2],10)};}
function oddsDraw(tk){
 var DEC=/^[0-9]+[.][0-9]{2}$/,b=[],cur=[],i,k;
 (tk||[]).forEach(function(t){if(t==='##'){if(cur.length)b.push(cur);cur=[];}else cur.push(t);});
 if(cur.length)b.push(cur);
 for(i=0;i<b.length;i++){
  if(b[i][0].indexOf('1X2')!==0)continue;
  var v={};for(k=0;k<b[i].length-1;k++){if((b[i][k]==='Home'||b[i][k]==='Draw'||b[i][k]==='Away')&&DEC.test(b[i][k+1]))v[b[i][k]]=parseFloat(b[i][k+1]);}
  if(v.Home&&v.Draw&&v.Away){var s=1/v.Home+1/v.Draw+1/v.Away;return Math.round(1000*(1/v.Draw)/s)/10;}
 }
 return null;
}
//PURE-END
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
 var head=['id','home','away','league','status','via','note','screen_markets','screen_why','h1','h2','h3','h4','h5','a1','a2','a3','a4','a5'];
 var rows=Object.keys(done).map(function(k){
  var r=done[k];var c=[r.id,r.home,r.away,r.league||'',r.status,r.via||'',r.note||'',(r.screen&&r.screen.markets?r.screen.markets.join(' '):''),(r.screen?r.screen.why:'')];
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
 if(opts&&(opts.lean||opts.rest)&&rec.status==='OK'){
  rec.tabs={};rec.tabstatus={};
  rec.tabs['H2H']=await stable(doc);rec.tabstatus['H2H']='OK';
  if(opts.lean){rec.tabs['MARKETS']=await readMarkets(doc);rec.tabstatus['MARKETS']=rec.tabs['MARKETS'].length?'OK':'NONE';}
  var prev=rec.tabs['H2H'].join('~');
  var tlist=opts.lean?['Probability']:EXTRA_TABS.filter(function(x){return x!=='Probability';});
  for(var ti=0;ti<tlist.length;ti++){
   setStatus((opts.lean?'Reading form and site probability':'Reading tab '+tlist[ti])+' ('+rec.home+' vs '+rec.away+')');
   var tr=await readTab(doc,tlist[ti],prev);
   rec.tabs[tlist[ti]]=tr.tokens;rec.tabstatus[tlist[ti]]=tr.status;
   prev=tr.tokens.join('~');
  }
  rec.gate=opts.lean?'LEAN':'PASS';
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
function tablesLoad(){try{return JSON.parse(localStorage.getItem('dx_tables_v1'))||{};}catch(e){return {};}}
function tablesSave(t){localStorage.setItem('dx_tables_v1',JSON.stringify(t));}
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
function resLoad(){try{return JSON.parse(localStorage.getItem('dx_results_v1'))||{};}catch(e){return {};}}
function resSave(r){localStorage.setItem('dx_results_v1',JSON.stringify(r));}
function parseKick(text){
 var m=(text||'').match(/^([0-9]{1,2}) ([A-Za-z]{3}), [A-Za-z]+ ([0-9]{2}):([0-9]{2})$/);
 var MON={Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
 if(!m||MON[m[2]]===undefined)return null;
 var now=new Date();var d=new Date(now.getFullYear(),MON[m[2]],+m[1],+m[3],+m[4]);
 if(d.getTime()-now.getTime()>180*86400000)d=new Date(now.getFullYear()-1,MON[m[2]],+m[1],+m[3],+m[4]);
 return d;
}
function isStale(r){var k=parseKick(r.kickoff);if(k)return (Date.now()-k.getTime())>3*3600000;return !r.readAt||(Date.now()-r.readAt)>12*3600000;}
function archLoad(){try{return JSON.parse(localStorage.getItem('dx_arch_v1'))||{};}catch(e){return {};}}
function archSave(a){localStorage.setItem('dx_arch_v1',JSON.stringify(a));}
function freshDone(){var d=load().done,m={};Object.keys(d).forEach(function(k){if(!isStale(d[k]))m[k]=d[k];});return m;}
function rollover(){
 var st=load(),A=archLoad(),R=resLoad(),n=0,keep={};
 Object.keys(st.done).forEach(function(id){var r=st.done[id];
  if(isStale(r)){n++;if(!(R[id]&&R[id].status==='ENDED')&&r.url)A[id]={id:id,url:r.url,home:r.home,away:r.away,league:r.league,kickoff:r.kickoff||'',readAt:r.readAt||0};}
  else keep[id]=r;});
 if(n){st.done=keep;try{save(st);archSave(A);}catch(e){}}
 return n;
}
var DECRE=/^[0-9]+[.][0-9]{2}$/;
function walkTokens(root,doc){var out=[],w=doc.createTreeWalker(root,4,null),x;while((x=w.nextNode())){var p=x.parentElement;if(p&&/^(SCRIPT|STYLE)$/.test(p.tagName))continue;var s=x.nodeValue.trim();if(s)out.push(s);}return out;}
function mkBlocks(doc){
 var list=doc.querySelector('[data-op=event-detail-market-list]');if(!list)return [];
 var ts=list.querySelectorAll('[data-op=event-detail-market-title]'),out=[],i;
 for(i=0;i<ts.length;i++){
  var t=ts[i],n=t;
  while(n.parentElement&&n.parentElement!==list&&n.parentElement.querySelectorAll('[data-op=event-detail-market-title]').length===1)n=n.parentElement;
  var title=walkTokens(t,doc).join(' ').replace(/ Stats$/,'');
  var toks=walkTokens(n,doc);
  var want=/^(1X2|Handicap|Correct Score|GG[/]NG)/.test(title)||(/Over[/]Under$/.test(title)&&title.indexOf('1st')!==0);
  var expand=/^(Handicap|Correct Score|Over[/]Under)/.test(title);
  out.push({titleEl:t,title:title,toks:toks,want:want,expand:expand});
 }
 return out;
}
async function readMarkets(doc){
 try{
  for(var pass=0;pass<2;pass++){
   var bl=mkBlocks(doc),tapped=0;
   bl.forEach(function(b){if(b.expand&&!b.toks.some(function(x){return DECRE.test(x);})){tap(b.titleEl.firstElementChild||b.titleEl);tapped++;}});
   if(!tapped)break;
   await sleep(500);
  }
  var out=[];mkBlocks(doc).forEach(function(b){if(b.want){out=out.concat(b.toks);out.push('##');}});
  return out;
 }catch(e){return [];}
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
 var urls=ta.value.split(String.fromCharCode(10)).join(' ').split(' ').map(function(u){return u.trim();}).filter(function(u){return idOf(u);});
 var R=resLoad();
 if(!urls.length){
  var d=Object.assign({},archLoad(),load().done);
  urls=Object.keys(d).map(function(k){return d[k];}).filter(function(r){
   if(!r.url||(R[r.id]&&R[r.id].status==='ENDED'))return false;
   var k=parseKick(r.kickoff);return !k||(Date.now()-k.getTime())>=150*60000;
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
  if(rec.status==='ENDED'){var A2=archLoad();if(A2[rec.id]){delete A2[rec.id];try{archSave(A2);}catch(e){}}}
  await sleep(800+Math.random()*800);
 }
 R=resLoad();var v=Object.keys(R).map(function(k){return R[k];});
 var c=function(st){return v.filter(function(r){return r.status===st;}).length;};
 setStatus('Results: '+c('ENDED')+' final scores read, '+c('NOT_ENDED')+' not finished yet, '+(v.length-c('ENDED')-c('NOT_ENDED'))+' unreadable. Tap Save everything.');
}
async function runFull(){
 var topN=Math.max(1,Math.min(60,parseInt(topBox.value,10)||15));
 var urls=ta.value.split(String.fromCharCode(10)).join(' ').split(' ').map(function(u){return u.trim();}).filter(function(u){return idOf(u);});
 var seen={};urls=urls.filter(function(u){var i=idOf(u);if(seen[i])return false;seen[i]=1;return true;});
 if(!urls.length){setStatus('Paste match URLs first.');return;}
 stopFlag=false;
 try{if(navigator.wakeLock)navigator.wakeLock.request('screen').catch(function(){});}catch(e){}
 var moved=rollover();
 var n0=urls.length;
 urls=urls.filter(function(u){var l=leagueOf(u),t=teams(u);return l&&!/srl|simulated|esport|virtual/i.test(l.split('_').join(' '));});
 var nExcl=n0-urls.length;
 var mine={};urls.forEach(function(u){mine[idOf(u)]=1;});
 for(var i=0;i<urls.length;i++){
  if(stopFlag){setStatus('Stopped.');return;}
  var id=idOf(urls[i]);var st=load();var old=st.done[id];
  var fresh=old&&old.readAt&&(Date.now()-old.readAt)<6*3600000;
  if(old&&fresh&&(old.status==='LIVE_OR_FINISHED'||old.status==='NO_STATS_BUTTON'||old.status==='NO_STATS_ICON'))continue;
  if(old&&old.status==='OK'&&fresh&&old.tabs&&(old.tabs.Probability||old.tabs.MARKETS))continue;
  var tm=teams(urls[i]);
  setStatus('Step 1 of 3: match '+(i+1)+' of '+urls.length+' (form + site draw probability): '+tm.join(' vs '));
  skipFlag=false;timedOut=false;var capTimer=setTimeout(function(){timedOut=true;skipFlag=true;},150000);
  var rec=await processUrl(urls[i],{lean:true});
  clearTimeout(capTimer);
  if(skipFlag||timedOut){rec.status=timedOut?'TIMEOUT':'SKIPPED';delete rec.tabs;delete rec.tabstatus;delete rec.gate;frameBox.innerHTML='';}
  skipFlag=false;timedOut=false;
  st=load();st.done[rec.id]=rec;
  try{save(st);}catch(e){setStatus('Storage full. Tap Save everything, then Clear saved.');return;}
  await sleep(1200+Math.random()*1200);
 }
 var d0=load().done,ranked=[];
 Object.keys(d0).forEach(function(k){var r=d0[k];if(mine[k]&&r.status==='OK'&&r.tabs&&(r.tabs.Probability||r.tabs.MARKETS)){var p=probOf(r.tabs.Probability||[]),od=oddsDraw(r.tabs.MARKETS||[]),pr=[];if(p)pr.push(p.d);if(od!==null)pr.push(od);if(pr.length){r.market={d:Math.round(pr.reduce(function(a,b){return a+b;},0)/pr.length*10)/10,site:p?p.d:null,odds:od};ranked.push(r);}}});
 ranked.sort(function(a,b){return b.market.d-a.market.d;});
 var chosen=ranked.slice(0,topN);
 var stx=load();ranked.forEach(function(r){stx.done[r.id]=r;});try{save(stx);}catch(e){}
 for(var k=0;k<chosen.length;k++){
  if(stopFlag){setStatus('Stopped.');return;}
  var c0=chosen[k];
  if(c0.gate==='PASS'&&c0.tabs&&c0.tabs['Lineups']&&(Date.now()-c0.readAt)<6*3600000)continue;
  setStatus('Step 2 of 3: full read '+(k+1)+' of '+chosen.length+' (site draw '+c0.market.d+' pc): '+c0.home+' vs '+c0.away);
  skipFlag=false;timedOut=false;var capT3=setTimeout(function(){timedOut=true;skipFlag=true;},240000);
  var r2=await processUrl(c0.url,{rest:true});
  clearTimeout(capT3);
  var okFull=!(skipFlag||timedOut)&&r2.status==='OK'&&r2.tabs;
  if(okFull){r2.tabs.Probability=c0.tabs.Probability;r2.tabstatus.Probability=c0.tabstatus.Probability;if(c0.tabs.MARKETS){r2.tabs.MARKETS=c0.tabs.MARKETS;r2.tabstatus.MARKETS=c0.tabstatus.MARKETS;}r2.market=c0.market;r2.gate='PASS';r2.rank=k+1;c0=r2;}
  else{c0.rank=k+1;c0.fullNote=timedOut?'TIMEOUT':(r2.status||'SKIPPED');frameBox.innerHTML='';}
  skipFlag=false;timedOut=false;
  st=load();st.done[c0.id]=c0;
  try{save(st);}catch(e){setStatus('Storage full. Tap Save everything, then Clear saved.');return;}
  await sleep(1200+Math.random()*1200);
 }
 var lgs=[],seenL={};
 chosen.forEach(function(r){if(r.league&&!seenL[r.league]){seenL[r.league]=1;lgs.push(r);}});
 var tl=tablesLoad(),tOk=0,tBad=0;
 for(var j=0;j<lgs.length;j++){
  if(stopFlag){setStatus('Stopped.');return;}
  var lg=lgs[j].league;
  if(tl[lg]&&tl[lg].status==='OK'&&tl[lg].readAt&&(Date.now()-tl[lg].readAt)<12*3600000){tOk++;continue;}
  setStatus('Step 3 of 3: league table '+(j+1)+' of '+lgs.length+' (only for your top draws): '+lg);
  skipFlag=false;timedOut=false;var capT2=setTimeout(function(){timedOut=true;skipFlag=true;},150000);
  var tr=await readLeague(lgs[j].url);
  clearTimeout(capT2);skipFlag=false;timedOut=false;
  tl=tablesLoad();tl[lg]=tr;tablesSave(tl);
  if(tr.status==='OK')tOk++;else tBad++;
  await sleep(1500+Math.random()*1500);
 }
 var top3=chosen.slice(0,3).map(function(r){return r.home+' v '+r.away+' '+r.market.d+' pc';}).join(' | ');
 setStatus((moved?moved+' earlier matches moved aside. ':'')+'Finished. '+ranked.length+' of '+urls.length+' matches ranked by the site draw probability ('+nExcl+' simulated games skipped). Top '+chosen.length+' read in full. League tables for them: '+tOk+' OK, '+tBad+' failed (the parser still ranks without them). Best: '+top3+'. Tap Save everything.');
}
function everythingJson(){return JSON.stringify({format:'dx-everything-2',created:new Date().toISOString(),matches:freshDone(),tables:tablesLoad(),results:resLoad()});}
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
statusEl.textContent='Ready. '+Object.keys(freshDone()).length+' matches from the current day, '+(Object.keys(load().done).length-Object.keys(freshDone()).length+Object.keys(archLoad()).length)+' earlier ones waiting for results (they stay out of your export).';
ta=document.createElement('textarea');ta.placeholder='Paste match URLs, one per line';ta.style.cssText='width:94vw;height:80px;box-sizing:border-box;';
out=document.createElement('textarea');out.style.cssText='width:94vw;height:70px;box-sizing:border-box;display:none;margin-top:6px;';
frameBox=document.createElement('div');frameBox.style.cssText='margin-top:6px;';
var bStart=mk('Start',run);
var bStop=mk('Stop',function(){stopFlag=true;});
var bCopy=mk('Copy CSV',async function(){var c=toCsv(freshDone());out.style.display='block';out.value=c;try{await navigator.clipboard.writeText(c);setStatus('Copied.');}catch(e){out.select();setStatus('Copy from the box below.');}});
var bDl=mk('Download',function(){var bl=new Blob([toCsv(freshDone())],{type:'text/csv'});var a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download='dx_results.csv';document.body.appendChild(a);a.click();a.remove();});
var bClr=mk('Clear saved',function(){if(confirm('Delete saved results and league tables?')){localStorage.removeItem(KEY);localStorage.removeItem('dx_tables_v1');localStorage.removeItem('dx_results_v1');localStorage.removeItem('dx_arch_v1');setStatus('Cleared.');}});
var bTab=mk('Read tables',runTables);
var bTabCopy=mk('Copy tables',async function(){var c=tablesCsv(tablesLoad());if(c.split(String.fromCharCode(10)).length<2){setStatus('Nothing to copy yet. Tap Table status to see why.');return;}out.style.display='block';out.value=c;try{await navigator.clipboard.writeText(c);setStatus('Tables copied.');}catch(e){out.select();setStatus('Copy from the box below.');}});
var bTabStat=mk('Table status',function(){var t=tablesLoad();var ks=Object.keys(t);out.style.display='block';out.value=ks.length?ks.map(function(k){var r=t[k];return k+': '+r.status+(r.note?' ('+r.note+')':'')+(r.status==='OK'?' - '+r.views.overall.length+' teams':'')+(r.readAt?', read '+Math.round((Date.now()-r.readAt)/360000)/10+'h ago':'');}).join(String.fromCharCode(10)):'No leagues read yet.';});
var bTabDl=mk('Download tables',function(){var c=tablesCsv(tablesLoad());if(c.split(String.fromCharCode(10)).length<2){setStatus('Nothing to download yet. Tap Table status to see why.');return;}var bl=new Blob([c],{type:'text/csv'});var a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download='dx_tables.csv';document.body.appendChild(a);a.click();a.remove();});
var slackBox=document.createElement('input');slackBox.type='number';slackBox.value='1';slackBox.style.cssText='width:44px;margin:3px 3px 0 0;padding:6px;';
var slackLbl=document.createElement('span');slackLbl.textContent=' read fixtures this many probability points below the pick floor (0 = exactly the parser): ';
var modeSel=document.createElement('select');modeSel.style.cssText='margin:3px 3px 0 0;padding:6px;font-size:14px;';
[['draw','Draws only: model floor (recommended)'],['strictx','STRICT draws only (fewest opens)'],['strict','Strict draws + 1-goal handicap draws'],['all','All draw + handicap markets'],['hc','Handicap draws only']].forEach(function(o){var op=document.createElement('option');op.value=o[0];op.textContent=o[1];modeSel.appendChild(op);});
var bFull=mk('Full run',runFull);
var bRes=mk('Read results',runResults);
var bEvDl=mk('Save everything',function(){var bl=new Blob([everythingJson()],{type:'application/json'});var a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download='dx_everything.json';document.body.appendChild(a);a.click();a.remove();});
var bEvCopy=mk('Copy everything',async function(){var c=everythingJson();out.style.display='block';out.value=c;try{await navigator.clipboard.writeText(c);setStatus('Copied '+c.length+' characters.');}catch(e){out.select();setStatus('Copy from the box below.');}});
var bSkip=mk('Skip this match',function(){skipFlag=true;setStatus('Skipping this match...');});
var unBox=document.createElement('input');unBox.type='checkbox';unBox.checked=true;unBox.style.cssText='margin:6px 4px 0 6px;transform:scale(1.4);';
var unLbl=document.createElement('span');unLbl.textContent=' Unattended (never wait for my taps)';
var bClose=mk('Close',function(){stopFlag=true;box.style.display='none';});
box.appendChild(statusEl);box.appendChild(bSkip);box.appendChild(document.createElement('br'));box.appendChild(ta);
var topBox=document.createElement('input');topBox.type='number';topBox.value='15';topBox.style.cssText='width:44px;margin:3px 3px 0 0;padding:6px;';
var topLbl=document.createElement('span');topLbl.textContent=' read in full the top this many matches by draw probability (site + bookmaker odds): ';
box.appendChild(topLbl);box.appendChild(topBox);box.appendChild(document.createElement('br'));box.appendChild(unBox);box.appendChild(unLbl);box.appendChild(document.createElement('br'));
[bFull,bRes,bEvDl,bEvCopy,bStart,bStop,bTab,bTabStat,bClr,bClose].forEach(function(b){box.appendChild(b);});
box.appendChild(out);box.appendChild(frameBox);
document.body.appendChild(box);
window.__dx=function(){box.style.display='block';};
window.__dxt={isStale:isStale,rollover:rollover,freshDone:freshDone,archLoad:archLoad,everythingJson:everythingJson,load:load,buildModel:buildModel,tableScreen:tableScreen,formGate:formGate,marketP:marketP,matchTeam:matchTeam,readResult:readResult,tokensOf:tokensOf,readRows:readRows,parseTable:parseTable,tableText:tableText,tablesCsv:tablesCsv,leagueOf:leagueOf,isCup:isCup};
}catch(e){alert('DX error: '+e.message);}
})();
