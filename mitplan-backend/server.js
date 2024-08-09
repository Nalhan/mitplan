require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const Redis = require('ioredis');
const cors = require('cors');
const bodyParser = require('body-parser');
const generateRoomName = require('./utils/roomNameGenerator');
const { Sequelize, DataTypes } = require('sequelize');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL);

// Read Docker secrets
const DB_PASSWORD = fs.readFileSync('/run/secrets/db_password', 'utf8').trim();
const JWT_SECRET = fs.readFileSync('/run/secrets/jwt_secret', 'utf8').trim();

// Initialize Sequelize
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'postgres'
});

// Define models
const Room = sequelize.define('Room', {
  roomId: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  state: DataTypes.JSONB
});

sequelize.sync();

app.use(cors({
  origin: process.env.FRONTEND_URL,
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
  await Room.create({ roomId, state: initialState });
  res.json({ roomId });
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('joinRoom', async (roomId) => {
    socket.join(roomId);
    let roomData = await redis.get(`room:${roomId}`);
    if (!roomData) {
      const dbRoom = await Room.findOne({ where: { roomId } });
      if (dbRoom) {
        roomData = JSON.stringify(dbRoom.state);
        await redis.set(`room:${roomId}`, roomData);
      }
    }
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
      await Room.update({ state: room }, { where: { roomId } });
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

app.post('/api/rooms/:roomId/save', async (req, res) => {
  const { roomId } = req.params;
  const roomData = await redis.get(`room:${roomId}`);
  if (roomData) {
    await Room.update({ state: JSON.parse(roomData) }, { where: { roomId } });
    res.json({ message: 'Room state saved successfully' });
  } else {
    res.status(404).json({ message: 'Room not found' });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));