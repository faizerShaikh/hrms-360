import { DocumentImport, Download, Upload } from "@carbon/icons-react";
import { Box, FormHelperText, Typography } from "@mui/material";
import { queryClient } from "configs/queryClient";
import { getCookie } from "cookies-next";
import { useCreateOrUpdate } from "hooks/useCreateOrUpdate";
import { useDownaloadFile } from "hooks/useDownloadFile";
import { useRouter } from "next/router";
import React, { ChangeEvent, useRef } from "react";
import { onError } from "utils/onError";
import { Dialog, Button, Stepper, FormContainer } from "..";

const DownLoadSample = ({ setActiveStep }: { setActiveStep?: any }) => {
  const { refetch, isLoading } = useDownaloadFile(
    "/competency/question/get-excel",
    () => {
      setActiveStep && setActiveStep((prev: any) => prev + 1);
    }
  );

  return (
    <FormContainer className='mt-5'>
      <Box className='flex justify-center items-center flex-col w-full'>
        <Typography className='mb-5'>Download Sample Excel File</Typography>
        <Button
          isLoading={isLoading}
          startIcon={<Download />}
          onClick={() => refetch()}
          className='capitalize mr-4'
          variant='outlined'
        >
          Download
        </Button>
        <FormHelperText className='mt-5'>
          Note: This option will allow you to get sample file to upload
          questions
        </FormHelperText>
      </Box>
    </FormContainer>
  );
};

const UploadFile = ({ onClose }: { onClose: VoidFunction }) => {
  const fileInput = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const is_client = getCookie("is_client");

  const { mutate, isLoading } = useCreateOrUpdate({
    url: is_client
      ? `/competency/question/import/${router.query.id}`
      : `/standard-competency/question/import/${router.query.id}`,
    onSuccess: async () => {
      let query = [`/competency/${router.query.id}`];
      if (!is_client) {
        query = [`/standard-competency/${router.query.id}`];
      }
      await queryClient.refetchQueries(query, { exact: true });

      onClose();
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
    <FormContainer className='mt-5'>
      <Box className='flex justify-center items-center flex-col w-full'>
        <Typography className='mb-5'>Upload Excel file</Typography>
        <Button
          startIcon={<Upload />}
          onClick={() => fileInput?.current?.click()}
          isLoading={isLoading}
          className='capitalize'
        >
          Upload
          <input
            ref={fileInput}
            onChange={(e) => uploadExcelFile(e)}
            type='file'
            style={{ display: "none" }}
            accept='.xls,.xlsx,'
          />
        </Button>
        <FormHelperText className='mt-5'>
          Note: Use previously downloaded file to upload questions
        </FormHelperText>
      </Box>
    </FormContainer>
  );
};

export const ImportQuestionBox = () => {
  return (
    <Dialog
      maxWidth='md'
      title={"Add Question"}
      button={
        <Button
          variant='outlined'
          startIcon={<DocumentImport size={20} />}
          className='h-9 capitalize mr-4'
        >
          Import Questions
        </Button>
      }
    >
      {({ onClose }) => (
        <>
          <Box className='p-5 py-10'>
            <Stepper
              activeStep={1}
              steps={[
                {
                  position: 0,
                  step: "Download Sample Excel File",
                  component: <DownLoadSample />,
                },
                {
                  position: 1,
                  step: "Upload Question File",
                  component: <UploadFile onClose={onClose} />,
                },
              ]}
            />
          </Box>
        </>
      )}
    </Dialog>
  );
};
