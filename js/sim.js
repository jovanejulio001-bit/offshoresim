// Motor de simulação único: todos os controlos e animações lêem/escrevem em S.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mv=(v,t,d)=>v+clamp(t-v,-d,d);
const S={pumpOn:0,spmT:60,spm:0,rotOn:0,rpmT:80,rpm:0,lever:0,vel:0,h:28,slips:0,needConn:0,elevClosed:1,conn:0,
 bit:1500,hole:1520,anchor:1528,dens:9.6,densT:9.6,pit:400,pit0:400,tankA:192,tankB:208,storageTank:350,tripTank:40,pore:8.8,kick:0,bop:0,influx:0,
 wob:0,rop:0,tq:0,hook:0,spp:0,fin:0,fout:0,casP:0,chk:0,annP:0,hydro:0,t:0,al:[],msg:'',msgT:0,hT:0,
 lot:{on:0,pump:0,vol:0,p:0,leak:null,pts:[],res:[]},hist:{},stats:{conn:0,drilled:0,kicks:0}};
['wob','rop','rpm','tq','hook','spp','fin','fout','pit','dens','depth'].forEach(k=>S.hist[k]=[]);
function msg(t){S.msg=t;S.msgT=4}
function step(dt){
 S.t+=dt;const L=S.lot;
 S.spm=mv(S.spm,S.pumpOn&&!L.on?S.spmT:0,30*dt);
 if(S.rotOn&&(S.spm<20||S.slips)){S.rotOn=0;msg('Rotação desligada: sem circulação ou cunhas ativas')}
 S.rpm=mv(S.rpm,S.rotOn?S.rpmT:0,40*dt);
 // alavanca física -> velocidade do Top Drive (aceleração/desaceleração + interlocks)
 let tv=S.lever*2;
 if(S.wob>45&&tv<0)tv=0;
 if((S.h>=28&&tv>0)||(S.h<=0&&tv<0))tv=0;
 S.vel=mv(S.vel,tv,(Math.abs(tv)>Math.abs(S.vel)?1.5:3)*dt);
 S.h=clamp(S.h+S.vel*dt,0,28);
 if((S.h<=0&&S.vel<0)||(S.h>=28&&S.vel>0))S.vel=0;
 // Top Drive -> bloco -> coluna -> broca
 const raw=S.slips?S.bit:S.anchor-S.h,over=S.slips?0:Math.max(0,raw-S.hole);
 if(!S.slips)S.bit=Math.min(raw,S.hole);
 S.wob=clamp(over*30,0,60);
 S.rop=(S.wob>1&&S.rpm>10&&S.spm>20)?0.02*S.wob*S.rpm*(1.3-S.hole/4000):0;
 const dd=S.rop/3600*15*dt;S.hole+=dd;S.stats.drilled+=dd;
 S.hook=60+(S.slips?0:S.bit*0.12-S.wob);
 S.tq=S.rpm>5?3+S.wob*0.25+S.rpm/60:0;
 // bombas -> vazão -> pressão
 S.dens=mv(S.dens,S.densT,0.05*dt);
 S.fin=S.spm*4.2;
 S.spp=S.fin>0?140*Math.pow(S.fin/100,1.85)*(0.5+S.bit/2000)*(S.dens/10):0;
 // densidade -> pressão hidrostática; influxo
 S.hydro=0.052*S.dens*S.bit;
 const dP=0.052*(S.pore-S.dens)*S.hole;
 S.influx=(S.kick&&!S.bop&&!L.on)?Math.max(0,S.pore-S.dens)*12:0;
 S.pit+=S.influx*dt/60;
 // Leituras individuais dos tanques; A+B representam o volume ativo total.
 S.tankA=S.pit*.48;S.tankB=S.pit*.52;S.storageTank=350;S.tripTank=40+(S.bop?0:S.influx*.015);
 if(S.kick&&S.bop)S.casP=mv(S.casP,Math.max(0,dP),150*dt);else S.casP=mv(S.casP,0,300*dt);
 if(S.kick&&S.dens>=S.pore+0.1&&!S.bop&&S.influx==0){S.kick=0;S.pore=8.8;S.pit0=S.pit;msg('Poço controlado: kick circulado e neutralizado')}
 S.fout=S.bop?0:S.fin*0.98+S.influx*42;
 S.chk=S.bop?S.casP*0.9:0;
 S.annP=S.hydro*0.98+S.fin*0.3+S.casP;
 // LOT
 if(L.on){
  if(L.pump)L.vol+=0.4*dt;else if(L.leak)L.vol=Math.max(0,L.vol-0.01*dt);
  const k=220,pl=1700+S.hole*0.1,vl=pl/k;
  L.p=L.vol<vl?L.vol*k:pl+(L.vol-vl)*30;
  if(L.pump&&L.pts.length<2000)L.pts.push([L.vol,L.p]);
  if(!L.leak&&L.vol>vl+0.12){L.leak={p:pl,vol:vl};msg('Leak-off detectado a '+pl.toFixed(0)+' psi')}
  S.casP=L.p;
 }
 // conexão de tubo (roughnecks)
 if(S.conn>0){S.conn-=dt;if(S.conn<=0){S.conn=0;S.needConn=0;S.stats.conn++;msg('Tubo conectado. Levante o Top Drive e solte as cunhas')}}
 // alarmes
 const a=[];
 if(S.pit-S.pit0>5)a.push('GANHO NO TANQUE +'+(S.pit-S.pit0).toFixed(1)+' bbl');
 if(S.spm>0&&S.fout>S.fin+25)a.push('FLOW OUT > FLOW IN');
 if(S.spm<5&&S.fout>20)a.push('POÇO FLUINDO COM BOMBAS PARADAS');
 if(S.spp>4000)a.push('SPP ALTA');
 if(S.casP>3500)a.push('PRESSÃO DE CASING ALTA');
 if(S.wob>45)a.push('WOB EXCESSIVO');
 S.al=a;
 if(S.msgT>0)S.msgT-=dt;
 S.hT+=dt;if(S.hT>=0.25){S.hT=0;const H=S.hist,v={wob:S.wob,rop:S.rop,rpm:S.rpm,tq:S.tq,hook:S.hook,spp:S.spp,fin:S.fin,fout:S.fout,pit:S.pit,dens:S.dens,depth:S.bit};
  for(const k in v){H[k].push(v[k]);if(H[k].length>120)H[k].shift()}}
}
function opSlips(){
 if(S.slips){
  if(S.needConn)return msg('Conecte o tubo antes de soltar as cunhas');
  if(S.h<27)return msg('Levante o Top Drive até ao topo antes de soltar as cunhas');
  S.slips=0;S.anchor=S.bit+S.h;msg('Cunhas soltas');
 }else{
  if(Math.abs(S.vel)>0.05||S.rpm>5)return msg('Pare a coluna e a rotação antes de assentar as cunhas');
  S.slips=1;if(S.h<2)S.needConn=1;msg('Cunhas assentadas: coluna presa');
 }
}
function opConnect(){
 if(!S.slips||S.h>2||!S.needConn)return msg('Assente as cunhas com o Top Drive em baixo');
 if(S.elevClosed)return msg('Abra os elevadores primeiro');
 if(S.conn<=0)S.conn=4;
}
function opElev(){if(Math.abs(S.vel)>0.05)return msg('Pare o Top Drive');S.elevClosed=!S.elevClosed;msg(S.elevClosed?'Elevadores fechados':'Elevadores abertos')}
function opKick(){if(S.kick)return;S.kick=1;S.pore=S.dens+0.8;S.stats.kicks++;msg('Atenção: influxo da formação iniciado')}
function opBop(){S.bop=!S.bop;msg(S.bop?'BOP fechado: poço fechado':'BOP aberto')}
function opLot(){
 const L=S.lot;
 if(L.on){L.on=0;L.pump=0;L.vol=0;L.p=0;L.leak=null;L.pts=[];return msg('LOT terminado')}
 if(S.spm>1||S.rpm>1)return msg('Pare bombas e rotação para o LOT');
 L.on=1;L.vol=0;L.leak=null;L.pts=[];msg('LOT iniciado: mantenha "Bombear" premido');
}
function opLotRecord(){const L=S.lot;if(!L.on||!L.leak)return msg('Ainda sem leak-off detectado');
 L.res.push({p:L.leak.p,vol:L.leak.vol,emw:S.dens+L.leak.p/(0.052*800)});msg('Resultado LOT registado')}
