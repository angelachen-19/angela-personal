import * as THREE from 'three/webgpu';
import { OrbitControls } from './vendor/OrbitControls.js';

const $ = id => document.getElementById(id);
const stage = $('stage');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

async function main() {
  const renderer = new THREE.WebGPURenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setSize(stage.clientWidth, stage.clientHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  await renderer.init();
  stage.appendChild(renderer.domElement);
  $('engine').textContent = `THREE.JS / ${renderer.backend.isWebGPUBackend ? 'WEBGPU' : 'WEBGL2 · COMPATIBILITY'}`;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, stage.clientWidth / stage.clientHeight, .1, 80);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 5.8;
  controls.maxDistance = 13;
  controls.minPolarAngle = Math.PI * .30;
  controls.maxPolarAngle = Math.PI * .53;
  controls.minAzimuthAngle = -.95;
  controls.maxAzimuthAngle = .95;
  controls.target.set(0, 1.98, 0);
  function reset(front = false) {
    const mobile = stage.clientWidth < 800;
    camera.position.set(front ? 0 : 3.1, front ? 2.75 : 3.05, mobile ? 11.8 : 9.1);
    controls.target.set(0, mobile ? 1.95 : 1.9, 0);
    controls.update();
  }
  reset();
  scene.add(new THREE.HemisphereLight(0xe6e4cc, 0x292c22, 2.3));
  const key = new THREE.DirectionalLight(0xffe4ba, 3.5); key.position.set(-3, 6, 5); scene.add(key);
  const fill = new THREE.DirectionalLight(0xc6d8cf, 1.7); fill.position.set(4, 3, 2); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffd18b, 2.2); rim.position.set(-1, 4, -3); scene.add(rim);

  // A deterministic, fine-grained veneer; all assets are generated locally.
  function woodTexture() {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 1024;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#ad845b'; ctx.fillRect(0, 0, 256, 1024);
    let seed = 13; const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    for (let i = 0; i < 1900; i++) {
      const x = rand() * 256;
      ctx.strokeStyle = `rgba(${rand() > .5 ? '42,24,12' : '237,195,139'},${.03 + rand() * .14})`;
      ctx.lineWidth = .2 + rand() * 1.4; ctx.beginPath();
      for (let y = 0; y <= 1024; y += 16) {
        const xx = x + Math.sin(y * .008 + x * .036) * 4 + Math.sin(y * .021 + x) * .8;
        if (!y) ctx.moveTo(xx, y); else ctx.lineTo(xx, y);
      } ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4; return texture;
  }
  const grain = woodTexture();
  const wood = new THREE.MeshStandardMaterial({ color: 0x68432f, map: grain, roughness: .38, metalness: .06 });
  const darkWood = new THREE.MeshStandardMaterial({ color: 0x30251a, map: grain, roughness: .5 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xc8a469, roughness: .26, metalness: .78 });
  const black = new THREE.MeshStandardMaterial({ color: 0x1b211a, roughness: .45, metalness: .2 });
  const interior = new THREE.MeshStandardMaterial({ color: 0x665339, map: grain, roughness: .65 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xe0d2aa, roughness: .8 });
  const root = new THREE.Group(); scene.add(root);
  function mesh(geo, mat, parent, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m;
  }
  function box(w, h, d, mat, parent, x, y, z) { return mesh(new THREE.BoxGeometry(w, h, d), mat, parent, x, y, z); }
  function line(points, radius, mat, parent) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    return mesh(new THREE.TubeGeometry(curve, Math.max(2, points.length * 3), radius, 5, false), mat, parent);
  }
  // Tall, slender legs and a stepped plinth.
  for (const x of [-.93, .93]) for (const z of [-.36, .36]) {
    mesh(new THREE.CylinderGeometry(.038, .026, .49, 12), brass, root, x, .255, z);
    box(.105, .07, .105, black, root, x, .035, z);
  }
  box(2.27, .09, 1.10, black, root, 0, .51, 0);
  box(2.22, .035, 1.06, brass, root, 0, .575, 0);
  box(2.16, .11, 1.04, wood, root, 0, .64, 0);
  box(2.18, .12, 1.06, wood, root, 0, 3.29, 0);
  box(2.20, .025, 1.075, brass, root, 0, 3.355, 0);
  box(2.25, .055, 1.10, darkWood, root, 0, 3.395, 0);
  for (const x of [-1.025, 1.025]) {
    box(.13, 2.56, 1.02, wood, root, x, 1.96, 0);
    box(.018, 2.55, .022, brass, root, x - Math.sign(x) * .045, 1.96, .522);
  }
  box(1.98, 2.55, .08, interior, root, 0, 1.96, -.47);
  // Decorative brass tracery on the back panel.
  for (const x of [-.78, -.52, -.26, 0, .26, .52, .78]) box(.008, 2.34, .008, brass, root, x, 1.96, -.422);
  for (const y of [.72, 1.50, 2.25]) {
    box(1.95, .065, .9, darkWood, root, 0, y, -.015);
    box(1.95, .018, .024, brass, root, 0, y + .008, .442);
  }
  const glow = new THREE.MeshStandardMaterial({ color: 0xffd798, emissive: 0xffb94c, emissiveIntensity: 3 });
  const lamps = [];
  for (const y of [1.46, 2.21, 3.20]) {
    box(1.78, .018, .025, glow, root, 0, y, .24);
    const lamp = new THREE.PointLight(0xffc273, 0, 2.5, 2); lamp.position.set(0, y - .14, .1); root.add(lamp); lamps.push(lamp);
  }
  function bottle(x, y, z, color, scale = 1, label = true) {
    const g = new THREE.Group(); root.add(g); g.position.set(x, y, z); g.scale.setScalar(scale);
    const material = new THREE.MeshPhysicalMaterial({ color, roughness: .18, metalness: .12, clearcoat: 1, clearcoatRoughness: .1 });
    const profile = [[0,0],[.091,0],[.108,.028],[.108,.34],[.10,.40],[.043,.48],[.037,.51],[.037,.66],[.041,.665],[.041,.70],[0,.70]].map(p => new THREE.Vector2(...p));
    mesh(new THREE.LatheGeometry(profile, 28), material, g);
    mesh(new THREE.CylinderGeometry(.042,.042,.065,20), brass, g, 0,.66,0);
    if (label) {
      mesh(new THREE.CylinderGeometry(.110,.110,.16,28,1,true), cream,g,0,.23,0);
      box(.041,.055,.004, brass,g,0,.235,.112);
      box(.062,.004,.004, darkWood,g,0,.20,.112);
    }
  }
  [-.73,-.39,-.05,.29,.64].forEach((x,i) => bottle(x,.76,-.03,[0x1b3020,0x4b281b,0x232b19][i%3],.92));
  [-.7,-.38].forEach((x,i)=>bottle(x,1.54,-.03,i?0x494520:0x3c201a,.91));
  bottle(-.65,2.29,-.07,0x333821,1.08);
  bottle(-.29,2.29,-.07,0x51331a,.94);
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xdfdbba, metalness: .25, roughness: .12, transparent: true, opacity: .48, side: THREE.DoubleSide, depthWrite: false });
  function wineGlass(x,y,z) {
    const g = new THREE.Group(); root.add(g); g.position.set(x,y,z);
    mesh(new THREE.CylinderGeometry(.09,.09,.015,28),glass,g,0,.01,0);
    mesh(new THREE.CylinderGeometry(.009,.009,.20,12),glass,g,0,.12,0);
    const points = [[.008,.20],[.045,.22],[.09,.28],[.104,.34],[.101,.41],[.083,.48]].map(p=>new THREE.Vector2(...p));
    mesh(new THREE.LatheGeometry(points,32),glass,g);
    mesh(new THREE.TorusGeometry(.083,.004,6,32),brass,g,0,.48,0).rotation.x = Math.PI/2;
  }
  [.14,.45,.74].forEach(x => wineGlass(x,2.29,.03));
  // A low serving tray and sculptural decanter.
  mesh(new THREE.CylinderGeometry(.31,.31,.023,48),brass,root,.44,1.554,.02);
  const decanter = new THREE.MeshPhysicalMaterial({color:0xa77531,roughness:.17,metalness:.15,clearcoat:1});
  mesh(new THREE.CylinderGeometry(.13,.17,.3,8),decanter,root,.44,1.72,.02);
  mesh(new THREE.CylinderGeometry(.047,.10,.10,8),decanter,root,.44,1.92,.02);
  mesh(new THREE.IcosahedronGeometry(.074,0),brass,root,.44,2.025,.02);

  // Each door has a real hinge at its outside edge. Ornament stays in local coordinates.
  const doors = [];
  for (const side of [-1,1]) {
    const hinge = new THREE.Group(); hinge.position.set(side * .98,1.96,.535); root.add(hinge);
    hinge.userData.door = true;
    const center = -side * .486;
    const panel = box(.967,2.51,.082,wood,hinge,center,0,0);
    panel.userData.door = true;
    // Interior face and a fine border on the exterior.
    box(.905,2.43,.012,darkWood,hinge,center,0,-.048);
    for (const x of [center-.447,center+.447]) box(.009,2.40,.008,brass,hinge,x,0,.046);
    for (const y of [-1.20,1.20]) box(.894,.009,.008,brass,hinge,center,y,.046);
    // Split sunburst: each half is clipped to its own panel bounds.
    const seam = -side*.964;
    const originY = -.36;
    for (let i=0;i<=13;i++) {
      const theta = .11 + i * (Math.PI-.22)/13;
      const dx = side * Math.sin(theta), dy = Math.cos(theta);
      const tx = .87 / Math.abs(dx);
      const ty = dy > 0 ? (1.17-originY)/dy : (-1.17-originY)/dy;
      const len = Math.min(tx,ty);
      line([[seam+dx*.17,originY+dy*.17,.048],[seam+dx*len,originY+dy*len,.048]],.0045,brass,hinge);
    }
    for(const radius of [.18,.24,.30]) {
      const pts=[]; for(let i=0;i<=36;i++){const a=i*Math.PI/36;pts.push([seam+side*Math.sin(a)*radius,originY+Math.cos(a)*radius,.055]);}
      line(pts,.006,brass,hinge);
    }
    // Raised handles and hinge pins.
    box(.025,.30,.065,brass,hinge,-side*.888,originY,.088);
    for(const y of [-.93,.93]) mesh(new THREE.CylinderGeometry(.022,.022,.15,12),brass,hinge,0,y,0);
    doors.push({hinge,side});
  }
  // Soft contact shadow on a transparent plane preserves the art-directed background.
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=256;shadowCanvas.height=256;
  const ctx=shadowCanvas.getContext('2d'), grad=ctx.createRadialGradient(128,128,10,128,128,128);
  grad.addColorStop(0,'rgba(0,0,0,.65)');grad.addColorStop(.45,'rgba(0,0,0,.35)');grad.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,256,256);
  const shadow=mesh(new THREE.PlaneGeometry(4.5,3),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}),scene,0,.012,.1);shadow.rotation.x=-Math.PI/2;

  let target=0, current=0, lightOn=true;
  const button=$('open'), slider=$('openness');
  function setOpen(value) {
    target = THREE.MathUtils.clamp(value,0,1);
    button.innerHTML = target > .5 ? '合上夜藏 <span>↙</span>' : '开启夜藏 <span>↗</span>';
    button.setAttribute('aria-expanded',String(target>.5)); slider.value=Math.round(target*100);
  }
  button.onclick=()=>setOpen(target>.5?0:1);
  slider.oninput=()=>setOpen(Number(slider.value)/100);
  $('light').onclick=()=>{lightOn=!lightOn;$('light').setAttribute('aria-pressed',String(lightOn));};
  $('front').onclick=()=>reset(true);$('reset').onclick=()=>reset();
  const finishes={walnut:[0x68432f,'烟熏胡桃木 · 黄铜'],forest:[0x284b3b,'墨绿漆木 · 黄铜'],oxblood:[0x792f29,'勃艮第红 · 黄铜']};
  document.querySelectorAll('[data-finish]').forEach(b=>b.onclick=()=>{
    const [color,name]=finishes[b.dataset.finish];wood.color.setHex(color);$('finish-name').textContent=name;
    document.querySelectorAll('[data-finish]').forEach(s=>s.setAttribute('aria-pressed',String(s===b)));
  });
  const raycaster=new THREE.Raycaster(), pointer=new THREE.Vector2(); let down=null;
  renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];});
  renderer.domElement.addEventListener('pointercancel',()=>{down=null;});
  renderer.domElement.addEventListener('pointerup',e=>{
    if(!down || Math.hypot(e.clientX-down[0],e.clientY-down[1])>5){down=null;return;} down=null;
    const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
    raycaster.setFromCamera(pointer,camera);
    const hit=raycaster.intersectObject(root,true)[0];
    let object = hit?.object;
    while (object && !object.userData.door) object = object.parent;
    if(object) setOpen(target>.5?0:1);
  });
  new ResizeObserver(()=>{
    camera.aspect=stage.clientWidth/stage.clientHeight;camera.updateProjectionMatrix();renderer.setSize(stage.clientWidth,stage.clientHeight);
  }).observe(stage);
  let previous=performance.now();
  renderer.setAnimationLoop(()=>{
    const now=performance.now(), dt=Math.min((now-previous)/1000,.05);previous=now;
    current=reducedMotion?target:THREE.MathUtils.damp(current,target,4.3,dt);
    doors.forEach(({hinge,side})=>{hinge.rotation.y=side*current*Math.PI*.61;});
    const illumination=lightOn?(.18+current*.82):0;
    lamps.forEach(l=>{l.intensity=illumination*1.6;});glow.emissiveIntensity=illumination*3;
    controls.update();renderer.render(scene,camera);
  });
  await renderer.compileAsync(scene,camera);
  $('loading').remove();button.disabled=false;slider.disabled=false;
}
main().catch(error=>{console.error(error);$('loading').textContent='无法启动 3D 场景。请在支持 WebGPU 或 WebGL2 的浏览器中，通过 localhost 打开。';$('engine').textContent='3D UNAVAILABLE';});
