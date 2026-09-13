import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { runCommand, exec } from './utils.js';

/**
 * Creates a repository on GitHub for the authenticated user using the GitHub REST API.
 * @param {string} repoName - Name of repository to create
 * @param {object} options - { token, private, description }
 * @returns {Promise<{ url: string, created: boolean, username: string, alreadyExists?: boolean }>}
 */
async function createGitHubRepo(repoName, options = {}) {
  const token = options.token || process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('A GitHub Personal Access Token is required to automatically create a repository on GitHub. Set GITHUB_TOKEN in .env or pass --token.');
  }

  const headers = {
    'User-Agent': 'HackMe44-CLI',
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json'
  };

  // Get authenticated username
  const userRes = await fetch('https://api.github.com/user', { headers });
  if (!userRes.ok) {
    throw new Error(`Failed to authenticate with GitHub: ${userRes.statusText}`);
  }
  const userData = await userRes.json();
  const username = userData.login;

  // Try to create repository
  const createRes = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: repoName,
      private: Boolean(options.private),
      description: options.description || 'Created with HackMe44 CLI'
    })
  });

  const createData = await createRes.json().catch(() => ({}));

  if (createRes.status === 201) {
    return {
      url: createData.clone_url || `https://github.com/${username}/${repoName}.git`,
      created: true,
      username
    };
  }

  // If repo already exists on GitHub account
  const isAlreadyExists = createRes.status === 422 &&
    (createData.message?.includes('already exists') ||
      JSON.stringify(createData.errors || []).includes('already exists'));

  if (isAlreadyExists) {
    return {
      url: `https://github.com/${username}/${repoName}.git`,
      created: false,
      username,
      alreadyExists: true
    };
  }

  throw new Error(`GitHub API error (${createRes.status}): ${createData.message || createRes.statusText}`);
}

async function InitalizeGitRepo(project_name = '', repo_url = '', options = {}) {
  try {
    const targetDir = project_name ? path.resolve(project_name) : process.cwd();

    if (!existsSync(targetDir)) {
      throw new Error(`Directory "${targetDir}" does not exist. If your project was created in a custom path (e.g., -p ../), please pass the full path or use -p/--path.`);
    }

    console.log(`\nInitializing Git repository in ${targetDir}...`);

    // Ensure root .gitignore exists and ignores .env and node_modules before staging
    const rootGitignore = path.join(targetDir, '.gitignore');
    if (!existsSync(rootGitignore)) {
      await fs.writeFile(rootGitignore, "node_modules/\n.env\n.env.*\n*.env\ndist/\nbuild/\n");
    } else {
      const existing = await fs.readFile(rootGitignore, 'utf-8');
      if (!existing.includes('.env')) {
        await fs.appendFile(rootGitignore, '\n# Environment variables\n.env\n.env.*\n*.env\n');
      }
    }

    // 1. git init
    console.log("> git init");
    await runCommand('git init', { cwd: targetDir });

    // 2. git add .
    console.log("> git add .");
    await runCommand('git add .', { cwd: targetDir });

    // 3. git commit -m "Initial commit"
    console.log('> git commit -m "Initial commit"');
    try {
      await runCommand('git commit -m "Initial commit"', { cwd: targetDir });
    } catch {
      console.log('Working tree already clean or nothing to commit.');
    }

    // 4. git branch -M main
    console.log("> git branch -M main");
    await runCommand('git branch -M main', { cwd: targetDir });

    // 5. Determine remote repository URL
    let remoteUrl = repo_url;

    if (!remoteUrl) {
      // Auto-create or resolve on GitHub using the project name
      const repoName = path.basename(targetDir);
      console.log(`\nNo remote URL provided. Creating GitHub repository "${repoName}" automatically...`);

      try {
        const repoInfo = await createGitHubRepo(repoName, options);
        remoteUrl = repoInfo.url;
        if (repoInfo.created) {
          console.log(`🎉 Created new repository on GitHub: ${remoteUrl}`);
        } else if (repoInfo.alreadyExists) {
          console.log(`ℹ️ Repository "${repoName}" already exists on GitHub for ${repoInfo.username}. Using: ${remoteUrl}`);
        }
      } catch (err) {
        console.warn(`⚠️ Could not auto-create repository on GitHub: ${err.message}`);
        remoteUrl = `https://github.com/USERNAME/${repoName}.git`;
        console.log(`Falling back to: ${remoteUrl}`);
      }
    }

    // 6. Connect remote origin
    try {
      const existingRemotes = await runCommand('git remote', { cwd: targetDir });
      const remotesList = existingRemotes.split('\n').map(r => r.trim());
      if (remotesList.includes('origin')) {
        console.log(`> git remote set-url origin ${remoteUrl}`);
        await runCommand(`git remote set-url origin ${remoteUrl}`, { cwd: targetDir });
      } else {
        console.log(`> git remote add origin ${remoteUrl}`);
        await runCommand(`git remote add origin ${remoteUrl}`, { cwd: targetDir });
      }
    } catch {
      console.log(`> git remote add origin ${remoteUrl}`);
      await runCommand(`git remote add origin ${remoteUrl}`, { cwd: targetDir });
    }

    // 7. git push -u origin main
    console.log("> git push -u origin main");
    try {
      await runCommand('git push -u origin main', { cwd: targetDir });
      console.log("\n🚀 Git repository initialized and pushed to GitHub successfully!");
    } catch (pushErr) {
      console.warn(`\n⚠️ Note on push: ${pushErr.message}`);
      console.log(`Repository is initialized and connected to origin (${remoteUrl}).`);
      console.log(`To push manually at any time:`);
      console.log(`  cd "${targetDir}" && git push -u origin main\n`);
    }
  }
  catch (err) {
    console.log("Handled error in InitalizeGitRepo function:", err.message);
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

/**
 * Triggers a sync of a fork branch with its upstream repository via GitHub REST API.
 * POST /repos/{owner}/{repo}/merge-upstream
 * @param {string} forkUrl - Fork repository URL or owner/repo
 * @param {object} options - { branch, token }
 * @returns {Promise<object>} - Result of the sync operation
 */
async function syncForkBranch(forkUrl, options = {}) {
  try {
    const { owner, repo } = parseGitHubUrl(forkUrl);
    const branch = options.branch || 'main';
    const token = options.token || process.env.GITHUB_TOKEN;

    if (!token) {
      throw new Error('A GitHub Personal Access Token (PAT) with "repo" scope is required to sync a fork. Pass --token <token> or set GITHUB_TOKEN environment variable.');
    }

    const ghHeaders = {
      'User-Agent': 'HackMe44-Fork-Sync',
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    };

    console.log(`\nConnecting to GitHub to sync fork [${owner}/${repo}] (branch: ${branch})...`);

    // Step 1: Fetch fork metadata to get the parent (upstream) repo
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: ghHeaders });
    if (!repoRes.ok) {
      throw new Error(`Cannot access repository "${owner}/${repo}": ${repoRes.statusText}`);
    }

    // Verify token permissions for classic tokens (ghp_*)
    const tokenScopes = repoRes.headers.get('x-oauth-scopes');
    if (tokenScopes !== null && !tokenScopes.split(',').map(s => s.trim().toLowerCase()).some(s => s === 'repo' || s === 'public_repo')) {
      throw new Error(
        `GitHub token lacks write permissions to sync this fork.\n` +
        `   Current scopes: [${tokenScopes ? tokenScopes : 'no scopes selected'}]\n` +
        `   Required scope: "repo" (or "public_repo" for public repositories)\n` +
        `   👉 Solution: Go to https://github.com/settings/tokens, edit/create your token, and check the "repo" box.`
      );
    }

    const repoInfo = await repoRes.json();
    if (!repoInfo.fork || !repoInfo.parent) {
      throw new Error(`"${owner}/${repo}" is not a fork on GitHub. The sync-fork command only works on forked repositories.`);
    }
    const parentFullName = repoInfo.parent.full_name;

    // Step 2: Compare fork branch with upstream using GitHub compare API
    // This avoids the known GitHub quirk where merge-upstream returns 404 when already in sync
    const compareUrl = `https://api.github.com/repos/${parentFullName}/compare/${branch}...${owner}:${repo}:${branch}`;
    const compareRes = await fetch(compareUrl, { headers: ghHeaders });
    if (compareRes.ok) {
      const cmp = await compareRes.json();
      if (cmp.behind_by === 0) {
        console.log(`\nℹ️  Fork [${owner}/${repo}:${branch}] is already up to date with upstream [${parentFullName}].`);
        console.log(`   Status: identical (0 commits behind upstream)\n`);
        return { success: true, merge_type: 'none', alreadyInSync: true };
      }
      console.log(`   Fork is ${cmp.behind_by} commit(s) behind upstream. Syncing...`);
    }

    // Step 3: Call merge-upstream to sync the fork
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/merge-upstream`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: ghHeaders,
      body: JSON.stringify({ branch })
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 200) {
      if (data.merge_type === 'none' || (data.message && data.message.includes('not behind'))) {
        console.log(`\nℹ️  Fork [${owner}/${repo}:${branch}] is already up to date with upstream.`);
        console.log(`   Message     : ${data.message}\n`);
      } else {
        console.log(`\n🎉 Successfully synced fork [${owner}/${repo}:${branch}] with upstream!`);
        console.log(`   Merge Type  : ${data.merge_type || 'fast-forward'}`);
        console.log(`   Base Branch : ${data.base_branch || 'upstream'}`);
        console.log(`   Message     : ${data.message}\n`);
      }
      return { success: true, ...data };
    } else if (response.status === 409) {
      console.warn(`\n⚠️  Merge conflict encountered while syncing fork [${owner}/${repo}:${branch}].`);
      console.warn(`   ${data.message || 'Cannot automatically merge upstream changes due to conflicts.'}`);
      console.warn(`   Action required: Resolve conflicts manually on GitHub or in your local clone.\n`);
      return { success: false, conflict: true, ...data };
    } else if (response.status === 422) {
      throw new Error(`Cannot sync "${owner}/${repo}": ${data.message || 'Repository is not a fork or branch does not exist.'}`);
    } else if (response.status === 404) {
      throw new Error(
        `GitHub API error (404): Not Found.\n` +
        `   This occurs when the token lacks write/push access to branch "${branch}" on "${owner}/${repo}".\n` +
        `   Ensure your token has the "repo" scope checked at https://github.com/settings/tokens.`
      );
    } else {
      throw new Error(`GitHub API error (${response.status}): ${data.message || response.statusText}`);
    }
  } catch (err) {
    console.error(`\n❌ Error syncing fork:`, err.message);
    throw err;
  }
}

/**
 * Monitors an upstream repository for new commits, and automatically triggers
 * GitHub merge-upstream API to sync the forked repository.
 * @param {string} forkUrl - Fork repository URL or owner/repo
 * @param {string} [upstreamUrl] - Upstream repository URL or owner/repo (auto-detected if omitted)
 * @param {object} options - { branch, token, interval, initialSync }
 */
async function watchAndSyncFork(forkUrl, upstreamUrl = '', options = {}) {
  try {
    const fork = parseGitHubUrl(forkUrl);
    const branch = options.branch || 'main';
    const intervalMinutes = options.interval ? parseFloat(options.interval) : 2;
    const intervalMs = Math.max(intervalMinutes * 60 * 1000, 5000);
    const token = options.token || process.env.GITHUB_TOKEN;

    if (!token) {
      throw new Error('A GitHub Personal Access Token (PAT) with "repo" scope is required to sync a fork. Pass --token <token> or set GITHUB_TOKEN environment variable.');
    }

    // Auto-detect upstream parent repo if not specified
    let targetUpstream = upstreamUrl;
    if (!targetUpstream) {
      console.log(`\nAuto-detecting upstream parent repository for [${fork.owner}/${fork.repo}]...`);
      const repoDetailsRes = await fetch(`https://api.github.com/repos/${fork.owner}/${fork.repo}`, {
        headers: {
          'User-Agent': 'HackMe44-Fork-Sync',
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!repoDetailsRes.ok) {
        throw new Error(`Failed to inspect repository "${fork.owner}/${fork.repo}": ${repoDetailsRes.statusText}`);
      }
      const repoInfo = await repoDetailsRes.json();
      if (!repoInfo.fork || !repoInfo.parent) {
        throw new Error(`Repository "${fork.owner}/${fork.repo}" is not a fork on GitHub.`);
      }
      targetUpstream = repoInfo.parent.full_name;
      console.log(`Detected upstream repository: ${targetUpstream}`);
    }

    const upstream = parseGitHubUrl(targetUpstream);

    console.log(`\n======================================================`);
    console.log(`🔄 GitHub Fork Auto-Sync Watcher`);
    console.log(`   Fork (Target)     : ${fork.owner}/${fork.repo} (branch: ${branch})`);
    console.log(`   Upstream (Source) : ${upstream.owner}/${upstream.repo} (branch: ${branch})`);
    console.log(`   Poll Interval     : ${intervalMinutes} minute(s)`);
    console.log(`======================================================\n`);

    // Initial check of upstream commits
    console.log(`Checking upstream [${upstream.owner}/${upstream.repo}]...`);
    const initialData = await fetchRepoCommits(upstream.owner, upstream.repo, { branch, token });
    let lastSeenSha = initialData.commits[0].sha;
    const latest = initialData.commits[0];
    const latestMsg = latest.commit.message.split('\n')[0];
    console.log(`Current upstream HEAD: [${lastSeenSha.substring(0, 7)}] ${latestMsg}`);

    // Initial sync check
    console.log(`\nChecking fork status with upstream...`);
    try {
      await syncForkBranch(forkUrl, { branch, token });
    } catch { }

    console.log(`Watching upstream for new commits... (Press Ctrl+C to stop)\n`);

    setInterval(async () => {
      try {
        const { commits } = await fetchRepoCommits(upstream.owner, upstream.repo, { branch, token });
        if (!commits || commits.length === 0) return;

        const currentLatestSha = commits[0].sha;
        if (currentLatestSha !== lastSeenSha) {
          const newCommitsCount = commits.findIndex(c => c.sha === lastSeenSha);
          const countStr = newCommitsCount > 0 ? `${newCommitsCount} new commit(s)` : 'New commit(s)';
          const latestCommit = commits[0];
          const latestMsg = latestCommit.commit.message.split('\n')[0];

          console.log(`\n🚨 UPSTREAM UPDATE DETECTED! (${countStr})`);
          console.log(`   Latest  : [${currentLatestSha.substring(0, 7)}] ${latestMsg}`);
          console.log(`   Author  : ${latestCommit.commit.author.name}`);
          console.log(`\n🚀 Auto-syncing fork [${fork.owner}/${fork.repo}] with upstream...`);

          try {
            await syncForkBranch(forkUrl, { branch, token });
          } catch (syncErr) {
            console.error(`Sync failed:`, syncErr.message);
          }

          lastSeenSha = currentLatestSha;
        } else {
          const now = new Date().toLocaleTimeString();
          console.log(`[${now}] Upstream [${upstream.owner}/${upstream.repo}] checked - in sync.`);
        }
      } catch (pollErr) {
        console.error(`[${new Date().toLocaleTimeString()}] Error during poll/sync:`, pollErr.message);
      }
    }, intervalMs);

  } catch (err) {
    console.error(`\n❌ Error starting fork auto-sync watcher:`, err.message);
  }
}

async function scrubPastCommit(branch, options = {}) {
  let rl = readline.createInterface({ input, output });

  try {
    // 1. Verify we are inside a Git repository
    let gitDir;
    try {
      gitDir = execSync('git rev-parse --git-dir', { encoding: 'utf-8' }).trim();
    } catch {
      throw new Error('Not inside a Git repository. Please run this command within a Git repository.');
    }

    // 2. Determine and verify active branch
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
    const targetBranch = branch || currentBranch || 'main';

    console.log(`\n Git History Sanitizer`);
    console.log(` Target Branch  : ${targetBranch}`);

    if (currentBranch && currentBranch !== targetBranch) {
      throw new Error(`Active branch '${currentBranch}' does not match target '${targetBranch}'. Checkout '${targetBranch}' first using 'git checkout ${targetBranch}'.`);
    }

    // 3. Determine commits depth / target
    const commitsBack = options.commitsBack ? parseInt(options.commitsBack, 10) : 3;
    const totalCommits = parseInt(execSync('git rev-list --count HEAD', { encoding: 'utf-8' }).trim(), 10);
    const rebaseTarget = commitsBack >= totalCommits ? '--root' : `HEAD~${commitsBack}`;
    console.log(` Depth          : ${rebaseTarget} (total commits in branch: ${totalCommits})`);

    console.log(`\nInitiating interactive rebase...`);
    console.log(`Instructions: In the editor that opens, change 'pick' to 'edit' next to the commit you want to modify, then save and exit.\n`);

    await rl.question('Press Enter to open the git editor...');
    rl.close();

    // 4. Launch interactive rebase directly connected to terminal stdio
    try {
      execSync(`git rebase -i ${rebaseTarget}`, { stdio: 'inherit' });
    } catch {
      // Check if git is paused at the edit step or if the user aborted
      const inRebase = existsSync(path.join(gitDir, 'rebase-merge')) || existsSync(path.join(gitDir, 'rebase-apply'));
      if (!inRebase) {
        throw new Error('Rebase stopped or aborted without marking a commit as "edit".');
      }
    }

    // Reopen readline interface for subsequent prompts
    rl = readline.createInterface({ input, output });

    // 5. Ensure we are inside a paused rebase state
    const isPausedInRebase = existsSync(path.join(gitDir, 'rebase-merge')) || existsSync(path.join(gitDir, 'rebase-apply'));
    if (!isPausedInRebase) {
      console.log('Rebase completed without pausing. (No commit was marked with "edit").');
      return;
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

    // 6. Stage changes and amend the paused commit
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

    // 7. Remote sync
    let shouldPush = options.push || options.autoPush;
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

async function harvestCommits(sourceBranch, startNum, endNum, options = {}) {
  // Need readline for user input if ranges are omitted
  const readlineModule = await import('node:readline/promises');
  const { stdin: input, stdout: output } = await import('node:process');
  const rl = readlineModule.createInterface({ input, output });

  try {
    if (!sourceBranch) {
      throw new Error("Source branch name is required (e.g., harvestCommits('feature')).");
    }

    // 1. Verify working branch and clean worktree
    const currentBranch = await runCommand('git branch --show-current');
    const targetBranch = options.targetBranch || currentBranch;

    if (!currentBranch) {
      throw new Error('Not on a valid Git branch or detached HEAD.');
    }

    if (targetBranch === sourceBranch) {
      throw new Error(`Target branch and source branch cannot be identical ('${sourceBranch}').`);
    }

    // Verify sourceBranch and targetBranch exist
    try {
      await exec(`git rev-parse --verify "${sourceBranch}"`);
    } catch {
      throw new Error(`Source branch '${sourceBranch}' does not exist in local repository. Check 'git branch' to see available branches.`);
    }

    try {
      await exec(`git rev-parse --verify "${targetBranch}"`);
    } catch {
      throw new Error(`Target branch '${targetBranch}' does not exist in local repository.`);
    }

    if (currentBranch !== targetBranch) {
      console.log(`Checking out target branch: ${targetBranch}`);
      await runCommand(`git checkout ${targetBranch}`);
    }

    const uncommitted = await runCommand('git status --porcelain');
    if (uncommitted.length > 0) {
      throw new Error('Working tree contains uncommitted changes. Please commit or stash them first.');
    }

    // 2. Fetch candidate commits unique to sourceBranch
    console.log(`\n🌾 Git Harvest`);
    console.log(` Target Branch (Receiving) : ${targetBranch}`);
    console.log(` Source Branch (Losing)    : ${sourceBranch}`);

    // Commit list in chronological order (oldest -> newest)
    const logRaw = await runCommand(`git log ${targetBranch}..${sourceBranch} --oneline --reverse`);
    if (!logRaw || !logRaw.trim()) {
      console.log(`\nNo unique commits found on '${sourceBranch}' relative to '${targetBranch}'.`);
      return;
    }

    const commits = logRaw.trim().split('\n').filter(Boolean).map((line, idx) => {
      const [sha, ...msgParts] = line.trim().split(' ');
      return { num: idx + 1, sha, message: msgParts.join(' ') };
    });

    console.log(`\nAvailable commits on '${sourceBranch}' (Chronological order):`);
    commits.forEach(c => {
      console.log(`  [${c.num}] ${c.sha} - ${c.message}`);
    });

    // 3. Determine contiguous range [start, end]
    let start = startNum ? parseInt(startNum, 10) : null;
    let end = endNum ? parseInt(endNum, 10) : null;

    if (!start || !end) {
      const rangeInput = await rl.question(
        `\nEnter contiguous commit range to harvest (e.g., '1 2' or '2-4'): `
      );
      const parts = rangeInput.trim().split(/[\s\-:,]+/).map(v => parseInt(v, 10)).filter(Boolean);
      if (parts.length === 1) {
        start = parts[0];
        end = parts[0];
      } else if (parts.length >= 2) {
        start = Math.min(parts[0], parts[1]);
        end = Math.max(parts[0], parts[1]);
      }
    }

    if (!start || !end || start < 1 || end > commits.length || start > end) {
      throw new Error(`Invalid range [${start}, ${end}]. Must be between 1 and ${commits.length}.`);
    }

    const selectedCommits = commits.slice(start - 1, end);
    const firstCommit = selectedCommits[0];
    const lastCommit = selectedCommits[selectedCommits.length - 1];

    console.log(`\nHarvesting commits [${start} to ${end}]:`);
    selectedCommits.forEach(c => console.log(`  -> ${c.sha}: ${c.message}`));

    // 4. Cherry-pick onto target branch (X .. Y)
    console.log(`\n[1/3] Copying commits to '${targetBranch}'...`);
    const commitShas = selectedCommits.map(c => c.sha).join(' ');
    await runCommand(`git cherry-pick ${commitShas}`);
    console.log(`Successfully cherry-picked onto ${targetBranch}.`);

    // 5. Switch to source branch and excise commits using rebase --onto
    console.log(`\n[2/3] Switching to '${sourceBranch}' to excise harvested commits...`);
    await runCommand(`git checkout ${sourceBranch}`);

    console.log(`[3/3] Running surgical rebase: git rebase --onto ${targetBranch} ${lastCommit.sha} ${sourceBranch}`);
    await runCommand(`git rebase --onto ${targetBranch} ${lastCommit.sha} ${sourceBranch}`);

    // 6. Return back to target branch
    await runCommand(`git checkout ${targetBranch}`);

    console.log(`\n🌾 Harvest completed successfully!`);
    console.log(` Commits [${firstCommit.sha}..${lastCommit.sha}] moved to '${targetBranch}' and removed from '${sourceBranch}'.\n`);

  } catch (err) {
    console.error(`\n Error during harvest:`, err.message);

    // Attempt quiet recovery if rebase or cherry-pick gets stuck
    try {
      await exec('git cherry-pick --abort');
    } catch { }
    try {
      await exec('git rebase --abort');
    } catch { }
  } finally {
    rl.close();
  }
}

export {
  InitalizeGitRepo,
  createGitHubRepo,
  parseGitHubUrl,
  fetchRepoCommits,
  watchRepoCommits,
  syncForkBranch,
  watchAndSyncFork,
  scrubPastCommit,
  harvestCommits
};
