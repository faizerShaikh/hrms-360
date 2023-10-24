import { toast as rToast, ToastType } from "react-hot-toast";

let toaster: any = {
  success: (content: any) => rToast.success(content),
  error: (content: any) => rToast.error(content),
};

export function toast(content: any, type: ToastType = "success") {
  if (content) {
    rToast.dismiss();
    if (toaster[type]) {
      toaster[type]((t: any) => (
        <div
          onClick={() => rToast.dismiss(t.id)}
          className='p-2 text-lg cursor-pointer'
        >
          {content}
        </div>
      ));
    }
  }
}
