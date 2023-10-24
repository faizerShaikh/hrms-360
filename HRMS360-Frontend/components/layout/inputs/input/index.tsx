import { TextField, TextFieldProps } from "@mui/material";
import { colors } from "constants/theme";
import React from "react";
import { useField } from "formik";

export const inputStyles = {
  "& .MuiFormLabel-root": {
    "&.Mui-focused": {
      color: colors.text.dark,
    },
    color: colors.text.dark,
    position: "initial",
    fontSize: "20px",
    marginBottom: "8px",
    fontWeight: "400",
  },
  "& .MuiInputBase-root": {
    "&.Mui-disabled": {
      background: `${colors.tertiary.dark}20`,
    },
    "&.MuiInputBase-multiline": {
      padding: "0",
    },
    background: `${colors.tertiary.light}70`,
    border: `1.5px solid ${colors.tertiary.light}`,
    borderRadius: "6px",
    "& .MuiInputBase-input": {
      padding: "7px 10px",
      fontSize: "14px",
      color: colors.text.light,
    },
    "&:after, &:before": {
      display: "none",
    },
  },
};

export const Input = ({
  name = "",
  variant = "filled",
  ...otherProps
}: TextFieldProps) => {
  let textFieldConfig: TextFieldProps = {
    variant,
    InputLabelProps: { shrink: true },
    fullWidth: true,
    ...otherProps,
    sx: { ...inputStyles, ...otherProps.sx },
  };
  if (name) {
    //eslint-disable-next-line
    const [field, meta] = useField(name || "");
    textFieldConfig = {
      ...field,
      ...textFieldConfig,
    };

    if (meta && meta.touched && meta.error) {
      textFieldConfig.error = true;
      textFieldConfig.helperText = meta.error;
    }
  }
  return (
    <>
      <TextField {...textFieldConfig} />
    </>
  );
};
