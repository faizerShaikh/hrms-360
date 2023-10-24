import { RadioButton } from "@carbon/icons-react";
import { Box, Stack } from "@mui/material";
import { ResponseObjInterface } from "interfaces/competency-bank";
import React from "react";

export interface MCQViewProps {
  responses: ResponseObjInterface[];
}

export const SingleChoiceView = ({ responses }: MCQViewProps) => {
  return (
    <Stack direction={"column"} spacing={2}>
      {responses.map((item: ResponseObjInterface) => (
        <Box key={item.id} className='flex items-center'>
          <RadioButton
            style={{ color: "#c4c4c4" }}
            size={20}
            className='mr-2'
          />
          <p className='xl:text-sm 2xl:text-semi-base m-0'> {item.label}</p>
        </Box>
      ))}
    </Stack>
  );
};
