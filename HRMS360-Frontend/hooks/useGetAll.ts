import { API } from "configs/api";
import { ResponseInterface } from "interfaces";
import {
  InfiniteQueryObserverResult,
  useQuery,
  UseQueryResult,
} from "react-query";
import { setApiHeaders } from "utils/setApiHeaders";

interface apiParams {
  [key: string]: string | number | boolean | undefined;
}

function getData(url: string, params?: apiParams | boolean): Promise<any> {
  setApiHeaders();

  return API.get(url, {
    params: params ? params : {},
  });
}

interface GetAllOptions {
  key: string;
  params?: apiParams | boolean;
  enabled?: boolean;
  staleTime?: number;
  refetchInterval?: number;
  refetchIntervalInBackground?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  refetchOnMount?: boolean;
  retryOnMount?: boolean;
  notifyOnChangeProps?: Array<keyof InfiniteQueryObserverResult> | "tracked";
  notifyOnChangePropsExclusions?: Array<keyof InfiniteQueryObserverResult>;
  onSuccess?: (data: any | ResponseInterface) => void;
  onError?: (err: any) => void;
  onSettled?: (data: any | undefined, error: any | null) => void;
  select?: (data: ResponseInterface) => any;
  suspense?: boolean;
  keepPreviousData?: boolean;
  placeholderData?: any;
  optimisticResults?: boolean;
}
export function useGetAll<TData = any, TError = any>(
  options: GetAllOptions
): UseQueryResult<TData, TError> {
  let key = options?.params
    ? [options.key, JSON.stringify(options?.params)]
    : options?.key;

  return useQuery(key, () => getData(options.key, options?.params), {
    retry: false,
    select: (data: ResponseInterface) => data?.data?.data,
    ...options,
  });
}
