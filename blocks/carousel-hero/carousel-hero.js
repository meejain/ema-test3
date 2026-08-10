/*
 * carousel-hero
 * Full-bleed homepage hero slider that replicates the source site's top carousel:
 * autoplaying, looping slides with prev/next arrows and pagination bullets.
 *
 * Content model: each block row is one slide. A slide cell contains either
 *  - a linked <picture> (image slide), or
 *  - a plain-text destination link `[](url)` for slides whose media is a video.
 *
 * The source's four video slides could not be brought over by the importer
 * (it only handles images), so their destination links arrive as bare text.
 * We reconstruct those slides here, referencing the original source videos.
 */

const SOURCE = 'https://www.hyundai.com.br';

// Video slides dropped during import, keyed by a fragment of their destination
// link so we can re-attach the original source video to the authored slide.
const VIDEO_SLIDES = [
  {
    match: 'novo-hyundai-i20',
    src: `${SOURCE}/content/dam/hmb/new-home/mkv/lancamento-2026/i20_MKV-sonho_1920x800.mp4`,
    label: 'Novo Hyundai i20',
  },
  {
    match: 'veiculoId=15',
    src: `${SOURCE}/content/dam/hmb/new-home/mkv/missao-hyundai/1920x800_MKV_CONVERSAO_Missao-Hyundai_Linha-HB20_Animado.mp4`,
    label: 'Missão Hyundai',
  },
  {
    match: 'hyundai-assina',
    src: `${SOURCE}/content/dam/hmb/new-home/mkv/hyundai_assina/1920X800_MKV_DESKTOP_HYUNDAI_ASSINA.mp4`,
    label: 'Hyundai Assina',
  },
  {
    match: 'codigo=4DAA28A9',
    src: `${SOURCE}/content/dam/hmb/new-home/mkv/palisade/1920x800_MKV_CONVERSAO_PALISADE-Signature_Animado_Oferta_3007.mp4`,
    label: 'Palisade',
  },
];

const AUTOPLAY_MS = 5000;

/**
 * Builds a video slide media element for a destination link.
 * @param {string} href destination url
 * @returns {HTMLElement|null} anchor wrapping the source video, or null
 */
function buildVideoSlide(href) {
  const config = VIDEO_SLIDES.find((v) => href.includes(v.match));
  if (!config) return null;

  const link = document.createElement('a');
  link.href = href;
  link.setAttribute('aria-label', config.label);

  const video = document.createElement('video');
  video.src = config.src;
  video.muted = true;
  video.loop = true;
  video.autoplay = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('aria-label', config.label);

  link.append(video);
  return link;
}

/**
 * Extracts the slide media (linked picture or reconstructed video) from a row.
 * @param {Element} row a block row
 * @returns {HTMLElement|null}
 */
function extractSlideMedia(row) {
  // image slide: a linked picture is authored directly
  const linkedPicture = row.querySelector('a:has(picture), picture');
  if (linkedPicture) {
    return linkedPicture.closest('a') || linkedPicture;
  }

  // video slide: the destination arrived as bare `[](url)` text
  const text = row.textContent.trim();
  const linkMatch = text.match(/\]\((.*?)\)/) || text.match(/(https?:\/\/\S+)/);
  if (linkMatch) {
    return buildVideoSlide(linkMatch[1]);
  }
  return null;
}

/**
 * loads and decorates the carousel-hero block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.children];

  const track = document.createElement('div');
  track.className = 'carousel-hero-track';

  const slides = [];
  rows.forEach((row) => {
    const media = extractSlideMedia(row);
    if (!media) return;
    const slide = document.createElement('div');
    slide.className = 'carousel-hero-slide';
    slide.append(media);
    track.append(slide);
    slides.push(slide);
  });

  block.textContent = '';
  block.append(track);

  const total = slides.length;
  if (total === 0) return;

  let current = 0;
  let timer;

  const dots = document.createElement('div');
  dots.className = 'carousel-hero-dots';
  dots.setAttribute('role', 'tablist');
  dots.setAttribute('aria-label', 'Slides');

  const playActiveVideo = () => {
    slides.forEach((slide, i) => {
      const video = slide.querySelector('video');
      if (!video) return;
      if (i === current) {
        const playing = video.play();
        if (playing && typeof playing.catch === 'function') playing.catch(() => {});
      } else {
        video.pause();
      }
    });
  };

  const goTo = (index) => {
    current = (index + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    [...dots.children].forEach((dot, i) => {
      dot.setAttribute('aria-selected', i === current ? 'true' : 'false');
    });
    playActiveVideo();
  };

  const stop = () => window.clearInterval(timer);
  const start = () => {
    stop();
    if (total > 1) timer = window.setInterval(() => goTo(current + 1), AUTOPLAY_MS);
  };
  const restart = () => { start(); };

  // pagination bullets
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Ir para o slide ${i + 1}`);
    dot.addEventListener('click', () => { goTo(i); restart(); });
    dots.append(dot);
  });

  // prev / next arrows
  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'carousel-hero-prev';
  prev.setAttribute('aria-label', 'Slide anterior');
  prev.addEventListener('click', () => { goTo(current - 1); restart(); });

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'carousel-hero-next';
  next.setAttribute('aria-label', 'Próximo slide');
  next.addEventListener('click', () => { goTo(current + 1); restart(); });

  if (total > 1) {
    block.append(prev, next, dots);
  }

  // pause autoplay while the pointer is over the hero
  block.addEventListener('mouseenter', stop);
  block.addEventListener('mouseleave', start);

  goTo(0);
  start();
}
