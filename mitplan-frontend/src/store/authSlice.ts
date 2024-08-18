import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppThunk } from '../types';
import axios from 'axios';
import { AuthState, User } from '../types';


const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.isAuthenticated = true;
      state.user = action.payload;
      state.loading = false;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isAuthenticated = false;
      state.user = null;
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.loading = false;
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, setUser, clearUser } = authSlice.actions;

export const checkAuthStatus = (): AppThunk => async (dispatch) => {
  dispatch(loginStart());
  try {
    const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/user`, { withCredentials: true });
    dispatch(loginSuccess(response.data));
  } catch (error) {
    dispatch(loginFailure('Not authenticated'));
  }
};

export const logoutUser = (): AppThunk => async (dispatch) => {
  try {
    await axios.get(`${import.meta.env.VITE_BACKEND_URL}/auth/logout`, { withCredentials: true });
    dispatch(logout());
  } catch (error) {
    console.error('Logout failed:', error);
  }
};

export default authSlice.reducer;