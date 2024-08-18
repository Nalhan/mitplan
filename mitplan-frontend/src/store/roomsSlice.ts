import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Room, ServerSyncedRoom, Sheet, ServerSyncedSheet, AssignmentEventType, Encounter, Player } from '../types';
import { WowSpec, WowClass } from '../data/classes';
import { updateServerState } from './socketService';
import { allEncounters } from '../data/encounters/encounters';
import { storageService } from './clientStorage';
import { v4 as uuidv4 } from 'uuid';

const initialState: { [roomId: string]: Room } = {};

// Helper function to extract ServerSyncedSheet data
const getServerSyncedSheet = (sheet: Sheet): ServerSyncedSheet => {
  const { timeScale, ...serverSyncedSheet } = sheet;
  return serverSyncedSheet;
};

// Helper function to extract ServerSyncedRoom data
const getServerSyncedState = (room: Room): ServerSyncedRoom => {
  const { activeSheetId, ...serverSyncedRoom } = room;
  const syncedSheets: { [id: string]: ServerSyncedSheet } = {};
  
  for (const [sheetId, sheet] of Object.entries(room.sheets)) {
    syncedSheets[sheetId] = getServerSyncedSheet(sheet);
  }
  
  return {
    ...serverSyncedRoom,
    sheets: syncedSheets
  };
};

// Helper function to get the default encounter
const getDefaultEncounter = (): Encounter => {
  const firstEncounterId = Object.keys(allEncounters)[0];
  return allEncounters[firstEncounterId];
};

const roomsSlice = createSlice({
  name: 'rooms',
  initialState,
  reducers: {
    setRoom: (state, action: PayloadAction<{ roomId: string; state: ServerSyncedRoom }>) => {
      const { roomId, state: roomState } = action.payload;
      
      // Load client state from storage
      const storedClientState = storageService.loadRoomClientState(roomId);
      
      state[roomId] = {
        ...roomState,
        activeSheetId: storedClientState?.activeSheetId || Object.keys(roomState.sheets)[0] || null,
        sheets: Object.entries(roomState.sheets).reduce((acc, [sheetId, sheet]) => {
          acc[sheetId] = {
            ...sheet,
            timeScale: storedClientState?.sheets[sheetId]?.timeScale || 5.4
          };
          return acc;
        }, {} as { [id: string]: Sheet })
      };

      // Save client state
      storageService.saveClientState(roomId, {
        activeSheetId: state[roomId].activeSheetId,
        sheets: Object.entries(state[roomId].sheets).reduce((acc, [sheetId, sheet]) => {
          acc[sheetId] = { timeScale: sheet.timeScale };
          return acc;
        }, {} as { [sheetId: string]: { timeScale: number } })
      });
    },
    updateRoom: (state, action: PayloadAction<{ roomId: string; updates: Partial<Room> }>) => {
      const { roomId, updates } = action.payload;
      state[roomId] = { ...state[roomId], ...updates };
      updateServerState(roomId, getServerSyncedState(state[roomId]));

      // Save client state
      storageService.saveClientState(roomId, {
        activeSheetId: state[roomId].activeSheetId,
        sheets: Object.entries(state[roomId].sheets).reduce((acc, [sheetId, sheet]) => {
          acc[sheetId] = { timeScale: sheet.timeScale };
          return acc;
        }, {} as { [sheetId: string]: { timeScale: number } })
      });
    },
    addSheet: (state, action: PayloadAction<{ roomId: string; sheet: Sheet }>) => {
      const { roomId, sheet } = action.payload;
      state[roomId].sheets[sheet.id] = {
        ...sheet,
        assignmentEvents: sheet.assignmentEvents || {},
        encounter: sheet.encounter || getDefaultEncounter()
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
      const currentSheet = state[roomId].sheets[sheetId];
      state[roomId].sheets[sheetId] = { 
        ...currentSheet, 
        ...updates,
        assignmentEvents: updates.assignmentEvents || currentSheet.assignmentEvents || {},
        encounter: updates.encounter || currentSheet.encounter || getDefaultEncounter()
      };
      updateServerState(roomId, getServerSyncedState(state[roomId]));
    },
    setActiveSheet: (state, action: PayloadAction<{ roomId: string; sheetId: string }>) => {
      const { roomId, sheetId } = action.payload;
      state[roomId].activeSheetId = sheetId;

      // Save client state
      storageService.saveClientState(roomId, {
        activeSheetId: sheetId,
        sheets: Object.entries(state[roomId].sheets).reduce((acc, [id, sheet]) => {
          acc[id] = { timeScale: sheet.timeScale };
          return acc;
        }, {} as { [sheetId: string]: { timeScale: number } })
      });
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
    setTimeScale: (state, action: PayloadAction<{ roomId: string; sheetId: string; timeScale: number }>) => {
      const { roomId, sheetId, timeScale } = action.payload;
      if (state[roomId] && state[roomId].sheets[sheetId]) {
        state[roomId].sheets[sheetId].timeScale = timeScale;

        // Save client state
        storageService.saveClientState(roomId, {
          activeSheetId: state[roomId].activeSheetId,
          sheets: {
            ...Object.entries(state[roomId].sheets).reduce((acc, [id, sheet]) => {
              acc[id] = { timeScale: sheet.timeScale };
              return acc;
            }, {} as { [sheetId: string]: { timeScale: number } }),
            [sheetId]: { timeScale }
          }
        });
      }
    },
    addPlayerToRoster: (state, action: PayloadAction<{ 
      roomId: string; 
      name: string; 
      class: WowClass; 
      spec: WowSpec 
    }>) => {
      const { roomId, name, class: wowClass, spec } = action.payload;
      const playerId = uuidv4();
      const newPlayer: Player = {
        id: playerId,
        name,
        class: wowClass,
        spec,
        rosterStates: {} // Initialize rosterStates as an empty object
      };
      state[roomId].roster.players[playerId] = newPlayer;
      updateServerState(roomId, getServerSyncedState(state[roomId]));
    },

    removePlayersFromRoster: (state, action: PayloadAction<{ 
      roomId: string; 
      playerIds?: string | string[] 
    }>) => {
      const { roomId, playerIds } = action.payload;
      if (!playerIds) {
        state[roomId].roster.players = {};
      } else if (typeof playerIds === 'string') {
        delete state[roomId].roster.players[playerIds];
      } else {
        playerIds.forEach(id => delete state[roomId].roster.players[id]);
      }
      updateServerState(roomId, getServerSyncedState(state[roomId]));
    },

    updatePlayer: (state, action: PayloadAction<{ 
      roomId: string; 
      playerId: string; 
      updates: Partial<Omit<Player, 'id'>> 
    }>) => {
      const { roomId, playerId, updates } = action.payload;
      if (state[roomId].roster.players[playerId]) {
        state[roomId].roster.players[playerId] = {
          ...state[roomId].roster.players[playerId],
          ...updates
        };
        updateServerState(roomId, getServerSyncedState(state[roomId]));
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
  addAssignmentEvent,
  setTimeScale,
  addPlayerToRoster,
  removePlayersFromRoster,
  updatePlayer
} = roomsSlice.actions;

export default roomsSlice.reducer;