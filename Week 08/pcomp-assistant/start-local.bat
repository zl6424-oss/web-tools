@echo off
setlocal
cd /d "%~dp0"

set "NODE_EXE="

where node >nul 2>&1
if %errorlevel% equ 0 (
  for /f "delims=" %%I in ('where node') do (
    if not defined NODE_EXE set "NODE_EXE=%%I"
  )
)

if not defined NODE_EXE (
  if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
    set "NODE_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
  )
)

if not defined NODE_EXE (
  if exist "%ProgramFiles%\nodejs\node.exe" (
    set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
  )
)

if not defined NODE_EXE (
  echo ERROR: Node.js could not be found.
  echo Please open this folder in Codex or install Node.js.
  echo.
  pause
  exit /b 1
)

echo Starting PCom Assistant...
echo The server will print the exact browser address below.
echo Keep this window open while using the AI.
echo Press Ctrl+C to stop the server.
echo.

"%NODE_EXE%" server.js

echo.
pause


