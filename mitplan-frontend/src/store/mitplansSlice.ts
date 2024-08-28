import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { Mitplan, ServerSyncedMitplan, Sheet, ServerSyncedSheet, AssignmentEventType, Encounter, Player } from '../types';
import { WowSpec, WowClass } from '../data/classes';
import { updateServerState } from './socketService';
import { allEncounters } from '../data/encounters/encounters';
import { storageService } from './clientStorage';
import { v4 as uuidv4 } from 'uuid';

interface MitplansState {
  mitplans: { [mitplanId: string]: Mitplan };
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: MitplansState = {
  mitplans: {},
  status: 'idle',
  error: null
};

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

// Add this new thunk
export const createMitplan = createAsyncThunk(
  'mitplans/createMitplan',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post<{ mitplanId: string }>(
        `${import.meta.env.VITE_BACKEND_URL}/api/mitplans`,
        {},
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data);
      }
      return rejectWithValue('An unexpected error occurred');
    }
  }
);

const mitplansSlice = createSlice({
  name: 'mitplans',
  initialState,
  reducers: {
    setMitplan: (state, action: PayloadAction<{ mitplanId: string; state: ServerSyncedMitplan }>) => {
      const { mitplanId, state: mitplanState } = action.payload;
      
      // Load client state from storage
      const storedClientState = storageService.loadMitplanClientState(mitplanId);
      
      state.mitplans[mitplanId] = {
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
        activeSheetId: state.mitplans[mitplanId].activeSheetId,
        sheets: Object.entries(state.mitplans[mitplanId].sheets).reduce((acc, [sheetId, sheet]) => {
          acc[sheetId] = { timeScale: sheet.timeScale };
          return acc;
        }, {} as { [sheetId: string]: { timeScale: number } })
      });
    },
    updateMitplan: (state, action: PayloadAction<{ mitplanId: string; updates: Partial<Mitplan> }>) => {
      const { mitplanId, updates } = action.payload;
      state.mitplans[mitplanId] = { ...state.mitplans[mitplanId], ...updates };
      updateServerState(mitplanId, getServerSyncedState(state.mitplans[mitplanId]));

      // Save client state
      storageService.saveClientState(mitplanId, {
        activeSheetId: state.mitplans[mitplanId].activeSheetId,
        sheets: Object.entries(state.mitplans[mitplanId].sheets).reduce((acc, [sheetId, sheet]) => {
          acc[sheetId] = { timeScale: sheet.timeScale };
          return acc;
        }, {} as { [sheetId: string]: { timeScale: number } })
      });
    },
    addSheet: (state, action: PayloadAction<{ mitplanId: string; sheet: Sheet }>) => {
      const { mitplanId, sheet } = action.payload;
      state.mitplans[mitplanId].sheets[sheet.id] = {
        ...sheet,
        assignmentEvents: sheet.assignmentEvents || {},
        encounterId: sheet.encounterId || 'Default'
      };
      updateServerState(mitplanId, getServerSyncedState(state.mitplans[mitplanId]));
    },
    deleteSheet: (state, action: PayloadAction<{ mitplanId: string; sheetId: string }>) => {
      const { mitplanId, sheetId } = action.payload;
      delete state.mitplans[mitplanId].sheets[sheetId];
      if (state.mitplans[mitplanId].activeSheetId === sheetId) {
        state.mitplans[mitplanId].activeSheetId = null;
      }
      updateServerState(mitplanId, getServerSyncedState(state.mitplans[mitplanId]));
    },
    updateSheet: (state, action: PayloadAction<{ mitplanId: string; sheetId: string; updates: Partial<Sheet> }>) => {
      const { mitplanId, sheetId, updates } = action.payload;
      const currentSheet = state.mitplans[mitplanId].sheets[sheetId];
      state.mitplans[mitplanId].sheets[sheetId] = { 
        ...currentSheet, 
        ...updates,
        assignmentEvents: updates.assignmentEvents || currentSheet.assignmentEvents || {},
        encounterId: updates.encounterId || currentSheet.encounterId || 'Default'
      };
      updateServerState(mitplanId, getServerSyncedState(state.mitplans[mitplanId]));
    },
    setActiveSheet: (state, action: PayloadAction<{ mitplanId: string; sheetId: string }>) => {
      const { mitplanId, sheetId } = action.payload;
      state.mitplans[mitplanId].activeSheetId = sheetId;

      // Save client state
      storageService.saveClientState(mitplanId, {
        activeSheetId: sheetId,
        sheets: Object.entries(state.mitplans[mitplanId].sheets).reduce((acc, [id, sheet]) => {
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
      const sheet = state.mitplans[mitplanId].sheets[sheetId];

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
      updateServerState(mitplanId, getServerSyncedState(state.mitplans[mitplanId]));
    },
    deleteAssignmentEvents: (state, action: PayloadAction<{ mitplanId: string; sheetId: string; eventId?: string | string[] }>) => {
      const { mitplanId, sheetId, eventId } = action.payload;
      const sheet = state.mitplans[mitplanId].sheets[sheetId];
      
      if (!sheet.assignmentEvents) {
        sheet.assignmentEvents = {};
      } else if (!eventId) {
        sheet.assignmentEvents = {};
      } else if (Array.isArray(eventId)) {
        eventId.forEach(id => delete sheet.assignmentEvents[id]);
      } else {
        delete sheet.assignmentEvents[eventId];
      }
      updateServerState(mitplanId, getServerSyncedState(state.mitplans[mitplanId]));
    },
    addAssignmentEvent: (state, action: PayloadAction<{ mitplanId: string; sheetId: string; event: AssignmentEventType }>) => {
      const { mitplanId, sheetId, event } = action.payload;
      const sheet = state.mitplans[mitplanId].sheets[sheetId];
      
      if (!sheet.assignmentEvents) {
        sheet.assignmentEvents = {};
      }
      
      sheet.assignmentEvents[event.id] = event;
      updateServerState(mitplanId, getServerSyncedState(state.mitplans[mitplanId]));
    },
    setTimeScale: (state, action: PayloadAction<{ mitplanId: string; sheetId: string; timeScale: number }>) => {
      const { mitplanId, sheetId, timeScale } = action.payload;
      if (state.mitplans[mitplanId] && state.mitplans[mitplanId].sheets[sheetId]) {
        state.mitplans[mitplanId].sheets[sheetId].timeScale = timeScale;

        // Save client state
        storageService.saveClientState(mitplanId, {
          activeSheetId: state.mitplans[mitplanId].activeSheetId,
          sheets: {
            ...Object.entries(state.mitplans[mitplanId].sheets).reduce((acc, [id, sheet]) => {
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
      state.mitplans[mitplanId].roster.players[playerId] = newPlayer;
      updateServerState(mitplanId, getServerSyncedState(state.mitplans[mitplanId]));
    },

    removePlayersFromRoster: (state, action: PayloadAction<{ 
      mitplanId: string; 
      playerIds?: string | string[] 
    }>) => {
      const { mitplanId, playerIds } = action.payload;
      if (!playerIds) {
        state.mitplans[mitplanId].roster.players = {};
      } else if (typeof playerIds === 'string') {
        delete state.mitplans[mitplanId].roster.players[playerIds];
      } else {
        playerIds.forEach(id => delete state.mitplans[mitplanId].roster.players[id]);
      }
      updateServerState(mitplanId, getServerSyncedState(state.mitplans[mitplanId]));
    },

    updatePlayer: (state, action: PayloadAction<{ 
      mitplanId: string; 
      playerId: string; 
      updates: Partial<Omit<Player, 'id'>> 
    }>) => {
      const { mitplanId, playerId, updates } = action.payload;
      if (state.mitplans[mitplanId].roster.players[playerId]) {
        state.mitplans[mitplanId].roster.players[playerId] = {
          ...state.mitplans[mitplanId].roster.players[playerId],
          ...updates
        };
        updateServerState(mitplanId, getServerSyncedState(state.mitplans[mitplanId]));
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createMitplan.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createMitplan.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Initialize the new mitplan in the state
        const mitplanId = action.payload.mitplanId;
        const defaultSheetId = uuidv4();
        state.mitplans[mitplanId] = {
          id: mitplanId,
          activeSheetId: defaultSheetId,
          sheets: {
            [defaultSheetId]: {
              id: defaultSheetId,
              name: 'Sheet 1',
              assignmentEvents: {},
              encounterId: 'Default',
              columnCount: 5,
              timeScale: 5.4
            }
          },
          roster: {
            players: {}
          }
        };
      })
      .addCase(createMitplan.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
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