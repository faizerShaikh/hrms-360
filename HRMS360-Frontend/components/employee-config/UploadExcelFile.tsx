import { Grid, Stack, Typography } from "@mui/material";
import { ImportProps } from "pages/employee-configuration/import";
import { Button, FormContainer } from "..";

import { useCreateOrUpdate } from "hooks/useCreateOrUpdate";

import { Upload } from "@carbon/icons-react";
import React, { ChangeEvent } from "react";
import { onError } from "utils/onError";

export const UploadSampleFile = ({ setActiveStep, setUsers }: ImportProps) => {
  const fileInput = React.useRef<HTMLInputElement | null>(null);

  const { mutate, isLoading } = useCreateOrUpdate({
    url: "/user/excel-file",

    onSuccess: (data) => {
      setUsers(data.data.data);
      setActiveStep((prev: number) => prev + 1);
      if (fileInput.current) {
        fileInput.current.value = "";
      }
    },
  });

  const uploadExcelFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const formData = new FormData();
    if (e.target.files) {
      formData.append("file", e.target.files[0]);
      mutate(formData, {
        onError: (err: any) => {
          if (fileInput.current) {
            fileInput.current.value = "";
          }
          onError(err);
        },
      });
    }
  };

  return (
    <>
      <FormContainer className="mt-14">
        <Grid container justifyContent={"center"}>
          <Grid item className="flex justify-center items-center" xs={12}>
            <Typography>Upload sample data </Typography>
          </Grid>

          <Grid item className="flex justify-center items-center" xs={12}>
            <Button
              className="capitalize mt-8"
              startIcon={<Upload />}
              size="small"
              variant="contained"
              onClick={() => fileInput?.current?.click()}
              isLoading={isLoading}
            >
              Upload Excel file
              <input
                ref={fileInput}
                onChange={(e) => uploadExcelFile(e)}
                type="file"
                style={{ display: "none" }}
                accept=".xls,.xlsx,"
              />
            </Button>
          </Grid>
          <Grid item className="flex justify-center items-center mt-8">
            <Typography fontSize={12}>
              Note: This option will allow you to upload file in excel file
            </Typography>
          </Grid>
        </Grid>
      </FormContainer>
      <Stack alignItems={"end"}>
        <Button
          variant="contained"
          className="capitalize mt-8"
          size="small"
          color="secondary"
          onClick={() => {
            setActiveStep((prev: number) => prev - 1);
          }}
        >
          Back
        </Button>
      </Stack>
    </>
  );
};
