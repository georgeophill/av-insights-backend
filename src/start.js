// src/start.js - Unified startup for all services
import { spawn } from 'node:child_process';

const services = [
  { name: 'API Server', script: 'src/api/server.js', color: '\x1b[36m' },
  { name: 'RSS Scheduler', script: 'src/scheduler.js', color: '\x1b[33m' },
  { name: 'AI Scheduler', script: 'src/aiScheduler.js', color: '\x1b[35m' },
];

const reset = '\x1b[0m';
const children = [];

console.log('\n🚀 Starting AV Insights Backend Services...\n');

services.forEach(({ name, script, color }) => {
  const child = spawn(process.execPath, [script], {
    stdio: 'pipe',
    env: process.env,
  });

  children.push(child);

  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(l => l.trim());
    lines.forEach(line => {
      console.log(`${color}[${name}]${reset} ${line}`);
    });
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().split('\n').filter(l => l.trim());
    lines.forEach(line => {
      console.error(`${color}[${name}]${reset} ❌ ${line}`);
    });
  });

  child.on('exit', (code, signal) => {
    console.log(`${color}[${name}]${reset} Exited with code ${code}, signal ${signal}`);
  });

  console.log(`${color}✓ ${name} started${reset}`);
});

// Graceful shutdown
function shutdown(signal) {
  console.log(`\n\n⚠️  Received ${signal}. Shutting down all services...\n`);
  
  children.forEach((child, i) => {
    if (child && !child.killed) {
      console.log(`Stopping ${services[i].name}...`);
      child.kill('SIGTERM');
    }
  });

  setTimeout(() => {
    console.log('✓ All services stopped. Goodbye!\n');
    process.exit(0);
  }, 2000);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

console.log('\n✨ All services running. Press Ctrl+C to stop.\n');
