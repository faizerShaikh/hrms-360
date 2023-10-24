import { Add, Edit } from "@carbon/icons-react";
import { Grid, Box } from "@mui/material";
import { CreateUpdateDialogBaseProps } from "interfaces/base";
import { DepartmentInterface } from "interfaces/settings";
import React from "react";
import { Dialog, Input, Label, Button } from "..";
import * as yup from "yup";
import { useQueryClient } from "react-query";
import { Form, Formik } from "formik";
import { useCreateOrUpdate } from "hooks/useCreateOrUpdate";
import { toast } from "utils/toaster";

const initialState: DepartmentInterface = {
  name: "",
};

const departmentValidations = yup.object({
  name: yup.string().required("Name is required"),
});

export const DepartmentDialog = ({
  isUpdate = false,
  data,
}: CreateUpdateDialogBaseProps) => {
  const queryClient = useQueryClient();

  const { mutate, isLoading } = useCreateOrUpdate({
    url: isUpdate ? `/setting/department/${data?.id}` : "/setting/department",
    method: isUpdate ? "put" : "post",
  });

  return (
    <Dialog
      title={`${isUpdate ? "Update" : "Add New"} Department`}
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
            New Department
          </Button>
        )
      }
    >
      {({ onClose }) => (
        <Formik
          initialValues={{ ...initialState, ...data }}
          validationSchema={departmentValidations}
          onSubmit={(values, { resetForm }) => {
            mutate(values, {
              onSuccess: () => {
                resetForm();
                onClose();
                queryClient.refetchQueries("/setting/department", {
                  exact: false,
                  stale: true,
                });
                toast(
                  `Department ${isUpdate ? "updated" : "created"} successfully`
                );
              },
            });
          }}
        >
          <Form>
            <Grid container columnSpacing={10} className='mt-8' gap={3}>
              <Grid xs={12} item>
                <Label text='Name' />
                <Input className=' mt-4' name='name' />
              </Grid>

              <Grid xs={12} item>
                <Box className='flex justify-end'>
                  <Button
                    color='secondary'
                    className='px-4 capitalize  xl:text-sm 2xl:text-semi-base'
                    variant='contained'
                    onClick={() => onClose()}
                  >
                    Discard
                  </Button>
                  <Button
                    isLoading={isLoading}
                    variant='contained'
                    className='capitalize ml-4 px-4  xl:text-sm 2xl:text-semi-base'
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
