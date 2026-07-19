import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type notifStatus = "granted" | "denied" | "undetermined";
export type logincheck = "authenticated" | null;

export interface SessionState {
  isAuth: boolean;
  loading: boolean;
  error: string | null;
  isLogged: logincheck;
  status: boolean;
  isOnboardingCompleted?: boolean;
  hasAccount?: boolean;
  hasAccountNotVerified?: boolean;
}

const initialState: SessionState = {
  isAuth: false,
  isLogged: null,
  loading: false,
  error: null,
  status: false,
  isOnboardingCompleted: false,
  hasAccount: false,
  hasAccountNotVerified: false,
};

const SessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    clearSession: (state) => {
      state.loading = false;
      state.error = null;
      state.isAuth = false;
      state.hasAccount = false;
      state.isLogged = null;
    },
    setLoginSuccess: (state: SessionState, _action: PayloadAction) => {
      state.isAuth = true;
      state.hasAccount = true;
      state.isLogged = "authenticated";
    },
    setIsLogged: (state: SessionState, action: PayloadAction<logincheck>) => {
      state.isLogged = action.payload;
    },
    setAuth: (state: SessionState, action: PayloadAction<boolean>) => {
      state.isAuth = action.payload;
    },
    setOnboardingCompleted: (
      state: SessionState,
      action: PayloadAction<boolean>,
    ) => {
      state.isOnboardingCompleted = action.payload;
    },
    setHasAccount: (state: SessionState, action: PayloadAction<boolean>) => {
      state.hasAccount = action.payload;
    },
    setHasAccountNotVerified: (
      state: SessionState,
      action: PayloadAction<boolean>,
    ) => {
      state.hasAccountNotVerified = action.payload;
    },
  },
});

export const {
  setIsLogged,
  setAuth,
  setOnboardingCompleted,
  setHasAccount,
  setHasAccountNotVerified,
  setLoginSuccess,
  clearSession,
} = SessionSlice.actions;
export default SessionSlice.reducer;
