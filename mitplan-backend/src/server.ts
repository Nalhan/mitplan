import dotenv from 'dotenv';
import path from 'path';
import express, { Request, Response } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import Redis from 'ioredis';
import cors from 'cors';
import bodyParser from 'body-parser';
import { Sequelize, DataTypes, Model } from 'sequelize';
import fs from 'fs';
import generateRoomName from './utils/roomNameGenerator';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Define RoomState interface
interface RoomState {
  sheets: {
    [key: string]: {
      name: string;
      events: any[];
      encounterEvents: any[];
      settings: {
        timelineLength: number;
        columnCount: number;
      };
    };
  };
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  path: '/socket.io',
});

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL!);

// Read Docker secrets
const DB_PASSWORD = fs.readFileSync('/run/secrets/db_password', 'utf8').trim();
const JWT_SECRET = fs.readFileSync('/run/secrets/jwt_secret', 'utf8').trim();

// Initialize Sequelize
const sequelize = new Sequelize(process.env.DB_NAME!, process.env.DB_USER!, DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT!, 10),
  dialect: 'postgres'
});

// Define Room model
interface RoomAttributes {
  roomId: string;
  state: any;
}

class Room extends Model<RoomAttributes> implements RoomAttributes {
  public roomId!: string;
  public state!: any;
}

Room.init({
  roomId: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  state: DataTypes.JSONB
}, { sequelize, modelName: 'Room' });

sequelize.sync();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true,
}));

app.use(bodyParser.json());

const rooms = new Map();

app.post('/api/rooms', async (req: Request, res: Response) => {
  let roomId: string;
  do {
    roomId = generateRoomName();
  } while (await redis.exists(`room:${roomId}`));
  
  const initialState = { events: [], settings: { timelineLength: 121, columnCount: 2 } };
  await redis.set(`room:${roomId}`, JSON.stringify(initialState));
  await Room.create({ roomId, state: initialState });
  res.json({ roomId });
});

interface ServerToClientEvents {
  initialState: (state: any) => void;
  error: (error: { message: string }) => void;
  stateUpdate: (update: { events?: any[], settings?: any, sheets?: any }) => void;
}

interface ClientToServerEvents {
  joinRoom: (roomId: string) => void;
  clearEvents: (roomId: string, sheetId: string) => void;
  createEvent: (roomId: string, sheetId: string, newEvent: any) => void;
  updateSettings: (roomId: string, sheetId: string, newSettings: any) => void;
  deleteEvent: (roomId: string, sheetId: string, eventKey: string) => void;
  createSheet: (roomId: string, sheetId: string) => void;
  deleteSheet: (roomId: string, sheetId: string) => void;
  renameSheet: (roomId: string, sheetId: string, newName: string) => void;
  updateEvent: (roomId: string, sheetId: string, updatedEvent: any) => void;
  updateEncounterEvents: (roomId: string, sheetId: string, encounterEvents: any[]) => void;
}

io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
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

  socket.on('clearEvents', async (roomId, sheetId) => {
    const roomData = await redis.get(`room:${roomId}`);
    if (roomData) {
      const room: RoomState = JSON.parse(roomData);
      if (room.sheets && room.sheets[sheetId]) {
        room.sheets[sheetId].events = [];
        await redis.set(`room:${roomId}`, JSON.stringify(room));
        io.to(roomId).emit('stateUpdate', { sheets: room.sheets });
      }
    }
  });

  socket.on('createEvent', async (roomId, sheetId, event) => {
    const roomData = await redis.get(`room:${roomId}`);
    if (roomData) {
      const room: RoomState = JSON.parse(roomData);
      if (!room.sheets) room.sheets = {};
      if (!room.sheets[sheetId]) {
        room.sheets[sheetId] = { 
          name: sheetId, 
          events: [], 
          encounterEvents: [],
          settings: { timelineLength: 121, columnCount: 2 } 
        };
      }
      room.sheets[sheetId].events.push(event);
      await redis.set(`room:${roomId}`, JSON.stringify(room));
      io.to(roomId).emit('stateUpdate', { sheets: room.sheets });
    }
  });

  socket.on('updateEvent', async (roomId, sheetId, updatedEvent) => {
    console.log(`Updating event: roomId=${roomId}, sheetId=${sheetId}, eventKey=${updatedEvent.key}`);
    const roomData = await redis.get(`room:${roomId}`);
    if (roomData) {
      const room: RoomState = JSON.parse(roomData);
      if (room.sheets && room.sheets[sheetId]) {
        const eventIndex = room.sheets[sheetId].events.findIndex(e => e.key === updatedEvent.key);
        if (eventIndex !== -1) {
          room.sheets[sheetId].events[eventIndex] = updatedEvent;
          await redis.set(`room:${roomId}`, JSON.stringify(room));
          await Room.update({ state: room }, { where: { roomId } });
          io.to(roomId).emit('stateUpdate', { sheets: room.sheets });
          console.log(`Event updated successfully: roomId=${roomId}, sheetId=${sheetId}, eventKey=${updatedEvent.key}`);
        } else {
          console.log(`Event not found: roomId=${roomId}, sheetId=${sheetId}, eventKey=${updatedEvent.key}`);
        }
      } else {
        console.log(`Sheet not found: roomId=${roomId}, sheetId=${sheetId}`);
      }
    } else {
      console.log(`Room not found: roomId=${roomId}`);
    }
  });

  socket.on('updateSettings', async (roomId, sheetId, newSettings) => {
    const roomData = await redis.get(`room:${roomId}`);
    if (roomData) {
      const room: RoomState = JSON.parse(roomData);
      if (room.sheets && room.sheets[sheetId]) {
        room.sheets[sheetId].settings = { ...room.sheets[sheetId].settings, ...newSettings };
        await redis.set(`room:${roomId}`, JSON.stringify(room));
        io.to(roomId).emit('stateUpdate', { sheets: room.sheets });
      }
    }
  });

  socket.on('deleteEvent', async (roomId, sheetId, eventKey) => {
    const roomData = await redis.get(`room:${roomId}`);
    if (roomData) {
      const room: RoomState = JSON.parse(roomData);
      if (room.sheets && room.sheets[sheetId]) {
        room.sheets[sheetId].events = room.sheets[sheetId].events.filter(event => event.key !== eventKey);
        await redis.set(`room:${roomId}`, JSON.stringify(room));
        console.log(`Deleting event: roomId=${roomId}, sheetId=${sheetId}, eventKey=${eventKey}`);
        io.to(roomId).emit('stateUpdate', { sheets: room.sheets });
      }
    }
  });

  socket.on('createSheet', async (roomId: string, sheetId: string) => {
    const roomData = await redis.get(`room:${roomId}`);
    if (roomData) {
      const room: RoomState = JSON.parse(roomData);
      if (!room.sheets) room.sheets = {};
      room.sheets[sheetId] = { name: sheetId, events: [], encounterEvents: [], settings: { timelineLength: 121, columnCount: 2 } };
      await redis.set(`room:${roomId}`, JSON.stringify(room));
      io.to(roomId).emit('stateUpdate', { sheets: room.sheets });
    }
  });

  socket.on('deleteSheet', async (roomId: string, sheetId: string) => {
    const roomData = await redis.get(`room:${roomId}`);
    if (roomData) {
      const room: RoomState = JSON.parse(roomData);
      delete room.sheets[sheetId];
      await redis.set(`room:${roomId}`, JSON.stringify(room));
      io.to(roomId).emit('stateUpdate', { sheets: room.sheets });
    }
  });

  socket.on('renameSheet', async (roomId: string, sheetId: string, newName: string) => {
    const roomData = await redis.get(`room:${roomId}`);
    if (roomData) {
      const room: RoomState = JSON.parse(roomData);
      if (room.sheets && room.sheets[sheetId]) {
        room.sheets[sheetId].name = newName;
        await redis.set(`room:${roomId}`, JSON.stringify(room));
        console.log(`Sheet renamed: roomId=${roomId}, sheetId=${sheetId}, newName=${newName}`);
        io.to(roomId).emit('stateUpdate', { sheets: room.sheets });
      }
    }
  });

  socket.on('updateEncounterEvents', async (roomId: string, sheetId: string, encounterEvents: any[]) => {
    const roomData = await redis.get(`room:${roomId}`);
    if (roomData) {
      const room: RoomState = JSON.parse(roomData);
      if (room.sheets && room.sheets[sheetId]) {
        room.sheets[sheetId].encounterEvents = encounterEvents;
        await redis.set(`room:${roomId}`, JSON.stringify(room));
        console.log(`Encounter events updated: roomId=${roomId}, sheetId=${sheetId}`);
        io.to(roomId).emit('stateUpdate', { sheets: room.sheets });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

app.post('/api/rooms/:roomId/save', async (req: Request, res: Response) => {
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