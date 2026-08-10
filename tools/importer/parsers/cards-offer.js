/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-offer. Base: cards.
 * Source: https://www.hyundai.com.br/ (.offers-slider)
 * Generated: 2026-08-09
 *
 * Library convention (cards): 2 columns, multiple rows. First row = block name.
 * Each subsequent row = one card: cell1 = image (mandatory),
 * cell2 = text (title / description / CTA).
 *
 * ⚠️ API-LOADED CONTENT: The offer cards are fetched at runtime from an external
 * API (meuhyundai.com.br) and were NOT present at capture time. Only the static
 * header shell rendered:
 *   - `h2.os-texts-home-title` ("Ofertas") + `h3.os-texts-home-text`
 *     ("Garanta já seu novo Hyundai 0 km.") + `a.hyundai-button` ("Ver todas") —
 *     handled as SECTION DEFAULT CONTENT (see page-templates.json defaultContent),
 *     so intentionally NOT emitted by this block parser.
 *   - `.offer-slider-content .swiper-wrapper` — EMPTY at capture (no offer cards).
 *
 * This parser populates real offer cards when they ARE present (each card = image
 * + model + price/condition + CTA) and bails gracefully to nothing when the cards
 * area is empty. It must never throw on the empty shell.
 */
export default function parse(element, { document }) {
  const cells = [];

  // Real offer cards, if the API-rendered DOM is present. Scope to the cards
  // area so the header shell (default content) is never picked up.
  const cardsArea = element.querySelector('.offer-slider-content, .swiper-wrapper') || element;
  let cards = cardsArea.querySelectorAll(
    '.offer-card, .os-card, .swiper-slide, [class*="offer-card"], [class*="os-card"]',
  );

  cards.forEach((card) => {
    const img = card.querySelector('img, picture');
    const title = card.querySelector('h1, h2, h3, h4, [class*="title"], [class*="model"]');
    const price = card.querySelector('[class*="price"], [class*="condition"], [class*="condicao"]');
    const cta = card.querySelector('a[href]');

    const textCell = [];
    if (title) textCell.push(title);
    if (price && price !== title) textCell.push(price);
    if (cta) textCell.push(cta);

    // Only emit a card if it has real content.
    if (img || textCell.length) {
      cells.push([img || '', textCell.length ? textCell : '']);
    }
  });

  // No real cards captured (API shell only). The header (title/subtitle/"Ver
  // todas") is section default content and lives outside the block, so there is
  // nothing for the block to emit — bail gracefully without crashing.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-offer', cells });
  element.replaceWith(block);
}
