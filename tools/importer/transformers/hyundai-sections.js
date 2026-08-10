/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Hyundai Brazil section boundaries.
 *
 * Inserts a section break (<hr>) before every section after the first, and a
 * "Section Metadata" block for any section that declares a `style`. Section
 * definitions come from payload.template.sections (page-templates.json).
 *
 * Runs in afterTransform only: block parsers run between the hooks and need the
 * raw section markup intact; adding <hr>/metadata beforehand would not affect
 * parsing but the section structure is a final-output concern.
 *
 * DUPLICATE-SELECTOR HANDLING: the homepage template lists `.mosaic` for both
 * rc4 (mosaic-grid-1) and rc8 (mosaic-grid-2). A plain querySelector would
 * return the first `.mosaic` for both, collapsing the boundary. resolveSectionElements
 * walks sections in document order and consumes each matched element so the
 * second `.mosaic` resolves to the second occurrence.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// DOCUMENT_POSITION_FOLLOWING: node passed to compareDocumentPosition follows the reference node.
const FOLLOWING = 4;

/**
 * Resolve each section's DOM element in document order, disambiguating repeated
 * selectors (e.g. `.mosaic`) by consuming already-matched elements and preferring
 * the next candidate that follows the previously matched section.
 */
function resolveSectionElements(element, sections) {
  const resolved = [];
  let lastEl = null;
  sections.forEach((section) => {
    const candidates = section.selector
      ? Array.from(element.querySelectorAll(section.selector))
      : [];
    let chosen = null;
    if (lastEl) {
      chosen = candidates.find(
        (c) => !resolved.includes(c) && (lastEl.compareDocumentPosition(c) & FOLLOWING),
      );
    }
    if (!chosen) {
      chosen = candidates.find((c) => !resolved.includes(c)) || candidates[0] || null;
    }
    resolved.push(chosen);
    if (chosen) lastEl = chosen;
  });
  return resolved;
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.afterTransform) {
    const sections = (payload && payload.template && payload.template.sections) || [];
    if (sections.length < 2) return;

    const doc = element.ownerDocument;
    const sectionEls = resolveSectionElements(element, sections);

    // Reverse order so earlier insertions never shift later lookups (elements
    // are pre-resolved to references, so this is belt-and-suspenders safe).
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const sectionEl = sectionEls[i];
      if (!sectionEl) continue;

      // Section Metadata block (only when the section declares a style).
      if (section.style) {
        const metaBlock = WebImporter.Blocks.createBlock(doc, {
          name: 'Section Metadata',
          cells: { style: section.style },
        });
        sectionEl.after(metaBlock);
      }

      // Section break before every section except the first.
      if (i > 0) {
        sectionEl.before(doc.createElement('hr'));
      }
    }
  }
}
