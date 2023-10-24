import { Add, Edit } from "@carbon/icons-react";
import { Grid, Box } from "@mui/material";
import { Form, Formik } from "formik";
import { CreateUpdateDialogBaseProps } from "interfaces/base";
import { EmployeeDesignationInterface } from "interfaces/settings";
import React from "react";
import { Dialog, Input, Label, Button } from "..";
import { useQueryClient } from "react-query";
import * as yup from "yup";
import { useCreateOrUpdate } from "hooks/useCreateOrUpdate";
import { toast } from "utils/toaster";

const initialState: EmployeeDesignationInterface = {
  name: "",
};

const employeeDesignationValidations = yup.object({
  name: yup.string().required("Name is required"),
});

export const EmployeeDesignationDialog = ({
  isUpdate = false,
  data,
}: CreateUpdateDialogBaseProps) => {
  const queryClient = useQueryClient();
  const { mutate } = useCreateOrUpdate({
    url: isUpdate ? `/setting/designation/${data?.id}` : "/setting/designation",
    method: isUpdate ? "put" : "post",
  });
  return (
    <Dialog
      title={`${isUpdate ? "Update" : "Add New"} Employee Designation`}
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
            className='px-4 ml-6 capitalize xl:text-sm  2xl:text-semi-base h-9'
            startIcon={<Add size={24} />}
          >
            New Designation
          </Button>
        )
      }
    >
      {({ onClose }) => (
        <Formik
          initialValues={{ ...initialState, ...data }}
          validationSchema={employeeDesignationValidations}
          onSubmit={(values, { resetForm }) => {
            mutate(values, {
              onSuccess: () => {
                resetForm();
                onClose();
                queryClient.refetchQueries("/setting/designation", {
                  exact: false,
                  stale: true,
                });
                toast(
                  `Employee Designation ${
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
                <Input className=' mt-4' name='name' />
              </Grid>

              <Grid xs={12} item>
                <Box className='flex justify-end'>
                  <Button
                    color='secondary'
                    className='px-4 capitalize xl:text-sm 2xl:text-semi-base'
                    variant='contained'
                    onClick={() => onClose()}
                  >
                    Discard
                  </Button>
                  <Button
                    variant='contained'
                    className='capitalize ml-4 px-4 xl:text-sm 2xl:text-semi-base'
                    type='submit'
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
