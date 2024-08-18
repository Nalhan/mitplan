import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Mitplan, ServerSyncedMitplan, Sheet, ServerSyncedSheet, AssignmentEventType, Encounter, Player } from '../types';
import { WowSpec, WowClass } from '../data/classes';
import { updateServerState } from './socketService';
import { allEncounters } from '../data/encounters/encounters';
import { storageService } from './clientStorage';
import { v4 as uuidv4 } from 'uuid';


const initialState: { [mitplanId: string]: Mitplan } = {};

// Helper function to extract ServerSyncedSheet data
const getServerSyncedSheet = (sheet: Sheet): ServerSyncedSheet => {
  const { timeScale, ...serverSyncedSheet } = sheet;
  return serverSyncedSheet;
};

// Helper function to extract ServerSyncedMitplan data
const getServerSyncedState = (mitplan: Mitplan): ServerSyncedMitplan => {
  const { activeSheetId, ...serverSyncedMitplan } = mitplan;
  const syncedSheets: { [id: string]: ServerSyncedSheet } = {};
  
  for (const [sheetId, sheet] of Object.entries(mitplan.sheets)) {
    syncedSheets[sheetId] = getServerSyncedSheet(sheet);
  }
  
  return {
    ...serverSyncedMitplan,
    sheets: syncedSheets
  };
};

// Helper function to get the default encounter
const getDefaultEncounter = (): Encounter => {
  const firstEncounterId = Object.keys(allEncounters)[0];
  return allEncounters[firstEncounterId];
};

const mitplansSlice = createSlice({
  name: 'mitplans',
  initialState,
  reducers: {
    setMitplan: (state, action: PayloadAction<{ mitplanId: string; state: ServerSyncedMitplan }>) => {
      const { mitplanId, state: mitplanState } = action.payload;
      
      // Load client state from storage
      const storedClientState = storageService.loadMitplanClientState(mitplanId);
      
      state[mitplanId] = {
        ...mitplanState,
        activeSheetId: storedClientState?.activeSheetId || Object.keys(mitplanState.sheets)[0] || null,
        sheets: Object.entries(mitplanState.sheets).reduce((acc, [sheetId, sheet]) => {
          acc[sheetId] = {
            ...sheet,
            timeScale: storedClientState?.sheets[sheetId]?.timeScale || 5.4
          };
          return acc;
        }, {} as { [id: string]: Sheet })
      };

      // Save client state
      storageService.saveClientState(mitplanId, {
        activeSheetId: state[mitplanId].activeSheetId,
        sheets: Object.entries(state[mitplanId].sheets).reduce((acc, [sheetId, sheet]) => {
          acc[sheetId] = { timeScale: sheet.timeScale };
          return acc;
        }, {} as { [sheetId: string]: { timeScale: number } })
      });
    },
    updateMitplan: (state, action: PayloadAction<{ mitplanId: string; updates: Partial<Mitplan> }>) => {
      const { mitplanId, updates } = action.payload;
      state[mitplanId] = { ...state[mitplanId], ...updates };
      updateServerState(mitplanId, getServerSyncedState(state[mitplanId]));

      // Save client state
      storageService.saveClientState(mitplanId, {
        activeSheetId: state[mitplanId].activeSheetId,
        sheets: Object.entries(state[mitplanId].sheets).reduce((acc, [sheetId, sheet]) => {
          acc[sheetId] = { timeScale: sheet.timeScale };
          return acc;
        }, {} as { [sheetId: string]: { timeScale: number } })
      });
    },
    addSheet: (state, action: PayloadAction<{ mitplanId: string; sheet: Sheet }>) => {
      const { mitplanId, sheet } = action.payload;
      state[mitplanId].sheets[sheet.id] = {
        ...sheet,
        assignmentEvents: sheet.assignmentEvents || {},
        encounter: sheet.encounter || getDefaultEncounter()
      };
      updateServerState(mitplanId, getServerSyncedState(state[mitplanId]));
    },
    deleteSheet: (state, action: PayloadAction<{ mitplanId: string; sheetId: string }>) => {
      const { mitplanId, sheetId } = action.payload;
      delete state[mitplanId].sheets[sheetId];
      if (state[mitplanId].activeSheetId === sheetId) {
        state[mitplanId].activeSheetId = null;
      }
      updateServerState(mitplanId, getServerSyncedState(state[mitplanId]));
    },
    updateSheet: (state, action: PayloadAction<{ mitplanId: string; sheetId: string; updates: Partial<Sheet> }>) => {
      const { mitplanId, sheetId, updates } = action.payload;
      const currentSheet = state[mitplanId].sheets[sheetId];
      state[mitplanId].sheets[sheetId] = { 
        ...currentSheet, 
        ...updates,
        assignmentEvents: updates.assignmentEvents || currentSheet.assignmentEvents || {},
        encounter: updates.encounter || currentSheet.encounter || getDefaultEncounter()
      };
      updateServerState(mitplanId, getServerSyncedState(state[mitplanId]));
    },
    setActiveSheet: (state, action: PayloadAction<{ mitplanId: string; sheetId: string }>) => {
      const { mitplanId, sheetId } = action.payload;
      state[mitplanId].activeSheetId = sheetId;

      // Save client state
      storageService.saveClientState(mitplanId, {
        activeSheetId: sheetId,
        sheets: Object.entries(state[mitplanId].sheets).reduce((acc, [id, sheet]) => {
          acc[id] = { timeScale: sheet.timeScale };
          return acc;
        }, {} as { [sheetId: string]: { timeScale: number } })
      });
    },
    updateAssignmentEvents: (state, action: PayloadAction<{ 
      mitplanId: string; 
      sheetId: string; 
      events: AssignmentEventType | { [eventId: string]: AssignmentEventType } 
    }>) => {
      const { mitplanId, sheetId, events } = action.payload;
      const sheet = state[mitplanId].sheets[sheetId];

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
      updateServerState(mitplanId, getServerSyncedState(state[mitplanId]));
    },
    deleteAssignmentEvents: (state, action: PayloadAction<{ mitplanId: string; sheetId: string; eventId?: string | string[] }>) => {
      const { mitplanId, sheetId, eventId } = action.payload;
      const sheet = state[mitplanId].sheets[sheetId];
      
      if (!sheet.assignmentEvents) {
        sheet.assignmentEvents = {};
      } else if (!eventId) {
        sheet.assignmentEvents = {};
      } else if (Array.isArray(eventId)) {
        eventId.forEach(id => delete sheet.assignmentEvents[id]);
      } else {
        delete sheet.assignmentEvents[eventId];
      }
      updateServerState(mitplanId, getServerSyncedState(state[mitplanId]));
    },
    addAssignmentEvent: (state, action: PayloadAction<{ mitplanId: string; sheetId: string; event: AssignmentEventType }>) => {
      const { mitplanId, sheetId, event } = action.payload;
      const sheet = state[mitplanId].sheets[sheetId];
      
      if (!sheet.assignmentEvents) {
        sheet.assignmentEvents = {};
      }
      
      sheet.assignmentEvents[event.id] = event;
      updateServerState(mitplanId, getServerSyncedState(state[mitplanId]));
    },
    setTimeScale: (state, action: PayloadAction<{ mitplanId: string; sheetId: string; timeScale: number }>) => {
      const { mitplanId, sheetId, timeScale } = action.payload;
      if (state[mitplanId] && state[mitplanId].sheets[sheetId]) {
        state[mitplanId].sheets[sheetId].timeScale = timeScale;

        // Save client state
        storageService.saveClientState(mitplanId, {
          activeSheetId: state[mitplanId].activeSheetId,
          sheets: {
            ...Object.entries(state[mitplanId].sheets).reduce((acc, [id, sheet]) => {
              acc[id] = { timeScale: sheet.timeScale };
              return acc;
            }, {} as { [sheetId: string]: { timeScale: number } }),
            [sheetId]: { timeScale }
          }
        });
      }
    },
    addPlayerToRoster: (state, action: PayloadAction<{ 
      mitplanId: string; 
      name: string; 
      class: WowClass; 
      spec: WowSpec 
    }>) => {
      const { mitplanId, name, class: wowClass, spec } = action.payload;
      const playerId = uuidv4();
      const newPlayer: Player = {
        id: playerId,
        name,
        class: wowClass,
        spec,
        rosterStates: {} // Initialize rosterStates as an empty object
      };
      state[mitplanId].roster.players[playerId] = newPlayer;
      updateServerState(mitplanId, getServerSyncedState(state[mitplanId]));
    },

    removePlayersFromRoster: (state, action: PayloadAction<{ 
      mitplanId: string; 
      playerIds?: string | string[] 
    }>) => {
      const { mitplanId, playerIds } = action.payload;
      if (!playerIds) {
        state[mitplanId].roster.players = {};
      } else if (typeof playerIds === 'string') {
        delete state[mitplanId].roster.players[playerIds];
      } else {
        playerIds.forEach(id => delete state[mitplanId].roster.players[id]);
      }
      updateServerState(mitplanId, getServerSyncedState(state[mitplanId]));
    },

    updatePlayer: (state, action: PayloadAction<{ 
      mitplanId: string; 
      playerId: string; 
      updates: Partial<Omit<Player, 'id'>> 
    }>) => {
      const { mitplanId, playerId, updates } = action.payload;
      if (state[mitplanId].roster.players[playerId]) {
        state[mitplanId].roster.players[playerId] = {
          ...state[mitplanId].roster.players[playerId],
          ...updates
        };
        updateServerState(mitplanId, getServerSyncedState(state[mitplanId]));
      }
    },
  },
});

export const {
  setMitplan,
  updateMitplan,
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
} = mitplansSlice.actions;

export default mitplansSlice.reducer;