const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

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

// Basic route
app.get('/', (req, res) => {
  res.send('Mitplan Backend is running!');
});

io.on('connection', (socket) => {
  console.log('A user connected');

  // Send initial state to the connected client
  sendInitialState(socket);

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });

  socket.on('clearEvents', handleClearEvents);
  socket.on('createEvent', handleCreateEvent);
  socket.on('updateEvents', handleUpdateEvents);
  socket.on('getEvents', handleGetEvents);
  socket.on('getSettings', handleGetSettings);
  socket.on('updateSettings', handleUpdateSettings);
});

async function sendInitialState(socket) {
  try {
    const events = await MitplanEvent.find();
    const settings = await Settings.findOne() || new Settings({ timelineLength: 121, columnCount: 2 });
    socket.emit('initialState', { events, settings });
  } catch (error) {
    console.error('Error sending initial state:', error);
  }
}

async function handleClearEvents() {
  try {
    await MitplanEvent.deleteMany({});
    console.log('All events cleared');
    io.emit('stateUpdate', { events: [] });
  } catch (error) {
    console.error('Error clearing events:', error);
    io.emit('error', { message: 'Error clearing events' });
  }
}

async function handleCreateEvent(newEvent) {
  try {
    const event = new MitplanEvent(newEvent);
    await event.save();
    console.log('Event created:', event);
    const updatedEvents = await MitplanEvent.find();
    io.emit('stateUpdate', { events: updatedEvents });
  } catch (error) {
    console.error('Error creating event:', error);
    io.emit('error', { message: 'Error creating event' });
  }
}

async function handleUpdateEvents(events) {
  try {
    for (const event of events) {
      await MitplanEvent.findOneAndUpdate(
        { key: event.key },
        { ...event, columnId: parseInt(event.columnId) || 1 },
        { upsert: true, new: true }
      );
    }
    console.log('Events updated:', events);
    const updatedEvents = await MitplanEvent.find();
    io.emit('stateUpdate', { events: updatedEvents });
  } catch (error) {
    console.error('Error updating events:', error);
    io.emit('error', { message: 'Error updating events' });
  }
}

async function handleGetEvents(callback) {
  try {
    const events = await MitplanEvent.find();
    callback(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    callback({ error: 'Error fetching events' });
  }
}

async function handleGetSettings(callback) {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({ timelineLength: 121, columnCount: 2 });
      await settings.save();
    }
    callback(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    callback({ error: 'Error fetching settings' });
  }
}

async function handleUpdateSettings(newSettings) {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(newSettings);
    } else {
      settings.timelineLength = newSettings.timelineLength;
      settings.columnCount = newSettings.columnCount;
    }
    await settings.save();
    io.emit('stateUpdate', { settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    io.emit('error', { message: 'Error updating settings' });
  }
}

// Log incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));