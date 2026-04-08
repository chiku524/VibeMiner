@echo off
REM Sets VIBEMINER_BOING_NODE_EXE to a sibling ..\boing.network\target\release\boing-node.exe
REM (vibeminer and boing.network repos next to each other under the same parent folder).

set "VMROOT=%~dp0.."
for %%I in ("%VMROOT%") do set "VMROOT=%%~fI"
set "BOING_ROOT=%VMROOT%\..\boing.network"
for %%I in ("%BOING_ROOT%") do set "BOING_ROOT=%%~fI"

set "VIBEMINER_BOING_NODE_EXE=%BOING_ROOT%\target\release\boing-node.exe"
if not exist "%VIBEMINER_BOING_NODE_EXE%" (
  echo Missing: %VIBEMINER_BOING_NODE_EXE%
  echo Build: cd /d "%BOING_ROOT%" ^&^& cargo build -p boing-node --release
  pause
  exit /b 1
)

echo VIBEMINER_BOING_NODE_EXE=%VIBEMINER_BOING_NODE_EXE%
echo.
echo Open VibeMiner from this Command Prompt so it inherits the variable, or create a shortcut to VibeMiner.exe with the same variable set in the shortcut target environment ^(Windows 10+^).
pause
