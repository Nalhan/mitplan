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
import { v4 as uuidv4 } from 'uuid';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Define RoomState interface
interface RoomState {
  id: string;
  sheets: {
    [key: string]: {
      id: string;
      name: string;
      assignmentEvents: any[];
      encounterEvents: any[];
      settings: {
        timelineLength: number;
        columnCount: number;
      };
    };
  };
  activeSheetId: string | null;
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
  transports: ['websocket', 'polling'],
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
  stateUpdate: (update: { sheets?: any, activeSheetId?: string }) => void;
}

interface ClientToServerEvents {
  joinRoom: (roomId: string) => void;
  addSheet: (roomId: string, sheet: any) => void;
  deleteSheet: (roomId: string, sheetId: string) => void;
  updateSheet: (roomId: string, sheetId: string, updates: any) => void;
  setActiveSheet: (roomId: string, sheetId: string) => void;
  updateAssignmentEvents: (roomId: string, sheetId: string, events: any) => void;
  deleteAssignmentEvents: (roomId: string, sheetId: string, eventIds?: string | string[]) => void;
  updateEncounterEvents: (roomId: string, sheetId: string, events: any) => void;
  deleteEncounterEvents: (roomId: string, sheetId: string, eventIds?: number | number[]) => void;
}

io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
  console.log('New client connected', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
  });

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

  socket.on('addSheet', async (roomId: string, sheet: any) => {
    const roomData = await redis.get(`room:${roomId}`);
    if (roomData) {
      const room: RoomState = JSON.parse(roomData);
      if (!room.sheets) room.sheets = {};
      room.sheets[sheet.id] = sheet;
      await redis.set(`room:${roomId}`, JSON.stringify(room));
      io.to(roomId).emit('stateUpdate', { sheets: room.sheets });
    }
  });

  socket.on('deleteSheet', async (roomId: string, sheetId: string) => {
    const roomData = await redis.get(`room:${roomId}`);
    if (roomData) {
      const room: RoomState = JSON.parse(roomData);
      delete room.sheets[sheetId];
      if (room.activeSheetId === sheetId) {
        room.activeSheetId = null;
      }
      await redis.set(`room:${roomId}`, JSON.stringify(room));
      io.to(roomId).emit('stateUpdate', { sheets: room.sheets, activeSheetId: room.activeSheetId });
    }
  });

  socket.on('updateSheet', async (roomId: string, sheetId: string, updates: any) => {
    const roomData = await redis.get(`room:${roomId}`);
    if (roomData) {
      const room: RoomState = JSON.parse(roomData);
      if (room.sheets && room.sheets[sheetId]) {
        room.sheets[sheetId] = { ...room.sheets[sheetId], ...updates };
        await redis.set(`room:${roomId}`, JSON.stringify(room));
        io.to(roomId).emit('stateUpdate', { sheets: { [sheetId]: room.sheets[sheetId] } });
      }
    }
  });

  socket.on('setActiveSheet', async (roomId: string, sheetId: string) => {
    const roomData = await redis.get(`room:${roomId}`);
    if (roomData) {
      const room: RoomState = JSON.parse(roomData);
      room.activeSheetId = sheetId;
      await redis.set(`room:${roomId}`, JSON.stringify(room));
      io.to(roomId).emit('stateUpdate', { activeSheetId: sheetId });
    }
  });

  socket.on('updateAssignmentEvents', async (roomId: string, sheetId: string, events: any) => {
    const roomData = await redis.get(`room:${roomId}`);
    if (roomData) {
      const room: RoomState = JSON.parse(roomData);
      if (room.sheets && room.sheets[sheetId]) {
        if (Array.isArray(events)) {
          room.sheets[sheetId].assignmentEvents = events;
        } else if (typeof events === 'object') {
          events.forEach((event: any) => {
            const index = room.sheets[sheetId].assignmentEvents.findIndex(e => e.id === event.id);
            if (index !== -1) {
              room.sheets[sheetId].assignmentEvents[index] = { ...room.sheets[sheetId].assignmentEvents[index], ...event };
            } else {
              room.sheets[sheetId].assignmentEvents.push(event);
            }
          });
        }
        await redis.set(`room:${roomId}`, JSON.stringify(room));
        io.to(roomId).emit('stateUpdate', { sheets: { [sheetId]: { assignmentEvents: room.sheets[sheetId].assignmentEvents } } });
      }
    }
  });

  socket.on('deleteAssignmentEvents', async (roomId: string, sheetId: string, eventIds?: string | string[]) => {
    const roomData = await redis.get(`room:${roomId}`);
    if (roomData) {
      const room: RoomState = JSON.parse(roomData);
      if (room.sheets && room.sheets[sheetId]) {
        if (eventIds === undefined) {
          room.sheets[sheetId].assignmentEvents = [];
        } else {
          const idsToDelete = Array.isArray(eventIds) ? eventIds : [eventIds];
          room.sheets[sheetId].assignmentEvents = room.sheets[sheetId].assignmentEvents.filter(e => !idsToDelete.includes(e.id));
        }
        await redis.set(`room:${roomId}`, JSON.stringify(room));
        io.to(roomId).emit('stateUpdate', { sheets: { [sheetId]: { assignmentEvents: room.sheets[sheetId].assignmentEvents } } });
      }
    }
  });

  socket.on('updateEncounterEvents', async (roomId: string, sheetId: string, events: any) => {
    const roomData = await redis.get(`room:${roomId}`);
    if (roomData) {
      const room: RoomState = JSON.parse(roomData);
      if (room.sheets && room.sheets[sheetId]) {
        if (Array.isArray(events)) {
          room.sheets[sheetId].encounterEvents = events;
        } else if (typeof events === 'object') {
          events.forEach((event: any) => {
            const index = room.sheets[sheetId].encounterEvents.findIndex(e => e.id === event.id);
            if (index !== -1) {
              room.sheets[sheetId].encounterEvents[index] = { ...room.sheets[sheetId].encounterEvents[index], ...event };
            } else {
              room.sheets[sheetId].encounterEvents.push(event);
            }
          });
        }
        await redis.set(`room:${roomId}`, JSON.stringify(room));
        io.to(roomId).emit('stateUpdate', { sheets: { [sheetId]: { encounterEvents: room.sheets[sheetId].encounterEvents } } });
      }
    }
  });

  socket.on('deleteEncounterEvents', async (roomId: string, sheetId: string, eventIds?: number | number[]) => {
    const roomData = await redis.get(`room:${roomId}`);
    if (roomData) {
      const room: RoomState = JSON.parse(roomData);
      if (room.sheets && room.sheets[sheetId]) {
        if (eventIds === undefined) {
          room.sheets[sheetId].encounterEvents = [];
        } else {
          const idsToDelete = Array.isArray(eventIds) ? eventIds : [eventIds];
          room.sheets[sheetId].encounterEvents = room.sheets[sheetId].encounterEvents.filter(e => !idsToDelete.includes(e.id));
        }
        await redis.set(`room:${roomId}`, JSON.stringify(room));
        io.to(roomId).emit('stateUpdate', { sheets: { [sheetId]: { encounterEvents: room.sheets[sheetId].encounterEvents } } });
      }
    }
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