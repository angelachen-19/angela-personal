// The same print artwork is used by the 3D bottles and the full-size label proof.
export function createGalleryLabel({ lines, collection, number }) {
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=960;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#e8e2d6';ctx.fillRect(0,0,1024,960);
  let seed=77;
  const random=()=>((seed=seed*16807%2147483647)-1)/2147483646;
  for(let i=0;i<12500;i++){
    ctx.fillStyle=i%2?'rgba(95,79,50,.040)':'rgba(255,255,250,.20)';
    ctx.fillRect(random()*1024,random()*960,1+random()*2,1+random()*2);
  }
  ctx.textBaseline='alphabetic';ctx.textAlign='left';ctx.fillStyle='#262b25';
  ctx.font='normal 330px "Averia Serif Libre", serif';ctx.fillText(String(number).padStart(2,'0'),48,460,328);
  ctx.fillStyle='#898474';ctx.fillRect(414,126,1.5,452);
  ctx.fillStyle='#34392e';ctx.font='500 39px Arial, sans-serif';
  const letterspace=(text,x,y,gap)=>{for(const char of text){ctx.fillText(char,x,y);x+=ctx.measureText(char).width+gap;}};
  letterspace(collection.toUpperCase(),470,205,7);
  ctx.font='normal 86px "Averia Serif Libre", serif';ctx.fillStyle='#242922';
  lines.forEach((line,i)=>ctx.fillText(line,468,326+i*102,494));
  ctx.fillStyle=collection==='build'?'#797957':'#9b633d';ctx.fillRect(846,603,94,94);
  ctx.strokeStyle=collection==='build'?'#676849':'#7d4b2d';ctx.lineWidth=1.5;ctx.strokeRect(846,603,94,94);
  ctx.fillStyle='#4c5043';ctx.font='27px Arial, sans-serif';
  letterspace('LIMITED EDITION',70,799,4);
  ctx.font='37px "Averia Serif Libre", serif';ctx.fillText("angela's cellar",70,859);
  ctx.textAlign='right';ctx.font='30px Arial, sans-serif';ctx.fillText(`${String(number).padStart(2,'0')} / 04`,951,859);
  return canvas;
}

export const galleryCollections=[
  {collection:'build',labels:[['Product','Strategy'],['GTM &','Narrative'],['Founder','Instinct'],['AI','Fluency']]},
  {collection:'back',labels:[['AI Infra'],['Healthcare'],['Creativity'],['Sports']]}
];
