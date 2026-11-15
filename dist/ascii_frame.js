const SHADE_CHARACTERS = ' .,:;irs23XhMHG#@';

/** Create a fixed character canvas with depth and light channels. @returns {object} */
export function createAsciiFrame() {
  const columns = 144;
  const rows = 64;
  return { columns, rows, characters: Array(columns * rows).fill(' '),
    tones: new Uint8Array(columns * rows), depths: new Float32Array(columns * rows).fill(-Infinity) };
}

/** Place one lit character without overwriting nearer geometry. @param {object} frame @param {object} sample @returns {void} */
export function plotAsciiCharacter(frame, { column, row, depth = 0, light = 0.8, character }) {
  const roundedColumn = Math.round(column);
  const roundedRow = Math.round(row);
  if (roundedColumn < 0 || roundedColumn >= frame.columns || roundedRow < 0 || roundedRow >= frame.rows) return;
  const index = roundedRow * frame.columns + roundedColumn;
  if (depth < frame.depths[index]) return;
  const brightness = Math.max(0.08, Math.min(1, light));
  frame.depths[index] = depth;
  frame.tones[index] = Math.min(5, Math.floor(brightness * 6));
  frame.characters[index] = character || SHADE_CHARACTERS[Math.max(1, Math.floor(brightness * (SHADE_CHARACTERS.length - 1)))];
}

/** Choose a contour character from its physical screen angle. @param {number} horizontal @param {number} vertical @returns {string} */
function contourCharacter(horizontal, vertical) {
  if (Math.abs(vertical) < Math.abs(horizontal) * 0.28) return '_';
  if (Math.abs(horizontal) < Math.abs(vertical) * 0.35) return '|';
  return horizontal * vertical > 0 ? '\\' : '/';
}

/** Trace a smooth cubic outline into terminal characters. @param {object} frame @param {object} stroke @returns {void} */
export function strokeAsciiCurve(frame, { points, light = 0.8, depth = 10, character }) {
  const [start, firstControl, secondControl, end] = points;
  const steps = Math.ceil(points.slice(1).reduce((length, point, index) =>
    length + Math.hypot(point[0] - points[index][0], point[1] - points[index][1]), 0) * 3);
  let previous = start;
  for (let step = 1; step <= steps; step += 1) {
    const progress = step / steps;
    const remaining = 1 - progress;
    const point = [0, 1].map(axis => remaining ** 3 * start[axis] + 3 * remaining ** 2 * progress * firstControl[axis]
      + 3 * remaining * progress ** 2 * secondControl[axis] + progress ** 3 * end[axis]);
    plotAsciiCharacter(frame, { column: point[0], row: point[1], light, depth,
      character: character || contourCharacter((point[0] - previous[0]) * 0.6, point[1] - previous[1]) });
    previous = point;
  }
}

/** Draw a contour segment with the same rasterizer as curves. @param {object} frame @param {object} stroke @returns {void} */
export function strokeAsciiLine(frame, { start, end, ...appearance }) {
  strokeAsciiCurve(frame, { points: [start, start, end, end], ...appearance });
}

/** Rotate a point or normal about the vertical axis. @param {number[]} point @param {number} angle @returns {number[]} */
export function rotateAsciiPoint(point, angle) {
  return [point[0] * Math.cos(angle) + point[2] * Math.sin(angle), point[1],
    point[2] * Math.cos(angle) - point[0] * Math.sin(angle)];
}

/** Project a 3D surface with directional lighting into the character grid. @param {object} frame @param {object} sample @returns {void} */
export function plotAsciiSurface(frame, { point, normal, angle = 0, light, character, scale = 15, center = [72, 32] }) {
  const rotatedPoint = rotateAsciiPoint(point, angle);
  const rotatedNormal = rotateAsciiPoint(normal, angle);
  const diffuse = Math.max(0, rotatedNormal[0] * -0.45 + rotatedNormal[1] * 0.58 + rotatedNormal[2] * 0.68);
  const brightness = light ?? Math.min(1, 0.12 + diffuse * 0.8 + diffuse ** 16 * 0.18);
  plotAsciiCharacter(frame, { column: center[0] + rotatedPoint[0] * scale / 0.6,
    row: center[1] - rotatedPoint[1] * scale, depth: rotatedPoint[2], light: brightness, character });
}

/** Convert the canvas into layered text and a readable plain-text snapshot. @param {object} frame @returns {object} */
export function finishAsciiFrame(frame) {
  const layers = Array.from({ length: 6 }, () => []);
  const rows = [];
  for (let row = 0; row < frame.rows; row += 1) {
    const start = row * frame.columns;
    rows.push(frame.characters.slice(start, start + frame.columns).join(''));
    for (let tone = 0; tone < layers.length; tone += 1) {
      layers[tone].push(frame.characters.slice(start, start + frame.columns)
        .map((character, column) => frame.tones[start + column] === tone ? character : ' ').join(''));
    }
  }
  return { text: rows.join('\n'), layers: layers.map(rows => rows.join('\n')) };
}
