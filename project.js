import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { promptDependencies, promptFrontendDependencies, promptBackendDependencies } from './options.js';
import { installDependencies } from './dependencies.js';
import { runCommand } from './utils.js';

async function projectFolder(project_name) {
  try {
    const targetDir = path.resolve(project_name);
    console.log(`Creating Project folder: ${targetDir}`);
    await fs.mkdir(targetDir, { recursive: true });
    console.log(`Created Project folder: ${targetDir}`);
  }
  catch (err) {
    console.log("Handled error in projectFolder function:", err.message);
  }
}

async function frontEndFolder(project_name = '') {
  try {
    console.log("Creating an FrontEnd folder ");
    const folderPath = project_name ? path.resolve(project_name, 'FrontEnd') : path.resolve('FrontEnd');
    await fs.mkdir(folderPath, { recursive: true });

    // Run create-vite with '.' inside the target directory so Vite does not sanitize absolute paths into malformed directory names
    const file1 = `npm create vite@latest . -- --template react`;
    const result = await runCommand(file1, { cwd: folderPath });

    console.log(`Created an FrontEnd folder:\n${result}`);
    await frontEndBoilerPlate(project_name);
  }
  catch (err) {
    console.log("Handled error in frontEndFolder function:", err.message);
  }
}

async function frontEndBoilerPlate(project_name = '') {
  try {
    const folderPath = project_name ? path.resolve(project_name, 'FrontEnd') : path.resolve('FrontEnd');

    // 1. Delete App.css, README.md, and assets directory
    await fs.rm(path.join(folderPath, 'src', 'App.css'), { force: true });
    await fs.rm(path.join(folderPath, 'README.md'), { force: true });
    await fs.rm(path.join(folderPath, 'src', 'assets'), { recursive: true, force: true });

    // 2. Setup Tailwind in index.css
    await fs.writeFile(path.join(folderPath, 'src', 'index.css'), '@import "tailwindcss";\n');

    // 3. Reset App.jsx to a clean component
    const cleanAppContent = `import React from 'react'

const App = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
      <h1 className="text-3xl font-bold">Vite + React + Tailwind CSS</h1>
    </div>
  )
}

export default App
`;
    await fs.writeFile(path.join(folderPath, 'src', 'App.jsx'), cleanAppContent);

    // 4. Update vite.config.js for Tailwind CSS plugin
    const viteConfigContent = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
`;
    await fs.writeFile(path.join(folderPath, 'vite.config.js'), viteConfigContent);

    // 5. Install Tailwind CSS and @tailwindcss/vite packages
    console.log("Installing Tailwind CSS packages in FrontEnd...");
    const installOutput = await runCommand('npm install tailwindcss @tailwindcss/vite', { cwd: folderPath });
    console.log(`Tailwind CSS installed:\n${installOutput}`);

    // 6. Ensure .gitignore includes .env
    const gitignorePath = path.join(folderPath, '.gitignore');
    if (existsSync(gitignorePath)) {
      const currentGitignore = await fs.readFile(gitignorePath, 'utf-8');
      if (!currentGitignore.includes('.env')) {
        await fs.appendFile(gitignorePath, '\n# Environment variables\n.env\n.env.*\n*.env\n');
      }
    } else {
      await fs.writeFile(gitignorePath, 'node_modules/\ndist/\n.env\n.env.*\n*.env\n');
    }

    console.log(`Cleaned FrontEnd files, configured Tailwind CSS, and ensured .env in .gitignore successfully.`);

    // 7. Prompt and install user-selected dependencies for FrontEnd
    console.log(`\n📦 Select FrontEnd dependencies to install for "${project_name || 'FrontEnd'}":`);
    const customPackages = await promptFrontendDependencies();
    if (customPackages && customPackages.length > 0) {
      await installDependencies(customPackages, folderPath);
    }
  }
  catch (err) {
    console.log("Handled error in frontEndDeleteFiles function:", err.message);
  }
}

async function backEndFolder(project_name = '') {
  try {
    console.log("Creating an BackEnd folder ");
    const folderPath = project_name ? path.resolve(project_name, 'BackEnd') : path.resolve('BackEnd');
    await fs.mkdir(folderPath, { recursive: true });
    console.log(`Created an BackEnd folder`);

    await backEndBoilerPlate(project_name);
  }
  catch (err) {
    console.log("Handled error in backEndFolder function:", err.message);
  }
}

async function backEndBoilerPlate(project_name = '') {
  try {
    const folderPath = project_name ? path.resolve(project_name, 'BackEnd') : path.resolve('BackEnd');
    const subFolders = ['config', 'controllers', 'middleware', 'models', 'routes'];

    // 1. Create subfolders
    for (const folder of subFolders) {
      await fs.mkdir(path.join(folderPath, folder), { recursive: true });
    }
    console.log(`Created BackEnd boilerplate folders: ${subFolders.join(', ')}`);

    // 2. npm init -y
    console.log("Initializing BackEnd package.json...");
    await runCommand('npm init -y', { cwd: folderPath });

    // 3. Update package.json: set type: "module" and add dev/start scripts
    const packageJsonPath = path.join(folderPath, 'package.json');
    const packageData = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageData);
    packageJson.type = 'module';
    packageJson.main = 'index.js';
    packageJson.scripts = {
      ...packageJson.scripts,
      dev: 'nodemon index.js',
      start: 'node index.js'
    };
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));

    // 4. Install express and nodemon
    console.log("Installing base BackEnd packages (express, nodemon)...");
    const installResult = await runCommand('npm install express nodemon', { cwd: folderPath });
    console.log(`Installed base packages in BackEnd:\n${installResult}`);

    // 5. Prompt and install user-selected dependencies for BackEnd
    console.log(`\n📦 Select BackEnd dependencies to install for "${project_name || 'BackEnd'}":`);
    const customPackages = await promptBackendDependencies();
    if (customPackages && customPackages.length > 0) {
      await installDependencies(customPackages, folderPath);
    }

    // 6. Create starter index.js
    const starterServer = `import express from 'express';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server is running...');
});

app.listen(PORT, () => {
  console.log(\`Server is running on http://localhost:\${PORT}\`);
});
`;
    await fs.writeFile(path.join(folderPath, 'index.js'), starterServer);

    // 7. Create .gitignore for BackEnd
    const gitignorePath = path.join(folderPath, '.gitignore');
    await fs.writeFile(gitignorePath, "node_modules/\n.env\n.env.*\n*.env\nlogs/\n*.log\n");

    console.log(`BackEnd boilerplate setup complete.`);
  }
  catch (err) {
    console.log("Handled error in backEndBoilerPlate function:", err.message);
  }
}

async function vercelFrontEnd(project_name = '', options = {}) {
  try {
    let targetDir = project_name ? path.resolve(project_name) : process.cwd();

    // Check if there is a FrontEnd subfolder (common in our generated projects)
    const frontEndDir = path.join(targetDir, 'FrontEnd');
    try {
      await fs.access(frontEndDir);
      targetDir = frontEndDir;
      console.log(`Found FrontEnd folder. Deploying: ${targetDir}`);
    } catch {
      console.log(`Deploying directory: ${targetDir}`);
    }

    // Sanitize project name for Vercel: must be lowercase, alphanumeric + '.', '_', '-', no '---'
    const rawName = project_name ? `${path.basename(project_name)}-frontend` : path.basename(targetDir);
    const sanitizedName = rawName
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '-')
      .replace(/-{3,}/g, '--')
      .slice(0, 100);

    // Run Vercel deploy non-interactively using npx with lowercase project name
    const prodFlag = options.prod ? '--prod' : '';
    const deployCmd = `npx --yes vercel --name "${sanitizedName}" ${prodFlag} --yes`;
    console.log(`> ${deployCmd}`);
    const output = await runCommand(deployCmd, { cwd: targetDir });
    console.log(`Vercel output:\n${output}`);

    console.log("FrontEnd Vercel deployment finished successfully!");
  }
  catch (err) {
    console.log("Handled error in vercelFrontEnd function:", err.message);
  }
}

async function vercelBackEnd(project_name = '', options = {}) {
  try {
    let targetDir = project_name ? path.resolve(project_name) : process.cwd();

    // Check if there is a BackEnd subfolder
    const backEndDir = path.join(targetDir, 'BackEnd');
    try {
      await fs.access(backEndDir);
      targetDir = backEndDir;
      console.log(`Found BackEnd folder. Deploying: ${targetDir}`);
    } catch {
      console.log(`Deploying directory: ${targetDir}`);
    }

    // Ensure vercel.json exists for Express serverless routing on Vercel
    const vercelConfigPath = path.join(targetDir, 'vercel.json');
    try {
      await fs.access(vercelConfigPath);
    } catch {
      const vercelConfig = {
        version: 2,
        builds: [
          {
            src: "index.js",
            use: "@vercel/node"
          }
        ],
        routes: [
          {
            src: "/(.*)",
            dest: "index.js"
          }
        ]
      };
      await fs.writeFile(vercelConfigPath, JSON.stringify(vercelConfig, null, 2));
      console.log("Created vercel.json for BackEnd deployment.");
    }

    // Ensure index.js exports app for Vercel serverless functions
    const indexPath = path.join(targetDir, 'index.js');
    try {
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      if (!indexContent.includes('export default app') && !indexContent.includes('module.exports = app')) {
        await fs.appendFile(indexPath, '\nexport default app;\n');
      }
    } catch { }

    // Sanitize project name for Vercel: must be lowercase, alphanumeric + '.', '_', '-', no '---'
    const rawName = project_name ? `${path.basename(project_name)}-backend` : path.basename(targetDir);
    const sanitizedName = rawName
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '-')
      .replace(/-{3,}/g, '--')
      .slice(0, 100);

    // Run Vercel deploy non-interactively using npx with lowercase project name
    const prodFlag = options.prod ? '--prod' : '';
    const deployCmd = `npx --yes vercel --name "${sanitizedName}" ${prodFlag} --yes`;
    console.log(`> ${deployCmd}`);
    const output = await runCommand(deployCmd, { cwd: targetDir });
    console.log(`Vercel output:\n${output}`);

    console.log("BackEnd Vercel deployment finished successfully!");
  }
  catch (err) {
    console.log("Handled error in vercelBackEnd function:", err.message);
  }
}

export {
  projectFolder,
  frontEndFolder,
  frontEndBoilerPlate,
  backEndFolder,
  backEndBoilerPlate,
  vercelFrontEnd,
  vercelBackEnd
};
