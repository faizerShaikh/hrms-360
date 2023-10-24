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
import { IndustryInterface } from "interfaces/settings";

const initialValues: IndustryInterface = {
  name: "",
};

const industryValidations = yup.object({
  name: yup.string().required("Name is required"),
});

export const IndustryDialog = ({
  isUpdate = false,
  data,
}: CreateUpdateDialogBaseProps) => {
  const queryClient = useQueryClient();
  const { mutate, isLoading } = useCreateOrUpdate({
    url: isUpdate ? `/setting/industry/${data?.id}` : `/setting/industry`,
    method: isUpdate ? "put" : "post",
  });
  return (
    <Dialog
      title={`${isUpdate ? "Update" : "Add New"} Industry`}
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
            className='h-9 capitalize ml-6 px-6 xl:text-sm 2xl:text-semi-base'
            startIcon={<Add size={24} />}
          >
            New Industry
          </Button>
        )
      }
    >
      {({ onClose }) => (
        <Formik
          initialValues={{ ...initialValues, ...data }}
          validationSchema={industryValidations}
          onSubmit={(values, { resetForm }) => {
            mutate(values, {
              onSuccess: () => {
                resetForm();
                onClose();
                queryClient.refetchQueries(`/setting/industry/apsis-admin`, {
                  exact: false,
                  stale: true,
                });
                toast(
                  `Industry ${isUpdate ? "updated" : "created"} successfully`
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
                    className='px-4 capitalize  xl:text-sm 2xl:text-semi-base'
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
