import { Close } from "@carbon/icons-react";
import {
  Autocomplete as MuiAutoComplete,
  AutocompleteProps,
} from "@mui/material";
import { Chip } from "components/layout/chip";
import { colors } from "constants/theme";
import { useField, useFormikContext } from "formik";
import { useGetAll } from "hooks/useGetAll";
import { Input } from "../input";

interface AutocompletePropTypes<
  T,
  Multiple extends boolean | undefined = undefined,
  DisableClearable extends boolean | undefined = undefined,
  FreeSolo extends boolean | undefined = undefined
> extends Partial<AutocompleteProps<T, Multiple, DisableClearable, FreeSolo>> {
  label?: string;
  name?: string;
  url?: string;
}

const defGetOptionLabel = (option: any) => option;

export const AutoComplete = <
  T,
  Multiple extends boolean | undefined = undefined,
  DisableClearable extends boolean | undefined = undefined,
  FreeSolo extends boolean | undefined = undefined
>({
  label,
  options = [],
  getOptionLabel = defGetOptionLabel,
  url,
  name,
  onChange,
  value,
  ...otherProps
}: AutocompletePropTypes<T, Multiple, DisableClearable, FreeSolo>) => {
  const { data } = useGetAll({
    key: url ? url : "",
    enabled: !options.length && Boolean(url),
  });

  let textFieldConfig: any = {
    fullWidth: true,
    sx: {
      "& .MuiInputBase-root": {
        padding: "7px 10px",
      },
      ...otherProps.sx,
    },
    ...otherProps,
  };

  let setFieldValue: (
    field: string,
    value: any,
    shouldValidate?: boolean
  ) => void;
  let setFieldTouched: (
    field: string,
    isTouched?: boolean,
    shouldValidate?: boolean
  ) => void;
  if (name) {
    //eslint-disable-next-line
    const [field, meta] = useField(name || "");
    //eslint-disable-next-line
    const ctx = useFormikContext();
    setFieldValue = ctx.setFieldValue;
    setFieldTouched = ctx.setFieldTouched;
    textFieldConfig = {
      ...field,
      ...textFieldConfig,
    };
    if (meta && meta.touched && meta.error) {
      textFieldConfig.error = true;
      textFieldConfig.helperText = meta.error;
    }
  }

  const onChangeInner = (e: any, value: any, option: any) => {
    if (onChange) {
      return onChange(e, value, option);
    }
    if (name && setFieldValue) {
      setFieldValue(name, value);
      setFieldTouched(name, true, true);
    }
  };

  return (
    <MuiAutoComplete
      options={(data && "rows" in data ? data.rows : data) || options || []}
      getOptionLabel={getOptionLabel || ""}
      size={"small"}
      className='text-dark'
      {...textFieldConfig}
      value={textFieldConfig.value || value}
      onChange={onChangeInner}
      onBlur={() => {
        name && setFieldTouched(name, true, true);
      }}
      renderTags={(tagValue, getTagProps) => {
        return tagValue.map(
          (option: any, index) =>
            option && (
              <Chip
                {...getTagProps({ index })}
                className='mb-2 mr-2'
                label={getOptionLabel(option)}
                deleteIcon={<Close size={"16"} fill={colors.text.dark} />}
              />
            )
        );
      }}
      renderInput={(params) => (
        <div ref={params.InputProps.ref}>
          <Input
            label={label}
            {...params}
            error={textFieldConfig?.error}
            helperText={textFieldConfig?.helperText}
            inputProps={{
              ...params.inputProps,
            }}
            InputLabelProps={{ shrink: true }}
          />
        </div>
      )}
    />
  );
};
