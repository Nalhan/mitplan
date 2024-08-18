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
import generateMitplanId from './utils/mitplanIdGenerator';
import { v4 as uuidv4 } from 'uuid';
import debugModule from 'debug';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Define MitplanState interface
interface MitplanState {
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

// Define Mitplan model
interface MitplanAttributes {
  mitplanId: string;
  state: any;
}

class Mitplan extends Model<MitplanAttributes> implements MitplanAttributes {
  public mitplanId!: string;
  public state!: any;
}

// Wrap your server startup in an async function
const startServer = async () => {
  try {
    const sequelize = await initializeSequelize();

    Mitplan.init({
      mitplanId: {
        type: DataTypes.STRING,
        primaryKey: true
      },
      state: DataTypes.JSONB
    }, { sequelize, modelName: 'Mitplan' });

    await sequelize.sync();

    // Enable CORS
    app.use(cors({
      origin: process.env.FRONTEND_URL,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    }));

    app.use(bodyParser.json());

    const mitplans = new Map();

    app.post('/api/mitplans', async (req: Request, res: Response) => {
      let mitplanId: string;
      do {
        mitplanId = generateMitplanId();
      } while (await redis.exists(`mitplan:${mitplanId}`));
      const defaultSheetId = uuidv4();
      const initialState: MitplanState = {
        id: mitplanId,
        sheets: {
          [defaultSheetId]: {
            id: defaultSheetId,
            name: 'Sheet 1',
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
      await redis.set(`mitplan:${mitplanId}`, JSON.stringify(initialState));
      await Mitplan.create({ mitplanId, state: initialState });
      res.json({ mitplanId });
    });

    interface ServerToClientEvents {
      mitplanState: (mitplanId: string, state: any) => void;
      error: (error: { message: string }) => void;
      stateUpdate: (mitplanId: string, update: MitplanState) => void;
    }

    interface ClientToServerEvents {
      joinMitplan: (mitplanId: string, callback: (response: any) => void) => void;
      stateUpdate: (mitplanId: string, state: MitplanState) => void;
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

      socket.on('joinMitplan', async (mitplanId, callback) => {
        console.log(`Client ${socket.id} attempting to join mitplan ${mitplanId}`);
        socket.join(mitplanId);
        let mitplanData = await redis.get(`mitplan:${mitplanId}`);
        if (!mitplanData) {
          console.log(`Mitplan ${mitplanId} not found in Redis, checking database`);
          const dbMitplan = await Mitplan.findOne({ where: { mitplanId } });
          if (dbMitplan) {
            mitplanData = JSON.stringify(dbMitplan.state);
            await redis.set(`mitplan:${mitplanId}`, mitplanData);
            console.log(`Mitplan ${mitplanId} data retrieved from database and cached in Redis`);
          } else {
            console.log(`Mitplan ${mitplanId} not found in database`);
          }
        }
        if (mitplanData) {
          console.log(`Emitting initial state for mitplan ${mitplanId}`);
          const parsedMitplanData = JSON.parse(mitplanData);
          socket.emit('mitplanState', mitplanId, parsedMitplanData);
          callback({ status: 'success' });
        } else {
          console.log(`Error: Mitplan ${mitplanId} not found`);
          callback({ status: 'error', message: 'Mitplan not found' });
        }
      });

      socket.on('stateUpdate', async (mitplanId: string, state: MitplanState) => {
        console.log(`Received state update for mitplan ${mitplanId}`);
        // Update the mitplan state in Redis
        await redis.set(`mitplan:${mitplanId}`, JSON.stringify(state));
        
        // Update the mitplan state in the database
        await Mitplan.update({ state }, { where: { mitplanId } });
        
        // Broadcast the updated state to all clients in the mitplan, including the sender
        io.to(mitplanId).emit('mitplanState', mitplanId, state);
      });
    });

    app.post('/api/mitplans/:mitplanId/save', async (req: Request, res: Response) => {
      const { mitplanId } = req.params;
      const mitplanData = await redis.get(`mitplan:${mitplanId}`);
      if (mitplanData) {
        await Mitplan.update({ state: JSON.parse(mitplanData) }, { where: { mitplanId } });
        res.json({ message: 'Mitplan state saved successfully' });
      } else {
        res.status(404).json({ message: 'Mitplan not found' });
      }
    });

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

    // Helper function to apply an action to the server-side state
    async function applyActionToServerState(mitplanId: string, action: any) {
      // Retrieve the current mitplan state from Redis
      const mitplanData = await redis.get(`mitplan:${mitplanId}`);
      
      if (mitplanData) {
        // Apply the action to the state
        const newState = applyActionToState(JSON.parse(mitplanData), action);
        
        // Update the mitplan state in Redis
        await redis.set(`mitplan:${mitplanId}`, JSON.stringify(newState));
        
        // Update the mitplan state in the database
        await Mitplan.update({ state: newState }, { where: { mitplanId } });
      } else {
        // Handle the case where the mitplan is not found in Redis
        // ...
      }
    }

    // Helper function to apply an action to a mitplan state
    function applyActionToState(state: MitplanState, action: any): MitplanState {
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