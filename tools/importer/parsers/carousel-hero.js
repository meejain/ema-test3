/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-hero. Base: carousel.
 * Source: https://www.hyundai.com.br/ (#hyunda_carousel)
 * Generated: 2026-08-09
 *
 * Library convention (carousel): 2 columns, multiple rows. First row = block name.
 * Each subsequent row = one slide: cell1 = slide media (image, mandatory),
 * cell2 = optional text (heading / description / CTA).
 *
 * Source specifics: each `.hc-item` slide is a full-bleed clickable banner. The
 * whole slide is wrapped in a single `<a>` linking to a landing page, and the
 * media is either a `<picture>`/`<img>` or a pair of `<video>` (desktop + mobile).
 * The `.hc-title-content` text overlay is empty on this page, so slides carry no
 * heading/description/CTA text. We emit each slide as a linked image or linked
 * video. If any slide has real overlay text (other pages), a second text column
 * is added and empty text cells are padded so every row keeps the same width.
 */
export default function parse(element, { document }) {
  // Slides: prefer real slides; ignore swiper clones by using .hc-item.
  let slides = element.querySelectorAll('.swiper-slide.hc-item');
  if (!slides.length) slides = element.querySelectorAll('.hc-item');
  if (!slides.length) slides = element.querySelectorAll('.swiper-slide');

  const rows = [];
  let hasText = false;

  slides.forEach((slide) => {
    // Landing destination for the slide (whole slide is clickable).
    const slideLink = slide.querySelector(':scope a[href], a[href]');
    const href = slideLink ? slideLink.getAttribute('href') : null;

    // Media: picture/image preferred; otherwise the desktop video (single).
    const picture = slide.querySelector('picture');
    const img = slide.querySelector('img');
    const video = slide.querySelector('video.hc-video-desktop')
      || slide.querySelector('video');

    const label = (slideLink && slideLink.getAttribute('aria-label'))
      || (img && img.getAttribute('alt'))
      || 'Slide';

    let mediaCell = null;
    const textCell = [];

    if (picture || img) {
      // Image slide: keep the media wrapped in the landing link (markdown-safe).
      const media = picture || img;
      if (href) {
        const a = document.createElement('a');
        a.setAttribute('href', href);
        a.append(media);
        mediaCell = a;
      } else {
        mediaCell = media;
      }
    } else if (video) {
      // Video slide: <video> can't survive html2md, so emit a markdown-safe LINK
      // to the video file (the block turns .mp4 links into autoplaying <video>),
      // and carry the landing destination as a second-column link. Both links have
      // visible label text so markdown keeps them as [text](url).
      const vsrc = video.getAttribute('src')
        || (video.querySelector('source') && video.querySelector('source').getAttribute('src'));
      if (vsrc) {
        const va = document.createElement('a');
        va.setAttribute('href', vsrc);
        va.textContent = label;
        mediaCell = va;
      }
      if (href) {
        const la = document.createElement('a');
        la.setAttribute('href', href);
        la.textContent = label;
        textCell.push(la);
        hasText = true;
      }
    }

    if (!mediaCell) return; // slide with no media — skip gracefully

    // Optional overlay text (title / description / CTA). Empty on this page.
    const titleContent = slide.querySelector('.hc-title-content, .hc-texts-container');
    if (titleContent && titleContent.textContent.trim()) {
      Array.from(titleContent.childNodes).forEach((node) => {
        if (node.nodeType === 1 || (node.nodeType === 3 && node.textContent.trim())) {
          textCell.push(node);
        }
      });
      hasText = true;
    }

    rows.push({ mediaCell, textCell });
  });

  // Empty-block guard: no usable slides.
  if (!rows.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  rows.forEach(({ mediaCell, textCell }) => {
    if (hasText) {
      cells.push([mediaCell, textCell.length ? textCell : '']);
    } else {
      cells.push([mediaCell]);
    }
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-hero', cells });
  element.replaceWith(block);
}
