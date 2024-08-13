import { combineReducers, configureStore } from '@reduxjs/toolkit';
import roomsReducer from './roomsSlice';

const rootReducer = combineReducers({
  rooms: roomsReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

const store = configureStore({
  reducer: rootReducer,
});

export type AppDispatch = typeof store.dispatch;

export default store;