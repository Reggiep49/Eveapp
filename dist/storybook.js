/* The children's world. Parent checkout and local data retain their original contracts. */
const realms = [
  {id:'workshop',title:'The Midnight Toymakers',line:'Follow the lanterns. Every little invention has a story.',color:'#e6ac49',toys:[
    {id:'tiles',x:13.7,y:23.8,w:19.3,h:33.8},{id:'train',x:35.3,y:45.1,w:24.8,h:18.7},{id:'truck',x:24.6,y:75.5,w:33.7,h:32.9},
    {id:'robot',x:65.1,y:28.9,w:13.2,h:28.2},{id:'dinosaur',x:88,y:38.1,w:23.1,h:26},{id:'fireengine',x:76,y:71.4,w:30.3,h:32.9}]},
  {id:'cozy',title:'The House of Little Wonders',line:'A fireside full of things to make, play, and love.',color:'#f0bd7f',toys:[
    {id:'bunny',x:14.1,y:27.4,w:16.6,h:30.5},{id:'art',x:36.8,y:37.7,w:16.7,h:22.4},{id:'dollhouse',x:22.5,y:66.5,w:27.8,h:42.9},
    {id:'bear',x:66.1,y:29.5,w:14.4,h:26.1},{id:'ukulele',x:86.2,y:36.3,w:12.3,h:39.9},{id:'craft',x:74.1,y:69.1,w:24.4,h:35.5}]},
  {id:'observatory',title:'Beyond the Northern Lights',line:'For the part of you that wants to discover everything.',color:'#83dfe1',toys:[
    {id:'telescope',x:15.9,y:30.2,w:18.5,h:36.1},{id:'rocket',x:36.2,y:39.7,w:9.7,h:32.7},{id:'globe',x:22,y:68.5,w:14.8,h:38.2},
    {id:'solar',x:67.9,y:30.8,w:22.5,h:30.5},{id:'microscope',x:88.3,y:42.2,w:11.4,h:32.4},{id:'astronaut',x:73.1,y:67.6,w:15.1,h:31.8}]}
];
const extraGifts = [
  ['robot','target','Pip’s Wind-Up Robot','Build & Play','5+',34.99,'A little friend with big ideas.','Turn the key, set Pip down, and send him on a mission through your make-believe workshop.','Wind-up robot and a story card','What important mission will you give Pip first?'],
  ['dinosaur','target','Roaming Rex Dinosaur','Build & Play','4+',27.99,'A roar from a world before ours.','Meet a friendly poseable dinosaur. Move his arms, tail, and jaw, then turn the room into your very own prehistoric jungle.','Poseable dinosaur and a discovery booklet','Can you make a jungle out of the things in your room?'],
  ['fireengine','target','Firehouse Rescue Truck','Build & Play','4+',36.99,'Big adventures. A very brave crew.','Raise the ladder, roll out the hoses, and make up a rescue story with this bright red fire engine.','Toy fire engine with movable ladder','Who needs a helping hand in your imaginary town?'],
  ['dollhouse','lego','Little Lantern Dollhouse','Cozy & Creative','5+',69.99,'A tiny home for enormous stories.','Arrange the little rooms, move the furniture, and invent a family of characters who live in your very own wooden house.','Wooden house and 12 miniature furnishings','Which room will become the secret headquarters?'],
  ['bear','target','Hearthside Teddy Bear','Cozy & Creative','3+',22.99,'The best listener in the whole house.','A soft brown bear with a gentle smile. Just the friend for a bedtime story, a pretend picnic, or a very important cuddle.','One 14-inch plush teddy bear','Tell your bear about your favorite part of today.'],
  ['ukulele','books','My First Little Ukulele','Cozy & Creative','6+',32.99,'Your first song is waiting for you.','A small wooden ukulele with four gentle strings. Strum, explore different sounds, and start making music with a grown-up.','Child-size ukulele, pick, and beginner song cards','Can you invent a tune for a reindeer parade?'],
  ['craft','books','Make a Little Magic Craft Box','Cozy & Creative','6+',26.99,'A box of almost-anything.','Turn colorful felt, yarn, and ribbons into little creatures and holiday keepsakes. Ask a grown-up to help with the tools.','Felt, yarn, safety scissors, and idea cards','Make a tiny creature no one has ever seen before.'],
  ['rocket','lego','Moonbound Rocket Explorer','Discover','6+',42.99,'Next stop: your imagination.','Build your own red-and-white rocket, imagine the countdown, and take a crew of toy astronauts on a brand-new mission.','Rocket model, stand, and mission cards','What would you pack for a trip to the Moon?'],
  ['globe','books','Little World Explorer Globe','Discover','6+',34.99,'A whole world of somewhere-new.','Spin a blue-and-gold globe and discover oceans, continents, and faraway places. Follow a pretend journey around the world.','Desk globe and exploration cards','Find a place you’d love to visit with your family.'],
  ['solar','books','My Little Solar System','Discover','7+',39.99,'A universe on your tabletop.','Explore the planets on a beautiful little model of our solar system. Spin the arms and imagine their great journeys around the Sun.','Solar system model and planet guide','Which planet would have the most surprising weather?'],
  ['microscope','books','Tiny Worlds Microscope','Discover','7+',49.99,'The smallest things have big secrets.','Look closely at leaves and other prepared samples with a grown-up. A tiny world of shapes and patterns is waiting.','Starter microscope, slides, and discovery guide','What does a leaf look like up very, very close?'],
  ['astronaut','target','Cosmo the Astronaut','Discover','3+',24.99,'A soft friend for faraway adventures.','Meet Cosmo, a cuddly astronaut ready for moonwalks across the living room and sleepy trips to the stars.','One 12-inch astronaut plush','What will you and Cosmo name your spaceship?']
].map(([id,store,name,category,age,price,short,detail,inside,play])=>({id,store,name,category,age,price,short,detail,inside,play}));
for(const gift of extraGifts){const realm=realms.find(r=>r.toys.some(t=>t.id===gift.id));gift.thumb={...realm.toys.find(t=>t.id===gift.id),src:`assets/realm-${realm.id}.png`};gifts.push(gift);}

function sceneThumbnail(gift) {
  const t=gift.thumb,crop=Math.max(t.w,t.h/1.777)*1.08;
  return `<span class="catalog-thumb"><img src="${t.src}" alt="" style="width:${10000/crop}%;left:${50-t.x/crop*100}%;top:${50-t.y/(crop*1.777)*100}%"></span>`;
}

let physicalBook=null,bookGesture=null,bookAbort=null,flight=null,turnSerial=0;
const eveBaseRender=render,baseClearSend=clearSendTimers;
chapters = function(){
  const ids=curated().map(g=>g.id);
  return realms.flatMap(r=>{
    if(!r.toys.some(t=>ids.includes(t.id)))return [];
    return smallScreen.matches?['left','right'].map(leaf=>({...r,leaf,toys:r.toys.filter(t=>(t.x<50)===(leaf==='left'))})).filter(r=>r.toys.some(t=>ids.includes(t.id))):[{...r,leaf:null}];
  });
};
function pageTextures(chapter){
  const ids=curated().map(g=>g.id);
  return (chapter.leaf?[chapter.leaf]:['left','right']).map(half=>({src:`assets/realm-${chapter.id}.png`,half,hidden:chapter.toys.filter(t=>(t.x<50)===(half==='left')&&!ids.includes(t.id))}));
}

bookView = function(){
  const all=chapters();if(!all.length)return `<div class="empty-state child-empty"><h1 tabindex="-1">A story is being made.</h1><p>A grown-up can add discoveries to your book.</p>${uiButton('parent-gate','Ask a grown-up','lock','gold')}</div>`;
  bookIndex=Math.min(bookIndex,all.length-1);
  const ch=all[bookIndex],allowed=curated().map(g=>g.id),toys=ch.toys.filter(t=>allowed.includes(t.id));
  return `<section class="enchanted-library" style="--realm-glow:${ch.color}">
    <div class="library-atmosphere" aria-hidden="true"><img src="assets/realm-${ch.id}.png" alt=""><div class="library-vignette"></div></div>
    <header class="realm-heading"><span class="eyebrow">${ch.leaf?'PAGE':'CHAPTER'} ${String(bookIndex+1).padStart(2,'0')} <i>✦</i> ${plural(toys.length,'discovery')}</span><h1 tabindex="-1">${ch.title}</h1><p>${ch.line}</p></header>
    <div class="book-table ${ch.leaf?'portrait-book':''}" id="book-table">
      <div class="desk-shadow"></div><div class="book-cover-base"></div><div class="gilded-page-stack"><i></i><i></i><i></i></div>
      <div class="folio-volume" id="folio-volume">
        <div class="page-fallback ${ch.leaf?'one-page':''}" data-leaf="${ch.leaf||'both'}"><img src="assets/realm-${ch.id}.png" alt="${ch.title}, with ${toys.length} toys to discover">${ch.toys.filter(t=>!allowed.includes(t.id)).map(t=>`<span class="fallback-secret" style="left:${ch.leaf?(t.x%50)*2:t.x}%;top:${t.y}%;width:${ch.leaf?t.w*2:t.w}%;height:${t.h}%">A little mystery…</span>`).join('')}</div>
        <canvas id="paper-engine" class="paper-engine" aria-label="A three-dimensional storybook. Drag a page toward the spine to turn it."></canvas>
        <div class="book-spine" aria-hidden="true"></div>
        <div class="discovery-layer">${toys.map((t,i)=>{const g=findGift(t.id),x=ch.leaf?(t.x%50)*2:t.x;return `<button class="realm-toy ${state.wishes.includes(t.id)?'chosen':''}" data-action="gift" data-id="${t.id}" style="--x:${x}%;--y:${t.y}%;--w:${ch.leaf?t.w*2:t.w}%;--h:${t.h}%;--delay:${i*.37}s" aria-label="Explore ${g.name}"><span class="discovery-ring">${icon(state.wishes.includes(t.id)?'heart':'plus',16)}</span><span class="discovery-name">${g.name}</span><i class="toy-spark spark-one"></i><i class="toy-spark spark-two"></i></button>`;}).join('')}</div>
        <div class="paper-corner left" aria-hidden="true"></div><div class="paper-corner right" aria-hidden="true"></div>
      </div><span class="book-ribbon" aria-hidden="true">✦</span>
    </div>
    <footer class="reader-controls"><button class="page-nav" data-action="prev-page" aria-label="Previous page" ${bookIndex===0?'disabled':''}>${icon('back',20)}</button><div><span>Drag the edge. Turn the page.</span><small>Touch anything that sparks your imagination.</small></div><div class="reader-dots">${all.map((r,i)=>`<button data-action="book-page" data-index="${i}" aria-label="Page ${i+1}: ${r.title}" ${bookIndex===i?'aria-current="page"':''}></button>`).join('')}</div><button class="page-nav" data-action="${bookIndex===all.length-1?'wishes':'next-page'}" aria-label="${bookIndex===all.length-1?'Open my wishes':'Next page'}">${icon(bookIndex===all.length-1?'heart':'arrow',20)}</button></footer>
    <button class="reader-wishes" data-action="wishes">${icon('heart',15)} ${plural(wished().length,'wish')} kept safe ${icon('arrow',14)}</button>
  </section>`;
};

coverView = function(){return `<section class="storybook-arrival"><div class="arrival-room" aria-hidden="true"></div><div class="arrival-shafts" aria-hidden="true"></div><div class="story-invitation"><span class="eyebrow">THE NORTH POLE HAS A SECRET</span><h1 tabindex="-1">${name()},<br>this story is <em>yours.</em></h1><p>${plural(realms.filter(r=>r.toys.some(t=>curated().some(g=>g.id===t.id))).length,'world')}. ${plural(curated().length,'little wonder')}.<br>And a wish only you can make.</p><button class="story-button" data-action="open-book">Open the book ${icon('arrow',20)}</button><span class="arrival-sound">${icon('sound',14)} A little more magical with sound on</span></div><button class="heirloom-book" data-action="open-book" aria-label="Open ${name()}’s enchanted Christmas book"><span class="heirloom-pages"></span><span class="heirloom-face"><span class="heirloom-ornament">✦</span><small>A NORTH POLE ORIGINAL</small><strong>The Book<br>of Christmas<br><em>Wishes</em></strong><span class="heirloom-constellation">✧ &nbsp; ☾ &nbsp; ✧</span><span class="heirloom-name">Made especially for ${name()}</span><span class="heirloom-year">CHRISTMAS ${new Date().getFullYear()}</span></span></button><span class="arrival-footnote">Every page is a place. Every wish is a beginning.</span></section>`;};

render = function(options={}) {
  turnSerial++;physicalBook?.destroy();physicalBook=null;bookAbort?.abort();bookGesture=null;
  eveBaseRender(options);
  if(page==='catalog') mountPhysicalBook();
};
async function mountPhysicalBook(){
  const canvas=document.getElementById('paper-engine');if(!canvas)return;
  const local=new EveBookEngine(canvas,{single:smallScreen.matches,reduced:reducedMotion.matches});physicalBook=local;
  const loaded=await local.setPages(pageTextures(chapters()[bookIndex]));
  if(physicalBook!==local)return;
  document.getElementById('folio-volume')?.classList.toggle('engine-ready',loaded);
  if(!loaded)document.getElementById('folio-volume')?.classList.add('engine-fallback');
  // Preload the actual page backs so the first turn is as smooth as later ones.
  if(loaded)for(const ch of chapters())for(const tex of pageTextures(ch))local.texture(tex).catch(()=>{});
  mountBookGestures();
}
function mountBookGestures(){
  const host=document.getElementById('folio-volume');if(!host)return;
  bookAbort=new AbortController();const opts={signal:bookAbort.signal};let suppressClick=false;
  host.addEventListener('pointerdown',event=>{
    if(turning||event.button!==0)return;
    const rect=host.getBoundingClientRect();
    bookGesture={x:event.clientX,y:event.clientY,lastX:event.clientX,start:performance.now(),rect,progress:0,active:false,id:event.pointerId,target:null};
  },opts);
  host.addEventListener('pointermove',event=>{
    const g=bookGesture;if(!g)return;
    const dx=event.clientX-g.x,dy=event.clientY-g.y;
    if(!g.active&&Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)*1.25){
      const direction=dx<0?1:-1,target=bookIndex+direction;
      if(target<0||target>=chapters().length){bookGesture=null;return;}
      g.active=true;g.direction=direction;g.target=target;turning=true;suppressClick=true;
      host.setPointerCapture(event.pointerId);host.classList.add('turning');
      if(physicalBook?.ready&&!physicalBook.failed){const engine=physicalBook;engine.prepare(direction,pageTextures(chapters()[target])).then(()=>{if(bookGesture===g&&physicalBook===engine)engine.setProgress(g.progress);});}
      playPaperSound();
    }
    if(g.active){event.preventDefault();g.progress=Math.max(0,Math.min(.98,-dx*g.direction/(g.rect.width*(smallScreen.matches?.9:.58))));physicalBook?.setProgress(g.progress);host.style.setProperty('--turn-progress',g.progress);g.lastX=event.clientX;}
  },opts);
  const release=()=>{
    const g=bookGesture;bookGesture=null;if(!g?.active)return;
    const complete=g.progress>.24;
    const finish=()=>{if(complete){bookIndex=g.target;turning=false;render({focus:true});}else{turning=false;host.classList.remove('turning');}};
    if(physicalBook?.ready&&!physicalBook.failed)physicalBook.animate(complete?1:0,finish);else finish();
    setTimeout(()=>suppressClick=false,80);
  };
  host.addEventListener('pointerup',release,opts);host.addEventListener('pointercancel',()=>{bookGesture=null;turning=false;host.classList.remove('turning');physicalBook?.setProgress(0);},opts);
  host.addEventListener('click',event=>{if(suppressClick){event.preventDefault();event.stopImmediatePropagation();suppressClick=false;}}, {...opts,capture:true});
}
turnPage = async function(index){
  if(turning||index<0||index>=chapters().length||index===bookIndex)return;
  const engine=physicalBook,host=document.getElementById('folio-volume'),serial=turnSerial;
  const direction=index>bookIndex?1:-1;turning=true;host?.classList.add('turning');playPaperSound();
  if(engine?.ready&&!engine.failed){
    try{await engine.prepare(direction,pageTextures(chapters()[index]));if(serial!==turnSerial)return;engine.animate(1,()=>{bookIndex=index;turning=false;render({focus:true});});}
    catch{bookIndex=index;turning=false;render({focus:true});}
  }else{host?.classList.add(direction>0?'fallback-turn-right':'fallback-turn-left');sceneTimer=setTimeout(()=>{bookIndex=index;turning=false;render({focus:true});},reducedMotion.matches?1:700);}
};
function playPaperSound(){
  if(!soundEnabled)return;
  try{audioContext ||=new(window.AudioContext||window.webkitAudioContext)();audioContext.resume();const length=Math.floor(audioContext.sampleRate*.48),buffer=audioContext.createBuffer(1,length,audioContext.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*Math.sin(i/length*Math.PI)*.13;const s=audioContext.createBufferSource(),f=audioContext.createBiquadFilter(),g=audioContext.createGain();s.buffer=buffer;f.type='bandpass';f.frequency.value=1500;f.Q.value=.6;g.gain.value=.24;s.connect(f);f.connect(g);g.connect(audioContext.destination);s.start();}catch{}
}

sendingView = function(){return `<section class="northstar-cinema" id="northstar-cinema" data-act="gather">
  <div class="cinema-worlds" aria-hidden="true"><img class="film-workshop" src="assets/realm-workshop.png" alt=""><img class="film-village" src="assets/village.webp" alt=""><img class="film-sky" src="assets/aurora-sky.png" alt=""></div>
  <div class="cinema-shade"></div><canvas id="northstar-particles" aria-hidden="true"></canvas><div class="aurora-curtain" aria-hidden="true"></div>
  <div class="cinematic-letter" id="cinematic-letter"><div class="letter-radiance"></div><div class="envelope-body"><span class="envelope-address">To Santa</span><small>THE NORTH POLE</small><span class="envelope-from">With love, ${name()}</span><div class="envelope-left"></div><div class="envelope-right"></div><div class="envelope-bottom"></div><div class="envelope-flap"></div><span class="envelope-wax">✦</span></div><div class="letter-wings wing-left"></div><div class="letter-wings wing-right"></div></div>
  <div class="portal-halo" id="portal-halo" aria-hidden="true"><i></i><i></i><i></i></div><div class="cinema-bloom" aria-hidden="true"></div><div class="cinema-letterbox top"></div><div class="cinema-letterbox bottom"></div>
  <div class="cinema-caption"><span class="eyebrow" id="flight-kicker">EVERY WISH BEGINS WITH YOU</span><h1 id="flight-title" tabindex="-1">A little belief.<br>An extraordinary journey.</h1><p id="flight-subtitle">Your ${plural(wished().length,'wish')} are becoming something magical.</p></div>
  <div class="flight-progress" aria-label="Letter’s journey"><i></i><span>YOUR WISHES</span><span>THE NORTH POLE</span></div><button class="cinema-skip" data-action="finish-send">Skip journey ${icon('arrow',14)}</button>
  </section>`;};
playSendSequence = function(){
  baseClearSend();flight?.destroy();
  flight=new NorthstarFlight(document.getElementById('northstar-cinema'),{name:state.name.trim()||'Christmas explorer',wishes:(state.letter?.gifts||[]).map(findGift).filter(Boolean).map(g=>g.name),sound:()=>soundEnabled,reduced:reducedMotion.matches,onDone:()=>go('sent')});
};
clearSendTimers = function(){baseClearSend();flight?.destroy();flight=null;};
sentView = function(){return `<section class="northstar-receipt"><div class="receipt-world" aria-hidden="true"></div><div class="receipt-aurora" aria-hidden="true"></div><div class="constellation-seal"><span>✦</span><i></i><i></i></div><div class="northstar-message"><span class="eyebrow">NORTH POLE · SPECIAL DELIVERY</span><h1 tabindex="-1">${name()}, you made<br>the sky a little <em>brighter.</em></h1><p>Santa has your letter. Every wish. Every word.<br>And a little bit of your magic.</p><span class="santa-signature">“Leave the rest to me.” <small>With love, Santa</small></span><div class="sent-actions">${uiButton('replay-flight','Feel the magic again','spark','ghost')}${uiButton('parent-gate','Back to the family','arrow','gold')}</div><button class="text-link light" data-action="catalog">One more look inside the book ${icon('book',16)}</button></div></section>`;};
document.addEventListener('click',event=>{const action=event.target.closest('[data-action]')?.dataset.action;if(action==='replay-flight')go('sending');if(action==='sound')flight?.soundChanged();});
render();
