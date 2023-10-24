import { Checkmark, RowDelete } from "@carbon/icons-react";
import { Grid } from "@mui/material";
import { Button } from "components/layout";
import { surveySuggestedByOptions } from "constants/survey";
import { useFormikContext } from "formik";
import {
  PendingNominationInterface,
  SurveyExternalRespondantInterface,
} from "interfaces/survey";
import { AddExternalRespondentBox } from "./AddExternalRespondentBox";
import { AddExternalRespondentSuggestionBox } from "./AddExternalRespondentSuggestionBox";
import { ApproveRespondent } from "./ApproveRespondent";
import { CommentBox } from "./CommentBox";

export interface ExternalRespondentButtonsProps {
  rater: SurveyExternalRespondantInterface;
  onDelete: (id: string, is_external: boolean) => void;
  item: PendingNominationInterface;
}

const ExternalRespondentButtons = ({
  rater,
  onDelete,
  item,
}: ExternalRespondentButtonsProps) => {
  const { values } = useFormikContext<any>();

  if (rater.is_approved_by_line_manager) {
    return (
      <Grid
        item
        xs={rater?.last_suggestion ? 5 : 4}
        className='flex justify-end'
      >
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
  if (rater?.last_suggestion) {
    return (
      <Grid item xs={3} className='flex items-center justify-end'>
        <CommentBox rater={rater} />
        <span className='border-r-2 py-3 px-2 mr-5'></span>
        {!rater.logs
          .map((item) => item.suggested_by)
          .includes(surveySuggestedByOptions.LINE_MANAGER) ||
          (!rater.logs
            .map((item) => item.suggested_by)
            .includes(surveySuggestedByOptions.EMPLOYEE) && (
            <AddExternalRespondentSuggestionBox
              rater={item}
              defaultValue={rater}
            />
          ))}

        {rater?.last_suggestion?.suggested_by !==
          surveySuggestedByOptions.EMPLOYEE &&
          values.loggedInUser.id === values.user?.id && (
            <>
              {" "}
              <span className='border-r-2 py-3 px-2 mr-5'></span>
              <ApproveRespondent
                body={{
                  is_external: true,
                  alternative_email: rater?.last_suggestion?.alternative_email,
                  alternative_name: rater?.last_suggestion?.alternative_name,
                }}
                id={`${rater?.id}`}
              />
            </>
          )}
        {rater?.last_suggestion?.suggested_by !==
          surveySuggestedByOptions.LINE_MANAGER &&
          values.loggedInUser.id === values.user?.line_manager_id && (
            <>
              {" "}
              <span className='border-r-2 py-3 px-2 mr-5'></span>
              <ApproveRespondent
                body={{
                  is_external: true,
                  alternative_email: rater?.last_suggestion?.alternative_email,
                  alternative_name: rater?.last_suggestion?.alternative_name,
                }}
                id={`${rater?.id}`}
              />
            </>
          )}
      </Grid>
    );
  }

  if (values.is_approval) {
    return (
      <Grid
        item
        xs={rater?.last_suggestion ? 5 : 4}
        className='flex justify-end items-center'
      >
        <AddExternalRespondentSuggestionBox rater={item} defaultValue={rater} />
        {rater?.last_suggestion?.suggested_by !==
          surveySuggestedByOptions.LINE_MANAGER && (
          <>
            <span className='border-r-2 py-3 px-2 mr-5'></span>
            <ApproveRespondent
              body={{ is_external: true }}
              id={`${rater.id}`}
            />
          </>
        )}
      </Grid>
    );
  }

  return (
    <Grid
      item
      xs={rater?.last_suggestion ? 5 : 4}
      className='flex justify-end items-center'
    >
      <AddExternalRespondentBox
        rater={item}
        defaultValue={{
          id: `${rater.id}`,
          respondant_email: rater.respondant_email,
          respondant_name: rater.respondant_name,
        }}
      />
      <div className='border rounded-xl py-2 mx-3'></div>
      <Button
        onClick={() => rater?.id && onDelete(rater?.id, true)}
        variant='text'
        startIcon={<RowDelete />}
        color='secondary'
      >
        Remove
      </Button>
    </Grid>
  );
};

export default ExternalRespondentButtons;
