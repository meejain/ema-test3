/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-cta. Base: columns.
 * Source: https://www.hyundai.com.br/ (.call-page)
 * Generated: 2026-08-09
 *
 * Library convention (columns): first row = block name; subsequent rows have as
 * many cells as there are columns. Here the content is a single side-by-side row
 * of 2 columns.
 *
 * Source specifics (.call-page):
 *   - `.cp-image img`  — promotional image (col 1).
 *   - `.cp-content`    — text group (col 2):
 *       `h3.cp-title`  headline, `h4.cp-text` subheading,
 *       `.cp-link a.hyundai-button` ("Clique e confira") CTA to /ofertas.html.
 * Single row, 2 columns: [image] | [heading + subheading + CTA].
 */
export default function parse(element, { document }) {
  // Column 1: promotional image.
  const image = element.querySelector('.cp-image img, .cp-image picture, img');

  // Column 2: headline + subheading + CTA.
  const heading = element.querySelector('.cp-title, h3, h2');
  const subheading = element.querySelector('.cp-text, h4, p');
  const cta = element.querySelector('.cp-link a[href], a.hyundai-button[href], a[href]');

  const textCell = [];
  if (heading) textCell.push(heading);
  if (subheading && subheading !== heading) textCell.push(subheading);
  if (cta) textCell.push(cta);

  // Empty-block guard: nothing meaningful to emit.
  if (!image && !textCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Single 2-column row: image | text. Pad missing side with '' to keep 2 cells.
  const cells = [[image || '', textCell.length ? textCell : '']];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-cta', cells });
  element.replaceWith(block);
}
