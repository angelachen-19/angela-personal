import * as THREE from 'three/webgpu';

// Original geometry based on the four matching bottles in the supplied reference.
export function createArtistBottle(index, { box, mesh, cork }, parent) {
  const bottle = new THREE.Group(); bottle.position.y = .028; parent.add(bottle);
  const glass = (color, transmission = .45, roughness = .12) => new THREE.MeshPhysicalMaterial({
    color, metalness: 0, roughness, transmission, thickness: .022,
    ior: 1.48, clearcoat: 1, clearcoatRoughness: .065,
    attenuationColor: new THREE.Color(color), attenuationDistance: .34, envMapIntensity: 1.25
  });
  const amber = glass(0x984515, .62);
  const ruby = glass(0x54110c, .27);
  const blackMetal = new THREE.MeshStandardMaterial({color:0x292621, metalness:.72, roughness:.29});
  const wine = new THREE.MeshPhysicalMaterial({color:0x380907, roughness:.14, metalness:0, clearcoat:1});
  const add = (geometry, material, x=0, y=0, z=0) => mesh(geometry,material,bottle,x,y,z);
  function stopper(center, tangent=new THREE.Vector3(0,1,0), radius=.026) {
    const neck = new THREE.Group(); neck.position.copy(center);
    neck.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),tangent.clone().normalize());
    bottle.add(neck);
    mesh(new THREE.CylinderGeometry(radius*1.18,radius*1.18,.019,32),amber,neck,0,-.007,0);
    mesh(new THREE.CylinderGeometry(radius*.94,radius,.041,28),cork,neck,0,.016,0);
    mesh(new THREE.TorusGeometry(radius*1.15,.003,8,32),blackMetal,neck,0,-.005,0).rotation.x=Math.PI/2;
  }
  function sweptGeometry(curve, radii, segments=100, sides=40) {
    const frames=curve.computeFrenetFrames(segments,false), positions=[], uv=[], triangles=[];
    const radiusAt=t=>{
      for(let i=1;i<radii.length;i++)if(t<=radii[i][0]){
        const a=radii[i-1],b=radii[i],f=(t-a[0])/(b[0]-a[0]);
        return THREE.MathUtils.lerp(a[1],b[1],f*f*(3-2*f));
      }
      return radii[radii.length-1][1];
    };
    for(let i=0;i<=segments;i++){
      const t=i/segments,p=curve.getPointAt(t),radius=radiusAt(t);
      for(let j=0;j<=sides;j++){
        const a=j/sides*Math.PI*2;
        const v=p.clone().addScaledVector(frames.normals[i],Math.cos(a)*radius).addScaledVector(frames.binormals[i],Math.sin(a)*radius);
        positions.push(v.x,v.y,v.z);uv.push(j/sides,t);
        if(i<segments&&j<sides){const k=i*(sides+1)+j;triangles.push(k,k+sides+1,k+1,k+1,k+sides+1,k+sides+2);}
      }
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(triangles);g.computeVertexNormals();return g;
  }
  function streakTexture(){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=1024;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#431910';ctx.fillRect(0,0,512,1024);
    const colors=['#c66b1d','#541009','#171c22','#983015','#df8938','#351114','#3c4b55'];
    for(let i=0;i<29;i++){
      const x=i*20-30;ctx.beginPath();
      for(let y=0;y<=1024;y+=8){const xx=x+Math.sin(y*.011+i*.12)*37+Math.sin(y*.021)*12;if(y===0)ctx.moveTo(xx,y);else ctx.lineTo(xx,y);}
      ctx.strokeStyle=colors[i%colors.length];ctx.lineWidth=7+(i%4)*3;ctx.stroke();
    }
    const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=THREE.RepeatWrapping;t.anisotropy=4;return t;
  }

  if(index===0){
    // Dalí: amber bottle body melts into a puddle, neck bends over under gravity.
    const path=new THREE.CatmullRomCurve3([
      new THREE.Vector3(-.043,.035,0),new THREE.Vector3(-.040,.15,0),new THREE.Vector3(-.045,.30,0),
      new THREE.Vector3(-.025,.395,0),new THREE.Vector3(.01,.48,0),new THREE.Vector3(.047,.574,0),
      new THREE.Vector3(.098,.582,0),new THREE.Vector3(.12,.535,0),new THREE.Vector3(.148,.48,0)
    ],false,'centripetal');
    add(sweptGeometry(path,[[0,.057],[.12,.078],[.35,.085],[.49,.06],[.60,.032],[.86,.025],[1,.027]]),amber);
    const liquid=add(new THREE.SphereGeometry(1,40,32),wine,-.044,.185,.003);liquid.scale.set(.062,.16,.06);
    const puddleGeo=new THREE.SphereGeometry(1,64,20);
    const pos=puddleGeo.attributes.position;
    for(let i=0;i<pos.count;i++){
      const a=Math.atan2(pos.getZ(i),pos.getX(i));const r=1+.13*Math.sin(a*5)+.07*Math.sin(a*9+.6);
      pos.setXYZ(i,pos.getX(i)*r*.148,pos.getY(i)*.022,pos.getZ(i)*r*.10);
    }puddleGeo.computeVertexNormals();add(puddleGeo,amber,-.022,.025,0);
    const dripPath=new THREE.CatmullRomCurve3([new THREE.Vector3(.026,.325,.023),new THREE.Vector3(.052,.245,.037),new THREE.Vector3(.047,.195,.035)]);
    add(new THREE.TubeGeometry(dripPath,30,.009,12,false),amber);
    const drip=add(new THREE.SphereGeometry(.012,20,12),amber,.047,.193,.035);drip.scale.y=1.55;
    stopper(path.getPointAt(1),path.getTangentAt(1),.025);
  }else if(index===1){
    // Munch: a continuous S-shaped glass bottle with hot, flowing color streaks.
    const profile=[[0,0],[.061,0],[.077,.012],[.080,.07],[.083,.17],[.079,.27],[.071,.38],[.051,.455],[.028,.495],[.026,.575],[.030,.592]].map(p=>new THREE.Vector2(...p));
    const geometry=new THREE.LatheGeometry(profile,64);
    const pos=geometry.attributes.position;
    function wave(y){return Math.sin(y*21)*.037*Math.sin(Math.min(1,y/.592)*Math.PI*.95);}
    for(let i=0;i<pos.count;i++){
      const y=pos.getY(i),x=pos.getX(i),z=pos.getZ(i),angle=y*1.6;
      const bend=1+.06*Math.sin(y*29);
      pos.setXYZ(i,(x*Math.cos(angle)-z*Math.sin(angle))*bend+wave(y),y,x*Math.sin(angle)+z*Math.cos(angle));
    }geometry.computeVertexNormals();
    const flow=glass(0xc68947,.32,.1);flow.map=streakTexture();
    add(geometry,flow);
    stopper(new THREE.Vector3(wave(.592),.598,0),new THREE.Vector3(.19,1,0));
  }else if(index===2){
    // Picasso: irregular triangular stained-glass facets, not a figurative sculpture.
    const sides=7;
    const rings=[
      {y:0,r:.075,x:0,z:0,twist:0},{y:.10,r:.086,x:-.013,z:0,twist:.14},
      {y:.235,r:.105,x:.019,z:0,twist:-.10},{y:.355,r:.10,x:-.024,z:0,twist:.13},
      {y:.46,r:.075,x:-.009,z:0,twist:.02},{y:.503,r:.027,x:0,z:0,twist:0}
    ];
    const panels=[glass(0x70221b,.42),glass(0xbaa084,.56),glass(0x39423d,.58),glass(0x8a483b,.45),glass(0x511013,.29),glass(0xa29883,.5)];
    const vertices=[];let face=0;
    function point(r,j){const a=j/sides*Math.PI*2+r.twist;return[r.x+Math.cos(a)*r.r,r.y,r.z+Math.sin(a)*r.r];}
    const geometry=new THREE.BufferGeometry();
    for(let row=0;row<rings.length-1;row++)for(let j=0;j<sides;j++){
      const a=point(rings[row],j),b=point(rings[row],j+1),c=point(rings[row+1],j),d=point(rings[row+1],j+1);
      for(const tri of [[a,c,b],[b,c,d]]){vertices.push(...tri.flat());geometry.addGroup(face*3,3,(j+row*3+face%2)%panels.length);face++;}
    }
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();
    add(geometry,panels);
    const seams=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,12),new THREE.LineBasicMaterial({color:0x665449,transparent:true,opacity:.85}));bottle.add(seams);
    add(new THREE.CylinderGeometry(.027,.027,.087,28),ruby,0,.545,0);
    stopper(new THREE.Vector3(0,.592,0));
  }else{
    // Mondrian: a rectangular bottle with a real shoulder, neck and leaded glass panes.
    const colored={red:glass(0xb92216,.28,.18),blue:glass(0x17417e,.36,.17),yellow:glass(0xdfaa19,.36,.18),white:glass(0xd2c5a3,.65,.21)};
    box(.204,.427,.148,glass(0x6c5841,.65,.14),bottle,0,.228,0,.004);
    for(const x of [-.106,.106])for(const z of [-.078,.078])box(.010,.436,.010,blackMetal,bottle,x,.228,z,.001);
    for(const y of [.013,.447]){
      for(const z of [-.080,.080])box(.218,.010,.012,blackMetal,bottle,0,y,z,.001);
      for(const x of [-.105,.105])box(.012,.010,.168,blackMetal,bottle,x,y,0,.001);
    }
    const panes=[
      [-.047,.348,.104,.183,'red'],[.059,.357,.080,.166,'white'],
      [-.047,.19,.104,.117,'white'],[.059,.215,.080,.104,'yellow'],
      [-.047,.075,.104,.096,'blue'],[.059,.081,.080,.118,'white']
    ];
    for(const z of [-.082,.082]){
      for(const [x,y,w,h,color] of panes){
        box(w+.009,h+.010,.009,blackMetal,bottle,x,y,z,.001);
        box(w,h,.007,colored[color],bottle,x,y,z+Math.sign(z)*.005,.001);
      }
    }
    box(.195,.008,.015,blackMetal,bottle,0,.14,.09,.001);
    const shoulder=add(new THREE.CylinderGeometry(.043,.132,.047,4),colored.white,0,.475,0);shoulder.rotation.y=Math.PI/4;shoulder.scale.z=.74;
    box(.060,.110,.052,blackMetal,bottle,0,.552,0,.001);
    for(const z of [-.028,.028]){
      box(.041,.040,.006,colored.red,bottle,0,.579,z,.001);
      box(.041,.045,.006,colored.yellow,bottle,0,.530,z,.001);
    }
    stopper(new THREE.Vector3(0,.611,0),new THREE.Vector3(0,1,0),.024);
  }
  bottle.userData.referenceArtist=['Dalí','Munch','Picasso','Mondrian'][index];
  return bottle;
}
