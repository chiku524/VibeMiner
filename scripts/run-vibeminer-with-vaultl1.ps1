# Set VIBEMINER_VAULTD_EXE to a local vaultd build (Projects/vaultl1 or legacy Jackal path).
# Dot-source, then start desktop from this shell:
#   . .\scripts\run-vibeminer-with-vaultl1.ps1
#   npm run desktop

$ErrorActionPreference = "Stop"
$candidates = @(
  (Join-Path $env:USERPROFILE "Projects\vaultl1\build\vaultd.exe"),
  (Join-Path $env:USERPROFILE "Projects\vaultl1\build\vaultd"),
  (Join-Path $PSScriptRoot "..\..\Projects\vaultl1\build\vaultd.exe"),
  (Join-Path $PSScriptRoot "..\..\Projects\vaultl1\build\vaultd"),
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
  Write-Warning "vaultd not found. Build vaultl1 (Projects/vaultl1) or set VIBEMINER_VAULTD_EXE manually."
  return
}
$env:VIBEMINER_VAULTD_EXE = $found
Write-Host "VIBEMINER_VAULTD_EXE=$found"
