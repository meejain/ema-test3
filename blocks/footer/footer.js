// ---------------------------------------------------------------------------
// Tolerant fragment helpers — work for BOTH the raw authored fragment (aem up)
// and the DA/EDS decorated shape (li > p > a, <img>→<picture>, hrefs without
// .html). Generic — no site-specific names.
// ---------------------------------------------------------------------------
function linkOf(el) {
  return el.querySelector(':scope > a, :scope > p > a');
}

function labelOf(el) {
  if (!el) return '';
  const clone = el.cloneNode(true);
  clone.querySelectorAll('picture, img, source').forEach((n) => n.remove());
  return clone.textContent.replace(/\s+/g, ' ').trim();
}

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

// Build an anchor from a source <li>/<a>, preserving href + label (+ optional image).
function buildLink(sourceAnchor, { withImage = false } = {}) {
  const a = document.createElement('a');
  a.href = sourceAnchor.getAttribute('href') || '#';
  if (/^https?:/i.test(a.getAttribute('href') || '') && !a.href.includes(window.location.host)) {
    a.rel = 'noopener';
  }
  if (withImage) {
    const img = sourceAnchor.querySelector('img');
    if (img) a.append(cloneImage(img));
  }
  const text = labelOf(sourceAnchor);
  if (text) {
    const span = document.createElement('span');
    span.textContent = text;
    a.append(span);
  }
  return a;
}

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

// Promo band: full-width image + a CTA button overlaid.
function buildPromoBand(section) {
  const band = document.createElement('div');
  band.className = 'footer-promo';
  const img = section.querySelector('img');
  if (img) {
    const media = document.createElement('div');
    media.className = 'footer-promo-media';
    media.append(cloneImage(img));
    band.append(media);
  }
  const ctaAnchor = section.querySelector('a');
  if (ctaAnchor) {
    const cta = document.createElement('a');
    cta.className = 'footer-promo-cta';
    cta.href = ctaAnchor.getAttribute('href') || '#';
    cta.textContent = labelOf(ctaAnchor);
    band.append(cta);
  }
  return band;
}

// Newsletter band: heading + channel checkboxes + consent checkboxes + submit.
// Copy is READ from the fragment; only the form controls are built here.
function buildNewsletterBand(section) {
  const band = document.createElement('div');
  band.className = 'footer-newsletter';
  const inner = document.createElement('div');
  inner.className = 'footer-newsletter-inner';

  const heading = section.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    const h = document.createElement('div');
    h.className = 'footer-newsletter-title';
    h.textContent = labelOf(heading);
    inner.append(h);
  }

  const form = document.createElement('form');
  form.className = 'footer-newsletter-form';
  form.addEventListener('submit', (e) => e.preventDefault());

  // Text fields (fixed set — labels are UI chrome, not fragment copy).
  const fields = document.createElement('div');
  fields.className = 'footer-newsletter-fields';
  ['NOME*', 'SOBRENOME*', 'WHATSAPP*', 'E-MAIL*'].forEach((ph) => {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = ph;
    input.setAttribute('aria-label', ph);
    fields.append(input);
  });
  form.append(fields);

  // Channel + consent lists come from the fragment (first ul = channels, second = consent).
  const lists = [...section.querySelectorAll(':scope > ul, ul')];
  const paragraphs = [...section.querySelectorAll(':scope > p, p')];
  const channelIntro = paragraphs.find((p) => /Desejo ser contatado/i.test(p.textContent));

  const optionsWrap = document.createElement('div');
  optionsWrap.className = 'footer-newsletter-options';

  if (channelIntro) {
    const intro = document.createElement('p');
    intro.className = 'footer-newsletter-channels-intro';
    intro.textContent = channelIntro.textContent.trim();
    optionsWrap.append(intro);
  }

  if (lists[0]) {
    const channels = document.createElement('div');
    channels.className = 'footer-newsletter-channels';
    [...lists[0].children].forEach((li) => {
      const label = document.createElement('label');
      label.className = 'footer-checkbox';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      const span = document.createElement('span');
      span.textContent = li.textContent.trim();
      label.append(cb, span);
      channels.append(label);
    });
    optionsWrap.append(channels);
  }

  if (lists[1]) {
    const consent = document.createElement('div');
    consent.className = 'footer-newsletter-consent';
    [...lists[1].children].forEach((li) => {
      const label = document.createElement('label');
      label.className = 'footer-checkbox';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = true;
      const span = document.createElement('span');
      span.textContent = li.textContent.trim();
      label.append(cb, span);
      consent.append(label);
    });
    optionsWrap.append(consent);
  }

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'footer-newsletter-submit';
  submit.textContent = 'ENVIAR';
  optionsWrap.append(submit);

  form.append(optionsWrap);
  inner.append(form);

  // Disclaimer paragraph (last non-intro paragraph).
  const disclaimer = paragraphs.find((p) => /Valores sujeitos/i.test(p.textContent));
  if (disclaimer) {
    const d = document.createElement('p');
    d.className = 'footer-newsletter-disclaimer';
    d.textContent = disclaimer.textContent.trim();
    inner.append(d);
  }

  band.append(inner);
  return band;
}

// Link columns: each <ul> becomes a column; first <li> that is a heading-style
// link (or plain) acts as the column title.
function buildLinkColumns(section) {
  const band = document.createElement('div');
  band.className = 'footer-links';
  const inner = document.createElement('div');
  inner.className = 'footer-links-inner';

  // Optional leading brand logo above the first link column (source parity).
  const leadImg = [...section.children].find((el) => el.tagName === 'P' && el.querySelector('img'))?.querySelector('img');
  if (leadImg) {
    const logo = document.createElement('div');
    logo.className = 'footer-links-logo';
    logo.append(cloneImage(leadImg));
    inner.append(logo);
  }

  // The first link column is a flat list (no accordion); the remaining columns
  // are titled groups whose first <li> is the column heading and collapse into
  // accordions on mobile.
  const columnUls = [...section.querySelectorAll(':scope > ul')];
  columnUls.forEach((ul, colIndex) => {
    const col = document.createElement('div');
    col.className = 'footer-link-col';
    const children = [...ul.children].filter((li) => linkOf(li));
    const isTitled = colIndex > 0 && children.length > 0;

    if (isTitled) {
      col.classList.add('footer-col-accordion');
      const headingAnchor = linkOf(children[0]);
      // Heading row: navigable link (desktop) + a separate mobile toggle button.
      const headingRow = document.createElement('div');
      headingRow.className = 'footer-col-head';
      const headingLink = buildLink(headingAnchor);
      headingLink.classList.add('footer-col-heading-a');
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'footer-col-toggle';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', labelOf(headingAnchor));
      toggle.addEventListener('click', () => {
        const open = col.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      headingRow.append(headingLink, toggle);
      col.append(headingRow);
    }

    const list = document.createElement('ul');
    children.forEach((li, i) => {
      if (isTitled && i === 0) return; // heading rendered in the toggle
      const a = linkOf(li);
      const item = document.createElement('li');
      item.append(buildLink(a));
      if (!isTitled && i === 0) item.classList.add('footer-col-heading-link');
      list.append(item);
    });
    col.append(list);
    inner.append(col);
  });

  band.append(inner);
  return band;
}

// Brand / legal / contact / social band.
function buildBrandBand(section) {
  const band = document.createElement('div');
  band.className = 'footer-brand';
  const inner = document.createElement('div');
  inner.className = 'footer-brand-inner';

  // Logo (first anchor wrapping an image) + copyright paragraph.
  const brandCol = document.createElement('div');
  brandCol.className = 'footer-brand-logo';
  const logoAnchor = [...section.querySelectorAll('a')].find((a) => a.querySelector('img'));
  if (logoAnchor) {
    const la = document.createElement('a');
    la.href = logoAnchor.getAttribute('href') || '#';
    la.append(cloneImage(logoAnchor.querySelector('img')));
    brandCol.append(la);
  }
  const copyright = [...section.querySelectorAll(':scope > p')].find((p) => /©|ⓒ|Motor Brasil/.test(p.textContent) && !p.querySelector('a'));
  if (copyright) {
    const c = document.createElement('p');
    c.className = 'footer-copyright';
    c.textContent = copyright.textContent.trim();
    brandCol.append(c);
  }
  inner.append(brandCol);

  // Legal links (first ul without images).
  const legalUl = [...section.querySelectorAll(':scope > ul')].find((ul) => !ul.querySelector('img'));
  if (legalUl) {
    const legal = document.createElement('ul');
    legal.className = 'footer-legal';
    [...legalUl.children].forEach((li) => {
      const a = linkOf(li);
      if (!a) return;
      const item = document.createElement('li');
      const href = a.getAttribute('href') || '';
      if (href.startsWith('#')) {
        // "Gerenciar cookies" — a control, not a navigation link.
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'footer-cookie-manage';
        btn.textContent = labelOf(a);
        item.append(btn);
      } else {
        item.append(buildLink(a));
      }
      legal.append(item);
    });
    inner.append(legal);
  }

  // Contact block: phone + hours + CNPJ + address (paragraphs after copyright).
  const contact = document.createElement('div');
  contact.className = 'footer-contact';
  [...section.querySelectorAll(':scope > p')].forEach((p) => {
    if (copyright && p === copyright) return;
    const phone = p.querySelector('a[href^="tel:"]');
    const maps = p.querySelector('a[href*="maps"], a[href*="goo.gl"]');
    if (phone) {
      const a = document.createElement('a');
      a.href = phone.getAttribute('href');
      a.className = 'footer-phone';
      a.textContent = phone.textContent.trim();
      contact.append(a);
    } else if (maps) {
      const a = document.createElement('a');
      a.href = maps.getAttribute('href');
      a.rel = 'noopener';
      a.className = 'footer-address';
      a.textContent = maps.textContent.trim();
      contact.append(a);
    } else if (!p.querySelector('img')) {
      const line = document.createElement('p');
      line.textContent = p.textContent.trim();
      contact.append(line);
    }
  });
  if (contact.childElementCount) inner.append(contact);

  // Social icons (ul that contains images).
  const socialUl = [...section.querySelectorAll(':scope > ul')].find((ul) => ul.querySelector('img'));
  if (socialUl) {
    const social = document.createElement('ul');
    social.className = 'footer-social';
    [...socialUl.children].forEach((li) => {
      const a = linkOf(li);
      if (!a) return;
      const item = document.createElement('li');
      const sa = document.createElement('a');
      sa.href = a.getAttribute('href') || '#';
      sa.rel = 'noopener';
      sa.setAttribute('aria-label', a.querySelector('img')?.alt || '');
      const img = a.querySelector('img');
      if (img) sa.append(cloneImage(img));
      item.append(sa);
      social.append(item);
    });
    inner.append(social);
  }

  band.append(inner);
  return band;
}

// Proconve / notice band: logo + disclaimer. Mirrors the source's responsive
// duplicate mark (the second logo is hidden — kept for content/count parity).
function buildNoticeBand(section) {
  const band = document.createElement('div');
  band.className = 'footer-notice';
  const inner = document.createElement('div');
  inner.className = 'footer-notice-inner';
  const imgs = [...section.querySelectorAll('img')];
  if (imgs[0]) inner.append(cloneImage(imgs[0]));
  const text = [...section.querySelectorAll(':scope > p')].find((p) => !p.querySelector('img'));
  if (text) {
    const t = document.createElement('p');
    t.textContent = text.textContent.trim();
    inner.append(t);
  }
  // Hidden responsive duplicate mark (source parity; never shown).
  if (imgs[1]) {
    const dupImg = cloneImage(imgs[1]);
    dupImg.classList.add('footer-notice-dup');
    inner.append(dupImg);
  }
  band.append(inner);
  return band;
}

// Classify a fragment section by its content.
function classifySection(section) {
  const hasHeading = !!section.querySelector('h1, h2, h3, h4, h5, h6');
  const uls = section.querySelectorAll(':scope > ul');
  const imgs = section.querySelectorAll('img');
  const hasSocial = [...uls].some((ul) => ul.querySelector('img'));
  const isProconve = /Proconve|Programa de Controle de Poluição/i.test(section.textContent);
  if (hasHeading && /Cadastre-se/i.test(section.textContent)) return 'newsletter';
  if (isProconve) return 'notice';
  if (hasSocial || /Motor Brasil|Informações Legais/.test(section.textContent)) return 'brand';
  if (uls.length >= 3) return 'links';
  if (imgs.length && section.querySelector('a')) return 'promo';
  if (imgs.length) return 'promo';
  return 'promo';
}

// ---------------------------------------------------------------------------
// decorate
// ---------------------------------------------------------------------------
/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // metadata-independent dual fetch: /content first (localhost), then root (DA/EDS prod)
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return;
  const html = await resp.text();
  const fragment = document.createElement('div');
  fragment.innerHTML = html;

  const sections = [...fragment.children].filter((el) => el.tagName === 'DIV');

  block.textContent = '';
  const footer = document.createElement('div');
  footer.className = 'footer-root';

  sections.forEach((section) => {
    const kind = classifySection(section);
    let band;
    if (kind === 'newsletter') band = buildNewsletterBand(section);
    else if (kind === 'links') band = buildLinkColumns(section);
    else if (kind === 'brand') band = buildBrandBand(section);
    else if (kind === 'notice') band = buildNoticeBand(section);
    else band = buildPromoBand(section);
    footer.append(band);
  });

  block.append(footer);
}
