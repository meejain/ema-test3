/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Hyundai Brazil site-wide cleanup.
 *
 * Removes non-authorable global chrome and SPA / tracking artifacts so the
 * import contains only the 8 authorable content sections. Every selector below
 * was verified against migration-work/cleaned.html (line references in comments).
 *
 * NOTE: content sections use <video>, <picture> and <source> elements
 * (hero carousel, kona spotlight, mosaic tiles). These are authorable content
 * handled by the block parsers, so they are intentionally NOT removed here.
 * The MuiSkeleton-* loaders live INSIDE content sections rc3/rc5 (API-loaded
 * card shells) and are also left for the parsers.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Overlays / widgets / SPA chrome / tracking — removed before block parsing.
    WebImporter.DOMUtils.remove(element, [
      '.hyundai-loading',                       // SPA loading spinner/skeleton (cleaned.html:4)
      '#onetrust-consent-sdk',                  // OneTrust cookie consent (cleaned.html:1767)
      '.ht-skip',                               // HandTalk accessibility widget (cleaned.html:2048)
      '#destination_publishing_iframe_hyundaibrasil_0', // Adobe ID-sync tracking iframe (cleaned.html:1762)
      'img[src*="ib.adnxs.com"]',               // AppNexus tracking pixel (cleaned.html:1766)
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable global chrome — header and footer experience fragments
    // (migrated separately by navigation / footer migration).
    WebImporter.DOMUtils.remove(element, [
      '.hyundai-header',                        // Header experience fragment (cleaned.html:19)
      '.hyundai-footer',                        // Footer experience fragment (cleaned.html:1397)
    ]);
  }
}
