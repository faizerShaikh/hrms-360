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
import { UserInterface } from "interfaces/users";

const initialValues: UserInterface = {
  name: "",
  region: "",
  email: "",
  password: "",
  tenant_id: "",
};

const userValidations = yup.object({
  name: yup.string().required("Name is required"),
  email: yup
    .string()
    .required("Email is required")
    .email("Email must be valid"),
  region: yup.string().required("Region is required"),
});

export const UserDialog = ({
  isUpdate = false,
  data,
}: CreateUpdateDialogBaseProps) => {
  const queryClient = useQueryClient();
  const { mutate, isLoading } = useCreateOrUpdate({
    url: isUpdate
      ? `/channel-partner/user/${data?.id}`
      : `/channel-partner/user/`,
    method: isUpdate ? "put" : "post",
  });
  return (
    <Dialog
      title={`${isUpdate ? "Update" : "Add New"} User`}
      button={
        isUpdate ? (
          <Button
            startIcon={<Edit />}
            className='capitalize xl:text-sm 2xl:text-semi-base'
            variant='text'
          >
            {"View/Edit"}
          </Button>
        ) : (
          <Button
            variant='outlined'
            className='capitalize ml-6 px-6 h-9 xl:text-sm 2xl:text-semi-base'
            startIcon={<Add size={24} />}
          >
            New User
          </Button>
        )
      }
    >
      {({ onClose }) => (
        <Formik
          initialValues={{ ...initialValues, ...data }}
          validationSchema={userValidations}
          onSubmit={(values, { resetForm }) => {
            mutate(values, {
              onSuccess: () => {
                resetForm();
                onClose();
                queryClient.refetchQueries(`/channel-partner/user`, {
                  exact: false,
                  stale: true,
                });
                toast(`User ${isUpdate ? "updated" : "created"} successfully`);
              },
            });
          }}
        >
          <Form>
            <Grid container columnSpacing={10} className='mt-8' gap={3}>
              <Grid xs={12} item>
                <Label text='Name' />
                <Input className='mt-4' name='name' />
              </Grid>
              <Grid xs={12} item>
                <Label text='Email' />
                <Input className='mt-4' name='email' />
              </Grid>
              <Grid xs={12} item>
                <Label text='Region' />
                <Input className='mt-4' name='region' />
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
