import { apiEndpoints } from '@/constant/api';
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../auth/auth_api';

export const cryptoApi = createApi({
  reducerPath: 'cryptoApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['cryptoCheck'],
  endpoints: (builder) => ({
    getCrptoNetwork: builder.query<any, any>({
      query: () => ({
        url: `${apiEndpoints.crypto.fetchAllNet}`,
        method: 'GET',
      }),
      providesTags: ['cryptoCheck'],
    }),
    generateWallet: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.crypto.generateWallet}`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['cryptoCheck'],
    }),
  })
});

export const {
  useGetCrptoNetworkQuery,
  useGenerateWalletMutation,
} = cryptoApi;
