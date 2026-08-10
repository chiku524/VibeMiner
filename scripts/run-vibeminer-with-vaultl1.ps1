# Set VIBEMINER_VAULTD_EXE to a local vaultd build (sibling Jackal/vaultl1 if present).
# Dot-source, then start desktop from this shell:
#   . .\scripts\run-vibeminer-with-vaultl1.ps1
#   npm run desktop

$ErrorActionPreference = "Stop"
$candidates = @(
  (Join-Path $PSScriptRoot "..\..\Jackal\vaultl1\build\vaultd.exe"),
  (Join-Path $PSScriptRoot "..\..\Jackal\vaultl1\build\vaultd"),
  (Join-Path $env:USERPROFILE "Desktop\Jackal\vaultl1\build\vaultd.exe"),
  (Join-Path $env:USERPROFILE "Desktop\Jackal\vaultl1\build\vaultd")
)
$found = $null
foreach ($c in $candidates) {
  $full = [System.IO.Path]::GetFullPath($c)
  if (Test-Path -LiteralPath $full) {
    $found = $full
    break
  }
}
if (-not $found) {
  Write-Warning "vaultd not found. Build VaultL1 and set VIBEMINER_VAULTD_EXE manually."
  return
}
$env:VIBEMINER_VAULTD_EXE = $found
Write-Host "VIBEMINER_VAULTD_EXE=$found"
