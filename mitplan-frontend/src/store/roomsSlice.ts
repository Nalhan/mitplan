import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { RoomsState, Room, Sheet, AssignmentEventType, EncounterEventType } from '../types';
import { Socket } from 'socket.io-client';
import { AppThunk } from '../types';

export const fetchRoomData = createAsyncThunk(
  'rooms/fetchRoomData',
  async ({ roomId, socket }: { roomId: string; socket: Socket }, { dispatch }) => {
    return new Promise<Room>((resolve, reject) => {
      socket.emit('joinRoom', roomId);

      socket.on('initialState', (data: Room) => {
        resolve(data);
      });

      socket.on('error', (error: { message: string }) => {
        reject(error.message);
      });
    });
  }
);

export const listenForStateUpdates = (socket: Socket): AppThunk => (dispatch) => {
  socket.on('stateUpdate', (update: Partial<Room>) => {
    dispatch(updateRoom(update));
  });
};

const initialState: RoomsState = {};

const roomsSlice = createSlice({
  name: 'rooms',
  initialState,
  reducers: {
    /**
     * Adds one or more rooms to the state.
     * @param {RoomsState} state - The current state.
     * @param {PayloadAction<Room | Room[]>} action - The action containing the room(s) to add.
     * @param {Room | Room[]} action.payload - The room or array of rooms to add.
     */
    addRoom: (state, action: PayloadAction<Room | Room[]>) => {
      const rooms = Array.isArray(action.payload) ? action.payload : [action.payload];
      rooms.forEach(room => {
        state[room.id] = room;
      });
    },
    /**
     * Deletes one or more rooms from the state.
     * @param {RoomsState} state - The current state.
     * @param {PayloadAction<string | string[]>} action - The action containing the room ID(s) to delete.
     * @param {string | string[]} action.payload - The room ID or array of room IDs to delete.
     */
    deleteRoom: (state, action: PayloadAction<string | string[]>) => {
      const roomIds = Array.isArray(action.payload) ? action.payload : [action.payload];
      roomIds.forEach(id => {
        delete state[id];
      });
    },
    /**
     * Adds one or more sheets to a specific room.
     * @param {RoomsState} state - The current state.
     * @param {PayloadAction<{ roomId: string; sheet: Sheet | Sheet[] }>} action - The action containing the room ID and sheet(s) to add.
     * @param {string} action.payload.roomId - The ID of the room to add the sheet(s) to.
     * @param {Sheet | Sheet[]} action.payload.sheet - The sheet or array of sheets to add.
     */
    addSheet: (state, action: PayloadAction<{ roomId: string; sheet: Sheet | Sheet[] }>) => {
      const { roomId, sheet } = action.payload;
      const sheets = Array.isArray(sheet) ? sheet : [sheet];
      sheets.forEach(s => {
        state[roomId].sheets[s.id] = s;
      });
    },
    /**
     * Deletes one or more sheets from a specific room.
     * @param {RoomsState} state - The current state.
     * @param {PayloadAction<{ roomId: string; sheetId: string | string[] }>} action - The action containing the room ID and sheet ID(s) to delete.
     * @param {string} action.payload.roomId - The ID of the room containing the sheet(s) to delete.
     * @param {string | string[]} action.payload.sheetId - The sheet ID or array of sheet IDs to delete.
     */
    deleteSheet: (state, action: PayloadAction<{ roomId: string; sheetId: string | string[] }>) => {
      const { roomId, sheetId } = action.payload;
      const sheetIds = Array.isArray(sheetId) ? sheetId : [sheetId];
      sheetIds.forEach(id => {
        delete state[roomId].sheets[id];
        if (state[roomId].activeSheetId === id) {
          state[roomId].activeSheetId = null;
        }
      });
    },
    /**
     * Updates one or more sheets in a specific room.
     * @param {RoomsState} state - The current state.
     * @param {PayloadAction<{ roomId: string; updates: { [sheetId: string]: Partial<Sheet> } }>} action - The action containing the room ID and sheet updates.
     * @param {string} action.payload.roomId - The ID of the room containing the sheet(s) to update.
     * @param {{ [sheetId: string]: Partial<Sheet> }} action.payload.updates - An object mapping sheet IDs to their partial updates.
     */
    updateSheet: (state, action: PayloadAction<{ roomId: string; updates: { [sheetId: string]: Partial<Sheet> } }>) => {
      const { roomId, updates } = action.payload;
      Object.entries(updates).forEach(([sheetId, sheetUpdates]) => {
        if (state[roomId].sheets[sheetId]) {
          state[roomId].sheets[sheetId] = { ...state[roomId].sheets[sheetId], ...sheetUpdates };
        }
      });
    },
    /**
     * Sets the active sheet for a specific room.
     * @param {RoomsState} state - The current state.
     * @param {PayloadAction<{ roomId: string; sheetId: string }>} action - The action containing the room ID and sheet ID to set as active.
     * @param {string} action.payload.roomId - The ID of the room.
     * @param {string} action.payload.sheetId - The ID of the sheet to set as active.
     */
    setActiveSheet: (state, action: PayloadAction<{ roomId: string; sheetId: string }>) => {
      const { roomId, sheetId } = action.payload;
      state[roomId].activeSheetId = sheetId;
    },
    /**
     * Updates assignment events for a specific sheet in a room.
     * @param {RoomsState} state - The current state.
     * @param {PayloadAction<{ roomId: string; sheetId: string; events: AssignmentEvent | AssignmentEvent[] | { [eventId: string]: Partial<AssignmentEvent> } }>} action - The action containing the room ID, sheet ID, and event updates.
     * @param {string} action.payload.roomId - The ID of the room.
     * @param {string} action.payload.sheetId - The ID of the sheet.
     * @param {AssignmentEvent | AssignmentEvent[] | { [eventId: string]: Partial<AssignmentEvent> }} action.payload.events - The event updates.
     */
    updateAssignmentEvents: (state, action: PayloadAction<{ 
      roomId: string; 
      sheetId: string; 
      events: AssignmentEventType | AssignmentEventType[] | { [eventId: string]: Partial<AssignmentEventType> } 
    }>) => {
      const { roomId, sheetId, events } = action.payload;
      const sheet = state[roomId].sheets[sheetId];

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
    },
    /**
     * Deletes one or more assignment events from a specific sheet in a room.
     * If no eventId is provided, all events in the sheet will be deleted.
     * @param {RoomsState} state - The current state.
     * @param {PayloadAction<{ roomId: string; sheetId: string; eventId?: string | string[] }>} action - The action containing the room ID, sheet ID, and optional event ID(s) to delete.
     * @param {string} action.payload.roomId - The ID of the room containing the sheet.
     * @param {string} action.payload.sheetId - The ID of the sheet containing the events.
     * @param {string | string[] | undefined} [action.payload.eventId] - The ID(s) of the event(s) to delete. If omitted, all events will be deleted.
     */
    deleteAssignmentEvents: (state, action: PayloadAction<{ 
      roomId: string; 
      sheetId: string; 
      eventId?: string | string[] 
    }>) => {
      const { roomId, sheetId, eventId } = action.payload;
      if (eventId === undefined) {
        // Delete all events
        state[roomId].sheets[sheetId].assignmentEvents = [];
      } else {
        // Existing logic for deleting specific event(s)
        const eventIds = Array.isArray(eventId) ? eventId : [eventId];
        state[roomId].sheets[sheetId].assignmentEvents = state[roomId].sheets[sheetId].assignmentEvents.filter(e => !eventIds.includes(e.id));
      }
    },
    /**
     * Updates encounter events for a specific sheet in a room.
     * @param {RoomsState} state - The current state.
     * @param {PayloadAction<{ roomId: string; sheetId: string; events: encounterTypes.EncounterEventType | encounterTypes.EncounterEventType[] | { [eventId: number]: Partial<encounterTypes.EncounterEventType> } }>} action - The action containing the room ID, sheet ID, and event updates.
     * @param {string} action.payload.roomId - The ID of the room.
     * @param {string} action.payload.sheetId - The ID of the sheet.
     * @param {encounterTypes.EncounterEventType | encounterTypes.EncounterEventType[] | { [eventId: number]: Partial<encounterTypes.EncounterEventType> }} action.payload.events - The encounter event updates.
     */
    updateEncounterEvents: (state, action: PayloadAction<{ 
      roomId: string; 
      sheetId: string; 
      events: EncounterEventType | EncounterEventType[] | { [eventId: number]: Partial<EncounterEventType> } 
    }>) => {
      const { roomId, sheetId, events } = action.payload;
      const sheet = state[roomId].sheets[sheetId];

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
    },
    /**
     * Deletes one or more encounter events from a specific sheet in a room.
     * If no eventId is provided, all encounter events in the sheet will be deleted.
     * @param {RoomsState} state - The current state.
     * @param {PayloadAction<{ roomId: string; sheetId: string; eventId?: number | number[] }>} action - The action containing the room ID, sheet ID, and optional event ID(s) to delete.
     * @param {string} action.payload.roomId - The ID of the room containing the sheet.
     * @param {string} action.payload.sheetId - The ID of the sheet containing the events.
     * @param {number | number[] | undefined} [action.payload.eventId] - The ID(s) of the encounter event(s) to delete. If omitted, all encounter events will be deleted.
     */
    deleteEncounterEvents: (state, action: PayloadAction<{ 
      roomId: string; 
      sheetId: string; 
      eventId?: number | number[] 
    }>) => {
      const { roomId, sheetId, eventId } = action.payload;
      if (eventId === undefined) {
        // Delete all encounter events
        state[roomId].sheets[sheetId].encounterEvents = [];
      } else {
        // Delete specific encounter event(s)
        const eventIds = Array.isArray(eventId) ? eventId : [eventId];
        state[roomId].sheets[sheetId].encounterEvents = state[roomId].sheets[sheetId].encounterEvents.filter(e => !eventIds.includes(e.id));
      }
    },
    updateRoom: (state, action: PayloadAction<Partial<Room>>) => {
      const updates = action.payload;
      if (updates.id) {
        state[updates.id] = { ...state[updates.id], ...updates };
      }
    },
  },
});

export const roomsReducer = roomsSlice.reducer;

export const { 
  addRoom, 
  deleteRoom,
  addSheet, 
  deleteSheet,
  updateSheet,
  setActiveSheet, 
  updateAssignmentEvents,
  deleteAssignmentEvents,
  updateEncounterEvents,
  deleteEncounterEvents,
  updateRoom,
} = roomsSlice.actions;