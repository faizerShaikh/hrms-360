import { Box, IconButton, InputLabel, TextField } from "@mui/material";
import { Formik } from "formik";
import { useCreateOrUpdate } from "hooks/useCreateOrUpdate";
import { ResponseInterface } from "interfaces/responseInterface";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { SET_SIDEBAR_MENU, useLayoutContext } from "stores/layout";
import { Button } from "components/layout";
import { setCookie } from "cookies-next";
import { cookieOptions } from "constants/config";
import { apsisAdminMenu } from "constants/layout";

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

const ApsisAdminSignIn: NextPage = () => {
  const { replace } = useRouter();
  const { dispatch } = useLayoutContext();

  const { mutate, isLoading } = useCreateOrUpdate<LoginBody>({
    url: "/auth/public-user/login",
    onSuccess(data: ResponseInterface) {
      setCookie("token", data.data.data.token, cookieOptions);
      setCookie("user", data.data.data.user, cookieOptions);
      setCookie("is_apsis_admin", true);
      dispatch({ type: SET_SIDEBAR_MENU, payload: apsisAdminMenu });

      replace("/");
    },
  });

  return (
    <>
      <Formik
        initialValues={initialState}
        onSubmit={(values, { resetForm }) => {
          mutate(
            values,

            {
              onSuccess: () => {
                resetForm();
              },
            }
          );
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
            <Box className='flex items-center justify-center rounded-xl h-screen flex-col'>
              <Box className='w-96 py-4 px-8  border-2 rounded-lg'>
                <Box>
                  <InputLabel className='text-black mb-2'>Email</InputLabel>
                  <TextField
                    fullWidth
                    type='email'
                    variant='outlined'
                    size='small'
                    placeholder='Enter your email'
                    className='bg-white'
                    name='email'
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.email}
                    helperText={errors.email}
                    error={
                      Boolean(errors.email) && Boolean(touched.email) && true
                    }
                  />
                </Box>
                <Box className='mt-4'>
                  <InputLabel className='text-black mb-2'>Password</InputLabel>
                  <TextField
                    fullWidth
                    type={values.isPasswordVisible ? "text" : "password"}
                    variant='outlined'
                    size='small'
                    placeholder='Enter your password'
                    className='bg-white'
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
                          {!values.isPasswordVisible ? <FiEye /> : <FiEyeOff />}
                        </IconButton>
                      ),
                    }}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.password}
                    helperText={errors.password}
                    error={
                      Boolean(errors.password) &&
                      Boolean(touched.password) &&
                      true
                    }
                  />
                </Box>

                <Box className='mt-6'>
                  <Button
                    fullWidth
                    variant='contained'
                    className='mr-2 capitalize  text-lg'
                    onClick={() => handleSubmit()}
                    isLoading={isLoading}
                  >
                    Sign in
                  </Button>
                </Box>
              </Box>
            </Box>
          </>
        )}
      </Formik>
    </>
  );
};

export default ApsisAdminSignIn;
