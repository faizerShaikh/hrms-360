import { RowDelete } from "@carbon/icons-react";
import { Button } from "components/layout/buttons";
import { useDelete } from "hooks/useDelete";
import { ReactElement, ReactNode } from "react";
import { useQueryClient } from "react-query";
import { Confirm } from "../confirm";
import Typography from "@mui/material/Typography";

interface DeleteInterface {
  data: any;
  title?: string;
  children?: ReactNode;
  url: string;
  refetchUrl?: string;
  button?: ReactElement;
}

export const DeleteBox = ({
  data,
  title,
  children,
  url,
  refetchUrl,
  button,
}: DeleteInterface) => {
  const queryClient = useQueryClient();
  const { mutate, isLoading } = useDelete({
    url,
    name: title || "",
    refetch: () =>
      queryClient.refetchQueries(refetchUrl ? refetchUrl : url, {
        exact: false,
        stale: true,
      }),
  });
  return (
    <Confirm
      isLoading={isLoading}
      button={
        button ? (
          button
        ) : (
          <Button
            isLoading={isLoading}
            variant='text'
            startIcon={<RowDelete />}
            color={"secondary"}
            className='capitalize'
          >
            <Typography
              className='capitalize xl:text-sm 2xl:text-semi-base'
              sx={{
                lineHeight: "18px",
              }}
            >
              {"Remove"}
            </Typography>
          </Button>
        )
      }
      submitHandler={(onClose) => {
        mutate(data, {
          onSuccess: onClose,
        });
      }}
      title={`Delete ${title}` || "Delete"}
    >
      <p className='m-0 text-fc-main'>
        {children || "Are you sure do you want to delete this item?"}{" "}
      </p>
    </Confirm>
  );
};
