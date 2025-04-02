#!/usr/bin/env node

/**
 * This script helps with publishing the package to npm.
 * It performs pre-publish checks and guides through the publishing process.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Helper functions
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ ${colors.reset}${msg}`),
  success: (msg) => console.log(`${colors.green}✓ ${colors.reset}${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${colors.reset}${msg}`),
  error: (msg) => console.log(`${colors.red}✗ ${colors.reset}${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.magenta}${msg}${colors.reset}\n`)
};

// Ask a question and get user input
const ask = (question) => {
  return new Promise((resolve) => {
    rl.question(`${question} `, (answer) => {
      resolve(answer.trim());
    });
  });
};

// Run a command and return its output
const run = (command, options = {}) => {
  try {
    return execSync(command, { 
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
  } catch (error) {
    if (options.ignoreError) {
      return error.stdout || '';
    }
    log.error(`Command failed: ${command}`);
    log.error(error.message);
    process.exit(1);
  }
};

// Check if git working directory is clean
const checkGitStatus = () => {
  log.info('Checking git status...');
  const status = run('git status --porcelain', { silent: true });
  
  if (status.trim() !== '') {
    log.warning('You have uncommitted changes:');
    console.log(status);
    return false;
  }
  
  log.success('Git working directory is clean');
  return true;
};

// Check if npm credentials are set up
const checkNpmCredentials = () => {
  log.info('Checking npm credentials...');
  try {
    const whoami = run('npm whoami', { silent: true }).trim();
    log.success(`Logged in to npm as: ${whoami}`);
    return true;
  } catch (error) {
    log.error('You are not logged in to npm');
    log.info('Please run `npm login` to authenticate');
    return false;
  }
};

// Run tests
const runTests = async () => {
  log.info('Running tests...');
  try {
    run('npm test');
    log.success('All tests passed');
    return true;
  } catch (error) {
    log.error('Tests failed');
    return false;
  }
};

// Build the package
const buildPackage = () => {
  log.info('Building package...');
  run('npm run build');
  log.success('Package built successfully');
  return true;
};

// Check package.json
const checkPackageJson = () => {
  log.info('Checking package.json...');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  let isValid = true;
  
  // Check required fields
  const requiredFields = ['name', 'version', 'description', 'main', 'types', 'author', 'license'];
  for (const field of requiredFields) {
    if (!packageJson[field]) {
      log.error(`Missing required field in package.json: ${field}`);
      isValid = false;
    }
  }
  
  // Check version format
  if (packageJson.version && !/^\d+\.\d+\.\d+$/.test(packageJson.version)) {
    log.error(`Invalid version format: ${packageJson.version}. Should be in format x.y.z`);
    isValid = false;
  }
  
  if (isValid) {
    log.success('package.json is valid');
  }
  
  return isValid;
};

// Publish to npm
const publishToNpm = async () => {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const version = packageJson.version;
  
  log.title(`Publishing version ${version} to npm`);
  
  const answer = await ask(`Are you sure you want to publish version ${version}? (y/n)`);
  if (answer.toLowerCase() !== 'y') {
    log.info('Publishing cancelled');
    return false;
  }
  
  try {
    log.info('Publishing to npm...');
    run('npm publish');
    log.success(`Successfully published version ${version} to npm`);
    
    // Create a git tag for this version
    log.info('Creating git tag...');
    run(`git tag -a v${version} -m "Version ${version}"`);
    run('git push --tags');
    log.success(`Created and pushed git tag v${version}`);
    
    return true;
  } catch (error) {
    log.error('Failed to publish to npm');
    return false;
  }
};

// Main function
const main = async () => {
  log.title('Personalia Node.js Library - Publish Script');
  
  // Run pre-publish checks
  const gitStatus = checkGitStatus();
  if (!gitStatus) {
    const answer = await ask('Continue despite uncommitted changes? (y/n)');
    if (answer.toLowerCase() !== 'y') {
      log.info('Publishing cancelled');
      rl.close();
      return;
    }
  }
  
  const npmCredentials = checkNpmCredentials();
  if (!npmCredentials) {
    log.info('Please run npm login and try again');
    rl.close();
    return;
  }
  
  const packageJsonValid = checkPackageJson();
  if (!packageJsonValid) {
    const answer = await ask('Continue despite package.json issues? (y/n)');
    if (answer.toLowerCase() !== 'y') {
      log.info('Publishing cancelled');
      rl.close();
      return;
    }
  }
  
  const testsPass = await runTests();
  if (!testsPass) {
    const answer = await ask('Continue despite test failures? (y/n)');
    if (answer.toLowerCase() !== 'y') {
      log.info('Publishing cancelled');
      rl.close();
      return;
    }
  }
  
  const buildSuccess = buildPackage();
  if (!buildSuccess) {
    log.error('Build failed, cannot continue');
    rl.close();
    return;
  }
  
  // Publish to npm
  await publishToNpm();
  
  rl.close();
};

// Run the main function
main().catch(error => {
  log.error('An unexpected error occurred:');
  console.error(error);
  process.exit(1);
});
