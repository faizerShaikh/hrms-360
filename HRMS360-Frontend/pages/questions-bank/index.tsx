import { Add } from "@carbon/icons-react";
import { Box, Typography } from "@mui/material";
import { ActionCard, PageHeader } from "components";
import { NextPage } from "next";
import React from "react";

const QuestionsBank: NextPage = () => {
  return (
    <>
      <PageHeader title="Question Bank" />
      <Box className="flex items-center justify-start">
        <ActionCard
          className="mr-6 w-80 "
          variant="primary"
          href="/questions-bank/my"
        >
          <Typography className="mx-10 century-gothic xl:text-sm 2xl:text-base">
            My Questionnaire
          </Typography>
        </ActionCard>
        <ActionCard
          className="mr-6 w-80"
          variant="tertiary"
          href="/questions-bank/add"
        >
          <div className="mx-10 flex items-center justify-center ">
            <Add size="32" />
            <Typography className="century-gothic xl:text-sm 2xl:text-base">
              Add New Questionnaire
            </Typography>
          </div>
        </ActionCard>
      </Box>
    </>
  );
};

export default QuestionsBank;
