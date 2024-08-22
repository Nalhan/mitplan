import { Mitplan } from '../types';
import { Socket } from 'socket.io-client';

export const updateServerState = (socket: Socket, mitplanId: string, state: Mitplan): void => {
  if (socket) {
    socket.emit('updateState', mitplanId, state);
  }
};