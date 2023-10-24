import { Chip as MuiChip, ChipProps } from "@mui/material";
import { colors } from "constants/theme";

const chipStyles = {
  background: "white",
  color: colors.text.dark,
  border: `2px solid ${colors.primary.light}`
};

export const Chip = (props: ChipProps) => {
  return <MuiChip {...props} sx={chipStyles} />;
};
