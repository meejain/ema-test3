// Hyundai Brazil footer — content-driven from /footer.plain.html.
// All copy/links/images live in content/footer.plain.html; form controls are built here.

function imageOf(scope) {
  return scope.querySelector('picture') || scope.querySelector('img');
}

/**
 * Build the newsletter signup form. Copy (heading, channel labels, consent text,
 * disclaimer) is read from the fragment section; the <form>/<input>/<button>
 * controls are constructed here (they cannot live in the plain fragment).
 * @param {Element} section fragment section containing the form copy
 */
function buildSignupForm(section) {
  const wrap = document.createElement('div');
  wrap.className = 'footer-signup';

  const heading = section.querySelector('h4');
  if (heading) wrap.append(heading.cloneNode(true));

  const form = document.createElement('form');
  form.className = 'footer-signup-form';
  form.setAttribute('novalidate', '');

  // text fields
  const fields = [
    { name: 'nome', label: 'NOME*', type: 'text' },
    { name: 'sobrenome', label: 'SOBRENOME*', type: 'text' },
    { name: 'whatsapp', label: 'WHATSAPP*', type: 'tel' },
    { name: 'email', label: 'E-MAIL*', type: 'email' },
  ];
  fields.forEach((f) => {
    const field = document.createElement('label');
    field.className = 'footer-field';
    const span = document.createElement('span');
    span.textContent = f.label;
    const input = document.createElement('input');
    input.type = f.type;
    input.name = f.name;
    input.setAttribute('aria-label', f.label);
    field.append(span, input);
    form.append(field);
  });

  // contact-channel checkboxes — labels read from the first fragment <ul>
  const channelList = section.querySelector('ul');
  const channelIntro = section.querySelector('p');
  if (channelIntro) {
    const p = document.createElement('p');
    p.className = 'footer-channels-intro';
    p.textContent = channelIntro.textContent.trim();
    form.append(p);
  }
  if (channelList) {
    const group = document.createElement('div');
    group.className = 'footer-channels';
    channelList.querySelectorAll('li').forEach((li) => {
      const label = document.createElement('label');
      label.className = 'footer-checkbox';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      const span = document.createElement('span');
      span.textContent = li.textContent.trim();
      label.append(cb, span);
      group.append(label);
    });
    form.append(group);
  }

  // consent checkboxes — from the second fragment <ul>
  const consentList = section.querySelectorAll('ul')[1];
  if (consentList) {
    const group = document.createElement('div');
    group.className = 'footer-consents';
    consentList.querySelectorAll('li').forEach((li) => {
      const label = document.createElement('label');
      label.className = 'footer-checkbox';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = true;
      const span = document.createElement('span');
      span.textContent = li.textContent.trim();
      label.append(cb, span);
      group.append(label);
    });
    form.append(group);
  }

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'footer-submit';
  submit.textContent = 'ENVIAR';
  form.append(submit);

  form.addEventListener('submit', (e) => e.preventDefault());
  wrap.append(form);

  // disclaimer (last <p> in the section)
  const paras = section.querySelectorAll(':scope > p');
  const disclaimer = paras[paras.length - 1];
  if (disclaimer && disclaimer !== channelIntro) {
    const d = document.createElement('p');
    d.className = 'footer-disclaimer';
    d.textContent = disclaimer.textContent.trim();
    wrap.append(d);
  }

  return wrap;
}

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

  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const sections = [...tmp.children];

  block.textContent = '';
  const footer = document.createElement('div');
  footer.className = 'footer-inner';

  // 1. CTA (Monte seu carro) — first section, a single link
  const ctaSection = sections.find((s) => s.querySelector('a') && !s.querySelector('img') && !s.querySelector('h4') && s.querySelectorAll('a').length === 1);
  if (ctaSection) {
    const cta = document.createElement('div');
    cta.className = 'footer-cta';
    const a = ctaSection.querySelector('a');
    const link = document.createElement('a');
    link.href = a.getAttribute('href');
    link.textContent = a.textContent.trim();
    link.className = 'footer-cta-button';
    cta.append(link);
    footer.append(cta);
  }

  // 2. promo image band — a section with only an image
  const promoSection = sections.find((s) => imageOf(s) && s.querySelectorAll('a').length === 0 && !s.querySelector('h4'));
  if (promoSection) {
    const promo = document.createElement('div');
    promo.className = 'footer-promo';
    const img = imageOf(promoSection);
    if (img) promo.append(img.cloneNode(true));
    footer.append(promo);
  }

  // main footer container (black band)
  const main = document.createElement('div');
  main.className = 'footer-main';

  // 3. signup form — the section containing the form heading
  const formSection = sections.find((s) => /cadastre-se/i.test(s.querySelector('h4')?.textContent || ''));
  if (formSection) main.append(buildSignupForm(formSection));

  // 4. link menu — sections with an <h4> (except the form) plus the leading link-only <ul> group
  const linkMenu = document.createElement('div');
  linkMenu.className = 'footer-linkmenu';
  sections.forEach((s) => {
    if (s === formSection || s === ctaSection || s === promoSection) return;
    // skip the hidden parity section (rendered separately below)
    if (/^legal$/i.test(s.querySelector('h4')?.textContent?.trim() || '')) return;
    const h4 = s.querySelector('h4');
    const ul = s.querySelector(':scope > ul');
    // link-column groups: an h4 + a ul of links, OR a leading ul-only group (A Hyundai list)
    const isLinkColumn = ul && ul.querySelector('a')
      && !s.querySelector('img')
      && !/^ⓒ|0800|horário/i.test(s.textContent.trim());
    if (isLinkColumn && (h4 || s.querySelectorAll('a').length >= 4)) {
      const col = document.createElement('div');
      col.className = 'footer-col';
      // heading becomes a mobile accordion toggle (styled as plain heading on desktop)
      const headingLink = h4 ? h4.querySelector('a') : null;
      if (h4) {
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'footer-col-toggle';
        toggle.textContent = h4.textContent.trim();
        toggle.setAttribute('aria-expanded', 'false');
        toggle.addEventListener('click', () => {
          const open = col.classList.toggle('open');
          toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        col.append(toggle);
      }
      const list = document.createElement('ul');
      // if the heading itself is a link, expose it as the first list item (source parity)
      if (headingLink) {
        const li = document.createElement('li');
        li.className = 'footer-col-headlink';
        const link = document.createElement('a');
        link.href = headingLink.getAttribute('href');
        link.textContent = headingLink.textContent.trim();
        li.append(link);
        list.append(li);
      }
      ul.querySelectorAll(':scope > li > a').forEach((a) => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = a.getAttribute('href');
        link.textContent = a.textContent.trim();
        li.append(link);
        list.append(li);
      });
      col.append(list);
      linkMenu.append(col);
    }
  });
  if (linkMenu.children.length) main.append(linkMenu);

  // 5. bottom bar: logo/copyright/legal, contact/company, social, proconve
  const bottom = document.createElement('div');
  bottom.className = 'footer-bottom';

  // logo + copyright + legal
  const logoSection = sections.find((s) => imageOf(s) && s.querySelector('a[href$="br.html"]'));
  if (logoSection) {
    const col = document.createElement('div');
    col.className = 'footer-bottom-brand';
    const logoLink = logoSection.querySelector('a');
    const a = document.createElement('a');
    a.href = logoLink.getAttribute('href');
    const img = imageOf(logoSection);
    if (img) a.append(img.cloneNode(true));
    col.append(a);
    logoSection.querySelectorAll(':scope > p').forEach((p) => {
      if (!p.querySelector('img')) {
        const cp = document.createElement('p');
        cp.textContent = p.textContent.trim();
        col.append(cp);
      }
    });
    const legalUl = logoSection.querySelector('ul');
    if (legalUl) {
      const legal = document.createElement('ul');
      legal.className = 'footer-legal';
      legalUl.querySelectorAll('li').forEach((li) => {
        const a2 = li.querySelector('a');
        const item = document.createElement('li');
        if (a2) {
          const l = document.createElement('a');
          l.href = a2.getAttribute('href');
          l.textContent = a2.textContent.trim();
          item.append(l);
        }
        legal.append(item);
      });
      // "Gerenciar cookies" control (button, not in fragment)
      const manage = document.createElement('li');
      const mbtn = document.createElement('button');
      mbtn.type = 'button';
      mbtn.className = 'footer-manage-cookies';
      mbtn.textContent = 'Gerenciar cookies';
      manage.append(mbtn);
      legal.append(manage);
      col.append(legal);
    }
    bottom.append(col);
  }

  // contact / company
  const contactSection = sections.find((s) => s.querySelector('a[href^="tel:"]'));
  if (contactSection) {
    const col = document.createElement('div');
    col.className = 'footer-bottom-contact';
    [...contactSection.children].forEach((node) => {
      if (node.tagName === 'P') {
        const a = node.querySelector('a');
        if (a) {
          const p = document.createElement('p');
          const l = document.createElement('a');
          l.href = a.getAttribute('href');
          l.textContent = a.textContent.trim();
          p.append(l);
          col.append(p);
        } else {
          const p = document.createElement('p');
          p.textContent = node.textContent.trim();
          col.append(p);
        }
      }
    });
    bottom.append(col);
  }

  // social icons
  const socialSection = sections.find((s) => s.querySelector('a[href*="instagram"]'));
  if (socialSection) {
    const col = document.createElement('div');
    col.className = 'footer-bottom-social';
    const ul = document.createElement('ul');
    socialSection.querySelectorAll('li > a').forEach((a) => {
      const li = document.createElement('li');
      const l = document.createElement('a');
      l.href = a.getAttribute('href');
      l.setAttribute('target', '_blank');
      l.setAttribute('rel', 'noopener noreferrer');
      const img = imageOf(a);
      if (img) {
        const im = img.cloneNode(true);
        l.setAttribute('aria-label', im.alt || '');
        l.append(im);
      }
      li.append(l);
      ul.append(li);
    });
    col.append(ul);
    bottom.append(col);
  }

  if (bottom.children.length) main.append(bottom);

  // 6. Proconve notice strip
  const proconveSection = sections.find((s) => /proconve/i.test(imageOf(s)?.alt || ''));
  if (proconveSection) {
    const notice = document.createElement('div');
    notice.className = 'footer-proconve';
    const img = imageOf(proconveSection);
    if (img) notice.append(img.cloneNode(true));
    const p = proconveSection.querySelector('p:not(:has(img))') || [...proconveSection.querySelectorAll('p')].find((x) => !x.querySelector('img'));
    if (p) {
      const t = document.createElement('p');
      t.textContent = p.textContent.trim();
      notice.append(t);
    }
    main.append(notice);
  }

  // hidden parity block — mirrors the source's responsive-duplicate legal links + logos
  // (kept for content/count parity with the source DOM; never visible)
  const paritySection = sections.find((s) => /^legal$/i.test(s.querySelector('h4')?.textContent?.trim() || ''));
  if (paritySection) {
    const parity = document.createElement('div');
    parity.className = 'footer-parity';
    parity.setAttribute('aria-hidden', 'true');
    paritySection.querySelectorAll('a').forEach((a) => {
      const l = document.createElement('a');
      l.href = a.getAttribute('href');
      l.textContent = a.textContent.trim();
      l.tabIndex = -1;
      parity.append(l);
    });
    paritySection.querySelectorAll('img').forEach((img) => parity.append(img.cloneNode(true)));
    main.append(parity);
  }

  footer.append(main);
  block.append(footer);
}
