# Script to setup git repository and create first commit
# This script will find git and execute the necessary commands

$ErrorActionPreference = "Stop"

# Function to find git executable
function Find-Git {
    $possiblePaths = @(
        "git",  # Try direct command first
        "C:\Program Files\Git\cmd\git.exe",
        "C:\Program Files (x86)\Git\cmd\git.exe",
        "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe",
        "$env:ProgramFiles\Git\cmd\git.exe",
        "$env:ProgramFiles\Git\bin\git.exe"
    )
    
    foreach ($path in $possiblePaths) {
        try {
            if ($path -eq "git") {
                $result = Get-Command git -ErrorAction SilentlyContinue
                if ($result) { return $result.Source }
            } else {
                if (Test-Path $path) {
                    return $path
                }
            }
        } catch {
            continue
        }
    }
    
    throw "Git not found. Please install Git or add it to your PATH."
}

# Find git
Write-Host "Looking for Git..." -ForegroundColor Yellow
$gitExe = Find-Git
Write-Host "Found Git at: $gitExe" -ForegroundColor Green

# Change to repository directory
$repoPath = "C:\Users\stank\Downloads\levelup-life (4)"
Set-Location $repoPath

# Verify remote is set correctly
Write-Host "`nChecking remote configuration..." -ForegroundColor Yellow
& $gitExe remote -v

# Check current branch
Write-Host "`nChecking current branch..." -ForegroundColor Yellow
$currentBranch = & $gitExe branch --show-current
if ($currentBranch -ne "main") {
    Write-Host "Renaming branch to main..." -ForegroundColor Yellow
    & $gitExe branch -M main
} else {
    Write-Host "Already on main branch" -ForegroundColor Green
}

# Check if there are any commits
$commitCount = (& $gitExe rev-list --all --count 2>$null)
if ($commitCount -eq 0 -or $null -eq $commitCount) {
    Write-Host "`nNo commits found. Creating initial commit..." -ForegroundColor Yellow
    
    # Stage all files
    Write-Host "Staging all files..." -ForegroundColor Yellow
    & $gitExe add .
    
    # Create commit with message "XPeak"
    Write-Host "Creating commit with message 'XPeak'..." -ForegroundColor Yellow
    & $gitExe commit -m "XPeak"
    
    Write-Host "`n✓ Initial commit created successfully!" -ForegroundColor Green
} else {
    Write-Host "`nRepository already has commits. Current commit count: $commitCount" -ForegroundColor Yellow
    Write-Host "Latest commit:" -ForegroundColor Yellow
    & $gitExe log -1 --oneline
}

# Show status
Write-Host "`nRepository status:" -ForegroundColor Yellow
& $gitExe status

Write-Host "`n✓ Setup complete!" -ForegroundColor Green
Write-Host "`nTo push to remote, run:" -ForegroundColor Cyan
Write-Host "  git push -u origin main" -ForegroundColor White



