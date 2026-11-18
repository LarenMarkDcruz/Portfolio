/** Update the accessible toggle and the page's reserved dock space. @param {object} dock @param {boolean} isExpanded @returns {void} */
function setTerminalExpansion(dock, isExpanded) {
  dock.document.body.dataset.terminalExpanded = String(isExpanded);
  dock.button.setAttribute('aria-expanded', String(isExpanded));
  dock.button.setAttribute('aria-label', `${isExpanded ? 'Collapse' : 'Expand'} terminal history`);
  dock.button.textContent = isExpanded ? '[collapse −]' : '[expand +]';
}

/** Keep a compact terminal accessible below the scrolling portfolio. @param {Document} document @returns {void} */
export function initializeTerminalDock(document) {
  const dock = { document, button: document.querySelector('#terminal-toggle') };
  const mobilePreference = document.defaultView.matchMedia('(max-width: 700px)');
  setTerminalExpansion(dock, !mobilePreference.matches);
  dock.button.addEventListener('click', () => {
    setTerminalExpansion(dock, dock.button.getAttribute('aria-expanded') !== 'true');
  });
  document.querySelector('#terminal-form').addEventListener('submit', () => setTerminalExpansion(dock, true), { capture: true });
  mobilePreference.addEventListener('change', () => setTerminalExpansion(dock, !mobilePreference.matches));
}
