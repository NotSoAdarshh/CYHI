#!/usr/bin/env node
import { Command } from 'commander';
import { frontEndFolder, backEndFolder, projectFolder, InitalizeGitRepo, vercelFrontEnd, vercelBackEnd, watchRepoCommits } from './command.js';
import { projectOptions } from './options.js';

const program = new Command();

// 1. Basic configuration
program
  .name('hackme44')
  .description('A simple CLI built with Commander.js')
  .version('1.0.0');

// 2. Define a command, arguments, and options
program
  .command('greet')
  .description('Greet a user by name')
  .argument('<name>', 'The name of the person to greet') // < > means required
  .option('-u, --uppercase', 'Print the greeting in uppercase')
  .action((name, options) => {
    let message = `Hello, ${name}!`;
    if (options.uppercase) {
      message = message.toUpperCase();
    }
    console.log(message);
  });

program
  .command('project')
  .description('Creates a project folder')
  .argument('<name>', 'The name of the project') // < > means required
  .option('-f, --front', 'Creates a FrontEnd folder')
  .option('-b, --back', 'Creates a BackEnd folder')
  .option('--fb, --frontandback', 'Creates FrontEnd and BackEnd folders')
  .action(async (name, options) => {
    await projectFolder(name);

    const projectType = await projectOptions();

    if (projectType === 'frontandback') {
      await frontEndFolder(name);
      await backEndFolder(name);
    }
    else if (projectType === 'front') {
      await frontEndFolder(name);
    }
    else if (projectType === 'back') {
      await backEndFolder(name);
    }
    else {
      console.log('No option selected');
    }
  });

program
  .command('init-repo')
  .description('Initialize a git repository and connect to a remote repository')
  .argument('<name>', 'Project folder name')
  .argument('<repo_url>', 'Remote Git repository URL')
  .action(async (name, repo_url) => {
    await InitalizeGitRepo(name, repo_url);
  });

program
  .command('vercel')
  .description('Deploys project to Vercel')
  .argument('[name]', 'Project folder name ')
  .option('-f, --front', 'Deploy FrontEnd')
  .option('-b, --back', 'Deploy BackEnd')
  .option('-p, --prod', 'Deploy directly to production')
  .action(async (name, options) => {
    if (options.back && !options.front) {

      await vercelBackEnd(name, options);

    } else if (options.front && !options.back) {

      await vercelFrontEnd(name, options);

    } else if (options.front && options.back) {

      await vercelFrontEnd(name, options);

      await vercelBackEnd(name, options);

    } else {
      // Default: deploy FrontEnd
      await vercelFrontEnd(name, options);
    }
  });

program
  .command('watch-commits')
  .alias('watch')
  .description('Monitor a GitHub repository for new commits and log them in real-time')
  .argument('<repo_url>', 'GitHub repository URL (e.g. https://github.com/owner/repo or owner/repo)')
  .option('-b, --branch <branch>', 'Specific branch to monitor (default: repository default branch)')
  .option('-i, --interval <minutes>', 'Polling interval in minutes (default: 10)', '10')
  .option('-t, --token <token>', 'GitHub Personal Access Token (for private repos or higher rate limit)')
  .action(async (repo_url, options) => {
    await watchRepoCommits(repo_url, options);
  });

// 3. Parse the user's terminal input
program.parse(process.argv);