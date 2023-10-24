import { Box, Stack } from "@mui/material";
import { ResponseObjInterface } from "interfaces/competency-bank";
import React from "react";
import { Checkbox } from "@carbon/icons-react";

export interface MCQViewProps {
  responses: ResponseObjInterface[];
}

export const MCQView = ({ responses }: MCQViewProps) => {
  return (
    <Stack direction={"column"} spacing={2}>
      {responses.map((item: ResponseObjInterface) => (
        <Box key={item.id} className='flex items-start'>
          <Checkbox
            className='mr-2 '
            style={{ color: "#c4c4c4" }}
            size={"24"}
          />
          <p className='xl:text-sm 2xl:text-semi-base m-0'> {item.label}</p>
        </Box>
      ))}
    </Stack>
  );
};
