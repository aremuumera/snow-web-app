import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface RecentBeneficiary {
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode: string;
  bankUrl?: string;
  timestamp: number;
}

interface RecentWithdrawalState {
  recentBeneficiariesByUser: Record<string, RecentBeneficiary[]>;
}

const initialState: RecentWithdrawalState = {
  recentBeneficiariesByUser: {},
};

const recentWithdrawalSlice = createSlice({
  name: "recentWithdrawal",
  initialState,
  reducers: {
    addRecentWithdrawal: (
      state,
      action: PayloadAction<Omit<RecentBeneficiary, "timestamp"> & { userEmail: string }>
    ) => {
      const { userEmail, accountNumber, bankCode, ...rest } = action.payload;
      if (!userEmail) return;

      if (!state.recentBeneficiariesByUser[userEmail]) {
        state.recentBeneficiariesByUser[userEmail] = [];
      }

      const list = state.recentBeneficiariesByUser[userEmail];
      const filtered = list.filter(
        (item) => !(item.accountNumber === accountNumber && item.bankCode === bankCode)
      );

      filtered.unshift({ accountNumber, bankCode, ...rest, timestamp: Date.now() });
      state.recentBeneficiariesByUser[userEmail] = filtered.slice(0, 10);
    },

    clearRecentWithdrawals: (state, action: PayloadAction<string>) => {
      const userEmail = action.payload;
      if (userEmail && state.recentBeneficiariesByUser[userEmail]) {
        delete state.recentBeneficiariesByUser[userEmail];
      }
    },
  },
});

export const { addRecentWithdrawal, clearRecentWithdrawals } = recentWithdrawalSlice.actions;
export default recentWithdrawalSlice.reducer;
