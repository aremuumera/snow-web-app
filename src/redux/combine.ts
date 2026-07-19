import { combineReducers } from "@reduxjs/toolkit";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import AuthReducer from "@/redux/auth/auth_slice";
import SessionReducer from "@/redux/auth/session";
import { authApi } from "./auth/auth_api";
import BeneficiaryReducer from "./beneficiary/bene_slice";
import { BillsApi } from "./bills/bills_api";
import { cryptoApi } from "./crypto/crypto_api";
import { giftCardsApi } from "./giftcards/giftcards_api";
import RecentWithdrawalReducer from "./recent/recent_withdrawal_slice";
import { settingsApi } from "./settings/settings";
import { BanksApi } from "./transaction/banks";
import { transactionHistoryApi } from "./transaction/transaction_history";
import KycReducer from "./kyc/kycSlice";

// Persist configuration for auth reducer
const authPersistConfig = {
  key: "auth",
  storage,
  whitelist: [
    "email",
    "isInitialized",
    "user",
    "hasAccountNotVerified",
    "selectedAvatarId",
  ],
};

const sessionPersistConfig = {
  key: "session",
  storage,
  whitelist: [
    "isAuth",
    "isLogged",
    "isOnboardingCompleted",
    "hasAccount",
  ],
};

const recentWithdrawalPersistConfig = {
  key: "recent_withdrawal",
  storage,
  whitelist: ["recentBeneficiariesByUser"],
};

const beneficiaryPersistConfig = {
  key: "beneficiary",
  storage,
  whitelist: [
    "phoneBeneficiaries",
    "cableBeneficiaries",
    "electricityBeneficiaries",
    "bettingBeneficiaries",
    "recentWithdrawalAccounts",
  ],
};

const kycPersistConfig = {
  key: "kyc",
  storage,
};

// Wrapped reducers with persistReducer
const persistedAuthReducer = persistReducer(authPersistConfig, AuthReducer);
const persistedSessionReducer = persistReducer(sessionPersistConfig, SessionReducer);
const persistedRecentWithdrawalReducer = persistReducer(
  recentWithdrawalPersistConfig,
  RecentWithdrawalReducer,
);
const persistedBeneficiaryReducer = persistReducer(
  beneficiaryPersistConfig,
  BeneficiaryReducer,
);
const persistedKycReducer = persistReducer(kycPersistConfig, KycReducer);

// Combine all reducers
const rootReducer = combineReducers({
  auth: persistedAuthReducer,
  session: persistedSessionReducer,
  kyc: persistedKycReducer,
  [authApi.reducerPath]: authApi.reducer,
  beneficiary: persistedBeneficiaryReducer,
  recent_withdrawal: persistedRecentWithdrawalReducer,
  [giftCardsApi.reducerPath]: giftCardsApi.reducer,
  [BillsApi.reducerPath]: BillsApi.reducer,
  [transactionHistoryApi.reducerPath]: transactionHistoryApi.reducer,
  [settingsApi.reducerPath]: settingsApi.reducer,
  [BanksApi.reducerPath]: BanksApi.reducer,
  [cryptoApi.reducerPath]: cryptoApi.reducer,
});

export default rootReducer;
