const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const generateRoomName = require('./utils/roomNameGenerator');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true,
}));

app.use(bodyParser.json());

mongoose.connect('mongodb://localhost/mitplan', { useNewUrlParser: true, useUnifiedTopology: true });

const MitplanEvent = require('./models/MitplanEvent');
const Settings = require('./models/Settings');

const rooms = new Map();

app.post('/api/rooms', (req, res) => {
  let roomId;
  do {
    roomId = generateRoomName();
  } while (rooms.has(roomId));
  
  rooms.set(roomId, { events: [], settings: { timelineLength: 121, columnCount: 2 } });
  res.json({ roomId });
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    const room = rooms.get(roomId);
    if (room) {
      socket.emit('initialState', room);
    } else {
      socket.emit('error', { message: 'Room not found' });
    }
  });

  socket.on('clearEvents', (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      room.events = [];
      io.to(roomId).emit('stateUpdate', { events: room.events });
    }
  });

  socket.on('createEvent', (roomId, newEvent) => {
    const room = rooms.get(roomId);
    if (room) {
      const eventToAdd = {
        key: newEvent.key,
        name: newEvent.name,
        timestamp: newEvent.timestamp,
        columnId: newEvent.columnId,
        duration: newEvent.duration,
        color: newEvent.color,
        icon: newEvent.icon,
      };
      room.events.push(eventToAdd);
      io.to(roomId).emit('stateUpdate', { events: room.events });
    }
  });

  socket.on('updateEvents', (roomId, updatedEvents) => {
    const room = rooms.get(roomId);
    if (room) {
      room.events = updatedEvents;
      io.to(roomId).emit('stateUpdate', { events: room.events });
    }
  });

  socket.on('updateSettings', (roomId, newSettings) => {
    const room = rooms.get(roomId);
    if (room) {
      room.settings = { ...room.settings, ...newSettings };
      io.to(roomId).emit('stateUpdate', { settings: room.settings });
    }
  });

  socket.on('deleteEvent', (roomId, eventKey) => {
    const room = rooms.get(roomId);
    if (room) {
      room.events = room.events.filter(event => event.key !== eventKey);
      io.to(roomId).emit('stateUpdate', { events: room.events });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));