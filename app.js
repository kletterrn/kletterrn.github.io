(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const header = document.querySelector('.header');
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#navigation');
  function closeMenu(restore = false) {
    const wasOpen = menu?.getAttribute('aria-expanded') === 'true';
    menu?.setAttribute('aria-expanded','false');
    header?.classList.remove('menu-open');
    if (restore && wasOpen) menu.focus();
  }
  menu?.addEventListener('click',() => {
    const opening = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded',String(opening));
    header.classList.toggle('menu-open',opening);
    if (opening) nav?.querySelector('a')?.focus();
  });
  nav?.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});
  document.addEventListener('click',event=>{if(!header?.contains(event.target))closeMenu();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu(true);});
  matchMedia('(min-width: 761px)').addEventListener('change',()=>closeMenu());

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries=>{
      for(const entry of entries) if(entry.isIntersecting){entry.target.classList.remove('reveal-pending');revealObserver.unobserve(entry.target);}
    },{threshold:.08,rootMargin:'0px 0px -18px 0px'});
    document.querySelectorAll('[data-reveal]').forEach(element=>{
      if(!reduced.matches && element.getBoundingClientRect().top > innerHeight){
        element.classList.add('reveal-pending');revealObserver.observe(element);
      }
    });
    reduced.addEventListener('change',()=>{
      if(reduced.matches){document.querySelectorAll('.reveal-pending').forEach(element=>element.classList.remove('reveal-pending'));revealObserver.disconnect();}
    });
    const sections=document.querySelectorAll('main > section[id]');
    const sectionObserver=new IntersectionObserver(entries=>{
      for(const entry of entries) if(entry.isIntersecting){
        nav?.querySelectorAll('a').forEach(link=>{
          if(link.hash===`#${entry.target.id}`)link.setAttribute('aria-current','location');
          else link.removeAttribute('aria-current');
        });
      }
    },{rootMargin:'-15% 0px -55% 0px',threshold:0});
    sections.forEach(section=>sectionObserver.observe(section));
  }

  // Split only visual text; retain a single uninterrupted accessible sentence.
  const readingWords=[];
  document.querySelectorAll('[data-read-text]').forEach(element=>{
    const text=element.innerText.replace(/\s+/g,' ').trim();
    const accessible=document.createElement('span');
    accessible.className='sr-only';accessible.textContent=text;
    const visual=document.createElement('span');visual.setAttribute('aria-hidden','true');
    const tokens=text.split(' ');
    tokens.forEach((word,index)=>{
      const span=document.createElement('span');span.className='read-word';span.textContent=word;
      visual.append(span,document.createTextNode(index===tokens.length-1?'':' '));
      readingWords.push({span,element,index,total:tokens.length});
    });
    element.replaceChildren(accessible,visual);
  });
  document.querySelectorAll('[data-magnetic]').forEach(element=>{
    // Measure the stationary parent to avoid feedback from the moving surface.
    const target=element.closest('.work-jump') || element;
    function reset(){element.style.removeProperty('--mag-x');element.style.removeProperty('--mag-y');}
    target.addEventListener('pointermove',event=>{
      if(!fine.matches || reduced.matches)return;
      const rect=target.getBoundingClientRect();
      element.style.setProperty('--mag-x',`${Math.max(-7,Math.min(7,(event.clientX-rect.left-rect.width/2)*.15))}px`);
      element.style.setProperty('--mag-y',`${Math.max(-7,Math.min(7,(event.clientY-rect.top-rect.height/2)*.15))}px`);
    });
    target.addEventListener('pointerleave',reset);target.addEventListener('blur',reset);
    reduced.addEventListener('change',reset);fine.addEventListener('change',reset);
  });
  const panels=[...document.querySelectorAll('.project-panel, .audit-card')];
  let scrollFrame=0;
  function updateScroll(){
    scrollFrame=0;
    const readingRects=new Map();
    readingWords.forEach(({span,element,index,total})=>{
      if(reduced.matches){span.style.removeProperty('--word-opacity');return;}
      if(!readingRects.has(element))readingRects.set(element,element.getBoundingClientRect());
      const rect=readingRects.get(element);
      const progress=Math.max(0,Math.min(1,(innerHeight*.88-rect.top)/(innerHeight*.42)));
      const lit=Math.max(0,Math.min(1,progress*total-index));
      span.style.setProperty('--word-opacity',(.42+.58*lit).toFixed(3));
    });
    header?.classList.toggle('scrolled',scrollY>15);
    const max=document.documentElement.scrollHeight-innerHeight;
    document.documentElement.style.setProperty('--progress',max>0?Math.max(0,Math.min(1,scrollY/max)):0);
    if(!reduced.matches && fine.matches)panels.forEach(panel=>{
      const rect=panel.getBoundingClientRect();
      if(rect.bottom>0 && rect.top<innerHeight){
        const offset=Math.max(-15,Math.min(15,(innerHeight/2-rect.top-rect.height/2)*.035));
        panel.style.setProperty('--image-parallax',`${offset.toFixed(1)}px`);
      }
    });
  }
  function scheduleScroll(){if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScroll);}
  addEventListener('scroll',scheduleScroll,{passive:true});
  addEventListener('resize',scheduleScroll,{passive:true});
  addEventListener('pageshow',scheduleScroll);
  reduced.addEventListener('change',scheduleScroll);
  updateScroll();

  panels.forEach(panel=>{
    const cursor=panel.querySelector('.project-hover');
    let frame=0;
    panel.addEventListener('pointermove',event=>{
      if(event.pointerType==='touch' || !fine.matches || reduced.matches || innerWidth<=760 || !cursor){resetCursor();return;}
      const rect=panel.getBoundingClientRect();
      const x=event.clientX-rect.left;
      const y=event.clientY-rect.top;
      cancelAnimationFrame(frame);
      frame=requestAnimationFrame(()=>{panel.style.setProperty('--spot-x',`${x}px`);panel.style.setProperty('--spot-y',`${y}px`);cursor.style.left=`${x}px`;cursor.style.top=`${y}px`;panel.classList.add('pointer-active');});
    });
    function resetCursor(){cancelAnimationFrame(frame);frame=0;panel.classList.remove('pointer-active');}
    panel.addEventListener('pointerleave',resetCursor);
    panel.addEventListener('pointercancel',resetCursor);
    panel.addEventListener('focusin',resetCursor);
    reduced.addEventListener('change',resetCursor);fine.addEventListener('change',resetCursor);
    addEventListener('resize',resetCursor,{passive:true});
    addEventListener('scroll',resetCursor,{passive:true});
    addEventListener('blur',resetCursor);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)resetCursor();});
  });

  document.querySelectorAll('.cap-list details').forEach(detail=>{
    detail.addEventListener('toggle',()=>{
      if(detail.open)document.querySelectorAll('.cap-list details').forEach(other=>{if(other!==detail)other.open=false;});
    });
  });

  document.querySelectorAll('[data-copy]').forEach(button=>{
    let resetTimer;
    button.addEventListener('click',async()=>{
      const status=document.querySelector('#copy-status');
      const label=button.querySelector('span');
      try{
        await navigator.clipboard.writeText('davidkhaliqi05@gmail.com');
        if(label)label.textContent='Copied!';
        if(status)status.textContent='Email address copied.';
        clearTimeout(resetTimer);
        resetTimer=setTimeout(()=>{if(label)label.textContent='Copy email';},2500);
      }catch{
        if(status)status.textContent='Select the address to copy it, or click it to open your email app.';
      }
    });
  });

  const caseLinks=[...document.querySelectorAll('.case-sidebar nav a')];
  if(caseLinks.length && 'IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries)if(entry.isIntersecting)caseLinks.forEach(link=>{
        if(link.hash===`#${entry.target.id}`)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');
      });
    },{rootMargin:'-15% 0px -55% 0px'});
    document.querySelectorAll('.case-section').forEach(section=>observer.observe(section));
  }
  const zoom=document.querySelector('[data-zoom]');
  const dialog=document.querySelector('#image-dialog');
  if(dialog && typeof dialog.showModal==='function'){
    zoom?.addEventListener('click',event=>{event.preventDefault();dialog.showModal();document.documentElement.classList.add('dialog-open');});
    dialog.querySelector('[data-close-dialog]')?.addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
    dialog.addEventListener('close',()=>{document.documentElement.classList.remove('dialog-open');zoom?.focus();});
  }

})();

// Native audio controls stay usable without JavaScript; the waveform is derived from the source audio.
document.querySelectorAll('.sound-player').forEach(player => {
  const audio = player.querySelector('audio');
  const status = player.querySelector('.sound-status');
  const playhead = player.querySelector('.sound-playhead');
  const update = () => {
    const progress = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.currentTime / audio.duration : 0;
    player.classList.toggle('has-progress', progress > 0);
    playhead.style.left = `${Math.min(99.8, progress * 100)}%`;
  };
  audio.addEventListener('timeupdate', update);
  audio.addEventListener('play', () => { player.classList.add('is-playing'); status.textContent = 'NOW PLAYING'; });
  audio.addEventListener('pause', () => { player.classList.remove('is-playing'); status.textContent = audio.ended ? 'PLAY AGAIN' : 'PAUSED'; });
  audio.addEventListener('ended', () => { player.classList.remove('is-playing'); status.textContent = 'PLAY AGAIN'; update(); });
  audio.addEventListener('error', () => { status.textContent = 'AUDIO UNAVAILABLE'; });
});
