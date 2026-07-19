"use client";

import React, { useState, useEffect } from "react";
import { useGetBanksQuery } from "@/redux/transaction/banks";
import { useGetAccountNameMutation, useSaveBanksMutation, useDeleteBeneficiaryMutation } from "@/redux/settings/settings";
import { useGetRefreshTokenMutationMutation } from "@/redux/auth/auth_api";
import { setUser, logout, setLoginSuccess } from "@/redux/auth/auth_slice";
import { clearSession, setLoginSuccess as setSessionSuccess } from "@/redux/auth/session";
import { useAppSelector, useAppDispatch } from "@/redux/store";
import { TokenManager } from "@/utils/token-manager";
import { paths } from "@/utils/paths";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CenterModal } from "@/components/modals/CenterModal";
import { useToast } from "@/context/ToastProvider";
import { ArrowLeft, Landmark, Trash2, Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PaymentBanksPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const { data: banksData, isLoading: loadingBanks } = useGetBanksQuery({});
  const [getAccountName, { isLoading: loadingAccountName }] = useGetAccountNameMutation();
  const [saveBank, { isLoading: savingBank }] = useSaveBanksMutation();
  const [deleteBeneficiary, { isLoading: deletingBeneficiary }] = useDeleteBeneficiaryMutation();
  const [refreshToken] = useGetRefreshTokenMutationMutation();

  const authUser = useAppSelector((state: any) => state.auth.user);
  const userInfo = authUser?.user || authUser || {};
  const beneficiaries = authUser?.beneficiaries || authUser?.user?.beneficiaries || [];

  const refreshUser = async () => {
    try {
      const token = TokenManager.getToken();
      if (!token) return;
      const response = await refreshToken(token).unwrap();
      const res = response?.data || response || null;
      const newToken = res?.token || response?.token;
      if (newToken) {
        TokenManager.setToken(newToken);
        dispatch(setLoginSuccess({ token: newToken }));
        dispatch(setSessionSuccess());
      }
      if (res) {
        dispatch(setUser(res));
      }
    } catch (err: any) {
      console.error("Failed to refresh user context", err);
      if (err?.status === 401 || err?.status === 403) {
        TokenManager.removeToken();
        dispatch(logout());
        dispatch(clearSession());
        router.push(paths.auth.login);
      }
    }
  };

  const refreshRun = React.useRef(false);
  useEffect(() => {
    if (!refreshRun.current) {
      refreshRun.current = true;
      refreshUser();
    }
  }, []);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedBankToDelete, setSelectedBankToDelete] = useState<any | null>(null);
  const [selectedBankCode, setSelectedBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const handleFetchAccountName = async () => {
    if (accountNumber.length !== 10 || !selectedBankCode) return;
    try {
      const bankObj = (banksData?.banks?.data || []).find(
        (b: any) => b.bankCode.toString() === selectedBankCode.toString()
      );
      const bankName = bankObj?.bankName || "";

      const token = TokenManager.getToken();
      const res = await getAccountName({
        data: {
          token: token,
          bankCode: selectedBankCode,
          bankName: bankName,
          account_number: accountNumber,
        },
      }).unwrap();
      const resolvedName = res?.account_name || res?.data?.account_name;
      if (resolvedName) {
        setAccountName(resolvedName);
      } else {
        showToast("Could not resolve account name.", "error");
      }
    } catch (err: any) {
      showToast(err?.data?.message || "Failed to resolve account name.", "error");
    }
  };

  useEffect(() => {
    if (accountNumber.length === 10 && selectedBankCode) {
      handleFetchAccountName();
    }
  }, [accountNumber, selectedBankCode]);

  const handleAddBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBankCode || !accountNumber || !accountName) {
      showToast("Please fill in all fields and resolve account name.", "warning");
      return;
    }

    const bankObj = (banksData?.banks?.data || []).find((b: any) => b.bankCode === selectedBankCode) || { bankName: "Access Bank" };
    const bankName = bankObj.bankName || "Access Bank";

    try {
      const token = TokenManager.getToken();
      const payload = {
        token: token,
        bank_code: selectedBankCode,
        account_number: accountNumber,
        account_name: accountName,
        bank_name: bankName,
      };

      await saveBank({ data: payload }).unwrap();

      showToast("Bank account added successfully!", "success");
      setAddModalOpen(false);
      setSelectedBankCode("");
      setAccountNumber("");
      setAccountName("");
      await refreshUser();
    } catch (err: any) {
      showToast(err?.data?.message || "Failed to save bank account.", "error");
    }
  };

  const handleDeleteBank = async () => {
    if (!selectedBankToDelete) return;
    try {
      const bene = selectedBankToDelete;
      if (bene?.bank_code && bene?.account_number) {
        const token = TokenManager.getToken();
        await deleteBeneficiary({
          data: {
            token: token,
            bank_code: bene.bank_code,
            account_number: bene.account_number,
            bank_name: bene.bank_name || bene.bankName || "",
          },
        }).unwrap();
      }
      showToast("Bank account removed.", "success");
      setDeleteModalOpen(false);
      setSelectedBankToDelete(null);
      await refreshUser();
    } catch (err: any) {
      showToast(err?.data?.message || "Failed to remove bank.", "error");
    }
  };

  const bankOptions = (banksData?.banks?.data || []).map((b: any) => ({
    value: b.bankCode.toString(),
    label: b.bankName,
    icon: b.bankUrl ? (
      <img src={b.bankUrl} alt={b.bankName} className="w-5 h-5 rounded-full object-contain bg-light-200" />
    ) : undefined,
  }));

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 xs:gap-3 min-w-0">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-light-100 dark:hover:bg-dark-700 transition-colors text-text-primary-light dark:text-text-primary-dark cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="text-b1 xs:text-h6 font-primary-bold text-text-primary-light dark:text-text-primary-dark whitespace-nowrap overflow-hidden text-ellipsis">
            Payment Banks
          </h3>
        </div>

        <Button onClick={() => setAddModalOpen(true)} className="flex items-center gap-1 py-1.5 px-3 xs:py-2 xs:px-4 text-[12px] xs:text-b3 shrink-0">
          <Plus className="w-3.5 h-3.5" />
          <span>Add Bank</span>
        </Button>
      </div>

      {/* Accounts List */}
      <div className="flex flex-col gap-4">
        {beneficiaries.length > 0 ? (
          <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-[24px] overflow-hidden divide-y divide-border-light dark:divide-border-dark">
            {beneficiaries.map((bene: any) => (
              <div key={bene.id || bene.account_number} className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-light-200 dark:bg-dark-700 flex items-center justify-center text-text-secondary-light dark:text-text-secondary-dark">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                      {bene.bank_name}
                    </h5>
                    <p className="text-b3 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark">
                      {bene.account_number} • {bene.account_name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedBankToDelete(bene);
                    setDeleteModalOpen(true);
                  }}
                  className="p-2 rounded-full text-danger-500 hover:bg-danger-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-[24px] py-16 flex flex-col items-center justify-center gap-3 text-center">
            <Landmark className="w-12 h-12 text-text-tertiary-light dark:text-text-tertiary-dark" />
            <div>
              <p className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                No bank accounts linked yet
              </p>
              <p className="text-b3 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark max-w-xs">
                Link bank accounts where we can pay cash from gift card and crypto sales.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Add Bank Modal */}
      <CenterModal visible={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add Bank Account">
        <form onSubmit={handleAddBankSubmit} className="flex flex-col gap-4">
          <Select
            label="Select Bank"
            placeholder={loadingBanks ? "Loading banks list..." : "Choose bank"}
            options={bankOptions}
            value={selectedBankCode}
            onChange={setSelectedBankCode}
            searchable
          />

          <Input
            label="Account Number"
            placeholder="e.g. 0123456789 (10 digits)"
            maxLength={10}
            type="text"
            inputMode="numeric"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ""))}
            error={accountNumber.length > 0 && accountNumber.length !== 10 ? "Account number must be 10 digits" : ""}
          />

          {loadingAccountName && (
            <div className="flex items-center gap-2 text-b3 font-primary-medium text-text-secondary-light dark:text-text-secondary-dark py-1">
              <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
              <span>Resolving bank account name...</span>
            </div>
          )}

          {accountName && !loadingAccountName && (
            <Input label="Account Name" value={accountName} readOnly disabled />
          )}

          <div className="flex gap-4 mt-2">
            <Button type="button" variant="secondary" fullWidth onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" fullWidth loading={savingBank} disabled={!accountName || loadingAccountName}>
              Link Account
            </Button>
          </div>
        </form>
      </CenterModal>

      {/* Delete Bank Confirmation Modal */}
      <CenterModal
        visible={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedBankToDelete(null);
        }}
        title="Delete Bank Account"
      >
        <div className="flex flex-col gap-4 text-center">
          <p className="text-b2 text-text-secondary-light dark:text-text-secondary-dark font-primary-regular">
            Are you sure you want to remove this bank account?
          </p>
          {selectedBankToDelete && (
            <div className="bg-light-100 dark:bg-dark-800 p-4 rounded-xl text-left border border-border-light/40 dark:border-border-dark/40 font-primary-regular">
              <p className="text-b2 font-primary-bold text-text-primary-light dark:text-text-primary-dark">
                {selectedBankToDelete.bank_name}
              </p>
              <p className="text-b3 font-primary-regular text-text-secondary-light dark:text-text-secondary-dark mt-1">
                {selectedBankToDelete.account_number} • {selectedBankToDelete.account_name}
              </p>
            </div>
          )}
          <div className="flex gap-4 mt-2">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              disabled={deletingBeneficiary}
              onClick={() => {
                setDeleteModalOpen(false);
                setSelectedBankToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              fullWidth
              loading={deletingBeneficiary}
              disabled={deletingBeneficiary}
              onClick={handleDeleteBank}
            >
              Delete
            </Button>
          </div>
        </div>
      </CenterModal>
    </div>
  );
}
