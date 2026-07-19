import { apiEndpoints } from "@/constant/api";
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../auth/auth_api";

export const giftCardsApi = createApi({
  reducerPath: "giftCardsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["giftCheck"],
  endpoints: (builder) => ({
    tradeGiftCard: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.giftcards.tradeGiftCard}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["giftCheck"],
    }),
    findGiftCard: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.giftcards.findGiftCard}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["giftCheck"],
    }),
    findSubCategory: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.giftcards.findSubCategory}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["giftCheck"],
    }),
    getAllGiftCards: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.giftcards.getAllGiftCards}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["giftCheck"],
    }),
    buyGiftCard: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.giftcards.buyGiftCard}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["giftCheck"],
    }),
    findGiftCardType: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.giftcards.getAllGiftCardTypes}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["giftCheck"],
    }),
    fetchGiftCardRate: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.giftcards.fetchGiftCardRate}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["giftCheck"],
    }),
  }),
});

export const {
  useFindGiftCardMutation,
  useTradeGiftCardMutation,
  useFindSubCategoryMutation,
  useGetAllGiftCardsMutation,
  useBuyGiftCardMutation,
  useFindGiftCardTypeMutation,
  useFetchGiftCardRateMutation,
} = giftCardsApi;
