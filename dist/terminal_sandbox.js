const SANDBOX_DEADLINE_IN_MILLISECONDS = 5000;

/** Seed virtual files with the portfolio text and a writable playground. @param {Document} website @returns {object} */
export function createPortfolioFiles(website) {
  const files = { '/home/visitor/README.md': 'Welcome to the portfolio sandbox.\nUse cd home, cd skills, cd resume, cd work, or cd beyond.\nFiles are virtual and reset when this page reloads.\nTry: echo hello > note.txt; cat note.txt\n',
    '/home/visitor/playground/README.md': 'Your scratch space. Try mkdir, touch, echo, cat, grep, sort, awk, sed, or jq.\n' };
  const filenames = { home: 'main.cpp', skills: 'skills.hpp', resume: 'resume.md', work: 'work.cpp', beyond: 'beyond.cpp' };
  for (const [section, filename] of Object.entries(filenames)) {
    const content = website.querySelector(`#${section}`).textContent.replace(/\n{3,}/g, '\n\n').trim();
    files[`/home/visitor/${filename}`] = `${content}\n`;
    files[`/home/visitor/${section}/README.md`] = `${content}\n`;
  }
  return files;
}

/** Start a worker and connect its request/response channel. @param {object} state @returns {void} */
function startSandboxWorker(state) {
  state.worker = new Worker(new URL('./sandbox_worker.js?v=20261115-loops', import.meta.url), { type: 'module' });
  state.worker.onmessage = ({ data }) => {
    const pending = state.pending;
    if (!pending || data.identifier !== pending.identifier) return;
    clearTimeout(pending.timeout);
    state.pending = null;
    if (data.error) pending.reject(new Error(data.error));
    else pending.resolve(data.result);
  };
  state.worker.onerror = () => stopSandboxWorker(state, 'The sandbox could not load. Reload the page and try again.');
}

/** Revoke running work when cancelled or timed out. @param {object} state @param {string} message @returns {void} */
function stopSandboxWorker(state, message) {
  state.worker?.terminate();
  state.worker = null;
  state.initialization = null;
  if (!state.pending) return;
  clearTimeout(state.pending.timeout);
  const pending = state.pending;
  state.pending = null;
  pending.reject(new Error(message));
}

/** Send one bounded operation to the virtual shell. @param {object} state @param {object} request @returns {Promise<object>} */
function requestSandboxOperation(state, request) {
  return new Promise((resolve, reject) => {
    const identifier = ++state.identifier;
    const timeout = setTimeout(() => stopSandboxWorker(state, 'Command stopped after five seconds. The virtual sandbox has reset.'), SANDBOX_DEADLINE_IN_MILLISECONDS);
    state.pending = { identifier, resolve, reject, timeout };
    state.worker.postMessage({ ...request, identifier });
  });
}

/** Create an on-demand shell that leaves page rendering on the main thread. @param {object} options @returns {object} */
export function createTerminalSandbox({ files, section }) {
  const state = { files, section, worker: null, pending: null, initialization: null, identifier: 0 };
  return {
    /** Lazily load Bash on the first shell command. */
    async execute(line) {
      if (!state.worker) {
        startSandboxWorker(state);
        state.initialization = requestSandboxOperation(state, { type: 'initialize', files: state.files, section: state.section });
      }
      await state.initialization;
      return requestSandboxOperation(state, { type: 'execute', line });
    },
    /** Keep subsequent commands in the section selected through tabs. */
    setSection(selectedSection) {
      state.section = selectedSection;
      state.worker?.postMessage({ type: 'section', section: selectedSection });
    },
    /** Interrupt work without blocking the website. */
    cancel() { stopSandboxWorker(state, 'Cancelled. The virtual sandbox has reset.'); },
  };
}
