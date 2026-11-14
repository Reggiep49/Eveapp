"use strict";

const modelColors = {
  gold:"#ecaa54", red:"#c84341", coral:"#df704f", teal:"#39a89d", timber:"#a47b57",
  blue:"#5272ba", cream:"#f8e0b0", ink:"#232936", black:"#24232d", silver:"#cbd8e6",
  pink:"#d88496", ivory:"#f5e1c3", snow:"#fffff0", orange:"#f29035",
  green:"#59a35d", purple:"#a478ba", yellow:"#f4c651", lilac:"#b9afc9",
};

const castleParts = [
  cuboid(0, -.15, 0, 4.8, .28, 3.3, "timber"),
  cuboid(-1.45, .46, -.4, 1.4, .9, 1.35, "teal"),
  cuboid(-1.45, 1.23, -.4, 1.15, .65, 1.15, "gold"),
  roof(-1.45, 1.56, -.4, 1.32, .84, 1.31, "red"),
  cuboid(1.45, .46, -.4, 1.4, .9, 1.35, "teal"),
  cuboid(1.45, 1.23, -.4, 1.15, .65, 1.15, "gold"),
  roof(1.45, 1.56, -.4, 1.32, .84, 1.31, "red"),
  cuboid(0, .47, -.85, 1.51, .84, .78, "blue"),
  cuboid(0, 1.2, -.85, 1.19, .64, .78, "teal"),
  cuboid(0, 1.78, -.85, .85, .52, .78, "gold"),
  roof(0, 2.04, -.85, 1.05, .76, 1, "red"),
  cuboid(-1.03, .30, .52, .52, .59, .63, "gold"),
  cuboid(1.03, .30, .52, .52, .59, .63, "gold"),
  cuboid(0, .78, .51, 2.44, .32, .63, "teal"),
  cuboid(-.83, 1.05, .51, .34, .25, .61, "gold"),
  cuboid(0, 1.05, .51, .34, .25, .61, "gold"),
  cuboid(.83, 1.05, .51, .34, .25, .61, "gold"),
  cuboid(0, .08, 1.11, .98, .16, 1.05, "red"),
].flat();

function cuboid(x, y, z, width, height, depth, color) {
  const [l,r] = [x-width/2,x+width/2];
  const [a,b] = [y-height/2,y+height/2];
  const [n,f] = [z-depth/2,z+depth/2];
  const points = [[l,a,n],[r,a,n],[r,b,n],[l,b,n],[l,a,f],[r,a,f],[r,b,f],[l,b,f]];
  const polygons = [[0,1,2,3],[5,4,7,6],[4,0,3,7],[1,5,6,2],[3,2,6,7],[4,5,1,0]];
  return makeFaces(points, polygons, color);
}

function roof(x, y, z, width, height, depth, color) {
  const [l,r] = [x-width/2,x+width/2];
  const [n,f] = [z-depth/2,z+depth/2];
  const points = [[l,y,n],[r,y,n],[r,y,f],[l,y,f],[x,y+height,z]];
  return makeFaces(points, [[0,1,4],[1,2,4],[2,3,4],[3,0,4],[3,2,1,0]], color);
}

function makeFaces(points, polygons, color) {
  const pivot = [0,1,2].map((axis) => points.reduce((sum, point) => sum + point[axis], 0) / points.length);
  return polygons.map((polygon) => {
    const vertices = polygon.map((index) => points[index]);
    return { points: vertices, color: modelColors[color], light: surfaceLight(vertices, pivot), curved:points.length > 8 };
  });
}

function roundMesh(center, size, color, type = "ellipsoid", angle = 0, axis = "z") {
  const segments = type === "ellipsoid" ? 18 : 24;
  const ringCount = type === "ellipsoid" ? 13 : 2;
  const points = [];
  const polygons = [];
  for (let ring = 0; ring < ringCount; ring++) {
    const latitude = Math.PI * ring / (ringCount - 1);
    const radius = type === "ellipsoid" ? Math.sin(latitude) : 1;
    const y = type === "ellipsoid" ? -Math.cos(latitude) : ring * 2 - 1;
    for (let i = 0; i < segments; i++) {
      const theta = i * 2 * Math.PI / segments;
      points.push(placePoint([Math.cos(theta)*size[0]*radius, y*size[1], Math.sin(theta)*size[2]*radius], center, angle, axis));
      if (ring > 0) {
        const next = (i + 1) % segments;
        polygons.push([(ring-1)*segments+i, (ring-1)*segments+next, ring*segments+next, ring*segments+i]);
      }
    }
  }
  if (type === "cylinder") {
    polygons.push(Array.from({length:segments}, (_, i) => segments - i - 1));
    polygons.push(Array.from({length:segments}, (_, i) => segments + i));
  }
  return makeFaces(points, polygons, color);
}

function placePoint([x,y,z], [cx,cy,cz], angle, axis) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return axis === "x" ? [cx+x, cy+y*c-z*s, cz+y*s+z*c] : [cx+x*c-y*s, cy+x*s+y*c, cz+z];
}

const oval = (x,y,z,rx,ry,rz,color,angle=0) => roundMesh([x,y,z], [rx,ry,rz], color, "ellipsoid", angle);
const tube = (x,y,z,r,h,color,angle=0,axis="z") => roundMesh([x,y,z], [r,h/2,r], color, "cylinder", angle, axis);
const bore = (x,y,z,r,depth,angle=0) => tube(x,y,z,r,depth,"ink",angle);
const box = cuboid;

function wheels(xPositions, z, y, radius) {
  return xPositions.flatMap((x) => [-1,1].flatMap((side) => [
    tube(x, y, side*z, radius, .29, "black", Math.PI/2, "x"),
    tube(x, y, side*(z+.155), radius*.45, .04, "silver", Math.PI/2, "x"),
  ])).flat();
}

const toyModels = {
  tiles: { faces:castleParts, aim:.83, view:-.53, size:4.9 },
  train: { aim:.76, view:-.47, size:5.65, faces:[
    box(-.2,.42,0,4.75,.15,.83,"timber"),
    box(-1.25,.62,0,1.57,.24,.91,"red"),
    tube(-1.57,1.02,0,.39,1.13,"red",Math.PI/2),
    tube(-2.12,1.02,0,.27,.06,"cream",Math.PI/2),
    tube(-1.82,1.46,0,.15,.43,"black"),
    tube(-1.82,1.67,0,.21,.10,"cream"),
    box(-.82,1.05,0,.65,.87,.78,"cream"),
    box(-.82,1.52,0,.79,.13,.94,"red"),
    box(-.82,1.17,.395,.31,.34,.03,"ink"),
    box(-.82,1.17,-.395,.31,.34,.03,"ink"),
    ...[.42,1.79].flatMap((x) => [
      box(x,.65,0,1.11,.29,.87,"red"), box(x,.91,0,1.08,.33,.80,"cream"),
      box(x,1.10,0,1.17,.13,.86,"red"),
      ...[-.23,.23].flatMap((dx) => [-1,1].map((side) => box(x+dx,.94,side*.407,.27,.22,.025,"blue"))),
    ]),
    wheels([-1.83,-1.24,-.73,.16,.70,1.55,2.04], .44, .35, .25),
  ].flat() },
  bunny: { aim:1.21, view:-.44, size:3.64, faces:[
    oval(0,.83,0,.57,.71,.43,"ivory"),
    oval(0,.82,.29,.40,.49,.22,"cream"),
    oval(0,1.67,.09,.64,.53,.52,"ivory"),
    oval(-.54,1.75,.02,.25,.72,.24,"ivory",-.48),
    oval(.54,1.75,.02,.25,.72,.24,"ivory",.48),
    oval(-.61,1.62,.17,.135,.50,.105,"pink",-.49),
    oval(.61,1.62,.17,.135,.50,.105,"pink",.49),
    oval(-.37,.26,.31,.31,.23,.49,"ivory",-.15),
    oval(.37,.26,.31,.31,.23,.49,"ivory",.15),
    oval(-.48,.79,.15,.22,.39,.26,"cream",-.18),
    oval(.48,.79,.15,.22,.39,.26,"cream",.18),
    oval(0,.54,-.43,.32,.33,.31,"snow"),
    oval(-.23,1.76,.52,.071,.087,.056,"ink"),
    oval(.23,1.76,.52,.071,.087,.056,"ink"),
    oval(0,1.56,.58,.15,.098,.10,"pink"),
    oval(0,1.27,.04,.49,.13,.43,"pink"),
    oval(.27,1.00,.402,.12,.32,.078,"pink",-.24),
  ].flat() },
  art: { aim:.70, view:-.30, pitch:.66, size:4.65, faces:[
    box(0,.16,.11,3.52,.26,2.34,"lilac"),
    box(0,.315,.11,3.40,.07,2.19,"snow"),
    box(0,.86,-1.01,3.53,1.25,.19,"lilac"),
    box(0,.83,-.90,3.32,1.0,.03,"ivory"),
    ...["coral","red","pink","orange","yellow","gold","green","teal","blue","purple","timber","ink"].map((color,i) =>
      box((i%6-2.5)*.49,.405,.15+Math.floor(i/6)*.65,.39,.135,.49,color)),
    tube(0,.43,1.43,.052,2.85,"timber",Math.PI/2),
    tube(1.45,.43,1.43,.083,.37,"cream",Math.PI/2),
    tube(-.18,.53,1.67,.039,2.25,"teal",Math.PI/2),
    tube(.96,.53,1.67,.060,.27,"cream",Math.PI/2),
  ].flat() },
  telescope: { aim:1.12, view:-.44, size:4.1, faces:[
    box(0,.12,0,2.95,.20,1.95,"timber"),
    tube(0,1.10,0,.10,1.55,"silver"),
    tube(-.45,.63,0,.08,1.43,"silver",-.64),
    tube(.45,.63,0,.08,1.43,"silver",.64),
    tube(0,.62,.45,.08,1.41,"silver",.65,"x"),
    oval(0,1.68,0,.23,.23,.24,"ink"),
    tube(0,2.02,0,.32,2.55,"silver",-1.07),
    tube(1.02,2.57,0,.38,.27,"blue",-1.07),
    bore(1.15,2.64,0,.295,.08,-1.07),
    tube(1.20,2.665,0,.22,.07,"teal",-1.07),
    tube(-1.07,1.44,0,.18,.35,"ink",-1.07),
    tube(-1.24,1.35,0,.24,.18,"blue",-1.07),
    tube(-.26,2.35,0,.1,.62,"blue",-1.06),
  ].flat() },
  truck: { aim:.78, view:-.62, size:4.85, faces:[
    box(0,.71,0,3.87,.27,1.55,"ink"),
    box(0,1.00,0,3.83,.42,1.47,"orange"),
    box(-.28,1.43,0,1.63,.64,1.39,"orange"),
    box(-.28,1.51,.71,1.36,.36,.028,"ink"),
    box(-.28,1.51,-.71,1.36,.36,.028,"ink"),
    box(.55,1.49,0,.026,.36,1.16,"blue"),
    box(-1.15,1.28,0,1.15,.19,1.48,"teal"),
    box(1.27,1.26,0,1.10,.18,1.52,"teal"),
    box(1.94,.87,0,.11,.25,1.42,"silver"),
    box(-1.92,.85,0,.12,.19,1.40,"silver"),
    box(1.95,1.075,.48,.10,.13,.21,"cream"),
    box(1.95,1.075,-.48,.10,.13,.21,"cream"),
    wheels([-1.14,1.18], .9, .52, .56),
  ].flat() },
};

function surfaceLight(points, pivot) {
  const [a,b,c] = points;
  const u = b.map((value,i) => value-a[i]);
  const v = c.map((value,i) => value-a[i]);
  let n = [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]];
  const length = Math.hypot(...n);
  if (!length) return .76;
  // The mesh constructors orient faces consistently within each solid.
  const sign = n.reduce((sum,value,i) => sum + value*(a[i]-pivot[i]),0) < 0 ? -1 : 1;
  n = n.map((value) => sign * value / length);
  return .62 + Math.max(0, n[0]*-.34 + n[1]*.75 + n[2]*.49)*.38;
}

function mountGiftModel(canvas, giftId) {
  const model = toyModels[giftId];
  const context = canvas.getContext("2d");
  if (!context || !model) return null;
  let angle = model.view;
  let pitch = model.pitch || .34;
  let zoom = 1;
  let drag = null;

  function paint() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    const density = Math.min(devicePixelRatio || 1, 2);
    canvas.width = width * density;
    canvas.height = height * density;
    context.setTransform(density, 0, 0, density, 0, 0);

    const scale = Math.min(width * .76, (height - 50) * .97) / model.size * zoom;
    const centerY = height * .48;
    const project = ([x, y, z]) => {
      const nx = x * Math.cos(angle) - z * Math.sin(angle);
      const nz = x * Math.sin(angle) + z * Math.cos(angle);
      const vertical = (y - model.aim) * Math.cos(pitch) - nz * Math.sin(pitch);
      const depth = nz * Math.cos(pitch) + (y - model.aim) * Math.sin(pitch);
      const perspective = 8 / (8 - depth);
      return [width/2 + nx * scale * perspective, centerY - vertical * scale * perspective, depth];
    };
    const gradient = context.createRadialGradient(width * .53, height * .40, 5, width * .53, height * .5, Math.max(width, height) * .68);
    gradient.addColorStop(0, "#557a59");
    gradient.addColorStop(.5, "#294c3c");
    gradient.addColorStop(1, "#102b25");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    context.fillStyle = "#061c1470";
    context.beginPath();
    context.ellipse(width * .5, height * .79, Math.min(width * .33, scale * 2.5), height * .095, 0, 0, Math.PI * 2);
    context.fill();

    const faces = model.faces.map((part) => {
      const projected = part.points.map(project);
      const depth = projected.reduce((sum, point) => sum + point[2], 0) / projected.length;
      return { ...part, projected, depth };
    }).sort((a, b) => a.depth - b.depth);
    for (const { projected, color, light, curved } of faces) {
      context.beginPath();
      projected.forEach(([x, y], i) => i ? context.lineTo(x, y) : context.moveTo(x, y));
      context.closePath();
      const xs = projected.map(p=>p[0]), ys = projected.map(p=>p[1]);
      const x1 = Math.min(...xs), y1 = Math.min(...ys), x2 = Math.max(...xs), y2 = Math.max(...ys);
      const material = context.createLinearGradient(x1,y1,x2+1,y2+1);
      material.addColorStop(0, mixMaterial(color, .22 * light));
      material.addColorStop(.42, color);
      material.addColorStop(1, mixMaterial(color, -.18));
      context.fillStyle = material;
      context.fill();
      context.fillStyle = `rgba(8,29,19,${(1-light)*.65})`;
      context.fill();
      context.strokeStyle = curved ? color : "#fff2ca50";
      context.lineWidth = curved ? .2 : .65;
      context.stroke();
    }
  }

  canvas.addEventListener("pointerdown", (event) => {
    drag = { x:event.clientX, y:event.clientY };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (drag === null) return;
    angle += (event.clientX - drag.x) * .018;
    pitch = Math.max(-.17, Math.min(.91, pitch + (event.clientY - drag.y) * .008));
    drag = { x:event.clientX, y:event.clientY };
    paint();
  });
  canvas.addEventListener("lostpointercapture", () => { drag = null; });
  const observer = new ResizeObserver(paint);
  observer.observe(canvas);
  paint();
  return {
    turn(direction) { angle += direction * Math.PI / 7; paint(); },
    zoom(value) { zoom = value ? 1.28 : 1; paint(); },
    reset() { angle = model.view; pitch = model.pitch || .34; zoom = 1; paint(); },
    close() { observer.disconnect(); },
  };
}

function mixMaterial(hex, amount) {
  const target=amount>0?255:0;
  const parts=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
  return `rgb(${parts.map(v=>Math.round(v+(target-v)*Math.abs(amount))).join(',')})`;
}
