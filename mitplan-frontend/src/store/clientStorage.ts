import { ClientStoredRoom, ClientStoredSheet } from '../types';

const STORAGE_KEY = 'mitplan_client_state';
const THROTTLE_DELAY = 250;    

interface StoredClientState {
  rooms: {
    [roomId: string]: ClientStoredRoom & {
      sheets: { [sheetId: string]: ClientStoredSheet }
    }
  }
}

// Debounce function
const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const storageService = {
  saveClientState: debounce((roomId: string, clientState: ClientStoredRoom & { sheets: { [sheetId: string]: ClientStoredSheet } }) => {
    const currentState = storageService.loadClientState();
    const newState: StoredClientState = {
      ...currentState,
      rooms: {
        ...currentState.rooms,
        [roomId]: clientState
      }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    console.log(`Client state saved for room ${roomId}:`, clientState);
  }, THROTTLE_DELAY),

  loadClientState: (): StoredClientState => {
    const storedState = localStorage.getItem(STORAGE_KEY);
    const parsedState = storedState ? JSON.parse(storedState) : { rooms: {} };
    console.log('Loaded client state:', parsedState);
    return parsedState;
  },

  loadRoomClientState: (roomId: string): (ClientStoredRoom & { sheets: { [sheetId: string]: ClientStoredSheet } }) | null => {
    const state = storageService.loadClientState();
    const roomState = state.rooms[roomId] || null;
    console.log(`Loaded client state for room ${roomId}:`, roomState);
    return roomState;
  },

  clearClientState: () => {
    localStorage.removeItem(STORAGE_KEY);
  }
};