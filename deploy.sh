#!/bin/bash

# History Around - Deployment Script for EC2
echo "🚀 Starting History Around deployment..."

# Check if we're in the right directory
if [ ! -f "Back-End/server.js" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "   (where you can see Back-End/ and Front-End/ folders)"
    exit 1
fi

echo "📦 Installing Back-End dependencies..."
cd Back-End
npm install

echo "📦 Installing Front-End dependencies..."
cd ../Front-End/history-around-web
npm install

echo "🔨 Building React application..."
npm run build

echo "📋 Copying React build to Back-End..."
cd ../../Back-End
npm run copy-build

echo "🎯 Starting server..."
echo "📱 Your app will be available at: http://your-server-ip:5000"
echo "🔧 API health check: http://your-server-ip:5000/api/health"
echo ""
echo "To run in background (daemon mode):"
echo "  npm install -g pm2"
echo "  pm2 start server.js --name history-around"
echo ""

npm start