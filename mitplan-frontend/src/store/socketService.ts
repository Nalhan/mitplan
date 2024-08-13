import io, { Socket } from 'socket.io-client';
import { Room, ServerSyncedRoom } from '../types';

let socket: Socket | null = null;
let updateStateCallback: ((roomId: string, state: Room) => void) | null = null;

export const initializeSocket = (callback: (roomId: string, state: Room) => void): Socket => {
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

    socket.on('roomState', (roomId: string, state: Room) => {
      console.log('Received room state update for room:', roomId, state);
      updateStateCallback?.(roomId, state);
    });
  } else {
    console.log('Using existing socket connection:', socket.id);
  }
  return socket;
};

export const joinRoom = (roomId: string): Promise<void> => {
  console.log('Attempting to join room:', roomId);
  return new Promise((resolve, reject) => {
    if (!socket) {
      console.error('Socket is not initialized');
      reject(new Error('Socket is not initialized'));
      return;
    }

    const timeout = setTimeout(() => {
      console.error('Join room timeout for room:', roomId);
      reject(new Error('Join room timeout'));
    }, 10000); // 10 second timeout

    console.log('Emitting joinRoom event for room:', roomId);
    socket.emit('joinRoom', roomId, (response: any) => {
      clearTimeout(timeout);
      console.log('Join room response:', response);
      if (response && response.status === 'success') {
        console.log('Successfully joined room:', roomId);
        resolve();
      } else {
        console.error('Failed to join room:', roomId, 'Error:', response ? response.message : 'No response');
        reject(new Error(response ? response.message : 'No response from server'));
      }
    });

    // Add a one-time listener for potential errors
    socket.once('error', (error) => {
      clearTimeout(timeout);
      console.error('Socket error while joining room:', error);
      reject(new Error('Socket error: ' + error.message));
    });
  });
};

export const updateServerState = (roomId: string, roomState: ServerSyncedRoom) => {
  console.log('Sending state update to server:', roomId, roomState);
  if (socket) {
    socket.emit('stateUpdate', roomId, roomState);
  } else {
    console.error('Cannot update server state: Socket is not initialized');
  }
};