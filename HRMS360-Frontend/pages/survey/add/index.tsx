import React, { useState } from "react";
import { NextPage } from "next";
import { PageHeader, Stepper } from "components";
import { Grid } from "@mui/material";
import {
  AddSurveyTitle,
  SelectQuestionnaire,
  LaunchSurvey,
  SelectRecipients,
} from "components";
import * as yup from "yup";
import { Formik } from "formik";
import { SurveyDescriptionInterface } from "interfaces/survey";
import moment from "moment";
import { useCreateOrUpdate } from "hooks/useCreateOrUpdate";
import { useRouter } from "next/router";
import { toast } from "utils/toaster";

const initialValues: SurveyDescriptionInterface = {
  title: "",
  description: "",
  questionnaire_id: "",
  status: "",
  end_date: "",
  respondant_cut_off_date: "",
  lm_approval_cut_off_date: "",
  employees: [],
  employeeIds: [],
};

const validationSchema = [
  yup.object({
    title: yup.string().required("Title is required"),
    description: yup.string().required("Description is required"),
    respondant_cut_off_date: yup.date(),
    end_date: yup
      .date()
      .min(
        yup.ref("lm_approval_cut_off_date"),
        "End Date must be after LM Approval Cut Off Date"
      )
      .required("End Date is required"),
    lm_approval_cut_off_date: yup
      .date()
      .min(
        yup.ref("respondant_cut_off_date"),
        "LM Approval Cut Off Date must be after Respondant Nominee Cut Off Date"
      )
      // .when(
      //   "respondant_cut_off_date",
      //   (respondant_cut_off_date, schema) =>
      //     respondant_cut_off_date && schema.min(respondant_cut_off_date)
      // )
      .required("LM approval Date is required"),
  }),
  yup.object({
    employees: yup
      .array()
      .of(yup.mixed())
      .min(1, "Please select at leat one employee"),
  }),
  yup.object({
    questionnaire_id: yup.string().required("Questionnaire is required"),
  }),
];

const AddSurvey: NextPage = () => {
  const [activeStep, setActiveStep] = useState(0);
  const { push } = useRouter();
  const goBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const { mutate, isLoading } = useCreateOrUpdate({
    url: "/survey",
    onSuccess() {
      push("/survey/all");
      toast("Survey created successfully");
    },
  });

  const onSubmit = (values: SurveyDescriptionInterface) => {
    if (activeStep === 3) {
      if (values?.employees && !values?.employees?.length)
        return toast("Please select atleast one employee", "error");

      const data = {
        title: values.title,
        description: values.description,
        questionnaire_id: values.questionnaire_id,
        end_date: moment(values.end_date).format("YYYY-MM-DDTHH:mm:ss"),
        respondant_cut_off_date: moment(values.respondant_cut_off_date).format(
          "YYYY-MM-DDTHH:mm:ss"
        ),
        lm_approval_cut_off_date: moment(
          values.lm_approval_cut_off_date
        ).format("YYYY-MM-DDTHH:mm:ss"),
        employees: [
          ...new Set(values?.employees?.map((item) => item.id) || []),
        ],
      };

      mutate(data);
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  return (
    <>
      <PageHeader title="CREATE SURVEY" />
      <Grid
        container
        direction="row"
        justifyContent="flex-start"
        alignItems="flex-start"
      >
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema[activeStep]}
          onSubmit={(values) => onSubmit(values)}
        >
          <Stepper
            activeStep={activeStep}
            steps={[
              {
                position: 0,
                step: "Add Survey Title",
                component: <AddSurveyTitle />,
              },
              {
                position: 1,
                step: "Select Recipients",
                component: <SelectRecipients goBack={goBack} />,
              },
              {
                position: 2,
                step: "Select Questionnaire",
                component: <SelectQuestionnaire goBack={goBack} />,
              },
              {
                position: 3,
                step: "Launch Survey",
                component: (
                  <LaunchSurvey goBack={goBack} isLoading={isLoading} />
                ),
              },
            ]}
          />
        </Formik>
      </Grid>
    </>
  );
};

export default AddSurvey;
