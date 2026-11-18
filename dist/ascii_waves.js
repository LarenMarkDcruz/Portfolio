import { createAsciiFrame, finishAsciiFrame, plotAsciiCharacter, strokeAsciiCurve } from './ascii_frame.js?v=20261115-loops';

const LOOP_DURATION_IN_SECONDS = 8;
const WATER_CHARACTERS = ',;!|/()rsyXZ';
const FOAM_CHARACTERS = '.:*oO@';

/** Sample a looping swell without changing the camera or illustration bounds. @param {number} time @returns {object} */
function sampleWaveMotion(time) {
  const phase = time / LOOP_DURATION_IN_SECONDS * Math.PI * 2;
  return { phase, lift: Math.sin(phase) * 1.2, curl: Math.sin(phase + 0.8) * 2 };
}

/** Sample a cubic curve in character coordinates. @param {number[][]} points @param {number} progress @returns {number[]} */
function sampleWaveCurve(points, progress) {
  const remaining = 1 - progress;
  return [0, 1].map(axis => remaining ** 3 * points[0][axis] + 3 * remaining ** 2 * progress * points[1][axis]
    + 3 * remaining * progress ** 2 * points[2][axis] + progress ** 3 * points[3][axis]);
}

/** Build an overhanging crest and its open barrel from a continuous silhouette. @param {object} motion @returns {number[][][]} */
function createWaveOutline({ lift, curl }) {
  return [
    [[4, 47], [10, 27], [29, 12 + lift], [59, 10 + lift]],
    [[59, 10 + lift], [85, 5 + lift], [107 + curl, 11], [114 + curl, 23]],
    [[114 + curl, 23], [116 + curl, 31], [105, 32], [98, 25]],
    [[98, 25], [84, 13 + lift], [62, 21], [64, 33]],
    [[64, 33], [65, 44], [89, 50], [116, 55]],
    [[116, 55], [127, 56], [135, 58], [140, 61]],
    [[140, 61], [95, 60], [45, 62], [4, 60]],
    [[4, 60], [4, 55], [4, 51], [4, 47]],
  ];
}

/** Return the horizontal spans inside a closed, sampled silhouette. @param {number[][]} outline @param {number} row @returns {number[]} */
function intersectWaveOutline(outline, row) {
  const intersections = [];
  outline.forEach((start, index) => {
    const end = outline[(index + 1) % outline.length];
    if ((start[1] > row) === (end[1] > row)) return;
    intersections.push(start[0] + (row - start[1]) / (end[1] - start[1]) * (end[0] - start[0]));
  });
  return intersections.sort((first, second) => first - second);
}

/** Shade curved water striations with deterministic grain rather than flickering noise. @param {number} column @param {number} row @param {object} motion @returns {object} */
function sampleWaterTexture(column, row, motion) {
  const horizontal = column - 80;
  const vertical = (row - 30) * 1.75;
  const radius = Math.hypot(horizontal, vertical);
  const angle = Math.atan2(vertical, horizontal);
  const ridge = Math.sin(radius * 1.65 + angle * 7 + Math.sin(motion.phase) * 0.65);
  const grain = Math.sin(column * 23.17 + row * 71.43) * Math.cos(row * 9.31 + column * 5.7);
  const highlight = Math.max(0, 1 - Math.abs(radius - 43) / 20);
  const light = 0.12 + highlight * 0.29 + Math.max(0, ridge) * 0.22 + grain * 0.09;
  const character = WATER_CHARACTERS[Math.floor(Math.abs(ridge * 5 + grain * 3 + angle * 2)) % WATER_CHARACTERS.length];
  return { light, character: grain > 0.72 ? ' ' : character };
}

/** Fill the wave while preserving the hollow under its curling lip. @param {object} frame @param {object} motion @returns {void} */
function drawWaveBody(frame, motion) {
  const outline = createWaveOutline(motion).flatMap(points => Array.from({ length: 32 }, (_, index) => sampleWaveCurve(points, index / 32)));
  for (let row = 6; row < frame.rows - 2; row += 1) {
    const intersections = intersectWaveOutline(outline, row + 0.5);
    for (let span = 0; span + 1 < intersections.length; span += 2) {
      for (let column = Math.ceil(intersections[span]); column <= intersections[span + 1]; column += 1) {
        const texture = sampleWaterTexture(column, row, motion);
        plotAsciiCharacter(frame, { column, row, depth: 2, ...texture });
      }
    }
  }
}

/** Trace long engraved water lines into the rising shoulder and inner barrel. @param {object} frame @param {object} motion @returns {void} */
function drawWaveRidges(frame, { lift, phase }) {
  for (let ridge = 0; ridge < 17; ridge += 1) {
    const offset = ridge * 1.7;
    const points = [[5 + offset * 0.35, 58], [14 + offset * 0.3, 28], [41 + offset * 0.3, 13 + offset * 0.4 + lift], [75 + offset * 0.4, 15 + offset * 0.3 + lift]];
    strokeAsciiCurve(frame, { points, light: 0.28 + Math.sin(ridge * 1.7 + phase) * 0.1, depth: 3, character: ridge % 3 ? ':' : '/' });
  }
  for (let ridge = 0; ridge < 8; ridge += 1) {
    const offset = ridge * 1.1;
    strokeAsciiCurve(frame, { points: [[68 - offset, 30], [62 - offset, 43], [83, 51 + offset], [120, 57 + offset * 0.35]],
      light: 0.42 + ridge * 0.025, depth: 3, character: ridge % 2 ? '~' : ';' });
  }
}

/** Break the crest into branching foam fingers with lit, textured tips. @param {object} frame @param {object} motion @returns {void} */
function drawCrestFoam(frame, motion) {
  const crest = createWaveOutline(motion).slice(0, 3);
  for (let segment = 0; segment < crest.length; segment += 1) {
    for (let sample = 0; sample < 100; sample += 1) {
      const progress = sample / 100;
      const [column, row] = sampleWaveCurve(crest[segment], progress);
      const drift = Math.sin(progress * 16 + motion.phase + segment) * 0.6;
      for (let width = -1; width <= 2; width += 1) {
        const texture = Math.sin(sample * 17.1 + width * 6.2 + segment);
        plotAsciiCharacter(frame, { column: column + drift, row: row + width * 0.65, depth: 7,
          light: 0.65 + (texture + 1) * 0.16, character: FOAM_CHARACTERS[Math.floor((texture + 1) * 2.49)] });
      }
    }
  }
  drawFoamFingers(frame, motion);
}

/** Animate a family of curling whitecaps instead of translating the whole wave. @param {object} frame @param {object} motion @returns {void} */
function drawFoamFingers(frame, { lift, curl, phase }) {
  for (let finger = 0; finger < 12; finger += 1) {
    const progress = finger / 11;
    const column = 62 + progress * 47 + curl * progress;
    const row = 10 + lift + progress ** 2 * 13;
    const reach = 2.5 + Math.sin(finger * 2.3 + phase) * 1.2;
    strokeAsciiCurve(frame, { points: [[column, row + 1], [column + 4, row - reach], [column + 7, row - reach], [column + 5, row + 2]],
      light: 0.94, depth: 8, character: finger % 2 ? '*' : 'o' });
    plotAsciiCharacter(frame, { column: column + 6, row: row - reach - 1.5, depth: 9, light: 0.8, character: '.' });
  }
}

/** Drift spray along short arcs, fading it before each particle loops. @param {object} frame @param {number} phase @returns {void} */
function drawWaveSpray(frame, phase) {
  for (let particle = 0; particle < 42; particle += 1) {
    const progress = ((phase / (Math.PI * 2) + particle * 0.618) % 1 + 1) % 1;
    const opacity = Math.sin(progress * Math.PI);
    if (opacity < 0.28) continue;
    const origin = 70 + particle % 9 * 5;
    plotAsciiCharacter(frame, { column: origin + progress * (7 + particle % 5), row: 9 + (origin - 70) * 0.18 - Math.sin(progress * Math.PI) * (3 + particle % 4),
      light: opacity * 0.7, character: particle % 4 ? '.' : ':', depth: 9 });
  }
}

/** Build layered foreground swells and quiet ripples through the open barrel. @param {object} frame @param {number} phase @returns {void} */
function drawOceanRipples(frame, phase) {
  for (let ripple = 0; ripple < 10; ripple += 1) {
    const baseline = 36 + ripple * 2.5;
    for (let column = 5; column < 140; column += 1) {
      const row = baseline + Math.sin(column * 0.075 - phase + ripple) * (0.4 + ripple * 0.13);
      const light = 0.16 + ripple * 0.025 + Math.sin(column * 0.18 + ripple * 3 - phase) * 0.1;
      if (Math.sin(column * 0.14 + ripple * 4) > 0.85) continue;
      plotAsciiCharacter(frame, { column, row, depth: ripple > 7 ? 5 : 0, light, character: ripple > 7 ? '~' : '_' });
    }
  }
}

/** Render an eight-second woodcut-inspired curling wave with drifting foam. @param {number} time @returns {object} */
export function renderAsciiWaves(time) {
  const frame = createAsciiFrame();
  const motion = sampleWaveMotion(time);
  drawOceanRipples(frame, motion.phase);
  drawWaveBody(frame, motion);
  drawWaveRidges(frame, motion);
  drawCrestFoam(frame, motion);
  drawWaveSpray(frame, motion.phase);
  return finishAsciiFrame(frame);
}
