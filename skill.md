# CYHI Tool Skill

This skill provides guidance on using the CYHI (Can You Hack It?) CLI tool efficiently to minimize token usage when performing development workflow tasks.

## When to Use This Skill
Use this skill when you need to:
- Set up new projects (frontend, backend, or full-stack)
- Initialize Git repositories
- Manage dependencies
- Deploy to Vercel
- Monitor GitHub repositories
- Perform Git operations like rebasing, committing, or synchronizing forks

## Core Commands Overview

### Project Setup
```bash
# Create project structure
hackme44 project <name> [-f|-b|--fb] [-p <path>]

# Initialize Git repo
hackme44 init-repo <name> <repo_url> [-p <path>]
```

### Development Workflow
```bash
# Install dependencies
hackme44 add [packages...] [-d] [-p <path>]

# Start development (after cd'ing to project)
# Frontend: npm run dev (in FrontEnd/)
# Backend: npm run dev (in BackEnd/)
```

### Deployment
```bash
# Deploy to Vercel
hackme44 vercel [name] [-p <path>] [-f|-b] [--prod]
```

### GitHub Operations
```bash
# Watch for new commits
hackme44 watch-commits <repo_url> [-b <branch>] [-i <minutes>] [-t <token>]

# Synchronize fork
hackme44 sync-fork <fork_url> [upstream_url] [-b <branch>] [-w] [-i <minutes>] [-t <token>]

# Harvest commits between branches
hackme44 harvest <sourceBranch> [start] [end] [-t <targetBranch>] [-s <start>] [-e <end>]

# Interactive rebase (edit commits)
hackme44 rev [branch] [-c <commits>] [-p]
```

## Token Optimization Strategies

### 1. Chain Operations Efficiently
Instead of multiple separate interactions, chain related operations:
```bash
# Good: Single interaction for project setup
hackme44 project myapp --frontandback
hackme44 init-repo myapp https://github.com/team/myapp.git
cd myapp
# Then install deps in each directory as needed
```

### 2. Use Defaults and Flags Effectively
```bash
# Instead of specifying everything explicitly, use defaults
hackme44 project myapp --frontandback  # Uses current directory by default

# Combine related flags
hackme44 vercel myapp --frontandback --prod  # Deploys both to prod
```

### 3. Batch Dependency Installation
```bash
# Install multiple deps in one command instead of separate interactions
hackme44 add express mongoose zod bcryptjs  # Better than 4 separate calls
```

### 4. Leverage Interactive Prompts Wisely
For dependency installation, use the interactive selector when you're unsure of exact package names, but use manual specification when you know what you need:
```bash
# When you know exact packages:
hackme44 add react react-dom  # Faster than interactive selection

# When exploring options:
hackme44 add  # Then use interactive selector
```

### 5. Minimize Verbose Output Parsing
When scripting or automating, use quiet flags where available (though CYHI doesn't have many, focus on getting only needed information).

## Common Workflows

### Full Stack Hackathon Setup (Optimized for Tokens)
```bash
# 1. Create project structure
hackme44 project hackathon-project --frontandback

# 2. Initialize repository
hackme44 init-repo hackathon-project https://github.com/team/hackathon-project.git

# 3. Install frontend dependencies
cd hackathon-project/FrontEnd
hackme44 add axios @tanstack/react-query lodash

# 4. Install backend dependencies  
cd ../BackEnd
hackme44 add express cors dotenv mongoose jsonwebtoken bcryptjs

# 5. Deploy initial version
cd ..
hackme44 vercel hackathon-project --frontandback
```

### GitHub Repository Monitoring Setup
```bash
# Set up efficient monitoring with reasonable intervals
hackme44 watch-commits https://github.com/company/main.git --token $GITHUB_TOKEN --interval 15

# For forks, use watching sync to reduce manual intervention
hackme44 sync-fork https://github.com/yourname/fork.git --watch --interval 20
```

## Best Practices for Minimal Token Usage

1. **Read the tool's help once**: `hackme44 --help` provides all command references
2. **Use command-specific help**: `hackme44 <command> --help` for detailed options
3. **Remember common patterns**: Most commands follow similar option patterns (-p for path, -f/-b for frontend/backend)
4. **Leverage tab completion**: If your shell supports it, use tab completion for faster command entry
5. **Plan before executing**: Think through the full workflow before starting to reduce back-and-forth

## Error Reduction Tips

1. **Verify paths**: Use absolute paths with `-p` when working outside current directory
2. **Check environment**: Ensure `GITHUB_TOKEN` is set for GitHub operations
3. **Validate repositories**: Double-check repo URLs before initialization
4. **Start small**: Test with minimal commands first when learning new operations

## When Not to Use This Skill
- For complex custom build configurations (modify generated files directly)
- When needing fine-grained control over tool configurations beyond what CYHI provides
- For languages/frameworks not supported by the standard templates (React/Vite frontend, Node.js/Express backend)

This skill enables efficient use of the CYHI tool by providing optimized command patterns, reducing the need for multiple back-and-forth interactions, and helping agents accomplish development tasks with minimal token expenditure.