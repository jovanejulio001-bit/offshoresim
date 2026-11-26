// Mundo 3D, jogador, câmara, interações. Tudo lê o estado S do motor.
const cv=document.getElementById('c'),R=new THREE.WebGLRenderer({canvas:cv,antialias:devicePixelRatio<2});
R.setPixelRatio(Math.min(devicePixelRatio,1.5));R.shadowMap.enabled=true;
const sc=new THREE.Scene();sc.background=new THREE.Color(0x8fc3e6);sc.fog=new THREE.Fog(0x8fc3e6,60,260);
const cam=new THREE.PerspectiveCamera(60,1,.1,400);
sc.add(new THREE.HemisphereLight(0xdfefff,0x335577,.8));
const sun=new THREE.DirectionalLight(0xfff0d0,1.1);sun.position.set(30,50,20);sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-35,right:35,top:35,bottom:-35,far:120});sc.add(sun);
const M=(c,e)=>new THREE.MeshStandardMaterial({color:c,roughness:.7,metalness:.3,emissive:e||0});
const solids=[],C=[];
function box(w,h,d,c,x,y,z,p,solid){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),M(c));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;(p||sc).add(m);if(solid)solids.push(m);return m}
function cyl(r,h,c,x,y,z,p,seg){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,seg||12),M(c));m.position.set(x,y,z);m.castShadow=true;(p||sc).add(m);return m}
function col(x0,x1,z0,z1,on){C.push({x0,x1,z0,z1,on:on||(()=>1)})}
function label(t,x,y,z){const k=document.createElement('canvas');k.width=256;k.height=64;const g=k.getContext('2d');g.fillStyle='rgba(0,0,0,.6)';g.fillRect(0,0,256,64);g.fillStyle='#ffd24a';g.font='bold 28px sans-serif';g.textAlign='center';g.fillText(t,128,42);
 const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(k),depthTest:false}));s.position.set(x,y,z);s.scale.set(5,1.25,1);sc.add(s)}
// mar
const seaG=new THREE.PlaneGeometry(500,500,50,50);seaG.rotateX(-Math.PI/2);const sea=new THREE.Mesh(seaG,M(0x1b6a96));sea.position.y=-12;sea.receiveShadow=true;sc.add(sea);
// plataforma
box(42,1,42,0x6d7278,0,-.5,0).receiveShadow=true;
[[-18,-18],[18,-18],[-18,18],[18,18]].forEach(p=>cyl(1.2,16,0xc9a227,p[0],-8,p[1],0,10));
// derrick
[[-3.5,-3.5],[3.5,-3.5],[-3.5,3.5],[3.5,3.5]].forEach(p=>{cyl(.25,36,0xd9831f,p[0],18,p[1]);col(p[0]-.4,p[0]+.4,p[1]-.4,p[1]+.4)});
for(let y=4;y<36;y+=8){box(7,.2,.2,0xd9831f,0,y,-3.5);box(7,.2,.2,0xd9831f,0,y,3.5);box(.2,.2,7,0xd9831f,-3.5,y,0);box(.2,.2,7,0xd9831f,3.5,y,0)}
box(8,1,8,0x555a60,0,36.5,0);
box(.2,32,.2,0xaaaaaa,-.8,17,-1.6);box(.2,32,.2,0xaaaaaa,.8,17,-1.6);
box(2.4,.8,2.4,0x333333,0,.4,0);cyl(.5,.1,0x111111,0,.85,0);label('MESA ROTATIVA',0,3.4,2);
// Top Drive + bloco
const td=new THREE.Group();sc.add(td);
box(1.4,1.6,1,0xe8c01a,0,1,0,td);const tdRot=cyl(.35,.9,0x444444,0,0,0,td,8);box(1.2,1.2,.8,0x2b4c7e,0,-1.6+1,0,td).position.y=-.3+1.9-.9-.9;
const hook=cyl(.15,.8,0xdd2222,0,2.2,0,td);
const pipe=cyl(.12,1,0x9aa0a6,0,0,0),cabL=cyl(.04,1,0x222222,-.5,0,-.8),cabR=cyl(.04,1,0x222222,.5,0,-.8);
// doghouse (14,-8)
const dh=[box(8,4,.3,0x3b6ea5,14,2,-11,0,1),box(.3,4,6,0x3b6ea5,10,2,-8,0,1),box(.3,4,6,0x3b6ea5,18,2,-8,0,1),
 box(3,4,.3,0x3b6ea5,11.5,2,-5,0,1),box(3,4,.3,0x3b6ea5,16.5,2,-5,0,1),box(8.4,.3,6.4,0x2a4d75,14,4.1,-8,0,1)];
col(10.9,17.1,-11.2,-10.8);col(9.8,10.2,-11,-5);col(17.8,18.2,-11,-5);col(10,13,-5.2,-4.8);col(15,18,-5.2,-4.8);
const doorP=new THREE.Group();doorP.position.set(13,0,-5);sc.add(doorP);const door=box(2,3.4,.2,0xc9a227,1,1.7,0,doorP,1);col(13,15,-5.3,-4.7,()=>doorA<.8);
const panelM=box(3,1.2,.8,0x222a33,14,.6,-10.4);box(2.6,.8,.1,0x00ff88,14,1.5,-10.1).material=M(0x003322,0x00aa55);col(12.4,15.6,-10.9,-9.9);
const scr=panelM;const dhLight=new THREE.PointLight(0xffffff,.9,12);dhLight.position.set(14,3.4,-8);sc.add(dhLight);label('DOGHOUSE',14,5.5,-5);
// tanques de lama e equipamento
const liq=[];
[[-15,-15,'TANQUE ATIVO A'],[-15,-9,'TANQUE ATIVO B'],[-6,-17.5,'TANQUE ARMAZ.']].forEach((t,i)=>{
 box(6,2.4,4,0x7a7f85,t[0],1.2,t[1],0,1);col(t[0]-3,t[0]+3,t[1]-2,t[1]+2);
 const l=box(5.6,2,3.6,0x7a5a2e,t[0],1.3,t[1]);liq.push(l);label(t[2],t[0],3.8,t[1])});
box(2.5,1.6,1.6,0x444b52,-8,.8,-10,0,1);box(2.5,1.6,1.6,0x444b52,-5,.8,-10,0,1);col(-9.3,-3.7,-10.9,-9.1);label('BOMBAS DE LAMA',-6.5,2.8,-10);
box(3,1.5,2.5,0x6a7078,5,.75,-17,0,1);cyl(.9,3,0x8a6d3b,9,1.5,-17);cyl(.9,3,0x8a6d3b,12,1.5,-17);cyl(.9,3,0x8a6d3b,15,1.5,-17);col(3.5,16,-18.3,-15.7);
label('PENEIRAS',5,2.8,-17);label('DEGASSER',9,3.8,-17);label('DESANDER',12,3.8,-17);label('DESILTER',15,3.8,-17);
box(2.5,1.2,2.5,0x4d6b3a,0,.6,-17,0,1);col(-1.4,1.4,-18.3,-15.7);label('TRATAMENTO DE LAMA',0,2.4,-17);
// mezanino com escadas
for(let i=0;i<12;i++)box(2.5,.25,.34,0x888888,-14,i*.25+.1,2.17+i*.333);
box(8,3,8,0x555a60,-14,1.5,10,0,1);col(-18,-10,6,14,()=>P.y<2.4);box(8,.2,8,0xd9831f,-14,3.05,10);label('MEZANINO / ESCADAS',-14,5,10);
const gh=(x,z)=>(x>-15.3&&x<-12.7&&z>2&&z<6)?(z-2)/4*3:(x>-18&&x<-10&&z>6&&z<14)?3:0;
// monkey board + workers
box(3,.3,2,0x666666,0,22,-3);
function worker(c){const g=new THREE.Group();const b=cyl(.3,1.1,c,0,.8,0,g,8);cyl(.14,.8,0x222a33,-.1,.4,0,g);const h=new THREE.Mesh(new THREE.SphereGeometry(.22,8,8),M(0xe0b090));h.position.y=1.6;g.add(h);
 const hh=new THREE.Mesh(new THREE.SphereGeometry(.25,8,6,0,6.3,0,1.6),M(0xffee00));hh.position.y=1.7;g.add(hh);sc.add(g);return g}
const rn1=worker(0xff7a00),rn2=worker(0xff7a00),dm=worker(0x2d9cdb);dm.position.set(0,22.15,-3);
// partículas de lama ao longo do circuito
const PATH=[[-15,2.6,-9],[-8,1.2,-10],[-3.5,1,-3.6],[-3.5,32,-3.6],[0,32,0],[0,1,0],[0,-1,0],[1.2,.8,0],[1.2,.8,-12],[5,2,-17],[9,2,-17],[12,2,-17],[15,2,-17],[15,.8,-19.5],[-15,.8,-19.5],[-15,2.7,-15],[-15,2.7,-9]].map(p=>new THREE.Vector3(...p));
const seg=[];let tot=0;for(let i=1;i<PATH.length;i++){const l=PATH[i].distanceTo(PATH[i-1]);seg.push(l);tot+=l}
const NP=48,pg=new THREE.BufferGeometry(),pp=new Float32Array(NP*3),pt=[];for(let i=0;i<NP;i++)pt.push(i/NP*tot);
pg.setAttribute('position',new THREE.BufferAttribute(pp,3));const pts=new THREE.Points(pg,new THREE.PointsMaterial({color:0xc07a28,size:.5}));pts.frustumCulled=false;sc.add(pts);
// tubo do standpipe
cyl(.12,31,0x999999,-3.5,16.5,-3.6);
// luz de alarme
const beacon=new THREE.PointLight(0xff0000,0,25);beacon.position.set(0,38,0);sc.add(beacon);const bm=new THREE.Mesh(new THREE.SphereGeometry(.5),M(0x440000));bm.position.copy(beacon.position);sc.add(bm);
// jogador
const P=new THREE.Group();sc.add(P);P.position.set(0,0,12);
const pb=cyl(.32,1.2,0x2a7fdb,0,.8,0,P,10),ph=new THREE.Mesh(new THREE.SphereGeometry(.25,10,10),M(0xe0b090));ph.position.y=1.6;P.add(ph);
const phat=new THREE.Mesh(new THREE.SphereGeometry(.28,10,8,0,6.3,0,1.6),M(0xff6a00));phat.position.y=1.68;P.add(phat);
const legL=cyl(.1,.6,0x222222,-.15,.3,0,P),legR=cyl(.1,.6,0x222222,.15,.3,0,P);
// entrada
const K={},joy={x:0,y:0};let yaw=0,pit=.35,dist=7,doorA=0,doorT=0,panelOpen=false,run=false,bob=0;
onkeydown=e=>{K[e.code]=1;if(e.code=='KeyE')interact();if(e.code=='Escape')closePanel&&closePanel()};onkeyup=e=>K[e.code]=0;
const drag={};cv.onpointerdown=e=>{drag[e.pointerId]=[e.clientX,e.clientY];cv.setPointerCapture(e.pointerId)};
cv.onpointermove=e=>{const d=drag[e.pointerId];if(!d)return;yaw-=(e.clientX-d[0])*.006;pit=clamp(pit+(e.clientY-d[1])*.005,.05,1.2);d[0]=e.clientX;d[1]=e.clientY};
cv.onpointerup=cv.onpointercancel=e=>delete drag[e.pointerId];cv.onwheel=e=>dist=clamp(dist+e.deltaY*.005,3,12);
const jz=document.getElementById('joy'),jk=document.getElementById('knob');let jid=null;
jz.onpointerdown=e=>{jid=e.pointerId;jz.setPointerCapture(jid);jm(e)};jz.onpointermove=e=>{if(e.pointerId==jid)jm(e)};
jz.onpointerup=jz.onpointercancel=()=>{jid=null;joy.x=joy.y=0;jk.style.transform=''};
function jm(e){const r=jz.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let x=(e.clientX-cx)/(r.width/2),y=(e.clientY-cy)/(r.height/2);const l=Math.hypot(x,y);if(l>1){x/=l;y/=l}
 joy.x=x;joy.y=y;jk.style.transform=`translate(${x*35}px,${y*35}px)`;run=l>.9}
document.getElementById('btnE').onclick=()=>interact();
// interações
const IA=[
 {x:13.5,z:-4,r:2.6,t:'Abrir/fechar porta',f:()=>{doorT=doorT?0:1.6;msg(doorT?'Porta aberta':'Porta fechada')}},
 {x:14,z:-9.2,r:2.2,t:'Operar Painel do Driller',f:()=>openPanel()},
 {x:0,z:2.5,r:3.5,t:'Inspecionar Top Drive / mesa rotativa',f:()=>msg(`Top Drive: ${S.rpm.toFixed(0)} RPM, altura ${S.h.toFixed(1)} m, cunhas ${S.slips?'ativas':'soltas'}, hook load ${S.hook.toFixed(0)} klb`)},
 {x:-6.5,z:-8.5,r:3,t:'Inspecionar bombas de lama',f:()=>msg(`Bombas: ${S.spm.toFixed(0)} SPM, ${S.fin.toFixed(0)} gpm, SPP ${S.spp.toFixed(0)} psi`)},
 {x:9,z:-15,r:4,t:'Inspecionar peneiras/degasser',f:()=>msg(`Retorno: ${S.fout.toFixed(0)} gpm, densidade ${S.dens.toFixed(2)} ppg`)},
 {x:-15,z:-12,r:5,t:'Inspecionar tanques ativos',f:()=>msg(`Volume ativo: ${S.pit.toFixed(1)} bbl (ganho ${(S.pit-S.pit0).toFixed(1)})`)},
 {x:0,z:-15.5,r:2.5,t:'Tratamento de lama (ajuste no painel)',f:()=>msg('Ajuste a densidade no Painel do Driller > Tratamento de lama')}];
let near=null;
function interact(){if(panelOpen)return;if(near)near.f()}
// movimento com colisões
const blocked=(x,z)=>{if(Math.abs(x)>20||Math.abs(z)>20)return true;
 for(const c of C)if(c.on()&&x+.4>c.x0&&x-.4<c.x1&&z+.4>c.z0&&z-.4<c.z1)return true;
 if(P.position.y>2.2&&!((x>-15.3&&x<-12.7&&z>2&&z<6)||(x>-18&&x<-10&&z>6&&z<14)))return true;return false};
const ray=new THREE.Raycaster(),_v=new THREE.Vector3(),_d=new THREE.Vector3();
let last=performance.now();
function resize(){R.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()}onresize=resize;resize();
function loop(now){
 const dt=Math.min((now-last)/1000,.05);last=now;step(dt);
 // jogador
 let ix=(K.KeyD||K.ArrowRight?1:0)-(K.KeyA||K.ArrowLeft?1:0)+joy.x,iz=(K.KeyS||K.ArrowDown?1:0)-(K.KeyW||K.ArrowUp?1:0)+joy.y;
 if(panelOpen)ix=iz=0;const l=Math.hypot(ix,iz);if(l>1){ix/=l;iz/=l}
 if(l>.08){const sp=((K.ShiftLeft||run)?6:3.2)*Math.min(l,1),sy=Math.sin(yaw),cy=Math.cos(yaw),dx=(ix*cy+iz*sy)*sp*dt,dz=(iz*cy-ix*sy)*sp*dt;
  if(!blocked(P.position.x+dx,P.position.z))P.position.x+=dx;if(!blocked(P.position.x,P.position.z+dz))P.position.z+=dz;
  P.rotation.y=Math.atan2(dx,dz);bob+=dt*sp*2.2}
 const gy=gh(P.position.x,P.position.z);P.position.y+=(gy-P.position.y)*Math.min(1,dt*10);
 legL.rotation.x=Math.sin(bob)*.6*(l>.08);legR.rotation.x=-Math.sin(bob)*.6*(l>.08);
 // porta
 doorA+=(doorT-doorA)*Math.min(1,dt*5);doorP.rotation.y=-doorA;
 // câmara com colisão
 _v.set(P.position.x,P.position.y+1.6,P.position.z);
 _d.set(Math.sin(yaw)*Math.cos(pit),Math.sin(pit),Math.cos(yaw)*Math.cos(pit));
 ray.set(_v,_d);ray.far=dist;const hit=ray.intersectObjects(solids,false)[0];const dd=hit?Math.max(.8,hit.distance-.3):dist;
 cam.position.copy(_v).addScaledVector(_d,dd);cam.lookAt(_v);
 // Top Drive, bloco, coluna
 const by=2+S.h;td.position.y=by;tdRot.rotation.y+=S.rpm*dt*.1;
 pipe.scale.y=Math.max(.01,by-.9);pipe.position.y=.9+(by-.9)/2;pipe.rotation.y+=S.rpm*dt*.1;
 const cl=Math.max(.1,36-(by+2.6));cabL.scale.y=cabR.scale.y=cl;cabL.position.y=cabR.position.y=by+2.6+cl/2;
 // trabalhadores
 const k=S.conn>0?1:0,t=S.t;
 rn1.position.set(1.8-k*.5,0,2.4-k*1.2);rn2.position.set(-1.8+k*.5,0,2.4-k*1.2);
 rn1.rotation.set(k*Math.sin(t*10)*.25,0,0);rn2.rotation.set(k*Math.sin(t*10+1)*.25,0,0);rn1.position.y=rn2.position.y=Math.abs(Math.sin(t*(2+k*6)))*.04;
 dm.position.x=k?Math.sin(t*2)*1:Math.sin(t*.5)*.3;dm.rotation.y=Math.sin(t)*.4;
 // lama
 const flow=S.fout>0?S.fout:S.fin;const vel=flow/60*1.2;
 for(let i=0;i<NP;i++){pt[i]=(pt[i]+vel*dt)%tot;let d=pt[i],j=0;while(d>seg[j]&&j<seg.length-1){d-=seg[j];j++}
  _v.lerpVectors(PATH[j],PATH[j+1],d/seg[j]);pp[i*3]=_v.x;pp[i*3+1]=_v.y;pp[i*3+2]=_v.z}
 pg.attributes.position.needsUpdate=true;pts.visible=flow>1;
 const lv=clamp(S.pit/600,.05,1);liq[0].scale.y=liq[1].scale.y=lv;liq[0].position.y=liq[1].position.y=.3+lv;liq[2].scale.y=.8;liq[2].position.y=1.1;
 // alarme visual/sonoro
 const al=S.al.length>0;beacon.intensity=al?(Math.sin(t*10)>0?3:0):0;bm.material.emissive.setHex(al?0xff0000:0x220000);
 (scr.material).emissive.setHex(al&&Math.sin(t*6)>0?0x550000:0x000000);
 if(al)alarmSound(t);
 // mar
 if((Math.floor(now/50))%2==0){const a=seaG.attributes.position;for(let i=0;i<a.count;i++)a.setY(i,Math.sin(a.getX(i)*.08+t*.9)*.5+Math.cos(a.getZ(i)*.07+t*.7)*.4);a.needsUpdate=true;seaG.computeVertexNormals()}
 // interação mais próxima
 near=null;let bd=1e9;for(const o of IA){const d=Math.hypot(P.position.x-o.x,P.position.z-o.z);if(d<o.r&&d<bd){bd=d;near=o}}
 const pr=document.getElementById('prompt');pr.style.display=near&&!panelOpen?'block':'none';if(near)pr.textContent='[E] '+near.t;
 hudUpdate();R.render(sc,cam);requestAnimationFrame(loop)}
requestAnimationFrame(loop);
