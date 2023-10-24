import { Edit, View } from "@carbon/icons-react";
import { Grid } from "@mui/material";
import { Button, Dialog, Input, Label } from "components/layout";
import { queryClient } from "configs/queryClient";
import { surveySuggestedByOptions } from "constants/survey";
import { Formik, useFormikContext } from "formik";
import { useCreateOrUpdate } from "hooks/useCreateOrUpdate";
import {
  PendingNominationInterface,
  SurveyExternalRespondantInterface,
} from "interfaces/survey";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { toast } from "utils/toaster";

import * as yup from "yup";

export interface AddExternalRespondentSuggestionBoxProps {
  rater: PendingNominationInterface;
  defaultValue: SurveyExternalRespondantInterface;
}

const externalRespondentValidations = yup.object({
  alternative_name: yup.string().required("Name is required"),
  alternative_email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email"),
  comments: yup.string().required("Comments is required"),
});

export const AddExternalRespondentSuggestionBox = ({
  defaultValue,
}: AddExternalRespondentSuggestionBoxProps) => {
  const { query } = useRouter();
  const { values } = useFormikContext<any>();

  const [initialState, setInitialState] = useState({
    alternative_email: "",
    alternative_name: "",
    comments: "",
  });

  const isSuggestionAddedByLM = useMemo(() => {
    if (defaultValue?.last_suggestion) {
      if (
        defaultValue?.last_suggestion?.suggested_by ===
          surveySuggestedByOptions.LINE_MANAGER &&
        values.loggedInUser?.id === values?.user?.line_manager_id
      ) {
        setInitialState((prev) => ({
          ...prev,
          alternative_email: values.is_suggestion
            ? ""
            : defaultValue?.last_suggestion?.alternative_email || "",
          alternative_name: values.is_suggestion
            ? ""
            : defaultValue?.last_suggestion?.alternative_name || "",
          comments: values.is_suggestion
            ? ""
            : defaultValue?.last_suggestion?.comments || "",
        }));
      }
      return (
        defaultValue?.last_suggestion?.suggested_by ===
          surveySuggestedByOptions.LINE_MANAGER &&
        values.loggedInUser?.id === values?.user?.line_manager_id
      );
    }

    return false;
  }, [defaultValue, values]);

  const isSuggestionAddedByEMP = useMemo(() => {
    if (defaultValue && defaultValue && defaultValue?.last_suggestion) {
      setInitialState((prev) => ({
        ...prev,
        alternative_email: values.is_approval
          ? ""
          : defaultValue?.last_suggestion?.alternative_email || "",
        alternative_name: values.is_approval
          ? ""
          : defaultValue?.last_suggestion?.alternative_name || "",
        comments: values.is_approval
          ? ""
          : defaultValue?.last_suggestion?.comments || "",
      }));
      return (
        defaultValue?.last_suggestion?.suggested_by ===
          surveySuggestedByOptions.EMPLOYEE &&
        values.loggedInUser?.id === values?.user?.id
      );
    }

    return false;
  }, [defaultValue, values]);

  const { mutate, isLoading } = useCreateOrUpdate({
    url: `/survey/alternative-external-respondents/${defaultValue?.id}`,
    async onSuccess() {
      toast("External Respondent suggestion added successfully");
      await queryClient.refetchQueries(`/survey/raters/${query.surveyId}`, {
        exact: true,
      });
    },
  });

  const postData = (value: any, onClose: VoidFunction) => {
    mutate(
      {
        alternative_email: value.alternative_email,
        alternative_name: value.alternative_name,
        comments: value.comments,
        suggested_by:
          values.loggedInUser?.id === values?.user?.id
            ? surveySuggestedByOptions.EMPLOYEE
            : surveySuggestedByOptions.LINE_MANAGER,
        is_external: true,
      },
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog
      maxWidth='md'
      button={
        isSuggestionAddedByLM || isSuggestionAddedByEMP ? (
          <Button
            variant='text'
            startIcon={<View />}
            color={"primary"}
            className='underline capitalize '
          >
            View Suggestion
          </Button>
        ) : (
          <Button
            variant='text'
            startIcon={<Edit />}
            color={"secondary"}
            className='underline capitalize'
          >
            Suggest Alternative
          </Button>
        )
      }
      title='ADD RESPONDENTS'
    >
      {({ onClose }) => (
        <Formik
          initialValues={{
            ...initialState,
          }}
          enableReinitialize
          validationSchema={externalRespondentValidations}
          onSubmit={(values) => postData(values, onClose)}
        >
          {({ submitForm }) => (
            <Grid
              container
              spacing={4}
              className='mt-7 mb-5'
              alignItems={"center"}
            >
              <Grid item xs={3}>
                <Label text={"Respondent :"} />
              </Grid>
              <Grid item xs={4.5}>
                <Input
                  disabled
                  label='Name'
                  value={defaultValue.respondant_name}
                />
              </Grid>
              <Grid item xs={4.5}>
                <Input
                  disabled
                  label='Email'
                  value={defaultValue.respondant_email}
                />
              </Grid>
              <Grid item xs={3}>
                <Label text={"Alternative Respondent :"} />
              </Grid>
              <Grid item xs={4.5}>
                <Input
                  disabled={isSuggestionAddedByEMP || isSuggestionAddedByLM}
                  label='Alternative Name'
                  name='alternative_name'
                />
              </Grid>
              <Grid item xs={4.5}>
                <Input
                  disabled={isSuggestionAddedByEMP || isSuggestionAddedByLM}
                  label='Alternative Email'
                  name='alternative_email'
                />
              </Grid>
              <Grid item xs={3}>
                <Label text='Comments : ' />
              </Grid>
              <Grid item xs={9}>
                <Input
                  disabled={isSuggestionAddedByEMP || isSuggestionAddedByLM}
                  multiline
                  rows={3}
                  label='Comments'
                  name='comments'
                />
              </Grid>
              <Grid item xs={12} className='flex justify-end items-center'>
                <Button color='secondary' onClick={() => onClose()}>
                  Close
                </Button>
                {!isSuggestionAddedByLM && !isSuggestionAddedByEMP && (
                  <Button
                    color='primary'
                    isLoading={isLoading}
                    onClick={() => submitForm()}
                    className='ml-4'
                  >
                    Save
                  </Button>
                )}
              </Grid>
            </Grid>
          )}
        </Formik>
      )}
    </Dialog>
  );
};
