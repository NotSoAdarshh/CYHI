import path from 'node:path';
import { runCommand } from './utils.js';

/**
 * Installs specified npm packages into the target directory.
 * @param {string[]|string} packages - Array of package names or space-separated string
 * @param {string} targetDir - Destination directory (default: current working directory)
 * @param {boolean} isDev - Whether to install as devDependencies (-D)
 */
async function installDependencies(packages = [], targetDir = '', isDev = false) {
  try {
    const pkgArray = Array.isArray(packages)
      ? packages.map(p => p.trim()).filter(Boolean)
      : String(packages).split(/[\s,]+/).map(p => p.trim()).filter(Boolean);

    if (pkgArray.length === 0) {
      console.log('No dependencies specified to install.');
      return;
    }

    const resolvedDir = targetDir ? path.resolve(targetDir) : process.cwd();
    const pkgList = pkgArray.join(' ');
    const devFlag = isDev ? '-D' : '';
    const cmd = `npm install ${devFlag} ${pkgList}`.replace(/\s+/g, ' ').trim();

    console.log(`\n Installing dependencies in ${resolvedDir}...`);
    console.log(`> ${cmd}\n`);

    const output = await runCommand(cmd, { cwd: resolvedDir });
    console.log(output);
    console.log(`\n Successfully installed ${pkgArray.length} package(s): ${pkgArray.join(', ')}\n`);
  } catch (err) {
    console.error(`\n Error installing dependencies in ${targetDir || 'current directory'}:`, err.message);
  }
}

/**
 * Installs dependencies specifically into the FrontEnd directory of a project
 * @param {string} projectName - Project folder name
 * @param {string[]|string} packages - Packages to install
 * @param {boolean} isDev - Whether to install as devDependencies
 */
async function installFrontendDependencies(projectName = '', packages = [], isDev = false) {
  const targetDir = projectName ? path.resolve(projectName, 'FrontEnd') : path.resolve('FrontEnd');
  console.log(`Installing FrontEnd dependencies for "${projectName || 'current project'}"...`);
  await installDependencies(packages, targetDir, isDev);
}

/**
 * Installs dependencies specifically into the BackEnd directory of a project
 * @param {string} projectName - Project folder name
 * @param {string[]|string} packages - Packages to install
 * @param {boolean} isDev - Whether to install as devDependencies
 */
async function installBackendDependencies(projectName = '', packages = [], isDev = false) {
  const targetDir = projectName ? path.resolve(projectName, 'BackEnd') : path.resolve('BackEnd');
  console.log(`Installing BackEnd dependencies for "${projectName || 'current project'}"...`);
  await installDependencies(packages, targetDir, isDev);
}

// Alias for installDependencies
const installPackages = installDependencies;

export {
  installDependencies,
  installFrontendDependencies,
  installBackendDependencies,
  installPackages
};
