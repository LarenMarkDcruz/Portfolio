import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderAsciiCat, sampleCatPose } from '../archive/ascii_vignettes/ascii_cat.js';
import { renderAsciiWaves } from '../archive/ascii_vignettes/ascii_waves.js';
import { renderAsciiCoffee } from '../dist/ascii_coffee.js';
import { renderAsciiRocket } from '../dist/ascii_rocket.js';
import { createAsciiFrame, plotAsciiCharacter } from '../dist/ascii_frame.js';

test('should repeat detailed animation frames without clipping any image edges', () => {
  for (const [render, period] of [[renderAsciiCat, 6], [renderAsciiWaves, 4], [renderAsciiCoffee, 4], [renderAsciiRocket, 12]]) {
    const frame = render(0);
    const rows = frame.text.split('\n');
    assert.equal(rows.length, 64);
    assert.ok(rows.every(row => row.length === 144));
    assert.ok(frame.text.replace(/\s/g, '').length > 300);
    assert.equal(rows[0].trim(), '');
    assert.equal(rows.at(-1).trim(), '');
    assert.ok(rows.every(row => row[0] === ' ' && row.at(-1) === ' '));
    const repeated = render(period).text;
    const differences = [...frame.text].filter((character, index) => character !== repeated[index]).length;
    assert.ok(differences < 20, `Loop has ${differences} changed cells at its seam`);
    assert.notEqual(frame.text, render(1.5).text);
  }
});

test('should coordinate the cat swat, fish escape, blink, and repeating tail motion', () => {
  assert.ok(sampleCatPose(2.64).reach > 0.99);
  assert.ok(sampleCatPose(4).fishSlide > 0.8);
  assert.equal(sampleCatPose(4.8).isBlinking, true);
  assert.deepEqual(sampleCatPose(0), sampleCatPose(6));
});

test('should preserve the open wave barrel and contrasting foam throughout the loop', () => {
  for (let time = 0; time < 4; time += 0.5) {
    const frame = renderAsciiWaves(time);
    const rows = frame.text.split('\n');
    assert.equal(rows[33].slice(84, 105).trim(), '', 'The curling lip must not fill its barrel');
    assert.ok(frame.layers[5].replace(/\s/g, '').length > 80, 'Foam needs bright highlights');
    assert.ok(frame.layers[0].replace(/\s/g, '').length > 80, 'Water needs deep shadows');
    assert.ok(rows.slice(56, 61).some(row => row.slice(100, 138).trim()), 'Foreground swells must remain visible');
  }
});

test('should keep front surfaces in front of darker rear geometry', () => {
  const frame = createAsciiFrame();
  plotAsciiCharacter(frame, { column: 50, row: 30, depth: 2, light: 1, character: '@' });
  plotAsciiCharacter(frame, { column: 50, row: 30, depth: -2, light: 0.1, character: '.' });
  assert.equal(frame.characters[30 * 144 + 50], '@');
  assert.equal(frame.tones[30 * 144 + 50], 5);
});
