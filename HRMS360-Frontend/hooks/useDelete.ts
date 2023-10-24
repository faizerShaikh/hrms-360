import { API } from "configs/api";
import { useMutation } from "react-query";
import { VoidFunction } from "types/functionTypes";
import { toast, onError } from "utils";
import { setApiHeaders } from "utils/setApiHeaders";

interface useDeleteTypes {
  url: string;
  refetch?: VoidFunction;
  name: string;
  successMsg?: string;
}

export function useDelete({ url, name, refetch, successMsg }: useDeleteTypes) {
  const deleteItem = (id: number | string) => {
    setApiHeaders();
    return API.delete(url + "/" + id);
  };
  return useMutation(deleteItem, {
    onSuccess: () => {
      toast(successMsg ? successMsg : `${name} deleted successfully`);
      refetch && refetch();
    },
    onError,
  });
}
