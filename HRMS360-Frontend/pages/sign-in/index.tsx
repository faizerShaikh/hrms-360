import {
  Box,
  Divider,
  Grid,
  IconButton,
  InputLabel,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import { NextPage, NextPageContext } from "next";
import React from "react";
import Image from "next/image";
import NextLink from "next/link";
import { colors } from "constants/theme";
import { Form, Formik } from "formik";
import { Button } from "components/layout";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useCreateOrUpdate } from "hooks/useCreateOrUpdate";
import { ResponseInterface } from "interfaces";
import { getCookie, setCookie } from "cookies-next";
import { useRouter } from "next/router";
import { SET_SIDEBAR_MENU, useLayoutContext } from "stores/layout";
import {
  adminMenu,
  employeeMenu,
  hrmsTenantMenu,
  logoPath,
  nbolHrmsTenantMenu,
} from "constants/layout";
import { cookieOptions } from "constants/config";
import Head from "next/head";

interface LoginBody {
  email: string;
  password: string;
  isPasswordVisible?: boolean;
}

const initialState: LoginBody = {
  email: "",
  password: "",
  isPasswordVisible: false,
};

export const getServerSideProps = ({ req, res }: NextPageContext) => {
  const token = getCookie("token", { req, res });

  if (token) {
    return {
      redirect: {
        permanent: false,
        destination: "/",
      },
    };
  }

  return { props: {} };
};

const SignIn: NextPage = () => {
  const { replace, query } = useRouter();
  const { dispatch } = useLayoutContext();

  const { mutate, isLoading } = useCreateOrUpdate<LoginBody>({
    url: "/auth/login",
    onSuccess(data: ResponseInterface) {
      let is_NBOL = false;
      setCookie("token", data.data.data.token, cookieOptions);
      setCookie("is_NBOL", is_NBOL, cookieOptions);
      setCookie(
        "is_client",
        !data.data.data.tenant.is_channel_partner,
        cookieOptions
      );
      setCookie(
        "schema_name",
        data.data.data.tenant.schema_name,
        cookieOptions
      );

      setCookie("tenant", data.data.data.tenant, cookieOptions);

      setCookie(
        "is_tenant_admin",
        JSON.stringify(data.data.data.user.is_tenant_admin),
        cookieOptions
      );

      if (!data.data.data.tenant.is_channel_partner) {
        if (!data.data.data.user.is_tenant_admin) {
          dispatch({
            type: SET_SIDEBAR_MENU,
            payload: employeeMenu,
          });
          setCookie("menu", JSON.stringify(employeeMenu), cookieOptions);
        } else {
          dispatch({
            type: SET_SIDEBAR_MENU,
            payload: is_NBOL ? nbolHrmsTenantMenu : hrmsTenantMenu,
          });
          setCookie(
            "menu",
            JSON.stringify(is_NBOL ? nbolHrmsTenantMenu : hrmsTenantMenu),
            cookieOptions
          );
        }
      } else {
        dispatch({ type: SET_SIDEBAR_MENU, payload: adminMenu });
        setCookie("menu", JSON.stringify(adminMenu), cookieOptions);
      }

      if (data.data.data.tenant.is_channel_partner) {
        setCookie("is_channel_partner", JSON.stringify(true), cookieOptions);
      }

      setCookie(
        "initial_schema_name",
        data.data.data.tenant.schema_name,
        cookieOptions
      );
      setCookie("initial_tenant", data.data.data.tenant, cookieOptions);

      setCookie("user", JSON.stringify(data.data.data.user), cookieOptions);

      replace(
        query?.next && typeof query?.next === "string" ? query?.next : "/"
      );
    },
  });

  return (
    <Grid container>
      <Head>
        <title>EMPLOYEE 360 ASSESSMENT TOOL | SIGN IN</title>
      </Head>
      <Grid
        xs={12}
        md={6}
        item
        className='flex items-center justify-center flex-col'
      >
        <Box
          className='flex items-center justify-center flex-col'
          width='60%'
          height='100%'
        >
          <Image
            alt='company_logo'
            src={logoPath}
            width='256.42px'
            height='87.36px'
            className='my-8'
          />

          <Divider
            color={colors.secondary.dark}
            className='w-10/12 mx-auto my-2'
          />
          <Typography className='font-semibold text-xl'>
            EMPLOYEE 360 ASSESSMENT TOOL
          </Typography>
          <Formik
            initialValues={initialState}
            onSubmit={(values, { resetForm }) => {
              mutate(values, {
                onSuccess: () => {
                  resetForm();
                },
              });
            }}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              handleSubmit,
              setFieldValue,
            }) => (
              <>
                <Form className='w-full mx-auto flex justify-center items-center flex-col'>
                  <Box className='mt-10 flex flex-col w-4/5 py-10' gap={3}>
                    <div>
                      <InputLabel className='text-black mb-2'>Email</InputLabel>
                      <TextField
                        fullWidth
                        type='email'
                        variant='outlined'
                        placeholder='Enter your email'
                        className='bg-white'
                        name='email'
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.email}
                        helperText={errors.email}
                        error={
                          Boolean(errors.email) &&
                          Boolean(touched.email) &&
                          true
                        }
                      />
                    </div>
                    <div>
                      <InputLabel className='text-black mb-2'>
                        Password
                      </InputLabel>
                      <TextField
                        fullWidth
                        type={values.isPasswordVisible ? "text" : "password"}
                        variant='outlined'
                        placeholder='Enter your password'
                        onChange={handleChange}
                        onBlur={handleBlur}
                        name='password'
                        InputProps={{
                          endAdornment: (
                            <IconButton
                              onClick={() =>
                                setFieldValue(
                                  "isPasswordVisible",
                                  !values.isPasswordVisible
                                )
                              }
                            >
                              {!values.isPasswordVisible ? (
                                <FiEye />
                              ) : (
                                <FiEyeOff />
                              )}
                            </IconButton>
                          ),
                        }}
                        value={values.password}
                        helperText={errors.password}
                        error={
                          Boolean(errors.password) &&
                          Boolean(touched.password) &&
                          true
                        }
                      />
                    </div>
                    <NextLink href='/forgot-password'>
                      <Link className='text-right' color='secondary'>
                        Forgot Password
                      </Link>
                    </NextLink>
                  </Box>
                  <Box className='my-6 flex flex-col w-4/5' gap={3}>
                    <Button
                      fullWidth
                      disabled={isLoading}
                      type='submit'
                      variant='contained'
                      className='mr-2 capitalize p-3 text-lg'
                      onClick={() => handleSubmit()}
                    >
                      Sign in
                    </Button>
                    {/* <Button
                    fullWidth
                    isLoading={isLoading}
                    variant='outlined'
                    className='mr-2 capitalize p-3 text-lg'
                  >
                    Register
                  </Button> */}
                  </Box>
                </Form>
              </>
            )}
          </Formik>
        </Box>
      </Grid>
      <Grid item xs={12} md={6} className='h-screen'>
        <Box className='h-full relative'>
          <Box
            className='glass p-7 w-3/4 absolute bottom-0 left-1/2 text-white text-base text-center'
            sx={{ transform: "translate(-50%,-50%)" }}
          >
            Gather confidential and anonymous feedback at the
            <br /> click of a button
          </Box>
          <Image
            alt='Banner Image'
            src='/media/images/sign-in-bg.png'
            layout='fill'
            objectFit='cover'
            objectPosition='center'
            style={{ zIndex: -100 }}
          />
        </Box>
      </Grid>
    </Grid>
  );
};

export default SignIn;
