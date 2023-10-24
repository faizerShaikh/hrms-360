import { TextField } from "@mui/material";
import React from "react";
import QuestionHeader from "./QuestionHeader";

export const CompetencyComment = ({
  competencyComments,
  setCompetencyComments,
  competencyId,
}: any) => {
  return (
    <div className='mt-10'>
      <QuestionHeader
        text={`Q. Add your comments for this competency *`}
        isCompetencyQuestion
      />
      <TextField
        variant='outlined'
        fullWidth
        multiline
        value={competencyComments}
        onChange={(e) => {
          setCompetencyComments((prev: any) => ({
            ...prev,
            [competencyId]: e.target.value,
          }));
        }}
        rows={4}
        placeholder='Your comments for this competency'
      />
    </div>
  );
};
