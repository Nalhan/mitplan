import { combineReducers, configureStore } from '@reduxjs/toolkit';
import mitplansReducer from './mitplansSlice';

const rootReducer = combineReducers({
  mitplans: mitplansReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

const store = configureStore({
  reducer: rootReducer,
});

export type AppDispatch = typeof store.dispatch;

export default store;