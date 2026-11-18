import { createAsciiFrame, finishAsciiFrame, plotAsciiCharacter, strokeAsciiCurve, strokeAsciiLine } from '../../dist/ascii_frame.js?v=20261115-loops';

/** Sample a playful six-second anticipation, reach, and fish-slide loop. @param {number} time @returns {object} */
export function sampleCatPose(time) {
  const phase = (time % 6) / 6;
  const reach = Math.exp(-(((phase - 0.44) / 0.11) ** 2));
  const fishSlide = phase > 0.45 ? Math.sin(Math.min(1, (phase - 0.45) / 0.55) * Math.PI) : 0;
  return { reach, fishSlide, headTilt: Math.sin(phase * Math.PI * 4) * 0.7 + reach,
    tailSwing: Math.sin(phase * Math.PI * 4) * 6, isBlinking: phase > 0.79 && phase < 0.82 };
}

/** Draw the cat's haunches, curled tail, chest, and planted paws. @param {object} frame @param {object} pose @returns {void} */
function drawCatBody(frame, pose) {
  const curves = [
    [[47, 47], [10, 58], [14, 27 + pose.tailSwing], [31, 36]],
    [[31, 36], [39, 41], [23, 45 + pose.tailSwing / 2], [47, 50]],
    [[42, 47], [39, 33], [48, 28], [59, 26]],
    [[59, 26], [66, 29], [72, 30], [79, 27]],
    [[43, 46], [28, 41], [27, 57], [45, 57]],
    [[45, 57], [49, 58], [62, 57], [67, 56]],
    [[46, 47], [58, 42], [56, 55], [62, 55]],
    [[74, 31], [72, 40], [73, 46], [75, 52]],
    [[75, 52], [91, 51], [89, 57], [78, 57]],
    [[78, 57], [73, 57], [69, 56], [67, 55]],
  ];
  curves.forEach(points => strokeAsciiCurve(frame, { points, light: 0.73 }));
  for (const column of [80, 83, 86]) strokeAsciiLine(frame, { start: [column, 54], end: [column - 1, 56], light: 0.5 });
  for (let stripe = 0; stripe < 5; stripe += 1) {
    strokeAsciiLine(frame, { start: [48 + stripe * 3, 32 + stripe * 3], end: [51 + stripe * 3, 33 + stripe * 3], light: 0.3 });
  }
}

/** Keep the face round despite the tall aspect of terminal characters. @param {number[]} point @param {number} offset @returns {number[]} */
function transformCatHeadPoint([column, row], offset) {
  return [73 + (column - 73) * 1.4, 19 + (row - 19) * 0.8 + offset];
}

/** Place a facial detail in the same coordinate system as the outline. @param {object} frame @param {object} detail @returns {void} */
function plotCatFaceDetail(frame, { point, offset, character, light }) {
  const [column, row] = transformCatHeadPoint(point, offset);
  plotAsciiCharacter(frame, { column, row, character, light, depth: 12 });
}

/** Draw pointed ears, blinking eyes, whiskers, and a turning muzzle. @param {object} frame @param {object} pose @returns {void} */
function drawCatHead(frame, pose) {
  const offset = pose.headTilt;
  const curves = [
    [[58, 21], [53, 16], [57, 12], [58, 6]],
    [[58, 6], [61, 6], [64, 9], [66, 10]],
    [[66, 10], [71, 8], [76, 8], [79, 10]],
    [[79, 10], [82, 8], [85, 6], [86, 6]],
    [[86, 6], [87, 14], [90, 15], [88, 20]],
    [[88, 20], [91, 21], [91, 22], [86, 23]],
    [[86, 23], [82, 30], [63, 29], [58, 21]],
  ];
  curves.forEach(points => strokeAsciiCurve(frame, { points: points.map(point => transformCatHeadPoint(point, offset)), light: 0.9 }));
  [[62, 11], [82, 11]].forEach(point => plotCatFaceDetail(frame, { point, offset, character: '/', light: 0.4 }));
  for (const column of [69, 81]) plotCatFaceDetail(frame, { point: [column, 18], offset, character: pose.isBlinking ? '_' : 'o', light: 1 });
  plotCatFaceDetail(frame, { point: [77, 22], offset, character: 'v', light: 1 });
  strokeAsciiCurve(frame, { points: [[72, 24], [75, 26], [79, 26], [82, 24]].map(point => transformCatHeadPoint(point, offset)), light: 0.7 });
  for (const direction of [-1, 1]) for (const slope of [-1, 0, 1]) {
    strokeAsciiLine(frame, { start: transformCatHeadPoint([77 + direction * 7, 23], offset), end: transformCatHeadPoint([77 + direction * 19, 23 + slope * 2], offset), light: 0.45 });
  }
}

/** Animate the reaching paw and a fish that scoots away after contact. @param {object} frame @param {object} pose @returns {void} */
function drawCatAndFishInteraction(frame, pose) {
  const pawColumn = 85 + pose.reach * 19;
  const pawRow = 40 + pose.reach * 9;
  strokeAsciiCurve(frame, { points: [[79, 30], [84, 35], [pawColumn - 5, pawRow - 5], [pawColumn, pawRow]], light: 0.85 });
  strokeAsciiCurve(frame, { points: [[pawColumn, pawRow], [pawColumn + 8, pawRow + 4], [pawColumn - 2, pawRow + 7], [pawColumn - 5, pawRow + 3]], light: 0.95 });
  strokeAsciiCurve(frame, { points: [[pawColumn - 5, pawRow + 3], [77, 39], [77, 38], [76, 35]], light: 0.65 });
  const fishColumn = 111 + pose.fishSlide * 7;
  const fishRow = 53 - pose.fishSlide * 2;
  const fishCurves = [
    [[-9, 0], [-7, -5], [2, -5], [8, -1]],
    [[8, -1], [14, -6], [13, -2], [10, 0]],
    [[10, 0], [15, 4], [13, 6], [8, 1]],
    [[8, 1], [2, 5], [-7, 5], [-9, 0]],
    [[-2, -3], [-4, -1], [-4, 1], [-2, 3]],
  ];
  fishCurves.forEach(points => strokeAsciiCurve(frame, { points: points.map(([column, row]) => [fishColumn + column, fishRow + row]), light: 0.75 }));
  plotAsciiCharacter(frame, { column: fishColumn - 6, row: fishRow, character: 'o', light: 1, depth: 12 });
  for (let scale = 0; scale < 3; scale += 1) plotAsciiCharacter(frame, { column: fishColumn + scale * 2, row: fishRow, character: ')', light: 0.4, depth: 12 });
}

/** Render a hand-drawn cat playing with a fish as real text. @param {number} time @returns {object} */
export function renderAsciiCat(time) {
  const frame = createAsciiFrame();
  const pose = sampleCatPose(time);
  drawCatBody(frame, pose);
  drawCatHead(frame, pose);
  drawCatAndFishInteraction(frame, pose);
  return finishAsciiFrame(frame);
}
