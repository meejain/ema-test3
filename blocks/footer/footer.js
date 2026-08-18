// Hyundai Motor Brasil footer.
// Content-first: all copy, links, and images come from /content/footer.plain.html.
// This file reads that DOM and builds the CTA band, promo image band, newsletter
// form (form controls built here, copy read from the fragment), link columns, and
// the bottom bar. It never hardcodes copy that lives in the fragment.

/**
 * Fetch the footer fragment. Metadata-independent: /content first (localhost),
 * then root (DA/EDS production).
 */
async function fetchFooter() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  const html = await resp.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body;
}

/** Build the CTA + promo image band (section 0/1). */
function buildPromo(section) {
  const band = document.createElement('div');
  band.className = 'footer-promo';
  const img = section.querySelector('img');
  if (img) {
    const i = document.createElement('img');
    i.src = img.getAttribute('src');
    i.alt = img.getAttribute('alt') || '';
    i.loading = 'lazy';
    i.className = 'footer-promo-bg';
    band.append(i);
  }
  const ctaLink = section.querySelector('a');
  if (ctaLink) {
    const a = document.createElement('a');
    a.className = 'footer-cta';
    a.href = ctaLink.getAttribute('href');
    a.textContent = ctaLink.textContent.trim();
    band.append(a);
  }
  return band;
}

/**
 * Build the newsletter form (section with the "Cadastre-se" heading).
 * Copy comes from the fragment; the <form>/<input>/<button> controls are created here.
 */
function buildForm(section) {
  const wrap = document.createElement('div');
  wrap.className = 'footer-newsletter';
  const form = document.createElement('form');
  form.className = 'footer-form';
  form.setAttribute('novalidate', '');

  const heading = section.querySelector('h4');
  if (heading) {
    const h = document.createElement('h4');
    h.textContent = heading.textContent.trim();
    wrap.append(h);
  }

  // First <p> holds the pipe-delimited field labels
  const paras = [...section.querySelectorAll('p')];
  const fieldsPara = paras.find((p) => p.textContent.includes('|'));
  const fieldRow = document.createElement('div');
  fieldRow.className = 'footer-form-fields';
  if (fieldsPara) {
    fieldsPara.textContent.split('|').map((s) => s.trim()).filter(Boolean).forEach((label) => {
      const field = document.createElement('label');
      field.className = 'footer-field';
      const span = document.createElement('span');
      span.textContent = label;
      const input = document.createElement('input');
      input.type = 'text';
      input.setAttribute('aria-label', label);
      field.append(span, input);
      fieldRow.append(field);
    });
  }
  form.append(fieldRow);

  // Channel checkboxes: heading paragraph + first <ul>
  const channelHeading = paras.find((p) => /canais/i.test(p.textContent));
  const lists = [...section.querySelectorAll('ul')];
  if (channelHeading && lists[0]) {
    const cp = document.createElement('p');
    cp.className = 'footer-form-legend';
    cp.textContent = channelHeading.textContent.trim();
    form.append(cp);
    const channels = document.createElement('div');
    channels.className = 'footer-channels';
    [...lists[0].querySelectorAll('li')].forEach((li) => {
      const label = document.createElement('label');
      label.className = 'footer-checkbox';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      const span = document.createElement('span');
      span.textContent = li.textContent.trim();
      label.append(cb, span);
      channels.append(label);
    });
    form.append(channels);
  }

  // Consent checkboxes: second <ul>
  if (lists[1]) {
    const consents = document.createElement('div');
    consents.className = 'footer-consents';
    [...lists[1].querySelectorAll('li')].forEach((li) => {
      const label = document.createElement('label');
      label.className = 'footer-checkbox';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = true;
      const span = document.createElement('span');
      span.textContent = li.textContent.trim();
      label.append(cb, span);
      consents.append(label);
    });
    form.append(consents);
  }

  // Submit: the ENVIAR paragraph
  const submitPara = paras.find((p) => /^ENVIAR$/i.test(p.textContent.trim()));
  if (submitPara) {
    const btn = document.createElement('button');
    btn.type = 'submit';
    btn.className = 'footer-submit';
    btn.textContent = submitPara.textContent.trim();
    form.append(btn);
  }

  wrap.append(form);

  // Disclaimer (last paragraph, not a field/submit line)
  const disclaimer = paras.find((p) => /Valores sujeitos/i.test(p.textContent));
  if (disclaimer) {
    const d = document.createElement('p');
    d.className = 'footer-disclaimer';
    d.textContent = disclaimer.textContent.trim();
    wrap.append(d);
  }

  form.addEventListener('submit', (e) => e.preventDefault());
  return wrap;
}

/** Build the link-column grid (section with h5 headings + lists). */
function buildLinkGrid(section) {
  const grid = document.createElement('div');
  grid.className = 'footer-links';

  // Walk children: a <ul> without a preceding heading is the icon-menu column;
  // each <h5> starts a titled column, its following <ul> holds the links.
  const columns = [];
  let current = null;
  [...section.children].forEach((el) => {
    if (el.tagName === 'H5') {
      current = { heading: el, list: null };
      columns.push(current);
    } else if (el.tagName === 'UL') {
      if (current && !current.list) {
        current.list = el;
      } else {
        // leading list with no heading (icon-menu column)
        columns.unshift({ heading: null, list: el });
      }
    }
  });

  columns.forEach((col) => {
    const c = document.createElement('div');
    c.className = 'footer-col';
    if (col.heading) {
      const h = document.createElement('h5');
      const hl = col.heading.querySelector('a');
      if (hl) {
        const a = document.createElement('a');
        a.href = hl.getAttribute('href');
        a.textContent = hl.textContent.trim();
        h.append(a);
      } else {
        h.textContent = col.heading.textContent.trim();
      }
      c.append(h);
    }
    if (col.list) {
      const ul = document.createElement('ul');
      [...col.list.querySelectorAll('a')].forEach((a) => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = a.getAttribute('href');
        link.textContent = a.textContent.trim();
        li.append(link);
        ul.append(li);
      });
      c.append(ul);
    }
    grid.append(c);
  });
  return grid;
}

/** Build the bottom bar (logo, ©, legal links, contact, social, proconve). */
function buildBottomBar(section) {
  const bar = document.createElement('div');
  bar.className = 'footer-bottom';

  const children = [...section.children];
  const lists = section.querySelectorAll('ul');
  const legalList = lists[0];
  const socialList = lists[1];

  // Column 1: logo + copyright + legal links
  const col1 = document.createElement('div');
  col1.className = 'footer-bottom-brand';
  const logoP = children.find((el) => el.querySelector && el.querySelector('img'));
  const logoLink = logoP && logoP.querySelector('a');
  if (logoLink) {
    const a = document.createElement('a');
    a.href = logoLink.getAttribute('href');
    a.className = 'footer-bottom-logo';
    const img = logoLink.querySelector('img');
    const i = document.createElement('img');
    i.src = img.getAttribute('src');
    i.alt = img.getAttribute('alt') || 'Hyundai';
    i.loading = 'lazy';
    a.append(i);
    col1.append(a);
  }
  const copyP = children.find((el) => el.tagName === 'P' && /ⓒ|©/.test(el.textContent));
  if (copyP) {
    const c = document.createElement('p');
    c.className = 'footer-copyright';
    c.textContent = copyP.textContent.trim();
    col1.append(c);
  }
  if (legalList) {
    const ul = document.createElement('ul');
    ul.className = 'footer-legal';
    [...legalList.querySelectorAll('a')].forEach((a) => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = a.getAttribute('href');
      link.textContent = a.textContent.trim();
      li.append(link);
      ul.append(li);
    });
    col1.append(ul);
  }

  // Column 2: contact info (phone, hours, company)
  const col2 = document.createElement('div');
  col2.className = 'footer-bottom-contact';
  const contactStops = [];
  children.forEach((el) => {
    if (el.tagName !== 'P') return;
    const txt = el.textContent.trim();
    if (!txt || /ⓒ|©/.test(txt) || el.querySelector('img')) return;
    contactStops.push(el);
  });
  contactStops.forEach((el) => {
    const p = document.createElement('p');
    const a = el.querySelector('a');
    if (a) {
      const link = document.createElement('a');
      link.href = a.getAttribute('href');
      link.textContent = a.textContent.trim();
      p.append(link);
    } else {
      p.textContent = el.textContent.trim();
    }
    col2.append(p);
  });

  // Column 3: social icons + proconve
  const col3 = document.createElement('div');
  col3.className = 'footer-bottom-social';
  if (socialList) {
    const row = document.createElement('div');
    row.className = 'footer-social';
    [...socialList.querySelectorAll('a')].forEach((a) => {
      const link = document.createElement('a');
      link.href = a.getAttribute('href');
      link.setAttribute('aria-label', a.querySelector('img')?.alt || 'Social');
      link.target = '_blank';
      link.rel = 'noopener';
      const img = a.querySelector('img');
      if (img) {
        const i = document.createElement('img');
        i.src = img.getAttribute('src');
        i.alt = img.getAttribute('alt') || '';
        i.loading = 'lazy';
        link.append(i);
      }
      row.append(link);
    });
    col3.append(row);
  }
  const proconveP = [...children].reverse().find((el) => el.tagName === 'P' && el.querySelector('img'));
  if (proconveP && proconveP !== logoP) {
    const box = document.createElement('div');
    box.className = 'footer-proconve';
    const img = proconveP.querySelector('img');
    const i = document.createElement('img');
    i.src = img.getAttribute('src');
    i.alt = img.getAttribute('alt') || '';
    i.loading = 'lazy';
    const span = document.createElement('span');
    // text after the image
    span.textContent = proconveP.textContent.trim();
    box.append(i, span);
    col3.append(box);
  }

  bar.append(col1, col2, col3);
  return bar;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  block.textContent = '';
  const body = await fetchFooter();
  if (!body) return;

  const sections = [...body.children];
  const footer = document.createElement('div');
  footer.className = 'footer-inner';

  // Section 0: CTA + promo band (CTA link + promo image live in first section)
  if (sections[0]) footer.append(buildPromo(sections[0]));

  // Section 1: newsletter form
  if (sections[1]) footer.append(buildForm(sections[1]));

  // Section 2: link-column grid
  if (sections[2]) footer.append(buildLinkGrid(sections[2]));

  // Section 3: bottom bar
  if (sections[3]) footer.append(buildBottomBar(sections[3]));

  block.append(footer);
}
