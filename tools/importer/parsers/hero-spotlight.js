/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-spotlight. Base: hero.
 * Source: https://www.hyundai.com.br/ (.full-video-page)
 * Generated: 2026-08-09
 *
 * Library convention (hero): 1 column, 3 rows. First row = block name.
 * Row 2 (single cell) = background media (optional).
 * Row 3 (single cell) = title (heading, optional) + subheading (optional) + CTA (optional).
 *
 * Source specifics (.full-video-page):
 *   - `.fvp-thumb video` — background video (media).
 *   - `.fvp-vehicle img`  — foreground vehicle image.
 *   - `.fvp-button-content a.hyundai-button` — single "Conheça" CTA to /veiculos/kona-hibrido.html.
 * There is no headline/subheading text on this page, so row 3 holds the
 * foreground vehicle image + the CTA. Both media (background video and vehicle
 * image) are preserved. Hero is 1-column: every row is a single cell.
 */
export default function parse(element, { document }) {
  // Background media: prefer the full-bleed background video.
  const bgVideo = element.querySelector('.fvp-thumb video, .fvp-thumb source, video');
  // Foreground vehicle image.
  const vehicleImg = element.querySelector('.fvp-vehicle img, img');
  // CTA(s): the "Conheça" button link.
  const ctaLinks = Array.from(
    element.querySelectorAll('.fvp-button-content a[href], a.hyundai-button[href]'),
  );
  // Optional heading / subheading text (none on this page, kept for resilience).
  const heading = element.querySelector('h1, h2, [class*="title"]:not(video):not(img)');
  const subheading = element.querySelector('h3, h4, p, [class*="subtitle"]');

  // Empty-block guard: nothing meaningful to emit.
  if (!bgVideo && !vehicleImg && !ctaLinks.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 2: background media (optional).
  if (bgVideo) {
    cells.push([bgVideo]);
  }

  // Row 3: foreground content (vehicle image + heading + subheading + CTA).
  const contentCell = [];
  if (heading) contentCell.push(heading);
  if (subheading && subheading !== heading) contentCell.push(subheading);
  if (vehicleImg) contentCell.push(vehicleImg);
  contentCell.push(...ctaLinks);

  // If there was no background media, still emit the content row so the block
  // is not empty.
  if (contentCell.length) {
    cells.push([contentCell]); // 1-column: one row, one cell holding all elements
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-spotlight', cells });
  element.replaceWith(block);
}
