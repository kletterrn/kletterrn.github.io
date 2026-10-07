(() => {
  const stage = document.querySelector('[data-orion-viewer]');
  if (!stage) return;
  const canvas = stage.querySelector('canvas');
  const start = stage.querySelector('[data-load-model]');
  const status = stage.querySelector('[data-model-status]');
  const controls = stage.querySelector('.model-controls');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let gl, program, indexCount, yaw = 32 * Math.PI / 180, pitch = 26 * Math.PI / 180, zoom = 1, ready = false, visible = true, frame = 0, interacted = false;
  const vs = `#version 300 es
  in vec3 position;in vec3 normal;in vec3 color;uniform mat3 rotation;uniform vec2 aspect;out vec3 N;out vec3 Cc;
  void main(){vec3 p=rotation*position;N=rotation*normal;Cc=color;gl_Position=vec4(p.x*aspect.x,p.y*aspect.y,-p.z*.3,1.);}`;
  const fs = `#version 300 es
  precision highp float;in vec3 N;in vec3 Cc;out vec4 frag;
  void main(){vec3 n=normalize(N);if(!gl_FrontFacing)n=-n;float key=max(dot(n,normalize(vec3(-.4,.6,1.))),0.);float fill=max(dot(n,normalize(vec3(.8,.2,-.4))),0.);float rim=pow(1.-abs(n.z),3.);vec3 col=Cc*(.25+.85*key)+Cc*vec3(.15,.22,.4)*fill+vec3(.10,.16,.3)*rim;float spec=pow(max(dot(reflect(-normalize(vec3(-.4,.6,1.)),n),vec3(0,0,1)),0.),40.);col+=spec*.13;frag=vec4(pow(clamp(col,0.,1.),vec3(1./2.2)),1.);}`;
  function draw() {
    frame = 0;
    if (!ready || !visible || document.hidden) return;
    const rect = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 1.75);
    const width = Math.max(1, Math.round(rect.width*dpr)), height = Math.max(1, Math.round(rect.height*dpr));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    let y = yaw;
    if (!interacted && !reduce.matches) {
      const r = stage.getBoundingClientRect();
      y += Math.max(-1, Math.min(1, (innerHeight*.5 - r.top - r.height*.5)/innerHeight))*.25;
    }
    const c = Math.cos(y), s = Math.sin(y), cp = Math.cos(pitch), sp = Math.sin(pitch);
    gl.viewport(0,0,width,height);
    gl.uniformMatrix3fv(gl.getUniformLocation(program,'rotation'),false,new Float32Array([c,s*sp,-s*cp,-s,c*sp,-c*cp,0,cp,sp]));
    const ratio = width/height, fit = Math.min(.92, ratio*.82)*zoom;
    gl.uniform2f(gl.getUniformLocation(program,'aspect'),fit,fit*ratio);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES,indexCount,gl.UNSIGNED_INT,0);
  }
  function requestDraw(){ if (!frame && ready) frame=requestAnimationFrame(draw); }
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('Shader unavailable');return s;}
  start.addEventListener('click',async()=>{
    start.disabled=true;status.textContent='Loading the aircraft…';
    try {
      gl=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'low-power'});
      if(!gl)throw Error('WebGL unavailable');
      const response=await fetch('/assets/orion-model.bin');if(!response.ok)throw Error('Model unavailable');
      const b=await response.arrayBuffer(),h=new DataView(b);
      if(h.getUint32(0,true)!==0x314e524f)throw Error('Invalid model');
      const count=h.getUint32(4,true);indexCount=h.getUint32(8,true);
      if(b.byteLength!==16+count*12+indexCount*4)throw Error('Incomplete model');
      program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Renderer unavailable');gl.useProgram(program);
      const attributes=[['position',new Int16Array(b,16,count*3),gl.SHORT],['normal',new Int8Array(b,16+count*6,count*3),gl.BYTE],['color',new Uint8Array(b,16+count*9,count*3),gl.UNSIGNED_BYTE]];
      for(const [name,values,type] of attributes){const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,values,gl.STATIC_DRAW);const l=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,3,type,true,0,0);}
      const buffer=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,buffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint32Array(b,16+count*12,indexCount),gl.STATIC_DRAW);
      gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);ready=true;controls.hidden=false;stage.classList.add('model-ready');canvas.tabIndex=0;requestDraw();status.textContent='Drag to orbit · Use + / − to zoom';canvas.focus({preventScroll:true});
    }catch(error){status.textContent='The interactive view could not load. You can still explore the rendered preview.';start.disabled=false;start.textContent='Retry interactive view';}
  });
  let pointer=null;
  canvas.addEventListener('pointerdown',e=>{if(!ready)return;interacted=true;pointer={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging');});
  canvas.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId)return;yaw+=(e.clientX-pointer.x)*.008;pitch=Math.max(-1.3,Math.min(1.5,pitch+(e.clientY-pointer.y)*.006));pointer.x=e.clientX;pointer.y=e.clientY;requestDraw();});
  const end=()=>{pointer=null;canvas.classList.remove('dragging');};canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);canvas.addEventListener('lostpointercapture',end);
  function changeZoom(delta){interacted=true;zoom=Math.max(.65,Math.min(2.8,zoom+delta));requestDraw();}
  controls.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;interacted=true;
    if(b.dataset.zoom)changeZoom(Number(b.dataset.zoom));
    if(b.dataset.view){const views={overview:[32,26],profile:[90,0],top:[0,89],front:[180,4]};[yaw,pitch]=views[b.dataset.view].map(x=>x*Math.PI/180);zoom=1;requestDraw();}
  });
  canvas.addEventListener('keydown',e=>{const actions={ArrowLeft:()=>yaw-=.12,ArrowRight:()=>yaw+=.12,ArrowUp:()=>pitch=Math.min(1.5,pitch+.1),ArrowDown:()=>pitch=Math.max(-1.3,pitch-.1),'+':()=>changeZoom(.1),'=':()=>changeZoom(.1),'-':()=>changeZoom(-.1)};if(actions[e.key]){e.preventDefault();interacted=true;actions[e.key]();requestDraw();}});
  new ResizeObserver(requestDraw).observe(stage);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)requestDraw();}).observe(stage);
  addEventListener('scroll',()=>{if(!interacted&&!reduce.matches)requestDraw();},{passive:true});
  document.addEventListener('visibilitychange',requestDraw);reduce.addEventListener('change',requestDraw);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;stage.classList.remove('model-ready');controls.hidden=true;status.textContent='Interactive graphics paused. Reload the page to try again.';start.hidden=true;});
})();
