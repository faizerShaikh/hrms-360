import { useDelete } from "hooks/useDelete";
import React, { ReactElement, ReactNode } from "react";
import { useQueryClient } from "react-query";
import { Confirm } from "..";

export interface ActivateDeactivateTenantInterfcae {
  url: string;
  successMsg: string;
  refetchUrl: string;
  button: ReactElement;
  title: string;
  children: ReactNode;
}

export const ActivateDeactivateTenant = ({
  url,
  successMsg,
  refetchUrl,
  button,
  title,
  children,
}: ActivateDeactivateTenantInterfcae) => {
  const queryClient = useQueryClient();
  const { mutate, isLoading } = useDelete({
    url,
    name: "",
    successMsg,
    refetch: () =>
      queryClient.refetchQueries(refetchUrl ? refetchUrl : url, {
        exact: false,
        stale: true,
      }),
  });
  return (
    <Confirm
      isLoading={isLoading}
      button={button}
      submitHandler={(onClose) => {
        mutate("", {
          onSuccess: onClose,
        });
      }}
      title={title}
    >
      <p className='m-0 text-fc-main'>{children} </p>
    </Confirm>
  );
};
