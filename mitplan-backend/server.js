const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const Redis = require('ioredis');
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

// Initialize Redis client
const redis = new Redis();

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true,
}));

app.use(bodyParser.json());

const rooms = new Map();

app.post('/api/rooms', async (req, res) => {
  let roomId;
  do {
    roomId = generateRoomName();
  } while (await redis.exists(`room:${roomId}`));
  
  const initialState = { events: [], settings: { timelineLength: 121, columnCount: 2 } };
  await redis.set(`room:${roomId}`, JSON.stringify(initialState));
  res.json({ roomId });
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('joinRoom', async (roomId) => {
    socket.join(roomId);
    const roomData = await redis.get(`room:${roomId}`);
    if (roomData) {
      socket.emit('initialState', JSON.parse(roomData));
    } else {
      socket.emit('error', { message: 'Room not found' });
    }
  });

  socket.on('clearEvents', async (roomId) => {
    const roomData = await redis.get(`room:${roomId}`);
    if (roomData) {
      const room = JSON.parse(roomData);
      room.events = [];
      await redis.set(`room:${roomId}`, JSON.stringify(room));
      io.to(roomId).emit('stateUpdate', { events: room.events });
    }
  });

  socket.on('createEvent', async (roomId, newEvent) => {
    const roomData = await redis.get(`room:${roomId}`);
    if (roomData) {
      const room = JSON.parse(roomData);
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
      await redis.set(`room:${roomId}`, JSON.stringify(room));
      io.to(roomId).emit('stateUpdate', { events: room.events });
    }
  });

  socket.on('updateEvents', async (roomId, updatedEvents) => {
    const roomData = await redis.get(`room:${roomId}`);
    if (roomData) {
      const room = JSON.parse(roomData);
      room.events = updatedEvents;
      await redis.set(`room:${roomId}`, JSON.stringify(room));
      io.to(roomId).emit('stateUpdate', { events: room.events });
    }
  });

  socket.on('updateSettings', async (roomId, newSettings) => {
    const roomData = await redis.get(`room:${roomId}`);
    if (roomData) {
      const room = JSON.parse(roomData);
      room.settings = { ...room.settings, ...newSettings };
      await redis.set(`room:${roomId}`, JSON.stringify(room));
      io.to(roomId).emit('stateUpdate', { settings: room.settings });
    }
  });

  socket.on('deleteEvent', async (roomId, eventKey) => {
    const roomData = await redis.get(`room:${roomId}`);
    if (roomData) {
      const room = JSON.parse(roomData);
      room.events = room.events.filter(event => event.key !== eventKey);
      await redis.set(`room:${roomId}`, JSON.stringify(room));
      io.to(roomId).emit('stateUpdate', { events: room.events });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));