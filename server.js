const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const cors = require('cors');

app.use(cors({
  origin: '*', 
  methods: '*', 
  allowedHeaders: '*', 
  credentials: true, 
}));
const io = socketIo(server, {
  cors: {
    origin: '*', 
  methods: '*', 
  allowedHeaders: '*', 
  credentials: true,   },
});

const employeeSockets = {};
const adminSockets = {};

io.on('connection', (socket) => {
  console.log('New connection: ' + socket.id);

  socket.on('register-employee', (employeeId) => {
    employeeSockets[employeeId] = socket.id;
    socket.join(employeeId);
    console.log(`${employeeId} (employee) registered`);
  });

  socket.on('register-admin', (employeeId) => {
    adminSockets[socket.id] = employeeId;
    socket.join(employeeId);
    console.log(`Admin registered for ${employeeId}`);
    io.to(employeeSockets[employeeId]).emit('new-admin', socket.id);
  });

  socket.on('offer', (employeeId, adminId, offer) => {
    io.to(adminId).emit('offer', offer);
  });

  socket.on('answer', (employeeId, answer) => {
    io.to(employeeSockets[employeeId]).emit('answer', socket.id, answer);
  });

  socket.on('ice-candidate', (employeeId, adminId, candidate) => {
    io.to(adminId).emit('ice-candidate', candidate);
  });
  socket.on('disconnect', () => {
    const employeeId = adminSockets[socket.id];
    if (employeeId) {
      delete adminSockets[socket.id];
      console.log(`Admin disconnected from ${employeeId}`);
      io.to(employeeSockets[employeeId]).emit('admin-disconnected');
    }
  });
socket.on('switch-stream', (streamType) => {
  const employeeId = adminSockets[socket.id];
  if (employeeId && employeeSockets[employeeId]) {
    console.log(`Switching stream to ${streamType} for ${employeeId}`);
    io.to(employeeSockets[employeeId]).emit('switch-stream', streamType);
  }
});
  
  
});

server.listen(4000, () => {
  console.log('Server running on http://localhost:4000');
});
module.exports = server;