# Run VibeMiner with a locally built boing-node (current Boing repo main) instead of the GitHub zip.
#
# Usage (PowerShell):
#   . .\scripts\run-vibeminer-with-local-boing-node.ps1
#   # then start VibeMiner from the same terminal (shortcut / Start Menu copy)
#
# Or set once per session:
#   $env:VIBEMINER_BOING_NODE_EXE = "C:\...\boing.network\target\release\boing-node.exe"
#
# Optional:
#   $env:BOING_NETWORK_ROOT — override path to boing.network clone
#
# See: docs/NODE_RUNNING.md § Boing local binary

$ErrorActionPreference = "Stop"

$vibeminerRoot = Split-Path $PSScriptRoot -Parent
$siblingBoing = [System.IO.Path]::GetFullPath((Join-Path $vibeminerRoot "..\boing.network"))

$boingRoot = if ($env:BOING_NETWORK_ROOT) {
    $env:BOING_NETWORK_ROOT.TrimEnd('\', '/')
} elseif (Test-Path (Join-Path $siblingBoing "Cargo.toml")) {
    $siblingBoing
} else {
    "C:\Users\chiku\Desktop\vibe-code\boing.network"
}

$exe = Join-Path $boingRoot "target\release\boing-node.exe"
if (-not (Test-Path -LiteralPath $exe)) {
    Write-Error "boing-node.exe not found at $exe — run: cd `"$boingRoot`"; cargo build -p boing-node --release"
}

$resolved = (Resolve-Path -LiteralPath $exe).Path
$env:VIBEMINER_BOING_NODE_EXE = $resolved

Write-Host "Set VIBEMINER_BOING_NODE_EXE=$resolved"
Write-Host "Start VibeMiner from this PowerShell window so the desktop app inherits the variable."
