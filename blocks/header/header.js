// media query match that indicates desktop width
const isDesktop = window.matchMedia('(min-width: 900px)');

// ---------------------------------------------------------------------------
// Tolerant fragment parsing helpers — work for BOTH the raw authored fragment
// (aem up) and the DA/EDS decorated shape (li > p > a, label in sibling <p>,
// <picture> wrapping images, hrefs without .html). Keep generic — no
// site-specific names.
// ---------------------------------------------------------------------------
function submenuOf(li) {
  return li.querySelector(':scope > ul');
}

function linkOf(li) {
  return li.querySelector(':scope > a, :scope > p > a');
}

function imageOf(li) {
  const img = li.querySelector(':scope img');
  if (!img) return null;
  const nested = submenuOf(li);
  if (nested && nested.contains(img)) return null;
  return img;
}

function labelOf(el) {
  if (!el) return '';
  const clone = el.cloneNode(true);
  clone.querySelectorAll('ul, picture, img, source').forEach((n) => n.remove());
  return clone.textContent.replace(/\s+/g, ' ').trim();
}

function triggerLabelOf(li) {
  const link = linkOf(li);
  if (link) { const t = labelOf(link); if (t) return t; }
  const nodes = [...li.childNodes];
  const stop = nodes.findIndex((n) => n.nodeType === Node.ELEMENT_NODE && n.tagName === 'UL');
  const scan = stop >= 0 ? nodes.slice(0, stop) : nodes;
  const found = scan.map((node) => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent.replace(/\s+/g, ' ').trim();
    if (node.nodeType === Node.ELEMENT_NODE && ['P', 'SPAN', 'A'].includes(node.tagName)) return labelOf(node);
    return '';
  }).find((t) => t);
  return found || labelOf(li);
}

function hrefOf(li) {
  const link = linkOf(li);
  return link ? link.getAttribute('href') : null;
}

// Build an <img> clone from a source <img>/<picture> keeping src + alt.
function cloneImage(sourceImg) {
  if (!sourceImg) return null;
  const img = document.createElement('img');
  const pic = sourceImg.closest('picture');
  const src = sourceImg.getAttribute('src')
    || (pic && pic.querySelector('source')?.getAttribute('srcset'))
    || sourceImg.getAttribute('srcset');
  if (src) [img.src] = src.split(',')[0].trim().split(' ');
  img.alt = sourceImg.getAttribute('alt') || '';
  img.loading = 'lazy';
  return img;
}

// A leaf item = an <li> with a link (a spec list is data, not links).
function isLinkItem(li) {
  return !!linkOf(li);
}

// ---------------------------------------------------------------------------
// Panel builders (generic, data-driven — read everything from the nav DOM)
// ---------------------------------------------------------------------------

// Split a panel's direct <li> children into image cards, text links and plain
// text data items (form headings / options).
function partitionPanelItems(itemsUl) {
  const lis = [...itemsUl.children].filter((el) => el.tagName === 'LI');
  const cards = [];
  const links = [];
  const plains = [];
  lis.forEach((li) => {
    if (isLinkItem(li)) {
      if (imageOf(li)) cards.push(li);
      else links.push(li);
    } else {
      plains.push(li);
    }
  });
  return { cards, links, plains };
}

function buildIconCard(li) {
  const a = document.createElement('a');
  a.href = hrefOf(li) || '#';
  a.className = 'nav-card';
  const img = imageOf(li);
  if (img) {
    const iconWrap = document.createElement('span');
    iconWrap.className = 'nav-card-icon';
    iconWrap.append(cloneImage(img));
    a.append(iconWrap);
  }
  const label = document.createElement('span');
  label.className = 'nav-card-label';
  label.textContent = labelOf(li);
  a.append(label);
  return a;
}

function buildTextLink(li) {
  const a = document.createElement('a');
  a.href = hrefOf(li) || '#';
  a.className = 'nav-link';
  a.textContent = labelOf(li);
  return a;
}

// Detect the dealer/search panel: plain text items naming a search + options.
function buildDealerSearch(plains) {
  const texts = plains.map((li) => labelOf(li)).filter(Boolean);
  if (texts.length < 2) return null;
  const [heading, ...options] = texts;
  const wrap = document.createElement('div');
  wrap.className = 'nav-dealer-search';
  const h = document.createElement('div');
  h.className = 'nav-dealer-title';
  h.textContent = heading;
  wrap.append(h);

  const opts = document.createElement('div');
  opts.className = 'nav-dealer-options';
  options.forEach((opt, i) => {
    const label = document.createElement('label');
    label.className = 'nav-dealer-option';
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'nav-dealer-mode';
    if (i === 0) radio.checked = true;
    const span = document.createElement('span');
    span.textContent = opt;
    label.append(radio, span);
    opts.append(label);
  });
  wrap.append(opts);

  const form = document.createElement('form');
  form.className = 'nav-dealer-form';
  form.addEventListener('submit', (e) => e.preventDefault());
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'NOME DA CONCESSIONÁRIA';
  input.autocomplete = 'off';
  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.setAttribute('aria-label', 'Buscar');
  btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24.981 24.981"><path d="M2.814,16.4a9.6,9.6,0,0,0,12.487.931l7.186,7.187a1.438,1.438,0,1,0,2.031-2.032L17.332,15.3A9.6,9.6,0,1,0,2.814,16.4M14.708,4.507a7.213,7.213,0,1,1-10.2,0,7.222,7.222,0,0,1,10.2,0" fill="currentColor"/></svg>';
  form.append(input, btn);
  wrap.append(form);
  return wrap;
}

// Standard dropdown: icon cards on the left, link column (or dealer search) right.
function buildStandardPanel(itemsUl) {
  const panel = document.createElement('div');
  panel.className = 'nav-panel nav-panel-standard';
  const inner = document.createElement('div');
  inner.className = 'nav-panel-inner';

  const { cards, links, plains } = partitionPanelItems(itemsUl);

  if (cards.length) {
    const cardsWrap = document.createElement('div');
    cardsWrap.className = 'nav-cards';
    cards.forEach((li) => cardsWrap.append(buildIconCard(li)));
    inner.append(cardsWrap);
  }

  const dealer = buildDealerSearch(plains);
  if (dealer) {
    inner.append(dealer);
  } else if (links.length) {
    const linksWrap = document.createElement('div');
    linksWrap.className = 'nav-links';
    links.forEach((li) => linksWrap.append(buildTextLink(li)));
    inner.append(linksWrap);
  }

  panel.append(inner);
  return panel;
}

// Veículos-style panel: featured hero detail + category tabs + selectable grid.
function buildVehiclePanel(itemsUl) {
  // Verbatim category tab labels authored in the fragment (leaf <li>s without a
  // link and without a nested spec list). Kept exactly as authored (e.g. "Todos (8)").
  const tabLabels = [...itemsUl.children]
    .filter((el) => el.tagName === 'LI' && !linkOf(el) && !submenuOf(el))
    .map((el) => el.textContent.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const vehicles = [...itemsUl.children]
    .filter((el) => el.tagName === 'LI' && linkOf(el))
    .map((li) => {
      const specsUl = submenuOf(li);
      const specItems = specsUl ? [...specsUl.children].filter((c) => c.tagName === 'LI') : [];
      let category = '';
      const specs = [];
      specItems.forEach((s, idx) => {
        const spans = [...s.querySelectorAll(':scope > span')];
        if (spans.length >= 2) {
          specs.push({ title: spans[0].textContent.trim(), value: spans.slice(1).map((sp) => sp.textContent.trim()).join(' ') });
          return;
        }
        const t = s.textContent.replace(/\s+/g, ' ').trim();
        const ci = t.indexOf(':');
        if (ci > -1) {
          specs.push({ title: t.slice(0, ci).trim(), value: t.slice(ci + 1).trim() });
          return;
        }
        if (idx === 0) category = t; // bare category word (e.g. "suv", "Lançamento")
      });
      return {
        name: labelOf(li),
        href: hrefOf(li) || '#',
        img: imageOf(li),
        category: category.toLowerCase(),
        specs,
      };
    });

  const panel = document.createElement('div');
  panel.className = 'nav-panel nav-panel-vehicles';
  const inner = document.createElement('div');
  inner.className = 'nav-panel-inner';

  // Featured detail (left)
  const featured = document.createElement('a');
  featured.className = 'nav-featured';
  const featTitle = document.createElement('div');
  featTitle.className = 'nav-featured-name';
  const featImgWrap = document.createElement('div');
  featImgWrap.className = 'nav-featured-image';
  const featSpecs = document.createElement('div');
  featSpecs.className = 'nav-featured-specs';
  featured.append(featTitle, featImgWrap, featSpecs);

  function showFeatured(v) {
    featured.href = v.href;
    featTitle.textContent = v.name;
    featImgWrap.replaceChildren();
    if (v.img) featImgWrap.append(cloneImage(v.img));
    featSpecs.replaceChildren();
    v.specs.forEach((sp) => {
      const item = document.createElement('div');
      item.className = 'nav-featured-spec';
      const st = document.createElement('span');
      st.className = 'spec-title';
      st.textContent = sp.title;
      const sv = document.createElement('span');
      sv.className = 'spec-value';
      sv.textContent = sp.value;
      item.append(st, sv);
      featSpecs.append(item);
    });
  }

  // Right side: tabs + grid
  const right = document.createElement('div');
  right.className = 'nav-vehicles-right';

  const tabsWrap = document.createElement('div');
  tabsWrap.className = 'nav-vehicle-tabs';

  const grid = document.createElement('div');
  grid.className = 'nav-vehicle-grid';

  const cardEls = vehicles.map((v) => {
    const card = document.createElement('a');
    card.className = 'nav-vehicle-card';
    card.href = v.href;
    card.dataset.category = v.category;
    const thumb = document.createElement('div');
    thumb.className = 'nav-vehicle-thumb';
    if (v.img) thumb.append(cloneImage(v.img));
    card.append(thumb);
    const nm = document.createElement('span');
    nm.textContent = v.name;
    card.append(nm);
    card.addEventListener('mouseenter', () => showFeatured(v));
    card.addEventListener('focus', () => showFeatured(v));
    grid.append(card);
    return { card, v };
  });

  // Category tabs: use the VERBATIM labels authored in the fragment
  // (e.g. "Todos (8)", "suv (5)"). The filter key is the leading word before the
  // count, lowercased; the first tab shows all.
  function activateTab(key, btn) {
    tabsWrap.querySelectorAll('button').forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    cardEls.forEach(({ card, v }) => {
      card.hidden = !(key === 'all' || v.category === key);
    });
  }

  tabLabels.forEach((labelText, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = labelText;
    const word = labelText.replace(/\s*\(.*\)\s*$/, '').trim().toLowerCase();
    const key = i === 0 ? 'all' : word;
    if (i === 0) btn.classList.add('is-active');
    btn.addEventListener('click', () => activateTab(key, btn));
    tabsWrap.append(btn);
  });

  right.append(tabsWrap, grid);
  inner.append(featured, right);
  panel.append(inner);

  if (vehicles.length) showFeatured(vehicles[0]);
  return panel;
}

// Decide which panel builder to use for a top-level trigger.
function buildPanelFor(li) {
  const itemsUl = submenuOf(li);
  if (!itemsUl) return null;
  // Vehicle panel: items have nested spec <ul> lists.
  const hasSpecs = [...itemsUl.children]
    .some((c) => c.tagName === 'LI' && submenuOf(c));
  if (hasSpecs) return buildVehiclePanel(itemsUl);
  return buildStandardPanel(itemsUl);
}

// ---------------------------------------------------------------------------
// Top-level nav assembly
// ---------------------------------------------------------------------------
function closeAllPanels(nav) {
  nav.querySelectorAll('.nav-item.is-open').forEach((el) => el.classList.remove('is-open'));
  nav.classList.remove('is-open');
  const ham = nav.querySelector('.nav-hamburger');
  if (ham) ham.setAttribute('aria-expanded', 'false');
}

function buildTopNav(nav, mainUl) {
  const list = document.createElement('ul');
  list.className = 'nav-list';
  const topItems = [...mainUl.children].filter((el) => el.tagName === 'LI');

  topItems.forEach((li) => {
    const item = document.createElement('li');
    item.className = 'nav-item';
    const label = triggerLabelOf(li);
    const href = hrefOf(li);
    const panel = buildPanelFor(li);

    const trigger = document.createElement('a');
    trigger.className = 'nav-item-trigger nav-trigger';
    trigger.textContent = label;
    trigger.href = href && !href.startsWith('#') ? href : '#';
    if (!href || href.startsWith('#')) {
      trigger.setAttribute('role', 'button');
      trigger.addEventListener('click', (e) => e.preventDefault());
    }
    item.append(trigger);

    if (panel) {
      item.classList.add('has-panel');
      trigger.setAttribute('aria-haspopup', 'true');

      // Mobile slide-in: prepend a back button that returns to the main drawer.
      const back = document.createElement('button');
      back.type = 'button';
      back.className = 'nav-panel-back';
      back.innerHTML = `<span class="nav-panel-back-arrow" aria-hidden="true"></span><span>${label}</span>`;
      back.addEventListener('click', (e) => {
        e.stopPropagation();
        item.classList.remove('is-open');
      });
      panel.insertBefore(back, panel.firstChild);

      item.append(panel);
      item.addEventListener('mouseenter', () => {
        if (isDesktop.matches) {
          nav.querySelectorAll('.nav-item.is-open').forEach((el) => { if (el !== item) el.classList.remove('is-open'); });
          item.classList.add('is-open');
        }
      });
      item.addEventListener('mouseleave', () => {
        if (isDesktop.matches) item.classList.remove('is-open');
      });
      trigger.addEventListener('click', (e) => {
        // Mobile: a panel item is a toggle, never a link — open the slide-in
        // sub-panel and suppress navigation even when the trigger has an href.
        if (!isDesktop.matches) {
          e.preventDefault();
          item.classList.add('is-open');
        }
      });
    }
    list.append(item);
  });
  return list;
}

// ---------------------------------------------------------------------------
// decorate
// ---------------------------------------------------------------------------
/**
 * loads and decorates the header/nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // metadata-independent dual fetch: /content first (localhost), then root (DA/EDS prod)
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return;
  const html = await resp.text();
  const fragment = document.createElement('div');
  fragment.innerHTML = html;

  const sections = [...fragment.children].filter((el) => el.tagName === 'DIV');
  const logoSection = sections[0];
  const navSection = sections.find((s) => s.querySelector(':scope > ul'));
  const ctaSection = sections[2];
  const brandSection = sections[sections.length - 1] !== navSection
    ? sections[sections.length - 1] : null;

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main navigation');

  const container = document.createElement('div');
  container.className = 'nav-container';

  // Left cluster: hamburger + divider + logo
  const left = document.createElement('div');
  left.className = 'nav-left';

  const hamburger = document.createElement('button');
  hamburger.className = 'nav-hamburger';
  hamburger.type = 'button';
  hamburger.setAttribute('aria-label', 'Menu');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.innerHTML = '<span></span><span></span><span></span>';
  left.append(hamburger);

  const divider = document.createElement('span');
  divider.className = 'nav-divider';
  left.append(divider);

  if (logoSection) {
    const logoLink = logoSection.querySelector('a');
    const logo = document.createElement('a');
    logo.className = 'nav-logo';
    logo.href = logoLink ? logoLink.getAttribute('href') : '/';
    logo.setAttribute('aria-label', 'Hyundai');
    const logoImg = logoSection.querySelector('img');
    if (logoImg) logo.append(cloneImage(logoImg));
    left.append(logo);
  }
  container.append(left);

  // Main nav list
  const mainUl = navSection ? navSection.querySelector(':scope > ul') : null;
  if (mainUl) container.append(buildTopNav(nav, mainUl));

  // Ofertas CTA
  if (ctaSection && ctaSection !== navSection) {
    const ctaLink = ctaSection.querySelector('a');
    if (ctaLink) {
      const cta = document.createElement('a');
      cta.className = 'nav-cta';
      cta.href = ctaLink.getAttribute('href');
      cta.textContent = labelOf(ctaLink);
      container.append(cta);
    }
  }

  // Hamburger brand panel (last section)
  const brandUl = brandSection && brandSection !== navSection
    ? brandSection.querySelector(':scope > ul') : null;
  if (brandUl) {
    const brandPanel = buildStandardPanel(brandUl);
    brandPanel.classList.add('nav-brand-panel');
    hamburger.setAttribute('aria-haspopup', 'true');
    hamburger.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) nav.querySelectorAll('.nav-item.is-open').forEach((el) => el.classList.remove('is-open'));
    });
    container.append(brandPanel);
  }

  nav.append(container);
  block.append(nav);

  // Close panels on outside click / Escape
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) closeAllPanels(nav);
  });
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') closeAllPanels(nav);
  });

  // Viewport resize handling: reset state when crossing the breakpoint.
  isDesktop.addEventListener('change', () => {
    closeAllPanels(nav);
  });
}
