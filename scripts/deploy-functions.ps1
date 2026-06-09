#!/usr/bin/env pwsh
# Deploy all Supabase edge functions for Nairobi Trash Locator.
# Prerequisites: npx supabase login  (one-time, opens browser)
#
# Usage: .\scripts\deploy-functions.ps1

$ErrorActionPreference = "Stop"
$projectRef = "momkbsgfypjfujkhrtxb"

Write-Host "Linking project $projectRef..."
npx supabase link --project-ref $projectRef

$functions = @(
  "analyze-trash",
  "public-stats",
  "weekly-digest",
  "whatsapp-webhook"
)

foreach ($fn in $functions) {
  Write-Host "Deploying $fn..."
  npx supabase functions deploy $fn --project-ref $projectRef
}

Write-Host ""
Write-Host "Done. Optional secrets (Supabase Dashboard -> Edge Functions -> Secrets):"
Write-Host "  GEMINI_API_KEY          - for AI moderation"
Write-Host "  RESEND_API_KEY          - for weekly digest emails"
Write-Host "  WHATSAPP_WEBHOOK_SECRET - for WhatsApp webhook auth"
Write-Host "  AUTO_APPROVE_REPORTS    - true/false (server-side webhook default)"
