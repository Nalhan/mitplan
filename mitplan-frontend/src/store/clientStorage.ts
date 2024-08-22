import { ClientStoredMitplan, ClientStoredSheet } from '../types';

const STORAGE_KEY = 'mitplan_client_state';
const THROTTLE_DELAY = 250;    

interface StoredClientState {
  mitplans: {
    [mitplanId: string]: ClientStoredMitplan & {
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
  saveClientState: debounce((mitplanId: string, clientState: ClientStoredMitplan & { sheets: { [sheetId: string]: ClientStoredSheet } }) => {
    const currentState = storageService.loadClientState();
    const newState: StoredClientState = {
      ...currentState,
      mitplans: {
        ...currentState.mitplans,
        [mitplanId]: clientState
      }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    console.log(`Client state saved for mitplan ${mitplanId}:`, clientState);
  }, THROTTLE_DELAY),

  loadClientState: (): StoredClientState => {
    const storedState = localStorage.getItem(STORAGE_KEY);
    const parsedState = storedState ? JSON.parse(storedState) : { mitplans: {} };
    console.log('Loaded client state:', parsedState);
    return parsedState;
  },

  loadMitplanClientState: (mitplanId: string): (ClientStoredMitplan & { sheets: { [sheetId: string]: ClientStoredSheet } }) | null => {
    const state = storageService.loadClientState();
    if (!state.mitplans) {
      console.log(`No mitplans found in client state for mitplan ${mitplanId}`);
      return null;
    }
    const mitplanState = state.mitplans[mitplanId] || null;
    console.log(`Loaded client state for mitplan ${mitplanId}:`, mitplanState);
    return mitplanState;
  },

  clearClientState: () => {
    localStorage.removeItem(STORAGE_KEY);
  }
};