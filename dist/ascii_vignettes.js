import { createBrailleCatRenderer } from './braille_cat.js?v=grinning-cat';
import { renderAsciiCoffee } from './ascii_coffee.js?v=20261115-loops';
import { renderAsciiRocket } from './ascii_rocket.js?v=20261115-loops';

const VIGNETTE_RENDERERS = Object.freeze({ coffee: renderAsciiCoffee, rocket: renderAsciiRocket });
const FRAME_INTERVAL_IN_MILLISECONDS = 1000 / 30;

/** Paint six text layers without exposing changing art to screen readers. @param {object} animation @returns {void} */
function paintVignette(animation) {
  const frame = animation.render(animation.time);
  if (frame === animation.previousFrame) return;
  animation.previousFrame = frame;
  animation.layers.forEach((layer, index) => { layer.textContent = frame.layers[index]; });
  animation.artwork.dataset.frame = String(animation.frameCount++);
}

/** Run one visible artwork on an elapsed-time animation clock. @param {object} animation @returns {void} */
function scheduleVignette(animation) {
  if (animation.request || animation.isPaused || !animation.isVisible || animation.motionPreference.matches || document.hidden) return;
  animation.request = requestAnimationFrame(timestamp => {
    animation.request = 0;
    if (!animation.previousTimestamp) animation.previousTimestamp = timestamp;
    const elapsed = timestamp - animation.previousTimestamp;
    animation.previousTimestamp = timestamp;
    animation.time += Math.min(elapsed / 1000, 0.1);
    animation.elapsedSincePaint += elapsed;
    if (animation.elapsedSincePaint >= FRAME_INTERVAL_IN_MILLISECONDS) {
      animation.elapsedSincePaint %= FRAME_INTERVAL_IN_MILLISECONDS;
      paintVignette(animation);
    }
    scheduleVignette(animation);
  });
}

/** Stop hidden animation work and resume without a time jump. @param {object} animation @returns {void} */
function refreshVignettePlayback(animation) {
  cancelAnimationFrame(animation.request);
  animation.request = 0;
  animation.previousTimestamp = 0;
  animation.elapsedSincePaint = 0;
  animation.button.hidden = animation.motionPreference.matches;
  animation.button.textContent = animation.isPaused ? '[play]' : '[pause]';
  animation.button.setAttribute('aria-pressed', String(animation.isPaused));
  animation.button.setAttribute('aria-label', `${animation.isPaused ? 'Play' : 'Pause'} ${animation.figure.dataset.asciiVignette} animation`);
  scheduleVignette(animation);
}

/** Attach visibility, pause, and accessibility behavior to an artwork. @param {HTMLElement} figure @returns {void} */
function initializeVignette(figure) {
  const artwork = figure.querySelector('pre');
  const button = figure.querySelector('button');
  const vignette = figure.dataset.asciiVignette;
  const render = vignette === 'grinning-cat' ? createBrailleCatRenderer(artwork.textContent) : VIGNETTE_RENDERERS[vignette];
  const layers = Array.from({ length: 6 }, (_, index) => {
    const layer = document.createElement('span');
    layer.className = `vignette-tone vignette-tone-${index}`;
    return layer;
  });
  artwork.replaceChildren(...layers);
  const animation = { figure, artwork, button, layers, render,
    time: 0, frameCount: 0, request: 0, previousTimestamp: 0, elapsedSincePaint: 0, isPaused: false, isVisible: false,
    motionPreference: matchMedia('(prefers-reduced-motion: reduce)') };
  paintVignette(animation);
  const observer = new IntersectionObserver(entries => {
    animation.isVisible = entries[0].isIntersecting;
    refreshVignettePlayback(animation);
  });
  observer.observe(figure);
  button.addEventListener('click', () => { animation.isPaused = !animation.isPaused; refreshVignettePlayback(animation); });
  animation.motionPreference.addEventListener('change', () => refreshVignettePlayback(animation));
  document.addEventListener('visibilitychange', () => refreshVignettePlayback(animation));
  refreshVignettePlayback(animation);
}

/** Start the independent looping illustrations outside the Beyond sculpture. @param {NodeListOf<HTMLElement>} figures @returns {void} */
export function initializeAsciiVignettes(figures) {
  figures.forEach(initializeVignette);
}
