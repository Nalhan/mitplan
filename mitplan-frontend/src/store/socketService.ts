import io, { Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeSocket = (): Socket => {
  if (!socket) {
    console.log('Initializing socket connection...');
    socket = io(import.meta.env.VITE_BACKEND_URL as string);
    console.log('Socket connection initialized.');
  }
  return socket;
};

export const getSocket = (): Socket => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

export const joinRoom = (roomId: string) => {
  console.log('trying to join room', roomId);
  if (!socket) {
    console.error('Socket not initialized. Call initializeSocket first.');
    throw new Error('Socket not initialized. Call initializeSocket first.');
  }
  console.log(`Joining room: ${roomId}`);
  socket.emit('joinRoom', roomId);
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