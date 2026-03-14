#!/usr/bin/env node

/**
 * Backend Switcher Script
 * Helps switch frontend between Express and Python backends
 */

const fs = require('fs');
const path = require('path');

const ENV_LOCAL_PATH = path.join(__dirname, '..', 'frontend', '.env.local');
const ENV_EXAMPLE_PATH = path.join(__dirname, '..', 'frontend', '.env.local.example');

const EXPRESS_CONFIG = {
  name: 'Express.js Backend',
  port: 5000,
  url: 'http://localhost:5000',
};

const PYTHON_CONFIG = {
  name: 'Python FastAPI Backend',
  port: 8000,
  url: 'http://localhost:8000',
};

function readEnvFile() {
  if (!fs.existsSync(ENV_LOCAL_PATH)) {
    console.log('⚠️  .env.local not found. Creating from example...');
    
    if (fs.existsSync(ENV_EXAMPLE_PATH)) {
      const content = fs.readFileSync(ENV_EXAMPLE_PATH, 'utf8');
      fs.writeFileSync(ENV_LOCAL_PATH, content);
      console.log('✅ Created .env.local from example');
    } else {
      console.log('❌ .env.local.example not found. Please create .env.local manually');
      process.exit(1);
    }
  }
  
  return fs.readFileSync(ENV_LOCAL_PATH, 'utf8');
}

function writeEnvFile(content) {
  fs.writeFileSync(ENV_LOCAL_PATH, content);
  console.log('✅ Updated .env.local');
}

function getCurrentBackend() {
  const content = readEnvFile();
  const match = content.match(/NEXT_PUBLIC_API_BASE_URL=http:\/\/localhost:(\d+)/);
  
  if (match) {
    const port = parseInt(match[1]);
    return port === 5000 ? EXPRESS_CONFIG : port === 8000 ? PYTHON_CONFIG : { name: 'Unknown Backend', port };
  }
  
  return null;
}

function switchBackend(target) {
  let content = readEnvFile();
  
  const config = target === 'express' ? EXPRESS_CONFIG : PYTHON_CONFIG;
  const newUrl = `NEXT_PUBLIC_API_BASE_URL=${config.url}`;
  
  // Replace existing URL
  if (content.includes('NEXT_PUBLIC_API_BASE_URL=')) {
    content = content.replace(
      /NEXT_PUBLIC_API_BASE_URL=http:\/\/localhost:\d+/,
      newUrl
    );
  } else {
    // Add if not present
    content = `# Backend Configuration\n${newUrl}\n\n${content}`;
  }
  
  writeEnvFile(content);
  
  console.log(`\n✅ Switched to ${config.name}`);
  console.log(`📍 Backend URL: ${config.url}`);
  console.log(`📍 Port: ${config.port}`);
  console.log('\n⚠️  Restart your frontend for changes to take effect:');
  console.log('   cd frontend && npm run dev\n');
}

function showHelp() {
  console.log(`
Backend Switcher for SMART AI Teacher

Usage:
  node switch-backend.js [command]

Commands:
  express    Switch to Express.js backend (port 5000)
  python     Switch to Python FastAPI backend (port 8000)
  status     Show current backend configuration
  help       Show this help message

Examples:
  node switch-backend.js express
  node switch-backend.js python
  node switch-backend.js status

Without arguments, shows current backend status.
`);
}

// Main
const command = process.argv[2];

if (!command || command === 'status') {
  const current = getCurrentBackend();
  
  if (current) {
    console.log('\n📊 Current Backend Configuration:');
    console.log(`   Name: ${current.name}`);
    console.log(`   URL: ${current.url}`);
    console.log(`   Port: ${current.port}`);
    console.log('\n💡 To switch backends:');
    console.log('   node switch-backend.js express');
    console.log('   node switch-backend.js python\n');
  } else {
    console.log('⚠️  Could not determine current backend');
    console.log('   Check frontend/.env.local file\n');
  }
} else if (command === 'express') {
  switchBackend('express');
} else if (command === 'python') {
  switchBackend('python');
} else if (command === 'help' || command === '--help' || command === '-h') {
  showHelp();
} else {
  console.log(`❌ Unknown command: ${command}\n`);
  showHelp();
  process.exit(1);
}
