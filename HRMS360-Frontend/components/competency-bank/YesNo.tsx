import { RadioButton } from "@carbon/icons-react";
import { Box, Stack, Typography } from "@mui/material";
import { ResponseObjInterface } from "interfaces/competency-bank";
import { RadioGroup } from "..";

export interface YesNoInterface {
  responses: ResponseObjInterface[];
  viewOnly: boolean;
}

export const YesNo = ({ responses, viewOnly = false }: YesNoInterface) => {
  return (
    <Box sx={{ cursor: "default" }}>
      {viewOnly ? (
        <Stack direction='row'>
          {responses?.map((item) => (
            <Box key={item.id} className='flex justify-start items-center'>
              <RadioButton
                style={{ color: "#c4c4c4" }}
                size={20}
                className='mr-2'
              />
              <Typography className='mr-5  text-sm'>{item.label}</Typography>
            </Box>
          ))}
        </Stack>
      ) : (
        <RadioGroup
          label=''
          row
          options={
            responses?.map((item) => ({
              label: item.label,
              value: item.id!,
            })) || []
          }
        />
      )}
    </Box>
  );
};
