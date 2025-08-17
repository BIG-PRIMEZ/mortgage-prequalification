const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building NestJS application...');

try {
  console.log('📦 Using TypeScript compiler for production build');
  
  // Debug: Check if TypeScript is installed
  console.log('🔍 Checking TypeScript installation...');
  try {
    const tsVersion = execSync('npx --no-install typescript --version', { encoding: 'utf8' }).trim();
    console.log(`✅ TypeScript found: ${tsVersion}`);
  } catch (e) {
    console.log('❌ TypeScript not found in node_modules');
  }
  
  // Ensure dist directory exists
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
  }
  
  // Use npx with --no-install flag to use local typescript
  console.log('🏗️  Compiling TypeScript files...');
  execSync('npx --no-install typescript tsc -p tsconfig.build.json', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}