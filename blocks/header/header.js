// Hyundai Brazil header — content-driven from /nav.plain.html.
// All copy/links/images live in content/nav.plain.html; this file reads and renders.

const isDesktop = window.matchMedia('(min-width: 900px)');

/* ---- tolerant fragment helpers (raw localhost + DA-decorated shapes) ---- */
function linkOf(li) {
  return li.querySelector(':scope > a, :scope > p > a, :scope > p a');
}

function imageOf(scope) {
  return scope.querySelector('picture') || scope.querySelector('img');
}

function labelOf(a) {
  // text of an anchor, excluding image alt duplication and nested spec lists
  const clone = a.cloneNode(true);
  clone.querySelectorAll('img, picture, ul').forEach((n) => n.remove());
  return clone.textContent.replace(/\s+/g, ' ').trim();
}

function closeAllPanels(nav) {
  nav.querySelectorAll('.nav-item.has-panel').forEach((item) => {
    item.classList.remove('open');
    const btn = item.querySelector(':scope > button');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  });
  const hw = nav.querySelector('.nav-hamburger-wrap.open');
  if (hw) {
    hw.classList.remove('open');
    const hb = hw.querySelector('.nav-hamburger');
    if (hb) hb.setAttribute('aria-expanded', 'false');
  }
  nav.classList.remove('panel-open', 'subpanel-open');
}

/* ---- Serviços-style small dropdown: icon cards + text links ---- */
function buildSimplePanel(sourceSection) {
  const panel = document.createElement('div');
  panel.className = 'nav-panel nav-panel-simple';
  sourceSection.querySelectorAll(':scope > ul').forEach((ul) => {
    const col = document.createElement('div');
    col.className = 'nav-panel-col';
    ul.querySelectorAll(':scope > li').forEach((li) => {
      const a = linkOf(li);
      if (!a) return;
      const img = imageOf(li);
      const link = document.createElement('a');
      link.href = a.getAttribute('href');
      const fig = document.createElement('figure');
      if (img) {
        link.classList.add('nav-card');
        fig.append(img.cloneNode(true));
      }
      const span = document.createElement('span');
      span.textContent = labelOf(a);
      fig.append(span);
      link.append(fig);
      col.append(link);
    });
    panel.append(col);
  });
  return panel;
}

/* ---- Veículos megamenu: featured detail + category tabs + card grid ---- */
function buildVehiclesPanel(sourceSection) {
  const panel = document.createElement('div');
  panel.className = 'nav-panel nav-panel-vehicles';

  // verbatim tab labels authored as <p> in the fragment (e.g. "Todos (8)")
  const tabLabels = [...sourceSection.querySelectorAll(':scope > p')]
    .map((p) => p.textContent.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  // gather vehicles grouped by category heading (h3)
  const categories = [];
  let current = null;
  sourceSection.querySelectorAll(':scope > *').forEach((node) => {
    if (node.tagName === 'H3') {
      current = { name: node.textContent.trim(), items: [] };
      categories.push(current);
    } else if (node.tagName === 'UL' && current) {
      node.querySelectorAll(':scope > li').forEach((li) => {
        const a = linkOf(li);
        if (!a) return;
        const img = imageOf(li);
        // specs authored as consecutive <li> pairs (label, value)
        const specCells = [...li.querySelectorAll(':scope > ul > li')]
          .map((s) => s.textContent.replace(/\s+/g, ' ').trim());
        const specs = [];
        for (let i = 0; i < specCells.length; i += 2) {
          specs.push({ k: specCells[i], v: specCells[i + 1] || '' });
        }
        current.items.push({
          name: labelOf(a),
          href: a.getAttribute('href'),
          img: img ? img.cloneNode(true) : null,
          specs,
        });
      });
    }
  });

  const allItems = categories.flatMap((c) => c.items);

  // featured detail (left) — shows first item by default, updates on hover
  const featured = document.createElement('div');
  featured.className = 'nav-featured';
  const featuredLink = document.createElement('a');
  featured.append(featuredLink);

  function renderFeatured(item) {
    featuredLink.href = item.href;
    featuredLink.textContent = '';
    if (item.img) featuredLink.append(item.img.cloneNode(true));
    const title = document.createElement('span');
    title.className = 'nav-featured-title';
    title.textContent = item.name;
    featuredLink.append(title);
    if (item.specs && item.specs.length) {
      const dl = document.createElement('dl');
      item.specs.forEach((s) => {
        const dt = document.createElement('dt');
        dt.className = 'nav-featured-spec-title';
        dt.textContent = s.k;
        const dd = document.createElement('dd');
        dd.textContent = s.v;
        dl.append(dt, dd);
      });
      featuredLink.append(dl);
    }
  }

  // right side: tabs + grid
  const right = document.createElement('div');
  right.className = 'nav-vehicles-right';

  const tabRow = document.createElement('div');
  tabRow.className = 'nav-tabs';
  const grid = document.createElement('div');
  grid.className = 'nav-vehicles-grid';

  function renderGrid(filterName) {
    grid.textContent = '';
    const match = categories.find((c) => c.name.toLowerCase() === filterName.toLowerCase());
    const items = filterName === 'Todos' ? allItems : (match?.items || allItems);
    items.forEach((item) => {
      const card = document.createElement('a');
      card.className = 'nav-vehicle-card';
      card.href = item.href;
      const fig = document.createElement('figure');
      if (item.img) fig.append(item.img.cloneNode(true));
      const nm = document.createElement('span');
      nm.textContent = item.name;
      fig.append(nm);
      card.append(fig);
      card.addEventListener('mouseenter', () => renderFeatured(item));
      grid.append(card);
    });
  }

  // tabs: verbatim labels from the fragment (e.g. "Todos (8)", "suv (5)").
  // The category key is the label text before " (".
  const tabs = tabLabels.length
    ? tabLabels
    : [`Todos (${allItems.length})`].concat(categories.map((c) => `${c.name} (${c.items.length})`));
  tabs.forEach((labelText, i) => {
    const key = labelText.replace(/\s*\(.*$/, '').trim();
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = labelText;
    if (i === 0) btn.classList.add('active');
    btn.addEventListener('click', () => {
      tabRow.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderGrid(key);
    });
    tabRow.append(btn);
  });

  right.append(tabRow, grid);
  panel.append(featured, right);

  if (allItems.length) renderFeatured(allItems[0]);
  renderGrid('Todos');

  return panel;
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // metadata-independent dual fetch: /content first (localhost), then root (DA/EDS prod)
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return;
  const html = await resp.text();

  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const sections = [...tmp.children];
  // Content-based section detection (order-independent):
  //  - brand: the section whose only link wraps an image (logo), no <h2>
  //  - nav list: the section with a <ul> of links and no <h2>
  //  - panels: sections with an <h2> label (Menu, Serviços, Veículos)
  const panelByLabel = {};
  let brandSection = null;
  let navListSection = null;
  sections.forEach((sec) => {
    const h = sec.querySelector('h2');
    if (h) {
      panelByLabel[h.textContent.trim().toLowerCase()] = sec;
      return;
    }
    if (!navListSection && sec.querySelector('ul')) {
      navListSection = sec;
    } else if (!brandSection) {
      brandSection = sec;
    }
  });
  // fallbacks
  if (!brandSection) [brandSection] = sections;
  if (!navListSection) navListSection = sections.find((s) => s.querySelector('ul')) || sections[1];

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main navigation');

  // brand / logo
  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  const brandLink = brandSection.querySelector('a');
  if (brandLink) {
    const a = document.createElement('a');
    a.href = brandLink.getAttribute('href');
    a.setAttribute('aria-label', 'Hyundai');
    const img = imageOf(brandSection);
    if (img) a.append(img.cloneNode(true));
    brand.append(a);
  }

  // hamburger (mobile)
  const hamburger = document.createElement('button');
  hamburger.className = 'nav-hamburger';
  hamburger.type = 'button';
  hamburger.setAttribute('aria-label', 'Open navigation');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.innerHTML = '<span class="nav-hamburger-icon"></span>';

  // main nav sections
  const sectionsEl = document.createElement('div');
  sectionsEl.className = 'nav-sections';
  const ul = document.createElement('ul');
  ul.className = 'nav-list';

  navListSection.querySelectorAll(':scope > ul > li').forEach((li) => {
    const item = document.createElement('li');
    item.className = 'nav-item';
    const a = linkOf(li);
    if (a) {
      const link = document.createElement('a');
      link.className = 'nav-trigger';
      link.href = a.getAttribute('href');
      link.textContent = labelOf(a);
      item.append(link);
    } else {
      const label = li.textContent.replace(/\s+/g, ' ').trim();
      const src = panelByLabel[label.toLowerCase()];
      if (src) {
        item.classList.add('has-panel');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nav-trigger';
        btn.textContent = label;
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-haspopup', 'true');
        const panel = label.toLowerCase() === 'veículos'
          ? buildVehiclesPanel(src)
          : buildSimplePanel(src);
        // mobile slide-in back button (hidden on desktop via CSS)
        const back = document.createElement('button');
        back.type = 'button';
        back.className = 'nav-panel-back';
        back.textContent = label;
        back.addEventListener('click', (e) => {
          e.stopPropagation();
          item.classList.remove('open');
          btn.setAttribute('aria-expanded', 'false');
          nav.classList.remove('panel-open', 'subpanel-open');
        });
        panel.prepend(back);
        item.append(btn, panel);

        const openItem = () => {
          closeAllPanels(nav);
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
          nav.classList.add('panel-open');
          if (!isDesktop.matches) nav.classList.add('subpanel-open');
        };

        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const wasOpen = item.classList.contains('open');
          closeAllPanels(nav);
          if (!wasOpen) openItem();
        });

        // desktop: open on hover (matches source pointer behavior)
        item.addEventListener('mouseenter', () => {
          if (isDesktop.matches) openItem();
        });
        item.addEventListener('mouseleave', () => {
          if (isDesktop.matches) {
            item.classList.remove('open');
            btn.setAttribute('aria-expanded', 'false');
            nav.classList.remove('panel-open');
          }
        });
      } else {
        const span = document.createElement('span');
        span.textContent = label;
        item.append(span);
      }
    }
    ul.append(item);
  });

  sectionsEl.append(ul);

  // institutional "Menu" panel opened by the hamburger (image cards + text links)
  const menuSection = panelByLabel.menu;
  let menuPanel = null;
  if (menuSection) {
    menuPanel = buildSimplePanel(menuSection);
    menuPanel.classList.add('nav-panel-hamburger');
    // mobile drawer copy of the institutional menu (shown only < 900px via CSS)
    const menuMobile = buildSimplePanel(menuSection);
    menuMobile.classList.add('nav-menu-mobile');
    sectionsEl.append(menuMobile);
  }

  const hamburgerWrap = document.createElement('div');
  hamburgerWrap.className = 'nav-hamburger-wrap';
  hamburgerWrap.append(hamburger);
  if (menuPanel) hamburgerWrap.append(menuPanel);

  nav.append(hamburgerWrap, brand, sectionsEl);

  // hamburger: desktop → toggle institutional menu panel; mobile → toggle drawer
  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isDesktop.matches && menuPanel) {
      const open = hamburgerWrap.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    } else {
      const open = nav.classList.toggle('nav-open');
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
      hamburger.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      document.body.style.overflowY = open ? 'hidden' : '';
    }
  });

  // click-out / escape closes desktop panels
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) closeAllPanels(nav);
  });
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') closeAllPanels(nav);
  });

  // reset state when crossing the desktop/mobile boundary
  isDesktop.addEventListener('change', () => {
    closeAllPanels(nav);
    nav.classList.remove('nav-open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflowY = '';
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
