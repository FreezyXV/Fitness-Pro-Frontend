#!/bin/bash

# Vercel Deployment Script for Fitness Pro Frontend
# Repository: https://github.com/FreezyXV/Fitness-Pro-Frontend.git

set -e

echo "🚀 Starting Vercel deployment for Fitness Pro Frontend..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ vercel.json not found. Make sure you're in the frontend directory."
    exit 1
fi

# Check if we're logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel first:"
    vercel login
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the project
echo "🔧 Building the project..."
npm run build:vercel

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
if [ "$1" = "production" ] || [ "$1" = "prod" ]; then
    echo "🌟 Deploying to production..."
    vercel --prod
else
    echo "🧪 Deploying to preview..."
    vercel
fi

echo ""
echo "✅ Deployment completed!"
echo "🌐 Your frontend should be available on Vercel"
echo ""
echo "📝 Next steps:"
echo "  1. Update your backend CORS settings to allow your Vercel domain"
echo "  2. Configure your custom domain in Vercel (if needed)"
echo "  3. Test the frontend-backend connection"
echo ""
echo "🔗 GitHub Repository: https://github.com/FreezyXV/Fitness-Pro-Frontend.git"