/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-linkhub. Base: columns.
 * Source: https://www.hyundai.com.br/ (.link-hub)
 * Generated: 2026-08-09
 *
 * Library convention (columns): first row = block name; subsequent rows have as
 * many cells as there are columns. Here the content is a single side-by-side row
 * of 2 columns.
 *
 * Source specifics (.link-hub):
 *   - `.lh-hub` (col 1): heading group + service links —
 *       `h2.lh-title` ("Proprietários"),
 *       `.lh-texts-subtitle` = `.lh-icon img` (Serviços icon) + `h3.lh-subtitle` ("Serviços"),
 *       `.lb-links a.lb-link` × 6 (Recall, Revisão programada, Quick Service,
 *        Atualizações, myHyundaiCare, Bluelink).
 *   - `.lh-image img` (col 2): large Hyundai CRETA image.
 * Single row, 2 columns: [heading group + service links] | [CRETA image].
 */
export default function parse(element, { document }) {
  // Column 1: heading group + service links.
  const col1 = [];

  const title = element.querySelector('.lh-title, h2');
  if (title) col1.push(title);

  // Subtitle group (icon + "Serviços"). Keep the whole group so the icon is
  // preserved alongside the H3.
  const subtitleGroup = element.querySelector('.lh-texts-subtitle');
  if (subtitleGroup) {
    col1.push(subtitleGroup);
  } else {
    const subtitle = element.querySelector('.lh-subtitle, h3');
    if (subtitle) col1.push(subtitle);
  }

  // Service links — build a list so semantics/order are preserved.
  const links = Array.from(element.querySelectorAll('.lb-links a.lb-link[href], .lb-link[href]'));
  if (links.length) {
    const list = document.createElement('ul');
    links.forEach((a) => {
      const li = document.createElement('li');
      // Use the link text (span.lh-link-text) but keep it as a real anchor.
      const text = a.textContent.trim();
      const newA = document.createElement('a');
      newA.setAttribute('href', a.getAttribute('href'));
      newA.textContent = text;
      li.append(newA);
      list.append(li);
    });
    col1.push(list);
  }

  // Column 2: CRETA image.
  const image = element.querySelector('.lh-image img, .lh-image picture');

  // Empty-block guard.
  if (!col1.length && !image) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Single 2-column row: text/links | image. Pad missing side to keep 2 cells.
  const cells = [[col1.length ? col1 : '', image || '']];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-linkhub', cells });
  element.replaceWith(block);
}
