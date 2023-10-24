import { ArrowUpRight } from "@carbon/icons-react";
import { Box, Grid, Typography } from "@mui/material";
import { SurveyResponses } from "pages/survey/assessment/multiple/[token]";
import React, { useMemo } from "react";
import { SurveyProgress } from "./SurveyProgress";

export const SideBarDashboard = ({
  questions,
}: {
  questions: SurveyResponses[];
}) => {
  const data = useMemo(() => {
    let newData = {
      total: questions.length,
      answerd: 0,
      unanswerd: questions.length,
      bookmarked: 0,
    };
    for (const question of questions) {
      if (question.is_bookmarked) {
        newData.bookmarked++;
      } else if (question.is_answerd) {
        newData.answerd++;
      }
    }
    return { ...newData, unanswerd: newData.total - newData.answerd };
  }, [questions]);

  return (
    <Grid
      item
      xs={2.5}
      className="pt-6 px-5 pb-9 bg-white h-full relative ease-in-out duration-300"
      sx={{ boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.05)" }}
    >
      <Box className="border-b p-5 hover:shadow-md cursor-pointer mb-2 pt-0 flex items-center justify-between">
        <Typography className="text-neutral-600 2xl:text-lg xl:text-base">
          TOTAL
          <br /> QUESTIONS
        </Typography>
        <Box className="flex pl-2 items-center font-semibold text-[#0069FF]">
          {data.total}
          <div className="ml-4 bg-[#EEF5FF] py-2 px-2 flex justify-center items-center rounded">
            <ArrowUpRight color="#3786EE" size={20} />
          </div>
        </Box>
      </Box>
      <Box className="border-b p-5 hover:shadow-md cursor-pointer mb-2 flex items-center justify-between">
        <Typography className="text-neutral-600 2xl:text-lg xl:text-base">
          ANSWERED
          <br /> QUESTIONS
        </Typography>
        <Box className="flex pl-2 items-center font-semibold text-[#0DC7B1]">
          {data.answerd}
          <div className="ml-4 bg-[#0dc7b12f] py-2 px-2 flex justify-center items-center rounded">
            <ArrowUpRight color="#0DC7B1" size={20} />
          </div>
        </Box>
      </Box>
      <Box className="border-b p-5 hover:shadow-md cursor-pointer mb-2 flex items-center justify-between">
        <Typography className="text-neutral-600 2xl:text-lg xl:text-base">
          UNANSWERED
          <br /> QUESTIONS
        </Typography>
        <Box className="flex pl-2 items-center font-semibold text-[#F52F57]">
          {data.unanswerd}
          <div className="ml-4 bg-[#f52f5728] py-2 px-2 flex justify-center items-center rounded">
            <ArrowUpRight color="#F52F57" size={20} />
          </div>
        </Box>
      </Box>
      <Box className="border-b p-5 hover:shadow-md cursor-pointer mb-2 flex items-center justify-between">
        <Typography className="text-neutral-600 2xl:text-lg xl:text-base">
          BOOKMARKED
          <br /> QUESTIONS
        </Typography>
        <Box className="flex pl-2 items-center font-semibold text-[#FAD02C]">
          {data.bookmarked}
          <div className="ml-4 bg-[#fad12c2d] py-2 px-2 flex justify-center items-center rounded">
            <ArrowUpRight color="#FAD02C" size={20} />
          </div>
        </Box>
      </Box>
      <Box className="h-[350px] w-full flex justify-center items-center flex-col">
        <SurveyProgress
          value={Math.round(+((data.answerd / data.total) * 100))}
        />
        <Typography className="text-neutral-600 text-center text-xl mt-5">
          SURVEY COMPLETION
        </Typography>
      </Box>
    </Grid>
  );
};
