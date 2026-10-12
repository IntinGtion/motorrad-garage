// Navigation, Scroll-Effekte und Funkenflug. Wird von script.js nach dem Rendern aufgerufen.

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Navigation ---------- */
function buildNav(nav, items) {
  const list = nav.querySelector('ul');
  for (const item of items) {
    list.append(el('li', {}, el('a', { href: `#${item.id}`, 'data-target': item.id }, item.label)));
  }

  // Aktiven Menüpunkt beim Scrollen hervorheben
  const links = new Map([...nav.querySelectorAll('a[data-target]')].map(a => [a.dataset.target, a]));
  const spy = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      links.forEach(a => a.classList.remove('active'));
      links.get(e.target.id)?.classList.add('active');
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });

  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ---------- Einblenden beim Scrollen + Zähler ---------- */
function initReveal() {
  const targets = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reducedMotion) {
    targets.forEach(t => { t.classList.add('visible'); t.querySelectorAll('.stat-value').forEach(setFinal); });
    return;
  }
  const io = new IntersectionObserver((entries, obs) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('visible');
      e.target.querySelectorAll('.stat-value').forEach(countUp);
      obs.unobserve(e.target);
    }
  }, { threshold: 0.15 });
  targets.forEach(t => io.observe(t));
}

function formatStat(node, value) {
  node.textContent = Math.round(value).toLocaleString('de-DE') + node.dataset.suffix;
}
function setFinal(node) { formatStat(node, Number(node.dataset.value)); }
function countUp(node) {
  const end = Number(node.dataset.value);
  const start = performance.now();
  const duration = 1400;
  (function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    formatStat(node, end * (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(tick);
  })(start);
}

/* ---------- Effekte ---------- */
function initEffects(fx, hero) {
  if (fx.grain) document.body.classList.add('fx-grain');
  if (hero && fx.sparks) sparks(hero.querySelector('canvas.sparks'), hero);
  if (fx.cursorGlow && !reducedMotion && window.matchMedia('(pointer: fine)').matches) cursorGlow();
}

function cursorGlow() {
  const glow = el('div', { class: 'cursor-glow', 'aria-hidden': 'true' });
  document.body.append(glow);
  window.addEventListener('pointermove', e => {
    glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    glow.style.opacity = '1';
  }, { passive: true });
  document.addEventListener('pointerleave', () => { glow.style.opacity = '0'; });
}

/**
 * Funkenflug: Ein Schleifpunkt wirft Funken nach oben, sie fallen mit Schwerkraft
 * und springen vom Boden ab. Der Punkt folgt der Maus; ohne Maus wandert er von selbst.
 * Bei prefers-reduced-motion bleibt das Bild statisch (keine Animation).
 */
function sparks(canvas, hero) {
  if (!canvas || reducedMotion) return;
  const ctx = canvas.getContext('2d');
  const GRAVITY = 0.28;
  let w, h, dpr, floor;
  let parts = [];
  let visible = false, raf = null;
  let emitter = { x: 0, y: 0 };
  let pointer = null;           // letzte Mausposition im Hero, sonst null
  let t0 = performance.now();

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = hero.clientWidth; h = hero.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    floor = h - 38;             // knapp über dem Warnstreifen
  }
  resize();
  window.addEventListener('resize', resize);

  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    pointer = { x: e.clientX - r.left, y: Math.min(e.clientY - r.top, floor - 20) };
  });
  hero.addEventListener('pointerleave', () => { pointer = null; });

  function emit(n) {
    for (let i = 0; i < n; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.3;   // überwiegend nach oben
      const speed = 2 + Math.random() * 7;
      parts.push({
        x: emitter.x, y: emitter.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 0, max: 45 + Math.random() * 60,
        bounces: 0
      });
    }
    if (parts.length > 900) parts.splice(0, parts.length - 900);
  }

  function frame(now) {
    raf = null;
    if (!visible) return;
    // Emitter: Maus oder sanftes Hin- und Herwandern
    const tx = pointer ? pointer.x : w * (0.5 + 0.32 * Math.sin((now - t0) / 2600));
    const ty = pointer ? pointer.y : floor - 30;
    emitter.x += (tx - emitter.x) * 0.12;
    emitter.y += (ty - emitter.y) * 0.12;
    emit(pointer ? 9 : 6);

    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';

    // Glut am Schleifpunkt
    const glow = ctx.createRadialGradient(emitter.x, emitter.y, 0, emitter.x, emitter.y, 60);
    glow.addColorStop(0, 'rgba(255,184,28,.55)');
    glow.addColorStop(1, 'rgba(217,83,30,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(emitter.x - 60, emitter.y - 60, 120, 120);

    parts = parts.filter(p => {
      p.life++;
      p.vy += GRAVITY;
      p.vx *= 0.995;
      const px = p.x, py = p.y;
      p.x += p.vx; p.y += p.vy;
      if (p.y > floor && p.vy > 0 && p.bounces < 2) {   // am Boden abprallen
        p.y = floor; p.vy *= -0.38; p.vx *= 0.7; p.bounces++;
      }
      if (p.life > p.max || p.x < -20 || p.x > w + 20) return false;
      const k = 1 - p.life / p.max;
      // Farbe: weißgelb -> orange -> dunkelrot beim Verglühen
      ctx.strokeStyle = k > 0.66 ? `rgba(255,236,170,${k})` : k > 0.33 ? `rgba(255,150,30,${k + 0.2})` : `rgba(217,60,20,${k * 2})`;
      ctx.lineWidth = 0.8 + k * 1.6;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(p.x, p.y); ctx.stroke();
      return true;
    });
    ctx.globalCompositeOperation = 'source-over';
    raf = requestAnimationFrame(frame);
  }

  // Nur animieren, solange der Hero im Bild ist
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible && raf == null) raf = requestAnimationFrame(frame);
  }).observe(hero);
}
