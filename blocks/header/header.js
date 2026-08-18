// Hyundai-style header.
// Desktop: transparent bar over hero that turns solid on open, hover megamenus
// (icon-card highlights + text links), a vehicle showcase panel (featured detail +
// selectable grid + category filters), and a click hamburger panel.
// Mobile: hamburger opens a full-screen slide-in drawer combining the nav triggers,
// icon cards, and text links; tapping a trigger slides in a sub-panel with a back
// button. All copy/links/images come from /content/nav.plain.html.

const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Fetch the nav fragment. Metadata-independent: /content first (localhost),
 * then root (DA/EDS production).
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const html = await resp.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body;
}

/** Build an icon-card highlight link from a source <li><a><img>label</a>. */
function buildHighlight(a) {
  const link = document.createElement('a');
  link.href = a.getAttribute('href');
  link.className = 'nav-highlight';
  const img = a.querySelector('img');
  if (img) {
    const i = document.createElement('img');
    i.src = img.getAttribute('src');
    i.alt = img.getAttribute('alt') || '';
    i.loading = 'lazy';
    link.append(i);
  }
  const span = document.createElement('span');
  span.textContent = a.textContent.trim();
  link.append(span);
  return link;
}

/** Build a plain text link. */
function buildTextLink(a) {
  const link = document.createElement('a');
  link.href = a.getAttribute('href');
  link.className = 'nav-link';
  link.textContent = a.textContent.trim();
  return link;
}

/**
 * Build a standard panel from the group's content elements. Handles:
 *  - <ul> of links with <img> -> icon-card highlights
 *  - <ul> of links without <img> -> text-link list
 *  - <ul> of plain <li> (no links) -> tab/segmented control (e.g. search modes)
 *  - <h3> -> section heading
 *  - <p> -> search input placeholder (renders a labelled search field)
 * @param {Element[]} content the group's content elements (order preserved)
 */
function buildStandardPanel(content) {
  const panel = document.createElement('div');
  panel.className = 'nav-panel';
  const inner = document.createElement('div');
  inner.className = 'nav-panel-inner';
  panel.append(inner);

  content.forEach((el) => {
    if (el.tagName === 'UL') {
      const anchors = [...el.querySelectorAll('a')];
      if (anchors.length) {
        const hasImg = anchors.some((a) => a.querySelector('img'));
        const group = document.createElement('div');
        group.className = hasImg ? 'nav-highlights' : 'nav-links';
        anchors.forEach((a) => group.append(hasImg ? buildHighlight(a) : buildTextLink(a)));
        inner.append(group);
      } else {
        const tabs = document.createElement('div');
        tabs.className = 'nav-tabs';
        [...el.querySelectorAll('li')].forEach((li, idx) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'nav-tab';
          if (idx === 0) btn.classList.add('active');
          btn.textContent = li.textContent.trim();
          btn.addEventListener('click', () => {
            tabs.querySelectorAll('.nav-tab').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
          });
          tabs.append(btn);
        });
        inner.append(tabs);
      }
    } else if (el.tagName === 'H3') {
      const h = document.createElement('h3');
      h.className = 'nav-panel-heading';
      h.textContent = el.textContent.trim();
      inner.append(h);
    } else if (el.tagName === 'P') {
      const form = document.createElement('div');
      form.className = 'nav-search';
      const input = document.createElement('input');
      input.type = 'search';
      input.placeholder = el.textContent.trim();
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nav-search-submit';
      btn.setAttribute('aria-label', 'Buscar');
      form.append(input, btn);
      inner.append(form);
    }
  });
  return panel;
}

/**
 * Build the vehicle showcase panel: featured detail (image + specs) on the left,
 * category filters + selectable grid on the right. Hovering a card updates featured.
 */
function buildVehiclePanel(filtersUl, carsUl, specsDl) {
  const panel = document.createElement('div');
  panel.className = 'nav-panel nav-panel-vehicles';
  const inner = document.createElement('div');
  inner.className = 'nav-panel-inner';
  panel.append(inner);

  const cars = [...carsUl.querySelectorAll('a')].map((a) => {
    const img = a.querySelector('img');
    const raw = a.childNodes[0] ? a.childNodes[0].textContent : a.textContent;
    const [name, category] = raw.split('|').map((s) => s.trim());
    return {
      name,
      category: (category || '').toLowerCase(),
      href: a.getAttribute('href'),
      img: img ? img.getAttribute('src') : '',
      alt: img ? img.getAttribute('alt') : name,
    };
  });

  const specs = [];
  if (specsDl) {
    const dts = [...specsDl.querySelectorAll('dt')];
    const dds = [...specsDl.querySelectorAll('dd')];
    dts.forEach((dt, i) => specs.push({ label: dt.textContent.trim(), value: dds[i] ? dds[i].textContent.trim() : '' }));
  }

  const featured = document.createElement('a');
  featured.className = 'nav-featured';
  const featTitle = document.createElement('span');
  featTitle.className = 'nav-featured-title';
  const featImg = document.createElement('img');
  featImg.loading = 'lazy';
  const featSpecs = document.createElement('div');
  featSpecs.className = 'nav-featured-specs';
  featured.append(featTitle, featImg, featSpecs);

  function setFeatured(car, carSpecs) {
    featured.href = car.href;
    featTitle.textContent = car.name;
    featImg.src = car.img;
    featImg.alt = car.alt;
    featSpecs.innerHTML = '';
    (carSpecs || []).forEach((s) => {
      const spec = document.createElement('div');
      const l = document.createElement('span');
      l.className = 'spec-title';
      l.textContent = s.label;
      const v = document.createElement('span');
      v.className = 'spec-value';
      v.textContent = s.value;
      spec.append(l, v);
      featSpecs.append(spec);
    });
  }
  setFeatured(cars[0], specs);

  const right = document.createElement('div');
  right.className = 'nav-vehicles-right';

  const filters = document.createElement('div');
  filters.className = 'nav-vehicle-filters';
  const filterButtons = [...filtersUl.querySelectorAll('li')].map((li, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nav-vehicle-filter';
    btn.textContent = li.textContent.trim();
    if (idx === 0) btn.classList.add('active');
    const key = li.textContent.trim().split('(')[0].trim().toLowerCase();
    btn.dataset.filter = key;
    return btn;
  });
  filterButtons.forEach((b) => filters.append(b));

  const grid = document.createElement('div');
  grid.className = 'nav-vehicle-grid';
  const cardEls = cars.map((car) => {
    const card = document.createElement('div');
    card.className = 'nav-vehicle-card';
    card.dataset.category = car.category;
    const link = document.createElement('a');
    link.className = 'nav-vehicle-card-link';
    link.href = car.href;
    const img = document.createElement('img');
    img.src = car.img;
    img.alt = car.alt;
    img.loading = 'lazy';
    const label = document.createElement('span');
    label.textContent = car.name;
    link.append(img, label);
    card.append(link);
    card.addEventListener('mouseenter', () => setFeatured(car, car === cars[0] ? specs : null));
    return card;
  });
  cardEls.forEach((c) => grid.append(c));

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const key = btn.dataset.filter;
      cardEls.forEach((card) => {
        const show = key === 'todos' || card.dataset.category === key;
        card.style.display = show ? '' : 'none';
      });
    });
  });

  right.append(filters, grid);
  inner.append(featured, right);
  return panel;
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  block.textContent = '';
  const body = await fetchNav();
  if (!body) return;

  const sections = [...body.children];
  const logoSection = sections[0];
  const hamburgerSection = sections[sections.length - 1];
  const mainSection = sections[1];

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main navigation');

  // --- Hamburger button ---
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  const hamButton = document.createElement('button');
  hamButton.type = 'button';
  hamButton.className = 'nav-hamburger-icon';
  hamButton.setAttribute('aria-label', 'Open menu');
  hamButton.setAttribute('aria-expanded', 'false');
  hamButton.innerHTML = '<span></span><span></span><span></span>';
  hamburger.append(hamButton);

  // --- Logo ---
  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  const logoLink = logoSection.querySelector('a');
  if (logoLink) {
    const a = document.createElement('a');
    a.href = logoLink.getAttribute('href');
    a.className = 'nav-logo';
    a.setAttribute('aria-label', 'Hyundai Motor Brasil');
    const img = logoLink.querySelector('img');
    if (img) {
      const i = document.createElement('img');
      i.src = img.getAttribute('src');
      i.alt = img.getAttribute('alt') || 'Hyundai';
      a.append(i);
    }
    brand.append(a);
  }

  // --- Main nav items (triggers + panels) ---
  const list = document.createElement('ul');
  list.className = 'nav-list';

  const groups = [];
  let current = null;
  [...mainSection.children].forEach((el) => {
    if (el.tagName === 'H2') {
      current = { heading: el, content: [] };
      groups.push(current);
    } else if (current) {
      current.content.push(el);
    }
  });

  /** Add a mobile-only back button to a panel that slides it away. */
  function addBackButton(panel, label, li) {
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'nav-back';
    back.textContent = label;
    back.addEventListener('click', (e) => {
      e.stopPropagation();
      li.classList.remove('open');
      nav.classList.remove('subpanel-open');
    });
    panel.querySelector('.nav-panel-inner').prepend(back);
  }

  groups.forEach((group) => {
    const li = document.createElement('li');
    li.className = 'nav-item';
    const headingLink = group.heading.querySelector('a');
    const label = group.heading.textContent.trim();

    const trigger = document.createElement(headingLink ? 'a' : 'button');
    trigger.className = 'nav-item-trigger';
    if (headingLink) trigger.href = headingLink.getAttribute('href');
    else trigger.type = 'button';
    trigger.textContent = label;
    li.append(trigger);

    if (label === 'Ofertas') li.classList.add('nav-cta');

    const lists = group.content.filter((c) => c.tagName === 'UL');
    const dl = group.content.find((c) => c.tagName === 'DL');

    let panel = null;
    if (label === 'Veículos' && lists.length >= 2) {
      panel = buildVehiclePanel(lists[0], lists[1], dl);
    } else if (group.content.length) {
      panel = buildStandardPanel(group.content);
    }

    if (panel) {
      li.append(panel);
      li.classList.add('has-panel');
      addBackButton(panel, label, li);

      // Hover to open (desktop)
      li.addEventListener('mouseenter', () => {
        if (isDesktop.matches) {
          nav.querySelectorAll('.nav-item.open').forEach((el) => el.classList.remove('open'));
          li.classList.add('open');
          nav.classList.add('is-open');
        }
      });
      li.addEventListener('mouseleave', () => {
        if (isDesktop.matches) {
          li.classList.remove('open');
          if (!nav.querySelector('.nav-item.open')) nav.classList.remove('is-open');
        }
      });
      // Tap to slide in sub-panel (mobile)
      trigger.addEventListener('click', (e) => {
        if (!isDesktop.matches) {
          e.preventDefault();
          li.classList.add('open');
          nav.classList.add('subpanel-open');
        }
      });
    }
    list.append(li);
  });

  // --- Extra content (icon cards + text links) from the hamburger section.
  // Desktop: shown as the hamburger dropdown. Mobile: part of the drawer. ---
  const extra = buildStandardPanel([...hamburgerSection.children].filter((c) => c.tagName === 'UL'));
  extra.classList.add('nav-extra');

  // --- Drawer holds the nav list + extra content (used on mobile). ---
  const drawer = document.createElement('div');
  drawer.className = 'nav-drawer';
  drawer.append(list, extra);

  /** Close everything. */
  function closeAll() {
    nav.classList.remove('is-open', 'subpanel-open');
    nav.querySelectorAll('.nav-item.open').forEach((el) => el.classList.remove('open'));
    hamButton.setAttribute('aria-expanded', 'false');
    hamButton.setAttribute('aria-label', 'Open menu');
  }

  // Hamburger toggles: desktop -> extra dropdown; mobile -> full drawer.
  hamButton.addEventListener('click', () => {
    const wasOpen = nav.classList.contains('menu-open');
    if (wasOpen) {
      nav.classList.remove('menu-open');
      closeAll();
    } else {
      nav.classList.add('menu-open', 'is-open');
      hamButton.setAttribute('aria-expanded', 'true');
      hamButton.setAttribute('aria-label', 'Close menu');
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      nav.classList.remove('menu-open');
      closeAll();
    }
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) {
      nav.classList.remove('menu-open');
      closeAll();
    }
  });

  // Viewport resize handling: reset menus when crossing the breakpoint.
  isDesktop.addEventListener('change', () => {
    nav.classList.remove('menu-open');
    closeAll();
  });

  nav.append(hamburger, brand, drawer);

  const wrapper = document.createElement('div');
  wrapper.className = 'nav-wrapper';
  wrapper.append(nav);
  block.append(wrapper);
}
