// Quiet, procedural foley. No downloads or sound until a deliberate interaction.
export function createCellarAudio(){
  let context,master,noiseBuffer;
  let muted=false;
  const voices=new Set();
  try{muted=localStorage.getItem('cellar-muted')==='true';}catch{}
  const supported=Boolean(window.AudioContext||window.webkitAudioContext);
  function stop(){
    for(const source of voices){try{source.stop();}catch{}}
    voices.clear();
  }
  function unlock(){
    if(!supported||muted||document.hidden)return;
    try{
      if(!context){
        context=new (window.AudioContext||window.webkitAudioContext)();
        master=context.createGain();master.gain.value=.24;master.connect(context.destination);
        noiseBuffer=context.createBuffer(1,context.sampleRate,context.sampleRate);
        const samples=noiseBuffer.getChannelData(0);
        for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
      }
      if(context.state==='suspended')context.resume().catch(()=>{});
    }catch{/* Audio failure must never interrupt the cabinet. */}
  }
  function voice(source,filter,duration,level,delay=0){
    const t=context.currentTime+delay,gain=context.createGain();
    gain.gain.setValueAtTime(0,t);
    gain.gain.linearRampToValueAtTime(level,t+Math.min(.025,duration*.15));
    gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
    source.connect(filter);filter.connect(gain);gain.connect(master);
    voices.add(source);
    source.onended=()=>{voices.delete(source);source.disconnect();filter.disconnect();gain.disconnect();};
    source.start(t);source.stop(t+duration+.02);
  }
  function friction(duration,frequency,level){
    const source=context.createBufferSource(),filter=context.createBiquadFilter();
    source.buffer=noiseBuffer;source.loop=true;
    filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=.8;
    voice(source,filter,duration,level);
  }
  function knock(frequency,duration,level,delay=0){
    const source=context.createOscillator(),filter=context.createBiquadFilter();
    source.type='sine';source.frequency.setValueAtTime(frequency,context.currentTime+delay);
    source.frequency.exponentialRampToValueAtTime(frequency*.78,context.currentTime+delay+duration);
    filter.type='lowpass';filter.frequency.value=1800;
    voice(source,filter,duration,level,delay);
  }
  function play(kind){
    if(muted||document.hidden||context?.state!=='running')return;
    if(kind==='door-open'){
      knock(230,.09,.17);friction(.65,420,.14);knock(155,.28,.035,.05);
    }else if(kind==='door-close'){
      friction(.6,340,.12);
    }else if(kind==='latch'){
      knock(155,.13,.24);knock(390,.065,.07,.015);
    }else if(kind==='rack'){
      friction(.52,650,.10);
    }
  }
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){stop();if(context?.state==='running')context.suspend().catch(()=>{});}
  });
  return {supported,unlock,play,get muted(){return muted;},setMuted(value){
    muted=value;
    try{localStorage.setItem('cellar-muted',String(value));}catch{}
    if(value)stop();else unlock();
  }};
}
