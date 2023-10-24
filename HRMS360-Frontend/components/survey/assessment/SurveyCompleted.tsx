import { Box } from "@mui/material";
import { Alert } from "components/layout/alert";
import React from "react";

export const SurveyCompleted = () => {
  return (
    <Box className='flex justify-center items-center h-screen'>
      <Alert text='Thanks for giving survey' variant='success' />
    </Box>
  );
};
