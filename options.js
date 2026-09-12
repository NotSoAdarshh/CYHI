import { intro, outro, select, text, multiselect, isCancel, cancel } from '@clack/prompts';

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
 * Prompts the user to type multiple dependency names (space or comma separated)
 * @param {string} message - Custom prompt message
 * @returns {Promise<string[]>} Array of package names
 */
async function typeDependencies(message = 'Enter dependencies to install (space or comma separated):') {
    const inputPackages = await text({
        message,
        placeholder: 'e.g. axios lodash express zod @tanstack/react-query',
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

    // Split by whitespace or commas, trim and remove empty tokens
    const parsedPackages = inputPackages
        .split(/[\s,]+/)
        .map(pkg => pkg.trim())
        .filter(pkg => pkg.length > 0);

    return parsedPackages;
}

/**
 * Allows the user to pick multiple dependencies from a curated list using multiselect checkboxes
 * @param {string} message - Custom prompt message
 * @returns {Promise<string[]>} Array of selected package names
 */
async function selectDependencies(message = 'Select dependencies to install (Space to toggle, Enter to confirm):') {
    const selected = await multiselect({
        message,
        options: [
            // HTTP & API
            { value: 'axios', label: 'axios', hint: 'Promise-based HTTP client' },
            { value: 'ky', label: 'ky', hint: 'Tiny & elegant HTTP client' },
            { value: 'swr', label: 'swr', hint: 'React Hooks for data fetching' },
            { value: '@tanstack/react-query', label: '@tanstack/react-query', hint: 'Async state manager' },

            // Backend & Utilities
            { value: 'express', label: 'express', hint: 'Fast, unopinionated web framework' },
            { value: 'cors', label: 'cors', hint: 'Node.js CORS middleware' },
            { value: 'dotenv', label: 'dotenv', hint: 'Loads environment variables from .env' },
            { value: 'jsonwebtoken', label: 'jsonwebtoken', hint: 'JWT token generator & verifier' },
            { value: 'bcryptjs', label: 'bcryptjs', hint: 'Password hashing library' },
            { value: 'mongoose', label: 'mongoose', hint: 'MongoDB object modeling tool' },
            { value: 'prisma', label: 'prisma', hint: 'Next-gen ORM for Node.js & TypeScript' },

            // Data Validation & State
            { value: 'zod', label: 'zod', hint: 'TypeScript-first schema validation' },
            { value: 'zustand', label: 'zustand', hint: 'Small, fast state management' },
            { value: '@reduxjs/toolkit', label: '@reduxjs/toolkit', hint: 'Standard Redux toolset' },
            { value: 'lodash', label: 'lodash', hint: 'Modern JavaScript utility library' },

            // UI & Styling
            { value: 'lucide-react', label: 'lucide-react', hint: 'Beautiful & consistent icons' },
            { value: 'clsx', label: 'clsx', hint: 'Utility for constructing className strings' },
            { value: 'tailwind-merge', label: 'tailwind-merge', hint: 'Merge Tailwind CSS classes cleanly' },
            { value: 'framer-motion', label: 'framer-motion', hint: 'Production-ready motion library' },
        ],
        required: false,
    });

    if (isCancel(selected)) {
        cancel('Dependency selection cancelled.');
        return [];
    }

    return selected;
}

/**
 * Interactive menu to either type custom packages, choose from multiselect list, or both
 * @returns {Promise<string[]>} Combined array of packages to install
 */
async function promptDependencies() {
    const method = await select({
        message: 'How would you like to specify dependencies?',
        options: [
            { value: 'type', label: 'Type dependencies manually', hint: 'Enter space or comma separated package names' },
            { value: 'select', label: 'Select from popular packages list', hint: 'Use checkboxes to select multiple' },
            { value: 'both', label: 'Both (Select from list + type custom)', hint: 'Pick common ones and type extra' },
        ],
    });

    if (isCancel(method)) {
        cancel('Operation cancelled.');
        return [];
    }

    let allDependencies = [];

    if (method === 'type') {
        allDependencies = await typeDependencies();
    } else if (method === 'select') {
        allDependencies = await selectDependencies();
    } else if (method === 'both') {
        const selectedList = await selectDependencies();
        const typedList = await typeDependencies('Enter any additional dependencies to install:');
        allDependencies = Array.from(new Set([...selectedList, ...typedList]));
    }

    if (allDependencies.length > 0) {
        outro(`Selected ${allDependencies.length} package(s): ${allDependencies.join(', ')}`);
    } else {
        outro('No dependencies selected.');
    }

    return allDependencies;
}

export {
    askQuestion,
    projectOptions,
    typeDependencies,
    selectDependencies,
    promptDependencies
};