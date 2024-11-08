const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use('',(req,res,next)=>{
res.send("Hello ")
})

// Separate mappings for employee and admin sockets
const employeeSockets = {}; // Map employee IDs to socket IDs
const adminSockets = {}; // Map admin socket IDs

io.on('connection', (socket) => {
  console.log('New connection: ' + socket.id);
 
  // Register employee by ID
  socket.on('register-employee', (employeeId) => {
    if (employeeId) {
      employeeSockets[employeeId] = socket.id;
      console.log(`${employeeId} (employee) registered with socket ID ${socket.id}`);
    }
  });

  // Register admin (web app) socket
  socket.on('register-admin', (adminId) => {
    if (adminId) {
      adminSockets[adminId] = socket.id;
      console.log(`${adminId} (admin) registered with socket ID ${socket.id}`);
    }
  });

  // Handle offer from desktop app (employee side)
  socket.on('offer', (employeeId, offer) => {
    console.log(`Offer from employee ${employeeId}`, offer);
    if (employeeSockets[employeeId] && adminSockets['admin']) { // Ensure employee and admin are connected
      // Send the offer to the admin (web side)
      socket.to(adminSockets['admin']).emit('offer', offer);
      console.log(`Offer sent to admin for employee ${employeeId}`);
    } else {
      console.log(`No socket found for employee ${employeeId} or admin`);
    }
  });

  // Handle answer from admin (web side)
  socket.on('answer', (employeeId, answer) => {
    console.log(`Answer from admin to employee ${employeeId}`, answer);
    if (employeeSockets[employeeId]) {
      // Send the answer to the employee (desktop side)
      socket.to(employeeSockets[employeeId]).emit('answer', answer);
      console.log(`Answer sent to employee ${employeeId}`);
    } else {
      console.log(`No socket found for employee ${employeeId}`);
    }
  });

  // Handle ICE candidates (used for WebRTC peer-to-peer connection)
  socket.on('ice-candidate', (employeeId, candidate) => {
    console.log(`ICE candidate for employee ${employeeId}`, candidate);
    if (employeeSockets[employeeId]) {
      // Send the ICE candidate to the correct employee (desktop side)
      socket.to(employeeSockets[employeeId]).emit('ice-candidate', candidate);
      console.log(`ICE candidate sent to employee ${employeeId}`);
    } else {
      console.log(`No socket found for employee ${employeeId}`);
    }
  });

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    // Remove the socket from employeeSockets and adminSockets on disconnect
    Object.keys(employeeSockets).forEach((id) => {
      if (employeeSockets[id] === socket.id) {
        employeeSockets[id] = null;
        console.log(`${id} (employee) disconnected`);
      }
    });
    
    Object.keys(adminSockets).forEach((id) => {
      if (adminSockets[id] === socket.id) {
        adminSockets[id] = null;
        console.log(`${id} (admin) disconnected`);
      }
    });
  });
});

server.listen(4000, () => {
  console.log('Server is running on http://localhost:4000');
});
