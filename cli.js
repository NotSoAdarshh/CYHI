#!/usr/bin/env node
import path from 'node:path';
import { Command } from 'commander';
import { frontEndFolder, backEndFolder, projectFolder, InitalizeGitRepo, vercelFrontEnd, vercelBackEnd, watchRepoCommits, scrubPastCommit, installDependencies, installFrontendDependencies, installBackendDependencies, installPackages, harvestCommits } from './command.js';
import { projectOptions, promptDependencies, typeDependencies, selectDependencies } from './options.js';

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
  .option('-p, --path <targetPath>', 'Base directory path where the project should be created')
  .option('-f, --front', 'Creates a FrontEnd folder')
  .option('-b, --back', 'Creates a BackEnd folder')
  .option('--fb, --frontandback', 'Creates FrontEnd and BackEnd folders')
  .action(async (name, options) => {
    const targetPath = options.path ? path.resolve(options.path, name) : name;
    await projectFolder(targetPath);

    let projectType;
    if (options.frontandback) {
      projectType = 'frontandback';
    } else if (options.front) {
      projectType = 'front';
    } else if (options.back) {
      projectType = 'back';
    } else {
      projectType = await projectOptions();
    }

    if (projectType === 'frontandback') {
      await frontEndFolder(targetPath);
      await backEndFolder(targetPath);
    }
    else if (projectType === 'front') {
      await frontEndFolder(targetPath);
    }
    else if (projectType === 'back') {
      await backEndFolder(targetPath);
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
  .description('Monitor a GitHub repository for new commits and log them in real-time')
  .argument('<repo_url>', 'GitHub repository URL you want to monitor')
  .option('-b, --branch <branch>', 'Specific branch to monitor')
  .option('-i, --interval <minutes>', 'Default set to 10')
  .option('-t, --token <token>', 'GitHub Personal Access Token (for private repos or higher rate limit)')
  .action(async (repo_url, options) => {
    await watchRepoCommits(repo_url, options);
  });

// Make changes to a previous commited change 
program
  .command('rev')
  .description('Reverse or modify a previous commit via interactive rebase')
  .argument('[branch]', 'Target branch name (default: active branch)')
  .option('-c, --commits-back <commits_back>', 'Number of commits back to include in rebase', '3')
  .option('-p, --push', 'Force push changes to the remote repository')
  .action(async (branch, options) => {
    await scrubPastCommit(branch, {
      commitsBack: options.commitsBack,
      push: options.push
    });
  });



program
  .command('add')
  .alias('install')
  .description('Install dependencies (type multiple packages or select interactively)')
  .argument('[packages...]', 'Package names to install (optional, launches interactive prompt if omitted)')
  .option('-d, --dev', 'Save packages as devDependencies (-D)')
  .option('-p, --path <path>', 'Target directory to install in', '')
  .action(async (packages, options) => {
    let toInstall = packages;
    if (!toInstall || toInstall.length === 0) {
      toInstall = await promptDependencies();
    }
    if (toInstall && toInstall.length > 0) {
      await installPackages(toInstall, options.path, options.dev);
    }
  });

program
  .command('harvest')
  .description('Harvest commits from one branch to another')
  .argument('<sourceBranch>', 'Name of the branch to harvest commits from')
  .argument('[start]', 'Starting commit number')
  .argument('[end]', 'Ending commit number')
  .option('-t, --target-branch <targetBranch>', 'Name of the target branch (default: current branch)')
  .option('-s, --start-commit <start>', 'Starting commit number')
  .option('-e, --end-commit <end>', 'Ending commit number')
  .action(async (sourceBranch, startArg, endArg, options) => {
    const start = options.startCommit || startArg;
    const end = options.endCommit || endArg;
    await harvestCommits(sourceBranch, start, end, {
      targetBranch: options.targetBranch
    });
  });


// 3. Parse the user's terminal input
program.parse(process.argv);