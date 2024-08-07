const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors'); // Import cors
const bodyParser = require('body-parser'); // Import bodyParser

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000', // Replace with your frontend URL
    methods: ['GET', 'POST'],
    credentials: true, // Allow credentials if needed
  },
});

// Use CORS middleware
app.use(cors({
  origin: 'http://localhost:3000', // Allow requests from this origin
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true, // Allow credentials if needed
}));

app.use(bodyParser.json()); // Middleware to parse JSON bodies

// Connect to MongoDB
mongoose.connect('mongodb://localhost/mitplan', { useNewUrlParser: true, useUnifiedTopology: true });

// Basic route
app.get('/', (req, res) => {
  res.send('Mitplan Backend is running!');
});

// Handle socket connections
io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Import the MitplanEvent model
const MitplanEvent = require('./models/MitplanEvent'); // Adjust the path as necessary

// Add this code after your existing routes
app.post('/api/events', async (req, res) => {
  const events = req.body;
  try {
    for (const event of events) {
      await MitplanEvent.findOneAndUpdate(
        { key: event.key },
        { ...event, columnId: parseInt(event.columnId) || 1 },
        { upsert: true, new: true }
      );
    }
    console.log('Received events:', events);
    res.status(200).send({ message: 'Events saved/updated successfully' });
  } catch (error) {
    console.error('Error saving/updating events:', error);
    res.status(500).send({ message: 'Error saving/updating events' });
  }
});

app.get('/api/events', async (req, res) => {
  try {
    const events = await MitplanEvent.find(); // Fetch all events
    res.status(200).send(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).send({ message: 'Error fetching events' });
  }
});

app.delete('/api/events', async (req, res) => {
  try {
    await MitplanEvent.deleteMany({}); // Clear all events
    console.log('All events cleared');
    res.status(200).send({ message: 'All events cleared successfully' });
  } catch (error) {
    console.error('Error clearing events:', error);
    res.status(500).send({ message: 'Error clearing events' });
  }
});

// Log incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));