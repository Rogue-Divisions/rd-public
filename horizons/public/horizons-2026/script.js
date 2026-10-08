(() => {
  const header=document.querySelector('.topbar');
  const measureHeader=()=>document.documentElement.style.setProperty('--header-height',`${Math.ceil(header.getBoundingClientRect().height)}px`);
  measureHeader();
  if('ResizeObserver' in window)new ResizeObserver(measureHeader).observe(header);
  else addEventListener('resize',measureHeader);

  let queued=false;const progress=document.querySelector('.scroll-progress');addEventListener('scroll',()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{const total=document.documentElement.scrollHeight-innerHeight;progress.style.width=`${total?scrollY/total*100:0}%`;queued=false})},{passive:true});
  const toggle=document.getElementById('fund-toggle');toggle.addEventListener('change',()=>{const yes=toggle.checked;document.getElementById('two-price').textContent=yes?'£22,000':'£16,000';document.getElementById('three-price').textContent=yes?'£26,000':'£20,000';document.querySelectorAll('.price-caption').forEach(e=>e.textContent=yes?'Event + Fund II preparation':'Event package');});
  const dialog=document.getElementById('video-dialog'),holder=document.getElementById('video-holder');let opener=null;
  document.querySelectorAll('[data-video]').forEach(button=>button.addEventListener('click',()=>{opener=button;const frame=document.createElement('iframe');frame.src=`https://player.vimeo.com/video/${button.dataset.video}?autoplay=1&dnt=1`;frame.title=`Ranchland Capital Partners: ${button.dataset.title}`;frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';frame.allowFullscreen=true;holder.replaceChildren(frame);document.getElementById('video-heading').textContent=`Ranchland · ${button.dataset.title}`;document.body.classList.add('modal-open');dialog.showModal();document.getElementById('close-video').focus();}));
  document.getElementById('close-video').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});dialog.addEventListener('close',()=>{holder.replaceChildren();document.body.classList.remove('modal-open');opener?.focus();});
})();
