/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import carouselHeroParser from './parsers/carousel-hero.js';
import heroSpotlightParser from './parsers/hero-spotlight.js';
import cardsVehicleParser from './parsers/cards-vehicle.js';
import cardsMosaicParser from './parsers/cards-mosaic.js';
import cardsOfferParser from './parsers/cards-offer.js';
import columnsCtaParser from './parsers/columns-cta.js';
import columnsLinkhubParser from './parsers/columns-linkhub.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/hyundai-cleanup.js';
import sectionsTransformer from './transformers/hyundai-sections.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'Hyundai Brazil homepage: hero carousel, full-video vehicle spotlight, vehicle showroom slider, mosaic promo grids, offer slider, CTA banner, and a link hub. Header and footer are experience fragments handled separately.',
  urls: [
    'https://www.hyundai.com.br/',
  ],
  blocks: [
    { name: 'carousel-hero', instances: ['#hyunda_carousel'] },
    { name: 'hero-spotlight', instances: ['.full-video-page'] },
    { name: 'cards-vehicle', instances: ['.vehicle-showroom'] },
    { name: 'cards-mosaic', instances: ['.mosaic'] },
    { name: 'cards-offer', instances: ['.offers-slider'] },
    { name: 'columns-cta', instances: ['.call-page'] },
    { name: 'columns-linkhub', instances: ['.link-hub'] },
  ],
  sections: [
    { id: 'rc1', name: 'hero-carousel', selector: '#hyunda_carousel', style: null, blocks: ['carousel-hero'], defaultContent: [] },
    { id: 'rc2', name: 'kona-spotlight', selector: '.full-video-page', style: null, blocks: ['hero-spotlight'], defaultContent: [] },
    { id: 'rc3', name: 'vehicle-showroom', selector: '.vehicle-showroom', style: null, blocks: ['cards-vehicle'], defaultContent: ['h1.vs-title'] },
    { id: 'rc4', name: 'mosaic-grid-1', selector: '.mosaic', style: null, blocks: ['cards-mosaic'], defaultContent: [] },
    { id: 'rc5', name: 'offer-slider', selector: '.offers-slider', style: null, blocks: ['cards-offer'], defaultContent: ['.os-texts-home-title', '.os-texts-home-text'] },
    { id: 'rc6', name: 'cta-banner', selector: '.call-page', style: null, blocks: ['columns-cta'], defaultContent: [] },
    { id: 'rc7', name: 'link-hub', selector: '.link-hub', style: null, blocks: ['columns-linkhub'], defaultContent: [] },
    { id: 'rc8', name: 'mosaic-grid-2', selector: '.mosaic', style: null, blocks: ['cards-mosaic'], defaultContent: [] },
  ],
};

// PARSER REGISTRY
const parsers = {
  'carousel-hero': carouselHeroParser,
  'hero-spotlight': heroSpotlightParser,
  'cards-vehicle': cardsVehicleParser,
  'cards-mosaic': cardsMosaicParser,
  'cards-offer': cardsOfferParser,
  'columns-cta': columnsCtaParser,
  'columns-linkhub': columnsLinkhubParser,
};

// TRANSFORMER REGISTRY - cleanup runs first; section transformer runs after when 2+ sections
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - The hook name ('beforeTransform' or 'afterTransform')
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - The payload containing { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Array of block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        // Guard against the same element being matched by multiple selectors
        if (seen.has(element)) return;
        seen.add(element);
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. Execute beforeTransform transformers (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page using embedded template
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block using registered parsers
    //    Skip elements already replaced by a prior parser (detached from DOM)
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Execute afterTransform transformers (final cleanup + section breaks/metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path. Map the root/homepage URL to `/index` — a `/`
    //    pathname becomes '' after trailing-slash stripping, which crashes the
    //    bundled importer's path polyfill (`.cwd is not a function`).
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
