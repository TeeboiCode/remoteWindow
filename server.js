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
  const indexPath = path.join(__dirname, "public", "index.html");
  res.sendFile(indexPath);
});

// Track active sessions
const sessions = new Map();
let sessionCounter = 1; // Clean counter for IDs

// Listen for incoming ncat reverse shell connections
const listener = net.createServer((socket) => {
  // Use a simple incrementing ID for easier debugging
  const sessionId = `session-${sessionCounter++}`;

  console.log(
    `[+] New connection from ${socket.remoteAddress}:${socket.remotePort} [${sessionId}]`,
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
    broadcast(
      "system",
      JSON.stringify({
        type: "session_ended",
        sessionId: sessionId,
        message: `Session ${sessionId} disconnected`,
      }),
    );
  });

  // Broadcast a clear event for the frontend to handle
  broadcast(
    "system",
    JSON.stringify({
      type: "new_session",
      sessionId: sessionId,
      ip: socket.remoteAddress,
      message: `[+] Session ${sessionId} connected from ${socket.remoteAddress}`,
    }),
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
wss.on("connection", (ws) => {
  console.log("[+] Dashboard connected");

  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = true;
  });

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

  ws.on("close", () => {
    console.log("[-] Dashboard disconnected");
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

function broadcast(sessionId, content) {
  let msgObj;

  // If content is already a stringified JSON (from new events), parse it to ensure structure
  if (typeof content === "string" && content.startsWith("{")) {
    try {
      msgObj = JSON.parse(content);
    } catch (e) {
      msgObj = { sessionId, message: content };
    }
  } else {
    // Standard terminal output
    msgObj = { sessionId, message: content };
  }

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      // OPEN
      client.send(JSON.stringify(msgObj));
    }
  });
}

server.listen(PORT, () => {
  console.log(`[+] Dashboard running at http://localhost:${PORT}`);
});
