import { Add, Edit } from "@carbon/icons-react";
import { Grid, Box } from "@mui/material";
import React from "react";
import { Dialog, Input, Label, Button } from "..";
import { Form, Formik } from "formik";
import { toast } from "utils/toaster";
import * as yup from "yup";
import { useCreateOrUpdate } from "hooks/useCreateOrUpdate";
import { useQueryClient } from "react-query";
import { CreateUpdateDialogBaseProps } from "interfaces/base";
import { AssessmentAreaInterface } from "interfaces/settings";

const initialValues: AssessmentAreaInterface = {
  name: "",
};

const assessmentAreaValidations = yup.object({
  name: yup.string().required("Name is required"),
});

export const AssessmentAreaDialog = ({
  isUpdate = false,
  data,
  isStandard,
}: CreateUpdateDialogBaseProps) => {
  const queryClient = useQueryClient();
  const { mutate, isLoading } = useCreateOrUpdate({
    url: isUpdate
      ? `/setting/area-assessment/${isStandard ? "standard/" : ""}${data?.id}`
      : `/setting/area-assessment${isStandard ? "/standard" : ""}`,
    method: isUpdate ? "put" : "post",
  });
  return (
    <Dialog
      title={`${isUpdate ? "Update" : "Add New"} Assessment Area`}
      button={
        isUpdate ? (
          <Button
            startIcon={<Edit />}
            className='capitalize xl:text-sm 2xl:text-semi-base'
            variant='text'
          >
            View/Edit
          </Button>
        ) : (
          <Button
            variant='outlined'
            className='h-9 capitalize ml-6 px-4 xl:text-sm 2xl:text-semi-base'
            startIcon={<Add size={24} />}
          >
            New Assessment Area
          </Button>
        )
      }
    >
      {({ onClose }) => (
        <Formik
          initialValues={{ ...initialValues, ...data }}
          validationSchema={assessmentAreaValidations}
          onSubmit={(values, { resetForm }) => {
            mutate(values, {
              onSuccess: () => {
                resetForm();
                onClose();
                queryClient.refetchQueries(
                  `/setting/area-assessment${isStandard ? "/standard" : ""}`,
                  {
                    exact: false,
                    stale: true,
                  }
                );
                toast(
                  `Assessment Area ${
                    isUpdate ? "updated" : "created"
                  } successfully`
                );
              },
            });
          }}
        >
          <Form>
            <Grid container columnSpacing={10} className='mt-8' gap={3}>
              <Grid xs={12} item>
                <Label text='Title' />
                <Input className='mt-4' name='name' />
              </Grid>

              <Grid xs={12} item>
                <Box className='flex justify-end'>
                  <Button
                    color='secondary'
                    className='px-4 capitalize xl:text-sm 2xl:text-semi-base'
                    variant='contained'
                    disabled={isLoading}
                    onClick={() => onClose()}
                  >
                    Discard
                  </Button>
                  <Button
                    variant='contained'
                    className='capitalize ml-4 px-4 xl:text-sm 2xl:text-semi-base'
                    type='submit'
                    isLoading={isLoading}
                  >
                    Save
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Form>
        </Formik>
      )}
    </Dialog>
  );
};
