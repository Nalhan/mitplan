import { configureStore } from '@reduxjs/toolkit';
import { roomsReducer } from './roomsSlice';
import { RootState } from '../types';

export const store = configureStore({
  reducer: {
    rooms: roomsReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type { RootState };
