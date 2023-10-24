import { Box, useMediaQuery } from "@mui/material";
import { Dialog, Stepper } from "components/layout";
import { QuestionInterface } from "interfaces/competency-bank";
import { SurveyResponseInterface } from "interfaces/survey";
import React from "react";
import { BsFillInfoCircleFill } from "react-icons/bs";

const RatingScaleDialog = ({
  question,
}: {
  question: QuestionInterface & SurveyResponseInterface;
}) => {
  const isMobile = useMediaQuery("(max-width:640px)");

  return (
    <>
      <Dialog
        title={`Rating Scale`}
        button={
          <BsFillInfoCircleFill size={16} className="ml-1 cursor-pointer" />
        }
      >
        <div className="flex flex-col sm:flex-row justify-center items-start  relative pt-2">
          {question?.responses && (
            <Box
              className={`w-[80%] lg:w-[100%] md:block`}
              sx={{ "& .MuiTypography-root": { color: "#242424" } }}
            >
              <Stepper
                activeStep={-1}
                alternativeLabel={isMobile ? false : true}
                orientation={isMobile ? "vertical" : "horizontal"}
                hideDevider
                steps={question?.responses
                  .filter((item) => item.label !== "Don't Know (0)")
                  ?.map((item, index) => ({
                    component: <></>,
                    position: index,
                    step: item.label,
                  }))}
              />
            </Box>
          )}
        </div>
      </Dialog>
    </>
  );
};

export default RatingScaleDialog;
