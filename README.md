#  HackMe44 

>  Built for the 24-Hour "Can You Hack It?" (CYHI) Hackathon
> A powerful, unified Command Line Interface (CLI) built with Commander.js to streamline project setup, version control operations, and deployment workflows for rapid hackathon development. 

## Table of Contents
- [Installation](#installation)
- [Getting Started](#getting-started)
- [Core Features](#core-features)
- [Command Reference](#command-reference)
- [Use Cases](#use-cases)
- [Examples](#examples)
- [Configuration](#configuration)
- [Project Structure](#project-structure)

<a id="installation"></a>
##  Installation

**Prerequisites:** Node.js (v16+), npm, and Git.

**Global Installation**
```bash
npm install -g .
# Or from the project directory:
npm link
```

**Local Usage**
```bash
npx hackme44 <command>
```

<a id="getting-started"></a>
##  Getting Started

Verify the tool is active:
```bash
hackme44 --version
```

Access the help system at any time:
```bash
hackme44 --help
# Or for a specific command:
hackme44 <command> --help
```

<a id="core-features"></a>
##  Core Features

*   **Project Initialization:** Quickly generate standardized frontend (React/Vite), backend (Node.js/Express), or full-stack project structures with automated Tailwind CSS configurations.
*   **Git Repository Management:** Initialize repositories, connect remotes, and manage branches natively.
*   **Dependency Management:** Interactively select or manually inject standard and development dependencies.
*   **Vercel Deployment:** Execute one-click deployments for frontend, backend, or full-stack environments. 
*   **GitHub Integration:** Monitor remote repositories, synchronize forks, and harvest commits across branches.
*   **Advanced Git Operations:** Perform interactive rebases to sanitize commit histories and manage cross-branch synchronization.

<a id="command-reference"></a>
##  Command Reference

### Basic Commands

| Command | Description | Example |
| :--- | :--- | :--- |
| `greet` | Simple connection test | `hackme44 greet <name> [--uppercase]` |
| `project` | Create new project architectures | `hackme44 project <name> [--front] [--back] [--frontandback]` |
| `init-repo` | Initialize Git and connect to remote | `hackme44 init-repo <name> <repo_url> [--path <targetPath>]` |
| `vercel` | Deploy directly to Vercel | `hackme44 vercel [name] [--frontandback] [--prod]` |

### Dependency & Integration Commands

| Command | Description | Example |
| :--- | :--- | :--- |
| `add` | Install packages (interactive or manual) | `hackme44 add [packages...] [--dev]` |
| `watch-commits` | Monitor a GitHub repository for changes | `hackme44 watch-commits <repo_url> [--token <token>]` |
| `rev` | Reverse or modify a previous commit | `hackme44 rev [branch] [--commits-back <count>]` |
| `harvest` | Move commits between branches | `hackme44 harvest <sourceBranch> [start] [end]` |
| `sync-fork` | Sync a fork with upstream | `hackme44 sync-fork <fork_url> [upstream_url] [--watch]` |

<a id="use-cases"></a>
##  Use Cases

*   **Hackathon Scaffolding:** Skip the boilerplate. Spin up an entire full-stack directory and initialize a remote repository in seconds.
*   **Team Standardization:** Ensure every hackathon team member operates within identical directory structures and dependency trees.
*   **Commit History Sanitization:** Clean up messy, late-night hackathon commits before submitting the project repository to judges. 

<a id="examples"></a>
##  Examples

### 1. Full Stack Hackathon Bootstrap
```bash
# Initialize full-stack project
hackme44 project my-awesome-app --frontandback
cd my-awesome-app

# Install frontend dependencies
cd FrontEnd
hackme44 add axios @tanstack/react-query lodash
cd ..

# Install backend dependencies
cd BackEnd
hackme44 add cors dotenv jsonwebtoken bcryptjs mongoose
cd ..

# Initialize Git & Deploy
hackme44 init-repo my-awesome-app [https://github.com/team/my-awesome-app.git](https://github.com/team/my-awesome-app.git)
hackme44 vercel my-awesome-app --frontandback --prod
```

### 2. Cross-Branch Commit Harvesting
```bash
# Harvest commits 2-4 from feature branch to main
hackme44 harvest feature 2 4 --target-branch main
```

<a id="configuration"></a>
##  Configuration

Set up environments using a `.env` file in your working directory:
```env
GITHUB_TOKEN=ghp_your_token_here
```

<a id="project-structure"></a>
##  Project Structure

**Full-Stack Output Example:**
```text
project-name/
├── FrontEnd/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── BackEnd/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   └── routes/
│   ├── index.js
│   └── package.json
├── .gitignore
└── README.md
```
