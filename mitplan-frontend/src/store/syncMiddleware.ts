import { Middleware } from 'redux';
import { getSocket } from './socketService';
import { RootState } from '../types';

// List of action types that should trigger a sync
const syncActions = [
  'room/addSheet',
  'room/deleteSheet',
  'room/updateSheet',
  'room/setActiveSheet',
  'room/updateAssignmentEvents',
  'room/deleteAssignmentEvents',
  'room/updateEncounterEvents',
  'room/deleteEncounterEvents',
  'room/updateRoom',
];

export const syncMiddleware: Middleware<{}, RootState> = store => next => action => {
  const result = next(action);
  
  if (syncActions.includes(action.type)) {
    const newState = store.getState().room;
    if (newState) {
      const socket = getSocket();
      if (socket) {
        socket.emit('stateUpdate', { roomId: newState.id, action: action });
      }
    }
  }
  
  return result;
};