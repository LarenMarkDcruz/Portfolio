import { Bash } from './vendor/just_bash.js';
import { createSandboxSession } from './sandbox_session.js?v=20261115-loops';

/** Handle terminal work inside an isolated worker, without a DOM or host filesystem. @returns {void} */
function initializeSandboxWorker() {
  let session;
  self.onmessage = async ({ data }) => {
    try {
      if (data.type === 'initialize') {
        session = createSandboxSession({ Bash, files: data.files });
        session.setSection(data.section);
        self.postMessage({ identifier: data.identifier, result: { stdout: '', stderr: '', exitCode: 0 } });
        return;
      }
      if (data.type === 'section') { session.setSection(data.section); return; }
      const result = await session.execute(data.line);
      self.postMessage({ identifier: data.identifier, result });
    } catch (error) {
      self.postMessage({ identifier: data.identifier, error: `Sandbox execution failed: ${error.message}` });
    }
  };
}

initializeSandboxWorker();
