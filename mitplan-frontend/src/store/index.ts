import { configureStore } from '@reduxjs/toolkit';
import { roomReducer } from './roomsSlice';
import { syncMiddleware } from './syncMiddleware';
import { RootState } from '../types';

export const store = configureStore({
  reducer: {
    room: roomReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(syncMiddleware),
});

export type AppDispatch = typeof store.dispatch;
export type { RootState };