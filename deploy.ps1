# XPeak Deployment Script for Windows PowerShell
# This script handles the full deployment process

Write-Host "🚀 XPeak Deployment Script" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Warning: .env file not found!" -ForegroundColor Yellow
    Write-Host "   Copy .env.example to .env and fill in your credentials" -ForegroundColor Yellow
    Write-Host ""
}

# Ask what to deploy
Write-Host "What would you like to deploy?" -ForegroundColor Green
Write-Host "1. Frontend only (hosting)" -ForegroundColor White
Write-Host "2. Backend only (functions)" -ForegroundColor White
Write-Host "3. Full deployment (hosting + functions + rules)" -ForegroundColor White
Write-Host "4. Firestore rules only" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

Write-Host ""

switch ($choice) {
    "1" {
        Write-Host "🧹 Cleaning old build..." -ForegroundColor Yellow
        if (Test-Path "dist") {
            Remove-Item -Recurse -Force "dist"
            Write-Host "✅ Old build cleaned" -ForegroundColor Green
        }
        Write-Host "📦 Building frontend..." -ForegroundColor Cyan
        npm run build
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Build successful!" -ForegroundColor Green
            Write-Host "🚀 Deploying to Firebase Hosting..." -ForegroundColor Cyan
            firebase deploy --only hosting
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Frontend deployed successfully!" -ForegroundColor Green
            }
        } else {
            Write-Host "❌ Build failed!" -ForegroundColor Red
            exit 1
        }
    }
    "2" {
        Write-Host "🔧 Deploying Cloud Functions..." -ForegroundColor Cyan
        firebase deploy --only functions
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Functions deployed successfully!" -ForegroundColor Green
        }
    }
    "3" {
        Write-Host "🧹 Cleaning old build..." -ForegroundColor Yellow
        if (Test-Path "dist") {
            Remove-Item -Recurse -Force "dist"
            Write-Host "✅ Old build cleaned" -ForegroundColor Green
        }
        Write-Host "📦 Building frontend..." -ForegroundColor Cyan
        npm run build
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Build successful!" -ForegroundColor Green
            Write-Host "🚀 Deploying everything to Firebase..." -ForegroundColor Cyan
            firebase deploy
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Full deployment successful!" -ForegroundColor Green
            }
        } else {
            Write-Host "❌ Build failed!" -ForegroundColor Red
            exit 1
        }
    }
    "4" {
        Write-Host "🔒 Deploying Firestore rules..." -ForegroundColor Cyan
        firebase deploy --only firestore:rules
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Firestore rules deployed successfully!" -ForegroundColor Green
        }
    }
    default {
        Write-Host "❌ Invalid choice!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🎉 Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Your app: https://xpeak-prod-25154.web.app" -ForegroundColor Cyan
Write-Host ""
