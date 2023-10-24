import {
  Box,
  Button,
  Divider,
  Grid,
  IconButton,
  InputLabel,
  TextField,
  Typography,
} from "@mui/material";
import Image from "next/image";
//import NextLink from "next/link";
import Head from "next/head";
import { Form, Formik } from "formik";
import { logoPath } from "constants/layout";
import { colors } from "constants/theme";
import { useCreateOrUpdate } from "hooks/useCreateOrUpdate";

import { useState } from "react";

import { toast } from "utils/toaster";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useRouter } from "next/router";

const initialState = {
  email: "",
  otp: "",
  password: "",
  confirmPassword: "",
  isPasswordVisible: false,
  isConfPasswordVisible: false,
};

const ForgotPassword = () => {
  const [otp, setOtp] = useState<string>("");

  const { mutate, isLoading } = useCreateOrUpdate({
    url: "auth/forgot-password/otp",
    onSuccess(data) {
      setOtp(data.data.data?.otp);
    },
  });

  const { mutate: changeData } = useCreateOrUpdate({
    url: "auth/forgot-password/",
    onSuccess() {},
  });
  const router = useRouter();

  return (
    <>
      <Grid container>
        <Head>
          <title>EMPLOYEE 360 ASSESSMENT TOOL | FORGOT PASSWORD</title>
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
                if (otp === "") {
                  mutate(values, {
                    onSuccess: () => {},
                  });
                } else {
                  if (values.otp == otp) {
                    if (values.confirmPassword === values.password) {
                      changeData(values, {
                        onSuccess: () => {
                          toast("Password Updated Successfully");
                          router.push("/sign-in");
                          resetForm();
                        },
                      });
                    } else {
                      toast("Passwords do not match", "error");
                    }
                  } else {
                    toast("Please Enter Correct OTP", "error");
                  }
                }
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
                  <Form className='w-full'>
                    <Box className='mt-10 flex flex-col w-4/5 py-10' gap={3}>
                      {!otp ? (
                        <div>
                          <InputLabel className='text-black mb-2'>
                            Email
                          </InputLabel>
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
                      ) : (
                        <div>
                          <InputLabel className='text-black mb-2'>
                            OTP
                          </InputLabel>
                          <TextField
                            fullWidth
                            type='text'
                            variant='outlined'
                            placeholder='Enter your otp'
                            className='bg-white'
                            name='otp'
                            onChange={handleChange}
                            onBlur={handleBlur}
                            value={values.otp}
                          />
                        </div>
                      )}

                      {otp && values.otp == otp && (
                        <>
                          <div>
                            <InputLabel className='text-black mb-2'>
                              Password
                            </InputLabel>
                            <TextField
                              fullWidth
                              type={
                                values.isPasswordVisible ? "text" : "password"
                              }
                              variant='outlined'
                              placeholder='Enter your password'
                              className='bg-white'
                              name='password'
                              onChange={handleChange}
                              onBlur={handleBlur}
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
                          <div>
                            <InputLabel className='text-black mb-2'>
                              Confirm Password
                            </InputLabel>
                            <TextField
                              fullWidth
                              type={
                                values.isConfPasswordVisible
                                  ? "text"
                                  : "password"
                              }
                              variant='outlined'
                              placeholder='Enter your confirm password'
                              className='bg-white'
                              name='confirmPassword'
                              onChange={handleChange}
                              onBlur={handleBlur}
                              InputProps={{
                                endAdornment: (
                                  <IconButton
                                    onClick={() =>
                                      setFieldValue(
                                        "isConfPasswordVisible",
                                        !values.isConfPasswordVisible
                                      )
                                    }
                                  >
                                    {!values.isConfPasswordVisible ? (
                                      <FiEye />
                                    ) : (
                                      <FiEyeOff />
                                    )}
                                  </IconButton>
                                ),
                              }}
                            />
                          </div>
                        </>
                      )}
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
                        {otp && values.otp == otp
                          ? "Change Password"
                          : "Send Otp"}
                      </Button>
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
    </>
  );
};

export default ForgotPassword;
