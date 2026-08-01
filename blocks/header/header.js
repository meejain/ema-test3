// media query match that indicates desktop width
const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Fetch the nav fragment. Metadata-independent dual-fetch:
 * /content first (localhost / aem up), then root (DA/EDS production).
 * @returns {Promise<Document>} parsed nav fragment document
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const html = await resp.text();
  return new DOMParser().parseFromString(html, 'text/html');
}

/** Close every open megamenu panel and country/search overlay. */
function closeAllPanels(nav) {
  nav.querySelectorAll('.nav-main > li[aria-expanded="true"]').forEach((li) => {
    li.setAttribute('aria-expanded', 'false');
  });
  const localeTrigger = nav.querySelector('.nav-locale-trigger');
  if (localeTrigger) localeTrigger.setAttribute('aria-expanded', 'false');
  const localePanel = nav.querySelector('.nav-locale-panel');
  if (localePanel) localePanel.hidden = true;
}

/**
 * Build the brand bar (row 0): logo + right cluster (country selector,
 * language toggle, contacts button). Reads content from the nav DOM.
 */
function buildBrandBar(brandSection, localeSection, utilSection) {
  const bar = document.createElement('div');
  bar.className = 'nav-brand';

  // logo (first link containing an img) + contacts link
  const links = [...brandSection.querySelectorAll('a')];
  const logoLink = links.find((a) => a.querySelector('img')) || links[0];
  const contactsLink = links.find((a) => a !== logoLink);

  if (logoLink) {
    logoLink.classList.add('nav-logo');
    bar.append(logoLink);
  }

  const tools = document.createElement('div');
  tools.className = 'nav-brand-tools';

  // Country selector (Products & Services)
  if (localeSection) {
    const wrap = document.createElement('div');
    wrap.className = 'nav-locale';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'nav-locale-trigger';
    trigger.setAttribute('aria-expanded', 'false');
    trigger.innerHTML = '<span>Products &amp; Services</span>';

    const panel = document.createElement('div');
    panel.className = 'nav-locale-panel';
    panel.hidden = true;
    while (localeSection.firstElementChild) panel.append(localeSection.firstElementChild);

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = trigger.getAttribute('aria-expanded') === 'true';
      closeAllPanels(bar.closest('nav'));
      trigger.setAttribute('aria-expanded', open ? 'false' : 'true');
      panel.hidden = open;
    });

    wrap.append(trigger, panel);
    tools.append(wrap);
  }

  // Language toggle (globe + EN | DE) taken from the utility section
  if (utilSection) {
    const langLinks = [...utilSection.querySelectorAll('a')];
    if (langLinks.length) {
      const lang = document.createElement('div');
      lang.className = 'nav-lang';
      const globe = document.createElement('span');
      globe.className = 'nav-lang-globe';
      globe.setAttribute('aria-hidden', 'true');
      lang.append(globe);
      langLinks.forEach((a, i) => {
        // keep the full accessible label (e.g. "English"), show a short code visually
        const code = (a.getAttribute('href') || '').replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase();
        const link = document.createElement('a');
        link.href = a.getAttribute('href');
        link.className = 'nav-lang-link';
        link.setAttribute('data-code', code || a.textContent.trim().slice(0, 2).toUpperCase());
        link.textContent = a.textContent.trim();
        if (i === 0) link.classList.add('is-active');
        lang.append(link);
      });
      tools.append(lang);
    }
  }

  // Contacts pill button
  if (contactsLink) {
    contactsLink.className = 'nav-contacts';
    tools.append(contactsLink);
  }

  bar.append(tools);
  return bar;
}

/**
 * Build the main nav row (row 1): top-level items with hover megamenu +
 * inline search. Reads the nested ul structure from the nav DOM.
 */
function buildMainNav(navSection, utilSection) {
  const bar = document.createElement('div');
  bar.className = 'nav-main-bar';

  const list = navSection.querySelector(':scope > ul');
  if (list) {
    list.className = 'nav-main';
    list.querySelectorAll(':scope > li').forEach((item) => {
      const panel = item.querySelector(':scope > ul');
      const topLink = item.querySelector(':scope > a');
      if (panel) {
        item.classList.add('nav-has-panel');
        item.setAttribute('aria-expanded', 'false');
        panel.classList.add('nav-panel');
        // prepend an "{Section} Overview" heading containing a link (source parity:
        // the source exposes this as both a heading and a link)
        if (topLink) {
          const overview = document.createElement('li');
          overview.className = 'nav-panel-overview';
          const oh = document.createElement('h3');
          const oa = document.createElement('a');
          oa.href = topLink.getAttribute('href');
          oa.textContent = `${topLink.textContent.trim()} Overview`;
          oh.append(oa);
          overview.append(oh);
          panel.prepend(overview);
        }
        // mark teaser columns (a column whose first child is a <p> with an image)
        panel.querySelectorAll(':scope > li').forEach((col) => {
          if (col.classList.contains('nav-panel-overview')) return;
          if (col.querySelector('img')) {
            col.classList.add('nav-panel-teaser');
            // render the teaser title (<em>) as a heading for source parity,
            // keeping it inside the single wrapping anchor
            const title = col.querySelector('em');
            if (title) {
              const h = document.createElement('h3');
              h.textContent = title.textContent.trim();
              title.replaceWith(h);
            }
          } else {
            col.classList.add('nav-panel-col');
            // the column's category link becomes a heading + link for source parity
            const head = col.querySelector(':scope > a');
            if (head) {
              const h = document.createElement('h3');
              const ha = document.createElement('a');
              ha.href = head.getAttribute('href');
              ha.textContent = head.textContent.trim();
              h.append(ha);
              head.replaceWith(h);
            }
          }
        });
        // hover to open on desktop
        item.addEventListener('mouseenter', () => {
          if (isDesktop.matches) {
            closeAllPanels(bar.closest('nav'));
            item.setAttribute('aria-expanded', 'true');
          }
        });
        item.addEventListener('mouseleave', () => {
          if (isDesktop.matches) item.setAttribute('aria-expanded', 'false');
        });
        // click toggles on mobile / touch
        const trigger = item.querySelector(':scope > a');
        if (trigger) {
          trigger.addEventListener('click', (e) => {
            if (!isDesktop.matches) {
              e.preventDefault();
              const open = item.getAttribute('aria-expanded') === 'true';
              item.setAttribute('aria-expanded', open ? 'false' : 'true');
            }
          });
        }
      }
    });
    bar.append(list);
  }

  // Search (inline expandable)
  const searchHint = utilSection
    ? [...utilSection.querySelectorAll('p')].map((p) => p.textContent.trim()).find((t) => /search/i.test(t))
    : null;
  const search = document.createElement('div');
  search.className = 'nav-search';
  const searchToggle = document.createElement('button');
  searchToggle.type = 'button';
  searchToggle.className = 'nav-search-toggle';
  searchToggle.setAttribute('aria-expanded', 'false');
  searchToggle.innerHTML = '<span class="nav-search-icon" aria-hidden="true"></span><span>Search</span>';

  const form = document.createElement('form');
  form.className = 'nav-search-form';
  form.hidden = true;
  form.setAttribute('role', 'search');
  form.innerHTML = `
    <span class="nav-search-icon" aria-hidden="true"></span>
    <input type="search" aria-label="Search" placeholder="${searchHint || 'To search start typing..'}">
    <button type="submit" class="nav-search-submit">Search</button>
    <button type="button" class="nav-search-cancel">Cancel</button>`;

  searchToggle.addEventListener('click', () => {
    form.hidden = false;
    searchToggle.setAttribute('aria-expanded', 'true');
    bar.classList.add('nav-search-open');
    const input = form.querySelector('input');
    if (input) input.focus();
  });
  form.querySelector('.nav-search-cancel').addEventListener('click', () => {
    form.hidden = true;
    searchToggle.setAttribute('aria-expanded', 'false');
    bar.classList.remove('nav-search-open');
  });

  search.append(searchToggle, form);
  bar.append(search);
  return bar;
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const doc = await fetchNav();
  block.textContent = '';
  if (!doc) return;

  const sections = [...doc.body.children].filter((el) => el.tagName === 'DIV');
  // sections: 0 = brand, 1 = main nav, 2 = locale/country, 3 = utility (lang + search hint)
  const [brandSection, navSection, localeSection, utilSection] = sections;

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main navigation');

  // hamburger for mobile
  const hamburger = document.createElement('button');
  hamburger.type = 'button';
  hamburger.className = 'nav-hamburger';
  hamburger.setAttribute('aria-controls', 'nav');
  hamburger.setAttribute('aria-label', 'Open navigation');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.innerHTML = '<span class="nav-hamburger-icon"></span>';

  const brandBar = buildBrandBar(brandSection, localeSection, utilSection);
  const mainBar = buildMainNav(navSection, utilSection);

  // mobile-only search icon in the brand bar (source shows search + hamburger, top-right)
  const mobileSearch = document.createElement('button');
  mobileSearch.type = 'button';
  mobileSearch.className = 'nav-mobile-search';
  mobileSearch.setAttribute('aria-label', 'Search');
  mobileSearch.innerHTML = '<span class="nav-search-icon" aria-hidden="true"></span>';

  // group mobile controls (search + hamburger) on the right of the brand bar
  const mobileControls = document.createElement('div');
  mobileControls.className = 'nav-mobile-controls';
  mobileControls.append(mobileSearch, hamburger);
  brandBar.append(mobileControls);
  nav.append(brandBar, mainBar);

  // mobile-only utility block at the bottom of the open menu: language + contacts
  // (source shows a language selector at the bottom of the mobile drawer)
  const menuUtility = document.createElement('div');
  menuUtility.className = 'nav-menu-utility';
  const langEl = brandBar.querySelector('.nav-lang');
  const contactsEl = brandBar.querySelector('.nav-contacts');
  if (langEl) menuUtility.append(langEl.cloneNode(true));
  if (contactsEl) menuUtility.append(contactsEl.cloneNode(true));
  if (menuUtility.children.length) mainBar.append(menuUtility);

  // mobile search icon opens the same inline search bar (in the main bar)
  mobileSearch.addEventListener('click', () => {
    const toggle = mainBar.querySelector('.nav-search-toggle');
    if (toggle) toggle.click();
    if (!nav.classList.contains('nav-open')) hamburger.click();
  });

  hamburger.addEventListener('click', () => {
    const open = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', open ? 'false' : 'true');
    hamburger.setAttribute('aria-label', open ? 'Open navigation' : 'Close navigation');
    nav.classList.toggle('nav-open', !open);
    document.body.style.overflowY = open || isDesktop.matches ? '' : 'hidden';
    if (open) closeAllPanels(nav);
  });

  // close panels on outside click / escape
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) closeAllPanels(nav);
  });
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') closeAllPanels(nav);
  });

  // reset state when crossing the desktop/mobile breakpoint
  isDesktop.addEventListener('change', () => {
    closeAllPanels(nav);
    nav.classList.remove('nav-open');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Open navigation');
    document.body.style.overflowY = '';
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
