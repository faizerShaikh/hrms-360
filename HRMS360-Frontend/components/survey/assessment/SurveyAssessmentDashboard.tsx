import { BookmarkFilled, Close, Dashboard } from "@carbon/icons-react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { colors } from "constants/theme";
import React, { useEffect, useMemo, useState } from "react";
import { CompetencyInterface } from "@/interfaces";
import { SurveyResponses } from "pages/survey/assessment/multiple/[token]";

export const SurveyAssessmentDashboard = ({
  questions,
  selectedQuestion,
  selectQuestion,
}: {
  questions: SurveyResponses[];
  selectedQuestion: SurveyResponses | null;
  selectQuestion: (id: string) => void;
}) => {
  const isExtraSmall = useMediaQuery("(max-width:390px)");

  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);

  const onOpen = () => {
    setOpen(true);
  };
  const onClose = () => setOpen(false);

  useEffect(() => {
    setContainer(document.getElementById("main"));
  }, []);

  const data = useMemo(() => {
    let newData: {
      [key: string]: CompetencyInterface & { questions: SurveyResponses[] };
    } = {};
    for (const question of questions) {
      if (
        question.is_competency_comment &&
        question?.title &&
        newData[question?.title]
      ) {
        newData[question?.title].questions?.push({ ...question });
      } else if (question.competency && newData[question.competency.title]) {
        newData[question.competency?.title].questions?.push({ ...question });
      } else {
        if (question.competency) {
          newData[question.competency?.title] = {
            ...question.competency,
            questions: [{ ...question }],
          };
        }
      }
    }
    return Object.values(newData);
  }, [questions]);
  return (
    <>
      <Button
        startIcon={<Dashboard />}
        onClick={onOpen}
        variant="outlined"
        sx={{
          "& .MuiButton-startIcon": {
            marginRight: `${isExtraSmall ? "0px" : "8px"}`,
          },
        }}
        color="secondary"
        className="capitalize px-4 py-[6px] leading-5 font-medium text-[12px] lg:text-sm 2xl:text-base  "
      >
        {isExtraSmall ? "" : "Questions"}
      </Button>
      <Dialog
        fullWidth
        maxWidth={"lg"}
        open={open}
        onClose={onClose}
        container={container}
        className="py-0"
      >
        <div>
          <DialogTitle
            sx={{
              color: "#242424",
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
              background: "transparent",
            }}
            className="xl:text-base 2xl:text-lg flex justify-between items-center px-5 py-2 md:py-5"
          >
            <Typography className="border-l-secondary border-l-4 pl-3 font-semibold text-neutral-900 2xl:text-base xl:text-base">
              TOTAL QUESTIONS
            </Typography>
            <IconButton onClick={onClose}>
              <Close size={24} fill={colors.text.dark} />
            </IconButton>
          </DialogTitle>
          <DialogContent className="overflow-y-auto h-[60vh] my-5 py-2 mx-5">
            {data.map((item, index) => (
              <Box
                key={item.id}
                className={`mb-${index + 1 == data.length ? "0" : "16"}`}
              >
                <Typography className="border-b py-1 text-[#525252] flex justify-between items-center text-[14px] xl:text-sm 2xl:text-base">
                  {index + 1}. {item?.title}
                  <span className="font-thin uppercase text-[12px] xl:text-xs 2xl:text-xs">
                    No. of Questions : {item.questions?.length}
                  </span>
                </Typography>
                <Box className="flex justify-start gap-3 md:gap-8 items-center flex-wrap my-5">
                  {item.questions?.map((question: SurveyResponses, index) => (
                    <div
                      key={question.id}
                      onClick={() => {
                        if (question.is_answerd && question.id) {
                          selectQuestion(question.id);
                        }
                      }}
                      className={`relative rounded-full border w-10 h-10 flex justify-center items-center ${
                        question.is_answerd ? "cursor-pointer" : ""
                      } ${
                        selectedQuestion && question.id === selectedQuestion.id
                          ? "border-[#FEA92A] text-[#4D4D4D] bg-[#FEF7E5] after:content-[''] after:h-[2px] after:w-[25px] after:bg-[#FEA92A] after:absolute  after:-bottom-3 after:left-[50%] after:-translate-x-[50%]"
                          : question.is_answerd
                          ? "border-[#0DC7B1B2] text-[#828282] bg-[#D8F6F399]"
                          : "border-neutral-300 text-[#828282]"
                      } `}
                    >
                      {question.is_bookmarked && (
                        <BookmarkFilled
                          fill="#FEA92A"
                          className="absolute -top-2 -right-0"
                          size={"20"}
                        />
                      )}
                      {index + 1}
                    </div>
                  ))}
                </Box>
              </Box>
            ))}
          </DialogContent>
          <DialogActions
            sx={{
              color: "#242424",
              boxShadow: "0px -4px 10px rgba(0, 0, 0, 0.1)",
              background: "transparent",
            }}
          >
            <div className="text-[10px] lg:text-base 2xl:text-lg  flex flex-row  justify-center items-start md:items-center p-2 md:p-5 w-full">
              <div className="flex justify-start md:border-r-2 px-4 md:px-10 mb-2 md:mb-0">
                <div className="rounded-full border mt-[2px] border-[#FEA92A] text-[#4D4D4D] w-[10px] h-[10px] bg-[#FEF7E5] after:content-[''] after:h-[2px] after:w-[8px] mr-2 after:bg-[#FEA92A] after:absolute  after:bottom-[-6px] after:left-[50%] after:-translate-x-[50%] relative"></div>
                <div className="text-neutral-600 text-[10px] lg:text-xs ">
                  ACTIVE QUESTION
                </div>
              </div>
              <div className="flex justify-start items-center md:border-r-2  px-4 md:px-10 mb-2 md:mb-0">
                <div className="rounded-full border mt-[2px] border-[#0DC7B1] text-[#4D4D4D] w-[10px] h-[10px] bg-[#D8F6F3] mr-2"></div>
                <div className="text-neutral-600 text-[10px] lg:text-xs">
                  ANSWERED
                </div>
              </div>
              <div className="flex justify-start items-center md:border-r-2  px-4 md:px-10 mb-2 md:mb-0">
                <div className="rounded-full border mt-[2px] border-neutral-300 text-[#4D4D4D] w-[10px] h-[10px] mr-2"></div>
                <div className="text-neutral-600 text-[10px] lg:text-xs">
                  UNANSWERED
                </div>
              </div>
              <div className="flex justify-start items-center md:border-r-2  px-4 md:px-10 mb-2 md:mb-0">
                <BookmarkFilled
                  fill="#FEA92A"
                  width={"14"}
                  height={"14"}
                  className="mr-2"
                />
                <div className="text-neutral-600 text-[10px] lg:text-xs">
                  BOOKMARKED
                </div>
              </div>
            </div>
          </DialogActions>
        </div>
      </Dialog>
    </>
  );
};
