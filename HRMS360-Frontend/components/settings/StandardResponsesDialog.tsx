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
import { ResponseObjInterface } from "interfaces/competency-bank";

const initialValues: ResponseObjInterface = {
  type: "",
  label: "",
  score: 1,
};

const standardResponseValidations = yup.object({
  label: yup.string().required("Label is required"),
  score: yup
    .number()
    .min(1, "Minimum Score Should be ${min}")
    .max(5, "Maximum Score Should be ${max}")
    .required("Score is required"),
});

export const StandardResponseDialog = ({
  isUpdate = false,
  data,
}: CreateUpdateDialogBaseProps) => {
  const queryClient = useQueryClient();

  const { mutate, isLoading } = useCreateOrUpdate({
    url: isUpdate
      ? `/setting/standard-response/${data?.id}`
      : `/setting/standard-response`,
    method: isUpdate ? "put" : "post",
  });

  return (
    <Dialog
      title={`${isUpdate ? "Update" : "Add New"} Standard Response`}
      button={
        isUpdate ? (
          <Button
            startIcon={<Edit />}
            className='capitalize xl:text-sm 2xl:text-semi-base'
            variant='text'
          >
            View / Edit
          </Button>
        ) : (
          <Button
            variant='outlined'
            className='px-4 ml-6 capitalize xl:text-sm  2xl:text-semi-base h-9'
            startIcon={<Add size={24} />}
          >
            New Standard Response
          </Button>
        )
      }
    >
      {({ onClose }) => (
        <Formik
          initialValues={{
            ...initialValues,
            ...data,
            ...{ is_standard: true, type: "likert_scale" },
          }}
          validationSchema={standardResponseValidations}
          onSubmit={(values, { resetForm }) => {
            mutate(values, {
              onSuccess: () => {
                onClose();
                resetForm();
                queryClient.refetchQueries("/setting/standard-response", {
                  exact: false,
                  stale: true,
                });
                toast(
                  `Standard Reponse ${
                    isUpdate ? "updated" : "created"
                  } successfully`
                );
              },
            });
          }}
        >
          <Form>
            <Grid container columnSpacing={10} className='mt-0' rowSpacing={4}>
              <Grid xs={6} item>
                <Label text='Label' />
                <Input className='mt-4' name='label' />
              </Grid>
              <Grid xs={6} item>
                <Label text='Score' />
                <Input
                  className='mt-4'
                  name='score'
                  type='number'
                  inputProps={{ min: 1, max: 5 }}
                />
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
                    className='capitalize ml-4 px-4  xl:text-sm 2xl:text-semi-base'
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
