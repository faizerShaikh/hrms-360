import { Checkmark, Close } from "@carbon/icons-react";
import { Box, Typography } from "@mui/material";
import { colors } from "constants/theme";
import React from "react";

interface AlertProps {
  variant: "success" | "error";
  text: string;
}

export const Alert = ({ variant = "success", text }: AlertProps) => {
  return (
    <Box
      sx={{ width: { md: "522px", sm: "300px" }, height: "266px" }}
      className='rounded border border-t-primary border-t-4 rounded-t-lg flex flex-col justify-evenly items-center p-10 relative'
    >
      <Box
        className='rounded-full flex items-center justify-center absolute top-0 -translate-y-1/2'
        sx={{
          backgroundColor: colors.primary.dark,
          height: "79px",
          width: "79px",
          //   top:
        }}
      >
        {variant === "success" ? (
          <Checkmark height={"60px"} width='60px' style={{ color: "white" }} />
        ) : (
          <Close height={"60px"} width='60px' style={{ color: "white" }} />
        )}
      </Box>
      <Typography
        color={variant === "success" ? "primary" : "error"}
        className='text-3xl md:text-4xl '
      >
        {variant === "success" ? "SUCCESS!" : "ERROR!"}
      </Typography>
      <Typography className='text-sm md:text-lg'>{text}</Typography>
    </Box>
  );
};
