import * as THREE from 'three/webgpu';
import { OrbitControls } from './vendor/OrbitControls.js';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';
import { createArtistBottle } from './artist-bottles.js';
import { createGalleryLabel, galleryCollections } from './gallery-labels.js';

const $ = id => document.getElementById(id);
const stage = $('hero-cabinet') || $('stage');
const embedded=stage.id==='hero-cabinet';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

async function main() {
  const viewport=document.createElement('div');
  viewport.className='cellar-viewport';
  Object.assign(viewport.style,{position:'absolute',inset:'0 0 124px'});
  stage.appendChild(viewport);
  const renderer = new THREE.WebGPURenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setSize(viewport.clientWidth, viewport.clientHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  await renderer.init();
  viewport.appendChild(renderer.domElement);
  stage.dataset.renderer=renderer.backend.isWebGPUBackend?'webgpu':'webgl2';
  renderer.setClearColor(0x000000,0);

  const scene = new THREE.Scene();
  scene.background=null;
  const studio = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = await pmrem.fromSceneAsync(studio, .035);
  scene.environment = environment.texture;
  scene.environmentIntensity = .8;
  studio.dispose(); pmrem.dispose();

  // Fixed lens and orbit radius: reserve space up front instead of zooming on drag.
  const camera = new THREE.PerspectiveCamera(40, viewport.clientWidth / viewport.clientHeight, .1, 70);
  camera.zoom=1.1025;
  camera.updateProjectionMatrix();
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 5.6;
  controls.enableZoom = !embedded;
  controls.maxDistance = 13;
  controls.minPolarAngle = Math.PI * .32;
  controls.maxPolarAngle = Math.PI * .49;
  controls.minAzimuthAngle = -1.15;
  controls.maxAzimuthAngle = 1.15;
  function reset(front=false){
    const aspect=viewport.clientWidth/viewport.clientHeight;
    const distance=embedded?Math.max(6.45,5.9/aspect):Math.max(6.9,6.1/aspect);
    camera.position.set(front?0:distance*.13,2.27,distance);
    controls.target.set(0,1.68,0);controls.update();
  }
  reset();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x645b50, .45));
  const key = new THREE.DirectionalLight(0xfff2dc, 2.1);
  key.position.set(-3, 8, 3); key.target.position.set(0, 1.4, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, {left:-4,right:4,top:5,bottom:-4,near:.5,far:18});
  key.shadow.bias = -.00025; key.shadow.normalBias = .025; key.shadow.radius = 4; key.shadow.intensity = .28;
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xe6efff, .7); fill.position.set(4,4,2); scene.add(fill);

  // Fine vertical veneer grain with restrained pores, shared by color and relief maps.
  function woodTexture() {
    const c=document.createElement('canvas'); c.width=512;c.height=1024;
    const ctx=c.getContext('2d');ctx.fillStyle='#baa18a';ctx.fillRect(0,0,512,1024);
    let seed=21;const rand=()=>((seed=seed*16807%2147483647)-1)/2147483646;
    for(let i=0;i<2400;i++){
      const x=rand()*512;
      ctx.strokeStyle=`rgba(${rand()>.5?'44,25,15':'241,216,182'},${.02+rand()*.10})`;
      ctx.lineWidth=.2+rand()*1.25;ctx.beginPath();
      for(let y=0;y<=1024;y+=8){
        const xx=x+Math.sin(y*.004+x*.026)*10+Math.sin(y*.013+x*.11)*2;
        if(!y)ctx.moveTo(xx,y);else ctx.lineTo(xx,y);
      }ctx.stroke();
    }
    const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;
    return tex;
  }
  const grain=woodTexture();
  const wood=new THREE.MeshPhysicalMaterial({color:0x645044,map:grain,bumpMap:grain,bumpScale:.006,roughness:.46,metalness:0,clearcoat:.22,clearcoatRoughness:.42});
  const innerWood=new THREE.MeshStandardMaterial({color:0x746455,map:grain,bumpMap:grain,bumpScale:.004,roughness:.54});
  const metal=new THREE.MeshStandardMaterial({color:0x777673,metalness:.92,roughness:.28});
  const graphite=new THREE.MeshStandardMaterial({color:0x252725,metalness:.72,roughness:.32});
  const felt=new THREE.MeshStandardMaterial({color:0x282725,roughness:.98});
  // Thin smoked glass keeps the bottle collection visible behind the doors.
  const doorGlass=new THREE.MeshPhysicalMaterial({color:0x252b29,roughness:.045,metalness:.05,transparent:true,opacity:.14,depthWrite:false,side:THREE.FrontSide,ior:1.5,envMapIntensity:.65,clearcoat:.25,clearcoatRoughness:.07});
  const root=new THREE.Group();scene.add(root);
  function mesh(geo,mat,parent,x=0,y=0,z=0){
    const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);
    m.castShadow=!mat.transmission && !mat.transparent;m.receiveShadow=!mat.transmission;
    if(mat.transparent)m.renderOrder=1;
    parent.add(m);return m;
  }
  function box(w,h,d,mat,parent,x,y,z,r=.012){
    return mesh(new RoundedBoxGeometry(w,h,d,3,Math.min(r,w/3,h/3,d/3)),mat,parent,x,y,z);
  }
  // Recessed monolithic base and thin rounded walnut carcass.
  box(1.90,.13,.86,graphite,root,0,.065,-.015);
  box(2.20,.17,1.13,wood,root,0,.215,0,.025);
  box(2.20,.13,1.13,wood,root,0,3.265,0,.025);
  for(const x of [-1.04,1.04])box(.12,2.92,1.13,wood,root,x,1.72,0,.02);
  box(1.98,2.88,.08,innerWood,root,0,1.72,-.51);
  // Two real drawers: joinery, runners, felt liner and tasting accessories.
  const drawers=[];
  box(.022,.48,1.0,innerWood,root,0,.53,-.01);
  const cork=new THREE.MeshStandardMaterial({color:0xa8916d,map:grain,roughness:.96});
  const leather=new THREE.MeshStandardMaterial({color:0x67503b,roughness:.9,bumpMap:grain,bumpScale:.004});
  for(const [index,x] of [-.491,.491].entries()){
    const drawer=new THREE.Group();drawer.position.set(x,0,0);drawer.userData.drawer=true;root.add(drawer);drawers.push(drawer);
    box(.965,.42,.06,wood,drawer,0,.535,.532,.008);
    box(.78,.016,.022,graphite,drawer,0,.718,.569,.003);
    box(.89,.030,.87,innerWood,drawer,0,.36,.02,.006);
    box(.85,.005,.80,felt,drawer,0,.378,.03,.002);
    for(const dx of [-.44,.44]){
      box(.024,.19,.85,innerWood,drawer,dx,.465,.02,.004);
      box(.014,.031,.75,metal,drawer,dx+Math.sign(dx)*.018,.419,-.01,.002);
    }
    box(.87,.19,.024,innerWood,drawer,0,.465,-.4,.004);
    box(.020,.10,.76,innerWood,drawer,index===0?.11:-.12,.425,.03,.003);
    if(index===0){
      // Corkscrew: satin handle, pivot and a helical steel worm.
      box(.25,.041,.068,graphite,drawer,-.13,.413,.15,.017);
      mesh(new THREE.CylinderGeometry(.022,.022,.006,20),metal,drawer,-.10,.438,.15);
      const helix=[];for(let j=0;j<=100;j++){const t=j/100;helix.push(new THREE.Vector3(-.13+Math.cos(t*Math.PI*10)*.018,.416+Math.sin(t*Math.PI*10)*.018,.11-t*.18));}
      mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helix),100,.003,6,false),metal,drawer);
      for(let j=0;j<3;j++){const c=mesh(new THREE.CylinderGeometry(.028,.028,.09,20),cork,drawer,.27,.411,-.15+j*.14);c.rotation.z=Math.PI/2;}
    }else{
      for(let j=0;j<4;j++)mesh(new THREE.CylinderGeometry(.125,.125,.012,48),leather,drawer,.19,.386+j*.015,.06);
      for(let j=0;j<2;j++)box(.22,.012,.25,new THREE.MeshStandardMaterial({color:0xd5cbb8,roughness:1}),drawer,-.28,.39+j*.013,.06,.009);
    }
  }
  box(1.97,.045,.84,graphite,root,0,.796,0);
  // Each sliding assembly owns its rail, bottles, and local lighting.
  const racks=[{y:2.36,label:'build'},{y:1.59,label:'shape'},{y:.88,label:'back'}];
  const rows=new Map();
  for(const {y,label} of racks){
    const group=new THREE.Group();group.name=`rack-${label}`;group.userData.row=label;root.add(group);
    const row={group,y,label,progress:0,light:0,lamps:[],glows:[],prints:[]};rows.set(label,row);
    box(1.96,.038,.88,innerWood,group,0,y,-.025,.007);
    box(1.96,.10,.036,graphite,group,0,y-.027,.418,.005);
    box(1.96,.006,.038,metal,group,0,y+.022,.418,.002);
    box(1.82,.004,.72,felt,group,0,y+.021,-.045,.001);
    const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=96;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#262925';ctx.fillRect(0,0,1536,96);
    ctx.fillStyle='#ede9df';ctx.font='500 66px Arial';ctx.textBaseline='middle';
    ctx.fillText(label==='back'?'invest':label,78,49);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
    const plaque=mesh(new THREE.PlaneGeometry(1.93,.091),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}),group,0,y-.027,.437);
    row.prints.push(plaque.material);
    plaque.name=`rack-label-${label}`;plaque.castShadow=false;plaque.receiveShadow=false;
  }
  // Tiny vertical grooves give depth to the back without ornamental metalwork.
  for(let i=0;i<33;i++)box(.004,2.34,.003,felt,root,-.94+i*.059,1.99,-.466,.001);
  for(const x of [-.945,.945])box(.018,2.31,.024,graphite,root,x,2.005,-.365,.003);
  for(const row of rows.values()){
    const ceiling={build:3.195,shape:2.325,back:1.555}[row.label];
    const glow=new THREE.MeshBasicMaterial({color:0x221b12,toneMapped:false});row.glows.push(glow);
    for(const x of [-.945,.945])box(.009,ceiling-row.y-.03,.015,glow,root,x,(ceiling+row.y)/2,-.348,.002);
    box(1.78,.012,.022,glow,root,0,ceiling,.09,.003);
    for(const x of [-.48,.48]){
      const lamp=new THREE.PointLight(0xffd5a1,.07,1.3,2);
      lamp.position.set(x,ceiling-.12,.23);row.group.add(lamp);row.lamps.push(lamp);
    }
  }

  // Recessed display and status jewel borrow the reference's physical feedback language.
  const displayCanvas=document.createElement('canvas');displayCanvas.width=768;displayCanvas.height=160;
  const displayContext=displayCanvas.getContext('2d');
  const displayTexture=new THREE.CanvasTexture(displayCanvas);displayTexture.colorSpace=THREE.SRGBColorSpace;
  box(.49,.091,.015,graphite,root,.52,3.263,.571,.015);
  const displayMat=new THREE.MeshBasicMaterial({map:displayTexture,toneMapped:false});
  mesh(new THREE.PlaneGeometry(.448,.072),displayMat,root,.52,3.263,.580);
  const indicatorMat=new THREE.MeshBasicMaterial({color:0xa7c3a2,toneMapped:false});
  mesh(new THREE.SphereGeometry(.012,20,12),indicatorMat,root,.82,3.263,.572);
  let lastDisplay='';
  function updateDisplay(state){
    if(state===lastDisplay)return;lastDisplay=state;
    const busy=state==='OPENING'||state==='RETURN'||state==='CLOSING';
    const color=busy?'#d5b07b':'#b5cbb2';
    displayContext.fillStyle='#171e1b';displayContext.fillRect(0,0,768,160);
    displayContext.fillStyle=color;displayContext.font='50px monospace';displayContext.fillText('12°C',26,103);
    displayContext.fillStyle='#465148';displayContext.fillRect(267,35,2,91);
    displayContext.font='35px monospace';displayContext.fillStyle=color;displayContext.fillText(state,310,100);
    indicatorMat.color.set(color);displayTexture.needsUpdate=true;
  }
  updateDisplay('READY');
  // Base ventilation slots, frame gaskets and tiny fasteners.
  for(let j=0;j<31;j++)box(.028,.036,.005,felt,root,-.79+j*.052,.216,.569,.008);
  for(const x of [-1.047,1.047])for(const y of [.31,3.15]){
    const screw=mesh(new THREE.CylinderGeometry(.010,.010,.003,16),metal,root,x,y,.571);screw.rotation.x=Math.PI/2;
    box(.012,.002,.003,graphite,root,x,y,.575,.001);
  }

  function labelTexture(lines,artist=false){
    const c=document.createElement('canvas');c.width=512;c.height=artist?96:384;
    const ctx=c.getContext('2d');ctx.fillStyle=artist?'#222620':'#e8e1d2';ctx.fillRect(0,0,512,c.height);
    ctx.fillStyle=artist?'#e8e1d2':'#30362d';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font=artist?'500 56px Arial':'600 86px Arial';
    lines.forEach((line,i)=>ctx.fillText(line,256,(artist?48:192)+(i-(lines.length-1)/2)*86,470));
    if(!artist){ctx.fillStyle='#a3967b';ctx.fillRect(152,322,208,2);}
    const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;return tex;
  }
  const objects=[];
  function register(g,title,row){
    Object.assign(g.userData,{home:g.position.clone(),baseScale:g.scale.clone(),item:true,title,row,pop:0});
    objects.push(g);return g;
  }
  function bottle(x,y,lines,color,scale=1,collection='build',number=1){
    const g=new THREE.Group();rows.get(collection).group.add(g);g.position.set(x,y,-.055);g.scale.set(1.20*scale,scale,scale);
    const mat=new THREE.MeshPhysicalMaterial({color,roughness:.19,metalness:0,clearcoat:1,clearcoatRoughness:.08,envMapIntensity:1.3});
    const points=[[0,0],[.078,0],[.097,.015],[.103,.05],[.103,.34],[.10,.39],[.088,.425],[.047,.473],[.032,.50],[.032,.636],[.038,.640],[.038,.66],[0,.66]].map(p=>new THREE.Vector2(...p));
    mesh(new THREE.LatheGeometry(points,48),mat,g);
    mesh(new THREE.CylinderGeometry(.035,.035,.077,32),graphite,g,0,.629,0);
    mesh(new THREE.TorusGeometry(.035,.002,8,32),metal,g,0,.66,0).rotation.x=Math.PI/2;
    const print=createGalleryLabel({lines,collection,number});
    const label=new THREE.CanvasTexture(print);label.colorSpace=THREE.SRGBColorSpace;label.anisotropy=8;
    const paper=new THREE.MeshBasicMaterial({map:label,toneMapped:false,side:THREE.DoubleSide});
    const labelMesh=mesh(new THREE.CylinderGeometry(.105,.105,.257,48,1,true,-1.24,2.48),paper,g,0,.246,0);
    labelMesh.name=`gallery-label-${collection}-${number}`;
    g.userData.label={collection,number,title:lines.join(' '),cellar:"angela's cellar"};
    rows.get(collection).prints.push(paper);
    register(g,lines.join(' '),collection);
  }
  const slots=[-.69,-.23,.23,.69];
  const skills=galleryCollections[0].labels;
  const sectors=galleryCollections[1].labels;
  slots.forEach((x,i)=>bottle(x,2.385,skills[i],[0x192e24,0x39291e,0x253521,0x1c2b33][i],1,'build',i+1));
  slots.forEach((x,i)=>bottle(x,.905,sectors[i],[0x1c3025,0x39271c,0x253427,0x23303a][i],.9,'back',i+1));
  const artists=['Dalí','Munch','Picasso','Mondrian'];
  slots.forEach((x,index)=>{
    const g=new THREE.Group();g.position.set(x,1.615,-.03);rows.get('shape').group.add(g);
    g.userData.label={collection:'shape',number:index+1,title:artists[index],cellar:"angela's cellar"};
    register(g,artists[index],'shape');
    box(.32,.026,.27,graphite,g,0,.013,0,.008);
    const name=mesh(new THREE.PlaneGeometry(.29,.043),new THREE.MeshBasicMaterial({map:labelTexture([artists[index]],true),toneMapped:false}),g,0,.037,.141);name.castShadow=false;
    rows.get('shape').prints.push(name.material);
    createArtistBottle(index,{box,mesh,cork},g);
  });
  objects.sort((a,b)=>racks.findIndex(r=>r.label===a.userData.row)-racks.findIndex(r=>r.label===b.userData.row));
  // Small invisible hit volumes make glass, narrow necks and open facets easy to select.
  const hitMaterial=new THREE.MeshBasicMaterial();
  for(const object of objects){
    const bounds=new THREE.Box3().setFromObject(object).expandByScalar(.012);
    const size=bounds.getSize(new THREE.Vector3()).divide(object.scale);
    const center=object.worldToLocal(bounds.getCenter(new THREE.Vector3()));
    const hitArea=new THREE.Mesh(new THREE.BoxGeometry(size.x,size.y,size.z),hitMaterial);
    hitArea.position.copy(center);hitArea.visible=false;object.add(hitArea);
  }


  // Slender gunmetal frames, inset smoked glass and full-length recessed pulls.
  const doors=[];
  for(const side of [-1,1]){
    const hinge=new THREE.Group();hinge.position.set(side*.977,1.993,.552);hinge.userData.door=true;root.add(hinge);
    const center=-side*.485;
    const panel=box(.91,2.355,.022,doorGlass,hinge,center,0,0,.004);panel.castShadow=false;panel.receiveShadow=false;panel.renderOrder=2;
    // A two-sided hit surface covers the whole pane, including its reverse when open.
    const glassHit=new THREE.Mesh(new THREE.PlaneGeometry(.91,2.355),new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
    glassHit.position.set(center,0,.013);glassHit.visible=false;hinge.add(glassHit);
    for(const x of [center-.471,center+.471])box(.030,2.408,.048,graphite,hinge,x,0,.005,.007);
    for(const y of [-1.19,1.19])box(.955,.028,.048,graphite,hinge,center,y,.005,.007);
    for(const x of [center-.451,center+.451])box(.005,2.355,.004,metal,hinge,x,0,.031,.001);
    const hx=-side*.903;
    for(const y of [-.21,.21])box(.020,.020,.063,metal,hinge,hx,y,.059,.005);
    box(.021,.47,.026,metal,hinge,hx,0,.094,.008);
    const handleHit=new THREE.Mesh(new THREE.BoxGeometry(.075,.53,.09),hitMaterial);
    handleHit.position.set(hx,0,.084);handleHit.visible=false;hinge.add(handleHit);
    for(const y of [-.95,.95]){
      mesh(new THREE.CylinderGeometry(.017,.017,.083,24),metal,hinge,0,y,-.005);
      box(.082,.084,.018,metal,hinge,-side*.043,y,-.025,.006);
      for(const dy of [-.024,.024]){
        const bolt=mesh(new THREE.CylinderGeometry(.006,.006,.004,12),graphite,hinge,-side*.061,y+dy,-.037);bolt.rotation.x=Math.PI/2;
      }
    }
    for(const dx of [center-.441,center+.441])box(.005,2.33,.013,felt,hinge,dx,0,-.023,.002);
    doors.push({hinge,side});
  }
  // Transparent background lets the cabinet sit directly in the portfolio.
  const c=document.createElement('canvas');c.width=256;c.height=256;
  const ctx=c.getContext('2d'),grad=ctx.createRadialGradient(128,128,15,128,128,128);
  grad.addColorStop(0,'rgba(20,17,13,.42)');grad.addColorStop(.4,'rgba(20,17,13,.18)');grad.addColorStop(1,'rgba(20,17,13,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,256,256);
  const shadow=mesh(new THREE.PlaneGeometry(3.7,2.4),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}),scene,0,-.006,0);shadow.rotation.x=-Math.PI/2;shadow.castShadow=false;shadow.receiveShadow=false;

  let target=1,current=reducedMotion?1:0,drawersOpen=false,drawerProgress=0;
  let selectedRow=null,selectedObject=null;
  const rowButtons=[...document.querySelectorAll('[data-cellar-row]')];
  const itemButtons=new Map();
  const focusStyle=document.createElement('style');
  focusStyle.textContent=`
    .cellar-label-hint {
      position:absolute; bottom:38px; left:6%; right:6%; text-align:center;
      color:#99968e; font:12px/1.6 Arial,sans-serif; letter-spacing:.015em;
      transition:opacity .18s ease;
    }
    .cellar-label-screen {
      --screen-accent: #b6a56e;
      position: absolute;
      z-index: 3;
      bottom: 8px;
      left: 6%;
      right: 6%;
      max-width:484px;
      margin:0 auto;
      min-height: 108px;
      box-sizing: border-box;
      padding: 17px 54px 17px 88px;
      overflow: hidden;
      pointer-events: none;
      border: 1px solid #4a453b;
      border-radius: 12px;
      color: #f4eee3;
      background: linear-gradient(120deg,#2d2b25,#1d1e1a);
      box-shadow: 0 12px 30px rgba(0,0,0,.16), inset 0 1px 0 rgba(255,255,255,.05);
      opacity: 0;
      visibility:hidden;
      transform: translateY(-8px);
      transition: opacity .2s ease, transform .32s cubic-bezier(.2,.7,.3,1), visibility .2s;
    }
    .cellar-label-screen[data-row="shape"] { --screen-accent:#d4a184; }
    .cellar-label-screen[data-row="back"] { --screen-accent:#c49e87; }
    .cellar-label-screen[data-visible="true"] {
      opacity: 1;
      visibility:visible;
      pointer-events:auto;
      transform: translateY(0);
    }
    .cellar-label-screen__kicker { color:var(--screen-accent); font:600 9px/1.4 Arial,sans-serif; letter-spacing:.16em; text-transform:uppercase; }
    .cellar-label-screen__index { position:absolute; left:17px; top:17px; bottom:17px; width:52px; display:grid; place-items:center; color:#554e3c; background:#e9e3d5; border-radius:3px; border-bottom:3px solid var(--screen-accent); font:32px/1 Georgia,serif; }
    .cellar-label-screen__cellar { margin-top:8px; color:#aaa79d; font:10px/1.4 Arial,sans-serif; letter-spacing:.03em; }
    .cellar-label-screen__title { margin:6px 0 0; color:inherit; font:400 clamp(21px,2.1vw,28px)/1.12 Georgia,serif; letter-spacing:-.025em; text-wrap:balance; }
    .cellar-label-screen__close { position:absolute; right:9px; top:9px; width:40px; height:40px; border:0; border-radius:50%; display:grid; place-items:center; background:transparent; color:#bbb6aa; cursor:pointer; font:24px/1 Arial,sans-serif; }
    .cellar-label-screen__close:hover { color:#fffaf0; background:#ffffff0c; }
    .cellar-label-screen__close:focus-visible { outline:2px solid var(--screen-accent); outline-offset:-3px; }
    [data-theme="light"] .cellar-label-screen { color:#2b2b24; background:linear-gradient(120deg,#f5f1e8,#eae6dc); border-color:#d8d0bf; }
    [data-theme="light"] .cellar-label-screen__kicker { color:#77644a; }
    [data-theme="light"] .cellar-label-screen__cellar, [data-theme="light"] .cellar-label-screen__close, [data-theme="light"] .cellar-label-hint { color:#716d62; }
    @media(max-width:1000px){
      .cellar-label-screen { left:2%; right:2%; padding-left:72px; padding-right:46px; }
      .cellar-label-screen__index { left:13px; width:44px; }
      .cellar-label-screen__title { font-size:23px; }
    }
    @media(prefers-reduced-motion:reduce){ .cellar-label-screen, .cellar-label-hint { transition:none; } }
  `;
  document.head.appendChild(focusStyle);
  const focusHint=document.createElement('div');
  focusHint.className='cellar-label-hint';
  stage.appendChild(focusHint);
  const focusScreen=document.createElement('div');
  focusScreen.className='cellar-label-screen';
  focusScreen.dataset.visible='false';
  focusScreen.setAttribute('aria-hidden','true');
  focusScreen.inert=true;
  focusScreen.setAttribute('role','region');
  focusScreen.setAttribute('aria-label','Selected bottle label');
  focusScreen.innerHTML=`
    <span class="cellar-label-screen__index" aria-hidden="true"></span>
    <div class="cellar-label-screen__kicker"></div>
    <div role="status" aria-live="polite" aria-atomic="true"><h3 class="cellar-label-screen__title"></h3></div>
    <div class="cellar-label-screen__cellar">Angela's cellar</div>
    <button class="cellar-label-screen__close" type="button" aria-label="Return bottle to cellar" title="Return bottle · Esc">×</button>`;
  stage.appendChild(focusScreen);
  const focusKicker=focusScreen.querySelector('.cellar-label-screen__kicker');
  const focusIndex=focusScreen.querySelector('.cellar-label-screen__index');
  const focusTitle=focusScreen.querySelector('.cellar-label-screen__title');
  let displayedObject=null;
  function hideFocus(){
    if(focusScreen.contains(document.activeElement))renderer.domElement.focus({preventScroll:true});
    focusScreen.dataset.visible='false';focusScreen.setAttribute('aria-hidden','true');focusScreen.inert=true;
    focusHint.style.opacity='1';focusHint.setAttribute('aria-hidden','false');
  }
  function showFocus(object){
    if(displayedObject===object&&focusScreen.dataset.visible==='true')return;
    const label=object.userData.label;
    const rowName=label.collection==='back'?'invest':label.collection;
    focusScreen.dataset.row=label.collection;
    focusKicker.textContent=`${rowName} / ${String(label.number).padStart(2,'0')} of 04`;
    focusIndex.textContent=String(label.number).padStart(2,'0');
    focusTitle.textContent=label.title;
    focusScreen.dataset.visible='true';focusScreen.setAttribute('aria-hidden','false');focusScreen.inert=false;
    focusHint.style.opacity='0';focusHint.setAttribute('aria-hidden','true');displayedObject=object;
  }
  focusScreen.querySelector('button').addEventListener('click',clearSelection);
  function damp(value,to,speed,dt){return reducedMotion?to:THREE.MathUtils.damp(value,to,speed,dt);}
  function syncSelection(){
    stage.dataset.activeRow=selectedRow||'';
    stage.dataset.selectedItem=selectedObject?.userData.title||'';
    rowButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.cellarRow===selectedRow)));
    itemButtons.forEach((button,object)=>button.setAttribute('aria-pressed',String(object===selectedObject)));
    if(!selectedObject||selectedObject!==displayedObject)hideFocus();
    focusHint.textContent=selectedObject?`Bringing ${selectedObject.userData.label.title} into focus…`:target>.5?'Select a bottle to read its label · Drag to rotate':'Click the glass or a handle to open';
  }
  function clearSelection(){selectedRow=null;selectedObject=null;syncSelection();}
  function setOpen(value){target=THREE.MathUtils.clamp(value,0,1);if(target<.85)clearSelection();else syncSelection();}
  function selectRow(label){
    if(selectedRow===label&&!selectedObject){clearSelection();return;}
    selectedRow=label;selectedObject=null;setOpen(1);syncSelection();
  }
  function selectObject(object){
    if(selectedObject===object){clearSelection();return;}
    selectedObject=object;selectedRow=object.userData.row;setOpen(1);syncSelection();
  }
  rowButtons.forEach(button=>button.addEventListener('click',()=>selectRow(button.dataset.cellarRow)));
  const canvas=renderer.domElement;
  canvas.tabIndex=0;canvas.setAttribute('role','group');
  canvas.style.touchAction=embedded?'pan-y':'none';
  canvas.setAttribute('aria-label','Interactive cellar. Click the glass or handles to open or close the doors. Select a bottle to bring it forward and read its label below. Click a shelf to light it. Drag to rotate. Enter or Space toggles doors; Escape returns the bottles; D opens the drawers; R resets the view. Tab to explore all twelve bottles.');
  // Native controls expose every 3D object to keyboard and screen-reader users.
  const accessStyle=document.createElement('style');
  accessStyle.textContent=`.cellar-access { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); }
    .cellar-access:focus-within { width:auto; height:auto; overflow:visible; clip-path:none; bottom:128px; left:12px; right:12px; z-index:4; }
    .cellar-access button { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); }
    .cellar-access button:focus { position:relative; width:auto; height:auto; clip-path:none; padding:8px 12px; border:1px solid #ac8959; border-radius:4px; background:#eee8dc; color:#292b25; font:13px Georgia,serif; outline:2px solid #ac8959; outline-offset:3px; }`;
  document.head.appendChild(accessStyle);
  const accessibleItems=document.createElement('div');accessibleItems.className='cellar-access';accessibleItems.setAttribute('role','group');accessibleItems.setAttribute('aria-label','Cellar bottles');
  objects.forEach(object=>{
    const button=document.createElement('button');button.type='button';button.textContent=`Explore ${object.userData.title}`;button.setAttribute('aria-pressed','false');
    button.addEventListener('click',()=>selectObject(object));accessibleItems.appendChild(button);itemButtons.set(object,button);
  });stage.appendChild(accessibleItems);
  canvas.addEventListener('keydown',e=>{
    if(e.key==='Enter'||e.key===' '){e.preventDefault();setOpen(target>.5?0:1);}
    if(e.key==='d'||e.key==='D')drawersOpen=!drawersOpen;
    if(e.key==='r'||e.key==='R')reset();
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&(stage.contains(e.target)||rowButtons.includes(e.target)))clearSelection();
  });
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
  // Decorative facet outlines must not use the default one-unit line hit radius.
  raycaster.params.Line.threshold=.004;
  function pick(e){
    const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
    raycaster.setFromCamera(pointer,camera);
    const hits=raycaster.intersectObject(root,true);
    // Respect physical depth: glass receives the click before the bottles behind it.
    let object=hits.find(hit=>hit.object.isMesh)?.object;
    while(object&&!object.userData.door&&!object.userData.drawer&&!object.userData.item&&!object.userData.row)object=object.parent;
    return object;
  }
  canvas.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];});
  canvas.addEventListener('pointercancel',()=>{down=null;canvas.style.cursor='grab';});
  canvas.addEventListener('pointerup',e=>{
    if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5){down=null;return;}down=null;
    const object=pick(e);
    if(object?.userData.drawer)drawersOpen=!drawersOpen;
    else if(object?.userData.item)selectObject(object);
    else if(object?.userData.door)setOpen(target>.5?0:1);
    else if(object?.userData.row)selectRow(object.userData.row);
    else clearSelection();
  });
  canvas.style.cursor='grab';
  canvas.addEventListener('pointermove',e=>{
    if(down){canvas.style.cursor='grabbing';return;}
    const object=pick(e);canvas.style.cursor=object?'pointer':'grab';
    canvas.title=object?.userData.title||(object?.userData.door?'Click to open / close':object?.userData.drawer?'Click to open drawer':object?.userData.row?'Click to explore this shelf':'Drag to rotate · click to return bottles');
  });
  syncSelection();
  function syncTheme(){
    const dark=document.documentElement.dataset.theme==='dark';
    wood.color.setHex(dark?0x967d63:0x645044);
    innerWood.color.setHex(dark?0xa08b70:0x746455);
    scene.environmentIntensity=dark?.9:.8;renderer.toneMappingExposure=dark?1.12:1;
  }
  syncTheme();new MutationObserver(syncTheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  new ResizeObserver(()=>{
    camera.aspect=viewport.clientWidth/viewport.clientHeight;camera.updateProjectionMatrix();renderer.setSize(viewport.clientWidth,viewport.clientHeight);reset();
  }).observe(viewport);
  let inView=true;
  new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;},{rootMargin:'80px'}).observe(stage);
  await renderer.compileAsync(scene,camera);
  stage.dataset.ready='true';stage.setAttribute('aria-busy','false');
  rowButtons.forEach(button=>{button.disabled=false;});
  let previous=performance.now();const started=previous;
  renderer.setAnimationLoop(()=>{
    if(document.hidden||!inView)return;
    const now=performance.now(),dt=Math.min((now-previous)/1000,.05);previous=now;
    const anythingOut=objects.some(object=>object.userData.pop>.015)||[...rows.values()].some(row=>row.progress>.015);
    const effectiveDoorTarget=anythingOut?1:target;
    current=damp(current,now-started<450&&!reducedMotion?0:effectiveDoorTarget,3.6,dt);
    const previousBottleOut=objects.some(object=>object!==selectedObject&&object.userData.pop>.015);
    for(const object of objects){
      const data=object.userData,row=rows.get(data.row);
      const canPop=object===selectedObject&&!previousBottleOut&&current>.95&&row.progress>.92;
      data.pop=damp(data.pop,canPop?1:0,6,dt);
      object.position.copy(data.home);
      object.position.y+=data.pop*.045;object.position.z+=data.pop*.86;
      object.rotation.y=data.pop*.16;
      object.scale.copy(data.baseScale).multiplyScalar(1+data.pop*.10);
    }
    // Reveal the caption as the selected bottle begins to leave its rack.
    if(selectedObject&&selectedObject.userData.pop>.14&&!previousBottleOut)showFocus(selectedObject);
    for(const row of rows.values()){
      const rowBottleOut=objects.some(object=>object.userData.row===row.label&&object.userData.pop>.015);
      const active=selectedRow===row.label;
      // Keep the tray extended until its bottle has settled; doors close last.
      row.progress=damp(row.progress,((active&&current>.95)||rowBottleOut)?1:0,5,dt);
      row.group.position.z=row.progress*.84;
      row.light=damp(row.light,active?1:0,5,dt);
      row.lamps.forEach(lamp=>{lamp.intensity=.045+row.light*1.55;});
      row.glows.forEach(glow=>glow.color.setRGB(.035+row.light*.965,.026+row.light*.624,.018+row.light*.332));
      row.prints.forEach(print=>print.color.setScalar(.42+row.light*.58));
      // Readable state also assists integration checks without exposing the scene.
      stage.dataset[`${row.label}Rack`]=row.progress>.97?'out':row.progress<.015?'in':'moving';
      stage.dataset[`${row.label}Light`]=active?'lit':'dim';
    }
    doors.forEach(({hinge,side})=>{const amount=side<0?current:current*current*(3-2*current);hinge.rotation.y=side*amount*Math.PI*.60;});
    drawerProgress=damp(drawerProgress,drawersOpen?1:0,5,dt);
    drawers.forEach((drawer,i)=>{drawer.position.z=drawerProgress*(i===0?.54:.43);});
    const popping=selectedObject&&selectedObject.userData.pop>.97;
    const returning=!selectedRow&&anythingOut;
    const state=returning?'RETURN':Math.abs(current-effectiveDoorTarget)>.02?(effectiveDoorTarget>current?'OPENING':'CLOSING'):popping?'EXPLORE':selectedRow?(selectedRow==='back'?'INVEST':selectedRow.toUpperCase()):'DIM';
    updateDisplay(state);stage.dataset.door=current>.95?'open':current<.02?'closed':'moving';
    stage.dataset.bottleState=popping?'out':objects.some(object=>object.userData.pop>.015)?'moving':'in';
    controls.update();renderer.render(scene,camera);
  });
}
main().catch(error=>{
  console.error(error);stage.setAttribute('aria-busy','false');stage.dataset.ready='error';
  const note=document.createElement('p');note.className='cabinet-fallback';note.textContent='Build · Shape · Invest — 3D preview unavailable in this browser.';stage.appendChild(note);
});
