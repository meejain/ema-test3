// AbbVie-style header: single-row solid-white bar with logo, click-triggered
// full-width megamenu panels for primary nav, and tool panels (More, Global,
// Search). All copy/links/images come from /content/nav.plain.html; this file
// only reads that DOM, builds structure/controls, and wires interactions.

const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Fetch the nav fragment. Metadata-independent dual-fetch:
 * /content first (localhost / aem up), then root (DA/EDS production).
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const html = await resp.text();
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp;
}

/** Close every open panel and reset trigger state.
 * Panel visibility is driven by the trigger's aria-expanded state via CSS
 * (`.nav-trigger[aria-expanded="true"] + .nav-panel`), so we only flip the
 * attribute here. */
function closeAllPanels(nav, exceptTrigger = null) {
  nav.querySelectorAll('.nav-trigger[aria-expanded="true"]').forEach((btn) => {
    if (btn === exceptTrigger) return;
    btn.setAttribute('aria-expanded', 'false');
  });
}

/** Build a top-level trigger button + its panel from a source <div> section. */
function buildMenu(section, nav) {
  const heading = section.querySelector(':scope > h2');
  if (!heading) return null;
  const label = heading.textContent.trim();

  const item = document.createElement('li');
  item.className = 'nav-item';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'nav-trigger';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-haspopup', 'true');
  trigger.textContent = label;

  const panel = document.createElement('div');
  panel.className = 'nav-panel';

  // Mobile "Back" control (collapses the section) — shown only in the drawer,
  // mirroring the source's accordion Back button.
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'nav-back';
  back.textContent = 'Back';
  panel.append(back);

  // Move all content after this <h2> (until the next <h2>) into the panel.
  const nodes = [];
  let sib = heading.nextElementSibling;
  while (sib && sib.tagName !== 'H2') {
    nodes.push(sib);
    sib = sib.nextElementSibling;
  }
  nodes.forEach((n) => panel.append(n));

  // Group the top link list + the promo blocks (intro / featured / stat) that
  // follow it into a "promo band" so the panel matches the source's
  // top-grid + 3-column promo layout.
  const topList = panel.querySelector(':scope > ul');
  if (topList && topList.nextElementSibling) {
    const band = document.createElement('div');
    band.className = 'nav-promo-band';
    let col = null;
    let node = topList.nextElementSibling;
    while (node) {
      const next = node.nextElementSibling;
      // A new promo column starts at each heading (h3 intro, h4 featured, h5 stat).
      if (/^H[3-5]$/.test(node.tagName)) {
        col = document.createElement('div');
        col.className = 'nav-promo-col';
        band.append(col);
      }
      if (!col) { col = document.createElement('div'); col.className = 'nav-promo-col'; band.append(col); }
      col.append(node);
      node = next;
    }
    panel.append(band);
  }

  item.append(trigger, panel);

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = trigger.getAttribute('aria-expanded') === 'true';
    closeAllPanels(nav, open ? null : trigger);
    trigger.setAttribute('aria-expanded', open ? 'false' : 'true');
  });

  back.addEventListener('click', (e) => {
    e.stopPropagation();
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus();
  });

  return item;
}

/** Wire up expand/collapse for grouped sub-lists (items with a nested <ul>). */
function decorateGroups(panel) {
  panel.querySelectorAll('li').forEach((li) => {
    const subList = li.querySelector(':scope > ul');
    const link = li.querySelector(':scope > a');
    if (subList && link) {
      li.classList.add('nav-group');
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'nav-group-toggle';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', `Toggle ${link.textContent.trim()}`);
      li.insertBefore(toggle, subList);
      subList.hidden = true;
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const open = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
        subList.hidden = open;
      });
    }
  });
}

/** Build the expandable search control (form is created here, not in the fragment). */
function buildSearch(nav) {
  const item = document.createElement('li');
  item.className = 'nav-item nav-item-search';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'nav-trigger nav-trigger-icon nav-trigger-search';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-label', 'Search AbbVie.com');

  const panel = document.createElement('div');
  panel.className = 'nav-panel nav-panel-search';
  const form = document.createElement('form');
  form.className = 'nav-search-form';
  form.setAttribute('role', 'search');
  form.action = '/search';
  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.placeholder = 'Search';
  input.setAttribute('aria-label', 'Search');
  form.append(input);
  panel.append(form);

  item.append(trigger, panel);
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = trigger.getAttribute('aria-expanded') === 'true';
    closeAllPanels(nav, open ? null : trigger);
    trigger.setAttribute('aria-expanded', open ? 'false' : 'true');
    if (!open) input.focus();
  });
  return item;
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  block.textContent = '';

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main navigation');

  const sections = fragment ? [...fragment.children] : [];

  // Section 0 = brand; last section (h2 "More"/"Global"/"Search") = tools;
  // everything in between = primary nav menus.
  const brandSection = sections.shift();
  const toolsSection = sections.pop();

  // Brand
  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  if (brandSection) {
    const link = brandSection.querySelector('a');
    if (link) brand.append(link);
  }

  // Primary nav
  const primary = document.createElement('div');
  primary.className = 'nav-sections';
  const primaryList = document.createElement('ul');
  primaryList.className = 'nav-list';
  sections.forEach((section) => {
    const item = buildMenu(section, nav);
    if (item) {
      decorateGroups(item.querySelector('.nav-panel'));
      primaryList.append(item);
    }
  });
  primary.append(primaryList);

  // Tools (More, Global) — split the tools section by its <h2> headings.
  // Search is built separately as a bar-level control (stays in the top bar at
  // all breakpoints, matching the source's 3-item mobile bar).
  const tools = document.createElement('div');
  tools.className = 'nav-tools';
  const toolsList = document.createElement('ul');
  toolsList.className = 'nav-tools-list';
  const searchBar = document.createElement('div');
  searchBar.className = 'nav-search';
  const searchList = document.createElement('div');
  searchList.className = 'nav-search-list';
  if (toolsSection) {
    const headings = [...toolsSection.querySelectorAll(':scope > h2')];
    headings.forEach((h2) => {
      const label = h2.textContent.trim();
      if (/^search$/i.test(label)) {
        searchList.append(buildSearch(nav));
        return;
      }
      // Build a temporary section wrapper so buildMenu can reuse the same logic.
      const wrapper = document.createElement('div');
      wrapper.append(h2.cloneNode(true));
      let sib = h2.nextElementSibling;
      const collected = [];
      while (sib && sib.tagName !== 'H2') { collected.push(sib); sib = sib.nextElementSibling; }
      collected.forEach((n) => wrapper.append(n));
      const item = buildMenu(wrapper, nav);
      if (item) {
        item.classList.add('nav-item-tool');
        const trigger = item.querySelector('.nav-trigger');
        trigger.classList.add(`nav-trigger-${label.toLowerCase()}`);
        decorateGroups(item.querySelector('.nav-panel'));
        toolsList.append(item);
      }
    });
  }
  tools.append(toolsList);
  searchBar.append(searchList);

  // Hamburger (mobile)
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation" aria-expanded="false">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  const hamburgerBtn = hamburger.querySelector('button');
  hamburgerBtn.addEventListener('click', () => {
    const open = hamburgerBtn.getAttribute('aria-expanded') === 'true';
    hamburgerBtn.setAttribute('aria-expanded', open ? 'false' : 'true');
    hamburgerBtn.setAttribute('aria-label', open ? 'Open navigation' : 'Close navigation');
    nav.classList.toggle('nav-open', !open);
    document.body.style.overflowY = open ? '' : 'hidden';
    if (open) closeAllPanels(nav);
  });

  // Wrap primary + tools in a drawer container. On desktop this is
  // display:contents (transparent to the nav grid); on mobile it becomes the
  // full-height slide-down drawer holding both the nav accordions and tools.
  const drawer = document.createElement('div');
  drawer.className = 'nav-drawer';
  drawer.append(primary, tools);

  nav.append(hamburger, brand, drawer, searchBar);

  // Close panels when clicking outside or pressing Escape.
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) closeAllPanels(nav);
  });
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') closeAllPanels(nav);
  });

  // Reset state when crossing the desktop/mobile breakpoint.
  isDesktop.addEventListener('change', () => {
    closeAllPanels(nav);
    nav.classList.remove('nav-open');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    hamburgerBtn.setAttribute('aria-label', 'Open navigation');
    document.body.style.overflowY = '';
    nav.querySelectorAll('.nav-group-toggle[aria-expanded="true"]').forEach((t) => {
      t.setAttribute('aria-expanded', 'false');
      const sub = t.nextElementSibling;
      if (sub) sub.hidden = true;
    });
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
