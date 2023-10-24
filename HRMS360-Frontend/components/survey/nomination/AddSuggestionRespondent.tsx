import { Add, Close, Edit, View } from "@carbon/icons-react";
import { Grid, IconButton } from "@mui/material";
import { AutoComplete, Button, Dialog, Input, Label } from "components/layout";
import { queryClient } from "configs/queryClient";
import { surveySuggestedByOptions } from "constants/survey";
import { useFormikContext } from "formik";
import { useCreateOrUpdate } from "hooks/useCreateOrUpdate";
import { EmployeeInterface } from "interfaces/employee-configuration";
import { SurveyExternalRespondantInterface } from "interfaces/survey";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { VoidFunction } from "types/functionTypes";
import { toast } from "utils/toaster";

export interface AddRespondentBoxProps {
  selectedRater?: EmployeeInterface &
    Partial<SurveyExternalRespondantInterface>;
}

export const AddSuggestionRespondent = ({
  selectedRater,
}: AddRespondentBoxProps) => {
  const [comments, setComments] = useState<any>(null);
  const [alternativeSuggestion, setAlternativeSuggestion] = useState<any>("");
  const { values } = useFormikContext<any>();
  const { query } = useRouter();

  const isSuggestionAddedByLM = useMemo(() => {
    if (
      selectedRater &&
      selectedRater.respondant &&
      selectedRater.respondant?.last_suggestion
    ) {
      let isSuggestionAddedByLM =
        selectedRater?.logs
          ?.map((item) => item.suggested_by)
          .includes(surveySuggestedByOptions.LINE_MANAGER) &&
        values.loggedInUser?.id === values?.user?.line_manager_id;
      setComments(
        isSuggestionAddedByLM
          ? selectedRater.respondant?.last_suggestion.comments
          : ""
      );
      setAlternativeSuggestion(
        isSuggestionAddedByLM
          ? selectedRater.respondant?.last_suggestion?.user || ""
          : ""
      );
      return isSuggestionAddedByLM;
    }

    return false;
  }, [selectedRater, values]);

  const isSuggestionAddedByEMP = useMemo(() => {
    if (
      selectedRater &&
      selectedRater.respondant &&
      selectedRater.respondant?.last_suggestion
    ) {
      let isSuggestionAddedByEMP =
        selectedRater?.logs
          ?.map((item) => item.suggested_by)
          .includes(surveySuggestedByOptions.EMPLOYEE) &&
        values.loggedInUser?.id === values?.user?.id;
      setComments(
        isSuggestionAddedByEMP
          ? selectedRater.respondant?.last_suggestion.comments
          : ""
      );
      setAlternativeSuggestion(
        isSuggestionAddedByEMP
          ? selectedRater.respondant?.last_suggestion?.user || ""
          : ""
      );
      return isSuggestionAddedByEMP;
    }

    return false;
  }, [selectedRater, values]);

  const { mutate, isLoading } = useCreateOrUpdate({
    url: `/survey/alternative-respondents/${selectedRater?.respondant?.id}`,
    async onSuccess() {
      toast("Respondent suggestion added successfully");
      await queryClient.refetchQueries(`/survey/raters/${query.surveyId}`, {
        exact: true,
      });
    },
  });

  const postData = (onClose: VoidFunction) => {
    let data = {
      comments,
      alternative_suggestion_id: alternativeSuggestion.id,
      suggested_by: values.is_suggestion
        ? surveySuggestedByOptions.EMPLOYEE
        : surveySuggestedByOptions.LINE_MANAGER,
    };

    if (!comments || !comments?.length) {
      return toast("Please add comments", "error");
    }

    if (!alternativeSuggestion) {
      return toast("Please select alternative suggestion", "error");
    }

    mutate(data, { onSuccess: onClose });
  };

  if (isSuggestionAddedByLM || isSuggestionAddedByEMP) {
    return null;
  }

  return (
    <Dialog
      maxWidth='md'
      button={
        isSuggestionAddedByLM || isSuggestionAddedByEMP ? (
          <Button
            variant='text'
            startIcon={<View />}
            color={"primary"}
            className='underline capitalize xl:text-sm 2xl:text-base'
          >
            View Suggestion
          </Button>
        ) : (
          <Button
            variant='text'
            startIcon={<Edit />}
            color={"secondary"}
            className='underline capitalize xl:text-sm 2xl:text-base'
          >
            Suggest Alternative
          </Button>
        )
      }
      title='ADD RESPONDENTS'
    >
      {({ onClose }) => (
        <Grid container spacing={4} className='mt-7 mb-5' alignItems={"center"}>
          <Grid item xs={3}>
            <Label text={"Respondent : "} />
          </Grid>
          <Grid item xs={9}>
            <AutoComplete
              value={selectedRater}
              options={
                values?.users.filter(
                  (item: any) => !values.userIds.includes(item.id)
                ) || []
              }
              disabled
              getOptionLabel={(option: any) => option.name || option}
            />
          </Grid>

          <>
            <Grid item xs={3}>
              <Label text={"Suggested Respondent : "} />
            </Grid>
            <Grid item xs={9}>
              <AutoComplete
                value={alternativeSuggestion}
                disabled={isSuggestionAddedByEMP || isSuggestionAddedByLM}
                options={
                  values?.users.filter(
                    (item: any) => !values.userIds.includes(item.id)
                  ) || []
                }
                onChange={(_, v) => setAlternativeSuggestion(v)}
                getOptionLabel={(option: any) => option.name || option}
              />
            </Grid>
            {comments !== null ? (
              <>
                <Grid item xs={3}>
                  <Label text={"Comments : "} />
                </Grid>
                <Grid item xs={9} className='relative'>
                  <IconButton
                    disabled={isSuggestionAddedByEMP || isSuggestionAddedByLM}
                    className='absolute top-9 z-10 right-1'
                    color='error'
                    onClick={() => setComments(null)}
                  >
                    <Close size={24} />
                  </IconButton>
                  <Input
                    multiline
                    disabled={isSuggestionAddedByEMP || isSuggestionAddedByLM}
                    rows={3}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
                </Grid>
              </>
            ) : (
              <Button
                startIcon={<Add />}
                onClick={() => setComments("")}
                variant='text'
                className='ml-auto mt-4'
              >
                Add Comment
              </Button>
            )}
          </>

          <Grid item xs={12} className='flex justify-end items-center gap-4'>
            <Button color='secondary' onClick={() => onClose()}>
              Close
            </Button>
            {!isSuggestionAddedByLM && !isSuggestionAddedByEMP && (
              <Button
                color='primary'
                isLoading={isLoading}
                onClick={() => postData(onClose)}
              >
                Save
              </Button>
            )}
          </Grid>
        </Grid>
      )}
    </Dialog>
  );
};
