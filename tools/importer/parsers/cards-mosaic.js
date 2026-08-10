/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-mosaic. Base: cards.
 * Source: https://www.hyundai.com.br/ (.mosaic)
 * Generated: 2026-08-09
 *
 * Library convention (cards): 2 columns, multiple rows. First row = block name.
 * Each subsequent row = one card: cell1 = image (mandatory), cell2 = text (optional).
 *
 * Source specifics (.mosaic): an asymmetric grid of linked image tiles. Two tile
 * shapes exist:
 *   - `.mosaic-item > a`               — a standalone tile (single linked image).
 *   - `.mosaic-item > .mosaic-dual-column > .mosaic-dual-item > a` — dual-column
 *     tiles (two linked images side by side inside one mosaic-item).
 * Handles both the 5-tile grid (rc4) and the 2-tile dual-column grid (rc8).
 *
 * Each tile has NO text — the headline is baked into the artwork — so cell2 is
 * left empty (''), keeping every row at 2 columns per the cards convention.
 *
 * We select each leaf anchor that wraps an image (rather than the tile-container
 * classes) so the standalone `.mosaic-item` anchors and the nested
 * `.mosaic-dual-item` anchors are each counted exactly once (no double-select).
 */
export default function parse(element, { document }) {
  const cells = [];
  const seen = new Set();

  // Every tile is a link that directly wraps a picture/image. Selecting on that
  // relationship avoids double-counting the dual-column tiles (whose anchors are
  // descendants of an outer .mosaic-item).
  const anchors = Array.from(element.querySelectorAll('a[href]'));

  anchors.forEach((a) => {
    const media = a.querySelector('picture, img');
    if (!media) return; // not an image tile
    if (seen.has(a)) return;
    seen.add(a);
    // Reuse the anchor as cell content: it already contains the linked image
    // (with alt text preserved). cell2 empty — tiles carry no separate text.
    cells.push([a, '']);
  });

  // Empty-block guard: no image tiles found.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-mosaic', cells });
  element.replaceWith(block);
}
