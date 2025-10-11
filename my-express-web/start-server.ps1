# Quick Start Script for Email Server
# Run this file in PowerShell to start the email server

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Booking Email Notification Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ ERROR: .env file not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create a .env file with your email credentials:" -ForegroundColor Yellow
    Write-Host "  1. Copy .env.example to .env" -ForegroundColor Yellow
    Write-Host "  2. Fill in your EMAIL_USER and EMAIL_PASSWORD" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "For Gmail users:" -ForegroundColor Cyan
    Write-Host "  - Go to: https://myaccount.google.com/security" -ForegroundColor White
    Write-Host "  - Enable 2-Step Verification" -ForegroundColor White
    Write-Host "  - Create an App Password" -ForegroundColor White
    Write-Host ""
    pause
    exit
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

Write-Host "🚀 Starting email server..." -ForegroundColor Green
Write-Host "   Server will run on http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "📧 Email notifications will be sent for:" -ForegroundColor Cyan
Write-Host "   ✓ Booking Confirmations" -ForegroundColor Green
Write-Host "   ✓ Booking Cancellations" -ForegroundColor Red
Write-Host "   ✓ Reschedule Requests" -ForegroundColor Blue
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start the server
npm start
