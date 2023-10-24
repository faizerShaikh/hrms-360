import React, { useEffect, useMemo, useState } from "react";
import { BaseProps } from "interfaces/base";
import { Box, Grid, Typography, useMediaQuery } from "@mui/material";
import Image from "next/image";
import { NextPageContext } from "next";
import { serverAPI } from "configs/api";
import { setApiHeaders } from "utils/setApiHeaders";
import {
  SurveyDescriptionInterface,
  SurveyResponseInterface,
  SurveyStatus,
} from "interfaces/survey";
import { EmployeeInterface } from "interfaces/employee-configuration";
import Head from "next/head";
import {
  QuestionInterface,
  QuestionResponseType,
} from "interfaces/competency-bank";
import AssessmentForm from "components/survey/assessment";
import { Button, ScrollToBottom, ScrollToTop } from "components/layout";
import { useRouter } from "next/router";
import { useCreateOrUpdate } from "hooks/useCreateOrUpdate";
import { toast } from "utils/toaster";
import { Alert } from "components/layout/alert";
import { logoPath } from "constants/layout";

export const getServerSideProps = async (ctx: NextPageContext) => {
  setApiHeaders(ctx);

  const res = await serverAPI.get(`/survey/detail/${ctx.query.token}`);
  const data: SurveyDescriptionInterface = res.data.data.survey;
  const user: EmployeeInterface = res.data.data.user;

  if (!data) {
    return {
      notFound: true,
    };
  }
  let compIds: { [key: string]: string } = {};
  const questionsArr: Array<SurveyResponseInterface & QuestionInterface> = [];
  if (data.questionnaire?.questions?.length) {
    for (const ques of data.questionnaire?.questions) {
      if (ques?.id) {
        if (ques.competency?.id) {
          compIds[ques.competency?.id] =
            ques.competency?.comments && ques.competency?.comments[0]
              ? ques.competency.comments[0].comments
              : "";
        }

        let responseObj = {
          ...ques,
          response_id:
            ques.response_type !== QuestionResponseType.multiple_choice &&
            ques?.surveyResponses?.length &&
            ques.surveyResponses[0].response_id
              ? ques.surveyResponses[0].response_id
              : "",
          response_ids:
            (ques.response_type === QuestionResponseType.multiple_choice &&
              ques?.surveyResponses?.length &&
              ques.surveyResponses.map((i) =>
                i.response_id ? i.response_id : ""
              )) ||
            [],
          response_text:
            ques.response_type === QuestionResponseType.text &&
            ques?.surveyResponses?.[0]?.response_text
              ? ques.surveyResponses[0].response_text
              : "",
          consider_in_report: true,
          question_id: ques.id,
          question_type: ques?.response_type,
        };

        responseObj["is_answerd"] =
          responseObj.question_type === QuestionResponseType.multiple_choice
            ? Boolean(responseObj.response_ids.length)
            : responseObj.question_type === QuestionResponseType.likert_scale
            ? Boolean(responseObj.response_id)
            : responseObj.question_type === QuestionResponseType.text
            ? Boolean(responseObj.response_text)
            : Boolean(responseObj.response_id);

        questionsArr.push(responseObj);
      }
    }
  }

  return { props: { data, user, questionsArr, compIds } };
};

function generateRandom(min = 0, max = 100) {
  // find diff
  let difference = max - min;
  // generate random number
  let rand = Math.random();
  // multiply with difference
  rand = Math.floor(rand * difference);
  // add with min value
  rand = rand + min;
  return rand;
}

const SurveyAssessment: BaseProps<
  SurveyDescriptionInterface,
  {
    user: EmployeeInterface;
    questionsArr: Array<SurveyResponseInterface & QuestionInterface>;
    compIds: { [key: string]: "" };
  }
> = ({ data, user, questionsArr, compIds }) => {
  const isMobile = useMediaQuery("(max-width:640px)");

  const [surveyResponses, setSurveyResponses] = useState<
    Array<SurveyResponseInterface & QuestionInterface>
  >([]);
  const [competencyComments, setCompetencyComments] = useState<{
    [key: string]: string;
  }>(compIds);

  const router = useRouter();
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    setSurveyResponses(questionsArr);
  }, [questionsArr]);

  const { mutate, isLoading } = useCreateOrUpdate({
    url: "/survey/submit-survey-single-ratee",
    onSuccess: (_, submittedData) => {
      if (submittedData.status === SurveyStatus.Completed) {
        setIsSubmitted(true);
      }

      toast(
        submittedData.status === SurveyStatus.Ongoing
          ? "Progress saved successfully"
          : "Survey submited successfully",
        "success"
      );
    },
  });

  const onSave = async (
    status: SurveyStatus.Ongoing | SurveyStatus.Completed
  ) => {
    const data = {
      token: router.query.token,
      surveyResponses,
      status,
      competencyComments,
    };

    if (status === SurveyStatus.Ongoing) {
      data.surveyResponses = data.surveyResponses.filter(
        (i: SurveyResponseInterface) =>
          i.response_id.length > 0 ||
          i.response_text.length > 0 ||
          i.response_ids.length > 0
      );
    } else if (status === SurveyStatus.Completed) {
      // if (Object.values(competencyComments).some((value) => !value)) {
      //   toast("Please add comments for all competencies", "error");
      //   return;
      // }

      let newCompetencyComments = {};
      for (const [key, value] of Object.entries(competencyComments)) {
        if (value) {
          newCompetencyComments[key] = value;
        }
      }
      data.competencyComments = newCompetencyComments;

      if (
        data.surveyResponses.some(
          (i: SurveyResponseInterface) =>
            i.response_text.length < 1 &&
            i.response_id.length < 1 &&
            i.response_ids.length < 1
        )
      ) {
        toast("Please fill all responses to submit the Survey", "error");
        return;
      }
    }

    mutate(data);
  };

  let answeredQuestionsCount = useMemo(
    () =>
      surveyResponses?.reduce((prev, curr) => {
        return prev + (curr?.is_answerd ? 1 : 0);
      }, 0),

    [surveyResponses]
  );

  const completionPercentage = useMemo(() => {
    return +Math.round(
      (surveyResponses.reduce(
        (prev, curr) => (curr.is_answerd ? prev + 1 : prev),
        0
      ) /
        surveyResponses.length) *
        100
    ).toFixed();
  }, [surveyResponses]);

  const fillForm = () => {
    setSurveyResponses((prev) =>
      prev.map((item) => {
        let obj = { ...item };

        if (item.response_type === QuestionResponseType.text) {
          obj.response_text = "Sample text comment";
        }

        if (
          ["yes_no", "single_choice", "likert_scale"].includes(
            item.response_type
          )
        ) {
          obj.response_id = item?.responses
            ? `${
                item?.responses[
                  Math.floor(Math.random() * item?.responses?.length)
                ].value
              }` || ""
            : "";
        }

        if (item.response_type === QuestionResponseType.multiple_choice) {
          obj.response_ids = item?.responses
            ? item?.responses
                ?.slice(0, generateRandom(1, 5))
                ?.map((item) => `${item?.value}` || "")
            : [];
        }

        obj["is_answerd"] = true;

        return obj;
      })
    );

    setCompetencyComments((prev) => {
      let obj: any = {};
      for (const key of Object.keys(prev)) {
        obj[key] = "My Comments for this Competency";
      }
      return obj;
    });
  };

  if (isSubmitted) {
    return (
      <Box className="flex justify-center items-center h-[500px]">
        <Alert text="Thanks for completing the survey" variant="success" />
      </Box>
    );
  }

  return (
    <>
      <Head>
        <title>Survey Assessment | {data?.title}</title>
      </Head>

      <ScrollToTop />

      <Grid
        container
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        className="w-full py-[12px] px-4 md:px-[25px] bg-[#fff] shadow-[0_4px_40px_rgba(0,0,0,0.1)] mb-3 md:mb-6 sticky top-0  z-50 left-0 right-0"
      >
        <Grid
          item
          className="flex justify-between lg:justify-start items-center w-full md:w-auto gap-[15px] lg:gap-[15px]  pb-3 md:pb-0"
        >
          <Image src={logoPath} width="100" height="30" alt="" />
          <Button
            disabled
            className="block capitalize text-start aller border-[#DDDBDA] bg-transparent text-[#525252] font-semibold md:text-[14px] lg:text-[16px] 2xl:text-base"
          >
            <Typography className="capitalize  aller border-[#DDDBDA] bg-transparent text-[#525252] font-semibold md:text-[14px] lg:text-[16px] 2xl:text-base w-auto md:w-[75px] lg:w-[130px] xl:w-[250px] truncate">
              {data.title}
            </Typography>
          </Button>
        </Grid>

        <Grid
          item
          className="flex justify-between items-center gap-x-2 flex-1  text-[#616161]  bg-white "
        >
          <Grid
            item
            className="flex justify-start items-center   text-[#616161]  bg-white "
          >
            <div className="w-[180px] md:w-[250px] lg:w-[500px]">
              <div className="progress-bar w-full">
                <div
                  className="bar positive"
                  style={{ width: `${completionPercentage}%` }}
                >
                  <span className=" text-[14px] md:text-[16px] w-[180px]  md:w-[250px] lg:w-[500px]">
                    {answeredQuestionsCount} of {questionsArr?.length} Completed
                  </span>
                </div>
                <div
                  className="bar negative"
                  style={{ width: `${100 - completionPercentage}%` }}
                >
                  <span className=" text-[14px] md:text-[16px] w-[180px]  md:w-[250px] lg:w-[500px]">
                    {answeredQuestionsCount} of {questionsArr?.length} Completed
                  </span>
                </div>
              </div>
            </div>
          </Grid>
          <Grid item className="justify-end items-center flex gap-2">
            <Button
              id="filler"
              // sx={{ width: 0, height: 0, padding: 0 }}
              className="hidden md:flex uppercase lg:px-4 px-2 lg:py-[6px] py-[6px] leading-5 font-medium text-[12px] lg:text-sm 2xl:text-base"
              onClick={() => {
                fillForm();
              }}
            >
              fill form
            </Button>
            <Button
              variant="outlined"
              className="uppercase lg:px-4 px-2 lg:py-[6px] py-[6px] leading-5 bg-white border-[#DDDBDA]  font-medium text-[12px] lg:text-sm 2xl:text-base"
              onClick={() => onSave(SurveyStatus.Ongoing)}
              disabled={isLoading}
              isLoading={isLoading}
            >
              Save {isMobile ? "" : "Progress"}
            </Button>
            <Button
              variant="contained"
              disabled={isLoading}
              color="primary"
              onClick={() => onSave(SurveyStatus.Completed)}
              isLoading={isLoading}
              className="uppercase px-4 py-[6px] leading-5 font-medium text-[12px] lg:text-sm 2xl:text-base"
            >
              Submit
            </Button>
          </Grid>
        </Grid>
      </Grid>

      <Box className="survey-container mx-auto mt-20 ">
        <Box>
          <div className="bg-primary h-2 w-20 mb-2" />
          <Typography className="fc-dark font-semibold text-xl md:text-xl mb-4">
            Survey Recipient Details
          </Typography>
          <Typography className="fc-dark text-base md:text-base aller-light mb-1">
            Employee Name : {user.name} ({user?.designation?.name})
          </Typography>
          <Typography className="fc-dark text-base md:text-base aller-light mb-4">
            Survey Conducted for - Department : {user?.department?.name}
          </Typography>
        </Box>
        <Box className="mt-16">
          <div className="mb-3 flex justify-start items-center">
            <div className="bg-primary rounded w-2 h-2 mr-2" />
            <div className="bg-primary rounded w-2 h-2 mr-2" />
            <div className="bg-primary rounded w-2 h-2 mr-2" />
          </div>
          <Typography className="fc-dark font-semibold text-xl md:text-xl mb-4">
            Description
          </Typography>
          <Typography className="fc-dark text-base md:text-base aller-light mb-1">
            {data?.description}
          </Typography>
        </Box>
        <Box className="mt-16">
          <div className="bg-primary h-2 w-20 mb-2" />
          <Typography className="fc-dark font-semibold text-xl md:text-xl mb-4">
            Survey Start Point
          </Typography>
        </Box>
      </Box>
      <Box className="mb-16 mt-4">
        <AssessmentForm
          questionsArr={questionsArr || []}
          surveyResponses={surveyResponses}
          setSurveyResponses={setSurveyResponses}
          competencyComments={competencyComments}
          setCompetencyComments={setCompetencyComments}
        />
      </Box>
      <ScrollToBottom />
    </>
  );
};

export default React.memo(SurveyAssessment);
