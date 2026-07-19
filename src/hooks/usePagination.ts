"use client";

import { useCallback, useRef, useState } from "react";

interface PaginationState<T> {
  data: T[];
  page: number;
  limit: number;
  hasMore: boolean;
  totalPages: number;
  totalItems: number;
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
}

interface UsePaginationOptions {
  limit?: number;
  initialPage?: number;
}

export const usePagination = <T,>(
  fetchFunction: (page: number, limit: number, signal: AbortSignal) => Promise<{
    data: T[];
    pagination?: {
      current_page: number;
      last_page: number;
      total: number;
      per_page: number;
    };
  }>,
  options: UsePaginationOptions = {}
) => {
  const { limit: initialLimit = 20, initialPage = 1 } = options;

  const [perPage, setPerPage] = useState(initialLimit);
  const [state, setState] = useState<PaginationState<T>>({
    data: [],
    page: initialPage,
    limit: initialLimit,
    hasMore: true,
    totalPages: 1,
    totalItems: 0,
    isLoading: false,
    isRefreshing: false,
    isLoadingMore: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (pageNum: number, isLoadMore = false, customLimit?: number) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const activeLimit = customLimit !== undefined ? customLimit : perPage;

    setState((prev) => ({
      ...prev,
      isLoading: pageNum === 1 && !isLoadMore,
      isRefreshing: pageNum === 1 && !isLoadMore,
      isLoadingMore: isLoadMore,
    }));

    try {
      const result = await fetchFunction(pageNum, activeLimit, abortControllerRef.current.signal);

      if (!result) {
        throw new Error("No response from server");
      }

      setState((prev) => {
        const newData = result.data || [];
        const mergedData = pageNum === 1
          ? newData
          : [...prev.data, ...newData.filter(
              (newItem: any) => !prev.data.some((existing: any) =>
                existing.id === (newItem as any).id
              )
            )];

        const pagination = result.pagination;
        const hasMore = pagination
          ? pagination.current_page < pagination.last_page
          : newData.length === activeLimit;

        return {
          ...prev,
          data: mergedData,
          page: pagination?.current_page || pageNum,
          limit: activeLimit,
          hasMore,
          totalPages: pagination?.last_page || 1,
          totalItems: pagination?.total || mergedData.length,
          isLoading: false,
          isRefreshing: false,
          isLoadingMore: false,
        };
      });

      return result;
    } catch (error: any) {
      if (error.name === "AbortError") {
        return null;
      }
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isRefreshing: false,
        isLoadingMore: false,
      }));
      throw error;
    }
  }, [fetchFunction, perPage]);

  const refresh = useCallback(() => {
    return fetchData(1, false);
  }, [fetchData]);

  const loadMore = useCallback(() => {
    if (state.isLoading || state.isLoadingMore || !state.hasMore) {
      return;
    }
    return fetchData(state.page + 1, true);
  }, [state, fetchData]);

  const setPageDirectly = useCallback((pageNum: number) => {
    return fetchData(pageNum, false);
  }, [fetchData]);

  const changeLimit = useCallback((newLimit: number) => {
    setPerPage(newLimit);
    return fetchData(1, false, newLimit);
  }, [fetchData]);

  return {
    ...state,
    fetchData,
    refresh,
    loadMore,
    setPageDirectly,
    changeLimit,
  };
};
export default usePagination;
