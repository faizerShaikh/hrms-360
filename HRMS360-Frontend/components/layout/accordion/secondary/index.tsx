import { CaretDown } from "@carbon/icons-react";
import {
  Accordion as MuiAccordion,
  AccordionDetails,
  AccordionProps,
  AccordionSummary,
} from "@mui/material";
import { colors } from "constants/theme";
import React, { ReactNode } from "react";

const secondaryAccordionStyles = {
  boxShadow: "none",
  margin: "8px 0",
  "&:last-of-type, &:first-of-type": {
    borderRadius: "0px",
  },
  "& .MuiAccordionSummary-expandIconWrapper": {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50px, -50%)",
  },
  "&.Mui-expanded .MuiAccordionSummary-expandIconWrapper": {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50px, -50%) rotate(180deg)",
  },
  "&:before": {
    display: "none",
  },
  "& .MuiButtonBase-root.MuiAccordionSummary-root": {
    background: colors.primary.light,
    position: "retalive",
    borderBottom: `1px solid ${colors.tertiary.dark}30`,
    minHeight: "45px",
    height: "45px",
    color: "#33333",
  },
};

interface SecondaryAccordionPropTypes extends AccordionProps {
  header: ReactNode;
  status?: ReactNode;
  children: NonNullable<React.ReactNode>;
}

export const SecondaryAccordion = ({
  header,
  status,
  children,
  ...otherProps
}: SecondaryAccordionPropTypes) => {
  return (
    <MuiAccordion sx={secondaryAccordionStyles} {...otherProps}>
      <AccordionSummary
        expandIcon={<CaretDown fill="#33333" size={24} />}
        aria-controls="panel1bh-content"
        id="panel1bh-header"
        className="flex justify-between items-center text-dark"
      >
        <div className="truncate" style={{ width: "48%" }}>
          {header}
        </div>
        <div
          className="truncate flex justify-end items-center"
          style={{ width: "100%" }}
        >
          {status}
        </div>
      </AccordionSummary>
      <AccordionDetails className={`px-0 py-2`}>{children}</AccordionDetails>
    </MuiAccordion>
  );
};
