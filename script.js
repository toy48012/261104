(() => {
  'use strict';
  const slides = [...document.querySelectorAll('.slide')];
  const links = [...document.querySelectorAll('[data-nav], [data-dot]')];
  const prev = document.getElementById('previous');
  const next = document.getElementById('next');
  const counter = document.getElementById('control-count');
  const bar = document.getElementById('progress-bar');
  const scrollHint = document.getElementById('scroll-hint');
  const dialog = document.getElementById('info-dialog');
  let current = 0;
  let wheelLockedUntil = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartAt = 0;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (n) => Math.max(0, Math.min(slides.length - 1, n));

  function setCurrent(index) {
    current = clamp(index);
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === current));
    links.forEach(link => {
      const value = Number(link.dataset.nav ?? link.dataset.dot);
      const active = value === current;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    });
    counter.innerHTML = `<strong>${String(current + 1).padStart(2, '0')}</strong><span> / ${String(slides.length).padStart(2, '0')}</span>`;
    bar.style.width = `${100 * (current + 1) / slides.length}%`;
    prev.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    scrollHint.classList.toggle('hidden', current !== 0);
  }
  function go(index, { updateHash = true } = {}) {
    const target = clamp(index);
    setCurrent(target);
    slides[target].scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
    if (updateHash && location.hash !== `#slide-${target + 1}`) {
      history.replaceState(null, '', `#slide-${target + 1}`);
    }
  }
  prev.addEventListener('click', () => go(current - 1));
  next.addEventListener('click', () => go(current + 1));
  links.forEach(link => link.addEventListener('click', e => {
    e.preventDefault();
    go(Number(link.dataset.nav ?? link.dataset.dot));
  }));
  document.querySelector('.brand').addEventListener('click', e => { e.preventDefault(); go(0); });
  document.addEventListener('keydown', e => {
    if (dialog.open || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) {e.preventDefault(); go(current + 1);}
    else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) {e.preventDefault(); go(current - 1);}
    else if (e.key === 'Home') {e.preventDefault(); go(0);}
    else if (e.key === 'End') {e.preventDefault(); go(slides.length - 1);}
  });
  document.addEventListener('wheel', e => {
    if (dialog.open || Math.abs(e.deltaY) < 14 || e.ctrlKey) return;
    if (Date.now() < wheelLockedUntil) { e.preventDefault(); return; }
    if ((e.deltaY > 0 && current === slides.length - 1) || (e.deltaY < 0 && current === 0)) return;
    e.preventDefault();
    wheelLockedUntil = Date.now() + 780;
    go(current + Math.sign(e.deltaY));
  }, { passive: false });
  document.addEventListener('touchstart', e => {
    if (dialog.open || e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartAt = Date.now();
  }, {passive:true});
  document.addEventListener('touchend', e => {
    if (dialog.open || !e.changedTouches.length) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Date.now() - touchStartAt > 1000) return;
    if (Math.abs(dy) > 65 && Math.abs(dy) > Math.abs(dx) * 1.15) go(current + (dy < 0 ? 1 : -1));
    else if (Math.abs(dx) > 85 && Math.abs(dx) > Math.abs(dy) * 1.4) go(current + (dx < 0 ? 1 : -1));
  }, {passive:true});
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio);
    if (visible.length && visible[0].intersectionRatio >= 0.5) {
      const index = Number(visible[0].target.dataset.index);
      if (index !== current) {
        setCurrent(index);
        history.replaceState(null, '', `#slide-${index + 1}`);
      }
    }
  }, {threshold:[0.5,0.6,0.75,0.9]});
  slides.forEach(slide => observer.observe(slide));
  document.getElementById('info-open').addEventListener('click', () => dialog.showModal());
  document.getElementById('info-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  window.addEventListener('hashchange', () => {
    const match = location.hash.match(/^#slide-([1-6])$/);
    if (match) go(Number(match[1]) - 1, {updateHash:false});
  });
  const match = location.hash.match(/^#slide-([1-6])$/);
  if (match) {
    const start = Number(match[1]) - 1;
    setCurrent(start);
    requestAnimationFrame(() => slides[start].scrollIntoView({behavior:'instant'}));
  } else setCurrent(0);
})();
