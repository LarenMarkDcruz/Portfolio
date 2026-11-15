import { createAsciiFrame, finishAsciiFrame, plotAsciiSurface, strokeAsciiCurve } from './ascii_frame.js?v=20261115-loops';

const COFFEE_WORDS = 'brew sleep code repeat const coffee = true; ';

/** Sample a tapered ceramic cup with a gently rounded bottom. @param {number} height @returns {number} */
function cupRadius(height) {
  return 0.65 + (height + 0.9) * 0.24;
}

/** Wrap readable programming words around the lit cup surface. @param {object} frame @returns {void} */
function drawCoffeeCup(frame) {
  for (let height = -0.9; height <= 0.72; height += 0.021) {
    const radius = cupRadius(height);
    for (let angle = 0; angle < Math.PI * 2; angle += 0.021) {
      const wordIndex = Math.floor((angle / (Math.PI * 2) * 54 + Math.floor((height + 0.9) * 17) * 7)) % COFFEE_WORDS.length;
      const point = [radius * Math.sin(angle) - 0.15, height + Math.cos(angle) * 0.16, radius * Math.cos(angle)];
      plotAsciiSurface(frame, { point, normal: [Math.sin(angle), -0.24, Math.cos(angle)], scale: 13.7, center: [78, 43],
        character: COFFEE_WORDS[wordIndex] === ' ' ? '.' : COFFEE_WORDS[wordIndex] });
    }
  }
}

/** Render the open rim, dark coffee, and elliptical saucer. @param {object} frame @returns {void} */
function drawCoffeeRimAndSaucer(frame) {
  for (let radius = 0; radius <= 1.045; radius += 0.02) for (let angle = 0; angle < Math.PI * 2; angle += 0.023) {
    const isRim = radius > 0.96;
    plotAsciiSurface(frame, { point: [radius * Math.sin(angle) - 0.15, 0.72 + Math.cos(angle) * radius * 0.2, radius * Math.cos(angle)],
      normal: [0, 1, 0.5], light: isRim ? 0.92 : 0.075 + Math.max(0, Math.sin(angle + 0.3)) * 0.07,
      character: isRim ? '=' : '.', scale: 13.7, center: [78, 43] });
  }
  for (let radius = 0.55; radius <= 1.4; radius += 0.025) for (let angle = 0; angle < Math.PI * 2; angle += 0.025) {
    plotAsciiSurface(frame, { point: [radius * Math.sin(angle) - 0.15, -1.02 + Math.cos(angle) * radius * 0.12, radius * Math.cos(angle)],
      normal: [0, 1, 0.3], light: radius > 1.33 ? 0.7 : 0.22, character: radius > 1.33 ? '_' : '.', scale: 13.7, center: [78, 43] });
  }
}

/** Render a thick hollow handle that joins the cup behind its surface. @param {object} frame @returns {void} */
function drawCoffeeHandle(frame) {
  for (let angle = 0; angle < Math.PI * 2; angle += 0.025) for (let tubeAngle = 0; tubeAngle < Math.PI * 2; tubeAngle += 0.05) {
    const thickness = 0.12;
    const column = -1.12 + (0.62 + thickness * Math.cos(tubeAngle)) * Math.cos(angle);
    const height = -0.05 + (0.53 + thickness * Math.cos(tubeAngle)) * Math.sin(angle);
    plotAsciiSurface(frame, { point: [column, height, -0.05 + thickness * Math.sin(tubeAngle)],
      normal: [Math.cos(tubeAngle) * Math.cos(angle), Math.cos(tubeAngle) * Math.sin(angle), Math.sin(tubeAngle)],
      scale: 13.7, center: [78, 43] });
  }
}

/** Draw rising ribbons that fade at both ends for a seamless steam loop. @param {object} frame @param {number} time @returns {void} */
function drawCoffeeSteam(frame, time) {
  for (let ribbon = 0; ribbon < 3; ribbon += 1) {
    for (let segment = 0; segment < 24; segment += 1) {
      const progress = segment / 24;
      const nextProgress = (segment + 1) / 24;
      const pointAt = height => [69 + ribbon * 10 + Math.sin(height * 9 - time * Math.PI / 2 + ribbon) * (2 + height * 4), 30 - height * 26];
      const start = pointAt(progress);
      const end = pointAt(nextProgress);
      const light = Math.sin(progress * Math.PI) * (0.4 + Math.sin(progress * 12 - time * Math.PI / 2 + ribbon) * 0.2);
      strokeAsciiCurve(frame, { points: [start, start, end, end], light, depth: 12, character: progress > 0.8 ? '.' : undefined });
    }
  }
}

/** Render a word-textured coffee cup and continuously drifting steam. @param {number} time @returns {object} */
export function renderAsciiCoffee(time) {
  const frame = createAsciiFrame();
  drawCoffeeHandle(frame);
  drawCoffeeCup(frame);
  drawCoffeeRimAndSaucer(frame);
  drawCoffeeSteam(frame, time);
  return finishAsciiFrame(frame);
}
