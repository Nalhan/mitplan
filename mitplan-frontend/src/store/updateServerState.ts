import { Room } from '../types';
import { Socket } from 'socket.io-client';

export const updateServerState = (socket: Socket, roomId: string, state: Room): void => {
  if (socket) {
    socket.emit('updateState', roomId, state);
  }
};