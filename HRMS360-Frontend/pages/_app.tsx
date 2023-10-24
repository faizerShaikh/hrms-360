import * as React from "react";
import type { AppProps } from "next/app";
import { CacheProvider, EmotionCache } from "@emotion/react";
import {
  ThemeProvider,
  CssBaseline,
  StyledEngineProvider,
} from "@mui/material";
import { createEmotionCache, theme } from "configs/styles";
import { SideNav } from "components";
import { useRouter } from "next/router";
import { Toaster } from "react-hot-toast";
import NextNProgress from "nextjs-progressbar";
// css
import "react-toastify/dist/ReactToastify.css";
import "tailwindcss/tailwind.css";
import "styles/globals.css";
import { QueryClientProvider } from "react-query";
import { queryClient } from "configs";
import { ReactQueryDevtools } from "react-query/devtools";
import { LayoutProvider } from "stores/layout";
import { Worker } from "@react-pdf-viewer/core";
interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

const clientSideEmotionCache = createEmotionCache();
// comment for test
const MyApp: React.FunctionComponent<MyAppProps> = (props) => {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  const router = useRouter();

  const hideSideBarPages = [
    "/apsis-admin/sign-in",
    "/sign-in",
    "/forgot-password",
    "/survey/assessment/[token]",
    "/survey/assessment/multiple/[token]",
    "/survey/assessment/single/[token]",
    "/survey/assessment-old/[token]",
    "/_error",
    "/survey/report/[token]",
    "/404",
  ];

  return (
    <StyledEngineProvider injectFirst>
      <CacheProvider value={emotionCache}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <LayoutProvider>
              <NextNProgress color={theme.palette.primary.main} />
              {!hideSideBarPages.includes(router.pathname) ? (
                <SideNav>
                  <Component {...pageProps} />
                </SideNav>
              ) : (
                <Worker workerUrl='https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js'>
                  <Component {...pageProps} />
                </Worker>
              )}
            </LayoutProvider>
            <Toaster
              position='bottom-center'
              reverseOrder={false}
              toastOptions={{
                duration: 3000,
              }}
            />
          </ThemeProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </CacheProvider>
    </StyledEngineProvider>
  );
};

export default MyApp;
