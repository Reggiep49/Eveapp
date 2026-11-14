/* A self-contained cinematic: perspective particles, a letter rig, light, and a local score. */
class NorthstarFlight {
  constructor(root, options) {
    this.root=root;this.options=options;this.canvas=root.querySelector('canvas');this.ctx=this.canvas.getContext('2d');
    this.letter=root.querySelector('#cinematic-letter');this.portal=root.querySelector('#portal-halo');
    this.started=performance.now();this.last=this.started;this.dead=false;this.currentAct='';this.nodes=[];this.scoreStarted=false;
    this.stars=Array.from({length:innerWidth<700?380:850},()=>({x:(Math.random()-.5)*18,y:(Math.random()-.5)*12,z:Math.random()*18+.2,size:Math.random()*1.4+.3,tint:Math.random(),seed:Math.random()*Math.PI*2}));
    this.sparks=Array.from({length:innerWidth<700?350:950},()=>({angle:Math.random()*Math.PI*2,speed:.2+Math.random()*.8,life:.5+Math.random(),seed:Math.random()*10}));
    this.resize=()=>{const d=Math.min(devicePixelRatio||1,1.75);this.w=this.canvas.clientWidth;this.h=this.canvas.clientHeight;this.canvas.width=this.w*d;this.canvas.height=this.h*d;this.ctx.setTransform(d,0,0,d,0,0);this.makeNameConstellation();};
    this.resize();this.observer=new ResizeObserver(this.resize);this.observer.observe(this.canvas);
    this.soundChanged();this.tick=this.tick.bind(this);this.frame=requestAnimationFrame(this.tick);
  }
  makeNameConstellation(){
    const mask=document.createElement('canvas');mask.width=Math.max(1,Math.round(this.w));mask.height=Math.max(1,Math.round(this.h));
    const c=mask.getContext('2d'),size=Math.min(this.w*.14,130);c.textAlign='center';c.font=`italic ${size}px Georgia`;c.fillStyle='#fff';c.fillText(this.options.name,this.w*.5,this.h*.43);
    const data=c.getImageData(0,0,mask.width,mask.height).data;this.nameStars=[];
    for(let y=Math.floor(this.h*.2);y<this.h*.48;y+=6)for(let x=Math.floor(this.w*.1);x<this.w*.9;x+=6){if(data[(y*mask.width+x)*4+3]>100)this.nameStars.push({x,y,seed:Math.random()*6.28});}
  }
  act(key,kicker,title,subtitle){
    if(this.currentAct===key)return;this.currentAct=key;this.root.dataset.act=key;
    this.root.querySelector('#flight-kicker').textContent=kicker;
    this.root.querySelector('#flight-title').innerHTML=title;
    this.root.querySelector('#flight-subtitle').textContent=subtitle;
    this.root.querySelector('.cinema-caption').classList.remove('caption-arrived');void this.root.offsetWidth;this.root.querySelector('.cinema-caption').classList.add('caption-arrived');
  }
  tick(now){
    if(this.dead)return;const t=(now-this.started)/1000,dt=Math.min(.05,(now-this.last)/1000);this.last=now;
    if(this.options.reduced){this.act('quiet','DELIVERED TO THE NORTH POLE','Your wishes have arrived.','Every wish. Every word. Safely with Santa.');this.drawQuiet();if(t>2.5){this.options.onDone();return;}this.frame=requestAnimationFrame(this.tick);return;}
    this.root.style.setProperty('--journey',Math.min(100,t/24*100)+'%');
    let x=.5,y=.43,scale=1,rx=0,ry=0,rz=-5;
    if(t<3.3){this.act('gather','EVERY WISH BEGINS WITH YOU','A little belief.<br>An extraordinary journey.','Your wishes are waking up the magic.');y=.43+Math.sin(t*1.4)*.009;ry=Math.sin(t)*8;}
    else if(t<5.9){this.act('seal','A LETTER LIKE NO OTHER','Sealed with a little magic.','A piece of your imagination, ready to fly.');const q=(t-3.3)/2.6;y=.43-q*.05;scale=1+Math.sin(q*Math.PI)*.07;rz=-5+q*5;}
    else if(t<8.3){this.act('launch','NORTH POLE EXPRESS','Here we go.','Hold on to your wonder.');const q=(t-5.9)/2.4;x=.5+q*.06;y=.38-q*.12;scale=1-q*.83;ry=q*55;rz=q*25;}
    else if(t<14.5){this.act('flight','OVER THE ROOFTOPS. BEYOND THE STARS.','Some wishes deserve wings.','You’re flying all the way to the North Pole.');const q=(t-8.3)/6.2;x=.5+Math.sin(q*5)*.1;y=.47+Math.sin(q*7)*.055;scale=.56+Math.sin(q*Math.PI)*.16;ry=Math.sin(q*8)*22;rx=Math.sin(q*5)*13;rz=Math.sin(q*8)*13;}
    else if(t<17.3){this.act('aurora','THROUGH THE NORTHERN LIGHTS','Can you feel it?','There’s Christmas magic everywhere.');const q=(t-14.5)/2.8;x=.5+Math.sin(q*4)*.07;y=.47-q*.15;scale=.62-q*.2;ry=Math.sin(q*8)*26;rz=q*23;}
    else if(t<20.4){this.act('arrival','SANTA’S SLEIGH · ONE SPECIAL DELIVERY','Your wishes found their way.','A little letter. An enormous amount of magic.');const q=Math.min(1,(t-17.3)/2.1);x=.5+q*.25;y=.32-q*.09;scale=.42*(1-q)+.015;ry=q*70;rz=23+q*36;}
    else {this.act('constellation','A NEW STAR OVER THE NORTH POLE','You made the sky a little brighter.','Santa has your letter. And a little bit of you.');scale=0;}
    this.letter.style.transform=`translate(-50%,-50%) perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${scale})`;
    this.letter.style.left=x*100+'%';this.letter.style.top=y*100+'%';
    this.draw(t,dt,x*this.w,y*this.h);
    if (!this.options.reduced && t >= 14.5 && t < 20.4) {
      const names = this.options.wishes || [];
      const offset = (t - 14.5) / 5.9;
      const ctx = this.ctx;
      ctx.save();
      ctx.font = '13px Georgia';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff0b4';
      ctx.globalAlpha = Math.min(1, offset * 5, (1 - offset) * 6);
      ctx.shadowColor = '#ffd677';
      ctx.shadowBlur = 12;
      names.slice(0, 6).forEach((name, i, list) => {
        const angle = -Math.PI + Math.PI * (i + 1) / (list.length + 1);
        const px = this.w * (.5 + .37 * Math.cos(angle));
        const py = this.h * (.53 + .32 * Math.sin(angle));
        ctx.fillText('✦', px, py - 17);
        ctx.fillText(name, px, py, this.w * .25);
      });
      ctx.restore();
    }
    if(t>=24){this.options.onDone();return;}this.frame=requestAnimationFrame(this.tick);
  }
  glow(x,y,r,color,alpha=1){const c=this.ctx;if(r<=0)return;c.save();c.globalAlpha=alpha;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(.15,color);g.addColorStop(1,'rgba(255,209,99,0)');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore();}
  star(x,y,r,alpha,color='#fff2bd'){
    const c=this.ctx;c.globalAlpha=Math.max(0,Math.min(1,alpha));c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
    if(r>1.5){c.lineWidth=.7;c.strokeStyle=color;c.beginPath();c.moveTo(x-r*3,y);c.lineTo(x+r*3,y);c.moveTo(x,y-r*3);c.lineTo(x,y+r*3);c.stroke();}c.globalAlpha=1;
  }
  draw(t,dt,lx,ly){
    const c=this.ctx,w=this.w,h=this.h;c.clearRect(0,0,w,h);c.globalCompositeOperation='lighter';
    const flight=t>7.9&&t<17.3,speed=flight?7:0.3;
    // Camera-space particles travel toward and past the viewer.
    for(const s of this.stars){
      const oldZ=s.z;s.z-=speed*dt;if(s.z<.35)s.z=18;
      const f=Math.min(w,h)*.85/s.z,of=Math.min(w,h)*.85/Math.max(.35,oldZ);
      const drift=flight?Math.sin(t*.55)*w*.065:0;
      const x=w*.5+s.x*f+drift,y=h*.42+s.y*f;
      if(x<-20||x>w+20||y<-20||y>h+20)continue;
      const alpha=Math.min(.8,(18-s.z)/20)*(flight?1:.48);
      if(flight){c.strokeStyle=s.tint>.75?`rgba(134,226,252,${alpha*.7})`:`rgba(255,227,165,${alpha*.65})`;c.lineWidth=Math.max(.4,s.size*(1-s.z/20));c.beginPath();c.moveTo(w*.5+s.x*of+drift,h*.42+s.y*of);c.lineTo(x,y);c.stroke();}
      this.star(x,y,Math.max(.4,s.size*(1-s.z/22)),alpha);
    }
    if(t<6){
      const gather=Math.min(1,t/4.8);
      for(let i=0;i<190;i++){const a=i*2.399+t*(.35+i%3*.08),r=(1-gather)*Math.min(w,h)*.62+45+(i%19)*5;const yy=.68;const x=lx+Math.cos(a)*r,y=ly+Math.sin(a)*r*yy;this.star(x,y,1+(i%4)*.4,.3+gather*.55,i%5?'#ffe3a0':'#b8eaff');}
      this.glow(lx,ly,140+gather*130,'rgba(255,200,86,.13)',gather);
      for(let k=0;k<3;k++){c.strokeStyle=`rgba(255,224,149,${.06+gather*.1})`;c.lineWidth=1;c.beginPath();c.ellipse(lx,ly,90+k*39,45+k*25,t*.2+k,0,Math.PI*2);c.stroke();}
    }
    if(t>5.7&&t<8.8){
      const q=Math.max(0,Math.min(1,(t-5.7)/2.5)),r=50+q*q*Math.max(w,h)*.9;
      this.drawPortal(w*.55,h*.31,r,t,Math.sin(q*Math.PI)*.9);
      this.glow(w*.55,h*.31,250+q*500,'rgba(255,217,129,.18)',Math.sin(q*Math.PI));
    }
    if(t>8&&t<18.8){
      // A curved wake with hundreds of distinct lights, following the letter rig.
      for(let i=0;i<260;i++){const u=i/260,tail=1-u;const x=lx-Math.sin(u*3.5+t*1.2)*w*.16*u;const y=ly+u*h*.65;const spread=(8+u*70);const j=Math.sin(i*9.7+t*8)*spread;this.star(x+j,y+Math.cos(i*3.1)*spread*.25,(1-u)*2.5+.3,tail*.85,i%9?'#ffe1a4':'#9ee5ff');}
      this.glow(lx,ly,85,'rgba(255,224,142,.17)',.7);
      if(t>14.5){const q=(t-14.5)/2.8;this.drawPortal(w*.5,h*.31,130+q*330,t,.28*Math.sin(Math.min(1,q)*Math.PI));}
    }
    if(t>18.8){
      const q=t-18.8,bx=w*.75,by=h*.23;
      for(const s of this.sparks){const r=Math.pow(q,.72)*Math.min(w,h)*.46*s.speed;const drag=Math.exp(-q*.11);const x=bx+Math.cos(s.angle)*r,y=by+Math.sin(s.angle)*r*.72+q*q*6;const alpha=Math.max(0,1-q/(3.7+s.life));this.star(x,y,Math.max(.3,(2.6-q*.3)*s.life),alpha,s.seed>8?'#94ecff':'#ffe29d');if(q<1.4){c.strokeStyle=`rgba(255,217,130,${alpha*.3})`;c.lineWidth=.7;c.beginPath();c.moveTo(bx+Math.cos(s.angle)*r*.8,by+Math.sin(s.angle)*r*.72*.8);c.lineTo(x,y);c.stroke();}}
      if(q<2.7){this.glow(bx,by,Math.min(w,h)*(.35+q*.3),'rgba(255,237,174,.23)',Math.max(0,1-q/2.7));this.drawPortal(bx,by,50+q*280,t,Math.max(0,.7-q*.25));}
    }
    if(t>20.4){
      const q=Math.min(1,(t-20.4)/1.9),ease=1-Math.pow(1-q,3);
      for(const p of this.nameStars){const sx=w*.75+Math.cos(p.seed)*w*.25,sy=h*.23+Math.sin(p.seed)*h*.25;const x=sx+(p.x-sx)*ease,y=sy+(p.y-sy)*ease;this.star(x,y,1.1+Math.sin(p.seed+t*2)*.4,Math.min(1,q*2),p.seed>5.5?'#c2f2ff':'#fff0bd');}
      this.glow(w*.5,h*.37,Math.min(w*.35,330),'rgba(255,220,138,.035)',q);
    }
    c.globalAlpha=1;c.globalCompositeOperation='source-over';
  }
  drawPortal(x,y,r,t,alpha){
    if(alpha<=0)return;const c=this.ctx;c.save();
    for(let ring=0;ring<4;ring++){c.strokeStyle=`rgba(255,222,153,${alpha*(.4-ring*.07)})`;c.lineWidth=ring===0?3:1;c.beginPath();c.ellipse(x,y,r+ring*7,(r+ring*7)*.78,t*.2+ring*.09,0,Math.PI*2);c.stroke();}
    for(let i=0;i<160;i++){const a=i/160*Math.PI*2+t*.5,rr=r+Math.sin(i*8+t*3)*10;this.star(x+Math.cos(a)*rr,y+Math.sin(a)*rr*.78,.6+(i%5)*.38,alpha);}
    c.restore();
  }
  drawQuiet(){this.ctx.clearRect(0,0,this.w,this.h);this.glow(this.w*.5,this.h*.4,180,'rgba(255,227,166,.1)',1);}
  soundChanged(){
    if(!this.options.sound()){if(this.master)this.master.gain.setTargetAtTime(0,this.audio.currentTime,.12);return;}
    if(this.master){this.master.gain.setTargetAtTime(.22,this.audio.currentTime,.25);return;}
    this.startScore();
  }
  startScore(){
    if(this.options.reduced)return;
    try{
      const ac=audioContext ||=new(window.AudioContext||window.webkitAudioContext)();this.audio=ac;ac.resume();
      const master=ac.createGain();master.gain.value=.22;master.connect(ac.destination);this.master=master;
      const reverb=ac.createConvolver(),impulse=ac.createBuffer(2,ac.sampleRate*2,ac.sampleRate);
      for(let ch=0;ch<2;ch++){const d=impulse.getChannelData(ch);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3.5)*.38;}
      reverb.buffer=impulse;const wet=ac.createGain();wet.gain.value=.23;reverb.connect(wet);wet.connect(master);this.nodes.push(master,reverb,wet);
      const offset=(performance.now()-this.started)/1000,base=ac.currentTime-offset;
      const tone=(time,freq,duration,volume,type='sine',pad=false)=>{
        if(time+duration<offset)return;const start=Math.max(ac.currentTime,base+time),o=ac.createOscillator(),g=ac.createGain(),filter=ac.createBiquadFilter();
        o.type=type;o.frequency.value=freq;filter.type='lowpass';filter.frequency.value=pad?1400:7000;
        g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(volume,start+(pad?.7:.012));g.gain.exponentialRampToValueAtTime(.0001,start+duration);
        o.connect(filter);filter.connect(g);g.connect(master);g.connect(reverb);o.start(start);o.stop(start+duration+.05);this.nodes.push(o,g,filter);
      };
      const chords=[[261.63,329.63,392],[220,261.63,329.63],[174.61,220,261.63],[196,246.94,293.66],[261.63,329.63,392],[261.63,392,523.25]];
      chords.forEach((ch,i)=>{const time=i*3.8;ch.forEach(f=>{tone(time,f,5.4,.045,'triangle',true);tone(time,f*.5,5.5,.028,'sine',true);});});
      const notes=[523.25,659.25,783.99,1046.5,783.99,659.25,880,1046.5];
      for(let i=0;i<80;i++){const time=i<18?i*.4:7.2+(i-18)*.19;if(time>20)break;const freq=notes[i%notes.length]*(i>54?2:1);tone(time,freq,1.4,.052);tone(time,freq*2.76,.65,.009);}
      [261.63,392,523.25,659.25,783.99,1046.5].forEach((f,i)=>tone(18.9+i*.055,f,4.5,.075,i<2?'triangle':'sine'));
      for(let i=0;i<18;i++)tone(20+i*.13,1046.5*Math.pow(2,(i%7)/12),1.8,.03);
      // A soft wind rise creates the passage from the workshop into open sky.
      const buffer=ac.createBuffer(1,ac.sampleRate*3,ac.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.08;
      [6,13.7,18.3].forEach(t=>{if(t<offset)return;const n=ac.createBufferSource(),g=ac.createGain(),f=ac.createBiquadFilter();n.buffer=buffer;f.type='lowpass';f.frequency.setValueAtTime(300,base+t);f.frequency.exponentialRampToValueAtTime(4000,base+t+1.5);g.gain.setValueAtTime(0,base+t);g.gain.linearRampToValueAtTime(.35,base+t+1.3);g.gain.linearRampToValueAtTime(0,base+t+2.8);n.connect(f);f.connect(g);g.connect(master);n.start(base+t);this.nodes.push(n,g,f);});
    }catch{}
  }
  destroy(){this.dead=true;cancelAnimationFrame(this.frame);this.observer?.disconnect();for(const n of this.nodes){try{n.stop?.();n.disconnect?.();}catch{}}this.nodes=[];}
}
