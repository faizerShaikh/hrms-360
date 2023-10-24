import { API } from "configs/api";
import { ResponseInterface } from "interfaces";
import { useMutation } from "react-query";
import { VoidFunction } from "types/functionTypes";
import { onError } from "utils";
import { setApiHeaders } from "utils/setApiHeaders";

interface useCreateOrUpdateType<TVariables = any, TContext = unknown> {
  url: string;
  method?: "post" | "put";
  name?: string;
  refetch?: VoidFunction;
  onSuccess?: (
    data: ResponseInterface,
    variables: TVariables,
    context: TContext | undefined
  ) => Promise<unknown> | void;
}

export function useCreateOrUpdate<T = unknown>({
  url,
  method = "post",
  refetch,
  onSuccess,
}: useCreateOrUpdateType) {
  function sendData(data: T) {
    setApiHeaders();
    return API[method](url, data, {});
  }

  return useMutation(sendData, {
    onSuccess: (response, variables, context) => {
      onSuccess && onSuccess(response, variables, context);
      refetch && refetch();
    },
    onError: (data: any) => {
      onError(data);
    },
  });
}
