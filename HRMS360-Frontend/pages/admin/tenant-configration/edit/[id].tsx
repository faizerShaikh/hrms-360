import { Box, Grid, Typography } from "@mui/material";
import {
  Input,
  PageHeader,
  PrimaryAccordion,
  Switch,
  DropZone,
  Button,
  AutoComplete,
  RadioGroup,
} from "components/layout";
import { API, serverAPI } from "configs/api";
import { colors } from "constants/theme";
import { Formik, FormikHelpers } from "formik";
import { useCreateOrUpdate } from "hooks/useCreateOrUpdate";
import moment from "moment";
import { getTenure } from "utils/getTenure";
import { initaialValuesType } from "../add";
import { toast } from "utils/toaster";
import { useRouter } from "next/router";
import * as yup from "yup";
import { setApiHeaders } from "utils/setApiHeaders";
import { BaseProps, TenentInterface } from "interfaces";
import { NextPageContext } from "next";

export const getServerSideProps = async (ctx: NextPageContext) => {
  setApiHeaders(ctx);
  const res = await serverAPI.get(`/channel-partner/tenant/${ctx.query.id}`);

  let data: TenentInterface = res.data.data;
  return {
    props: {
      data,
    },
  };
};

const EditTenant: BaseProps<TenentInterface> = ({
  data,
}: {
  data: TenentInterface;
}) => {
  const { query, back } = useRouter();

  const initaialValues: initaialValuesType = {
    name: data.name,
    admin_name: data?.admin?.name ?? "",
    location: data.location,
    industry_id: data?.industry ?? "",
    no_of_employee: data.no_of_employee,
    email: data?.admin?.email ?? "",
    start_date: data.start_date,
    end_date: data.end_date,
    is_active: data?.is_active ?? false,
    tenure: data.tenure,
    tenant_pic: data?.tenant_pic ?? "",
    is_lm_approval_required: data?.is_lm_approval_required ?? false,
    admin_type: data.admin_type,
    response_form: data?.tenantMetaData?.response_form,
  };

  const validations = yup.object({
    name: yup
      .string()
      .required("Name is required")
      .max(64, "Company Name must be less then or equeal to 64 charechters"),
    admin_name: yup.string().when("admin_type", {
      is: "on premise",
      then: yup.string().required("Admin Name is required"),
    }),
    location: yup.string().required("Location is required"),
    industry_id: yup.mixed().required("Industry is required"),
    no_of_employee: yup
      .number()
      .min(1, "Employee base must be greated then or queal to 1")
      .required("Employee base is required $min"),
    email: yup.string().when("admin_type", {
      is: "on premise",
      then: yup.string().required("Admin Email is required"),
    }),
    start_date: yup.string().required("Start Date is required"),
    end_date: yup.string().required("End Date is required"),
    tenure: yup.string().required("Tenure is required"),
    tenant_pic: yup.mixed(),
    admin_type: yup.string().required("Admin Type is required"),
    response_form: yup.string().required("Response form is required"),
  });

  const updateData = (
    values: initaialValuesType,
    { setSubmitting }: FormikHelpers<initaialValuesType>
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
        response_form: values.response_form,
      },
      response_form: values.response_form,
      tenant_pic: values.tenant_pic,
      user:
        values.admin_type === "channel partner"
          ? undefined
          : {
              email: values.email,
              name: values.admin_name,
            },
      setSubmitting,
    };
    mutate(data, {
      onError: () => setSubmitting(false),
    });
  };

  const { mutate } = useCreateOrUpdate({
    url: `/channel-partner/tenant/${query.id}`,
    method: "put",
    onSuccess: () => {
      //push("/admin/tenant-configration");
      back();
    },
  });

  return (
    <>
      <PageHeader title='Edit Tenant' />
      <Formik
        initialValues={initaialValues}
        onSubmit={updateData}
        validationSchema={validations}
      >
        {({ values, resetForm, submitForm, isSubmitting, setFieldValue }) => (
          <>
            <PrimaryAccordion
              header='Company Details'
              expanded
              className='my-0'
            >
              <Grid container spacing={4}>
                <Grid item xs={6}>
                  <Input label='Company Name' name='name' />
                </Grid>
                <Grid item xs={6}>
                  <AutoComplete
                    label='Response Form'
                    defaultValue={data?.tenantMetaData?.response_form}
                    name='response_form'
                    options={["Single Ratee", "Multiple Ratee"]}
                    getOptionLabel={(option: any) => option?.name || option}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Input label='Location' name='location' />
                </Grid>
                <Grid item xs={6}>
                  <AutoComplete
                    label='Industry'
                    defaultValue={values.industry_id.toString()}
                    name='industry_id'
                    url='/setting/industry'
                    getOptionLabel={(option: any) => option?.name || option}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Input
                    label='Employee Base'
                    name='no_of_employee'
                    type='number'
                  />
                </Grid>
                <Grid item xs={6} className='mt-auto'>
                  <RadioGroup
                    formControlProps={{
                      disabled: true,
                    }}
                    label='Admin Type'
                    row
                    onChange={(e) =>
                      setFieldValue("admin_type", e.target.value)
                    }
                    name='admin_type'
                    defaultValue={values.admin_type}
                    options={[
                      { label: "On Premise", value: "on premise" },
                      { label: "Channel Partner", value: "channel partner" },
                    ]}
                  />
                </Grid>

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

                <Grid item xs={6} alignItems={"center"} className='mt-8'>
                  <Typography
                    sx={{ color: colors.text.dark, fontSize: "16px" }}
                    className={"px-3"}
                  >
                    Line Manager Approval Required
                  </Typography>
                  <Switch name='is_lm_approval_required' />
                </Grid>

                <Grid item xs={6}>
                  <DropZone<initaialValuesType>
                    name='tenant_pic'
                    label='Edit Tenant Logo'
                    onChange={async (acceptedfile: any) => {
                      const formData = new FormData();
                      formData.append("tenant_pic", acceptedfile[0]);
                      await API.put(`/tenant/tenant-pic/${query.id}`, formData);
                      toast("Logo uploaded successfully");
                    }}
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
                    error={Boolean(
                      values.end_date &&
                        values.start_date &&
                        getTenure(values.start_date, values.end_date) === 0
                    )}
                    helperText={
                      values.end_date &&
                      values.start_date &&
                      getTenure(values.start_date, values.end_date) === 0 &&
                      "Subscription Tenure should be atleast one month"
                    }
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
                className='ml-3'
                isLoading={isSubmitting}
                onClick={() => submitForm()}
              >
                Save
              </Button>
            </Box>
          </>
        )}
      </Formik>
    </>
  );
};

export default EditTenant;
