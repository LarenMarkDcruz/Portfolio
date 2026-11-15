import { createAsciiFrame, finishAsciiFrame, plotAsciiSurface } from './ascii_frame.js?v=20261115-loops';

/** Return a curved nose above a cylindrical rocket fuselage. @param {number} height @returns {number} */
function rocketRadius(height) {
  return height < 0.65 ? 0.57 : 0.57 * Math.sqrt(Math.max(0, 1 - ((height - 0.65) / 1.4) ** 2));
}

/** Shade the hull, circular window, riveted seams, and brushed metal. @param {number} height @param {number} angle @returns {object} */
function rocketMaterial(height, angle) {
  const frontAngle = Math.atan2(Math.sin(angle), Math.cos(angle));
  const windowDistance = Math.hypot(frontAngle / 0.46, (height - 0.75) / 0.36);
  if (windowDistance < 0.8) return { light: windowDistance > 0.64 && frontAngle < 0 ? 0.46 : 0.05 };
  if (windowDistance < 1.09) return { light: windowDistance < 0.94 ? 0.95 : 0.6, character: 'O' };
  if (Math.abs(height + 0.6) < 0.035 || Math.abs(height - 0.28) < 0.018) return { light: 0.58, character: '=' };
  if (Math.abs(Math.sin(angle * 8)) < 0.08 && height < -0.53) return { light: 0.94, character: '+' };
  return {};
}

/** Sample the full 3D hull and its directional surface normals. @param {object} frame @param {object} pose @returns {void} */
function drawRocketHull(frame, pose) {
  for (let height = -0.8; height < 2.05; height += 0.022) {
    const radius = rocketRadius(height);
    const slope = (rocketRadius(height + 0.005) - rocketRadius(height - 0.005)) / 0.01;
    const normalLength = Math.hypot(1, slope);
    for (let angle = 0; angle < Math.PI * 2; angle += 0.025) {
      plotAsciiSurface(frame, { point: [radius * Math.sin(angle), height + pose.bob, radius * Math.cos(angle)],
        normal: [Math.sin(angle) / normalLength, -slope / normalLength, Math.cos(angle) / normalLength],
        angle: pose.rotation, scale: 11.7, center: [72, 29], ...rocketMaterial(height, angle) });
    }
  }
}

/** Render three solid stabilizer fins with differently lit faces. @param {object} frame @param {object} pose @returns {void} */
function drawRocketFins(frame, pose) {
  for (let fin = 0; fin < 3; fin += 1) {
    const angle = fin * Math.PI * 2 / 3;
    for (let vertical = 0; vertical <= 1; vertical += 0.018) {
      const height = 0.1 - vertical * 1.17;
      const outerRadius = 0.55 + vertical * 0.62;
      for (let radius = 0.45; radius <= outerRadius; radius += 0.018) for (const side of [-1, 1]) {
        plotAsciiSurface(frame, { point: [radius * Math.sin(angle) + Math.cos(angle) * side * 0.045, height + pose.bob,
          radius * Math.cos(angle) - Math.sin(angle) * side * 0.045], normal: [Math.cos(angle) * side, 0.25, -Math.sin(angle) * side],
          angle: pose.rotation, scale: 11.7, center: [72, 29] });
      }
    }
  }
}

/** Render a flared engine bell and a continuously flickering exhaust plume. @param {object} frame @param {object} pose @returns {void} */
function drawRocketEngine(frame, pose) {
  for (let height = -1.09; height < -0.79; height += 0.018) {
    const radius = 0.33 + (-height - 0.79) * 0.45;
    for (let angle = 0; angle < Math.PI * 2; angle += 0.03) {
      plotAsciiSurface(frame, { point: [radius * Math.sin(angle), height + pose.bob, radius * Math.cos(angle)],
        normal: [Math.sin(angle), -0.35, Math.cos(angle)], angle: pose.rotation, scale: 11.7, center: [72, 29] });
    }
  }
  for (let distance = 0; distance < 1.55; distance += 0.025) {
    const radius = 0.34 * (1 - distance / 1.55) * (0.92 + 0.08 * Math.sin(distance * 18 - pose.time * Math.PI * 5));
    for (let angle = 0; angle < Math.PI * 2; angle += 0.075) {
      const pulse = 0.5 + 0.5 * Math.sin(distance * 22 - pose.time * Math.PI * 5 + angle * 3);
      plotAsciiSurface(frame, { point: [radius * Math.sin(angle), -1.13 - distance + pose.bob, radius * Math.cos(angle)],
        normal: [0, 0, 1], angle: pose.rotation, scale: 11.7, center: [72, 29],
        light: Math.max(0.08, (1 - distance / 1.65) * (0.5 + pulse * 0.5)), character: distance > 1.1 ? '.' : undefined });
    }
  }
}

/** Render a complete twelve-second rocket turntable with a live engine. @param {number} time @returns {object} */
export function renderAsciiRocket(time) {
  const frame = createAsciiFrame();
  const pose = { time, rotation: time * Math.PI / 6, bob: Math.sin(time * Math.PI * 2 / 3) * 0.08 };
  drawRocketEngine(frame, pose);
  drawRocketFins(frame, pose);
  drawRocketHull(frame, pose);
  return finishAsciiFrame(frame);
}
