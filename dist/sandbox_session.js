const HOME_DIRECTORY = '/home/visitor';
const EXECUTION_LIMITS = Object.freeze({
  maxExecutionTimeMs: 2500, maxCommandCount: 2000, maxLoopIterations: 2000,
  maxOutputSize: 32768, maxFileSystemBytes: 4 * 1024 * 1024, maxSourceBytes: 16384,
  maxStringLength: 262144, maxLiveBytes: 8 * 1024 * 1024, maxWorkUnits: 100000,
});

/** Create a bounded, memory-only Bash session using an injected shell implementation. @param {object} options @returns {object} */
export function createSandboxSession({ Bash, files }) {
  const shell = new Bash({ files, cwd: HOME_DIRECTORY, env: { HOME: HOME_DIRECTORY, USER: 'visitor', HOSTNAME: 'portfolio' },
    executionLimits: EXECUTION_LIMITS, defenseInDepth: false });
  const state = { directory: HOME_DIRECTORY, environment: shell.getEnv() };
  return {
    /** Run Bash syntax while preserving variables, current directory, and virtual files. */
    async execute(line) {
      const result = await shell.exec(line, { cwd: state.directory, env: state.environment, replaceEnv: true });
      state.environment = result.env;
      state.directory = result.env.PWD || state.directory;
      return { stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode, directory: state.directory };
    },
    /** Align shell navigation with a selected website section. */
    setSection(section) { state.directory = `${HOME_DIRECTORY}/${section}`; state.environment.PWD = state.directory; },
  };
}
