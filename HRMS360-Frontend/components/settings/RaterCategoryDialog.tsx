import { Add, Edit } from "@carbon/icons-react";
import { Grid, Box, FormHelperText } from "@mui/material";
import React from "react";
import { Button, Dialog, Input, Label, Switch } from "..";
import * as yup from "yup";
import { Form, Formik } from "formik";
import { useCreateOrUpdate } from "hooks/useCreateOrUpdate";
import { toast } from "utils/toaster";
import { RaterInterface } from "interfaces/settings";
import { useQueryClient } from "react-query";
import { CreateUpdateDialogBaseProps } from "interfaces/base";
import { defaultRaters } from "constants/survey";

const initialState: RaterInterface = {
  category_name: "",
  short_name: "",
  no_of_raters: 0,
  is_required: true,
  is_external: false,
};

const validations = yup.object({
  category_name: yup.string().required("Category name is required"),
  short_name: yup
    .string()
    .test(
      "len",
      "Short name length must be less then or equeal to 5 characters",
      (val: any) => val?.length <= 5
    )
    .required("Short Name name is required"),
  no_of_raters: yup
    .number()
    .min(1, "No of raters must be greater than or equal to 1")
    .required("No of raters are required"),
  is_required: yup.boolean(),
  is_external: yup.boolean(),
});

export const RaterCategoryDialog = ({
  isUpdate = false,
  data,
}: CreateUpdateDialogBaseProps) => {
  const queryClient = useQueryClient();
  const { mutate } = useCreateOrUpdate({
    url: isUpdate ? `/setting/rater/${data?.id}` : "/setting/rater",
    method: isUpdate ? "put" : "post",
  });

  return (
    <Dialog
      title={`${isUpdate ? "update" : "add new"} rater`}
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
            New Category
          </Button>
        )
      }
    >
      {({ onClose }) => (
        <Formik
          initialValues={{ ...initialState, ...data }}
          validationSchema={validations}
          onSubmit={(values, { resetForm }) => {
            mutate(values, {
              onSuccess: () => {
                resetForm();
                onClose();
                queryClient.refetchQueries("/setting/rater", {
                  exact: false,
                  stale: true,
                });
                toast(`Rater ${isUpdate ? "updated" : "created"} successfully`);
              },
            });
          }}
        >
          <Form>
            <Grid container spacing={4} className='mt-0'>
              <Grid xs={12} item>
                <Label text='Raters Category' />
                <Input className=' mt-4' name='category_name' />
              </Grid>
              <Grid xs={12} item>
                <Label text='Short Abbrevation' />
                <Input className=' mt-4' name='short_name' />
                <FormHelperText>
                  Abbrevation can be the first three letter of rater category
                </FormHelperText>
              </Grid>
              <Grid xs={12} item>
                <Label text='No. of Raters' />
                <Input
                  className='mt-4'
                  name='no_of_raters'
                  type='number'
                  disabled={data && defaultRaters.includes(data?.name)}
                />
              </Grid>
              <Grid xs={6} item>
                <Label text='Is Mandatory' />
                <Switch className='mt-4' name='is_required' />
              </Grid>
              {!(data && defaultRaters.includes(data?.name)) && (
                <Grid xs={6} item>
                  <Label text='Is External' />
                  <Switch className='mt-4' name='is_external' />
                </Grid>
              )}
              <Grid xs={12} item>
                <Box className='flex justify-end'>
                  <Button
                    color='secondary'
                    className='px-4 capitalize xl:text-sm 2xl:text-semi-base'
                    variant='contained'
                    onClick={onClose}
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
