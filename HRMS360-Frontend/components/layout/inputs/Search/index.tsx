import { TextField, TextFieldProps } from "@mui/material";
import { colors } from "constants/theme";
import React from "react";
import { Close, Search as SearchIcon } from "@carbon/icons-react";
import { VoidFunction } from "types/functionTypes";
const searchInputStyle = {
  "& .MuiInputBase-root": {
    borderRadius: "8px",
    padding: "13px 15px",
  },
  "& .MuiInputBase-root input": {
    padding: 0,
    paddingLeft: "10px",
  },
  "& .MuiInputBase-root.MuiInputBase-sizeSmall": {
    padding: "6.5px 15px",
  },
  "& .MuiInputBase-root .MuiOutlinedInput-notchedOutline": {
    border: "2px solid #E0E7ED",
  },
  "& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    border: `2px solid ${colors.tertiary.dark}`,
  },
};

export const Search = ({
  sx,
  className,
  onClear,
  ...props
}: TextFieldProps & { onClear?: VoidFunction }) => {
  return (
    <TextField
      fullWidth
      sx={{ ...searchInputStyle, ...sx }}
      variant="outlined"
      size="small"
      className={className}
      InputProps={{
        endAdornment: props.value ? (
          <div
            className="cursor-pointer h-full flex items-center"
            onClick={() => onClear && onClear()}
          >
            <Close />
          </div>
        ) : (
          <></>
        ),
        startAdornment: <SearchIcon size={20} color={colors.tertiary.dark} />,
      }}
      placeholder="Search..."
      {...props}
    />
  );
};
