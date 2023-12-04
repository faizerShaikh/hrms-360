import { Add } from "@carbon/icons-react";
import { Box, Typography } from "@mui/material";
import { ActionCard, PageHeader } from "components/layout";
import { NextPage } from "next";
import React from "react";

const MySurvey: NextPage = () => {
  return (
    <>
      <PageHeader title='My Survey' />
      <Box className='flex items-center justify-start'>
        <ActionCard className='mr-4 w-80' variant='primary' href='/survey/all'>
          <Typography
            className='mx-20 xl:text-sm 2xl:text-base'
            sx={{ fontFamily: "'Century Gothic', 'sans-serif'" }}
          >
            All Survey
          </Typography>
        </ActionCard>
        <ActionCard className='mr-4 w-80' variant='tertiary' href='/survey/add'>
          <div className='mx-10 flex items-center justify-center'>
            <Add size='32' />
            <Typography
              className='xl:text-sm 2xl:text-base'
              sx={{ fontFamily: "'Century Gothic', 'sans-serif'" }}
            >
              Create New Survey
            </Typography>
          </div>
          {/* <RaterDetails /> */}
        </ActionCard>
      </Box>
    </>
  );
};

export default MySurvey;
