import { intro, outro, select, text, multiselect, autocompleteMultiselect, isCancel, cancel } from '@clack/prompts';


// Curated Package Catalogues


const FRONTEND_PACKAGES = [
    // Routing & Navigation
    { value: 'react-router-dom', label: 'react-router-dom', hint: 'Declarative client-side routing for React' },

    // Data Fetching & APIs
    { value: 'axios', label: 'axios', hint: 'Promise-based HTTP client for browser & node' },
    { value: '@tanstack/react-query', label: '@tanstack/react-query', hint: 'Powerful async state & cache management' },
    { value: 'swr', label: 'swr', hint: 'React Hooks library for data fetching' },

    // State Management
    { value: 'zustand', label: 'zustand', hint: 'Bearbones, fast & scalable state management' },
    { value: '@reduxjs/toolkit', label: '@reduxjs/toolkit', hint: 'Standard, opinionated toolset for Redux' },
    { value: 'react-redux', label: 'react-redux', hint: 'Official React bindings for Redux' },
    { value: 'jotai', label: 'jotai', hint: 'Primitive and flexible state management for React' },

    // UI Components & Icons
    { value: 'lucide-react', label: 'lucide-react', hint: 'Clean & consistent icon library' },
    { value: 'react-icons', label: 'react-icons', hint: 'Popular icon sets (FontAwesome, Material, etc.)' },
    { value: 'clsx', label: 'clsx', hint: 'Tiny utility for constructing className strings conditionally' },
    { value: 'tailwind-merge', label: 'tailwind-merge', hint: 'Merge Tailwind CSS classes without style conflicts' },

    // Animation & Interactive
    { value: 'framer-motion', label: 'framer-motion', hint: 'Production-ready motion & animation library' },

    // Forms & Validation
    { value: 'react-hook-form', label: 'react-hook-form', hint: 'Performant, flexible React forms with easy validation' },
    { value: 'zod', label: 'zod', hint: 'TypeScript-first schema declaration and validation' },
    { value: 'yup', label: 'yup', hint: 'Schema builder for value parsing and validation' },

    // Utilities
    { value: 'date-fns', label: 'date-fns', hint: 'Modern JavaScript date utility library' },
    { value: 'dayjs', label: 'dayjs', hint: 'Fast 2kB alternative to Moment.js' },
    { value: 'lodash', label: 'lodash', hint: 'Modern JavaScript modular utility library' },
];

const BACKEND_PACKAGES = [
    // Web Framework & Middleware
    { value: 'express', label: 'express', hint: 'Fast, unopinionated web framework for Node.js' },
    { value: 'cors', label: 'cors', hint: 'Middleware to enable Cross-Origin Resource Sharing' },
    { value: 'dotenv', label: 'dotenv', hint: 'Zero-dependency module that loads .env variables' },
    { value: 'morgan', label: 'morgan', hint: 'HTTP request logger middleware for Node.js' },
    { value: 'helmet', label: 'helmet', hint: 'Secures Express apps by setting HTTP response headers' },
    { value: 'cookie-parser', label: 'cookie-parser', hint: 'Parse Cookie header and populate req.cookies' },

    // Authentication & Security
    { value: 'jsonwebtoken', label: 'jsonwebtoken', hint: 'JSON Web Token implementation for authentication' },
    { value: 'bcryptjs', label: 'bcryptjs', hint: 'Optimized bcrypt in plain JavaScript for hashing' },
    { value: 'express-rate-limit', label: 'express-rate-limit', hint: 'Basic rate-limiting middleware for Express' },

    // Database & ORM
    { value: 'mongoose', label: 'mongoose', hint: 'MongoDB object modeling tool for Node.js' },
    { value: 'prisma', label: 'prisma', hint: 'Next-generation ORM CLI for Node.js & TypeScript' },
    { value: '@prisma/client', label: '@prisma/client', hint: 'Auto-generated & type-safe Prisma database client' },
    { value: 'pg', label: 'pg', hint: 'Non-blocking PostgreSQL client for Node.js' },
    { value: 'mysql2', label: 'mysql2', hint: 'Fast MySQL client with Promise support' },

    // File Upload & Media
    { value: 'multer', label: 'multer', hint: 'Node.js middleware for handling multipart/form-data' },
    { value: 'cloudinary', label: 'cloudinary', hint: 'Cloudinary SDK for cloud image & video management' },

    // Validation & Data
    { value: 'zod', label: 'zod', hint: 'TypeScript-first schema validation' },
    { value: 'joi', label: 'joi', hint: 'Powerful schema description language & data validator' },
    { value: 'validator', label: 'validator', hint: 'String validation and sanitization library' },

    // Utilities
    { value: 'uuid', label: 'uuid', hint: 'Generate RFC4122 UUIDs' },
    { value: 'axios', label: 'axios', hint: 'Promise-based HTTP client for external API requests' },
    { value: 'lodash', label: 'lodash', hint: 'Modular JavaScript utility functions' },
];


// Interactive Prompts


async function askQuestion() {
    intro(`Starting Setup`);

    const projectType = await select({
        message: 'Pick a project type.',
        options: [
            { value: 'ts', label: 'TypeScript' },
            { value: 'js', label: 'JavaScript' },
        ],
    });

    if (isCancel(projectType)) {
        cancel('Operation cancelled.');
        process.exit(0);
    }

    outro(`You chose ${projectType}. Setup complete!`);
    return projectType;
}

async function projectOptions() {
    const projectType = await select({
        message: 'Pick a project type.',
        options: [
            { value: 'front', label: 'FrontEnd' },
            { value: 'back', label: 'BackEnd' },
            { value: 'frontandback', label: 'FrontEnd and BackEnd' },
        ],
    });

    if (isCancel(projectType)) {
        cancel('Operation cancelled.');
        process.exit(0);
    }

    outro(`You chose ${projectType}. Setup complete!`);
    return projectType;
}

/**
 * Search and select dependencies with live filtering as you type.
 * Filtered results dynamically show below for selection.
 * @param {Array<{value: string, label: string, hint?: string}>} packageList
 * @param {string} message
 * @returns {Promise<string[]>}
 */
async function searchAndSelectDependencies(packageList = [], message = 'Search & select dependencies:') {
    try {
        if (typeof autocompleteMultiselect === 'function') {
            const selected = await autocompleteMultiselect({
                message,
                placeholder: 'Type to filter packages (Space/Tab to toggle, Enter to confirm)...',
                options: packageList,
                maxItems: 8,
                required: false,
            });

            if (isCancel(selected)) {
                cancel('Dependency selection cancelled.');
                return [];
            }

            return selected || [];
        }
    } catch {
        // Fallback to standard multiselect if autocomplete prompt is not supported
    }

    const selected = await multiselect({
        message,
        options: packageList,
        required: false,
    });

    if (isCancel(selected)) {
        cancel('Dependency selection cancelled.');
        return [];
    }

    return selected || [];
}

/**
 * Prompts the user to type multiple dependency names (space or comma separated)
 * @param {string} message - Custom prompt message
 * @returns {Promise<string[]>} Array of package names
 */
async function typeDependencies(message = 'Enter dependencies to install (space or comma separated):') {
    const inputPackages = await text({
        message,
        placeholder: 'e.g. axios lodash express zod',
        validate(value) {
            if (!value || value.trim().length === 0) {
                return 'Please enter at least one dependency name or press Ctrl+C to cancel.';
            }
        },
    });

    if (isCancel(inputPackages)) {
        cancel('Dependency selection cancelled.');
        return [];
    }

    return inputPackages
        .split(/[\s,]+/)
        .map(pkg => pkg.trim())
        .filter(pkg => pkg.length > 0);
}

/**
 * Standard multiselect for dependencies
 * @param {string} message
 * @param {Array} options
 * @returns {Promise<string[]>}
 */
async function selectDependencies(message = 'Select dependencies to install (Space to toggle, Enter to confirm):', options = null) {
    const list = options || [...FRONTEND_PACKAGES, ...BACKEND_PACKAGES];
    return searchAndSelectDependencies(list, message);
}

/**
 * Search and select specifically for FrontEnd packages
 */
async function selectFrontendDependencies(message = ' Search & Select FrontEnd Dependencies:') {
    return searchAndSelectDependencies(FRONTEND_PACKAGES, message);
}

/**
 * Search and select specifically for BackEnd packages
 */
async function selectBackendDependencies(message = ' Search & Select BackEnd Dependencies:') {
    return searchAndSelectDependencies(BACKEND_PACKAGES, message);
}

/**
 * Interactive workflow specifically for FrontEnd dependencies
 */
async function promptFrontendDependencies() {
    const method = await select({
        message: 'How would you like to install FrontEnd dependencies?',
        options: [
            { value: 'search', label: ' Search & select popular FrontEnd packages', hint: 'Live filter as you type' },
            { value: 'type', label: '  Type custom package names', hint: 'Space or comma separated' },
            { value: 'both', label: ' Both (Search list + type additional custom)', hint: 'Best of both' },
        ],
    });

    if (isCancel(method)) {
        cancel('Operation cancelled.');
        return [];
    }

    let allDependencies = [];

    if (method === 'search') {
        allDependencies = await selectFrontendDependencies();
    } else if (method === 'type') {
        allDependencies = await typeDependencies('Enter FrontEnd dependencies to install:');
    } else if (method === 'both') {
        const selectedList = await selectFrontendDependencies();
        const typedList = await typeDependencies('Enter any additional FrontEnd dependencies:');
        allDependencies = Array.from(new Set([...selectedList, ...typedList]));
    }

    if (allDependencies.length > 0) {
        outro(`Selected ${allDependencies.length} FrontEnd package(s): ${allDependencies.join(', ')}`);
    } else {
        outro('No dependencies selected.');
    }

    return allDependencies;
}

/**
 * Interactive workflow specifically for BackEnd dependencies
 */
async function promptBackendDependencies() {
    const method = await select({
        message: 'How would you like to install BackEnd dependencies?',
        options: [
            { value: 'search', label: ' Search & select popular BackEnd packages', hint: 'Live filter as you type' },
            { value: 'type', label: '  Type custom package names', hint: 'Space or comma separated' },
            { value: 'both', label: ' Both (Search list + type additional custom)', hint: 'Best of both' },
        ],
    });

    if (isCancel(method)) {
        cancel('Operation cancelled.');
        return [];
    }

    let allDependencies = [];

    if (method === 'search') {
        allDependencies = await selectBackendDependencies();
    } else if (method === 'type') {
        allDependencies = await typeDependencies('Enter BackEnd dependencies to install:');
    } else if (method === 'both') {
        const selectedList = await selectBackendDependencies();
        const typedList = await typeDependencies('Enter any additional BackEnd dependencies:');
        allDependencies = Array.from(new Set([...selectedList, ...typedList]));
    }

    if (allDependencies.length > 0) {
        outro(`Selected ${allDependencies.length} BackEnd package(s): ${allDependencies.join(', ')}`);
    } else {
        outro('No dependencies selected.');
    }

    return allDependencies;
}

/**
 * General dependency prompt. If targetType is 'frontend' or 'backend', runs that flow directly.
 * Otherwise, asks whether the user is installing for FrontEnd, BackEnd, or custom packages.
 * @param {'all'|'frontend'|'backend'} targetType
 * @returns {Promise<string[]>}
 */
async function promptDependencies(targetType = 'all') {
    if (targetType === 'frontend' || targetType === 'front') {
        return promptFrontendDependencies();
    }
    if (targetType === 'backend' || targetType === 'back') {
        return promptBackendDependencies();
    }

    // Ask user what type of project they are targeting
    const category = await select({
        message: 'What type of dependencies do you want to install?',
        options: [
            { value: 'frontend', label: ' FrontEnd Dependencies', hint: 'React, router, state, icons, styling' },
            { value: 'backend', label: '  BackEnd Dependencies', hint: 'Express, auth, DB, validation, utilities' },
            { value: 'custom', label: '  Custom Package Names', hint: 'Type any npm package directly' },
        ],
    });

    if (isCancel(category)) {
        cancel('Operation cancelled.');
        return [];
    }

    if (category === 'frontend') {
        return promptFrontendDependencies();
    } else if (category === 'backend') {
        return promptBackendDependencies();
    } else {
        const typed = await typeDependencies();
        if (typed.length > 0) {
            outro(`Selected ${typed.length} package(s): ${typed.join(', ')}`);
        }
        return typed;
    }
}

export {
    FRONTEND_PACKAGES,
    BACKEND_PACKAGES,
    askQuestion,
    projectOptions,
    searchAndSelectDependencies,
    typeDependencies,
    selectDependencies,
    selectFrontendDependencies,
    selectBackendDependencies,
    promptFrontendDependencies,
    promptBackendDependencies,
    promptDependencies,
};