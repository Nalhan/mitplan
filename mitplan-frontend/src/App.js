import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import VerticalTimeline from './components/VerticalTimeline';
import CooldownPalette from './components/CooldownPalette';
import EventForm from './components/EventForm';
import cooldowns from './data/cooldowns.yaml';

function App() {
  const [events, setEvents] = useState([]);
  const [timelineLength, setTimelineLength] = useState(null);
  const [columnCount, setColumnCount] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    
    newSocket.on('connect', () => {
      console.log('Connected to backend');
    });

    newSocket.on('initialState', (data) => {
      if (data.events) setEvents(data.events);
      if (data.settings) {
        setTimelineLength(data.settings.timelineLength);
        setColumnCount(data.settings.columnCount);
      }
    });

    newSocket.on('stateUpdate', (data) => {
      if (data.events) setEvents(data.events);
      if (data.settings) {
        setTimelineLength(data.settings.timelineLength);
        setColumnCount(data.settings.columnCount);
      }
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && timelineLength !== null && columnCount !== null) {
      socket.emit('updateSettings', { timelineLength, columnCount });
    }
  }, [timelineLength, columnCount, socket]);

  const createEvent = (formData) => {
    if (!socket) {
      console.error('Socket connection not established');
      return;
    }
    const newEvent = { 
      key: events.length, 
      name: formData.eventName, 
      timestamp: parseFloat(formData.eventTimestamp),
      columnId: parseInt(formData.eventColumn) || 1
    };
    socket.emit('createEvent', newEvent);
  };

  const clearEvents = () => {
    if (!socket) {
      console.error('Socket connection not established');
      return;
    }
    socket.emit('clearEvents');
  };

  const moveEvent = (id, newTimestamp, columnId) => {
    if (!Array.isArray(events)) {
      console.error('Events is not an array:', events);
      return;
    }
    const updatedEvents = events.map(event => {
      if (event.key === id) {
        return { ...event, timestamp: parseFloat(newTimestamp.toFixed(2)), columnId };
      }
      return event;
    });

    setEvents(updatedEvents);
    saveEventsToBackend(updatedEvents);
  };

  const saveEventsToBackend = (updatedEvents) => {
    if (!socket) {
      console.error('Socket connection not established');
      return;
    }
    socket.emit('updateEvents', updatedEvents);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="App">
        <h1>Mitplan</h1>
        {timelineLength !== null && columnCount !== null ? (
          <>
            <div>
              <input
                type="number"
                value={timelineLength}
                onChange={(e) => setTimelineLength(Math.max(1, parseInt(e.target.value) || 1))}
                placeholder="Timeline Length"
                min="1"
              />
              <input
                type="number"
                value={columnCount}
                onChange={(e) => setColumnCount(Math.max(1, parseInt(e.target.value) || 1))}
                placeholder="Number of Columns"
                min="1"
              />
            </div>
            <EventForm onSubmit={createEvent} columnCount={columnCount} />
            <button onClick={clearEvents}>Clear Events</button>
            <div className="content">
              <CooldownPalette cooldowns={cooldowns} />
              <VerticalTimeline 
                events={events} 
                moveEvent={moveEvent} 
                timelineLength={timelineLength}
                columnCount={columnCount}
              />
            </div>
          </>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </DndProvider>
  );
}

export default App;