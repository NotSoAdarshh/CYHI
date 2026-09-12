import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { exec as execCallback } from 'node:child_process';
const exec = promisify(execCallback);

/**
 * Executes a terminal command and returns the output.
 * @param {string} command - The terminal command to run.
 * @returns {Promise<string>} - The command output (stdout).
 */

async function runCommand(command, options = {}) {
  try {
    // Wait for the command to finish executing
    const { stdout, stderr } = await exec(command, options);

    // If the command writes to stderr (even if it didn't fail completely)
    if (stderr) {
      console.warn(`Command warning: ${stderr}`);
    }

    return stdout.trim(); // Return the output, removing trailing newlines
  } catch (error) {
    console.error(`Command failed: ${command}\nError: ${error.message}`);
    throw error; // Re-throw the error if you want the calling code to handle it
  }
}


async function projectFolder(project_name) {
  try {
    console.log("Creating an Project folder ");
    // const dire = await runCommand('cd')
    const file = `mkdir "${project_name}"`
    const result = await runCommand(file)
    console.log(`Created an Project folder ${result}`);
  }
  catch (err) {
    console.log("Handled error in main function.");
  }
}

async function frontEndFolder(project_name = '') {
  try {
    console.log("Creating an FrontEnd folder ");
    const folderPath = project_name ? `${project_name}/FrontEnd` : 'FrontEnd';
    const file1 = `npm create vite@latest "${folderPath}" -- --template react`;
    const result = await runCommand(file1);

    console.log(`Created an FrontEnd folder:\n${result}`);
    await frontEndBoilerPlate(project_name);
  }
  catch (err) {
    console.log("Handled error in main function.");
  }
}

async function frontEndBoilerPlate(project_name = '') {
  try {
    const folderPath = project_name ? path.join(project_name, 'FrontEnd') : 'FrontEnd';

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

    console.log(`Cleaned FrontEnd files & configured Tailwind CSS successfully.`);
  }
  catch (err) {
    console.log("Handled error in frontEndDeleteFiles function:", err.message);
  }
}


async function backEndFolder(project_name = '') {
  try {
    console.log("Creating an BackEnd folder ");
    const folderPath = project_name ? path.join(project_name, 'BackEnd') : 'BackEnd';
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
    const folderPath = project_name ? path.join(project_name, 'BackEnd') : 'BackEnd';
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
    console.log("Installing express and nodemon...");
    const installResult = await runCommand('npm install express nodemon', { cwd: folderPath });
    console.log(`Installed packages in BackEnd:\n${installResult}`);

    // 5. Create starter index.js
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

    console.log(`BackEnd boilerplate setup complete.`);
  }
  catch (err) {
    console.log("Handled error in backEndBoilerPlate function:", err.message);
  }
}

async function InitalizeGitRepo(project_name = '', repo_url = '') {
  try {
    const targetDir = project_name ? path.resolve(project_name) : process.cwd();
    console.log(`Initializing Git repository in ${targetDir}...`);

    // 1. git init
    console.log("> git init");
    await runCommand('git init', { cwd: targetDir });

    // 2. git add .
    console.log("> git add .");
    await runCommand('git add .', { cwd: targetDir });

    // 3. git commit -m "Initial commit"
    console.log('> git commit -m "Initial commit"');
    await runCommand('git commit -m "Initial commit"', { cwd: targetDir });

    // 4. git branch -M main
    console.log("> git branch -M main");
    await runCommand('git branch -M main', { cwd: targetDir });

    // 5. git remote add origin <url>
    const remoteUrl = repo_url || (project_name ? `https://github.com/USERNAME/${project_name}.git` : 'https://github.com/USERNAME/myProject.git');
    console.log(`> git remote add origin ${remoteUrl}`);
    await runCommand(`git remote add origin ${remoteUrl}`, { cwd: targetDir });

    // 6. git push -u origin main
    console.log("> git push -u origin main");
    await runCommand('git push -u origin main', { cwd: targetDir });

    console.log("Git repository initialized and pushed successfully!");
  }
  catch (err) {
    console.log("Handled error in InitalizeGitRepo function:", err.message);
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
    const rawName = project_name ? `${project_name}-frontend` : path.basename(targetDir);
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
    const rawName = project_name ? `${project_name}-backend` : path.basename(targetDir);
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


function parseGitHubUrl(url) {
  if (!url) throw new Error('Repository URL or owner/repo string is required');
  let cleaned = url.trim();
  // Remove trailing slash and .git
  cleaned = cleaned.replace(/\.git\/?$/, '').replace(/\/$/, '');

  // Check for owner/repo format directly
  const ownerRepoMatch = cleaned.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (ownerRepoMatch) {
    return { owner: ownerRepoMatch[1], repo: ownerRepoMatch[2] };
  }

  // Match github.com/owner/repo or github.com:owner/repo
  const match = cleaned.match(/github\.com[:/]([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/i);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }

  throw new Error(`Invalid GitHub repository URL: "${url}". Expected format: https://github.com/owner/repo or owner/repo`);
}

async function fetchRepoCommits(owner, repo, options = {}) {
  const branchParam = options.branch ? `&sha=${encodeURIComponent(options.branch)}` : '';
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=10${branchParam}`;

  const headers = {
    'User-Agent': 'HackMe44-Commit-Watcher',
    'Accept': 'application/vnd.github.v3+json'
  };

  const authToken = options.token || process.env.GITHUB_TOKEN;
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(apiUrl, { headers });

  const remaining = response.headers.get('x-ratelimit-remaining');
  const limit = response.headers.get('x-ratelimit-limit');
  const resetTime = response.headers.get('x-ratelimit-reset');

  if (response.status === 404) {
    throw new Error(`Repository "${owner}/${repo}" not found or is private. If it is private, pass --token <token> or set GITHUB_TOKEN.`);
  }

  if (response.status === 403 && remaining === '0') {
    const resetDate = resetTime ? new Date(parseInt(resetTime, 10) * 1000).toLocaleTimeString() : 'soon';
    throw new Error(`GitHub API rate limit exceeded (Limit: ${limit}/hr). Resets at ${resetDate}. Tip: Pass a GitHub token (--token) for 5,000 requests/hr.`);
  }

  if (!response.ok) {
    throw new Error(`GitHub API responded with HTTP ${response.status}: ${response.statusText}`);
  }

  const commits = await response.json();
  if (!Array.isArray(commits) || commits.length === 0) {
    throw new Error(`No commits found for repository "${owner}/${repo}".`);
  }

  return { commits, rateLimit: { remaining, limit } };
}

async function watchRepoCommits(repoUrl, options = {}) {
  try {
    const { owner, repo } = parseGitHubUrl(repoUrl);
    const intervalMinutes = options.interval ? parseFloat(options.interval) : 2;
    const intervalMs = Math.max(intervalMinutes * 60 * 1000, 5000); // minimum 5s safe guard

    console.log(`\nConnecting to GitHub for ${owner}/${repo}...`);
    const initialData = await fetchRepoCommits(owner, repo, options);
    let lastSeenSha = initialData.commits[0].sha;

    const latest = initialData.commits[0];
    const initialMsg = latest.commit.message.split('\n')[0];
    const initialAuthor = latest.commit.author.name;
    const initialDate = new Date(latest.commit.author.date).toLocaleString();


    console.log(` GitHub Commit Watch`);
    console.log(` Repository : ${owner}/${repo}`);
    console.log(` Branch     : ${options.branch || 'default branch'}`);
    console.log(` Current Branch: [${lastSeenSha.substring(0, 7)}] ${initialMsg}`);
    console.log(` Author      : ${initialAuthor} on ${initialDate}`);

    console.log(`Monitoring for new commits... (Press Ctrl+C to stop)\n`);

    setInterval(async () => {
      try {
        const { commits } = await fetchRepoCommits(owner, repo, options);
        if (!commits || commits.length === 0) return;

        const currentLatestSha = commits[0].sha;
        if (currentLatestSha !== lastSeenSha) {
          // Find all new commits pushed since lastSeenSha
          const lastIndex = commits.findIndex(c => c.sha === lastSeenSha);
          const newCommits = lastIndex !== -1 ? commits.slice(0, lastIndex).reverse() : [commits[0]];

          newCommits.forEach(commit => {
            const shortSha = commit.sha.substring(0, 7);
            const authorName = commit.commit.author.name;
            const authorLogin = commit.author ? ` (@${commit.author.login})` : '';
            const commitDate = new Date(commit.commit.author.date).toLocaleString();
            const message = commit.commit.message;
            const commitUrl = commit.html_url;

            console.log(`\n NEW COMMIT DETECTED`);
            console.log(` Commit  : ${shortSha} (${commit.sha})`);
            console.log(` Author  : ${authorName}${authorLogin}`);
            console.log(` Date    : ${commitDate}`);
            console.log(` Message :\n${message.split('\n').map(line => '   ' + line).join('\n')}`);
            console.log(` Link    : ${commitUrl}`);

          });

          lastSeenSha = currentLatestSha;
        } else {
          const now = new Date().toLocaleTimeString();
          console.log(`[${now}] Polled ${owner}/${repo} - No new commits.`);
        }
      } catch (err) {
        console.error(`[${new Date().toLocaleTimeString()}] Error checking commits:`, err.message);
      }
    }, intervalMs);

  } catch (err) {
    console.error(`\n Error starting commit watcher: ${err.message}`);
  }
}

async function scrubPastCommit(branch, options = {}) {
  const rl = readline.createInterface({ input, output });

  try {
    const commitsBack = options.commitsBack ? parseInt(options.commitsBack, 10) : 3;
    const targetBranch = branch || 'main';

    console.log(`\n Git History Sanitizer`);
    console.log(` Target Branch  : ${targetBranch}`);
    console.log(` Depth          : HEAD~${commitsBack}`);

    // Verify current working branch
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
    if (currentBranch !== targetBranch) {
      throw new Error(`Active branch '${currentBranch}' does not match target '${targetBranch}'. Checkout '${targetBranch}' first.`);
    }

    console.log(`\nInitiating interactive rebase...`);
    console.log(`Instructions: In the editor that opens, change 'pick' to 'edit' next to the commit with credentials, then save and exit.\n`);

    await rl.question('Press Enter to open the git editor...');

    // Launch interactive rebase directly connected to terminal stdio
    try {
      execSync(`git rebase -i HEAD~${commitsBack}`, { stdio: 'inherit' });
    } catch {
      // Check if git is paused at the edit step or if the user aborted
      const inRebase = fs.existsSync('.git/rebase-merge') || fs.existsSync('.git/rebase-apply');
      if (!inRebase) {
        throw new Error('Rebase stopped or aborted without marking a commit as "edit".');
      }
    }

    // Ensure we are inside a paused rebase state
    const isPausedInRebase = fs.existsSync('.git/rebase-merge') || fs.existsSync('.git/rebase-apply');
    if (!isPausedInRebase) {
      throw new Error('Rebase completed without pausing. Did you mark the commit with "edit"?');
    }

    const pausedCommitMsg = execSync('git log -1 --pretty=%B', { encoding: 'utf-8' }).trim().split('\n')[0];
    const pausedCommitSha = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();

    console.log(`\n========================================================`);
    console.log(` PAUSED AT COMMIT: [${pausedCommitSha}] ${pausedCommitMsg}`);
    console.log(`========================================================`);
    console.log(`Action required:`);
    console.log(` 1. Open your files in your editor and remove/sanitize the credentials.`);
    console.log(` 2. If untracking a file, add it to .gitignore or run 'git rm --cached <file>'.`);
    console.log(`========================================================\n`);

    const confirmation = await rl.question("Type 'done' when you have finished modifying your files (or 'abort' to cancel): ");

    if (confirmation.trim().toLowerCase() !== 'done') {
      console.log(`\nAborting rebase and restoring original repository state...`);
      execSync('git rebase --abort', { stdio: 'inherit' });
      console.log(`Repository restored to previous state.`);
      return;
    }

    // Stage changes and amend the paused commit
    console.log(`\n[1/3] Staging sanitized modifications...`);
    execSync('git add -A');

    console.log(`[2/3] Amending target commit...`);
    execSync('git commit --amend --no-edit');

    console.log(`[3/3] Replaying remaining commits...`);
    try {
      execSync('git rebase --continue', { stdio: 'inherit' });
    } catch (rebaseErr) {
      console.error(`\n Merge conflict encountered during 'git rebase --continue'.`);
      console.error(`Resolve conflicts manually in your editor, run 'git add .', and run 'git rebase --continue'.`);
      return;
    }

    console.log(`\n Local history successfully rewritten!`);
    const newHeadSha = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
    console.log(` Current HEAD : [${newHeadSha}]`);

    // Remote sync
    let shouldPush = options.autoPush;
    if (!shouldPush) {
      const pushPrompt = await rl.question(`\nDo you want to force-push the cleaned history to 'origin/${targetBranch}' now? (y/N): `);
      shouldPush = pushPrompt.trim().toLowerCase() === 'y';
    }

    if (shouldPush) {
      console.log(`\nForce-pushing to origin/${targetBranch} using --force-with-lease...`);
      execSync(`git push origin ${targetBranch} --force-with-lease`, { stdio: 'inherit' });
      console.log(`\n Successfully updated remote branch without the exposed credentials.`);
    } else {
      console.log(`\nPush skipped. You can push manually when ready:`);
      console.log(` git push origin ${targetBranch} --force-with-lease`);
    }

  } catch (err) {
    console.error(`\n Error during commit sanitization: ${err.message}`);
  } finally {
    rl.close();
  }
}

// async function revertGithubPush() {
//   try {
//     console.log(`Reverting last push to GitHub repository`);
//     const command = `git revert HEAD~1`;
//     const output = await runCommand(command);
//     console.log(output);
//   }
//   catch (err) {
//     console.log("Error in revertGithubPush function:", err.message);
//   }
// }

export {
  frontEndFolder,
  frontEndBoilerPlate,
  backEndFolder,
  backEndBoilerPlate,
  InitalizeGitRepo,
  vercelFrontEnd,
  vercelBackEnd,
  projectFolder,
  watchRepoCommits,
  fetchRepoCommits,
  parseGitHubUrl,
  scrubPastCommit
};
