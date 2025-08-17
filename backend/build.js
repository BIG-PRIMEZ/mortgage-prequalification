const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building NestJS application...');

try {
  // Always use TypeScript compiler directly for production builds
  console.log('📦 Using TypeScript compiler for production build');
  
  // Ensure dist directory exists
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
  }
  
  // Use the locally installed TypeScript compiler
  const tscPath = path.join('node_modules', '.bin', 'tsc');
  
  if (fs.existsSync(tscPath)) {
    execSync(`${tscPath} -p tsconfig.build.json`, { stdio: 'inherit' });
  } else {
    // Fallback to global tsc
    execSync('node_modules/typescript/bin/tsc -p tsconfig.build.json', { stdio: 'inherit' });
  }
  
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

console.log('✅ Build successful!');