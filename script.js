// Lädt config.json und baut daraus die Seite. Daten (Config) und Darstellung bleiben getrennt.

const app = document.getElementById('app');

/** Kleiner DOM-Helper: el('div', { class: 'x' }, 'Text', child) */
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value != null) node.setAttribute(key, value);
  }
  for (const child of children.flat()) {
    if (child == null) continue;
    node.append(child instanceof Node ? child : document.createTextNode(child));
  }
  return node;
}

function applyTheme(theme = {}) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme)) {
    root.style.setProperty(`--${key}`, value);
  }
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Einfache Motorrad-Silhouette als SVG. Wird für Vorher und Nachher identisch gezeichnet. */
function bikeSVG(extra = []) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 400 240');
  svg.setAttribute('class', 'bike');
  svg.setAttribute('aria-hidden', 'true');
  const spokes = [85, 315].flatMap(cx =>
    Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return `<line x1="${cx}" y1="165" x2="${(cx + Math.cos(a) * 42).toFixed(1)}" y2="${(165 + Math.sin(a) * 42).toFixed(1)}" />`;
    })
  ).join('');
  svg.innerHTML = `
    <g class="stroke" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="85" cy="165" r="58" stroke-width="9" />
      <circle cx="315" cy="165" r="58" stroke-width="9" />
      <circle cx="85" cy="165" r="42" stroke-width="2" />
      <circle cx="315" cy="165" r="42" stroke-width="2" />
      <g stroke-width="1.5">${spokes}</g>
      <circle cx="85" cy="165" r="8" stroke-width="4" /><circle cx="315" cy="165" r="8" stroke-width="4" />
      <path d="M85 165 L170 150 M170 150 L190 105 L268 100 M268 100 L315 165" stroke-width="7" />
      <path d="M268 100 L252 68 L232 64" stroke-width="5" />
      <path d="M180 160 Q140 178 66 148" stroke-width="10" />
    </g>
    <rect class="engine" x="178" y="116" width="62" height="46" rx="7" />
    <path class="tank" d="M183 102 Q215 68 272 84 L268 106 L190 110 Z" />
    <path class="seat" d="M104 112 Q150 96 188 106 L188 116 L108 124 Z" />
    <circle class="lamp" cx="286" cy="101" r="10" />
    ${extra.join('')}`;
  return svg;
}

const renderers = {
  nav(c) {
    return el('nav', { class: 'nav', 'aria-label': 'Hauptnavigation' },
      el('a', { class: 'brand', href: '#' }, c.brand),
      el('ul', {})
    );
  },

  hero(c) {
    return el('section', { class: 'hero' },
      el('canvas', { class: 'sparks', 'aria-hidden': 'true' }),
      el('p', { class: 'kicker' }, c.kicker),
      el('h1', {}, c.title),
      el('p', { class: 'subtitle' }, c.subtitle),
      c.cta && el('a', { class: 'btn', href: c.cta.target }, c.cta.label),
      el('div', { class: 'hazard', 'aria-hidden': 'true' })
    );
  },

  about(c) {
    return el('section', { class: 'about' },
      el('h2', {}, c.title),
      el('div', { class: 'about-body' },
        el('div', {}, (c.paragraphs || []).map(p => el('p', {}, p))),
        c.badge && el('div', { class: 'badge', 'aria-hidden': 'true' }, c.badge)
      )
    );
  },

  stats(c) {
    const items = c.items.map(i =>
      el('div', { class: 'stat plate' },
        el('span', { class: 'stat-value', 'data-value': i.value, 'data-suffix': i.suffix || '' }, '0'),
        el('span', { class: 'stat-label' }, i.label)
      )
    );
    return el('section', { class: 'stats' }, el('div', { class: 'stat-row' }, items));
  },

  services(c) {
    const rows = c.items.map(i =>
      el('li', {},
        el('div', {}, el('h3', {}, i.name), el('p', {}, i.text)),
        el('span', { class: 'price' }, i.price)
      )
    );
    return el('section', { class: 'services' }, el('h2', {}, c.title), el('ul', { class: 'service-list' }, rows));
  },

  beforeafter(c) {
    // Zwei identische Motorräder übereinander, das obere (Vorher) wird per clip-path beschnitten
    const rust = [
      '<circle class="rust" cx="85" cy="120" r="14" /><circle class="rust" cx="315" cy="205" r="11" />',
      '<circle class="rust" cx="222" cy="92" r="12" /><circle class="rust" cx="150" cy="160" r="9" />',
      '<path class="crack" d="M120 114 l10 6 l-6 8 l12 5" />'
    ];
    const after = el('div', { class: 'ba-layer after' }, bikeSVG(['<path class="shine" d="M196 98 Q220 80 258 88" />']), el('span', { class: 'ba-label right' }, c.labelAfter));
    const before = el('div', { class: 'ba-layer before' }, bikeSVG(rust), el('span', { class: 'ba-label left' }, c.labelBefore));
    const stage = el('div', { class: 'ba-stage', style: '--pos: 50%' }, after, before, el('div', { class: 'ba-handle', 'aria-hidden': 'true' }));
    const range = el('input', { class: 'ba-range', type: 'range', min: 0, max: 100, value: 50, 'aria-label': 'Vorher/Nachher-Regler' });
    range.addEventListener('input', () => stage.style.setProperty('--pos', `${range.value}%`));
    stage.append(range);
    return el('section', { class: 'beforeafter' },
      el('h2', {}, c.title),
      c.text && el('p', { class: 'ba-text' }, c.text),
      stage
    );
  },

  process(c) {
    const steps = c.items.map((i, n) =>
      el('li', { class: 'plate' },
        el('span', { class: 'step-no' }, String(n + 1).padStart(2, '0')),
        el('h3', {}, i.title),
        el('p', {}, i.text)
      )
    );
    return el('section', { class: 'process' }, el('h2', {}, c.title), el('ol', { class: 'steps' }, steps));
  },

  hours(c) {
    const rows = c.items.map(i => el('tr', {}, el('th', { scope: 'row' }, i.day), el('td', {}, i.time)));
    return el('section', { class: 'hours' },
      el('h2', {}, c.title),
      el('table', { class: 'plate' }, el('tbody', {}, rows)),
      c.note && el('p', { class: 'note-small' }, c.note)
    );
  },

  faq(c) {
    const items = c.items.map(i => el('details', {}, el('summary', {}, i.q), el('p', {}, i.a)));
    return el('section', { class: 'faq' }, el('h2', {}, c.title), el('div', {}, items));
  },

  contact(c) {
    const links = (c.links || []).map(l =>
      el('a', { class: 'btn', href: l.url, target: '_blank', rel: 'noopener noreferrer' }, l.label)
    );
    return el('section', { class: 'contact' },
      el('h2', {}, c.title),
      el('p', {}, c.text),
      el('div', { class: 'links' }, links)
    );
  },

  footer(c) {
    return el('footer', {}, c.text);
  }
};

function render(config) {
  document.title = config.meta.title;
  document.documentElement.lang = config.meta.lang || 'de';
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.content = config.meta.description;

  applyTheme(config.theme);

  // Reihenfolge und Sichtbarkeit kommen aus der Config
  const navItems = [];
  for (const [name, section] of Object.entries(config.sections)) {
    if (!section.enabled || !renderers[name]) continue;
    const node = renderers[name](section, config);
    if (name !== 'nav' && name !== 'footer' && name !== 'hero') node.classList.add('reveal');
    if (name !== 'nav' && name !== 'footer') {
      node.id = section.id || name;
      if (section.nav) navItems.push({ id: node.id, label: section.nav });
    }
    app.append(node);
  }

  const nav = app.querySelector('.nav');
  if (nav) buildNav(nav, navItems);
  initReveal();
  initEffects(config.effects || {}, app.querySelector('.hero'));
}

fetch('config.json')
  .then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  })
  .then(render)
  .catch(err => {
    app.append(el('p', { style: 'padding:2rem' }, `config.json konnte nicht geladen werden (${err.message}). Bitte über einen Webserver öffnen, nicht per file://.`));
  });
