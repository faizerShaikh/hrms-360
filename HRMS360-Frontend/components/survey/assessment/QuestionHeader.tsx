import { Typography } from "@mui/material";
import { QuestionInterface } from "interfaces/competency-bank";
import { SurveyResponseInterface } from "interfaces/survey";
import React, { memo } from "react";
import RatingScaleDialog from "./RatingScaleDialog";

const QuestionHeader = ({
  index,
  text,
  isCompetencyQuestion = false,
  question,
}: {
  index?: number;
  text: string;
  isCompetencyQuestion?: boolean;
  question?: QuestionInterface & SurveyResponseInterface;
}) => {
  return (
    <>
      {
        <Typography className="mb-5 flex justify-between items-center  border-b text-sm md:text-base pb-2">
          <span>
            {!isCompetencyQuestion && (
              <span>Q {typeof index !== "undefined" && index + 1}.</span>
            )}{" "}
            <span>{text}</span>
            <span className="inline-block my-0 mx-auto h-full items-center align-middle">
              {question?.response_type === "likert_scale" && (
                <RatingScaleDialog question={question} />
              )}
            </span>
          </span>
        </Typography>
      }
    </>
  );
};

export default memo(QuestionHeader);
