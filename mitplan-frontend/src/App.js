import React, { useState, useCallback, useEffect } from 'react';
import io from 'socket.io-client';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import VerticalTimeline from './components/VerticalTimeline';
import CooldownPalette from './components/CooldownPalette';
import EventForm from './components/EventForm';
import useDataFetching from './hooks/useDataFetching';
import cooldowns from './data/cooldowns.yaml';

function App() {
  const [events, setEvents] = useState([]);
  const [timelineLength, setTimelineLength] = useState(121);
  const [columnCount, setColumnCount] = useState(2);

  const fetchedEvents = useDataFetching('http://localhost:5000/api/events', []);
  const fetchedSettings = useDataFetching('http://localhost:5000/api/settings', {});

  useEffect(() => {
    if (fetchedEvents.length > 0) setEvents(fetchedEvents);
    if (fetchedSettings.timelineLength) setTimelineLength(fetchedSettings.timelineLength);
    if (fetchedSettings.columnCount) setColumnCount(fetchedSettings.columnCount);
  }, [fetchedEvents, fetchedSettings]);

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
      name: e.eventName, 
      timestamp: parseFloat(e.eventTimestamp),
      columnId: parseInt(e.eventColumn) || 1
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
    const socket = io('http://localhost:5000');
    
    socket.on('connect', () => {
      console.log('Connected to backend');
    });

    socket.on('stateUpdate', (data) => {
      if (data.events) setEvents(data.events);
      if (data.settings) {
        setTimelineLength(data.settings.timelineLength || 121);
        setColumnCount(data.settings.columnCount || 2);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="App">
        <h1>Mitplan</h1>
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
      </div>
    </DndProvider>
  );
}

export default App;