@echo off
REM Set VIBEMINER_VAULTD_EXE then start desktop from this environment if you like.
set "CAND=%USERPROFILE%\Desktop\Jackal\vaultl1\build\vaultd.exe"
if exist "%CAND%" (
  set "VIBEMINER_VAULTD_EXE=%CAND%"
  echo VIBEMINER_VAULTD_EXE=%CAND%
  exit /b 0
)
set "CAND=%USERPROFILE%\Desktop\Jackal\vaultl1\build\vaultd"
if exist "%CAND%" (
  set "VIBEMINER_VAULTD_EXE=%CAND%"
  echo VIBEMINER_VAULTD_EXE=%CAND%
  exit /b 0
)
echo vaultd not found under Desktop\Jackal\vaultl1\build
exit /b 1
