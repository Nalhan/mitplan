import io, { Socket } from 'socket.io-client';
import { Mitplan, ServerSyncedMitplan } from '../types';

let socket: Socket | null = null;
let updateStateCallback: ((mitplanId: string, state: Mitplan) => void) | null = null;

export const initializeSocket = (callback: (mitplanId: string, state: Mitplan) => void): Socket => {
  console.log('Initializing socket...');
  updateStateCallback = callback;
  if (!socket) {
    console.log('Creating new socket connection to:', import.meta.env.VITE_BACKEND_URL);
    socket = io(import.meta.env.VITE_BACKEND_URL);

    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('error', (error: Error) => {
      console.error('Socket error:', error);
    });

    socket.on('mitplanState', (mitplanId: string, state: Mitplan) => {
      console.log('Received mitplan state update for mitplan:', mitplanId, state);
      updateStateCallback?.(mitplanId, state);
    });
  } else {
    console.log('Using existing socket connection:', socket.id);
  }
  return socket;
};

export const joinMitplan = (mitplanId: string): Promise<void> => {
  console.log('Attempting to join mitplan:', mitplanId);
  return new Promise((resolve, reject) => {
    if (!socket) {
      console.error('Socket is not initialized');
      reject(new Error('Socket is not initialized'));
      return;
    }

    const timeout = setTimeout(() => {
      console.error('Join mitplan timeout for mitplan:', mitplanId);
      reject(new Error('Join mitplan timeout'));
    }, 10000); // 10 second timeout

    console.log('Emitting joinMitplan event for mitplan:', mitplanId);
    socket.emit('joinMitplan', mitplanId, (response: any) => {
      clearTimeout(timeout);
      console.log('Join mitplan response:', response);
      if (response && response.status === 'success') {
        console.log('Successfully joined mitplan:', mitplanId);
        resolve();
      } else {
        console.error('Failed to join mitplan:', mitplanId, 'Error:', response ? response.message : 'No response');
        reject(new Error(response ? response.message : 'No response from server'));
      }
    });

    // Add a one-time listener for potential errors
    socket.once('error', (error) => {
      clearTimeout(timeout);
      console.error('Socket error while joining mitplan:', error);
      reject(new Error('Socket error: ' + error.message));
    });
  });
};

export const updateServerState = (mitplanId: string, mitplanState: ServerSyncedMitplan) => {
  console.log('Sending state update to server:', mitplanId, mitplanState);
  if (socket) {
    socket.emit('stateUpdate', mitplanId, mitplanState);
  } else {
    console.error('Cannot update server state: Socket is not initialized');
  }
};