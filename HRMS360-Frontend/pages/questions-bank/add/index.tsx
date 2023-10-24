import React from "react";
import { NextPage } from "next";
import {
  AddQuestionnaireTitle,
  PageHeader,
  SelectQuestionnaireCompetency,
  SelectQuestionnaireQuestions,
  Stepper,
} from "components";
import { Grid } from "@mui/material";
import { Form, Formik, FormikHelpers } from "formik";
import { QuestionnaireInterface } from "interfaces";
import * as yup from "yup";
import { useCreateOrUpdate } from "hooks";
import { useRouter } from "next/router";
import { toast, onError } from "utils";

const questionnaireInitailValues: QuestionnaireInterface & {
  activeStep: number;
} = {
  title: "",
  description: "",
  competencies: [],
  activeStep: 0,
};

export const questionnaireValidations = yup.object({
  title: yup.string().required("Title is required"),
  description: yup.string().required("Description is required"),
});

const AddQuestionnaire: NextPage = () => {
  const { push } = useRouter();

  const { mutate, isLoading } = useCreateOrUpdate({
    url: "/questionnaire",
  });

  const onSubmit = (
    values: QuestionnaireInterface & {
      activeStep: number;
    },
    action: FormikHelpers<QuestionnaireInterface & { activeStep: number }>
  ) => {
    try {
      if (values.activeStep === 2) {
        let competencies = values?.competencies?.map((item) => {
          if (!item.questions || !item.questions.length) {
            throw new Error(
              "Please select at least one questions form each competencies"
            );
          }

          return {
            id: item.id,
            questionIds: item.questions.map((question) => question?.id),
          };
        });

        const data = {
          title: values.title,
          description: values.description,
          competencies,
        };

        mutate(data, {
          onSuccess: () => {
            toast("Questionnaire created sucessfully", "success");
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
    <>
      <PageHeader title="Create QuestionNaire" />
      <Formik
        initialValues={questionnaireInitailValues}
        validationSchema={questionnaireValidations}
        onSubmit={(value, actions) => onSubmit(value, actions)}
      >
        {({ values }) => (
          <Form>
            <Grid container>
              <Stepper
                activeStep={values.activeStep}
                steps={[
                  {
                    position: 0,
                    step: "Add Questionnaire Title",
                    component: <AddQuestionnaireTitle />,
                  },
                  {
                    position: 1,
                    step: "Select Competency",
                    component: <SelectQuestionnaireCompetency />,
                  },
                  {
                    position: 2,
                    step: "Select Questions",
                    component: (
                      <SelectQuestionnaireQuestions isLoading={isLoading} />
                    ),
                  },
                ]}
              />
            </Grid>
          </Form>
        )}
      </Formik>
    </>
  );
};

export default AddQuestionnaire;
