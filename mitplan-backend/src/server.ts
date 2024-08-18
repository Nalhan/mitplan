import dotenv from 'dotenv';
import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
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
import passport from 'passport';
import DiscordStrategy from 'passport-discord';

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
  ownerId: string;
}

class Mitplan extends Model<MitplanAttributes> implements MitplanAttributes {
  public mitplanId!: string;
  public state!: any;
  public ownerId!: string;
}

// Define User model
interface UserAttributes {
  id: string;
  discordId: string;
  username: string;
  avatar: string;
  email: string;
  mitplans: string[];
}

class User extends Model<UserAttributes> implements UserAttributes {
  public id!: string;
  public discordId!: string;
  public username!: string;
  public avatar!: string;
  public email!: string;
  public mitplans!: string[];
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
      state: DataTypes.JSONB,
      ownerId: {
        type: DataTypes.STRING,
        references: {
          model: 'User',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      }
    }, { sequelize, modelName: 'Mitplan' });

    User.init({
      id: {
        type: DataTypes.STRING,
        primaryKey: true
      },
      discordId: {
        type: DataTypes.STRING,
        unique: true
      },
      username: DataTypes.STRING,
      avatar: DataTypes.STRING,
      email: DataTypes.STRING,
      mitplans: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
      }
    }, { sequelize, modelName: 'User' });

    await sequelize.sync();

    // Enable CORS
    app.use(cors({
      origin: process.env.FRONTEND_URL,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    }));

    app.use(bodyParser.json());

    // Passport configuration
    passport.use(new DiscordStrategy({
      clientID: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      callbackURL: process.env.DISCORD_CALLBACK_URL!,
      scope: ['identify', 'email']
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ where: { discordId: profile.id } });
        if (!user) {
          user = await User.create({
            id: uuidv4(),
            discordId: profile.id,
            username: profile.username,
            avatar: profile.avatar ?? '',
            email: profile.email ?? '',
            mitplans: []
          });
        } else {
          await user.update({
            username: profile.username,
            avatar: profile.avatar ?? '',
            email: profile.email ?? ''
          });
        }
        done(null, user);
      } catch (error) {
        done(error as Error);
      }
    }));

    // Passport routes
    app.get('/auth/discord', passport.authenticate('discord'));

    app.get('/auth/discord/callback', passport.authenticate('discord', {
      failureRedirect: '/login'
    }), (req, res) => {
      res.redirect('/dashboard');
    });

    app.get('/auth/logout', (req, res) => {
      req.logout(() => {
        res.redirect('/');
      });
    });

    app.get('/api/user', (req, res) => {
      if (req.user) {
        res.json(req.user);
      } else {
        res.status(401).json({ error: 'Not authenticated' });
      }
    });

    const mitplans = new Map();

    app.post('/api/mitplans', async (req: Request, res: Response) => {
      const user = req.user as User | undefined;
      
      if (user) {
        if (user.mitplans.length >= 5) {
          return res.status(403).json({ error: 'You have reached the maximum number of mitplans allowed.' });
        }
      }

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
      
      if (user) {
        await Mitplan.create({ mitplanId, state: initialState, ownerId: user.id });
        user.mitplans.push(mitplanId);
        await user.save();
      }

      res.json({ mitplanId });
    });

    app.get('/api/user/mitplans', async (req: Request, res: Response) => {
      const user = req.user as User | undefined;
      
      if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const mitplans = await Mitplan.findAll({ where: { ownerId: user.id } });
      res.json(mitplans);
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