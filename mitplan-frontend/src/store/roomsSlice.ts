import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Room, Sheet, AssignmentEventType, EncounterEventType } from '../types';

const initialState: Room | null = null;

const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    /**
     * Sets or updates the room in the state.
     * @param {Room | null} state - The current state.
     * @param {PayloadAction<Room>} action - The action containing the room to set.
     */
    setRoom: (state: Room | null, action: PayloadAction<Room>): Room => {
      return action.payload;
    },
    /**
     * Adds a sheet to the room.
     * @param {Room} state - The current state.
     * @param {PayloadAction<Sheet>} action - The action containing the sheet to add.
     */
    addSheet: (state: Room | null, action: PayloadAction<Sheet>) => {
      if (state) {
        state.sheets[action.payload.id] = action.payload;
      }
    },
    /**
     * Deletes a sheet from the room.
     * @param {Room} state - The current state.
     * @param {PayloadAction<string>} action - The action containing the sheet ID to delete.
     */
    deleteSheet: (state: Room | null, action: PayloadAction<string>) => {
      if (state) {
        delete state.sheets[action.payload];
        if (state.activeSheetId === action.payload) {
          state.activeSheetId = null;
        }
      }
    },
    /**
     * Updates a sheet in the room.
     * @param {Room} state - The current state.
     * @param {PayloadAction<{ sheetId: string; updates: Partial<Sheet> }>} action - The action containing the sheet ID and updates.
     */
    updateSheet: (state: Room | null, action: PayloadAction<{ sheetId: string; updates: Partial<Sheet> }>) => {
      if (state) {
        const { sheetId, updates } = action.payload;
        if (state.sheets[sheetId]) {
          state.sheets[sheetId] = { ...state.sheets[sheetId], ...updates };
        }
      }
    },
    /**
     * Sets the active sheet for the room.
     * @param {Room} state - The current state.
     * @param {PayloadAction<string>} action - The action containing the sheet ID to set as active.
     */
    setActiveSheet: (state: Room | null, action: PayloadAction<string>) => {
      if (state) {
        state.activeSheetId = action.payload;
      }
    },
    /**
     * Updates assignment events for a specific sheet in the room.
     * @param {Room} state - The current state.
     * @param {PayloadAction<{ sheetId: string; events: AssignmentEventType | AssignmentEventType[] | { [eventId: string]: Partial<AssignmentEventType> } }>} action - The action containing the sheet ID and event updates.
     */
    updateAssignmentEvents: (state: Room | null, action: PayloadAction<{ 
      sheetId: string; 
      events: AssignmentEventType | AssignmentEventType[] | { [eventId: string]: Partial<AssignmentEventType> } 
    }>) => {
      if (state) {
        const { sheetId, events } = action.payload;
        const sheet = state.sheets[sheetId];

        if (Array.isArray(events)) {
          events.forEach(event => {
            const index = sheet.assignmentEvents.findIndex(e => e.id === event.id);
            if (index !== -1) {
              sheet.assignmentEvents[index] = { ...sheet.assignmentEvents[index], ...event };
            } else {
              sheet.assignmentEvents.push(event);
            }
          });
        } else if (typeof events === 'object' && events !== null) {
          if ('id' in events) {
            // Single event
            const index = sheet.assignmentEvents.findIndex(e => e.id === events.id);
            if (index !== -1) {
              sheet.assignmentEvents[index] = { ...sheet.assignmentEvents[index], ...events };
            } else {
              sheet.assignmentEvents.push(events as AssignmentEventType);
            }
          } else {
            // Object of updates
            Object.entries(events).forEach(([eventId, updates]) => {
              const index = sheet.assignmentEvents.findIndex(e => e.id === eventId);
              if (index !== -1) {
                sheet.assignmentEvents[index] = { ...sheet.assignmentEvents[index], ...updates };
              }
            });
          }
        }
      }
    },
    /**
     * Deletes assignment events from a specific sheet in the room.
     * @param {Room} state - The current state.
     * @param {PayloadAction<{ sheetId: string; eventId?: string | string[] }>} action - The action containing the sheet ID and optional event ID(s) to delete.
     */
    deleteAssignmentEvents: (state: Room | null, action: PayloadAction<{ 
      sheetId: string; 
      eventId?: string | string[] 
    }>) => {
      if (state) {
        const { sheetId, eventId } = action.payload;
        if (eventId === undefined) {
          // Delete all events
          state.sheets[sheetId].assignmentEvents = [];
        } else {
          // Delete specific event(s)
          const eventIds = Array.isArray(eventId) ? eventId : [eventId];
          state.sheets[sheetId].assignmentEvents = state.sheets[sheetId].assignmentEvents.filter(e => !eventIds.includes(e.id));
        }
      }
    },
    updateEncounterEvents: (state, action: PayloadAction<{ sheetId: string; events: EncounterEventType | EncounterEventType[] | { [eventId: number]: Partial<EncounterEventType> } }>) => {
      if (state) {
        const { sheetId, events } = action.payload;
        const sheet = state.sheets[sheetId];

        if (Array.isArray(events)) {
          sheet.encounterEvents = events;
        } else if (typeof events === 'object' && events !== null) {
          if ('id' in events) {
            // Single event
            const index = sheet.encounterEvents.findIndex(e => e.id === events.id);
            if (index !== -1) {
              sheet.encounterEvents[index] = { ...sheet.encounterEvents[index], ...events };
            } else {
              sheet.encounterEvents.push(events as EncounterEventType);
            }
          } else {
            // Object of updates
            Object.entries(events).forEach(([eventId, updates]) => {
              const index = sheet.encounterEvents.findIndex(e => e.id === Number(eventId));
              if (index !== -1) {
                sheet.encounterEvents[index] = { ...sheet.encounterEvents[index], ...updates };
              }
            });
          }
        }
      }
    },
    deleteEncounterEvents: (state, action: PayloadAction<{ sheetId: string; eventId?: number | number[] }>) => {
      if (state) {
        const { sheetId, eventId } = action.payload;
        if (eventId === undefined) {
          // Delete all encounter events
          state.sheets[sheetId].encounterEvents = [];
        } else {
          // Delete specific encounter event(s)
          const eventIds = Array.isArray(eventId) ? eventId : [eventId];
          state.sheets[sheetId].encounterEvents = state.sheets[sheetId].encounterEvents.filter(e => !eventIds.includes(e.id));
        }
      }
    },
    updateRoom: (state, action: PayloadAction<Partial<Room>>) => {
      if (state) {
        return { ...state, ...action.payload };
      }
      return state;
    },
  },
});

export const roomReducer = roomSlice.reducer;

export const { 
  setRoom,
  addSheet, 
  deleteSheet,
  updateSheet,
  setActiveSheet, 
  updateAssignmentEvents,
  deleteAssignmentEvents,
  updateEncounterEvents,
  deleteEncounterEvents,
  updateRoom,
} = roomSlice.actions;