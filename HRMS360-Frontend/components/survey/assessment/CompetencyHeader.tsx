import { Typography, Box } from "@mui/material";
import { CompetencyInterface } from "interfaces/competency-bank";
import React, { memo } from "react";

const CompetencyHeader = ({
  index,
  competency,
  lastCompId,
}: {
  index: number;
  competency?: CompetencyInterface;
  lastCompId?: string;
}) => {
  return (
    <>
      {(index === 0 || competency?.id !== lastCompId) && (
        <Box className="flex items-center justify-between px-4 py-2 bg-primary-light border-l-4 border-primary mb-7">
          <Typography className="century-gothic font-semibold text-sm md:text-base">
            Competency: {competency?.title}
          </Typography>
          <Typography className="century-gothic font-semibold text-sm md:text-base">
            Question Count: {competency?.no_of_questions}
          </Typography>
        </Box>
      )}
    </>
  );
};

export default memo(CompetencyHeader);
