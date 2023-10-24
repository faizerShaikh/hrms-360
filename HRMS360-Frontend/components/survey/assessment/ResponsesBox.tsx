import { Stepper } from "@/components";

import { Box, Grid, useMediaQuery } from "@mui/material";
import { SurveyResponses } from "pages/survey/assessment/multiple/[token]";
import { responses } from "./responseInputs";
import { useState } from "react";
import { BsEye, BsEyeSlash } from "react-icons/bs";

export const ResponsesBox = ({
  selectedQuestion,
  setSelectedQuestion,
  setQuestions,
  selectedIndex,
}: {
  selectedQuestion: SurveyResponses | null;
  setSelectedQuestion: any;
  setQuestions: any;
  selectedIndex: number;
}) => {
  const isMobile = useMediaQuery("(max-width:640px)");

  const [showRatingScale, setShowRatingScale] = useState(false);

  const onChange = (
    name: string,
    value: any,
    index: number,
    dontKnow: boolean = false
  ) => {
    let newObj: any = {
      ...selectedQuestion,
    };

    newObj.surveys[index] = {
      ...newObj.surveys[index],
      [name]: value,
      is_answerd: Array.isArray(value) ? Boolean(value.length) : Boolean(value),
      is_unanswerd: Array.isArray(value)
        ? !Boolean(value.length)
        : !Boolean(value),
    };

    if (newObj.response_type === "likert_scale") {
      if (dontKnow) {
        newObj.surveys[index] = {
          ...newObj.surveys[index],
          expected_response_id: newObj.surveys[index].response_id,
          is_answerd: Boolean(newObj.surveys[index].response_id),
          is_unanswerd: !Boolean(newObj.surveys[index].response_id),
        };
      } else {
        newObj.surveys[index] = {
          ...newObj.surveys[index],
          is_answerd: Boolean(newObj.surveys[index].response_id),
          is_unanswerd: !Boolean(newObj.surveys[index].response_id),
        };
      }
    }

    if (newObj.surveys.every((item: any) => item.is_answerd)) {
      newObj["is_answerd"] = true;
      newObj["is_unanswerd"] = false;
    } else {
      newObj["is_answerd"] = false;
      newObj["is_unanswerd"] = true;
    }

    setSelectedQuestion(newObj);
    setQuestions((prev: any) => {
      let newArray = JSON.parse(JSON.stringify(prev));
      newArray[selectedIndex] = JSON.parse(JSON.stringify(newObj));
      return newArray;
    });
  };

  return (
    <Grid
      container
      justifyContent="space-between"
      alignItems="start"
      className="w-full p-0"
      flexWrap="nowrap"
      gap="20px"
    >
      <Grid xs={12} item className="bg-white flex justify-start flex-col">
        {selectedQuestion &&
          !["yes_no", "text"].includes(selectedQuestion.response_type) &&
          selectedQuestion?.responses && (
            <div className="flex flex-col sm:flex-row justify-center items-start mb-4 relative">
              <span
                onClick={() => setShowRatingScale(!showRatingScale)}
                className="md:hidden cursor-pointer text-[#0069FF] underline text-xs flex items-center justify-start absolute right-5 top-[10px]"
              >
                {showRatingScale ? (
                  <BsEyeSlash className="mr-2" />
                ) : (
                  <BsEye className="mr-2" />
                )}
                {showRatingScale ? "Hide" : "Show"}
              </span>
              <div className="capitalize leading-5 text-[10px] md:text-[12px] xl:text-xs 2xl:text-base font-semibold text-neutral-600 aller  bg-[#EBEBEB] lg:px-3 px-2.5 py-0.5 lg:py-2 rounded-[19px] lg:rounded mt-2 mb-3 sm:mb-0">
                Rating Scale
              </div>

              <Box
                className={`w-[80%] lg:w-[70%] ${
                  showRatingScale ? "block" : "hidden"
                } md:block`}
                sx={{ "& .MuiTypography-root": { color: "#242424" } }}
              >
                <Stepper
                  justify={"justify-start"}
                  activeStep={-1}
                  alternativeLabel={isMobile ? false : true}
                  orientation={isMobile ? "vertical" : "horizontal"}
                  hideDevider
                  steps={selectedQuestion?.responses
                    .filter((item) => item.label !== "Don't Know (0)")
                    ?.map((item, index) => ({
                      component: <></>,
                      position: index,
                      step: item.label,
                    }))}
                />
              </Box>
            </div>
          )}
        <Box className="2xl:pt-[20px] xl:pt-[20px] pb-[0px] lg:px-[30px] w-full">
          {selectedQuestion &&
            responses[selectedQuestion?.response_type] &&
            responses[selectedQuestion?.response_type]({
              options: selectedQuestion.responses,
              item: selectedQuestion,
              onChange,
            })}
        </Box>
      </Grid>
    </Grid>
  );
};
