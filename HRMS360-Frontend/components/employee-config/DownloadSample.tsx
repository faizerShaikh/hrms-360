import { Download } from "@carbon/icons-react";
import { Grid, Typography } from "@mui/material";
import { useDownaloadFile } from "hooks/useDownloadFile";
import React from "react";
import { Button, Confirm, FormContainer } from "..";

export const DownloadSampleFile = ({
  setActiveStep,
}: {
  setActiveStep: any;
}) => {
  const { refetch, isLoading } = useDownaloadFile("/user/excel-file", () => {
    setActiveStep((prev: any) => prev + 1);
  });

  return (
    <>
      <FormContainer className="mt-14">
        <Grid container justifyContent={"center"}>
          <Grid item className="flex justify-center items-center" xs={12}>
            <Typography>Download sample data </Typography>
          </Grid>

          <Grid item className="flex justify-center items-center" xs={12}>
            <Button
              className="capitalize mt-8"
              startIcon={<Download />}
              size="small"
              variant="outlined"
              isLoading={isLoading}
              onClick={() => {
                refetch();
              }}
            >
              Download Sample File
            </Button>
          </Grid>
          <Grid item className="flex justify-center items-center mt-8">
            <Typography fontSize={12}>
              Note: This option will allow you to download file in excel file
            </Typography>
          </Grid>
          <Grid item className="flex justify-end items-end" xs={12}>
            <Confirm
              submitHandler={() => {
                setActiveStep((prev: number) => prev + 1);
              }}
              button={
                <Button
                  variant="contained"
                  className="capitalize mt-8"
                  size="small"
                  color="secondary"
                >
                  Skip
                </Button>
              }
              title={<Typography>Confirm</Typography>}
            >
              <Typography>
                <span className="text-cancelled">Disclaimer</span>: Are you sure
                want to proceed without downloading the sample file ?
              </Typography>
              <Typography className="text-sm mt-2">
                <span className="text-cancelled">Note</span>: Sample file needs
                to be downloaded again in case addtion/deletion is done to the
                department/designation data
              </Typography>
            </Confirm>
          </Grid>
        </Grid>
      </FormContainer>
    </>
  );
};
