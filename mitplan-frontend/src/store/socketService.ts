import io, { Socket } from 'socket.io-client';
import { AppDispatch } from './index';
import { setRoom, updateRoom } from './roomsSlice';
import { store } from './index'; // Import the store

let socket: Socket | null = null;

const getDispatch = (): AppDispatch => store.dispatch;

export const initializeSocket = (): Socket => {
  if (!socket) {
    console.log('Initializing socket connection...');
    socket = io(import.meta.env.VITE_BACKEND_URL);

    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socket.on('serverUpdate', (action) => {
      // Dispatch the action to update local state
      store.dispatch(action);
    });

    console.log('Socket connection initialized.');
  }
  return socket;
};

export const joinRoom = (roomId: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    console.log('Attempting to join room:', roomId);
    if (!socket) {
      console.error('Socket not initialized. Call initializeSocket first.');
      reject(new Error('Socket not initialized'));
      return;
    }

    socket.emit('joinRoom', roomId, (error: any, data: any) => {
      if (error) {
        console.error('Error joining room:', error);
        reject(error);
      } else {
        console.log('Joined room successfully, received data:', data);
        // Set up room-specific event listeners
        setupRoomListeners(roomId);
        resolve(data);
      }
    });
  });
};

const setupRoomListeners = (roomId: string) => {
  if (!socket) return;

  socket.on('initialState', (state) => {
    console.log('Received initial state:', state);
    getDispatch()(setRoom(state));
  });

  socket.on('stateUpdate', (update) => {
    console.log('Received state update:', update);
    getDispatch()(updateRoom(update));
  });
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log('Disconnecting socket...');
    socket.disconnect();
    socket = null;
    console.log('Socket disconnected.');
  } else {
    console.log('No socket connection to disconnect.');
  }
};

export const leaveRoom = (roomId: string) => {
  if (socket) {
    socket.emit('leaveRoom', roomId);
    // Remove room-specific listeners
    socket.off('initialState');
    socket.off('stateUpdate');
  }
};