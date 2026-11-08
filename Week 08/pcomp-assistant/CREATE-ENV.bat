@echo off
cd /d "%~dp0"
if exist ".env.local" (
  echo .env.local already exists.
) else (
  copy /Y ".env.example" ".env.local" >nul
  echo Created .env.local
)
echo.
echo Add your DeepSeek API key after DEEPSEEK_API_KEY= and save the file.
echo Close Notepad, then double-click start-local.bat.
echo.
start "" notepad.exe ".env.local"
pause
