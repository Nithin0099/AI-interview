#!/bin/bash

# AI Interview Platform - Installation Script

echo "🚀 Installing AI Interview Platform"
echo "===================================="
echo ""

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install
cd ..

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install
cd ..

echo ""
echo "✅ Installation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env files:"
echo "   - server/.env (MongoDB URI, JWT Secret)"
echo "   - client/.env (API URL)"
echo ""
echo "2. Start MongoDB locally:"
echo "   mongod"
echo ""
echo "3. Run development servers:"
echo "   npm run dev"
echo ""
echo "📚 Documentation:"
echo "- Main: README.md"
echo "- Quick Start: QUICKSTART.md"
echo "- Server: server/README.md"
echo "- Client: client/README.md"
