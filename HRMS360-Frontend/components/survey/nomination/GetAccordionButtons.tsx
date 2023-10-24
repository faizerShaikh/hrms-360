import { Checkmark, RowDelete } from "@carbon/icons-react";
import { Grid } from "@mui/material";
import { Button } from "components/layout";
import { surveySuggestedByOptions } from "constants/survey";
import { useFormikContext } from "formik";
import { EmployeeInterface } from "interfaces/employee-configuration";
import {
  PendingNominationInterface,
  SurveyRespondantInterface,
} from "interfaces/survey";
import React from "react";
import { AddExternalRespondentBox } from "./AddExternalRespondentBox";
import { AddRespondentBox } from "./AddRespondentBox";
import { AddSuggestionRespondent } from "./AddSuggestionRespondent";
import { ApproveRespondent } from "./ApproveRespondent";
import { CommentBox } from "./CommentBox";

const GetAccordionButtons = ({
  rater,
  item,
  onDelete,
}: {
  rater: EmployeeInterface & Partial<SurveyRespondantInterface>;
  item: PendingNominationInterface;
  onDelete: (id: string, is_external?: boolean) => void;
}) => {
  const { values } = useFormikContext<any>();

  // if this user are approved by LM
  if (rater.is_approved_by_line_manager) {
    return (
      <Grid item xs={4} className='flex items-center justify-end'>
        <Button
          variant='text'
          startIcon={<Checkmark />}
          disableElevation
          disableRipple
        >
          Approved
        </Button>
      </Grid>
    );
  }

  // if this user is recipent and its suggestion process
  if (rater.respondant?.last_suggestion) {
    return (
      <Grid item xs={5} className='justify-end flex items-center gap-1'>
        <CommentBox rater={rater} />
        <AddSuggestionRespondent selectedRater={rater} />

        {rater.respondant?.last_suggestion?.suggested_by !==
          surveySuggestedByOptions.EMPLOYEE &&
          values.loggedInUser.id === values.user?.id && (
            <ApproveRespondent
              body={{
                is_external: false,
                alternative:
                  rater?.respondant?.last_suggestion?.alternative_suggestion_id,
              }}
              id={`${rater?.respondant?.id}`}
            />
          )}
        {rater.respondant?.last_suggestion?.suggested_by !==
          surveySuggestedByOptions.LINE_MANAGER &&
          values.loggedInUser.id === values.user?.line_manager_id && (
            <ApproveRespondent
              body={{
                is_external: false,
                alternative:
                  rater?.respondant?.last_suggestion?.alternative_suggestion_id,
              }}
              id={`${rater?.respondant?.id}`}
            />
          )}
      </Grid>
    );
  }

  // if current page is a approval page of line manager
  if (values.is_approval) {
    return (
      <Grid item xs={4} className='flex items-center justify-end'>
        {" "}
        <AddSuggestionRespondent selectedRater={rater} />
        {rater.respondant?.last_suggestion?.suggested_by !==
          surveySuggestedByOptions.LINE_MANAGER && (
          <>
            <span className='border-r-2 py-3 px-2 mr-5'></span>
            <ApproveRespondent
              body={{ is_external: false }}
              id={`${rater?.respondant?.id}`}
            />
          </>
        )}
      </Grid>
    );
  }

  // if its first time of adding respondent
  return (
    <Grid item xs={4} className='flex items-center justify-end'>
      {!rater.is_selected_by_system && !item.is_external && (
        <AddRespondentBox selectedRater={rater} rater={item} />
      )}
      {!rater.is_selected_by_system && item.is_external && (
        <AddExternalRespondentBox rater={item} />
      )}
      <div className='border rounded-xl py-2 mx-3'></div>
      {!rater.is_selected_by_system && (
        <Button
          onClick={() => rater?.id && onDelete(rater?.id)}
          variant='text'
          startIcon={<RowDelete />}
          color='secondary'
        >
          Remove
        </Button>
      )}
    </Grid>
  );
};

export default GetAccordionButtons;
