import { ReportData } from "@carbon/icons-react";
import { Typography } from "@mui/material";
import { queryClient } from "configs/queryClient";
import { useGetAll } from "hooks/useGetAll";
import React from "react";
import { onError } from "utils/onError";
import { Button } from "..";

export const GenrateReports = ({ id }: { id: string }) => {
  const { refetch, isLoading } = useGetAll({
    key: `/survey/genrate-report/${id}`,
    enabled: false,
    onSuccess: () => {
      queryClient.refetchQueries("/survey", {
        exact: false,
        stale: true,
      });
    },
    onError: (error: any) => {
      onError(error);
    },
  });

  return (
    <>
      <div className='border rounded-xl py-2 mx-3'></div>
      <Button
        variant='text'
        isLoading={isLoading}
        onClick={() => refetch()}
        color='info'
        startIcon={<ReportData size={16} />}
      >
        <Typography className='capitalize xl:text-sm 2xl:text-semi-base'>
          Genrate reports
        </Typography>
      </Button>
    </>
  );
};
