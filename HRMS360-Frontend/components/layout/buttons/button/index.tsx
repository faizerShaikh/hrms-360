import React from "react";
import {
  Button as MuiButton,
  ButtonProps,
  CircularProgress,
} from "@mui/material";

export interface ButtonPropTypes extends ButtonProps {
  isLoading?: boolean;
}

export const Button = ({
  isLoading = false,
  children,
  ...otherProps
}: ButtonPropTypes) => {
  return (
    <MuiButton
      disableElevation
      variant={otherProps.variant || "contained"}
      sx={{
        "& .MuiButton-startIcon": {
          marginRight: "2px",
        },
      }}
      disabled={isLoading || otherProps.disabled}
      startIcon={
        (isLoading && <CircularProgress size={"15px"} color="inherit" />) ||
        otherProps.startIcon
      }
      className={`${otherProps.className}  capitalize xl:text-sm 2xl:text-base`}
      {...otherProps}
    >
      {children}
    </MuiButton>
  );
};
