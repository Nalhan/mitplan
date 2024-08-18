import dotenv from 'dotenv';
import path from 'path';
import express, { Request, Response } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import { Transport } from 'engine.io';
import Redis from 'ioredis';
import cors from 'cors';
import bodyParser from 'body-parser';
import { Sequelize, DataTypes, Model } from 'sequelize';
import fs from 'fs';
import generateRoomName from './utils/roomNameGenerator';
import { v4 as uuidv4 } from 'uuid';
import debugModule from 'debug';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Define RoomState interface
interface RoomState {
  id: string;
  sheets: {
    [key: string]: {
      id: string;
      name: string;
      assignmentEvents: { [id: string]: any };
      encounter: {
        events: any[];
        name: string;
        id: string;
        fightLength: number;
      };
      columnCount: number;
    };
  };
  roster: {
    players: {}
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
// const JWT_SECRET = fs.readFileSync('/run/secrets/jwt_secret', 'utf8').trim();

// Initialize Sequelize with retry logic
const initializeSequelize = async (): Promise<Sequelize> => {
  const maxRetries = 5;
  const retryInterval = 5000; // 5 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const sequelize = new Sequelize(process.env.DB_NAME!, process.env.DB_USER!, DB_PASSWORD, {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT!, 10),
        dialect: 'postgres',
        logging: false // Set to console.log to see SQL queries
      });

      await sequelize.authenticate();
      console.log('Database connection has been established successfully.');
      return sequelize;
    } catch (error) {
      console.error(`Unable to connect to the database (attempt ${attempt}/${maxRetries}):`, error);
      if (attempt === maxRetries) {
        console.error('Max retries reached. Exiting...');
        process.exit(1);
      }
      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }
  }

  throw new Error('Failed to initialize database connection');
};

// Define Room model
interface RoomAttributes {
  roomId: string;
  state: any;
}

class Room extends Model<RoomAttributes> implements RoomAttributes {
  public roomId!: string;
  public state!: any;
}

// Wrap your server startup in an async function
const startServer = async () => {
  try {
    const sequelize = await initializeSequelize();

    Room.init({
      roomId: {
        type: DataTypes.STRING,
        primaryKey: true
      },
      state: DataTypes.JSONB
    }, { sequelize, modelName: 'Room' });

    await sequelize.sync();

    // Enable CORS
    app.use(cors({
      origin: process.env.FRONTEND_URL,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    }));

    app.use(bodyParser.json());

    const rooms = new Map();

    app.post('/api/rooms', async (req: Request, res: Response) => {
      let roomId: string;
      do {
        roomId = generateRoomName();
      } while (await redis.exists(`room:${roomId}`));
      const defaultSheetId = uuidv4();
      const initialState: RoomState = {
        id: roomId,
        sheets: {
          [defaultSheetId]: {
            id: defaultSheetId,
            name: 'Default Sheet',
            assignmentEvents: {},
            encounter: {
              events: [],
              name: 'Default Encounter',
              id: 'default',
              fightLength: 600 // 10 minutes default fight length
            },
            columnCount: 5,
          }
        },
        roster: {
          players: {}
        }
      };
      await redis.set(`room:${roomId}`, JSON.stringify(initialState));
      await Room.create({ roomId, state: initialState });
      res.json({ roomId });
    });

    interface ServerToClientEvents {
      roomState: (roomId: string, state: any) => void;
      error: (error: { message: string }) => void;
      stateUpdate: (roomId: string, update: RoomState) => void;
    }

    interface ClientToServerEvents {
      joinRoom: (roomId: string, callback: (response: any) => void) => void;
      stateUpdate: (roomId: string, state: RoomState) => void;
    }

    const debug = debugModule('engine:socket');

    io.engine.on('connection', (socket) => {
      debug('New transport connection:', socket.transport.name);
      socket.on('upgrade', (transport: Transport) => {
        debug('Transport upgraded from', socket.transport.name, 'to', transport.name);
      });
      socket.on('error', (error: Error) => {
        debug('Transport error:', error);
      });
    });

    io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
      console.log('New client connected', socket.id);
      
      socket.on('disconnect', () => {
        console.log('Client disconnected', socket.id);
      });

      socket.on('joinRoom', async (roomId, callback) => {
        console.log(`Client ${socket.id} attempting to join room ${roomId}`);
        socket.join(roomId);
        let roomData = await redis.get(`room:${roomId}`);
        if (!roomData) {
          console.log(`Room ${roomId} not found in Redis, checking database`);
          const dbRoom = await Room.findOne({ where: { roomId } });
          if (dbRoom) {
            roomData = JSON.stringify(dbRoom.state);
            await redis.set(`room:${roomId}`, roomData);
            console.log(`Room ${roomId} data retrieved from database and cached in Redis`);
          } else {
            console.log(`Room ${roomId} not found in database`);
          }
        }
        if (roomData) {
          console.log(`Emitting initial state for room ${roomId}`);
          const parsedRoomData = JSON.parse(roomData);
          socket.emit('roomState', roomId, parsedRoomData);
          callback({ status: 'success' });
        } else {
          console.log(`Error: Room ${roomId} not found`);
          callback({ status: 'error', message: 'Room not found' });
        }
      });

      socket.on('stateUpdate', async (roomId: string, state: RoomState) => {
        console.log(`Received state update for room ${roomId}`);
        // Update the room state in Redis
        await redis.set(`room:${roomId}`, JSON.stringify(state));
        
        // Update the room state in the database
        await Room.update({ state }, { where: { roomId } });
        
        // Broadcast the updated state to all clients in the room, including the sender
        io.to(roomId).emit('roomState', roomId, state);
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

    // Helper function to apply an action to the server-side state
    async function applyActionToServerState(roomId: string, action: any) {
      // Retrieve the current room state from Redis
      const roomData = await redis.get(`room:${roomId}`);
      
      if (roomData) {
        // Apply the action to the state
        const newState = applyActionToState(JSON.parse(roomData), action);
        
        // Update the room state in Redis
        await redis.set(`room:${roomId}`, JSON.stringify(newState));
        
        // Update the room state in the database
        await Room.update({ state: newState }, { where: { roomId } });
      } else {
        // Handle the case where the room is not found in Redis
        // ...
      }
    }

    // Helper function to apply an action to a room state
    function applyActionToState(state: RoomState, action: any): RoomState {
      // Implement the logic to apply the action to the state
      // ...
      return state;
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();