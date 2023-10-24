import { toast } from "./toaster";

export const onError = async (err: any) => {
  if (err.response) {
    console.log(err.response);
    if (err.response.status === 404) {
      let message = err.response?.data?.message || `404 Not Found!`;
      message = message;
      return toast(message, "error");
    } else if ([500, 400, 401, 403].includes(err.response.status)) {
      let message = Array.isArray(err.response?.data?.message)
        ? err.response.data.message[0]
        : err.response.data.message || "Something went wrong!";
      message = message;

      return toast(message, "error");
    }
  } else {
    return toast(err.message || "Something went wrong!", "error");
  }
};
