/**
 * Fetch the footer fragment. Metadata-independent dual-fetch:
 * /content first (localhost / aem up), then root (DA/EDS production).
 * @returns {Promise<Document|null>} parsed footer fragment document
 */
async function fetchFooter() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  const html = await resp.text();
  return new DOMParser().parseFromString(html, 'text/html');
}

// media query match that indicates desktop width
const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Wire footer link columns as accordions on mobile: the heading toggles its
 * list open/closed. On desktop the columns are always expanded.
 * @param {Element} footer the footer inner element
 */
function setupColumnAccordions(footer) {
  const columns = [...footer.querySelectorAll('.footer-column')];
  columns.forEach((col) => {
    const heading = col.querySelector('h1, h2, h3, h4, h5, h6');
    const list = col.querySelector('ul');
    if (!heading || !list) return;
    heading.setAttribute('role', 'button');
    heading.setAttribute('tabindex', '0');
    const toggle = () => {
      if (isDesktop.matches) return;
      const open = col.getAttribute('aria-expanded') === 'true';
      col.setAttribute('aria-expanded', open ? 'false' : 'true');
      heading.setAttribute('aria-expanded', open ? 'false' : 'true');
    };
    heading.addEventListener('click', toggle);
    heading.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });

  const sync = () => {
    columns.forEach((col) => {
      const heading = col.querySelector('h1, h2, h3, h4, h5, h6');
      // collapse on mobile, expand on desktop
      const expanded = isDesktop.matches ? 'true' : 'false';
      col.setAttribute('aria-expanded', expanded);
      if (heading) heading.setAttribute('aria-expanded', expanded);
    });
  };
  sync();
  isDesktop.addEventListener('change', sync);
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const doc = await fetchFooter();
  block.textContent = '';
  if (!doc) return;

  const sections = [...doc.body.children].filter((el) => el.tagName === 'DIV');

  const footer = document.createElement('div');
  footer.className = 'footer-inner';

  // classify sections by content shape (generic — no site-specific names):
  // a heading + list => link column; a list of image links => social; a
  // paragraph + link list => legal bar.
  const columns = [];
  let social = null;
  let legal = null;

  sections.forEach((sec) => {
    const heading = sec.querySelector('h1, h2, h3, h4, h5, h6');
    const list = sec.querySelector('ul');
    const para = sec.querySelector('p');
    const hasImgLinks = list && list.querySelector('a img');

    if (heading && list && !hasImgLinks) {
      columns.push(sec);
    } else if (para && hasImgLinks) {
      social = sec;
    } else if (para && list) {
      legal = sec;
    }
  });

  // Link columns row
  if (columns.length) {
    const cols = document.createElement('div');
    cols.className = 'footer-columns';
    columns.forEach((sec) => {
      const col = document.createElement('div');
      col.className = 'footer-column';
      while (sec.firstElementChild) col.append(sec.firstElementChild);
      cols.append(col);
    });
    footer.append(cols);
  }

  // Social row
  if (social) {
    const soc = document.createElement('div');
    soc.className = 'footer-social';
    const heading = social.querySelector('p');
    if (heading) {
      const h = document.createElement('p');
      h.className = 'footer-social-heading';
      h.textContent = heading.textContent.trim();
      soc.append(h);
    }
    const list = social.querySelector('ul');
    if (list) {
      list.className = 'footer-social-list';
      list.querySelectorAll('a').forEach((a) => {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
        const img = a.querySelector('img');
        if (img && !a.getAttribute('aria-label')) {
          a.setAttribute('aria-label', img.getAttribute('alt') || 'social');
        }
      });
      soc.append(list);
    }
    footer.append(soc);
  }

  // Legal bar
  if (legal) {
    const bar = document.createElement('div');
    bar.className = 'footer-legal';
    const copy = legal.querySelector('p');
    if (copy) {
      copy.className = 'footer-copyright';
      bar.append(copy);
    }
    const list = legal.querySelector('ul');
    if (list) {
      list.className = 'footer-legal-list';
      bar.append(list);
    }
    footer.append(bar);
  }

  setupColumnAccordions(footer);

  block.append(footer);
}
