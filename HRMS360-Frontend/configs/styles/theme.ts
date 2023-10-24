import { createTheme } from "@mui/material/styles";
import { colors } from "constants/theme";

export const theme = createTheme({
  palette: {
    primary: {
      light: colors.primary.light,
      main: colors.primary.dark,
      dark: colors.primary.dark,
      contrastText: colors.primary.text || "#ffffff",
    },
    secondary: {
      main: colors.secondary.dark,
      light: colors.secondary.light,
      contrastText: colors.secondary.text || "#ffffff",
    },
  },
  typography: {
    fontFamily: [
      "'Aller', sans-serif",
      "'Aller Display', sans-serif",
      "'Aller Light', sans-serif",
      "'Century Gothic', sans-serif",
    ].join(),
  },
});
