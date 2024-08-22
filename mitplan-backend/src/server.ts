import dotenv from 'dotenv';
import path from 'path';
import express, { Request, Response,  } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import { Transport } from 'engine.io';
import Redis from 'ioredis';
import cors from 'cors';
import bodyParser from 'body-parser';
import { Sequelize, DataTypes, Model } from 'sequelize';
import fs from 'fs';
import { v7 as uuidv7 } from 'uuid';
import debugModule from 'debug';
import passport from 'passport';
import DiscordStrategy from 'passport-discord';
import session from 'express-session';
import { debounce } from 'lodash';

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
}

class User extends Model<UserAttributes> {
  declare id: string;
  declare discordId: string;
  declare username: string;
  declare avatar: string;
  declare email: string;
}

// Wrap your server startup in an async function
const startServer = async () => {
  try {
    const sequelize = await initializeSequelize();

    // Initialize User model first
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
    }, { sequelize, modelName: 'User', tableName: 'Users' });

    // Then initialize Mitplan model
    Mitplan.init({
      mitplanId: {
        type: DataTypes.UUID,
        primaryKey: true
      },
      state: DataTypes.JSONB,
      ownerId: {
        type: DataTypes.STRING,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      }
    }, { sequelize, modelName: 'Mitplan' });

    // Define associations
    User.hasMany(Mitplan, { foreignKey: 'ownerId' });
    Mitplan.belongsTo(User, { foreignKey: 'ownerId' });

    // Sync models with database
    await sequelize.sync({ force: false });

    // Enable CORS
    app.use(cors({
      origin: process.env.FRONTEND_URL,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    }));

    app.use(bodyParser.json());

    // Add express-session middleware
    app.use(session({
      secret: process.env.SESSION_SECRET || 'your_session_secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    }));

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
            id: uuidv7(),
            discordId: profile.id,
            username: profile.username,
            avatar: profile.avatar ?? '',
            email: profile.email ?? '',
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

    // Add these Passport serialization methods
    passport.serializeUser((user: Express.User, done) => {
      // console.log('Serializing user:', user);
      done(null, (user as User).id);
    });

    passport.deserializeUser(async (id: string, done) => {
      // console.log('Deserializing user with id:', id);
      try {
        const user = await User.findByPk(id);
        // console.log('Deserialized user:', user);
        done(null, user);
      } catch (error) {
        // console.error('Error deserializing user:', error);
        done(error);
      }
    });

    // Make sure to initialize Passport after setting up the session middleware
    app.use(passport.initialize());
    app.use(passport.session());

    // Passport routes
    app.get('/auth/discord', passport.authenticate('discord'));

    app.get('/auth/discord/callback', passport.authenticate('discord', {
      failureRedirect: '/login'
    }), (req, res) => {
      res.redirect('/dashboard');
    });

    app.get('/auth/logout', (req, res) => {
      req.logout(() => {
        res.redirect('/logout');
      });
    });

    app.get('/api/user', (req, res) => {
      console.log('GET /api/user request received');
      if (req.user) {
        console.log('User authenticated:', req.user);
        res.json(req.user);
      } else {
        console.log('User not authenticated');
        res.status(401).json({ error: 'Not authenticated' });
      }
    });

    // const mitplans = new Map();

    app.post('/api/mitplans', async (req: Request, res: Response) => {
      const user = req.user as User | undefined;
      
      if (user) {
        // Check the number of mitplans associated with the user
        const mitplanCount = await Mitplan.count({ where: { ownerId: user.id } });
        if (mitplanCount >= 5) {
          return res.status(403).json({ error: 'You have reached the maximum number of mitplans allowed.' });
        }
      }

      const mitplanId = uuidv7();
      const defaultSheetId = uuidv7();
      
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

      try {
        // Always save to Redis
        await redis.set(`mitplan:${mitplanId}`, JSON.stringify(initialState));
        
        if (user) {
          // Save to PostgreSQL only if a user is assigned
          await Mitplan.create({ 
            mitplanId, 
            state: initialState, 
            ownerId: user.id 
          });
          
          console.log(`New mitplan ${mitplanId} created and saved to both Redis and PostgreSQL for user ${user.id}`);
        } else {
          console.log(`New mitplan ${mitplanId} created and saved to Redis (no user assigned)`);
        }

        res.json({ mitplanId });
      } catch (error) {
        console.error('Error creating new mitplan:', error);
        res.status(500).json({ error: 'Failed to create new mitplan' });
      }
    });

    app.get('/api/user/mitplans', async (req: Request, res: Response) => {
      const user = req.user as User | undefined;
      
      if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      try {
        // Fetch mitplans from PostgreSQL using the association
        const dbMitplans = await Mitplan.findAll({
          where: { ownerId: user.id },
          attributes: ['mitplanId', 'state'],
        });
        console.log('Fetched mitplans from database:', dbMitplans);
        // Map the results to the desired format
        const mitplans = dbMitplans.map(mitplan => ({
          mitplanId: mitplan.get('mitplanId') as string,
          state: mitplan.get('state') as MitplanState
        }));
        console.log('Fetched mitplans:', mitplans);
        res.json(mitplans);
      } catch (error) {
        console.error('Error fetching user mitplans:', error);
        res.status(500).json({ error: 'Failed to fetch mitplans' });
      }
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

    const MITPLAN_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
    const mitplanTimeouts = new Map<string, NodeJS.Timeout>();

    // Add this new function to check and restore mitplan state
    async function checkAndRestoreMitplan(mitplanId: string): Promise<MitplanState | null> {
      // First, check if the mitplan exists in Redis
      let mitplanData = await redis.get(`mitplan:${mitplanId}`);
      
      if (!mitplanData) {
        console.log(`Mitplan ${mitplanId} not found in Redis, checking database`);
        
        // If not in Redis, check the database
        const dbMitplan = await Mitplan.findOne({ where: { mitplanId } });
        
        if (dbMitplan) {
          // If found in database, restore to Redis
          mitplanData = JSON.stringify(dbMitplan.state);
          await redis.set(`mitplan:${mitplanId}`, mitplanData);
          console.log(`Mitplan ${mitplanId} restored from database to Redis`);
        } else {
          console.log(`Mitplan ${mitplanId} not found in database`);
          return null;
        }
      }
      
      return JSON.parse(mitplanData);
    }

    io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
      console.log('New client connected', socket.id);
      
      socket.on('disconnect', () => {
        console.log('Client disconnected', socket.id);
        checkMitplanActivity(socket);
      });

      socket.on('joinMitplan', async (mitplanId, callback) => {
        console.log(`Client ${socket.id} attempting to join mitplan ${mitplanId}`);
        
        const mitplanState = await checkAndRestoreMitplan(mitplanId);
        
        if (mitplanState) {
          socket.join(mitplanId);
          clearMitplanTimeout(mitplanId);

          console.log(`Emitting initial state for mitplan ${mitplanId}`);
          socket.emit('mitplanState', mitplanId, mitplanState);
          callback({ status: 'success' });
        } else {
          console.log(`Error: Mitplan ${mitplanId} not found`);
          callback({ status: 'error', message: 'Mitplan not found' });
        }
      });

      socket.on('stateUpdate', async (mitplanId: string, state: MitplanState) => {
        console.log(`Received state update for mitplan ${mitplanId}`);
        clearMitplanTimeout(mitplanId);

        // Update the mitplan state in Redis
        await redis.set(`mitplan:${mitplanId}`, JSON.stringify(state));
        
        // Update the mitplan state in the database
        await Mitplan.update({ state }, { where: { mitplanId } });
        
        // Broadcast the updated state to all clients in the mitplan, including the sender
        io.to(mitplanId).emit('mitplanState', mitplanId, state);
      });
    });

    function clearMitplanTimeout(mitplanId: string) {
      if (mitplanTimeouts.has(mitplanId)) {
        clearTimeout(mitplanTimeouts.get(mitplanId)!);
        mitplanTimeouts.delete(mitplanId);
      }
    }

    function checkMitplanActivity(socket: Socket) {
      for (const [mitplanId] of socket.rooms) {
        if (mitplanId !== socket.id) { // Ignore the socket's personal room
          const clientsInMitplan = io.sockets.adapter.rooms.get(mitplanId);
          if (!clientsInMitplan || clientsInMitplan.size === 0) {
            // No clients left in the mitplan, start the timeout
            const timeout = setTimeout(() => handleMitplanTimeout(mitplanId), MITPLAN_TIMEOUT);
            mitplanTimeouts.set(mitplanId, timeout);
          }
        }
      }
    }

    const SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

    // Set up periodic save job
  setInterval(saveAllMitplanStates, SAVE_INTERVAL);

    async function saveAllMitplanStates() {
      console.log('Starting periodic save of all mitplan states');
      const mitplanIds = await redis.keys('mitplan:*');
      
      for (const key of mitplanIds) {
        const mitplanId = key.split(':')[1];
        const mitplanData = await redis.get(key);
        
        if (mitplanData) {
          try {
            const mitplan = await Mitplan.findOne({ where: { mitplanId } });
            if (mitplan && mitplan.ownerId) {
              await Mitplan.update({ state: JSON.parse(mitplanData) }, { where: { mitplanId } });
              console.log(`Periodic save: Mitplan ${mitplanId} saved to database`);
            } else {
              console.log(`Periodic save: Mitplan ${mitplanId} skipped (no associated user)`);
            }
          } catch (error) {
            console.error(`Error processing mitplan ${mitplanId} during periodic save:`, error);
          }
        }
      }
      
      console.log('Periodic save of all mitplan states completed');
    }

    const handleMitplanTimeout = debounce(async (mitplanId: string) => {
      console.log(`Mitplan timeout for mitplan ${mitplanId}`);
      
      const mitplanData = await redis.get(`mitplan:${mitplanId}`);
      
      if (mitplanData) {
        try {
          const mitplan = await Mitplan.findOne({ where: { mitplanId } });
          if (mitplan && mitplan.ownerId) {
            await Mitplan.update({ state: JSON.parse(mitplanData) }, { where: { mitplanId } });
            console.log(`Mitplan ${mitplanId} saved to database`);
          } else {
            console.log(`Mitplan ${mitplanId} not saved to database (no associated user)`);
          }
          await redis.del(`mitplan:${mitplanId}`);
          console.log(`Mitplan ${mitplanId} removed from Redis`);
        } catch (error) {
          console.error(`Error handling mitplan timeout for mitplan ${mitplanId}:`, error);
        }
      }
      
      mitplanTimeouts.delete(mitplanId);
    }, 1000); // Debounce for 1 second to avoid multiple calls

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

    // Add this cleanup function
    const cleanup = async () => {
      console.log('Server is shutting down. Saving all mitplan states...');
      await saveAllMitplanStates();
      console.log('All mitplan states saved. Exiting...');
      process.exit(0);
    };

    // Register the cleanup function for different exit signals
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('SIGUSR2', cleanup); // For Nodemon restarts

    // Helper function to apply an action to the server-side state
    // async function applyActionToServerState(mitplanId: string, action: any) {
    //   // Retrieve the current mitplan state from Redis
    //   const mitplanData = await redis.get(`mitplan:${mitplanId}`);
      
    //   if (mitplanData) {
    //     // Apply the action to the state
    //     const newState = applyActionToState(JSON.parse(mitplanData), action);
        
    //     // Update the mitplan state in Redis
    //     await redis.set(`mitplan:${mitplanId}`, JSON.stringify(newState));
        
    //     // Update the mitplan state in the database
    //     await Mitplan.update({ state: newState }, { where: { mitplanId } });
    //   } else {
    //     // Handle the case where the mitplan is not found in Redis
    //     // ...
    //   }
    // }

    // Helper function to apply an action to a mitplan state
    // function applyActionToState(state: MitplanState, action: any): MitplanState {
    //   // Implement the logic to apply the action to the state
    //   // ...
    //   return state;
    // }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();