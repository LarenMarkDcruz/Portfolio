const BRAILLE_BLANK = '⠀';
const CLOSED_EYES = [
  { start: 18, width: 6, lid: '⢀⠤⠤⠤⠴⠃' },
  { start: 49, width: 7, lid: '⠘⠤⠤⠤⠤⠊⠁' },
];
const LID_ROW = 13;
const TONE_COUNT = 6;

/** Change only the eyes, leaving the supplied grin and face contours in place. @param {string[]} portrait @returns {string[]} */
function closeEyes(portrait) {
  return portrait.map((line, row) => {
    if (Math.abs(row - LID_ROW) > 1) return line;
    for (const { start, width, lid } of CLOSED_EYES) {
      const eyelid = row === LID_ROW ? lid : BRAILLE_BLANK.repeat(width);
      line = line.slice(0, start) + eyelid + line.slice(start + width);
    }
    return line;
  });
}

/** Give sparse fur and highlights distinct brightness while preserving dot placement. @param {string} glyph @returns {number} */
function getBrailleTone(glyph) {
  let dots = glyph.charCodeAt(0) - BRAILLE_BLANK.charCodeAt(0);
  let density = 0;
  while (dots > 0) {
    density += dots & 1;
    dots >>>= 1;
  }
  return 2 + Math.floor(density / 3);
}

/** Split the portrait into the same tone layers used by the other figures. @param {string[]} portrait @returns {{ layers: string[] }} */
function createPortraitFrame(portrait) {
  const layers = Array.from({ length: TONE_COUNT }, (_, tone) => portrait.map(row =>
    Array.from(row, glyph => glyph !== BRAILLE_BLANK && getBrailleTone(glyph) === tone ? glyph : BRAILLE_BLANK).join('')
  ).join('\n'));
  return { layers };
}

/** Render a brief blink every few seconds from two precomputed text poses. @param {string} artwork @returns {(time: number) => { layers: string[] }} */
export function createBrailleCatRenderer(artwork) {
  const portrait = artwork.split('\n');
  const open = createPortraitFrame(portrait);
  const closed = createPortraitFrame(closeEyes(portrait));
  return time => {
    const phase = time % 5.4;
    return phase >= 3.2 && phase < 3.39 ? closed : open;
  };
}
