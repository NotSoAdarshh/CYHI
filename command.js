/**
 * Re-export all commands from segregated modules:
 * - project.js: Project scaffolding and boilerplates (FrontEnd, BackEnd, Vercel)
 * - github.js: Git and GitHub automation (init, commits, sync-fork, scrub, harvest)
 * - dependencies.js: Dependency installation helpers
 * - utils.js: Core terminal execution helpers
 */

export * from './project.js';
export * from './github.js';
export * from './dependencies.js';
export * from './utils.js';