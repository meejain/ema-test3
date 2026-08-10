/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/carousel-hero.js
  function parse(element, { document }) {
    let slides = element.querySelectorAll(".swiper-slide.hc-item");
    if (!slides.length) slides = element.querySelectorAll(".hc-item");
    if (!slides.length) slides = element.querySelectorAll(".swiper-slide");
    const rows = [];
    let hasText = false;
    slides.forEach((slide) => {
      const slideLink = slide.querySelector(":scope a[href], a[href]");
      const href = slideLink ? slideLink.getAttribute("href") : null;
      const picture = slide.querySelector("picture");
      const img = slide.querySelector("img");
      const video = slide.querySelector("video.hc-video-desktop") || slide.querySelector("video");
      const label = slideLink && slideLink.getAttribute("aria-label") || img && img.getAttribute("alt") || "Slide";
      let mediaCell = null;
      const textCell = [];
      if (picture || img) {
        const media = picture || img;
        if (href) {
          const a = document.createElement("a");
          a.setAttribute("href", href);
          a.append(media);
          mediaCell = a;
        } else {
          mediaCell = media;
        }
      } else if (video) {
        const vsrc = video.getAttribute("src") || video.querySelector("source") && video.querySelector("source").getAttribute("src");
        if (vsrc) {
          const va = document.createElement("a");
          va.setAttribute("href", vsrc);
          va.textContent = label;
          mediaCell = va;
        }
        if (href) {
          const la = document.createElement("a");
          la.setAttribute("href", href);
          la.textContent = label;
          textCell.push(la);
          hasText = true;
        }
      }
      if (!mediaCell) return;
      const titleContent = slide.querySelector(".hc-title-content, .hc-texts-container");
      if (titleContent && titleContent.textContent.trim()) {
        Array.from(titleContent.childNodes).forEach((node) => {
          if (node.nodeType === 1 || node.nodeType === 3 && node.textContent.trim()) {
            textCell.push(node);
          }
        });
        hasText = true;
      }
      rows.push({ mediaCell, textCell });
    });
    if (!rows.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    rows.forEach(({ mediaCell, textCell }) => {
      if (hasText) {
        cells.push([mediaCell, textCell.length ? textCell : ""]);
      } else {
        cells.push([mediaCell]);
      }
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero-spotlight.js
  function parse2(element, { document }) {
    const bgVideo = element.querySelector(".fvp-thumb video, .fvp-thumb source, video");
    const vehicleImg = element.querySelector(".fvp-vehicle img, img");
    const ctaLinks = Array.from(
      element.querySelectorAll(".fvp-button-content a[href], a.hyundai-button[href]")
    );
    const heading = element.querySelector('h1, h2, [class*="title"]:not(video):not(img)');
    const subheading = element.querySelector('h3, h4, p, [class*="subtitle"]');
    if (!bgVideo && !vehicleImg && !ctaLinks.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (bgVideo) {
      cells.push([bgVideo]);
    }
    const contentCell = [];
    if (heading) contentCell.push(heading);
    if (subheading && subheading !== heading) contentCell.push(subheading);
    if (vehicleImg) contentCell.push(vehicleImg);
    contentCell.push(...ctaLinks);
    if (contentCell.length) {
      cells.push([contentCell]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-spotlight", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-vehicle.js
  function parse3(element, { document }) {
    const cells = [];
    let cards = element.querySelectorAll(
      '.vs-card, .vehicle-card, .vs-vehicle, [class*="vehicle-card"], [class*="vs-card"]'
    );
    cards.forEach((card) => {
      const img = card.querySelector("img, picture");
      const title = card.querySelector('h1, h2, h3, h4, [class*="title"], [class*="model"]');
      const price = card.querySelector('[class*="price"]');
      const cta = card.querySelector("a[href]");
      const textCell = [];
      if (title) textCell.push(title);
      if (price && price !== title) textCell.push(price);
      if (cta) textCell.push(cta);
      if (img || textCell.length) {
        cells.push([img || "", textCell.length ? textCell : ""]);
      }
    });
    if (!cells.length) {
      const panelImg = element.querySelector(".vs-panel img, .vs-panel picture, .vs-body img");
      if (panelImg) {
        cells.push([panelImg, ""]);
      }
    }
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-vehicle", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-mosaic.js
  function parse4(element, { document }) {
    const cells = [];
    const seen = /* @__PURE__ */ new Set();
    const anchors = Array.from(element.querySelectorAll("a[href]"));
    anchors.forEach((a) => {
      const media = a.querySelector("picture, img");
      if (!media) return;
      if (seen.has(a)) return;
      seen.add(a);
      cells.push([a, ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-mosaic", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-offer.js
  function parse5(element, { document }) {
    const cells = [];
    const cardsArea = element.querySelector(".offer-slider-content, .swiper-wrapper") || element;
    let cards = cardsArea.querySelectorAll(
      '.offer-card, .os-card, .swiper-slide, [class*="offer-card"], [class*="os-card"]'
    );
    cards.forEach((card) => {
      const img = card.querySelector("img, picture");
      const title = card.querySelector('h1, h2, h3, h4, [class*="title"], [class*="model"]');
      const price = card.querySelector('[class*="price"], [class*="condition"], [class*="condicao"]');
      const cta = card.querySelector("a[href]");
      const textCell = [];
      if (title) textCell.push(title);
      if (price && price !== title) textCell.push(price);
      if (cta) textCell.push(cta);
      if (img || textCell.length) {
        cells.push([img || "", textCell.length ? textCell : ""]);
      }
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-offer", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-cta.js
  function parse6(element, { document }) {
    const image = element.querySelector(".cp-image img, .cp-image picture, img");
    const heading = element.querySelector(".cp-title, h3, h2");
    const subheading = element.querySelector(".cp-text, h4, p");
    const cta = element.querySelector(".cp-link a[href], a.hyundai-button[href], a[href]");
    const textCell = [];
    if (heading) textCell.push(heading);
    if (subheading && subheading !== heading) textCell.push(subheading);
    if (cta) textCell.push(cta);
    if (!image && !textCell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[image || "", textCell.length ? textCell : ""]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-cta", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-linkhub.js
  function parse7(element, { document }) {
    const col1 = [];
    const title = element.querySelector(".lh-title, h2");
    if (title) col1.push(title);
    const subtitleGroup = element.querySelector(".lh-texts-subtitle");
    if (subtitleGroup) {
      col1.push(subtitleGroup);
    } else {
      const subtitle = element.querySelector(".lh-subtitle, h3");
      if (subtitle) col1.push(subtitle);
    }
    const links = Array.from(element.querySelectorAll(".lb-links a.lb-link[href], .lb-link[href]"));
    if (links.length) {
      const list = document.createElement("ul");
      links.forEach((a) => {
        const li = document.createElement("li");
        const text = a.textContent.trim();
        const newA = document.createElement("a");
        newA.setAttribute("href", a.getAttribute("href"));
        newA.textContent = text;
        li.append(newA);
        list.append(li);
      });
      col1.push(list);
    }
    const image = element.querySelector(".lh-image img, .lh-image picture");
    if (!col1.length && !image) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[col1.length ? col1 : "", image || ""]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-linkhub", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/hyundai-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        ".hyundai-loading",
        // SPA loading spinner/skeleton (cleaned.html:4)
        "#onetrust-consent-sdk",
        // OneTrust cookie consent (cleaned.html:1767)
        ".ht-skip",
        // HandTalk accessibility widget (cleaned.html:2048)
        "#destination_publishing_iframe_hyundaibrasil_0",
        // Adobe ID-sync tracking iframe (cleaned.html:1762)
        'img[src*="ib.adnxs.com"]',
        // AppNexus tracking pixel (cleaned.html:1766)
        "noscript"
        // <noscript> fallbacks (not content)
      ]);
      element.querySelectorAll("p").forEach((p) => {
        if (/enable JavaScript to run this app/i.test(p.textContent || "")) {
          p.remove();
        }
      });
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        ".hyundai-header",
        // Header experience fragment (cleaned.html:19)
        ".hyundai-footer"
        // Footer experience fragment (cleaned.html:1397)
      ]);
    }
  }

  // tools/importer/transformers/hyundai-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var FOLLOWING = 4;
  function resolveSectionElements(element, sections) {
    const resolved = [];
    let lastEl = null;
    sections.forEach((section) => {
      const candidates = section.selector ? Array.from(element.querySelectorAll(section.selector)) : [];
      let chosen = null;
      if (lastEl) {
        chosen = candidates.find(
          (c) => !resolved.includes(c) && lastEl.compareDocumentPosition(c) & FOLLOWING
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
  function transform2(hookName, element, payload) {
    if (hookName === TransformHook2.afterTransform) {
      const sections = payload && payload.template && payload.template.sections || [];
      if (sections.length < 2) return;
      const doc = element.ownerDocument;
      const sectionEls = resolveSectionElements(element, sections);
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const sectionEl = sectionEls[i];
        if (!sectionEl) continue;
        if (section.style) {
          const metaBlock = WebImporter.Blocks.createBlock(doc, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          sectionEl.after(metaBlock);
        }
        if (i > 0) {
          sectionEl.before(doc.createElement("hr"));
        }
      }
    }
  }

  // tools/importer/import-homepage.js
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "Hyundai Brazil homepage: hero carousel, full-video vehicle spotlight, vehicle showroom slider, mosaic promo grids, offer slider, CTA banner, and a link hub. Header and footer are experience fragments handled separately.",
    urls: [
      "https://www.hyundai.com.br/"
    ],
    blocks: [
      { name: "carousel-hero", instances: ["#hyunda_carousel"] },
      { name: "hero-spotlight", instances: [".full-video-page"] },
      { name: "cards-vehicle", instances: [".vehicle-showroom"] },
      { name: "cards-mosaic", instances: [".mosaic"] },
      { name: "cards-offer", instances: [".offers-slider"] },
      { name: "columns-cta", instances: [".call-page"] },
      { name: "columns-linkhub", instances: [".link-hub"] }
    ],
    sections: [
      { id: "rc1", name: "hero-carousel", selector: "#hyunda_carousel", style: null, blocks: ["carousel-hero"], defaultContent: [] },
      { id: "rc2", name: "kona-spotlight", selector: ".full-video-page", style: null, blocks: ["hero-spotlight"], defaultContent: [] },
      { id: "rc3", name: "vehicle-showroom", selector: ".vehicle-showroom", style: null, blocks: ["cards-vehicle"], defaultContent: ["h1.vs-title"] },
      { id: "rc4", name: "mosaic-grid-1", selector: ".mosaic", style: null, blocks: ["cards-mosaic"], defaultContent: [] },
      { id: "rc5", name: "offer-slider", selector: ".offers-slider", style: null, blocks: ["cards-offer"], defaultContent: [".os-texts-home-title", ".os-texts-home-text"] },
      { id: "rc6", name: "cta-banner", selector: ".call-page", style: null, blocks: ["columns-cta"], defaultContent: [] },
      { id: "rc7", name: "link-hub", selector: ".link-hub", style: null, blocks: ["columns-linkhub"], defaultContent: [] },
      { id: "rc8", name: "mosaic-grid-2", selector: ".mosaic", style: null, blocks: ["cards-mosaic"], defaultContent: [] }
    ]
  };
  var parsers = {
    "carousel-hero": parse,
    "hero-spotlight": parse2,
    "cards-vehicle": parse3,
    "cards-mosaic": parse4,
    "cards-offer": parse5,
    "columns-cta": parse6,
    "columns-linkhub": parse7
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    const seen = /* @__PURE__ */ new Set();
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          if (seen.has(element)) return;
          seen.add(element);
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_homepage_default = {
    transform: (payload) => {
      const {
        document,
        url,
        html,
        params
      } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
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
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();
