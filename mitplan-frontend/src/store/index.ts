import { combineReducers, configureStore } from '@reduxjs/toolkit';
import mitplansReducer from './mitplansSlice';
import authReducer from './authSlice';

const rootReducer = combineReducers({
  mitplans: mitplansReducer,
  auth: authReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

const store = configureStore({
  reducer: rootReducer,
});

export type AppDispatch = typeof store.dispatch;


export default store;