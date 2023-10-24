import React from "react";
import { NextPage } from "next";
import { Grid } from "@mui/material";
import NextLink from "next/link";
import { Button, Input, PageHeader, Label, FormContainer } from "components";
import { Form, Formik } from "formik";
import { CompetencyInterface } from "interfaces/competency-bank";
import { useCreateOrUpdate } from "hooks/useCreateOrUpdate";
import { toast } from "utils/toaster";
import * as yup from "yup";
import { useRouter } from "next/router";
import { getCookie } from "cookies-next";

const competencyInitialValues: CompetencyInterface = {
  title: "",
  description: "",
  type: "custom",
};

const competencyValidations = yup.object({
  title: yup.string().required("Title is required"),
  description: yup.string().required("Description is required"),
});

const MyCompetencyDetail: NextPage = () => {
  const { push } = useRouter();

  const is_client = getCookie("is_client");

  const { mutate, isLoading } = useCreateOrUpdate({
    url: !is_client ? "/standard-competency" : "/competency",
  });
  return (
    <>
      <PageHeader title='Add New Competency' />
      <FormContainer>
        <Formik
          initialValues={competencyInitialValues}
          validationSchema={competencyValidations}
          onSubmit={(values, { resetForm }) => {
            mutate(values, {
              onSuccess: (data) => {
                resetForm();
                toast("Competency Saved Successfully");
                push(
                  `/competency-bank/${!is_client ? "standard" : "my"}/${
                    data.data.data.id
                  }`
                );
              },
            });
          }}
        >
          <Form>
            <Grid
              container
              gap={1}
              className='flex items-start justify-center w-full'
            >
              <Grid item xs={12}>
                <Label text='Add a title to your Competency' />
              </Grid>
              <Grid item xs={12}>
                <Input
                  placeholder='Your title goes here'
                  fullWidth
                  name='title'
                />
              </Grid>
              <Grid item xs={12} className='mt-7'>
                <Label text='Add a description to the Competency' />
              </Grid>
              <Grid item xs={12}>
                <Input
                  multiline
                  rows={4}
                  placeholder='Description'
                  fullWidth
                  name='description'
                />
              </Grid>
              <Grid
                item
                xs={12}
                className='flex items-center justify-center mt-7'
                gap={2}
              >
                <NextLink href='/competency-bank'>
                  <Button
                    className='px-4 capitalize xl:text-sm 2xl:text-semi-base'
                    color='secondary'
                    disabled={isLoading}
                  >
                    Discard
                  </Button>
                </NextLink>
                <Button
                  className='px-4 capitalize xl:text-sm 2xl:text-semi-base'
                  type='submit'
                  isLoading={isLoading}
                >
                  Save
                </Button>
              </Grid>
            </Grid>
          </Form>
        </Formik>
      </FormContainer>
    </>
  );
};

export default MyCompetencyDetail;
