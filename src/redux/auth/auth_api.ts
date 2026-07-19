import { apiEndpoints } from "@/constant/api";
import { TokenManager } from "@/utils/token-manager";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logout, setUser } from "@/redux/auth/auth_slice";
import { clearSession, setIsLogged } from "@/redux/auth/session";

const API_HOSTNAME = process.env.NEXT_PUBLIC_API_HOSTNAME;
const API_CHECK_HOSTNAME = process.env.NEXT_PUBLIC_CHECK_HOSTNAME;

export const tembele = process.env.NEXT_PUBLIC_TEMBELEE_TOKEN;

const apiUrl = process.env.NODE_ENV === "development" ? API_HOSTNAME : API_CHECK_HOSTNAME;

export const baseQuery = fetchBaseQuery({
  baseUrl: apiUrl,
  credentials: "include",
  timeout: 60000,
  prepareHeaders: (headers) => {
    headers.set("authorization", `Bearer ${tembele}`);
    return headers;
  },
});

class SimpleMutex {
  private promise: Promise<void> | null = null;
  private resolve: (() => void) | null = null;

  isLocked() {
    return this.promise !== null;
  }

  async acquire() {
    while (this.promise) {
      await this.promise;
    }
    this.promise = new Promise<void>((resolve) => {
      this.resolve = resolve;
    });
    return () => this.release();
  }

  async waitForUnlock() {
    while (this.promise) {
      await this.promise;
    }
  }

  private release() {
    if (this.resolve) {
      const resolveFn = this.resolve;
      this.promise = null;
      this.resolve = null;
      resolveFn();
    }
  }
}

const mutex = new SimpleMutex();

export const baseQueryWithReauth: typeof baseQuery = async (
  args,
  api,
  extraOptions,
) => {
  // Wait until any active refresh is completed before sending the request
  await mutex.waitForUnlock();

  // Auto-inject the user token into the request body (mirrors what the mobile
  // app does manually in every page with `token: atex`).
  const updatedArgs = typeof args === "string" ? args : { ...args };
  const token = TokenManager.getToken();
  if (token && typeof updatedArgs !== "string" && updatedArgs.body) {
    if (typeof FormData !== "undefined" && updatedArgs.body instanceof FormData) {
      if (!updatedArgs.body.has("token")) {
        updatedArgs.body.append("token", token);
      }
    } else {
      const body = { ...(updatedArgs.body as Record<string, any>) };
      if (!body.token) {
        body.token = token;
      }
      updatedArgs.body = body;
    }
  }

  let result = await baseQuery(updatedArgs, api, extraOptions);

  const status = result.error?.status;

  // Handle 401 (Unauthorized)
  if (result.error && status === 401) {
    console.warn(`Received ${status} — attempting token refresh...`);

    // Prevent multiple concurrent token refresh calls
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        const refreshToken = TokenManager.getToken();

        if (!refreshToken) {
          console.log("No refresh token available — logging out user");
          api.dispatch(logout());
          api.dispatch(clearSession());
          return result;
        }

        // Attempt token refresh
        const refreshResult = (await baseQuery(
          {
            url: `/auth/refresh/app/user/${refreshToken}/token/context`,
            method: "GET",
          },
          api,
          extraOptions,
        )) as any;

        const newAccessToken =
          refreshResult.data?.token || refreshResult.data?.data?.token;

        if (newAccessToken) {
          console.log("Token refreshed successfully");

          // Save new token
          TokenManager.setToken(newAccessToken);
          api.dispatch(setIsLogged("authenticated"));

          const userData = refreshResult.data?.data || refreshResult.data;
          if (userData && !userData.token && (userData.user || userData.username)) {
            api.dispatch(setUser(userData));
          }

          const updatedArgs = typeof args === "string" ? args : { ...args };
          if (typeof updatedArgs !== "string" && updatedArgs.body) {
            updatedArgs.body = {
              ...(updatedArgs.body as Record<string, any>),
              token: newAccessToken,
            };
          }

          // Retry the original query with the new token in the body
          result = await baseQuery(updatedArgs, api, extraOptions);
        } else {
          // Refresh failed — full logout
          console.log("Token refresh failed, forcing full logout");
          api.dispatch(logout());
          api.dispatch(clearSession());
        }
      } finally {
        release();
      }
    } else {
      // If mutex is already locked, wait for the other request to finish refreshing the token
      await mutex.waitForUnlock();

      // Get the newly refreshed token
      const newAccessToken = TokenManager.getToken();

      // Retry the original query with the newly refreshed token
      const updatedArgs = typeof args === "string" ? args : { ...args };
      if (typeof updatedArgs !== "string" && updatedArgs.body && newAccessToken) {
        updatedArgs.body = {
          ...(updatedArgs.body as Record<string, any>),
          token: newAccessToken,
        };
      }
      result = await baseQuery(updatedArgs, api, extraOptions);
    }
  }

  return result;
};

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQuery,

  tagTypes: ["authCheck"],
  endpoints: (builder) => ({
    register: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.auth.register}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["authCheck"],
    }),

    createUserPin: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.auth.createUserpin}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["authCheck"],
    }),

    verifyUserPin: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.auth.verifyUserPin}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["authCheck"],
    }),

    login: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.auth.login}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["authCheck"],
    }),

    forgotPassword: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.auth.forgotPassword}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["authCheck"],
    }),

    resetPassword: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.auth.resetPassword}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["authCheck"],
    }),

    verifyOtp: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.auth.verifyOtp}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["authCheck"],
    }),

    verifyOtpForPasswordReset: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.auth.verifyOtpPassword}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["authCheck"],
    }),

    resendOtp: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.auth.resendOtp}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["authCheck"],
    }),

    resendOtpForgotPassword: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.auth.resendOtpForgotPassword}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["authCheck"],
    }),

    getUserProfile: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.auth.userProfile}`,
        method: "GET",
        body: data,
      }),
      invalidatesTags: ["authCheck"],
    }),

    getRefreshToken: builder.query<any, any>({
      query: (token) => ({
        url: `/auth/refresh/app/user/${token}/token/context`,
      }),
      providesTags: ["authCheck"],
    }),

    getRefreshTokenMutation: builder.mutation<any, any>({
      query: (data) => ({
        url: `/auth/refresh/app/user/${data}/token/context`,
        method: "GET",
      }),
      invalidatesTags: ["authCheck"],
    }),

    getNotification: builder.mutation<any, any>({
      query: ({ data }) => ({
        url: `${apiEndpoints.notification.fetchNotification}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["authCheck"],
    }),

    verifyKyc: builder.mutation<any, any>({
      query: (data) => ({
        url: `${apiEndpoints.auth.verifyKyc}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["authCheck"],
    }),
  }),
});

export const {
  useRegisterMutation,
  useCreateUserPinMutation,
  useVerifyUserPinMutation,
  useLoginMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useVerifyOtpMutation,
  useVerifyOtpForPasswordResetMutation,
  useResendOtpMutation,
  useResendOtpForgotPasswordMutation,
  useGetRefreshTokenQuery,
  useGetRefreshTokenMutationMutation,
  useGetUserProfileMutation,
  useGetNotificationMutation,
  useVerifyKycMutation,
} = authApi;
