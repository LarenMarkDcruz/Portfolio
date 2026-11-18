const KEYBOARD_RESIZE_STEP_IN_PIXELS = 24;

/** @typedef {{document: Document, button: HTMLButtonElement, terminal: HTMLElement, resizeHandle: HTMLElement}} TerminalDock */

/** Update the accessible toggle and the page's reserved dock space. @param {TerminalDock} dock @param {boolean} isExpanded @returns {void} */
function setTerminalExpansion(dock, isExpanded) {
  dock.document.body.dataset.terminalExpanded = String(isExpanded);
  dock.button.setAttribute('aria-expanded', String(isExpanded));
  dock.button.setAttribute('aria-label', `${isExpanded ? 'Collapse' : 'Expand'} terminal history`);
  dock.button.textContent = isExpanded ? '[collapse −]' : '[expand +]';
  if (isExpanded) updateResizeAccessibility(dock);
}

/** Keep the separator's range synchronized with the actual dock size. @param {TerminalDock} dock @returns {void} */
function updateResizeAccessibility(dock) {
  if (dock.document.body.dataset.terminalExpanded !== 'true') return;
  const { minHeight, maxHeight } = dock.document.defaultView.getComputedStyle(dock.terminal);
  const height = dock.terminal.offsetHeight;
  dock.resizeHandle.setAttribute('aria-valuemin', String(Math.round(Number.parseFloat(minHeight))));
  dock.resizeHandle.setAttribute('aria-valuemax', String(Math.round(Number.parseFloat(maxHeight))));
  dock.resizeHandle.setAttribute('aria-valuenow', String(height));
  dock.resizeHandle.setAttribute('aria-valuetext', `${height} pixels tall`);
}

/** Set the preferred height within the viewport's current limits. @param {TerminalDock} dock @param {number} requestedHeight @returns {void} */
function resizeTerminal(dock, requestedHeight) {
  const { minHeight, maxHeight } = dock.document.defaultView.getComputedStyle(dock.terminal);
  const height = Math.min(Number.parseFloat(maxHeight), Math.max(Number.parseFloat(minHeight), requestedHeight));
  dock.document.documentElement.style.setProperty('--terminal-preferred-height', `${height}px`);
  updateResizeAccessibility(dock);
}

/** Let a focused separator respond to arrow keys and jump to its limits. @param {TerminalDock} dock @param {KeyboardEvent} event @returns {void} */
function resizeTerminalWithKeyboard(dock, event) {
  const height = dock.terminal.offsetHeight;
  const requestedHeights = new Map([
    ['ArrowUp', height + KEYBOARD_RESIZE_STEP_IN_PIXELS],
    ['ArrowDown', height - KEYBOARD_RESIZE_STEP_IN_PIXELS],
    ['Home', 0],
    ['End', Infinity],
  ]);
  if (!requestedHeights.has(event.key)) return;
  event.preventDefault();
  resizeTerminal(dock, requestedHeights.get(event.key));
}

/** Use pointer capture to keep resizing when the pointer leaves the grip. @param {TerminalDock} dock @returns {void} */
function enablePointerResize(dock) {
  const { resizeHandle, document, terminal } = dock;
  let drag;
  resizeHandle.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || drag) return;
    drag = { pointerId: event.pointerId, startingPosition: event.clientY, startingHeight: terminal.offsetHeight };
    resizeHandle.setPointerCapture(event.pointerId);
    document.documentElement.dataset.terminalResizing = '';
  });
  resizeHandle.addEventListener('pointermove', (event) => {
    if (event.pointerId !== drag?.pointerId) return;
    resizeTerminal(dock, drag.startingHeight + drag.startingPosition - event.clientY);
  });
  resizeHandle.addEventListener('lostpointercapture', (event) => {
    if (event.pointerId !== drag?.pointerId) return;
    drag = undefined;
    delete document.documentElement.dataset.terminalResizing;
  });
}

/** Keep a compact terminal accessible below the scrolling portfolio. @param {Document} document @returns {void} */
export function initializeTerminalDock(document) {
  const dock = {
    document, button: document.querySelector('#terminal-toggle'),
    terminal: document.querySelector('.shell > .terminal'),
    resizeHandle: document.querySelector('#terminal-resize'),
  };
  const mobilePreference = document.defaultView.matchMedia('(max-width: 700px)');
  setTerminalExpansion(dock, !mobilePreference.matches);
  dock.button.addEventListener('click', () => {
    setTerminalExpansion(dock, dock.button.getAttribute('aria-expanded') !== 'true');
  });
  document.querySelector('#terminal-form').addEventListener('submit', () => setTerminalExpansion(dock, true), { capture: true });
  mobilePreference.addEventListener('change', () => setTerminalExpansion(dock, !mobilePreference.matches));
  dock.resizeHandle.addEventListener('keydown', (event) => resizeTerminalWithKeyboard(dock, event));
  document.defaultView.addEventListener('resize', () => updateResizeAccessibility(dock));
  enablePointerResize(dock);
}
