const { execSync } = require('child_process');

console.log('🔨 Building NestJS application...');

// Simple build using TypeScript directly
execSync('./node_modules/.bin/tsc -p tsconfig.build.json || npx typescript tsc -p tsconfig.build.json', { 
  stdio: 'inherit',
  shell: true 
});

console.log('✅ Build successful!');