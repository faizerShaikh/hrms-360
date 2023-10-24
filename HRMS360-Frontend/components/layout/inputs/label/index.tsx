import { InputLabel } from "@mui/material";
import React from "react";

interface LabelProps {
  text: string;
  colorClass?: string;
  className?: string;
  outerClassName?: string;
}

export const Label = ({
  text,
  className,
  colorClass,
  outerClassName,
}: LabelProps) => {
  return (
    <p className={outerClassName ? outerClassName : "my-0"}>
      <InputLabel
        className={`${colorClass ? colorClass : "text-dark"} ${className} `}
      >
        {text}
      </InputLabel>
    </p>
  );
};
