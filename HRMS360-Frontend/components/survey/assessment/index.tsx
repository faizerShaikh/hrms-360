import React, { useCallback, useEffect } from "react";
import { Box } from "@mui/material";
import { surveyAssessmentComponents } from "constants/survey-assessment-inputs";
import { SurveyResponseInterface } from "interfaces/survey";

import {
  QuestionInterface,
  QuestionResponseType,
} from "interfaces/competency-bank";
import QuestionHeader from "./QuestionHeader";
import CompetencyHeader from "./CompetencyHeader";
import { CompetencyComment } from "./CompetencyComment";

const AssessmentForm = ({
  questionsArr,
  surveyResponses,
  setSurveyResponses,
  competencyComments,
  setCompetencyComments,
}: {
  questionsArr: Array<SurveyResponseInterface & QuestionInterface>;
  surveyResponses: Array<SurveyResponseInterface & QuestionInterface>;
  setSurveyResponses: React.Dispatch<
    React.SetStateAction<
      (SurveyResponseInterface & QuestionInterface<string>)[]
    >
  >;
  competencyComments: { [key: string]: string };
  setCompetencyComments: React.Dispatch<
    React.SetStateAction<{
      [key: string]: string;
    }>
  >;
}) => {
  useEffect(() => {
    setSurveyResponses(questionsArr);
  }, [questionsArr]);

  const onChange = useCallback(
    ({ name, value, id, checkedId }: { [key: string]: string }) => {
      setSurveyResponses((prev: any) => {
        let arr: any = [...prev];

        if (typeof value === "boolean") {
          arr[id] = {
            ...arr[id],
            [name]: value
              ? [...arr[id][name], checkedId]
              : arr[id][name].filter((i: string) => i !== checkedId),
          };
        } else {
          arr[id] = { ...arr[id], [name]: value };
        }

        arr[id]["is_answerd"] =
          arr[id].question_type === QuestionResponseType.multiple_choice
            ? Boolean(arr[id].response_ids.length)
            : arr[id].question_type === QuestionResponseType.likert_scale
            ? Boolean(arr[id].response_id)
            : arr[id].question_type === QuestionResponseType.text
            ? Boolean(arr[id].response_text)
            : Boolean(arr[id].response_id);

        return arr;
      });
    },
    [setSurveyResponses]
  );

  return (
    <Box width={"100%"}>
      {surveyResponses?.map(
        (
          question: QuestionInterface & SurveyResponseInterface,
          index: number
        ) => (
          <Box key={question.id} className="survey-container mx-auto">
            <CompetencyHeader
              index={index}
              competency={question.competency}
              lastCompId={
                surveyResponses[index - 1] &&
                surveyResponses[index - 1]?.competency?.id
              }
            />
            <Box className="pb-16">
              <QuestionHeader
                index={index}
                text={question.text}
                question={question}
              />

              {surveyAssessmentComponents[question.response_type]({
                options: question.responses,
                item: question,
                onChange,
                id: index,
              })}
              {(index + 1 === surveyResponses.length ||
                (surveyResponses[index + 1] &&
                  question?.competency?.id !==
                    surveyResponses[index + 1]?.competency?.id)) && (
                <CompetencyComment
                  setCompetencyComments={setCompetencyComments}
                  competencyId={question?.competency?.id || undefined}
                  competencyComments={
                    question?.competency?.id
                      ? competencyComments[question?.competency?.id]
                      : undefined
                  }
                />
              )}
            </Box>
          </Box>
        )
      )}
    </Box>
  );
};

export default AssessmentForm;
