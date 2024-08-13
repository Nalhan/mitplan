import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Room, Sheet, AssignmentEventType, EncounterEventType } from '../types';
import { updateServerState } from './socketService';

const initialState: { [roomId: string]: Room } = {};

const roomsSlice = createSlice({
  name: 'rooms',
  initialState,
  reducers: {
    setRoom: (state, action: PayloadAction<{ roomId: string; state: Room }>) => {
      const { roomId, state: roomState } = action.payload;
      console.log('Setting room state in reducer:', roomId, roomState);
      state[roomId] = roomState;
    },
    updateRoom: (state, action: PayloadAction<{ roomId: string; updates: Partial<Room> }>) => {
      const { roomId, updates } = action.payload;
      state[roomId] = { ...state[roomId], ...updates };
      updateServerState(roomId, state[roomId]);
    },
    addSheet: (state, action: PayloadAction<{ roomId: string; sheet: Sheet }>) => {
      const { roomId, sheet } = action.payload;
      state[roomId].sheets[sheet.id] = {
        ...sheet,
        assignmentEvents: sheet.assignmentEvents || {}
      };
      updateServerState(roomId, state[roomId]);
    },
    deleteSheet: (state, action: PayloadAction<{ roomId: string; sheetId: string }>) => {
      const { roomId, sheetId } = action.payload;
      delete state[roomId].sheets[sheetId];
      if (state[roomId].activeSheetId === sheetId) {
        state[roomId].activeSheetId = null;
      }
      updateServerState(roomId, state[roomId]);
    },
    updateSheet: (state, action: PayloadAction<{ roomId: string; sheetId: string; updates: Partial<Sheet> }>) => {
      const { roomId, sheetId, updates } = action.payload;
      const currentSheet = state[roomId].sheets[sheetId];
      state[roomId].sheets[sheetId] = { 
        ...currentSheet, 
        ...updates,
        assignmentEvents: updates.assignmentEvents || currentSheet.assignmentEvents || {}
      };
      updateServerState(roomId, state[roomId]);
    },
    setActiveSheet: (state, action: PayloadAction<{ roomId: string; sheetId: string }>) => {
      const { roomId, sheetId } = action.payload;
      state[roomId].activeSheetId = sheetId;
      updateServerState(roomId, state[roomId]);
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
        // wow that's fuckin weird just accept the type man
        const eventWithStringId = events as AssignmentEventType & { id: string };
        sheet.assignmentEvents[eventWithStringId.id] = eventWithStringId;
      } else {
        // Object with event IDs as keys
        Object.assign(sheet.assignmentEvents, events);
      }
      updateServerState(roomId, state[roomId]);
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
      updateServerState(roomId, state[roomId]);
    },
    addAssignmentEvent: (state, action: PayloadAction<{ roomId: string; sheetId: string; event: AssignmentEventType }>) => {
      const { roomId, sheetId, event } = action.payload;
      const sheet = state[roomId].sheets[sheetId];
      
      if (!sheet.assignmentEvents) {
        sheet.assignmentEvents = {};
      }
      
      sheet.assignmentEvents[event.id] = event;
      updateServerState(roomId, state[roomId]);
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
      updateServerState(roomId, state[roomId]);
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
      updateServerState(roomId, state[roomId]);
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
  deleteEncounterEvents
} = roomsSlice.actions;

export default roomsSlice.reducer;