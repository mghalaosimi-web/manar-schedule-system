const { execSync } = require('child_process');

// Set the production API URL environment variable for Vite
process.env.VITE_API_URL = 'https://manar-schedule-system.onrender.com/api';

console.log(`[BUILD] Injected environment variable VITE_API_URL=${process.env.VITE_API_URL}`);
console.log('[BUILD] Starting frontend build...');

try {
  execSync('cd frontend && npm install --include=dev && npm run build', { stdio: 'inherit' });
  console.log('[BUILD] Frontend build completed successfully.');
} catch (error) {
  console.error('[BUILD] Frontend build failed:', error.message);
  process.exit(1);
}
