import React from "react";
import {
  FormControlLabel,
  Switch as MuiSwitch,
  SwitchProps,
} from "@mui/material";
import { useField, useFormikContext } from "formik";
import { colors } from "constants/theme";

export const Switch = ({
  name,
  label,
  ...otherProps
}: SwitchProps & { name: string; label?: string }) => {
  const [field] = useField(name);
  const textFieldConfig: SwitchProps = {
    ...field,
    ...otherProps,
    sx: { ...otherProps.sx },
  };

  const { setFieldValue } = useFormikContext();

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFieldValue(name, e.target.checked);
  };

  return label ? (
    <FormControlLabel
      labelPlacement="start"
      sx={{
        "& .MuiTypography-root": {
          fontSize: {
            sm: "15px",
            xl: "15px",
            lg: "15px",
          },
          color: colors.text.dark,
        },
      }}
      control={
        <MuiSwitch
          name={name}
          {...textFieldConfig}
          onChange={onChange}
          checked={field.value}
        />
      }
      label={label}
    />
  ) : (
    <MuiSwitch
      name={name}
      {...textFieldConfig}
      onChange={onChange}
      checked={field.value}
    />
  );
};
