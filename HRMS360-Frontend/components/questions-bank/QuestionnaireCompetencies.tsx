import React from "react";
import { Grid } from "@mui/material";
import { Stepper } from "..";
import { CompetencyInterface } from "interfaces/competency-bank";
import { Form, Formik, FormikHelpers } from "formik";
import { SelectQuestionnaireQuestions } from "./SelectQuestionnaireQuestions";
import { CompetencyUpdate } from "./AddCompetencyUpdate";
import { useRouter } from "next/router";
import { useQueryClient } from "react-query";
import { useCreateOrUpdate } from "hooks/useCreateOrUpdate";
import { toast } from "utils/toaster";
import { onError } from "utils/onError";

export const QuestionnaireCompetencies = ({
  competencies,
}: {
  competencies?: CompetencyInterface[];
}) => {
  const { query, push } = useRouter();
  const queryClient = useQueryClient();

  const { mutate, isLoading } = useCreateOrUpdate({
    url: "/questionnaire/" + query.id,
    method: "put",
    refetch: () =>
      queryClient.refetchQueries(["/questionnaire/" + query.id], {
        exact: true,
      }),
  });

  const onSubmit = (values: any, action: FormikHelpers<any>) => {
    try {
      if (values.activeStep === 1) {
        let competencies = values?.competencies?.map(
          (item: CompetencyInterface) => {
            if (!item.questions || !item.questions.length) {
              throw new Error(
                "Please select at least one questions form each competencies"
              );
            }

            return {
              id: item.id,
              questionIds: item.questions.map((question) => question?.id),
            };
          }
        );

        const data = {
          competencies,
        };

        mutate(data, {
          onSuccess: () => {
            toast("Questionnaire updated sucessfully", "success");
            push("/questions-bank/my");
          },
        });
      } else {
        action.setFieldValue("activeStep", values.activeStep + 1);
      }
    } catch (error) {
      onError(error);
    }
  };
  return (
    <Formik
      initialValues={{ competencies, activeStep: 0 }}
      onSubmit={(values, action) => onSubmit(values, action)}
    >
      {({ values }) => (
        <Form>
          <Grid container className="pt-10">
            <Stepper
              activeStep={values.activeStep}
              steps={[
                {
                  position: 0,
                  step: "Select Competency",
                  component: <CompetencyUpdate />,
                },
                {
                  position: 1,
                  step: "Select Questions",
                  component: (
                    <SelectQuestionnaireQuestions
                      isUpdate
                      isLoading={isLoading}
                    />
                  ),
                },
              ]}
            />
          </Grid>
        </Form>
      )}
    </Formik>
  );
};
