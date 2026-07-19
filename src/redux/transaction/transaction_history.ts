import { apiEndpoints } from "@/constant/api";
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../auth/auth_api";

export const transactionHistoryApi = createApi({
  reducerPath: "transactionHistoryApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["transactionCheck"],
  endpoints: (builder) => ({
    getAllTransaction: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.transaction.getTransactionHistory}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["transactionCheck"],
    }),
    saveBank: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.payment.saveBanks}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["transactionCheck"],
    }),
    withdraw: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.payment.withdraw}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["transactionCheck"],
    }),
    getDetailTransaction: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.transaction.getDetailTransation}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["transactionCheck"],
    }),
    getAllTypeDetailTransaction: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.transaction.getAllTypeDetailTransaction}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["transactionCheck"],
    }),
  }),
});

export const {
  useGetAllTransactionMutation,
  useSaveBankMutation,
  useWithdrawMutation,
  useGetDetailTransactionMutation,
  useGetAllTypeDetailTransactionMutation,
} = transactionHistoryApi;
