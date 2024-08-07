import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import VerticalTimeline from './VerticalTimeline';
import CooldownPalette from './CooldownPalette';
import cooldowns from './data/cooldowns.yaml';

function App() {
  const [events, setEvents] = useState([]);
  const [eventName, setEventName] = useState('');
  const [eventTimestamp, setEventTimestamp] = useState(1);
  const [timelineLength, setTimelineLength] = useState(121);
  const [columnCount, setColumnCount] = useState(2);
  const [eventColumn, setEventColumn] = useState(1);

  const fetchEventsFromBackend = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchSettingsFromBackend = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const data = await response.json();
      setTimelineLength(data.timelineLength || 121);
      setColumnCount(data.columnCount || 2);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const updateSettings = async (newTimelineLength, newColumnCount) => {
    try {
      const response = await fetch('http://localhost:5000/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timelineLength: newTimelineLength, columnCount: newColumnCount }),
      });
      if (!response.ok) {
        throw new Error('Failed to update settings');
      }
      console.log('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const createEvent = async (e) => {
    e.preventDefault();
    const newEvent = { 
      key: events.length, 
      name: eventName, 
      timestamp: parseFloat(eventTimestamp),
      columnId: parseInt(eventColumn) || 1
    };
    try {
      const response = await fetch('http://localhost:5000/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([newEvent]),
      });
      if (!response.ok) {
        throw new Error('Failed to create event');
      }
      setEvents((prevEvents) => [...prevEvents, newEvent]);
      setEventName('');
      setEventTimestamp(5);
      setEventColumn(1);
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const clearEvents = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/events', {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to clear events');
      }
      setEvents([]); // Clear local state
      console.log('Events cleared successfully');
    } catch (error) {
      console.error('Error clearing events:', error);
    }
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

  const saveEventsToBackend = async (updatedEvents) => {
    try {
      const response = await fetch('http://localhost:5000/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEvents),
      });
      if (!response.ok) {
        throw new Error('Failed to save events');
      }
      console.log('Events saved successfully');
    } catch (error) {
      console.error('Error saving events:', error);
    }
  };

  useEffect(() => {
    fetchEventsFromBackend();
    fetchSettingsFromBackend();
    const socket = io('http://localhost:5000');
    socket.on('connect', () => {
      console.log('Connected to backend');
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const handleTimelineLengthChange = (e) => {
    const newLength = Math.max(1, parseInt(e.target.value) || 1);
    setTimelineLength(newLength);
    updateSettings(newLength, columnCount);
  };

  const handleColumnCountChange = (e) => {
    const newCount = Math.max(1, parseInt(e.target.value) || 1);
    setColumnCount(newCount);
    updateSettings(timelineLength, newCount);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="App">
        <h1>Mitplan</h1>
        <div>
          <input
            type="number"
            value={timelineLength}
            onChange={handleTimelineLengthChange}
            placeholder="Timeline Length"
            min="1"
          />
          <input
            type="number"
            value={columnCount}
            onChange={handleColumnCountChange}
            placeholder="Number of Columns"
            min="1"
          />
        </div>
        <form onSubmit={createEvent}>
          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="Event Name"
            required
          />
          <input
            type="number"
            value={eventTimestamp}
            onChange={(e) => setEventTimestamp(Number(e.target.value))}
            placeholder="5"
            required
          />
          <input
            type="number"
            value={eventColumn}
            onChange={(e) => setEventColumn(Math.max(1, parseInt(e.target.value) || 1))}
            placeholder="Column"
            min="1"
            max={columnCount}
            required
          />
          <button type="submit">Create Event</button>
        </form>
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
      </div>
    </DndProvider>
  );
}

export default App;