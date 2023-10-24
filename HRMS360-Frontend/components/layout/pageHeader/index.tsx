import { Box, Typography } from "@mui/material";
import { colors } from "constants/theme";
import Head from "next/head";
import React from "react";

interface PageHeaderProps {
  title: string;
  className?: string;
}

export const PageHeader = ({ title, className }: PageHeaderProps) => {
  return (
    <>
      <Head>
        <title>{`360 Review | ${title}`}</title>
      </Head>
      <Box>
        <Typography
          component="h2"
          variant="h6"
          className={`font-normal border-b-2  uppercase  pb-2 pt-2 lg:text-base  xl:text-base 2xl:text-lg ${
            className ? className : "mb-10"
          }`}
          color={colors.text.dark}
        >
          {title}
        </Typography>
      </Box>
    </>
  );
};
