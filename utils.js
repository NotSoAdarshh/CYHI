import { promisify } from 'node:util';
import { exec as execCallback } from 'node:child_process';

const exec = promisify(execCallback);

/**
 * Executes a terminal command and returns the output.
 * @param {string} command - The terminal command to run.
 * @param {object} options - Execution options (e.g. cwd).
 * @returns {Promise<string>} - The command output (stdout).
 */
async function runCommand(command, options = {}) {
  try {
    const { stdout, stderr } = await exec(command, options);

    if (stderr) {
      console.warn(`Command warning: ${stderr}`);
    }

    return stdout.trim();
  } catch (error) {
    console.error(`Command failed: ${command}\nError: ${error.message}`);
    throw error;
  }
}

export {
  runCommand,
  exec
};
