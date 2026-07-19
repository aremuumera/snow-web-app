// Web token manager - replaces Expo SecureStore TokenManager
const TOKEN_KEY = "atex_token";
const NOTIFICATION_TOKEN_KEY = "atex_notification_token";

export const TokenManager = {
  getToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken: (token: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, token);
  },
  removeToken: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("atex_firebase_token");
  },
  getNotificationToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(NOTIFICATION_TOKEN_KEY);
  },
  setNotificationToken: (token: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(NOTIFICATION_TOKEN_KEY, token);
  },
  getFirebaseToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("atex_firebase_token");
  },
  setFirebaseToken: (token: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem("atex_firebase_token", token);
  },
  removeFirebaseToken: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("atex_firebase_token");
  },
};

export default TokenManager;
