import { VoidFunction } from "types/functionTypes";
import { onError } from "utils/onError";
import { useGetAll } from "./useGetAll";

export const useDownaloadFile = (path: string, onSuccess?: VoidFunction) => {
  return useGetAll({
    key: path,
    select: (data) => data?.data,
    enabled: false,
    onSuccess: (data) => {
      let a = document.createElement("a");

      a.href = `${process.env.NEXT_PUBLIC_API_URL?.split("/api/v1")[0]}${
        data?.message
      }`;

      a.target = "_blank";
      a.download =
        data?.message.split("/")[data?.message.split("/")?.length - 1];
      a.click();
      onSuccess && onSuccess();
    },
    onError(err) {
      onError(err);
    },
  });
};
