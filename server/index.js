const { Server } = require("socket.io");
const express = require("express");
const http = require("http");

const app = express();
const port = 8000 || 3001;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Update this to your frontend URL in production
  },
});

const emailToSocketIdMap = new Map();
const socketidToEmailMap = new Map();

// Testing route
app.get("/msg", (req, res) => {
  res.send("Server is running and WebRTC signaling server is live!");
});

// WebRTC Socket.IO functionality
io.on("connection", (socket) => {
  console.log(`Socket Connected`, socket.id);

  socket.on("room:join", (data) => {
    const { email, room } = data;
    emailToSocketIdMap.set(email, socket.id);
    socketidToEmailMap.set(socket.id, email);
    io.to(room).emit("user:joined", { email, id: socket.id });
    socket.join(room);
    io.to(socket.id).emit("room:join", data);
  });

  socket.on("user:call", ({ to, offer }) => {
    io.to(to).emit("incoming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    console.log("peer:nego:needed", offer);
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    console.log("peer:nego:done", ans);
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
