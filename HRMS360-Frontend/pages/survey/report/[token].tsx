import React from "react";
import { setApiHeaders } from "utils/setApiHeaders";
import { NextPageContext } from "next";
import Head from "next/head";

import { Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import { Box, CircularProgress } from "@mui/material";
import { serverAPI } from "configs/api";

export const getServerSideProps = async (ctx: NextPageContext) => {
  setApiHeaders(ctx);

  const res = await serverAPI.get(
    `/reports/single-response-report/${ctx.query.token}`
  );

  return {
    props: {
      filePath: res.data.data.filePath,
    },
  };
};

const Report = ({ filePath }: any) => {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  return (
    <>
      <Head>
        <title>Employee 360 feedback report</title>
      </Head>
      <div className='mx-auto'>
        <Viewer
          defaultScale={1.5}
          renderLoader={() => (
            <Box className='w-screen h-screen flex justify-center items-center'>
              <CircularProgress color='primary' size={50} />
            </Box>
          )}
          fileUrl={`${
            process.env.NEXT_PUBLIC_API_URL?.split("/api/v1")[0]
          }${filePath}`}
          plugins={[defaultLayoutPluginInstance]}
        />
      </div>
    </>
  );
};

export default Report;
