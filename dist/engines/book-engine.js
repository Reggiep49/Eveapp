/* A small, local WebGL paper renderer. No remote engine or runtime dependency. */
class EveBookEngine {
  constructor(canvas, { single = false, reduced = false } = {}) {
    this.canvas = canvas;
    this.single = single;
    this.reduced = reduced;
    this.gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
    this.dead = false;
    this.animation = 0;
    this.cache = new Map();
    this.progress = 0;
    this.direction = 1;
    if (!this.gl) {
      this.ctx=canvas.getContext('2d',{alpha:true});
      this.ready=!!this.ctx;
      if(this.ready){this.observer=new ResizeObserver(()=>this.draw());this.observer.observe(canvas);}
      return;
    }
    const gl = this.gl;
    const vertex = `
      attribute vec3 aPosition;
      attribute vec3 aNormal;
      attribute vec2 aUv;
      uniform vec2 uView;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main(){
        float perspective = 1.0 - aPosition.z * .29;
        gl_Position = vec4(aPosition.x/uView.x, aPosition.y/uView.y, -aPosition.z*.2, perspective);
        vUv = aUv; vNormal = aNormal; vPosition = aPosition;
      }`;
    const fragment = `
      precision mediump float;
      uniform sampler2D uFront;
      uniform sampler2D uBack;
      uniform float uFlipFront;
      uniform float uFlipBack;
      uniform float uShadow;
      uniform float uShadowX;
      uniform float uIsBase;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main(){
        bool front = vNormal.z >= 0.0;
        float flip = front ? uFlipFront : uFlipBack;
        vec2 uv = vec2(mix(vUv.x, 1.0-vUv.x, flip),vUv.y);
        vec4 tex = front ? texture2D(uFront,uv) : texture2D(uBack,uv);
        vec3 normal = normalize(vNormal) * (front ? 1.0 : -1.0);
        float light = .72 + .28 * max(0.0,dot(normal,normalize(vec3(-.3,.45,1.0))));
        float spine = 1.0 - .19*exp(-vUv.x*36.0);
        float shadow = uIsBase * uShadow * exp(-pow((vPosition.x-uShadowX)*5.5,2.0));
        float grain = fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.54)*.015;
        gl_FragColor = vec4(tex.rgb * light * spine * (1.0-shadow) + grain,tex.a);
      }`;
    const shader = (kind, source) => {
      const s = gl.createShader(kind); gl.shaderSource(s,source); gl.compileShader(s);
      if (!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error('Paper shader could not compile.');
      return s;
    };
    try {
      this.program = gl.createProgram();
      gl.attachShader(this.program,shader(gl.VERTEX_SHADER,vertex));
      gl.attachShader(this.program,shader(gl.FRAGMENT_SHADER,fragment));
      gl.linkProgram(this.program);
      if (!gl.getProgramParameter(this.program,gl.LINK_STATUS)) throw new Error('Paper shader could not link.');
      gl.useProgram(this.program);
      this.attrs = ['aPosition','aNormal','aUv'].map(n=>gl.getAttribLocation(this.program,n));
      this.uniform = Object.fromEntries(['uView','uFront','uBack','uFlipFront','uFlipBack','uShadow','uShadowX','uIsBase'].map(n=>[n,gl.getUniformLocation(this.program,n)]));
      this.buffer = gl.createBuffer(); this.indexBuffer = gl.createBuffer();
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0,0,0,0);
      this.observer = new ResizeObserver(()=>this.draw()); this.observer.observe(canvas);
      this.ready=true;
    } catch(error) {
      this.failed = true;
      console.warn('Using the accessible book fallback.');
    }
  }
  async texture(page) {
    const key = `${page.src}|${page.half}|${(page.hidden||[]).map(x=>x.id).join(',')}`;
    if (this.cache.has(key)) return this.cache.get(key);
    const promise = new Promise((resolve,reject)=>{
      const img = new Image();
      img.onload = () => {
        if (this.dead) return resolve(null);
        const paper = document.createElement('canvas'); paper.width=1024; paper.height=1152;
        const c=paper.getContext('2d');
        c.drawImage(img,page.half==='right'?img.width/2:0,0,img.width/2,img.height,0,0,paper.width,paper.height);
        // Parent exclusions are hidden by an opaque enchanted-paper vignette.
        for (const item of page.hidden||[]) {
          const x=(item.x%50)/50*paper.width,y=item.y/100*paper.height;
          const w=item.w/50*paper.width,h=item.h/100*paper.height;
          c.save(); c.translate(x,y); c.scale(w/2,h/2);
          const mist=c.createRadialGradient(0,0,.25,0,0,1.3);
          mist.addColorStop(0,'#32281c');mist.addColorStop(.68,'#32281c');mist.addColorStop(.86,'#32281cf0');mist.addColorStop(1,'#32281c00');
          c.fillStyle=mist;c.fillRect(-1.3,-1.3,2.6,2.6);c.restore();
          // A wrapped present becomes a quiet set prop when a parent removes a toy.
          const bw=w*.64,bh=h*.72,left=x-bw*.5,top=y-bh*.42;
          c.save();c.shadowColor='#0009';c.shadowBlur=25;c.shadowOffsetY=15;
          const wrap=c.createLinearGradient(left,top,left+bw,top+bh);wrap.addColorStop(0,'#963c30');wrap.addColorStop(.45,'#6c241d');wrap.addColorStop(1,'#3e1915');c.fillStyle=wrap;c.fillRect(left,top,bw,bh);c.shadowBlur=0;c.shadowOffsetY=0;
          c.fillStyle='#d1a451';c.fillRect(x-bw*.06,top,bw*.12,bh);c.fillRect(left,top+bh*.36,bw,bh*.11);
          c.fillStyle='#9b4831';c.fillRect(left-7,top-9,bw+14,23);c.fillStyle='#e1bb6b';c.fillRect(x-bw*.065,top-9,bw*.13,23);
          c.strokeStyle='#e8bf6f';c.lineWidth=6;c.beginPath();c.ellipse(x-bw*.12,top-18,bw*.15,18,.4,0,Math.PI*2);c.ellipse(x+bw*.12,top-18,bw*.15,18,-.4,0,Math.PI*2);c.stroke();
          c.fillStyle='#f0d89a';c.textAlign='center';c.font='30px Georgia';c.fillText('✦',x,top+bh*.73);c.restore();
        }
        if(this.ctx){resolve(paper);return;}
        const gl=this.gl,tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,paper);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
        resolve(tex);
      };
      img.onerror=()=>reject(new Error('Book artwork could not load.')); img.src=page.src;
    });
    this.cache.set(key,promise);return promise;
  }
  async setPages(pages) {
    if(!this.ready||this.failed)return false;
    try {this.current=await Promise.all(pages.map(p=>this.texture(p)));if(this.dead)return false;this.progress=0;this.target=null;this.draw();return true;}
    catch {this.failed=true;return false;}
  }
  async prepare(direction,pages) {
    this.direction=direction;
    this.target=await Promise.all(pages.map(p=>this.texture(p)));
    this.progress=0;this.draw();
  }
  setProgress(p) {this.progress=Math.max(0,Math.min(1,p));this.draw();}
  mesh(sign, progress, base=false) {
    const nx=base?20:(this.ctx?24:52),ny=base?5:(this.ctx?6:20),vertices=[],indices=[];
    const h=1.124,theta=Math.PI*progress,bend=Math.sin(theta);
    const hinge=this.single ? -sign*.5 : 0;
    for(let j=0;j<=ny;j++) {
      const v=j/ny;let x=0,z=base?0:.009;
      for(let i=0;i<=nx;i++) {
        const u=i/nx;
        const a=base?0:theta+bend*(1.65*(u-.5)+.25*(v-.5));
        if(i>0){x+=Math.cos(a)/nx;z+=Math.sin(a)/nx;}
        const arch=base?Math.sin(u*Math.PI)*.018:0;
        vertices.push(hinge+sign*x,(v-.5)*h+bend*Math.sin(u*Math.PI)*.035*(v-.5),z+arch,-sign*Math.sin(a),0,Math.cos(a),u,v);
      }
    }
    for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+nx+1;indices.push(a,a+1,b,a+1,b+1,b);}
    return {vertices:new Float32Array(vertices),indices:new Uint16Array(indices)};
  }
  drawPage(sign,p,front,back,base,flipFront,flipBack) {
    if(this.ctx){this.drawCanvasPage(sign,p,front,back,base,flipFront,flipBack);return;}
    const gl=this.gl;if(!front)return;
    const mesh=this.mesh(sign,p,base);
    gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,mesh.vertices,gl.DYNAMIC_DRAW);
    this.attrs.forEach((a,i)=>{gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,[3,3,2][i],gl.FLOAT,false,32,[0,12,24][i]);});
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,mesh.indices,gl.DYNAMIC_DRAW);
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,front);gl.uniform1i(this.uniform.uFront,0);
    gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,back||front);gl.uniform1i(this.uniform.uBack,1);
    gl.uniform1f(this.uniform.uFlipFront,flipFront);gl.uniform1f(this.uniform.uFlipBack,flipBack);
    gl.uniform1f(this.uniform.uIsBase,base?1:0);
    gl.drawElements(gl.TRIANGLES,mesh.indices.length,gl.UNSIGNED_SHORT,0);
  }
  draw() {
    if(this.dead||this.failed||!this.ready||!this.current)return;
    const gl=this.gl,c=this.canvas,d=Math.min(devicePixelRatio||1,2);
    const w=Math.max(1,Math.round(c.clientWidth*d)),h=Math.max(1,Math.round(c.clientHeight*d));
    if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
    if(gl){gl.viewport(0,0,w,h);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.program);
    gl.uniform2f(this.uniform.uView,this.single?.57:1.12,this.single?.64:.72);}else this.ctx.clearRect(0,0,w,h);
    const p=this.progress,dir=this.direction,active=this.target&&p>0;
    if(gl){gl.uniform1f(this.uniform.uShadow,active?Math.sin(p*Math.PI)*.48:0);
    gl.uniform1f(this.uniform.uShadowX,dir*Math.cos(p*Math.PI)*.37);}
    if(this.single){
      const base=active?this.target[0]:this.current[0];
      this.drawPage(1,0,base,base,true,0,0);
      if(active)this.drawPage(dir,p,this.current[0],this.target[0],false,dir<0?1:0,dir<0?0:1);
    } else {
      this.drawPage(-1,0,active&&dir<0?this.target[0]:this.current[0],null,true,1,0);
      this.drawPage(1,0,active&&dir>0?this.target[1]:this.current[1],null,true,0,0);
      if(active)this.drawPage(dir,p,dir>0?this.current[1]:this.current[0],dir>0?this.target[0]:this.target[1],false,dir>0?0:1,dir>0?1:0);
    }
  }
  drawCanvasPage(sign,p,front,back,base,flipFront,flipBack){
    if(!front)return;
    const ctx=this.ctx,w=this.canvas.width,h=this.canvas.height,vx=this.single?.57:1.12,vy=this.single?.64:.72;
    if(base){
      const left=this.single?-.5:(sign<0?-1:0),x=(left/vx+1)*w/2,y=(1-.562/vy)*h/2,pw=w/(2*vx),ph=.562/vy*h;
      ctx.drawImage(front,x,y,pw,ph);
      const shadow=ctx.createLinearGradient(sign<0?x+pw:x,y,sign<0?x+pw-30:x+30,y);shadow.addColorStop(0,'#1b10085c');shadow.addColorStop(1,'#1b100800');ctx.fillStyle=shadow;ctx.fillRect(x,y,pw,ph);
      if(this.target&&this.progress>0){const sx=(this.direction*Math.cos(this.progress*Math.PI)*.37/vx+1)*w/2;const g=ctx.createRadialGradient(sx,y+ph/2,1,sx,y+ph/2,pw*.65);g.addColorStop(0,`rgba(8,5,2,${Math.sin(this.progress*Math.PI)*.35})`);g.addColorStop(1,'#0000');ctx.fillStyle=g;ctx.fillRect(x,y,pw,ph);}
      return;
    }
    const mesh=this.mesh(sign,p,false),vertices=mesh.vertices,triangles=[];
    for(let i=0;i<mesh.indices.length;i+=3){
      const ids=Array.from(mesh.indices.slice(i,i+3)),normal=ids.reduce((n,id)=>n+vertices[id*8+5],0)/3,isFront=normal>=0,tex=isFront?front:(back||front),flip=isFront?flipFront:flipBack;
      const points=ids.map(id=>{const n=id*8,z=vertices[n+2],perspective=1-z*.29;return{x:(vertices[n]/vx/perspective+1)*w/2,y:(1-vertices[n+1]/vy/perspective)*h/2,z,u:(flip?1-vertices[n+6]:vertices[n+6])*tex.width,v:(1-vertices[n+7])*tex.height};});
      triangles.push({points,tex,depth:points.reduce((n,t)=>n+t.z,0),shade:.06+.25*(1-Math.abs(normal))});
    }
    triangles.sort((a,b)=>a.depth-b.depth);
    for(const {points,tex,shade} of triangles){
      const [a,b,c]=points,du1=b.u-a.u,dv1=b.v-a.v,du2=c.u-a.u,dv2=c.v-a.v,den=du1*dv2-du2*dv1;if(Math.abs(den)<.001)continue;
      const A=((b.x-a.x)*dv2-(c.x-a.x)*dv1)/den,B=((b.y-a.y)*dv2-(c.y-a.y)*dv1)/den,C=((c.x-a.x)*du1-(b.x-a.x)*du2)/den,D=((c.y-a.y)*du1-(b.y-a.y)*du2)/den;
      const mx=(a.x+b.x+c.x)/3,my=(a.y+b.y+c.y)/3;
      ctx.save();ctx.beginPath();points.forEach((q,i)=>{const dx=q.x-mx,dy=q.y-my,length=Math.hypot(dx,dy)||1;const x=q.x+dx/length*.6,y=q.y+dy/length*.6;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.closePath();ctx.clip();
      ctx.setTransform(A,B,C,D,a.x-A*a.u-C*a.v,a.y-B*a.u-D*a.v);ctx.drawImage(tex,0,0);ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=`rgba(25,13,3,${shade})`;ctx.fill();ctx.restore();
    }
  }
  animate(to,onFinish) {
    cancelAnimationFrame(this.animation);
    const from=this.progress,start=performance.now(),duration=this.reduced?1:Math.max(340,1100*Math.abs(to-from));
    const frame=now=>{if(this.dead)return;const t=Math.min(1,(now-start)/duration);const e=1-Math.pow(1-t,3);this.setProgress(from+(to-from)*e);if(t<1)this.animation=requestAnimationFrame(frame);else onFinish?.();};
    this.animation=requestAnimationFrame(frame);
  }
  destroy(){this.dead=true;cancelAnimationFrame(this.animation);this.observer?.disconnect();if(this.gl){this.gl.deleteBuffer(this.buffer);this.gl.deleteBuffer(this.indexBuffer);this.gl.deleteProgram(this.program);for(const t of this.cache.values())t.then(tex=>tex&&this.gl.deleteTexture(tex));}}
}
