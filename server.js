require("dotenv").config();
const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");
const net = require("net");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;
const LISTENER_PORT = process.env.LISTENER_PORT || 4444;

// Serve the dashboard HTML
app.get("/", (req, res) => {
  // Use path.join for cross-platform compatibility
  const indexPath = path.join(__dirname, "public", "index.html");
  res.sendFile(indexPath);
});

// Track active sessions
const sessions = new Map();

// Listen for incoming ncat reverse shell connections
const listener = net.createServer((socket) => {
  const sessionId = Date.now().toString();
  console.log(
    `[+] New connection from ${socket.remoteAddress}:${socket.remotePort}`,
  );

  // Create a session object
  const wsSession = { id: sessionId, socket };
  sessions.set(sessionId, wsSession);

  // Forward terminal output to WebSocket clients
  socket.on("data", (data) => {
    const output = data.toString();
    broadcast(sessionId, output);
  });

  socket.on("close", () => {
    console.log(`[-] Session ${sessionId} closed`);
    sessions.delete(sessionId);
    broadcast("system", `Session ${sessionId} disconnected`);
  });

  broadcast(
    "system",
    `[+] Session ${sessionId} connected from ${socket.remoteAddress}`,
  );

  // Handle keyboard input from dashboard
  wsSession.sendInput = (input) => {
    socket.write(input);
  };
});

listener.listen(LISTENER_PORT, () => {
  console.log(`[+] Listener running on port ${LISTENER_PORT}`);
});

// WebSocket connection from dashboard
let dashboardWs = null; // Store the single dashboard connection

wss.on("connection", (ws) => {
  if (!dashboardWs) {
    dashboardWs = ws;
    console.log("[+] Dashboard connected");

    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });
  }

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "input") {
        // Send typed input to the correct session's socket
        const session = sessions.get(data.sessionId);
        if (session && session.socket) {
          session.socket.write(data.content);
        }
      } else if (data.type === "ping") {
        ws.ping();
      }
    } catch (e) {
      console.error("Error parsing message:", e);
    }
  });
});

// Heartbeat to keep WebSocket alive
setInterval(() => {
  wss.clients.forEach((client) => {
    if (client.isAlive == undefined) {
      client.terminate();
      return;
    }
    client.isAlive = false;
    client.ping();
  });
}, 30000);

function broadcast(sessionId, message) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      // OPEN
      client.send(JSON.stringify({ sessionId, message }));
    }
  });
}

server.listen(PORT, () => {
  console.log(`[+] Dashboard running at http://localhost:${PORT}`);
});
