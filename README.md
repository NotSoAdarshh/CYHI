#  HackMe44 

A unified Command Line Interface (CLI) built with Commander.js to streamline end to end development workflows from intializing project to deploying it for rapid development.

## Table of Contents
- [Installation](#installation)
- [Getting Started](#getting-started)
- [Core Features](#core-features)
- [Command Reference](#command-reference)
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

Access the help system at any time:
```bash
hackme44 --help
# Or for a specific command:
hackme44 <command> --help
```

<a id="core-features"></a>
##  Core Features

*   **Project Initialization:**
*   Quickly generate standardized frontend (React/Vite), backend (Node.js/Express), or full-stack project structures with automated Tailwind CSS         configurations with just one command 
*   **Git Repository Management:**
*   Intialize repo and create a GitHub repo with a single command within the terminal.
*   **Dependency Management:**
*   Choose the dependencies to install by using the search bar or drop-down menu
*   **GitHub Integration:**
*   Monitor remote repositories for new commits by notifications in the terminal , synchronize forks automatically , and           harvest commits       across branches.
*   **Advanced Git Operations:**
*   Perform interactive rebases to sanitize commit histories and manage cross-branch synchronization.
*    **Vercel Deployment:**
*    Execute one-click deployments for frontend, backend, or full-stack environments through one command. 

<a id="command-reference"></a>
##  Command Reference

### Basic Commands

| Command | Description | Example |
| :--- | :--- | :--- |
| `greet` | Simple greeting user test | `hackme44 greet <name>` |
| `project` | Intialize a new Project (FronEnd / BackEnd / FrontEnd + BackEnd | `hackme44 project <name>` |
| `init-repo` | Initialize Git and connect to remote and push the code | `hackme44 init-repo <name>` |
| `vercel` | Deploy directly to Vercel | `hackme44 vercel [name] ` |

### Dependency & Integration Commands

| Command | Description | Example |
| :--- | :--- | :--- |
| `add` | Install packages (interactive or manual) | `hackme44 add [packages...] [--dev]` |
| `watch-commits` | Monitor a GitHub repository for changes | `hackme44 watch-commits <repo_url>` |
| `rev` | Reverse or modify a previous commit | `hackme44 rev [branch] [--commits-back <count>]` |
| `harvest` | Move commits between branches | `hackme44 harvest <sourceBranch> [start] [end]` |
| `sync-fork` | Sync a fork with upstream | `hackme44 sync-fork <fork_url> [upstream_url] [--watch]` |

<a id="use-cases"></a>

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
