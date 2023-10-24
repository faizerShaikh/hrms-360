import { QueryClient } from "react-query";
import { onError } from "utils/onError";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
    mutations: {
      onError,
    },
  },
});
