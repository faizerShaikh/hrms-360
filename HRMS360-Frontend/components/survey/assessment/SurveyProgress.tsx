import React from "react";

import { Typography, CircularProgress } from "@mui/material";
import { Box } from "@mui/system";

export const SurveyProgress = ({ value }: { value: number }) => {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) =>
        value < prevProgress ? prevProgress - 1 : prevProgress + 1
      );
    }, 10);

    if (progress === value) {
      clearInterval(timer);
    }
    return () => {
      clearInterval(timer);
    };
  }, [progress, value]);

  return (
    <Box sx={{ position: "relative" }}>
      <CircularProgress
        variant='determinate'
        sx={{
          color: (theme) => theme.palette.grey[200],
        }}
        size={250}
        value={100}
      />
      <CircularProgress
        variant='determinate'
        disableShrink
        sx={{
          color: "#0DC7B1",
          animationDuration: "1000ms",
          animation: "ease-out",
          position: "absolute",
          left: 0,
        }}
        size={250}
        value={progress}
      />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: "absolute",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography
          variant='caption'
          component='div'
          className='font-bold text-[30px]'
        >{`${Math.round(progress)}%`}</Typography>
      </Box>
    </Box>
  );
};
