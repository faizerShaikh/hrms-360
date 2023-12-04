import { Add } from "@carbon/icons-react";
import { Typography, Box } from "@mui/material";
import { ActionCard, PageHeader } from "components/layout";
import { CookieValueTypes, getCookie } from "cookies-next";
import { TenentInterface } from "interfaces/tenant";
import { BaseProps } from "interfaces";
import { NextPageContext } from "next";
import React from "react";

export const getServerSideProps = (ctx: NextPageContext) => {
  let tenant: CookieValueTypes = getCookie("is_client", {
    req: ctx.req,
    res: ctx.res,
  });
  let is_NBOL = getCookie("is_NBOL", {
    req: ctx.req,
    res: ctx.res,
  });
  if (is_NBOL) {
    return {
      redirect: {
        destination: "/competency-bank/my",
        permanent: false,
      },
    };
  }
  let isChannelPartner = getCookie("is_channel_partner", {
    req: ctx.req,
    res: ctx.res,
  });
  if (isChannelPartner) {
    return {
      redirect: {
        destination: "/competency-bank/standard",
        permanent: false,
      },
    };
  }

  return { props: { data: tenant, is_NBOL } };
};

const CompetencyBank: BaseProps<TenentInterface> = ({ data }) => {
  return (
    <>
      <PageHeader title='All Competencies' />
      <Box className='flex items-center justify-start '>
        {/* <ActionCard
          className='mr-6 w-80'
          variant='primary'
          href='/competency-bank/standard'
        >
          <Typography
            className='mx-10   xl:text-sm  2xl:text-base'
            sx={{ fontFamily: "'Century Gothic', 'sans-serif'" }}
          >
            Standard Competencies
          </Typography>
        </ActionCard> */}
        {data && (
          <ActionCard
            className='mr-6 w-80'
            variant='secondary'
            href='/competency-bank/my'
          >
            <Typography
              className='mx-10   xl:text-sm  2xl:text-base'
              sx={{ fontFamily: "'Century Gothic', 'sans-serif'" }}
            >
              My Competencies
            </Typography>
          </ActionCard>
        )}
        <ActionCard
          className='mr-6 w-80'
          variant='tertiary'
          href='/competency-bank/add'
        >
          <div className='mx-10 flex items-center justify-center'>
            <Add size='32' />
            <Typography
              className='ml-1 xl:text-sm  2xl:text-base'
              sx={{ fontFamily: "'Century Gothic', 'sans-serif'" }}
            >
              Add New Competency
            </Typography>
          </div>
        </ActionCard>
      </Box>
    </>
  );
};

export default CompetencyBank;
