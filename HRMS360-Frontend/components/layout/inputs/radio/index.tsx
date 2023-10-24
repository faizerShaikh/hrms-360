import {
  FormControl,
  FormControlLabel,
  FormControlLabelProps,
  FormLabel,
  Radio,
  RadioGroup as MuiRadioGroup,
  RadioGroupProps,
} from "@mui/material";
import { colors } from "constants/theme";
import React, { ChangeEvent } from "react";

interface RadioOption {
  value: string | number;
  label: string;
}
export interface RadioGroupPropTypes extends RadioGroupProps {
  label: string;
  options?: RadioOption[];
  formControlProps?: Omit<FormControlLabelProps, "control" | "label" | "sx">;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const RadioGroup = ({
  label,
  options,
  onChange,
  ...otherProps
}: RadioGroupPropTypes) => {
  return (
    <FormControl>
      <FormLabel
        sx={{
          "color": colors.text.dark,
          "fontSize": {
            sm: "14px",
            xl: "15px",
            lg: "14px",
          },
          "&.Mui-focused": {
            color: colors.text.dark,
          },
        }}
        id={`demo-radio-buttons-group-label-${label}`}
      >
        {label}
      </FormLabel>
      <MuiRadioGroup
        {...otherProps}
        aria-labelledby={`demo-radio-buttons-group-label-${label}`}
        name={`radio-buttons-group-${label}`}
        onChange={(e) => {
          onChange && onChange(e);
        }}
      >
        {options?.map((item) => (
          <FormControlLabel
            className='text-sm md:text-base flex justify-start items-start'
            id={Math.random() < 0.5 ? "select" : undefined}
            {...otherProps?.formControlProps}
            key={item?.value?.toString()}
            value={item.value}
            sx={{
              "& .MuiTypography-root": {
                fontSize: "inherit",
                padding: "9px",
              },
            }}
            control={
              <Radio
                sx={{
                  color: colors.primary.dark,
                }}
              />
            }
            label={item.label}
          />
        ))}
      </MuiRadioGroup>
    </FormControl>
  );
};
