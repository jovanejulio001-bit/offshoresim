// Interface: painel do Driller, manómetros, gráficos, poço, LOT, conta Supabase.
const $=id=>document.getElementById(id);
function openPanel(){panelOpen=true;$('panel').hidden=false}
function closePanel(){panelOpen=false;$('panel').hidden=true;S.lever=0;lvSet(0)}
$('pX').onclick=closePanel;
const tg=(b,on,t)=>{b.classList.toggle('on',!!on);b.textContent=t};
$('bPump').onclick=()=>{S.pumpOn=S.pumpOn?0:1};
$('sSpm').oninput=e=>{S.spmT=+e.target.value;$('vSpm').textContent=e.target.value};
$('bRot').onclick=()=>{if(S.slips)return msg('Cunhas ativas: não pode rodar');if(S.spm<20)return msg('Ligue as bombas antes de rodar');S.rotOn=S.rotOn?0:1};
$('sRpm').oninput=e=>{S.rpmT=+e.target.value;$('vRpm').textContent=e.target.value};
$('bSlips').onclick=opSlips;$('bElev').onclick=opElev;$('bConn').onclick=opConnect;
$('sDens').oninput=e=>{S.densT=+e.target.value;$('vDens').textContent=(+e.target.value).toFixed(2)};
$('bKick').onclick=opKick;$('bBop').onclick=opBop;$('bLot').onclick=opLot;$('bLotR').onclick=opLotRecord;
const lp=$('bLotP');lp.onpointerdown=()=>S.lot.pump=1;lp.onpointerup=lp.onpointerleave=()=>S.lot.pump=0;
// alavanca física (mola: volta ao neutro ao largar)
const tr=$('track'),hd=$('handle');let dragLv=false;
function lvSet(v){S.lever=Math.abs(v)<.08?0:v;hd.style.top=(80-v*80)+'px'}
function lvMove(e){const r=tr.getBoundingClientRect();lvSet(clamp(((r.top+r.height/2)-e.clientY)/(r.height/2-15),-1,1))}
tr.onpointerdown=e=>{dragLv=true;tr.setPointerCapture(e.pointerId);lvMove(e)};tr.onpointermove=e=>{if(dragLv)lvMove(e)};
tr.onpointerup=tr.onpointercancel=()=>{dragLv=false;lvSet(0)};
// manómetros e gráficos
function gauge(g,x,y,r,v,max,name,unit){g.save();g.translate(x,y);g.strokeStyle='#345';g.lineWidth=8;g.beginPath();g.arc(0,0,r,.75*Math.PI,2.25*Math.PI);g.stroke();
 const f=clamp(v/max,0,1);g.strokeStyle=f>.85?'#e33':f>.65?'#ec3':'#3c6';g.beginPath();g.arc(0,0,r,.75*Math.PI,(.75+1.5*f)*Math.PI);g.stroke();
 g.rotate((.75+1.5*f)*Math.PI);g.strokeStyle='#fff';g.lineWidth=3;g.beginPath();g.moveTo(0,0);g.lineTo(r-6,0);g.stroke();g.rotate(-(.75+1.5*f)*Math.PI);
 g.fillStyle='#fff';g.textAlign='center';g.font='12px sans-serif';g.fillText(name,0,r+14);g.font='bold 14px monospace';g.fillText(v.toFixed(0)+' '+unit,0,18);g.restore()}
function chart(g,x,y,w,h,series,title){g.save();g.translate(x,y);g.strokeStyle='#345';g.strokeRect(0,0,w,h);g.fillStyle='#9bd';g.font='11px sans-serif';g.fillText(title,4,12);
 let lo=1e9,hi=-1e9;series.forEach(s=>s.d.forEach(v=>{lo=Math.min(lo,v);hi=Math.max(hi,v)}));if(hi-lo<1e-6){hi+=1;lo-=1}
 series.forEach(s=>{g.strokeStyle=s.c;g.beginPath();s.d.forEach((v,i)=>{const px=i/119*w,py=h-4-(v-lo)/(hi-lo)*(h-22);i?g.lineTo(px,py):g.moveTo(px,py)});g.stroke()});
 g.fillStyle='#fff';g.textAlign='right';const l=series[0].d;g.fillText(l.length?l[l.length-1].toFixed(1):'',w-4,12);g.restore()}
const cg=$('cG').getContext('2d'),cw=$('cW').getContext('2d'),ch=$('cH').getContext('2d'),cl=$('cL').getContext('2d');
function well(){const g=cw,W=260,H=440;g.clearRect(0,0,W,H);const mx=Math.max(1800,S.hole+100),sy=d=>20+d/mx*(H-30);
 [[0,400,'#c9b26b'],[400,900,'#7b6a58'],[900,1300,'#a9a9a0'],[1300,1800,'#b08a5a'],[1800,9999,'#6a5a4a']].forEach(l=>{g.fillStyle=l[2];g.fillRect(0,sy(l[0]),W,sy(Math.min(l[1],mx))-sy(l[0]))});
 g.fillStyle='#3a2a18';g.fillRect(100,20,50,sy(S.hole)-20);g.fillStyle='#8c8c8c';g.fillRect(96,20,4,sy(800)-20);g.fillRect(150,20,4,sy(800)-20);
 g.fillStyle='#222';g.fillRect(122,20,6,sy(S.bit)-20);g.fillStyle='#e33';g.beginPath();g.moveTo(118,sy(S.bit));g.lineTo(132,sy(S.bit));g.lineTo(125,sy(S.bit)+8);g.fill();
 if(S.fin>0){g.fillStyle='#fc4';const o=(S.t*40)%20;for(let y=20+o;y<sy(S.bit);y+=20){g.fillRect(124,y,2,6)}for(let y=sy(S.bit)-o;y>20;y-=20){g.fillRect(106,y,2,6);g.fillRect(140,y,2,6)}}
 if(S.influx>0||S.bop&&S.kick){g.fillStyle='#f33';for(let i=0;i<6;i++)g.fillRect(104+(i*8),sy(S.hole)-((S.t*30+i*20)%60),5,5)}
 g.fillStyle='#fff';g.font='11px sans-serif';g.fillText('Broca '+S.bit.toFixed(0)+' m',160,sy(S.bit));g.fillText('Fundo '+S.hole.toFixed(0)+' m',160,sy(S.hole)+14);g.fillText('Sapata 800 m',160,sy(800));g.fillText(S.bop?'BOP FECHADO':'Mud level: cheio',4,14)}
let acc=0;
function hudUpdate(){const dt=.016;
 $('hud').textContent=`Prof. broca ${S.bit.toFixed(1)} m | Fundo ${S.hole.toFixed(1)} m\nROP ${S.rop.toFixed(0)} m/h  WOB ${S.wob.toFixed(0)} klb  RPM ${S.rpm.toFixed(0)}\nSPM ${S.spm.toFixed(0)}  SPP ${S.spp.toFixed(0)} psi`;
 const ab=$('alarmbar');ab.style.display=S.al.length?'block':'none';ab.textContent=S.al.join('  |  ');
 const t=$('toast');t.style.display=S.msgT>0?'block':'none';t.textContent=S.msg;
 if(!panelOpen)return;
 tg($('bPump'),S.pumpOn,'Bomba: '+(S.pumpOn?'ON':'OFF'));tg($('bRot'),S.rotOn,'Rotação: '+(S.rotOn?'ON':'OFF'));
 tg($('bSlips'),S.slips,'Cunhas: '+(S.slips?'ASSENTADAS':'SOLTAS'));tg($('bElev'),!S.elevClosed,'Elevadores: '+(S.elevClosed?'FECHADOS':'ABERTOS'));
 tg($('bBop'),S.bop,'BOP: '+(S.bop?'FECHADO':'ABERTO'));$('bLot').textContent=S.lot.on?'Terminar LOT':'Iniciar LOT';
 $('bKick').classList.toggle('bad',!!S.kick);$('pAl').textContent=S.al[0]||(S.conn>0?'A conectar tubo…':'Operação normal');
 $('lvPos').textContent=(S.lever*100).toFixed(0)+'%';$('lvVel').textContent=S.vel.toFixed(2);$('lvH').textContent=S.h.toFixed(1);
 $('lvInfo').firstChild.textContent=Math.abs(S.vel)<.02?'Neutro':S.vel>0?'A SUBIR':'A DESCER';
 $('dir').textContent='Sentido: horário '+(S.rpm>1?'(a rodar)':'(parado)')+' · Torque '+S.tq.toFixed(1)+' kft-lb';
 const L=S.lot;$('lotRes').innerHTML=(L.on?`LOT: ${L.p.toFixed(0)} psi · ${L.vol.toFixed(2)} bbl${L.leak?' · LEAK-OFF':''}<br>`:'')+L.res.map((r,i)=>`#${i+1}: ${r.p.toFixed(0)} psi, ${r.vol.toFixed(2)} bbl, EMW ${r.emw.toFixed(2)} ppg`).join('<br>');
 acc+=dt;
 cg.clearRect(0,0,560,270);const gs=[[S.spp,5000,'SPP','psi'],[S.casP,5000,'Casing','psi'],[S.chk,5000,'Choke','psi'],[S.spp*1.03,5000,'Bomba','psi'],[S.annP,6000,'Anular','psi'],[S.fin,800,'Flow In','gpm'],[S.fout,800,'Flow Out','gpm'],[S.pit,800,'Tanques','bbl']];
 gs.forEach((a,i)=>gauge(cg,70+(i%4)*140,70+Math.floor(i/4)*125,42,a[0],a[1],a[2],a[3]));
 const D=[['WOB',S.wob,'klb'],['ROP',S.rop,'m/h'],['RPM',S.rpm,''],['Torque',S.tq,'kft-lb'],['Hook Load',S.hook,'klb'],['SPP',S.spp,'psi'],['Flow In',S.fin,'gpm'],['Flow Out',S.fout,'gpm'],['Pit Vol',S.pit,'bbl'],['Prof. medida',S.hole,'m'],['Prof. broca',S.bit,'m'],['SPM',S.spm,''],['Densidade',S.dens,'ppg'],['Hidrostática',S.hydro,'psi'],['Casing',S.casP,'psi'],['Influxo',S.influx,'bbl/min']];
 $('dig').innerHTML=D.map(d=>`<div>${d[0]}<b>${d[1].toFixed(d[0]=='Densidade'?2:0)}</b>${d[2]}</div>`).join('');
 well();
 const H=S.hist;ch.clearRect(0,0,520,640);const cs=[[[{d:H.wob,c:'#6f6'}],'WOB (klb)'],[[{d:H.rop,c:'#6cf'}],'ROP (m/h)'],[[{d:H.rpm,c:'#fc6'}],'RPM'],[[{d:H.tq,c:'#f6c'}],'Torque'],[[{d:H.hook,c:'#9f9'}],'Hook Load'],[[{d:H.spp,c:'#f96'}],'SPP (psi)'],[[{d:H.fin,c:'#6cf'},{d:H.fout,c:'#f66'}],'Flow In/Out'],[[{d:H.pit,c:'#fc4'}],'Pit Volume'],[[{d:H.dens,c:'#c9f'}],'Densidade'],[[{d:H.depth,c:'#fff'}],'Profundidade x tempo']];
 cs.forEach((c,i)=>chart(ch,(i%2)*262,Math.floor(i/2)*128,254,120,c[0],c[1]));
 cl.clearRect(0,0,520,220);cl.strokeStyle='#345';cl.strokeRect(0,0,520,220);cl.fillStyle='#9bd';cl.font='12px sans-serif';cl.fillText('LOT: Pressão (psi) x Volume injetado (bbl)',6,14);
 cl.strokeStyle='#fc4';cl.beginPath();L.pts.forEach((p,i)=>{const x=p[0]/4*500+10,y=210-p[1]/2500*190;i?cl.lineTo(x,y):cl.moveTo(x,y)});cl.stroke();
 if(L.leak){cl.fillStyle='#f55';cl.beginPath();cl.arc(L.leak.vol/4*500+10,210-L.leak.p/2500*190,5,0,7);cl.fill()}}
// alarme sonoro
let ac=null,lastB=0;
function alarmSound(t){if(t-lastB<.6)return;lastB=t;try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=880;g.gain.value=.08;o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+.25)}catch(e){}}
// Supabase (opcional)
let sb=null,uid=null;const am=t=>$('aMsg').textContent=t;
if(window.supabase&&window.SB&&SB.url&&!SB.url.includes('SEU')){sb=supabase.createClient(SB.url,SB.key)}
$('btnAcc').onclick=()=>$('acct').hidden=!$('acct').hidden;$('aX').onclick=()=>$('acct').hidden=true;
async function load(){const{data}=await sb.from('progress').select('*').eq('user_id',uid).maybeSingle();
 if(data){S.hole=data.hole;S.bit=Math.min(data.bit,data.hole);S.anchor=S.bit+S.h;Object.assign(S.stats,data.stats||{});if(data.settings&&data.settings.dens){S.dens=S.densT=data.settings.dens}am('Progresso carregado')}}
async function save(){if(!sb||!uid)return;const{error}=await sb.from('progress').upsert({user_id:uid,hole:S.hole,bit:S.bit,stats:S.stats,settings:{dens:S.densT},updated_at:new Date().toISOString()});am(error?error.message:'Guardado')}
async function auth(up){if(!sb)return am('Configure js/config.js com a URL e a chave do Supabase');
 const f=up?sb.auth.signUp:sb.auth.signInWithPassword;const{data,error}=await f.call(sb.auth,{email:$('em').value,password:$('pw').value});
 if(error)return am(error.message);uid=data.user&&data.user.id;if(uid&&data.session){am('Sessão iniciada');load()}else am('Verifique o email para confirmar')}
$('aIn').onclick=()=>auth(0);$('aUp').onclick=()=>auth(1);$('aSave').onclick=save;$('aOut').onclick=async()=>{if(sb)await sb.auth.signOut();uid=null;am('Sessão terminada')};
setInterval(save,60000);addEventListener('pagehide',save);
