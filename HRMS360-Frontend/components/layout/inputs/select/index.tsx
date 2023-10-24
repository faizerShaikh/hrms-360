import { Select as MuiSelect, SelectProps } from "@mui/material";

export const Select = ({
  border = true,
  sx,
  ...props
}: SelectProps & { border?: boolean }) => {
  const selectStyles = {
    height: "25px",
    width: "100%",
    fontSize: "10px",
    margin: "0px 8px",
    "& .MuiOutlinedInput-notchedOutline": {
      border: !border ? "none" : "0.7px solid #E0E7ED",
    },
    "& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
      border: !border ? "none" : "0.7px solid #E0E7ED",
    },
    ...sx,
  };
  return (
    <MuiSelect sx={{ ...selectStyles }} size="small" {...props}>
      {props.children}
    </MuiSelect>
  );
};
