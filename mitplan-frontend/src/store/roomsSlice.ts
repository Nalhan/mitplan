import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Room, Sheet, AssignmentEventType, EncounterEventType, ServerSyncedRoom } from '../types';
import { updateServerState } from './socketService';

const initialState: { [roomId: string]: Room } = {};

// Helper function to extract ServerSyncedRoom data
const getServerSyncedState = (room: Room): ServerSyncedRoom => {
  const { activeSheetId, timeScale, ...serverSyncedState } = room;
  return serverSyncedState;
};

const roomsSlice = createSlice({
  name: 'rooms',
  initialState,
  reducers: {
    setRoom: (state, action: PayloadAction<{ roomId: string; state: ServerSyncedRoom }>) => {
      const { roomId, state: roomState } = action.payload;
      console.log('Setting room state in reducer:', roomId, roomState);
      
      // Preserve the current activeSheetId if it exists
      const currentActiveSheetId = state[roomId]?.activeSheetId;
      
      state[roomId] = {
        ...roomState,
        activeSheetId: currentActiveSheetId || Object.keys(roomState.sheets)[0] || null
      };
    },
    updateRoom: (state, action: PayloadAction<{ roomId: string; updates: Partial<Room> }>) => {
      const { roomId, updates } = action.payload;
      state[roomId] = { ...state[roomId], ...updates };
      updateServerState(roomId, getServerSyncedState(state[roomId]));
    },
    addSheet: (state, action: PayloadAction<{ roomId: string; sheet: Sheet }>) => {
      const { roomId, sheet } = action.payload;
      state[roomId].sheets[sheet.id] = {
        ...sheet,
        assignmentEvents: sheet.assignmentEvents || {}
      };
      updateServerState(roomId, getServerSyncedState(state[roomId]));
    },
    deleteSheet: (state, action: PayloadAction<{ roomId: string; sheetId: string }>) => {
      const { roomId, sheetId } = action.payload;
      delete state[roomId].sheets[sheetId];
      if (state[roomId].activeSheetId === sheetId) {
        state[roomId].activeSheetId = null;
      }
      updateServerState(roomId, getServerSyncedState(state[roomId]));
    },
    updateSheet: (state, action: PayloadAction<{ roomId: string; sheetId: string; updates: Partial<Sheet> }>) => {
      const { roomId, sheetId, updates } = action.payload;
      state[roomId].sheets[sheetId] = { 
        ...state[roomId].sheets[sheetId], 
        ...updates,
        assignmentEvents: updates.assignmentEvents || state[roomId].sheets[sheetId].assignmentEvents || {}
      };
      updateServerState(roomId, getServerSyncedState(state[roomId]));
    },
    setActiveSheet: (state, action: PayloadAction<{ roomId: string; sheetId: string }>) => {
      const { roomId, sheetId } = action.payload;
      state[roomId].activeSheetId = sheetId;
    },
    updateAssignmentEvents: (state, action: PayloadAction<{ 
      roomId: string; 
      sheetId: string; 
      events: AssignmentEventType | { [eventId: string]: AssignmentEventType } 
    }>) => {
      const { roomId, sheetId, events } = action.payload;
      const sheet = state[roomId].sheets[sheetId];

      if (!sheet.assignmentEvents) {
        sheet.assignmentEvents = {};
      }

      if ('id' in events) {
        // Single event object
        const eventWithStringId = events as AssignmentEventType & { id: string };
        sheet.assignmentEvents[eventWithStringId.id] = eventWithStringId;
      } else {
        // Object with event IDs as keys
        Object.assign(sheet.assignmentEvents, events);
      }
      updateServerState(roomId, getServerSyncedState(state[roomId]));
    },
    deleteAssignmentEvents: (state, action: PayloadAction<{ roomId: string; sheetId: string; eventId?: string | string[] }>) => {
      const { roomId, sheetId, eventId } = action.payload;
      const sheet = state[roomId].sheets[sheetId];
      
      if (!sheet.assignmentEvents) {
        sheet.assignmentEvents = {};
      } else if (!eventId) {
        sheet.assignmentEvents = {};
      } else if (Array.isArray(eventId)) {
        eventId.forEach(id => delete sheet.assignmentEvents[id]);
      } else {
        delete sheet.assignmentEvents[eventId];
      }
      updateServerState(roomId, getServerSyncedState(state[roomId]));
    },
    addAssignmentEvent: (state, action: PayloadAction<{ roomId: string; sheetId: string; event: AssignmentEventType }>) => {
      const { roomId, sheetId, event } = action.payload;
      const sheet = state[roomId].sheets[sheetId];
      
      if (!sheet.assignmentEvents) {
        sheet.assignmentEvents = {};
      }
      
      sheet.assignmentEvents[event.id] = event;
      updateServerState(roomId, getServerSyncedState(state[roomId]));
    },
    updateEncounterEvents: (state, action: PayloadAction<{ roomId: string; sheetId: string; events: EncounterEventType | EncounterEventType[] | { [eventId: number]: Partial<EncounterEventType> } }>) => {
      const { roomId, sheetId, events } = action.payload;
      const sheet = state[roomId].sheets[sheetId];

      if (!Array.isArray(sheet.encounterEvents)) {
        sheet.encounterEvents = [];
      }

      if (Array.isArray(events)) {
        sheet.encounterEvents = events;
      } else if (typeof events === 'object' && events !== null) {
        if ('id' in events) {
          const index = sheet.encounterEvents.findIndex(e => e.id === events.id);
          if (index !== -1) {
            sheet.encounterEvents[index] = { ...sheet.encounterEvents[index], ...events };
          } else {
            sheet.encounterEvents.push(events as EncounterEventType);
          }
        } else {
          Object.entries(events).forEach(([eventId, updates]) => {
            const index = sheet.encounterEvents.findIndex(e => e.id === Number(eventId));
            if (index !== -1) {
              sheet.encounterEvents[index] = { ...sheet.encounterEvents[index], ...updates };
            }
          });
        }
      }
      updateServerState(roomId, getServerSyncedState(state[roomId]));
    },  
    deleteEncounterEvents: (state, action: PayloadAction<{ roomId: string; sheetId: string; eventId?: number | number[] }>) => {
      const { roomId, sheetId, eventId } = action.payload;
      const sheet = state[roomId].sheets[sheetId];

      if (!Array.isArray(sheet.encounterEvents)) {
        sheet.encounterEvents = [];
        return;
      }

      if (eventId === undefined) {
        sheet.encounterEvents = [];
      } else {
        const eventIds = Array.isArray(eventId) ? eventId : [eventId];
        sheet.encounterEvents = sheet.encounterEvents.filter(e => !eventIds.includes(e.id));
      }
      updateServerState(roomId, getServerSyncedState(state[roomId]));
    },
    setTimeScale: (state, action: PayloadAction<{ roomId: string; sheetId: string; timeScale: number }>) => {
      const { roomId, sheetId, timeScale } = action.payload;
      if (state[roomId] && state[roomId].sheets[sheetId]) {
        state[roomId].sheets[sheetId].timeScale = timeScale;
      }
    },
  },
});

export const {
  setRoom,
  updateRoom,
  addSheet,
  deleteSheet,
  updateSheet,
  setActiveSheet,
  updateAssignmentEvents,
  deleteAssignmentEvents,
  updateEncounterEvents,
  deleteEncounterEvents,
  setTimeScale
} = roomsSlice.actions;

export default roomsSlice.reducer;