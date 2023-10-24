import React, { useEffect, useState } from "react";
import { Grid, Stack, Typography } from "@mui/material";
import {
  AutoComplete,
  Button,
  Dialog,
  Label,
  RadioGroup,
} from "components/layout";
import { Formik, FormikHelpers } from "formik";
import { CookieValueTypes, getCookie, setCookie } from "cookies-next";
import * as yup from "yup";

import { useGetAll } from "hooks/useGetAll";
import { colors } from "constants/theme";
import { SET_SIDEBAR_MENU, useLayoutContext } from "stores/layout";
import {
  adminMenu,
  hrmsTenantMenu,
  nbolHrmsTenantMenu,
} from "constants/layout";
import { cookieOptions } from "constants/config";
import { TenentInterface } from "interfaces/tenant";
import { TenantSwitchIcon } from "utils/Icons";
import { getParsedCookie } from "utils/getParsedCookie";
import { onError } from "utils/onError";
import { queryClient } from "configs/queryClient";

interface initialValuesType {
  admin_type: string;
  client_name: TenentInterface;
}

const validations = yup.object({
  admin_type: yup.string().required("Admin Type is required"),
  client_name: yup.mixed().when("admin_type", {
    is: (value: any) => value === "client_admin",
    then: yup.mixed().required("Select a tenant"),
  }),
});

export const TenantDialog = () => {
  const { data, refetch, isLoading } = useGetAll({
    key: "/channel-partner/tenant",
    enabled: false,
    select: (data) => {
      return data.data.data.rows;
    },
  });

  const { dispatch } = useLayoutContext();

  const [isSystemAdmin, setIsSystemAdmin] = useState<CookieValueTypes>(false);

  const [clientName, setClientName] = useState<CookieValueTypes>("");

  const [adminType, setAdminType] = useState("");

  const [isClient, setIsClient] = useState<CookieValueTypes>(false);

  const [isApsisAdmin, setIsApsisAdmin] = useState<CookieValueTypes>(false);

  const onOpen = () => {
    const tenant = getParsedCookie("tenant");
    const initialTenant = getParsedCookie("initial_tenant");
    if (initialTenant && tenant) {
      setIsSystemAdmin(getCookie("is_channel_partner"));
      setClientName(tenant.name);
      setAdminType(
        getCookie("is_channel_partner") ? "system_admin" : "client_admin"
      );

      setIsClient(!initialTenant.is_channel_partner);
    }
    setIsApsisAdmin(getCookie("is_apsis_admin"));
  };

  useEffect(() => {
    onOpen();
  }, []);

  const initialValues: initialValuesType = {
    admin_type: isSystemAdmin ? "system_admin" : "client_admin",
    client_name: data?.find(
      (element: any) => element.schema_name === getCookie("schema_name")
    ) ?? { id: "", name: "", schema_name: "" },
  };

  const changeAdminType = async (data: initialValuesType) => {
    try {
      if (!data.client_name?.id && data.admin_type === "client_admin") {
        throw new Error("Please select client before switching");
      }
      if (adminType === "client_admin") {
        const is_NBOL = getCookie("is_NBOL");
        setCookie("is_channel_partner", false, cookieOptions);
        setCookie("is_client", true, cookieOptions);
        setCookie("schema_name", data?.client_name?.schema_name, cookieOptions);

        setCookie("tenant", data?.client_name, cookieOptions);
        dispatch({
          type: SET_SIDEBAR_MENU,
          payload: is_NBOL ? nbolHrmsTenantMenu : hrmsTenantMenu,
        });
        queryClient.removeQueries();
        setIsSystemAdmin(getCookie("is_channel_partner"));
        setClientName(data?.client_name.name);

        window.location.pathname = "/";
      } else {
        setCookie("is_channel_partner", true, cookieOptions);
        setCookie("is_client", false, cookieOptions);
        setCookie(
          "schema_name",
          getCookie("initial_schema_name"),
          cookieOptions
        );
        setCookie("tenant", getCookie("initial_tenant"), cookieOptions);
        dispatch({ type: SET_SIDEBAR_MENU, payload: adminMenu });
        setIsSystemAdmin(getCookie("is_channel_partner"));
        setClientName(getParsedCookie("initial_tenant").name);
        queryClient.removeQueries();
        window.location.pathname = "/admin/dashboard";
      }
    } catch (error) {
      onError(error);
    }
  };

  if (isClient || isApsisAdmin) {
    return null;
  }

  return (
    <>
      {!isApsisAdmin && (
        <Dialog
          buttonOnClick={() => {
            refetch();
            onOpen();
          }}
          button={
            <Button
              variant='text'
              startIcon={
                <TenantSwitchIcon className='mr-2' fill={colors.primary.dark} />
              }
            >
              <Stack>
                <Typography
                  color={colors.primary.dark}
                  className='flex text-base justify-between items-center w-full'
                >
                  {isSystemAdmin ? "System Admin" : "Client Admin"}
                </Typography>
                <Typography
                  className='line-clamp-2 text-xs truncate text-end w-full'
                  color={colors.text.dark}
                >
                  {clientName}
                </Typography>
              </Stack>
            </Button>
          }
          title='Switch Profile'
        >
          {({ onClose }) => (
            <Formik
              initialValues={initialValues}
              onSubmit={(
                values: initialValuesType,
                { resetForm, setSubmitting }: FormikHelpers<initialValuesType>
              ) => {
                resetForm;
                setSubmitting;
                changeAdminType(values);
                onClose();
              }}
              validationSchema={validations}
              enableReinitialize={true}
            >
              {({ submitForm, setFieldValue }) => (
                <>
                  <Typography className='py-5'>Select Profile Type</Typography>
                  <RadioGroup
                    label=''
                    row
                    onChange={(e) => {
                      setFieldValue("admin_type", e.target.value);
                      setAdminType(e.target.value);
                    }}
                    name='admin_type'
                    value={adminType}
                    options={[
                      { value: "system_admin", label: "System Admin" },
                      { value: "client_admin", label: "Client Admin" },
                    ]}
                  />
                  {adminType === "client_admin" && (
                    <Grid container>
                      <Grid xs={12} item>
                        <Label className='py-3' text='Select Client' />
                        <AutoComplete
                          loading={isLoading}
                          name='client_name'
                          options={data?.filter(
                            (e: any) =>
                              new Date(e?.end_date) > new Date() && e.is_active
                          )}
                          getOptionLabel={(option: any) => option.name || ""}
                          className='pb-4'
                        />
                      </Grid>
                    </Grid>
                  )}

                  <Grid container justifyContent={"end"} className='mt-4'>
                    <Grid item>
                      <Button
                        color='secondary'
                        variant='contained'
                        className='mr-4 capitalize'
                        onClick={() => onClose()}
                      >
                        Discard
                      </Button>
                    </Grid>
                    <Grid item>
                      <Button
                        variant='contained'
                        className='mr-2 capitalize'
                        onClick={() => submitForm()}
                      >
                        Confirm Switch
                      </Button>
                    </Grid>
                  </Grid>
                </>
              )}
            </Formik>
          )}
        </Dialog>
      )}
    </>
  );
};
