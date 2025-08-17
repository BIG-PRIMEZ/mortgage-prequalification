const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔨 Building NestJS application...');

try {
  // Always use TypeScript compiler directly for production builds
  console.log('📦 Using TypeScript compiler for production build');
  
  // Ensure dist directory exists
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
  }
  
  // Use TypeScript compiler directly
  execSync('npx tsc -p tsconfig.build.json', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

console.log('✅ Build successful!');