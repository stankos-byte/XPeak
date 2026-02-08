# XPeak Production Setup Script
# This script helps you prepare for production deployment

Write-Host "🔒 XPeak Production Setup" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (Test-Path ".env") {
    Write-Host "⚠️  .env file already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it with the template? (y/n)"
    if ($overwrite -ne "y") {
        Write-Host "Skipping .env creation" -ForegroundColor Yellow
    } else {
        Copy-Item ".env.example" ".env" -Force
        Write-Host "✅ Created .env from template" -ForegroundColor Green
        Write-Host "⚠️  IMPORTANT: Edit .env and replace placeholder values with your Firebase config!" -ForegroundColor Yellow
    }
} else {
    Copy-Item ".env.example" ".env" -Force
    Write-Host "✅ Created .env from template" -ForegroundColor Green
    Write-Host "⚠️  IMPORTANT: Edit .env and replace placeholder values with your Firebase config!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Pre-Deployment Checklist:" -ForegroundColor Cyan
Write-Host ""

# Check Firebase CLI
Write-Host "1. Checking Firebase CLI..." -ForegroundColor White
try {
    $firebaseVersion = firebase --version 2>$null
    Write-Host "   ✅ Firebase CLI installed: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Firebase CLI not found!" -ForegroundColor Red
    Write-Host "   Install: npm install -g firebase-tools" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "2. Firebase Secrets Status:" -ForegroundColor White
Write-Host "   Run these commands to set your secrets:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   firebase functions:secrets:set GEMINI_API_KEY" -ForegroundColor Cyan
Write-Host "   firebase functions:secrets:set POLAR_ACCESS_TOKEN" -ForegroundColor Cyan
Write-Host "   firebase functions:secrets:set POLAR_WEBHOOK_SECRET" -ForegroundColor Cyan
Write-Host ""

Write-Host "3. Environment Variables:" -ForegroundColor White
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "VITE_USE_FIREBASE_EMULATORS=false") {
        Write-Host "   ✅ VITE_USE_FIREBASE_EMULATORS=false (correct for production)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  VITE_USE_FIREBASE_EMULATORS not set to false!" -ForegroundColor Yellow
        Write-Host "   Please edit .env and set: VITE_USE_FIREBASE_EMULATORS=false" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ .env file not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "4. Deployment Order:" -ForegroundColor White
Write-Host "   Step 1: Deploy Cloud Functions" -ForegroundColor Cyan
Write-Host "           firebase deploy --only functions" -ForegroundColor Gray
Write-Host ""
Write-Host "   Step 2: Deploy Firestore Rules" -ForegroundColor Cyan
Write-Host "           firebase deploy --only firestore:rules" -ForegroundColor Gray
Write-Host ""
Write-Host "   Step 3: Deploy Storage Rules" -ForegroundColor Cyan
Write-Host "           firebase deploy --only storage:rules" -ForegroundColor Gray
Write-Host ""
Write-Host "   Step 4: Build and Deploy Frontend" -ForegroundColor Cyan
Write-Host "           npm run build" -ForegroundColor Gray
Write-Host "           firebase deploy --only hosting" -ForegroundColor Gray
Write-Host ""

Write-Host "📄 Documentation:" -ForegroundColor Cyan
Write-Host "   • PRE_DEPLOYMENT_SECURITY_AUDIT.md - Full security report" -ForegroundColor White
Write-Host "   • DEPLOYMENT_SECURITY_CHECKLIST.md - Quick checklist" -ForegroundColor White
Write-Host "   • DEPLOYMENT_GUIDE.md - Detailed deployment guide" -ForegroundColor White
Write-Host ""

Write-Host "🎉 Ready to deploy!" -ForegroundColor Green
Write-Host ""
$deploy = Read-Host "Do you want to use the deployment script now? (y/n)"
if ($deploy -eq "y") {
    .\deploy.ps1
}
