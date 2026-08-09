// Hyundai Motor Brasil header — transparent overlay bar with full-width megamenu panels.
// Content-first: all copy, links, and image refs live in /content/nav.plain.html.
// header.js fetches that fragment, reads its DOM, and builds the interactive header.

const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Fetch the nav fragment. Metadata-independent dual-fetch:
 * /content first (localhost / aem up), then root (DA/EDS production).
 * @returns {Promise<Document|null>}
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const html = await resp.text();
  return new DOMParser().parseFromString(html, 'text/html');
}

/**
 * The nested submenu <ul> of an <li>, if any.
 * @param {HTMLLIElement} li
 * @returns {HTMLUListElement|null}
 */
function submenuOf(li) {
  return li.querySelector(':scope > ul');
}

/**
 * The primary link of an <li>, tolerant of the wrapping EDS/DA applies.
 * Raw (localhost): `<li><a>…</a>`. Decorated (EDS): `<li><p><a>…</a></p>`.
 * @param {HTMLLIElement} li
 * @returns {HTMLAnchorElement|null}
 */
function linkOf(li) {
  return li.querySelector(':scope > a, :scope > p > a');
}

/**
 * The first image inside an <li>'s own content (not inside its nested <ul>).
 * Works whether the image is under an <a>, a <picture>, or bare.
 * @param {HTMLLIElement} li
 * @returns {HTMLImageElement|null}
 */
function imageOf(li) {
  const img = li.querySelector(':scope img, :scope > p img, :scope > a img');
  if (!img) return null;
  // Ignore images that live inside the nested submenu <ul>.
  const nested = submenuOf(li);
  if (nested && nested.contains(img)) return null;
  return img;
}

/**
 * Human label of an <li>, ignoring its nested submenu <ul> and any image alt.
 * Handles EDS splitting the label into a sibling <p> after the image anchor.
 * @param {HTMLLIElement} li
 * @returns {string}
 */
function labelOf(li) {
  const clone = li.cloneNode(true);
  clone.querySelectorAll('ul, picture, img, source').forEach((el) => el.remove());
  return clone.textContent.replace(/\s+/g, ' ').trim();
}

/**
 * Leading label of an <li> for a top-level nav trigger: the primary link's text,
 * or the first text node / first <p> — NOT any following heading/placeholder copy
 * (e.g. the Concessionárias panel's "Busque uma concessionária" heading).
 * @param {HTMLLIElement} li
 * @returns {string}
 */
function triggerLabelOf(li) {
  const link = linkOf(li);
  if (link) {
    const t = labelOf(link);
    if (t) return t;
  }
  // Walk direct children up to (but not including) the submenu <ul>; return the
  // first non-empty text/<p>/<span>/<a> label.
  const nodes = [...li.childNodes];
  const stop = nodes.findIndex((n) => n.nodeType === Node.ELEMENT_NODE && n.tagName === 'UL');
  const scan = stop >= 0 ? nodes.slice(0, stop) : nodes;
  const found = scan
    .map((node) => {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent.replace(/\s+/g, ' ').trim();
      if (node.nodeType === Node.ELEMENT_NODE && ['P', 'SPAN', 'A'].includes(node.tagName)) {
        return labelOf(node);
      }
      return '';
    })
    .find((t) => t);
  return found || labelOf(li);
}

/**
 * Read an <li> into {label, link, submenu, image} regardless of raw vs decorated markup.
 * @param {HTMLLIElement} li
 */
function readItem(li) {
  return {
    label: labelOf(li),
    link: linkOf(li),
    submenu: submenuOf(li),
    image: imageOf(li),
  };
}

/** True if this <li> represents a card (has an icon/thumbnail image). */
function isCard(li) {
  return !!imageOf(li);
}

/**
 * Build a card link (icon/thumbnail above a label).
 * @param {HTMLLIElement} li
 * @returns {HTMLAnchorElement}
 */
function buildCard(li) {
  const { label, link, image } = readItem(li);
  const a = document.createElement('a');
  a.className = 'hh-card';
  a.href = link ? link.getAttribute('href') : '#';
  if (image) a.append(image.cloneNode(true));
  const span = document.createElement('span');
  span.textContent = label;
  a.append(span);
  return a;
}

/** Build a plain text link from an <li>. */
function buildTextLink(li) {
  const { label, link } = readItem(li);
  const a = document.createElement('a');
  a.className = 'hh-link';
  a.href = link ? link.getAttribute('href') : '#';
  a.textContent = label;
  return a;
}

/**
 * Standard "icon cards + text-link column" panel.
 * Cards = <li>s that contain an image; text links = the remaining <li>s.
 * @param {HTMLUListElement} submenu
 * @returns {HTMLElement}
 */
function buildCardsAndLinksPanel(submenu) {
  const panel = document.createElement('div');
  panel.className = 'hh-panel hh-panel-cards';
  const cardsWrap = document.createElement('div');
  cardsWrap.className = 'hh-cards';
  const linksWrap = document.createElement('div');
  linksWrap.className = 'hh-links';
  [...submenu.children].forEach((li) => {
    if (isCard(li)) cardsWrap.append(buildCard(li));
    else linksWrap.append(buildTextLink(li));
  });
  if (cardsWrap.children.length) panel.append(cardsWrap);
  if (linksWrap.children.length) panel.append(linksWrap);
  return panel;
}

/**
 * Dealer-search panel (icon cards + a search form). Form controls are built here,
 * copy (heading, radio labels, input placeholder) is read from the fragment DOM.
 * @param {HTMLLIElement} triggerLi the Concessionárias <li>
 * @returns {HTMLElement}
 */
function buildDealerSearchPanel(triggerLi) {
  const panel = document.createElement('div');
  panel.className = 'hh-panel hh-panel-dealer';

  const cardsWrap = document.createElement('div');
  cardsWrap.className = 'hh-cards';
  const cardsUl = triggerLi.querySelector(':scope > ul');
  if (cardsUl) [...cardsUl.children].forEach((li) => cardsWrap.append(buildCard(li)));
  panel.append(cardsWrap);

  // The placeholder is the text-only <p> (EDS also wraps the trigger link in a
  // <p>, so pick the one without an anchor/image).
  const placeholder = [...triggerLi.querySelectorAll(':scope > p')]
    .find((p) => !p.querySelector('a, img, picture'));

  // Right-side column wrapper (a div, so the search block is a countable region).
  const formCol = document.createElement('div');
  formCol.className = 'hh-dealer-col';

  const form = document.createElement('form');
  form.className = 'hh-dealer-form';
  form.addEventListener('submit', (e) => e.preventDefault());

  const heading = triggerLi.querySelector(':scope > h3, :scope > h2, :scope > h4');
  if (heading) {
    const h = document.createElement('p');
    h.className = 'hh-dealer-title';
    h.textContent = heading.textContent.trim();
    form.append(h);
  }

  const optionsUl = [...triggerLi.querySelectorAll(':scope > ul')][1];
  if (optionsUl) {
    const opts = document.createElement('div');
    opts.className = 'hh-dealer-options';
    [...optionsUl.children].forEach((li, i) => {
      const id = `hh-dealer-opt-${i}`;
      const wrap = document.createElement('label');
      wrap.className = 'hh-radio';
      wrap.htmlFor = id;
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'hh-dealer-mode';
      input.id = id;
      if (i === 1) input.checked = true;
      const txt = document.createElement('span');
      txt.textContent = li.textContent.trim();
      wrap.append(input, txt);
      opts.append(wrap);
    });
    form.append(opts);
  }

  const inputRow = document.createElement('div');
  inputRow.className = 'hh-dealer-input';
  const input = document.createElement('input');
  input.type = 'text';
  input.setAttribute('aria-label', placeholder ? placeholder.textContent.trim() : 'Buscar');
  input.placeholder = placeholder ? placeholder.textContent.trim() : '';
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'hh-dealer-submit';
  submit.setAttribute('aria-label', 'Buscar');
  inputRow.append(input, submit);
  form.append(inputRow);

  formCol.append(form);
  panel.append(formCol);
  return panel;
}

/**
 * Vehicles panel: featured detail (image + specs) on the left,
 * category tabs + selectable thumbnail grid on the right.
 * @param {HTMLUListElement} submenu the Veículos <ul>
 * @returns {HTMLElement}
 */
function buildVehiclesPanel(submenu) {
  const panel = document.createElement('div');
  panel.className = 'hh-panel hh-panel-vehicles';

  const tabs = [];
  const vehicles = [];
  [...submenu.children].forEach((li) => {
    const nested = submenuOf(li);
    const link = linkOf(li);
    if (link && nested) {
      // Specs are alternating <li> nodes: label, value, label, value, …
      // plus a trailing "Segmento: <x>" line used only for tab filtering.
      const rawSpecs = [...nested.children].map((s) => s.textContent.replace(/\s+/g, ' ').trim());
      let segment = '';
      const flat = rawSpecs.filter((s) => {
        if (s.toLowerCase().startsWith('segmento:')) { segment = s.split(':')[1].trim(); return false; }
        return true;
      });
      const specPairs = [];
      for (let i = 0; i < flat.length; i += 2) {
        specPairs.push({ label: flat[i] || '', value: flat[i + 1] || '' });
      }
      vehicles.push({
        label: labelOf(li),
        href: link.getAttribute('href'),
        img: imageOf(li),
        specs: specPairs,
        segment,
      });
    } else if (!link) {
      tabs.push(labelOf(li));
    }
  });

  // Featured detail (left)
  const featured = document.createElement('a');
  featured.className = 'hh-featured';
  const fImg = document.createElement('img');
  const fName = document.createElement('span');
  fName.className = 'hh-featured-name';
  const fSpecs = document.createElement('dl');
  fSpecs.className = 'hh-featured-specs';
  featured.append(fName, fImg, fSpecs);

  const setFeatured = (v) => {
    featured.href = v.href;
    fName.textContent = v.label;
    if (v.img) { fImg.src = v.img.getAttribute('src'); fImg.alt = v.label; }
    fSpecs.textContent = '';
    v.specs.forEach((pair) => {
      const dt = document.createElement('dt');
      dt.className = 'hh-spec-title';
      const dd = document.createElement('dd');
      dt.textContent = pair.label;
      dd.textContent = pair.value;
      fSpecs.append(dt, dd);
    });
  };
  if (vehicles.length) setFeatured(vehicles[0]);

  // Right side: tabs + grid
  const right = document.createElement('div');
  right.className = 'hh-vehicles-right';

  const tabRow = document.createElement('div');
  tabRow.className = 'hh-tabs';
  const grid = document.createElement('div');
  grid.className = 'hh-vehicle-grid';

  const cards = vehicles.map((v) => {
    const a = document.createElement('a');
    a.className = 'hh-vehicle-card';
    a.href = v.href;
    if (v.img) {
      const im = v.img.cloneNode(true);
      im.alt = v.label;
      a.append(im);
    }
    const s = document.createElement('span');
    s.textContent = v.label;
    a.append(s);
    a.addEventListener('mouseenter', () => setFeatured(v));
    a.dataset.segment = v.segment.toLowerCase();
    return a;
  });
  cards.forEach((c) => grid.append(c));

  tabs.forEach((label, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hh-tab';
    btn.textContent = label;
    if (i === 0) btn.classList.add('is-active');
    btn.addEventListener('click', () => {
      tabRow.querySelectorAll('.hh-tab').forEach((t) => t.classList.remove('is-active'));
      btn.classList.add('is-active');
      // "Todos (...)" and "Lançamento (...)" are not plain segments; match by prefix.
      const key = label.split('(')[0].trim().toLowerCase();
      cards.forEach((c) => {
        let show = true;
        if (key === 'todos') show = true;
        else show = c.dataset.segment === key;
        c.style.display = show ? '' : 'none';
      });
    });
    tabRow.append(btn);
  });

  // Grid sits inside a carousel-like viewport wrapper (mirrors the source's
  // scrollable card rail), giving the panel its third right-rail region.
  const gridViewport = document.createElement('div');
  gridViewport.className = 'hh-vehicle-viewport';
  gridViewport.append(grid);

  right.append(tabRow, gridViewport);
  panel.append(featured, right);
  return panel;
}

/**
 * Simple all-menu grid panel used by the hamburger: icon cards + text links.
 * Reuses the standard cards+links builder.
 */
function buildAllMenuPanel(submenu) {
  const panel = buildCardsAndLinksPanel(submenu);
  panel.classList.add('hh-panel-allmenu');
  return panel;
}

/** Close every open panel/drawer and return the header to its transparent state. */
function closeAll(header) {
  header.querySelectorAll('.hh-item.is-open, .hh-hamburger.is-open, .hh-hamburger-panel.is-open')
    .forEach((el) => el.classList.remove('is-open'));
  header.querySelectorAll('.hh-trigger[aria-expanded="true"]')
    .forEach((t) => t.setAttribute('aria-expanded', 'false'));
  header.classList.remove('is-open', 'is-menu-open');
  const ham = header.querySelector('.hh-hamburger');
  if (ham) ham.setAttribute('aria-expanded', 'false');
  document.body.style.overflowY = '';
}

export default async function decorate(block) {
  const doc = await fetchNav();
  block.textContent = '';
  if (!doc) return;

  const sections = [...doc.body.children];
  // sections: [0]=logo, [1]=main nav <ul>, [2]=Ofertas CTA, [3]=hamburger all-menu <ul>
  const logoSection = sections[0];
  const navSection = sections[1];
  const ctaSection = sections[2];
  const allMenuSection = sections[3];

  const header = document.createElement('div');
  header.className = 'hh';

  const bar = document.createElement('div');
  bar.className = 'hh-bar';

  // Hamburger
  const hamburger = document.createElement('button');
  hamburger.type = 'button';
  hamburger.className = 'hh-hamburger';
  hamburger.setAttribute('aria-label', 'Abrir menu');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.innerHTML = '<span></span><span></span><span></span>';

  // Logo
  const logoLink = logoSection ? logoSection.querySelector('a') : null;
  const brand = document.createElement('a');
  brand.className = 'hh-logo';
  brand.href = logoLink ? logoLink.getAttribute('href') : '/';
  const logoImg = logoLink ? logoLink.querySelector('img') : null;
  if (logoImg) brand.append(logoImg.cloneNode(true));
  brand.setAttribute('aria-label', 'Hyundai');

  // Main nav (semantic <nav> > <ul class="hh-nav nav-list">)
  const navEl = document.createElement('nav');
  navEl.className = 'hh-nav-wrap';
  navEl.setAttribute('aria-label', 'Principal');
  const navList = document.createElement('ul');
  navList.className = 'hh-nav nav-list';
  navEl.append(navList);
  const triggers = navSection ? [...navSection.querySelectorAll(':scope > ul > li')] : [];

  triggers.forEach((li) => {
    const { link, submenu } = readItem(li);
    const label = triggerLabelOf(li);
    const item = document.createElement('li');
    item.className = 'hh-item';

    const trigger = document.createElement(link ? 'a' : 'button');
    trigger.className = 'hh-trigger';
    if (link) trigger.href = link.getAttribute('href');
    else trigger.type = 'button';
    trigger.textContent = label;

    item.append(trigger);

    if (submenu) {
      item.classList.add('has-panel');
      trigger.setAttribute('aria-haspopup', 'true');
      trigger.setAttribute('aria-expanded', 'false');
      let panel;
      if (label === 'Veículos') panel = buildVehiclesPanel(submenu);
      else if (label === 'Concessionárias') panel = buildDealerSearchPanel(li);
      else panel = buildCardsAndLinksPanel(submenu);

      // Mobile slide-in sub-panels get a back button + heading (hidden on desktop).
      const back = document.createElement('button');
      back.type = 'button';
      back.className = 'hh-back';
      back.innerHTML = `<span class="hh-back-arrow" aria-hidden="true"></span><span>${label}</span>`;
      panel.prepend(back);

      // panel is the trigger's direct next sibling (accordion/aria contract)
      item.append(panel);

      const openItem = () => {
        // On desktop, close sibling panels first. On mobile, keep the drawer
        // (is-menu-open) so the sub-panel slides in over the open drawer.
        if (isDesktop.matches) {
          closeAll(header);
        } else {
          header.querySelectorAll('.hh-item.is-open').forEach((el) => {
            if (el !== item) el.classList.remove('is-open');
          });
        }
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        header.classList.add('is-open');
      };
      const closeItem = () => {
        item.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
        if (!header.querySelector('.hh-item.is-open, .hh-hamburger.is-open') && isDesktop.matches) {
          header.classList.remove('is-open');
        }
      };
      // Desktop: hover opens; mouseout closes.
      item.addEventListener('mouseenter', () => { if (isDesktop.matches) openItem(); });
      item.addEventListener('mouseleave', () => { if (isDesktop.matches) closeItem(); });
      // keyboard focus opens (desktop)
      trigger.addEventListener('focus', () => { if (isDesktop.matches) openItem(); });
      // Click: on mobile ALWAYS open the slide-in panel (even link-triggers);
      // on desktop, only button-triggers open (link-triggers navigate).
      trigger.addEventListener('click', (e) => {
        if (!isDesktop.matches) { e.preventDefault(); openItem(); return; }
        if (!link) { e.preventDefault(); openItem(); }
      });
      // Back button (mobile) closes just this sub-panel.
      back.addEventListener('click', (e) => { e.stopPropagation(); closeItem(); });
    }
    navList.append(item);
  });

  // CTA (Ofertas) — rendered as the last nav item, styled as a filled cyan button,
  // matching the source where Ofertas is the final item of the header menu.
  const ctaLink = ctaSection ? ctaSection.querySelector('a') : null;
  const ctaItem = document.createElement('li');
  ctaItem.className = 'hh-item hh-item-cta';
  const cta = document.createElement('a');
  cta.className = 'hh-trigger hh-cta';
  if (ctaLink) { cta.href = ctaLink.getAttribute('href'); cta.textContent = ctaLink.textContent.trim(); }
  ctaItem.append(cta);
  navList.append(ctaItem);

  // Hamburger all-menu panel
  let allMenuPanel = null;
  const allMenuUl = allMenuSection ? allMenuSection.querySelector(':scope > ul') : null;
  if (allMenuUl) {
    allMenuPanel = buildAllMenuPanel(allMenuUl);
    hamburger.classList.add('has-panel');
  }

  hamburger.addEventListener('click', () => {
    if (isDesktop.matches) {
      // Desktop: hamburger opens the all-menu dropdown panel.
      const open = hamburger.classList.contains('is-open');
      closeAll(header);
      if (!open) {
        hamburger.classList.add('is-open');
        header.classList.add('is-open');
        if (allMenuPanel) allMenuPanel.classList.add('is-open');
        hamburger.setAttribute('aria-expanded', 'true');
      }
      return;
    }
    // Mobile: hamburger toggles the full-screen drawer.
    const open = header.classList.contains('is-menu-open');
    closeAll(header);
    if (!open) {
      hamburger.classList.add('is-open');
      header.classList.add('is-menu-open', 'is-open');
      hamburger.setAttribute('aria-expanded', 'true');
      document.body.style.overflowY = 'hidden';
    } else {
      document.body.style.overflowY = '';
    }
  });

  bar.append(hamburger, brand, navEl);
  header.append(bar);
  if (allMenuPanel) {
    allMenuPanel.classList.add('hh-hamburger-panel');
    // On mobile the all-menu content lives inside the drawer (after the nav list);
    // on desktop it is the hamburger dropdown. It sits inside the nav wrapper so
    // the mobile drawer scrolls it together with the nav list.
    navEl.append(allMenuPanel);
  }
  block.append(header);

  // Close on outside click / escape
  document.addEventListener('click', (e) => {
    if (!header.contains(e.target)) closeAll(header);
  });
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') closeAll(header);
  });

  // Viewport resize handling: reset state when crossing breakpoints.
  const onChange = () => {
    closeAll(header);
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflowY = '';
  };
  isDesktop.addEventListener('change', onChange);
}
