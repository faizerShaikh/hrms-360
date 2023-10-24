import { Add, Edit, Upload } from "@carbon/icons-react";
import { Grid, Box, Divider, Typography } from "@mui/material";
import { Form, Formik } from "formik";
import { useCreateOrUpdate } from "hooks/useCreateOrUpdate";
import { useGetAll } from "hooks/useGetAll";
import { EmployeeInterface } from "interfaces/employee-configuration";
import React, { useEffect, useState } from "react";
import { useQueryClient } from "react-query";
import { toast } from "utils/toaster";
import { Dialog, Input, Label, AutoComplete, Button, Checkbox } from "..";
import * as yup from "yup";
import { CreateUpdateDialogBaseProps } from "interfaces/base";
import Link from "next/link";
import { CookieValueTypes, getCookie } from "cookies-next";
import { getParsedCookie } from "utils/getParsedCookie";
import { TenentInterface } from "interfaces/tenant";

export const AddEmployeeDialog = ({
  isUpdate = false,
  data: editData,
}: CreateUpdateDialogBaseProps) => {
  const { mutate, isLoading } = useCreateOrUpdate({
    url: isUpdate ? `/user/${editData?.id}` : `/user`,
    method: isUpdate ? "put" : "post",
  });
  const queryClient = useQueryClient();
  const tenant = getParsedCookie<TenentInterface>("tenant");
  const { data, refetch } = useGetAll({
    key: "/setting/department",
    select(data) {
      return data.data.data.rows;
    },
    enabled: false,
    onSuccess: () => {
      desRefetch();
    },
  });

  const { data: desData, refetch: desRefetch } = useGetAll({
    key: "/setting/designation",
    enabled: false,
    select(data) {
      return data.data.data.rows;
    },
    onSuccess: () => {
      userRefetch();
    },
  });

  const { data: userData, refetch: userRefetch } = useGetAll({
    key: "/user",
    enabled: false,
    select(data) {
      return data.data.data.rows;
    },
  });

  const [_, setLineManagerRequired] = useState<CookieValueTypes>(false);

  const initialValues: EmployeeInterface = {
    name: "",
    region: "",
    email: "",
    contact: "",
    is_active: true,
    is_lm_approval_required: tenant?.is_lm_approval_required,
    line_manager_id: {},
    secondary_line_manager_id: {},
    department_id: {},
    designation_id: {},
  };

  useEffect(() => {
    let tenant = JSON.parse(`${getCookie("tenant")}` ?? "");
    setLineManagerRequired(tenant.is_lm_approval_required);
  }, []);

  const employeeValidations = yup.object({
    name: yup.string().required(),
    region: yup.string().required(),
    email: yup.string().email().required(),
    contact: yup.string().required(),
    is_active: yup.boolean(),
    department_id: yup
      .object({
        value: yup.string(),
        label: yup.string(),
      })
      .required(),
    designation_id: yup
      .object({
        value: yup.string(),
        label: yup.string(),
      })
      .required(),
  });

  const onSuccess = (
    values: EmployeeInterface,
    resetForm: VoidFunction,
    onClose: VoidFunction
  ) => {
    if (
      values.is_lm_approval_required &&
      (!values.line_manager_id ||
        (values.line_manager_id && !values.line_manager_id.id))
    ) {
      return toast("Please select line manager", "error");
    }
    mutate(
      {
        ...values,
        is_lm_approval_required: values.is_lm_approval_required,
        designation_id: values.designation_id?.id,
        department_id: values.department_id?.id,
        line_manager_id: values.line_manager_id?.id,
        secondary_line_manager_id: values.secondary_line_manager_id
          ? values.secondary_line_manager_id?.id
          : null,
      },
      {
        onSuccess: () => {
          resetForm();
          onClose();
          queryClient.refetchQueries("/user", {
            exact: false,
            stale: true,
          });
          toast(`User ${isUpdate ? "updated" : "created"} successfully`);
        },
      }
    );
  };

  return (
    <Dialog
      buttonOnClick={() => {
        refetch();
      }}
      title={isUpdate ? "update employee" : "add new employee "}
      maxWidth="lg"
      button={
        <Button
          variant={isUpdate ? "text" : "contained"}
          className="h-9 capitalize ml-4 px-4  xl:text-sm 2xl:text-semi-base"
          startIcon={isUpdate ? <Edit /> : <Add size={24} />}
        >
          {isUpdate ? "View/Edit" : " Employee"}
        </Button>
      }
    >
      {({ onClose }) => (
        <Formik
          initialValues={{
            ...initialValues,
            ...editData,
            designation_id: editData?.designation,
            department_id: editData?.department,
            line_manager_id: editData?.line_manager,
            secondary_line_manager_id: editData?.secondary_line_manager,
          }}
          validationSchema={employeeValidations}
          onSubmit={async (values, { resetForm }) =>
            onSuccess(values, resetForm, onClose)
          }
        >
          {({ setFieldValue, values }) => (
            <Form>
              <Grid container className="py-4" columnSpacing={4}>
                <Grid container item spacing={4}>
                  <Grid xs={6} item>
                    <Label className="pb-2" text="Employee Name" />
                    <Input name="name" />
                  </Grid>
                  <Grid xs={6} item>
                    <Label className="pb-2" text="Designation" />
                    <AutoComplete
                      name="designation_id"
                      options={desData || []}
                      getOptionLabel={(option: any) => option.name || ""}
                    />
                  </Grid>
                  <Grid xs={6} item>
                    <Label className="pb-2" text="Department" />
                    <AutoComplete
                      name="department_id"
                      options={data || []}
                      getOptionLabel={(option: any) => option.name || ""}
                    />
                  </Grid>
                  <Grid xs={6} item>
                    <Label className="pb-2" text="Region" />
                    <Input name="region" />
                  </Grid>
                  <Grid xs={6} item>
                    <Label className="pb-2" text="Email-Address" />
                    <Input type="email" name="email" />
                  </Grid>
                  <Grid xs={6} item>
                    <Label className="pb-2" text="Contact No." />
                    <Input name="contact" />
                  </Grid>

                  <Grid xs={6} item>
                    <Label className="pb-2" text="Line Manager" />
                    <AutoComplete
                      name="line_manager_id"
                      options={userData || []}
                      onChange={(_, v) => {
                        if (v) {
                          setFieldValue("line_manager_id", v);
                          setFieldValue(
                            "secondary_line_manager_id",
                            v.line_manager
                          );
                        } else {
                          setFieldValue("line_manager_id", "");
                          setFieldValue("secondary_line_manager_id", "");
                        }
                      }}
                      getOptionLabel={(option: any) => option.name || ""}
                      renderOption={(options, row) => (
                        <li {...options}>
                          <div className={`px-2 cursor-pointer`}>
                            <div className="text-fc-dark">{row.name}</div>
                            <div className="text-fc-main">{row.email}</div>
                          </div>
                        </li>
                      )}
                    />
                  </Grid>
                  {/* <Grid xs={6} item>
                    <Label className='pb-2' text='Secondary Line Manager' />
                    <Input
                      name='secondary_line_manager_id'
                      value={
                        values?.secondary_line_manager_id
                          ? values?.secondary_line_manager_id?.name
                          : ""
                      }
                      disabled
                    />
                  </Grid> */}

                  <Grid xs={6} item>
                    <Label
                      className="pb-2"
                      text="Is Line Manager Approval Required"
                    />
                    <Checkbox
                      name="is_lm_approval_required"
                      checked={values.is_lm_approval_required}
                      onChange={(_, checked: boolean) => {
                        setLineManagerRequired(checked);
                        setFieldValue("is_lm_approval_required", checked);
                      }}
                    />
                  </Grid>
                  <Grid xs={12} item>
                    <Box className="flex justify-end">
                      <Button
                        color="secondary"
                        className="px-4 capitalize xl:text-sm 2xl:text-semi-base"
                        variant="contained"
                        onClick={() => onClose()}
                      >
                        Discard
                      </Button>
                      <Button
                        variant="contained"
                        className="capitalize ml-4 px-4 xl:text-sm 2xl:text-semi-base"
                        type="submit"
                        isLoading={isLoading}
                      >
                        {isUpdate ? "Save" : " Add"}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
                <Grid xs={12} className="my-6">
                  <Divider> OR </Divider>
                </Grid>
                <Grid
                  container
                  item
                  gap={3}
                  className="flex flex-col items-center justify-center"
                >
                  <Typography>Add a data in CSV format</Typography>
                  <Link href="/employee-configuration/import" passHref>
                    <Button
                      variant="contained"
                      className="capitalize ml-6 px-6"
                      startIcon={<Upload />}
                    >
                      Click to upload your file
                    </Button>
                  </Link>
                  <Typography className="text-sm	">
                    This option will allow you to import data only for the
                    existing feilds
                  </Typography>
                </Grid>
              </Grid>
            </Form>
          )}
        </Formik>
      )}
    </Dialog>
  );
};
