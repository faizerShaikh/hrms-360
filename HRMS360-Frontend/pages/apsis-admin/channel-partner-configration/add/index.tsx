import { Box, Grid, Typography } from "@mui/material";
import {
  Input,
  PageHeader,
  PrimaryAccordion,
  Switch,
  DropZone,
  Button,
  AutoComplete,
} from "components/layout";
import { colors } from "constants/theme";
import { Formik, FormikHelpers } from "formik";
import { useCreateOrUpdate } from "hooks/useCreateOrUpdate";
import { useRouter } from "next/router";
import React from "react";
import { getTenure } from "utils/getTenure";

import { toast } from "utils/toaster";
import * as yup from "yup";
import moment from "moment";
import { API } from "configs/api";
import { IndustryInterface } from "interfaces/settings";
import { onError } from "utils/onError";

export interface initaialValuesType {
  name: string;
  admin_name: string;
  location: string;
  industry_id: IndustryInterface | string;
  no_of_employee: number;
  email: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  tenure: number;
  tenant_pic: string;
  is_lm_approval_required: boolean;
  is_own_schema: boolean;
  admin_type?: string;
}

const initaialValues: initaialValuesType = {
  name: "",
  admin_name: "",
  location: "",
  industry_id: "",
  no_of_employee: 0,
  email: "",
  start_date: "",
  end_date: "",
  is_active: false,
  tenure: 0,
  tenant_pic: "",
  is_lm_approval_required: true,
  is_own_schema: true,
  admin_type: "on premise",
};

const validations = yup.object({
  name: yup
    .string()
    .required("Name is required")
    .max(64, "Company Name must be less then or equeal to 64 charechters"),
  admin_name: yup.string().required("Admin Name is required"),
  location: yup.string().required("Location is required"),
  industry_id: yup.mixed().required("Industry is required"),
  no_of_employee: yup
    .number()
    .min(1, "Employee base must be greated then or queal to 1")
    .required("Employee base is required"),
  email: yup.string().required("Admin Email is required"),
  start_date: yup.string().required("Start Date is required"),
  end_date: yup.string().required("End Date is required"),
  tenure: yup.string().required("Tenure is required"),
  tenant_pic: yup.mixed(),
  is_own_schema: yup.string().required("Schema is required"),
});

const AddChannelPartner = () => {
  const { push } = useRouter();

  const postData = (
    values: initaialValuesType,
    { resetForm, setSubmitting }: FormikHelpers<initaialValuesType>
  ) => {
    if (
      values.name.match(/^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?1234567890]+/)
    ) {
      setSubmitting(false);
      return toast(
        "Name of organization can not start with special charecter or numbers",
        "error"
      );
    }
    if (getTenure(values.start_date, values.end_date) === 0) {
      setSubmitting(false);
      return toast("Subscription Tenure should be atleast one month", "error");
    }
    let data = {
      tenant: {
        name: values.name,
        schema_name: values.name
          .replace(/[^a-zA-Z0-9 _]/g, "")
          .replace(/ /g, "_")
          .toLocaleLowerCase(),
        location: values.location,
        industry_id:
          typeof values.industry_id === "object" && values.industry_id["id"],
        no_of_employee: values.no_of_employee,
        start_date: values.start_date,
        end_date: values.end_date,
        tenure: getTenure(values.start_date, values.end_date),
        is_active: values.is_active,
        is_lm_approval_required: values.is_lm_approval_required,
        admin_type: values.admin_type,
        is_own_schema: values.is_own_schema,
      },
      tenant_pic: values.tenant_pic,
      user:
        values.email === ""
          ? {
              name: values.admin_name,
            }
          : {
              email: values.email,
              name: values.admin_name,
            },
      setSubmitting,
    };

    mutate(data, {
      onSuccess: resetForm,
      onError: (err: any, variables: any) => {
        onError(err);
        variables.setSubmitting(false);
      },
    });
    setSubmitting(false);
  };

  const { mutate } = useCreateOrUpdate({
    url: "/tenant/channel-partner",
    onSuccess: async (res, variables: any) => {
      const formData = new FormData();
      formData.append("tenant_pic", variables.tenant_pic);
      await API.put(`/tenant/tenant-pic/${res.data.data.id}`, formData);
      variables.setSubmitting(false);
      push("/apsis-admin/channel-partner-configration");
      toast("Channel Partner created successfully");
    },
  });

  return (
    <>
      <PageHeader title='Add New Channel Partner' />
      <Formik
        initialValues={initaialValues}
        onSubmit={postData}
        validationSchema={validations}
      >
        {({ values, resetForm, submitForm, isSubmitting }) => (
          <>
            <PrimaryAccordion
              header='Company Details'
              expanded
              className='my-0'
            >
              <Grid container spacing={4}>
                <Grid item xs={12}>
                  <Input label='Company Name' name='name' />
                </Grid>
                <Grid item xs={4}>
                  <Input label='Location' name='location' />
                </Grid>
                <Grid item xs={4}>
                  <AutoComplete
                    label='Industry'
                    name='industry_id'
                    url='/setting/industry/apsis-admin'
                    getOptionLabel={(option: any) => option?.name || option}
                  />
                </Grid>
                <Grid item xs={4}>
                  <Input
                    label='Employee Base'
                    name='no_of_employee'
                    type='number'
                  />
                </Grid>
                {/* <Grid item xs={6} className="mt-auto">
                  <RadioGroup
                    hidden={true}
                    label="Admin Type"
                    row
                    onChange={(e) =>
                      setFieldValue("admin_type", e.target.value)
                    }
                    name="admin_type"
                    defaultValue={values.admin_type}
                    options={[
                      { label: "On Premise", value: "on premise" },
                      { label: "Channel Partner", value: "channel partner" },
                    ]}
                  />
                </Grid> */}
                {values.admin_type === "on premise" && (
                  <>
                    <Grid item xs={6}>
                      <Input label='Organisation Admin' name='admin_name' />
                    </Grid>
                    <Grid item xs={6}>
                      <Input label='Admin Email Address' name='email' />
                    </Grid>
                  </>
                )}
                {/* <Grid item xs={6} alignItems={"center"} className='mt-10'>
                  <Typography
                    sx={{ color: colors.text.dark, fontSize: "15px" }}
                    className={"px-3"}
                  >
                    Create Schema For Channel Partner
                  </Typography>
                  <Switch name='is_own_schema' />
                </Grid>
                {values.is_own_schema && (
                  <Grid item xs={6} alignItems={"center"} className='mt-10'>
                    <Typography
                      sx={{ color: colors.text.dark, fontSize: "15px" }}
                      className={"px-3"}
                    >
                      Line Manager Approval Required
                    </Typography>
                    <Switch name='is_lm_approval_required' />
                  </Grid>
                )} */}
                <Grid item xs={6}>
                  <DropZone<initaialValuesType>
                    name='tenant_pic'
                    label='Add Tenant Logo'
                  />
                </Grid>
              </Grid>
            </PrimaryAccordion>
            <PrimaryAccordion header='Subscription Details' expanded>
              <Grid container spacing={4}>
                <Grid item xs={6}>
                  <Input
                    label='Onboarding Date'
                    name='start_date'
                    type='date'
                    inputProps={{
                      min: moment().format("YYYY-MM-DD"),
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Input
                    label='End of Subscription Date'
                    name='end_date'
                    type='date'
                    inputProps={{
                      min: moment().add(1, "day").format("YYYY-MM-DD"),
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Input
                    label='Subscription Tenure'
                    name='tenure'
                    disabled
                    value={
                      getTenure(values.start_date, values.end_date)
                        ? getTenure(values.start_date, values.end_date) / 12 >=
                          1
                          ? `${(
                              getTenure(values.start_date, values.end_date) / 12
                            ).toFixed(1)} year`
                          : `${getTenure(
                              values.start_date,
                              values.end_date
                            )} months`
                        : ""
                    }
                  />
                </Grid>
                <Grid item xs={6} className='flex items-end'>
                  <Switch label='Subscription Status :' name='is_active' />
                  <Typography
                    className='py-2 px-5'
                    sx={{
                      color: values.is_active
                        ? colors.primary.dark
                        : colors.secondary.dark,
                    }}
                  >
                    {values.is_active ? "Active" : "Inactive"}
                  </Typography>
                </Grid>
              </Grid>
            </PrimaryAccordion>
            <Box className='flex justify-end'>
              <Button color='secondary' onClick={() => resetForm()}>
                Discard
              </Button>
              <Button
                className='ml-4 capitalize'
                isLoading={isSubmitting}
                onClick={() => submitForm()}
              >
                Add
              </Button>
            </Box>
          </>
        )}
      </Formik>
    </>
  );
};

export default AddChannelPartner;
