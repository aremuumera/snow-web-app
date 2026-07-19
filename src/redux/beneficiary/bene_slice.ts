import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface phoneBeneficiary {
  id: string;
  number: string;
  name?: string;
  network?: string;
}

export interface CableBeneficiary {
  id: string;
  name: string;
  cablenumber: string;
  cableNetwork: string;
}

export interface ElectricityBeneficiary {
  id: string;
  name: string;
  meternumber: string;
  provider: string;
}

export interface BettingBeneficiary {
  id: string;
  name?: string;
  provider: string;
}

export interface WithdrawalAccount {
  id: string;
  account_number: string;
  account_name: string;
  bank_name: string;
  bank_code: string;
  image?: string;
  timestamp: number;
}

export interface BeneficiaryState {
  phoneBeneficiaries: phoneBeneficiary[];
  cableBeneficiaries: CableBeneficiary[];
  electricityBeneficiaries: ElectricityBeneficiary[];
  bettingBeneficiaries: BettingBeneficiary[];
  loading: boolean;
  error: string | null;
  success: boolean;
  message: string;
  selectedCable: CableBeneficiary | null;
  selectedElectricity: ElectricityBeneficiary | null;
  recentWithdrawalAccounts: WithdrawalAccount[];
  selectedWithdrawalAccount: WithdrawalAccount | null;
}

const initialState: BeneficiaryState = {
  phoneBeneficiaries: [],
  cableBeneficiaries: [],
  electricityBeneficiaries: [],
  bettingBeneficiaries: [],
  loading: false,
  error: null,
  success: false,
  message: "",
  selectedCable: null,
  selectedElectricity: null,
  recentWithdrawalAccounts: [],
  selectedWithdrawalAccount: null,
};

const BeneficiarySlice = createSlice({
  name: "beneficiary",
  initialState,
  reducers: {
    updateSelectedCable: (state, action) => {
      state.selectedCable = action.payload;
    },
    updateSelectedElectricity: (state, action) => {
      state.selectedElectricity = action.payload;
    },
    selectElectricityBeneficiary: (state, action) => {
      state.selectedElectricity = action.payload || null;
    },
    addPhoneBeneficiary: (state, action) => {
      const index = state.phoneBeneficiaries.findIndex(
        (bene) => bene.id === action.payload.id,
      );
      if (index !== -1) {
        state.phoneBeneficiaries[index] = action.payload;
      } else {
        state.phoneBeneficiaries.push(action.payload);
      }
      state.loading = false;
      state.error = null;
      state.success = true;
    },
    removePhoneBeneficiary: (state, action) => {
      state.phoneBeneficiaries = state.phoneBeneficiaries.filter(
        (bene) => bene.id !== action.payload.id,
      );
      state.success = true;
    },
    clearBeneficiaries: (state) => {
      state.phoneBeneficiaries = [];
      state.cableBeneficiaries = [];
      state.error = null;
      state.loading = false;
      state.success = true;
    },
    togglePhoneBeneficiary: (state, action) => {
      const index = state.phoneBeneficiaries.findIndex(
        (bene) => bene.id !== action.payload.id,
      );
      if (index !== -1) {
        state.phoneBeneficiaries[index].number = action.payload.number;
        state.success = true;
      }
    },
    addCableBeneficiary: (state, action) => {
      const index = state.cableBeneficiaries.findIndex(
        (bene) => bene.id === action.payload.id,
      );
      if (index !== -1) {
        state.cableBeneficiaries[index] = action.payload;
      } else {
        state.cableBeneficiaries.push(action.payload);
      }
      state.success = true;
    },
    removeCableBeneficiary: (state, action) => {
      state.cableBeneficiaries = state.cableBeneficiaries.filter(
        (bene) => bene.id !== action.payload.id,
      );
      state.success = true;
    },
    toggleCableBeneficiary: (state, action) => {
      const index = state.cableBeneficiaries.findIndex(
        (bene) => bene.id === action.payload.id,
      );
      if (index !== -1) {
        state.cableBeneficiaries.splice(index, 1);
      } else {
        state.cableBeneficiaries.push(action.payload);
      }
    },
    addElectricityBeneficiary: (state, action) => {
      const index = state.electricityBeneficiaries.findIndex(
        (bene) => bene.id === action.payload.id,
      );
      if (index !== -1) {
        state.electricityBeneficiaries[index] = action.payload;
      } else {
        state.electricityBeneficiaries.push(action.payload);
      }
      state.loading = false;
      state.error = null;
      state.success = true;
    },
    removeElectricityBeneficiary: (state, action) => {
      state.electricityBeneficiaries = state.electricityBeneficiaries.filter(
        (bene) => bene.id !== action.payload.id,
      );
      state.success = true;
    },
    toggleElectricityBeneficiary: (state, action) => {
      const index = state.electricityBeneficiaries.findIndex(
        (bene) => bene.id === action.payload.id,
      );
      if (index !== -1) {
        state.electricityBeneficiaries[index].meternumber = action.payload.meternumber;
        state.success = true;
      }
    },
    addBettingBeneficiary: (state, action) => {
      const index = state.bettingBeneficiaries.findIndex(
        (bene) => bene.id === action.payload.id && bene.provider === action.payload.provider,
      );
      if (index !== -1) {
        state.bettingBeneficiaries[index] = action.payload;
      } else {
        state.bettingBeneficiaries.push(action.payload);
      }
      state.loading = false;
      state.error = null;
      state.success = true;
    },
    removeBettingBeneficiary: (state, action) => {
      state.bettingBeneficiaries = state.bettingBeneficiaries.filter(
        (bene) => !(bene.id === action.payload.id && bene.provider === action.payload.provider),
      );
      state.success = true;
    },
    addRecentWithdrawalAccount: (state, action) => {
      state.recentWithdrawalAccounts = state.recentWithdrawalAccounts.filter(
        (acc) => acc.id !== action.payload.id,
      );
      state.recentWithdrawalAccounts.unshift(action.payload);
      state.recentWithdrawalAccounts = state.recentWithdrawalAccounts.slice(0, 10);
      state.success = true;
    },
    removeRecentWithdrawalAccount: (state, action) => {
      state.recentWithdrawalAccounts = state.recentWithdrawalAccounts.filter(
        (acc) => acc.id !== action.payload,
      );
      state.success = true;
    },
    clearRecentWithdrawalAccounts: (state) => {
      state.recentWithdrawalAccounts = [];
      state.success = true;
    },
    loadRecentWithdrawalAccounts: (state, action) => {
      state.recentWithdrawalAccounts = action.payload.slice(0, 10);
    },
    deleteRecentWithdrawalAccount: (state, action) => {
      state.recentWithdrawalAccounts = state.recentWithdrawalAccounts.filter(
        (acc) => acc.id !== action.payload,
      );
      state.success = true;
    },
    updateSelectedWithdrawalAccount: (
      state,
      action: PayloadAction<WithdrawalAccount | null>,
    ) => {
      state.selectedWithdrawalAccount = action.payload;
    },
  },
});

export const {
  addPhoneBeneficiary,
  removePhoneBeneficiary,
  clearBeneficiaries,
  togglePhoneBeneficiary,
  toggleCableBeneficiary,
  removeCableBeneficiary,
  addCableBeneficiary,
  toggleElectricityBeneficiary,
  removeElectricityBeneficiary,
  addElectricityBeneficiary,
  addBettingBeneficiary,
  removeBettingBeneficiary,
  updateSelectedCable,
  updateSelectedElectricity,
  selectElectricityBeneficiary,
  addRecentWithdrawalAccount,
  removeRecentWithdrawalAccount,
  clearRecentWithdrawalAccounts,
  loadRecentWithdrawalAccounts,
  deleteRecentWithdrawalAccount,
  updateSelectedWithdrawalAccount,
} = BeneficiarySlice.actions;

export default BeneficiarySlice.reducer;
