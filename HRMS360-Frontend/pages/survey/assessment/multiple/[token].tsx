import React, { useMemo, useState } from "react";

import { Box, Grid, Typography } from "@mui/material";
import { NextPageContext } from "next";
import { serverAPI } from "configs/api";
import {
  BaseProps,
  QuestionInterface,
  QuestionResponseType,
} from "@/interfaces";
import {
  SurveyDescriptionInterface,
  SurveyInterface,
  SurveyStatus,
} from "interfaces/survey";
import { BookmarkAdd, BookmarkFilled } from "@carbon/icons-react";
import Head from "next/head";

import { useCreateOrUpdate } from "hooks/useCreateOrUpdate";
import { useRouter } from "next/router";
import { toast } from "utils/toaster";
import Image from "next/image";
import { CompetencyComments } from "components/survey/assessment/CompetencyComments";
import { ResponsesBox } from "components/survey/assessment/ResponsesBox";
import { Button } from "components/layout";
import { SurveyAssessmentDashboard } from "components/survey/assessment/SurveyAssessmentDashboard";
import { SurveyCompleted } from "components/survey/assessment/SurveyCompleted";
import { generateRandom } from "utils/getRandomNumber";
import { logoPath } from "constants/layout";
import { BsArrowLeftShort, BsArrowRightShort } from "react-icons/bs";

export interface SurveyResponses extends QuestionInterface {
  is_answerd: boolean;
  is_unanswerd: boolean;
  is_bookmarked: boolean;
  is_competency_comment: boolean;
  title?: string;
  comments?: {
    comments: string;
    survey_id: string;
    survey_respondent_id: string;
    survey_external_respondent_id: string;
    is_answerd: boolean;
    is_unanswerd: boolean;
    is_bookmarked: boolean;
  }[];
  survey_id?: string;
}

let responseTypes: { [key: string]: string } = {
  yes_no: "Yes/No",
  text: "Text",
  single_choice: "Single Choice Select",
  multiple_choice: "Multiple Choice Select",
  likert_scale: "Likert Scale Select",
};
export const getServerSideProps = async (ctx: NextPageContext) => {
  const res = await serverAPI.get(`/survey/multiple-detail/${ctx.query.token}`);
  const data: SurveyDescriptionInterface = res.data.data.surveyDescription;
  const questionsData: SurveyResponses[] = res.data.data.questions;

  if (!data) {
    return {
      notFound: true,
    };
  }

  let questions: any = [];

  for (const [index, question] of questionsData.entries()) {
    let is_answerd = true;
    let newQuestion = {
      ...question,
      is_competency_comment: false,
      surveys: data.surveys
        ? data.surveys.map((item: SurveyInterface) => {
            let responses = question.surveyResponses
              ? question.surveyResponses.filter(
                  (response) => response.survey_id === item.id
                )
              : [];
            let responseObj = {
              ...item,
              survey_id: item.id,
              survey_respondant_id:
                item.survey_respondants && item.survey_respondants[0]
                  ? item.survey_respondants[0].id
                  : null,
              survey_external_respondant_id:
                item.survey_external_respondants &&
                item.survey_external_respondants[0]
                  ? item.survey_external_respondants[0].id
                  : null,
              question_id: question.id,
              category_id:
                item.survey_respondants && item.survey_respondants[0]
                  ? item.survey_respondants[0].relationship_with_employee_id
                  : item.survey_external_respondants &&
                    item.survey_external_respondants[0]
                  ? item.survey_external_respondants[0].rater.id
                  : null,
              response_id: !["text", "multiple_Choice"].includes(
                question.response_type
              )
                ? responses.length && responses[0]
                  ? responses[0].response_id
                  : ""
                : "",
              response_ids:
                question.response_type === QuestionResponseType.multiple_choice
                  ? responses.map((item) => item.response_id)
                  : [],
              response_text:
                question.response_type === QuestionResponseType.text &&
                responses.length &&
                responses[0]
                  ? responses[0].response_text
                  : "",
              question_type: question.response_type,
              consider_in_report: true,
              is_answerd: false,
              is_bookmarked: false,
              is_unanswerd: true,
            };

            responseObj["is_answerd"] =
              responseObj.question_type === QuestionResponseType.multiple_choice
                ? Boolean(responseObj.response_ids.length)
                : responseObj.question_type === QuestionResponseType.text
                ? Boolean(responseObj.response_text)
                : Boolean(responseObj.response_id);

            responseObj["is_unanswerd"] = !responseObj["is_answerd"];

            if (responseObj.is_unanswerd) {
              is_answerd = false;
            }
            return responseObj;
          })
        : [],
    };

    newQuestion["is_answerd"] = is_answerd;
    newQuestion["is_unanswerd"] = !is_answerd;
    questions.push(newQuestion);

    if (index + 1 === questionsData.length) {
      let is_answerd =
        question.competency &&
        question.competency.comments &&
        question.competency.comments.length
          ? true
          : false;
      questions.push({
        is_competency_comment: true,
        ...question.competency,
        comments:
          question.competency &&
          question.competency.comments &&
          question.competency.comments.length
            ? question.competency.comments.map((item) => {
                if (!Boolean(item.comments)) {
                  is_answerd = false;
                }
                return {
                  ...item,
                  ...item.survey,
                  survey_id: item.survey.id,
                  comments: item.comments,
                  is_answerd: Boolean(item.comments),
                  is_bookmarked: false,
                  is_unanswerd: !Boolean(item.comments),
                };
              })
            : data.surveys?.map((item) => ({
                ...item,
                comments: "",
                survey_id: item.id,
                survey_respondent_id:
                  item.survey_respondants && item.survey_respondants[0]
                    ? item.survey_respondants[0].id
                    : null,
                survey_external_respondent_id:
                  item.survey_external_respondants &&
                  item.survey_external_respondants[0]
                    ? item.survey_external_respondants[0].id
                    : null,
                is_answerd: false,
                is_bookmarked: false,
                is_unanswerd: true,
              })),
        is_answerd: is_answerd,
        is_bookmarked: false,
        is_unanswerd: !is_answerd,
      });
    } else if (
      questionsData[index + 1] &&
      questionsData[index + 1].competency_id !== question.competency_id
    ) {
      let is_answerd =
        question.competency &&
        question.competency.comments &&
        question.competency.comments.length
          ? true
          : false;
      questions.push({
        is_competency_comment: true,
        ...question.competency,
        comments:
          question.competency &&
          question.competency.comments &&
          question.competency.comments.length
            ? question.competency.comments.map((item) => {
                if (!Boolean(item.comments)) {
                  is_answerd = false;
                }
                return {
                  ...item,
                  ...item.survey,
                  survey_id: item.survey.id,
                  comments: item.comments,
                  is_answerd: Boolean(item.comments),
                  is_bookmarked: false,
                  is_unanswerd: !Boolean(item.comments),
                };
              })
            : data.surveys?.map((item) => ({
                ...item,
                comments: "",
                survey_id: item.id,
                survey_respondent_id:
                  item.survey_respondants && item.survey_respondants[0]
                    ? item.survey_respondants[0].id
                    : null,
                survey_external_respondent_id:
                  item.survey_external_respondants &&
                  item.survey_external_respondants[0]
                    ? item.survey_external_respondants[0].id
                    : null,
                is_answerd: false,
                is_bookmarked: false,
                is_unanswerd: true,
              })),
        is_answerd: is_answerd,
        is_bookmarked: false,
        is_unanswerd: !is_answerd,
      });
    }
  }

  return {
    props: {
      data,
      questionsData: questions,
    },
  };
};

const NewSurvey: BaseProps<
  SurveyDescriptionInterface,
  {
    questionsData: SurveyResponses[];
  }
> = ({ data, questionsData }) => {
  const [questions, setQuestions] = useState<SurveyResponses[]>(questionsData);
  const [currIndex, setCurrIndex] = useState(0);
  const [surveySubmited, setSurveySubmited] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<SurveyResponses>(
    questionsData[currIndex]
  );

  const router = useRouter();

  const nextQuestion = () => {
    if (questions) {
      if (questions[currIndex + 1]) {
        setQuestions((prev: any) => {
          let newArray = JSON.parse(JSON.stringify(prev));
          newArray[currIndex] = JSON.parse(JSON.stringify(selectedQuestion));
          return newArray;
        });
        setSelectedQuestion(questions[currIndex + 1]);
        setCurrIndex((prev) => prev + 1);
      }
    }
  };

  const previousQuestion = () => {
    if (questions) {
      if (questions[currIndex - 1]) {
        setQuestions((prev: any) => {
          let newArray = JSON.parse(JSON.stringify(prev));
          newArray[currIndex] = JSON.parse(JSON.stringify(selectedQuestion));
          return newArray;
        });
        setSelectedQuestion(questions[currIndex - 1]);
        setCurrIndex((prev) => prev - 1);
      }
    }
  };

  const selectQuestion = (id: string) => {
    const question = questions.findIndex((item) => item.id === id);
    setCurrIndex(question);
    setSelectedQuestion(questions[question]);
  };

  const questionsWithoutComment = useMemo(() => {
    return questions?.filter((item) => !item?.is_competency_comment);
  }, [questions]);

  const completionPercentage = useMemo(() => {
    return +Math.round(
      (questionsWithoutComment.reduce(
        (prev, curr) => (curr.is_answerd ? prev + 1 : prev),
        0
      ) /
        questionsWithoutComment.length) *
        100
    ).toFixed();
  }, [questionsWithoutComment]);

  const completedQuestionsCount = useMemo(() => {
    return questionsWithoutComment?.reduce((prev, cur: any): number => {
      return prev + cur?.is_answerd;
    }, 0);
  }, [questionsWithoutComment]);

  const fillForm = () => {
    setQuestions((questions) => {
      let newQuestionsData: SurveyResponses[] = [];
      for (const question of questions) {
        if (question.is_competency_comment) {
          newQuestionsData.push({
            ...question,
            is_answerd: true,
            is_unanswerd: false,
            comments: question.comments
              ? question.comments.map((item) => ({
                  ...item,
                  comments: "Sample text comment",
                  is_answerd: true,
                  is_unanswerd: false,
                }))
              : [],
          });
        } else if (question.response_type === QuestionResponseType.text) {
          newQuestionsData.push({
            ...question,
            is_answerd: true,
            is_unanswerd: false,
            surveys: question.surveys
              ? question.surveys.map((item: any) => ({
                  ...item,
                  response_text: "Sample text comment",
                  is_answerd: true,
                  is_unanswerd: false,
                }))
              : [],
          });
        } else if (
          ["yes_no", "single_choice", "likert_scale"].includes(
            question.response_type
          )
        ) {
          newQuestionsData.push({
            ...question,
            is_answerd: true,
            is_unanswerd: false,
            surveys: question.surveys
              ? question.surveys.map((item: any) => ({
                  ...item,
                  response_id: question?.responses
                    ? `${
                        question?.responses[
                          Math.floor(
                            Math.random() * question?.responses?.length
                          )
                        ].value
                      }` || ""
                    : "",
                  is_answerd: true,
                  is_unanswerd: false,
                }))
              : [],
          });
        } else if (
          question.response_type === QuestionResponseType.multiple_choice
        ) {
          newQuestionsData.push({
            ...question,
            is_answerd: true,
            is_unanswerd: false,
            surveys: question.surveys
              ? question.surveys.map((item: any) => ({
                  ...item,
                  response_ids: question?.responses
                    ? question?.responses
                        ?.slice(
                          0,
                          generateRandom(1, question?.responses?.length)
                        )
                        ?.map((item: any) => `${item?.value}` || "")
                    : [],
                  is_answerd: true,
                  is_unanswerd: false,
                }))
              : [],
          });
        } else {
          newQuestionsData.push(question);
        }
        setSelectedQuestion(newQuestionsData[currIndex]);
      }
      let random = generateRandom(1, newQuestionsData.length);
      for (let index = 0; index < 5; index++) {
        newQuestionsData[generateRandom(0, random)]["is_bookmarked"] = true;
      }
      return newQuestionsData;
    });
  };

  const { mutate, isLoading } = useCreateOrUpdate({
    url: "/survey/submit-survey",
    onSuccess(_, variables) {
      console.log(variables, "<===sjsjdjd");

      toast(
        variables.status === SurveyStatus.Ongoing
          ? "Progress saved successfully"
          : "Survey submited successfully",
        "success"
      );

      setSurveySubmited(variables.status === SurveyStatus.Completed);
    },
  });

  const onSubmit = (status: string) => {
    const data: any = {
      token: router.query.token,
      surveyResponses: questions,
      status: status,
      competencyComments: [],
    };
    let surveyResponses: any = {};
    let competencyComments: any = [];

    for (const question of questions) {
      if (question.is_competency_comment && question.comments) {
        for (const comment of question.comments) {
          competencyComments.push({
            survey_id: comment.survey_id,
            competency_id: question.id,
            comments: comment.comments,
            survey_respondent_id: comment.survey_respondent_id,
            survey_external_respondent_id:
              comment.survey_external_respondent_id,
          });
        }
      } else {
        if (question.surveys) {
          for (const response of question.surveys) {
            if (surveyResponses[response.survey_id]) {
              surveyResponses[response.survey_id].responses.push({
                ...response,
                id: undefined,
              });
            } else {
              surveyResponses[response.survey_id] = {
                respondent_id: response.survey_respondant_id,
                survey_external_respondant_id:
                  response.survey_external_respondant_id,
                survey_id: response.survey_id,
                responses: [{ ...response, id: undefined }],
              };
            }
          }
        }
      }
    }
    data["surveyResponses"] = Object.values(surveyResponses);
    data["competencyComments"] = competencyComments;

    if (status === SurveyStatus.Completed && !questionCompleted) {
      toast("Please fill all responses to submit the survey", "error");
      return;
    }

    mutate(data);
  };

  const questionCompleted = useMemo(() => {
    let isCompleted = true;
    for (const question of questions) {
      if (!question.is_competency_comment && !question.is_answerd) {
        isCompleted = false;
      }
    }
    return isCompleted;
  }, [questions]);

  if (surveySubmited) {
    return <SurveyCompleted />;
  }

  return (
    <>
      <Head>
        <title>360 Survey Assessment | {data.title}</title>
      </Head>
      <Box className="flex justify-center items-center w-full overflow-y-auto h-screen xl:p-10">
        {" "}
        <Box className="w-full  h-full  relative border bg-neutral-100">
          {/* header */}

          <Grid
            container
            className="md:hidden  flex justify-between items-center bg-white w-full gap-x-2 py-2 px-4 border-b sticky top-0 right-0 left-0 z-50"
          >
            <Button
              variant="outlined"
              className="uppercase block md:hidden px-4 py-[6px] leading-5 font-medium text-[12px] lg:text-sm 2xl:text-base"
              onClick={() => onSubmit(SurveyStatus.Ongoing)}
              color="secondary"
              disabled={isLoading}
              isLoading={isLoading}
            >
              Save Progress
            </Button>

            <Box className="flex gap-2 md:hidden">
              <Button
                variant="outlined"
                disabled={currIndex === 0}
                onClick={() => previousQuestion()}
                startIcon={
                  <BsArrowLeftShort className="h-[15px] w-[15px] md:h-[18px] md:w-[18px] lg:h-[20px] lg:w-[20px]" />
                }
                className="text-primary uppercase font-urbanist border-neutral-200 px-4 py-[6px] leading-5 font-medium text-[12px] lg:text-sm 2xl:text-base disabled:border-neutral-100 disabled:text-neutral-300"
              >
                Previous{" "}
                <span className="hidden md:block m-0">&nbsp; Question</span>
              </Button>

              {questions?.length === currIndex + 1 ? (
                <Button
                  variant="contained"
                  disabled={isLoading}
                  color="primary"
                  onClick={() => onSubmit(SurveyStatus.Completed)}
                  isLoading={isLoading}
                  className=" uppercase px-4 py-[6px]  leading-5 font-medium text-[12px] lg:text-sm 2xl:text-base"
                >
                  Submit
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => nextQuestion()}
                  disabled={
                    selectedQuestion.is_competency_comment
                      ? false
                      : !selectedQuestion.surveys?.every(
                          (item: any) => item?.is_answerd
                        )
                  }
                  endIcon={
                    <BsArrowRightShort className="h-[15px] w-[15px] md:h-[18px] md:w-[18px] lg:h-[20px] lg:w-[20px]" />
                  }
                  className=" uppercase font-urbanist text-primary disabled:bg-neutral-100 disabled:text-neutral-300 bg-primary-light px-4 py-[6px] leading-5 font-medium text-[12px] lg:text-sm 2xl:text-base"
                >
                  Next
                </Button>
              )}
            </Box>
          </Grid>
          <Grid
            container
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            className="w-full py-[12px] px-4 md:px-[25px] bg-[#fff] shadow-[0_4px_40px_rgba(0,0,0,0.1)] mb-3 md:mb-6"
          >
            <Grid
              item
              className="hidden md:flex justify-between md:justify-start items-center w-full md:w-auto gap-[15px] lg:gap-[15px] pb-3 md:pb-0"
            >
              <Box className="flex items-center">
                <Image src={logoPath} width="100" height="30" alt="" />
              </Box>

              <Button
                disabled
                className=" capitalize text-start font-urbanist border-[#DDDBDA] bg-transparent text-[#525252] font-semibold md:text-[14px] lg:text-[16px] 2xl:text-base"
              >
                <Typography className="capitalize  font-urbanist border-[#DDDBDA] bg-transparent text-[#525252] font-semibold md:text-[14px] lg:text-[16px] 2xl:text-base w-[75px] lg:w-[130px] xl:w-[250px] truncate">
                  {data.title}
                </Typography>
              </Button>
            </Grid>

            <Grid className="flex gap-x-2 md:hidden" item xs={12}>
              <Button
                disabled
                className=" capitalize mb-2 px-0 py-0 font-urbanist border-[#DDDBDA] bg-transparent text-[#525252] font-semibold w-full"
              >
                <Typography className="capitalize  font-urbanist border-[#DDDBDA] bg-transparent text-[#525252] font-semibold  mr-auto  truncate">
                  {data.title}
                </Typography>
              </Button>
            </Grid>

            <Grid
              item
              className="flex justify-start items-center md:gap-2 gap-0  text-[#616161] relative"
            >
              <div className="w-[250px] lg:w-[500px]">
                <div className="progress-bar w-full">
                  <div
                    className="bar positive"
                    style={{ width: `${completionPercentage}%` }}
                  >
                    <span className=" text-[14px] md:text-[16px] w-[250px] lg:w-[500px]">
                      {completedQuestionsCount} of{" "}
                      {questionsWithoutComment?.length} Completed
                    </span>
                  </div>
                  <div
                    className="bar negative"
                    style={{ width: `${100 - completionPercentage}%` }}
                  >
                    <span className=" text-[14px] md:text-[16px] w-[250px] lg:w-[500px]">
                      {completedQuestionsCount} of{" "}
                      {questionsWithoutComment?.length} Completed
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex  lg:hidden ml-2">
                <SurveyAssessmentDashboard
                  questions={questions}
                  selectedQuestion={selectedQuestion}
                  selectQuestion={selectQuestion}
                />
              </div>
            </Grid>
            <Grid
              item
              className="flex justify-between items-center w-auto gap-2"
            >
              <Button
                className="hidden lg:block capitalize lg:px-4 px-2 lg:py-[6px] py-[4px] leading-5 text-[12px] lg:text-sm 2xl:text-base"
                onClick={fillForm}
              >
                Fill Form
              </Button>
            </Grid>
          </Grid>

          {/* Body section */}
          <div className="flex  lg:h-[calc(100%-110px)] md:h-[calc(100%-107px)] min-h-[calc(100%-152px)]  h-auto">
            <Box
              className="lg:mx-3 mx-auto h-unset  bg-white w-full  md:w-[95%] lg:w-[80%]"
              sx={{ boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.05)" }}
            >
              <Grid
                container
                wrap="nowrap"
                className="w-full h-full flex flex-col justify-between "
                columnGap={4}
              >
                <Grid
                  item
                  xs={12}
                  className="2xl:pt-6 xl:pt-4 pt-3 pb-12 md:px-5 px-4 flex flex-col justify-start   h-full relative ease-in-out duration-300"
                >
                  {" "}
                  <Box className="flex justify-between mb-5 md:mb-3">
                    <Box className="flex items-center 2xl:gap-3 xl:gap-1  justify-between">
                      <Typography className="aller uppercase bg-white text-neutral-900 font-bold border-l-[#FEA92A] border-l-[2px] pr-4  py-[4px] md:py-[6px] pl-[10px] text-[12px] md:text-[16px] xl:text-xs 2xl:text-base ">
                        {selectedQuestion?.is_competency_comment
                          ? `Competency Comments`
                          : `QUESTION ${currIndex + 1}`}
                      </Typography>

                      <div className="capitalize font-semibold leading-5 text-[10px] md:text-[12px] xl:text-xs 2xl:text-base text-neutral-600 aller bg-[#EBEBEB] lg:px-3 px-2.5 py-0.5 lg:py-2 rounded-[19px] lg:rounded mx-2">
                        {selectedQuestion?.is_competency_comment
                          ? selectedQuestion?.title
                          : selectedQuestion?.competency?.title}
                      </div>
                      <div className="capitalize font-semibold leading-5 text-[10px] md:text-[12px] xl:text-xs 2xl:text-base text-neutral-600 aller  bg-[#EBEBEB] lg:px-3 px-2.5 py-0.5 lg:py-2 rounded-[19px] lg:rounded">
                        {selectedQuestion?.is_competency_comment
                          ? "Insert Free Text"
                          : selectedQuestion?.response_type &&
                            responseTypes[selectedQuestion?.response_type]}
                      </div>
                    </Box>
                  </Box>
                  <Typography className="2xl:text-[20px] lg:text-[18px] md:text-[16px] aller  leading-6 font-normal my-2 md:my-6  flex justify-between  items-start flex-col sm:flex-row">
                    <span className="font-semibold text-[#525252]">
                      {selectedQuestion.is_competency_comment
                        ? `Comments for ${selectedQuestion.title} competency`
                        : selectedQuestion.text}
                    </span>
                  </Typography>
                  {selectedQuestion?.is_competency_comment ? (
                    <Box className="overflow-y-auto pt-3 mb-2 h-[70%]">
                      <CompetencyComments
                        selectedQuestion={selectedQuestion}
                        setSelectedQuestion={setSelectedQuestion}
                        setQuestions={setQuestions}
                        selectedIndex={currIndex}
                      />
                    </Box>
                  ) : (
                    <Box className="overflow-y-auto pt-3 pb-5 mb-2  h-auto ">
                      <ResponsesBox
                        selectedQuestion={selectedQuestion}
                        setSelectedQuestion={setSelectedQuestion}
                        setQuestions={setQuestions}
                        selectedIndex={currIndex}
                      />
                    </Box>
                  )}
                  <Box
                    style={{ boxShadow: `0px -4px 8px rgba(0, 0, 0, 0.05)` }}
                    className=" w-full hidden md:flex justify-end items-center gap-2 md:gap-5 pt-3 px-4 bg-white  absolute bottom-3 left-0 right-0"
                  >
                    <Button
                      variant="outlined"
                      color="secondary"
                      className="hidden truncate md:flex capitalize disabled:opacity-50 lg:px-4 px-2 lg:py-[6px] py-[4px] leading-5  font-medium text-[12px] lg:text-sm 2xl:text-base "
                      onClick={() => onSubmit(SurveyStatus.Ongoing)}
                      disabled={isLoading}
                      isLoading={isLoading}
                    >
                      Save Progress
                    </Button>

                    <Button
                      variant={
                        selectedQuestion?.is_bookmarked ? "contained" : "text"
                      }
                      startIcon={<BookmarkAdd />}
                      className={`uppercase aller  hover:bg-[#fad12c23] sm:px-2 sm:py-[4px] sm:text-xs lg:py-[6px] lg:px-[16px] xl:text-sm 2xl:text-base leading-5 font-medium ${
                        selectedQuestion?.is_bookmarked
                          ? "text-white bg-[#FAD02C] hover:bg-[#fad12cc5]"
                          : "text-[#FAD02C]"
                      }`}
                      onClick={() => {
                        setSelectedQuestion((prev: any) =>
                          prev
                            ? {
                                ...prev,
                                is_bookmarked: !prev.is_bookmarked,
                              }
                            : prev
                        );
                        setQuestions((prev: any) => {
                          let newArray = JSON.parse(JSON.stringify(prev));
                          newArray[currIndex] = JSON.parse(
                            JSON.stringify({
                              ...selectedQuestion,
                              is_bookmarked: !selectedQuestion?.is_bookmarked,
                            })
                          );
                          return newArray;
                        });
                      }}
                    >
                      <p className="pl-4 m-0">
                        {" "}
                        {selectedQuestion?.is_bookmarked
                          ? "Remove Bookmark"
                          : "Bookmark"}{" "}
                      </p>
                    </Button>

                    <Button
                      variant="outlined"
                      disabled={currIndex === 0}
                      onClick={() => previousQuestion()}
                      startIcon={
                        <BsArrowLeftShort className="h-[15px] w-[15px] md:h-[18px] md:w-[18px] lg:h-[20px] lg:w-[20px]" />
                      }
                      className=" capitalize aller border-neutral-200 lg:px-4 px-2 lg:py-[6px] py-[4px] leading-5 font-medium text-[12px] lg:text-sm 2xl:text-base disabled:border-neutral-100 disabled:text-neutral-300"
                    >
                      Previous{" "}
                      <span className="hidden md:block m-0">
                        &nbsp; Question
                      </span>
                    </Button>

                    {questions?.length === currIndex + 1 ? (
                      <Button
                        variant="contained"
                        disabled={isLoading}
                        color="primary"
                        onClick={() => onSubmit(SurveyStatus.Completed)}
                        isLoading={isLoading}
                        className=" capitalize lg:px-4 px-2 lg:py-[6px] py-[4px]  leading-5 font-medium text-[12px] lg:text-sm 2xl:text-base"
                      >
                        Submit
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={() => nextQuestion()}
                        disabled={
                          selectedQuestion.is_competency_comment
                            ? false
                            : !selectedQuestion.surveys?.every(
                                (item: any) => item?.is_answerd
                              )
                        }
                        endIcon={
                          <BsArrowRightShort className="h-[15px] w-[15px] md:h-[18px] md:w-[18px] lg:h-[20px] lg:w-[20px]" />
                        }
                        className=" capitalize aller text-primary disabled:bg-neutral-100 disabled:text-neutral-300 bg-primary-light lg:px-4 px-2 lg:py-[6px] py-[4px] leading-5 font-medium text-[12px] lg:text-sm 2xl:text-base"
                      >
                        Save & Next
                      </Button>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <Box
              className="  ml-0 lg:mr-3 h-full bg-white w-[20%]  xl:pt-4 xl:pb-3 2xl:pt-6 2xl:pb-5 pt-3 pb-2 px-5  hidden lg:flex flex-col justify-around xl:justify-between "
              sx={{ boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.05)" }}
            >
              <Typography className="font-urbanist uppercase font-semibold text-[#3E3E3C] border-b py-1 flex justify-between items-center xl:text-sm 2xl:text-base">
                QUESTIONS:
              </Typography>
              <Grid
                container
                className="gap-x-2 mt-5 overflow-y-auto h-[60%] xl:h-[70%] content-start"
              >
                {questions?.map((item, index) => (
                  <Box
                    key={item.id}
                    className={`mb-${
                      index + 1 == questions.length ? "0" : "5"
                    } h-fit`}
                  >
                    <Box className="flex justify-start items-center flex-wrap">
                      <div
                        key={item.id}
                        onClick={() => {
                          if (item?.is_answerd && item?.id) {
                            selectQuestion(item.id);
                          }
                        }}
                        className={`text-[12px] xl:text-base 2xl:text-lg  hover:shadow-md relative rounded-full border w-8 h-8 xl:w-10 xl:h-10  flex justify-center  items-center ${
                          item?.is_answerd ? "cursor-pointer" : ""
                        } ${
                          selectedQuestion && item.id === selectedQuestion.id
                            ? "border-[#FEA92A] text-[#4D4D4D] bg-[#FEF7E5] after:content-[''] after:h-[2px] after:w-[25px] after:bg-[#FEA92A] after:absolute  after:-bottom-3 after:left-[50%] after:-translate-x-[50%]"
                            : item.is_answerd
                            ? "border-[#0DC7B1B2] text-[#828282] bg-[#D8F6F399]"
                            : "border-neutral-300 text-[#828282]"
                        } `}
                      >
                        {item?.is_bookmarked && (
                          <BookmarkFilled
                            fill="#FEA92A"
                            className="absolute -top-2 -right-0"
                            size={"20"}
                          />
                        )}
                        {index + 1}
                      </div>
                    </Box>
                  </Box>
                ))}
              </Grid>
              <span className="border-b px-1 my-1"></span>
              <Grid
                container
                className="bg-[#f2f5f799] pt-1   px-4  h-[15%] rounded-[8px]"
              >
                <div className="xl:text-base 2xl:text-lg flex flex-col justify-evenly items-start  w-full">
                  <div className="flex justify-start">
                    <div className="rounded-full border mt-[2px] border-[#FEA92A] text-[#4D4D4D] w-[10px] h-[10px] bg-[#FEF7E5] after:content-[''] after:h-[2px] after:w-[8px] mr-2 after:bg-[#FEA92A] after:absolute  after:bottom-[-6px] after:left-[50%] after:-translate-x-[50%] relative"></div>
                    <div className=" text-neutral-600 text-xs">
                      ACTIVE QUESTION
                    </div>
                  </div>
                  <div className="flex justify-start items-center ">
                    <div className="rounded-full border mt-[2px] border-[#0DC7B1] text-[#4D4D4D] w-[10px] h-[10px] bg-[#D8F6F3] mr-2"></div>
                    <div className="text-neutral-600 text-xs">ANSWERED</div>
                  </div>
                  <div className="flex justify-start items-center ">
                    <div className="rounded-full border mt-[2px] border-neutral-300 text-[#4D4D4D] w-[10px] h-[10px] mr-2"></div>
                    <div className="text-neutral-600 text-xs">UNANSWERED</div>
                  </div>
                  <div className="flex justify-start items-center ">
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
              </Grid>
            </Box>
          </div>
        </Box>
      </Box>
    </>
  );
};

// font-size: 13px;
// padding: 5px 8px;
// border-radius: 4px;

export default NewSurvey;
