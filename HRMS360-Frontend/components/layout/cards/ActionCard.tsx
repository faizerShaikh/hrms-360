import { Box, BoxProps } from "@mui/material";
import { colors } from "constants/theme";
import React from "react";
import NextLink from "next/link";
export type ActionVarient = "primary" | "secondary" | "tertiary";
interface ActionCardProps extends BoxProps {
  children: React.ReactNode;
  variant: ActionVarient;
  className?: string;
  href?: string;
  xs?: number;
}

export const ActionCard = ({
  variant = "primary",
  href = "#",
  className,
  children,
  ...boxProps
}: ActionCardProps) => {
  return (
    <NextLink href={href} passHref>
      <Box
        className={`cursor-pointer p-3 rounded-lg flex items-center justify-center font-light text-xl ${
          className || ""
        }`}
        sx={{
          "background": colors[variant].light,
          "borderLeft": `2px solid ${colors[variant].dark}`,
          "height": "115px",
          "minWidth": "220px",
          "width": "220px",
          "color": colors.text.dark,
          "&:hover": {
            background: `${colors[variant].light}90`,
          },
          ...boxProps.sx,
        }}
        {...boxProps}
      >
        {children}
      </Box>
    </NextLink>
  );
};
