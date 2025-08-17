#!/bin/bash
echo "🔨 Starting Render build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run TypeScript build
echo "🏗️  Building TypeScript..."
./node_modules/typescript/bin/tsc -p tsconfig.build.json

echo "✅ Build complete!"