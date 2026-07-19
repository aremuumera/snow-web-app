import { apiEndpoints } from "@/constant/api";
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../auth/auth_api";

export const settingsApi = createApi({
  reducerPath: "settingsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["setting"],
  endpoints: (builder) => ({
    getChangePasswordOtp: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.settings.getOtpForChangePassword}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["setting"],
    }),
    changePassword: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.settings.changePassword}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["setting"],
    }),
    changePin: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.settings.changePin}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["setting"],
    }),
    getChangePinOtp: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.settings.getOtpForChangePin}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["setting"],
    }),
    getAppRank: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.settings.rank}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["setting"],
    }),
    saveBanks: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.payment.saveBank}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["setting"],
    }),
    withdraw: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.payment.withdraw}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["setting"],
    }),
    getAccountName: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.payment.getAccountName}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["setting"],
    }),
    deleteBeneficiary: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.settings.deleteBeneficiary}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["setting"],
    }),
    getUserRewardHistory: builder.mutation<any, any>({
      query: (data) => ({
        url: `${apiEndpoints.setting.getUserRewardHistory}?page=${data.page}&per_page=${data.limit}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["setting"],
    }),
    toggleNotification: builder.mutation<any, any>({
      query: (data) => ({
        url: `${apiEndpoints.settings.toggleNotification}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["setting"],
    }),
    deleteAccount: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.settings.deleteAccount}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["setting"],
    }),
  }),
});

export const {
  useChangePasswordMutation,
  useChangePinMutation,
  useGetAppRankMutation,
  useSaveBanksMutation,
  useWithdrawMutation,
  useGetAccountNameMutation,
  useGetChangePasswordOtpMutation,
  useGetChangePinOtpMutation,
  useDeleteBeneficiaryMutation,
  useToggleNotificationMutation,
  useGetUserRewardHistoryMutation,
  useDeleteAccountMutation,
} = settingsApi;
