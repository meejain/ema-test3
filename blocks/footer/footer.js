// AbbVie-style footer: light-grey multi-column link grid + social icons +
// disclaimer/copyright + a bottom legal links row, with a back-to-top control.
// All copy/links/images come from /content/footer.plain.html; this file only
// reads that DOM, arranges sections, and adds the back-to-top control.

/**
 * Fetch the footer fragment. Metadata-independent dual-fetch:
 * /content first (localhost / aem up), then root (DA/EDS production).
 */
async function fetchFooter() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  const html = await resp.text();
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooter();
  block.textContent = '';

  const footer = document.createElement('div');
  footer.className = 'footer-inner';

  const sections = fragment ? [...fragment.children] : [];

  // Back-to-top control (built here; not part of the content fragment).
  const backToTop = document.createElement('button');
  backToTop.type = 'button';
  backToTop.className = 'footer-back-to-top';
  backToTop.setAttribute('aria-label', 'Scroll to top of page');
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Top band = brand + nav + social (section 0); Popular pages (1); External
  // links + disclaimer (2). Legal links row = last section.
  const grid = document.createElement('div');
  grid.className = 'footer-grid';

  const legalSection = sections.pop();

  sections.forEach((section, i) => {
    const col = document.createElement('div');
    col.className = 'footer-col';
    if (i === 0) {
      col.classList.add('footer-col-brand');
      // Tag the brand image, nav list, and social list for styling.
      const lists = section.querySelectorAll(':scope > ul');
      if (lists[0]) lists[0].classList.add('footer-nav-links');
      if (lists[1]) lists[1].classList.add('footer-social');
    }
    while (section.firstElementChild) col.append(section.firstElementChild);
    grid.append(col);
  });

  // Legal links row
  const legal = document.createElement('div');
  legal.className = 'footer-legal';
  if (legalSection) {
    while (legalSection.firstElementChild) legal.append(legalSection.firstElementChild);
  }

  footer.append(backToTop, grid, legal);
  block.append(footer);
}
