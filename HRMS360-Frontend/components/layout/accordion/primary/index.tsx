import { CaretDown } from "@carbon/icons-react";
import {
  Accordion as MuiAccordion,
  AccordionDetails,
  AccordionProps,
  AccordionSummary,
} from "@mui/material";
import { colors } from "constants/theme";
import React, { ReactNode } from "react";

const primaryAccordionStyles = {
  "boxShadow": "none",
  "&:last-of-type, &:first-of-type": {
    borderRadius: "0px",
  },
  "&.Mui-expanded .MuiButtonBase-root.MuiAccordionSummary-root": {
    background: colors.primary.light,
    minHeight: "35px",
    margin: "0px",
    padding: "0px 8px",
  },
  "&:before": {
    display: "none",
  },
  "& .MuiButtonBase-root.MuiAccordionSummary-root": {
    borderBottom: `1px solid ${colors.tertiary.dark}30`,
    minHeight: "35px",
    color: "#33333",
    padding: "0px 8px",
  },
  "& .MuiAccordionSummary-content": {
    marginBottom: "8px",
  },
  "& .MuiAccordionSummary-content.Mui-expanded": {
    margin: "10px 0px",
  },
};

interface PrimaryAccordionPropTypes extends AccordionProps {
  header: ReactNode;
  children: NonNullable<React.ReactNode>;
  headerClassName?: string;
}

export const PrimaryAccordion = ({
  header,
  headerClassName,
  children,
  ...otherProps
}: PrimaryAccordionPropTypes) => {
  return (
    <MuiAccordion sx={primaryAccordionStyles} {...otherProps}>
      <AccordionSummary
        aria-controls='panel1bh-content'
        id='panel1bh-header'
        className={headerClassName}
        sx={{ marginTop: "0px", minHeight: "45px" }}
        expandIcon={<CaretDown fill='#33333' size={24} />}
      >
        {header}
      </AccordionSummary>
      <AccordionDetails className='p-0 pb-0 pt-3'>{children}</AccordionDetails>
    </MuiAccordion>
  );
};
