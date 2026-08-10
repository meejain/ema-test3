/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-vehicle. Base: cards.
 * Source: https://www.hyundai.com.br/ (.vehicle-showroom)
 * Generated: 2026-08-09
 *
 * Library convention (cards): 2 columns, multiple rows. First row = block name.
 * Each subsequent row = one card: cell1 = image (mandatory),
 * cell2 = text (title / description / CTA).
 *
 * ⚠️ API-LOADED CONTENT: The vehicle showroom cards are fetched at runtime from an
 * external API (meuhyundai.com.br) and were NOT present at capture time. Only the
 * static shell rendered:
 *   - `h1.vs-title` ("Confira os carros da Hyundai") — handled as SECTION DEFAULT
 *     CONTENT (see page-templates.json defaultContent), so it is intentionally NOT
 *     emitted by this block parser.
 *   - `.vs-panel img` — decorative panel image.
 *   - `.vs-footer` "A partir de" price prefix — incomplete card fragment (no model,
 *     no price value, no CTA), so it is NOT emitted as a card.
 *
 * This parser is written to populate real vehicle cards when they ARE present
 * (each card = image + model + "A partir de" price + CTA), and to degrade
 * gracefully to the panel image (or bail) when only the shell exists. It must
 * never throw on the empty shell.
 */
export default function parse(element, { document }) {
  const cells = [];

  // 1) Real vehicle cards, if the API-rendered DOM is present.
  // Try a range of likely card containers without over-matching the shell.
  let cards = element.querySelectorAll(
    '.vs-card, .vehicle-card, .vs-vehicle, [class*="vehicle-card"], [class*="vs-card"]',
  );

  cards.forEach((card) => {
    const img = card.querySelector('img, picture');
    const title = card.querySelector('h1, h2, h3, h4, [class*="title"], [class*="model"]');
    const price = card.querySelector('[class*="price"]');
    const cta = card.querySelector('a[href]');

    const textCell = [];
    if (title) textCell.push(title);
    if (price && price !== title) textCell.push(price);
    if (cta) textCell.push(cta);

    // Only emit a card if it has real content beyond an image.
    if (img || textCell.length) {
      cells.push([img || '', textCell.length ? textCell : '']);
    }
  });

  // 2) No real cards captured (API shell only). Fall back to the panel image so
  // the block is not empty, matching the 2-column card structure.
  if (!cells.length) {
    const panelImg = element.querySelector('.vs-panel img, .vs-panel picture, .vs-body img');
    if (panelImg) {
      cells.push([panelImg, '']);
    }
  }

  // 3) Still nothing usable — bail gracefully (title is default content and lives
  // outside the block).
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-vehicle', cells });
  element.replaceWith(block);
}
