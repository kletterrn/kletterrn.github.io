(() => {
  const hero=document.querySelector('[data-prism-hero]');if(!hero)return;
  const scene=hero.querySelector('.prism-composition');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const fine=matchMedia('(hover: hover) and (pointer: fine)');
  let x=0,y=0,targetX=0,targetY=0,progress=0,targetProgress=0,frame=0,last=0,visible=true;
  function wake(){if(!frame&&visible&&!document.hidden)frame=requestAnimationFrame(draw);}
  function draw(now){
    frame=0;const dt=Math.min((now-(last||now-16))/1000,.05);last=now;
    const ease=reduced.matches?1:1-Math.exp(-dt*7);
    x+=(targetX-x)*ease;y+=(targetY-y)*ease;progress+=(targetProgress-progress)*ease;
    hero.style.setProperty('--px',x.toFixed(4));hero.style.setProperty('--py',y.toFixed(4));hero.style.setProperty('--scroll',progress.toFixed(4));
    hero.style.setProperty('--light-x',`${50+x*35}%`);hero.style.setProperty('--light-y',`${50+y*35}%`);
    if(Math.abs(x-targetX)+Math.abs(y-targetY)+Math.abs(progress-targetProgress)>.001)wake();
  }
  scene.addEventListener('pointermove',event=>{
    if(reduced.matches||!fine.matches)return;
    const r=scene.getBoundingClientRect();targetX=Math.max(-1,Math.min(1,(event.clientX-r.left)/r.width*2-1));targetY=Math.max(-1,Math.min(1,(event.clientY-r.top)/r.height*2-1));wake();
  });
  function reset(){targetX=targetY=0;wake();}
  scene.addEventListener('pointerleave',reset);fine.addEventListener('change',reset);
  let scrollFrame=0;
  function updateScroll(){scrollFrame=0;targetProgress=reduced.matches?0:Math.max(0,Math.min(1,-hero.getBoundingClientRect().top/hero.offsetHeight));wake();}
  function queueScroll(){if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScroll);}
  addEventListener('scroll',queueScroll,{passive:true});addEventListener('resize',queueScroll,{passive:true});addEventListener('pageshow',queueScroll);
  if('IntersectionObserver' in window)new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;hero.classList.toggle('hero-offscreen',!visible);if(visible){last=0;updateScroll();}else{cancelAnimationFrame(frame);frame=0;}},{rootMargin:'50px'}).observe(hero);
  document.addEventListener('visibilitychange',()=>{hero.classList.toggle('hero-page-hidden',document.hidden);if(document.hidden){cancelAnimationFrame(frame);frame=0;}else{last=0;wake();}});
  reduced.addEventListener('change',()=>{targetX=targetY=0;updateScroll();});updateScroll();
})();
