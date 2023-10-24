import { Grid } from "@mui/material";
import { AutoComplete, Button, Dialog, Label } from "components/layout";

import { useGetAll } from "hooks/useGetAll";

export const AssessmentSurveyDialog = ({
  setSurvey,
  selectedSurvey,
}: {
  setSurvey: (params: any) => any;
  selectedSurvey: any;
}) => {
  const { data: surveys, refetch } = useGetAll({
    key: `/survey`,
    params: {
      search: "Ongoing",
    },
    onSuccess(data) {
      setSurvey(data.rows[0]);
    },
  });

  return (
    <>
      <Dialog
        buttonOnClick={refetch}
        button={
          <Button
            variant='text'
            className='underline capitalize    xl:text-xs 2xl:text-semi-base '
          >
            Change Selection
          </Button>
        }
        title={"Select Survey"}
      >
        {({ onClose }) => (
          <>
            <Label className='py-3' text='Select Survey' />
            <AutoComplete
              options={surveys?.rows || []}
              onChange={(_, value: any) => {
                setSurvey(value);
              }}
              getOptionLabel={(option: any) => option.title || ""}
              className='pb-4'
              value={selectedSurvey}
            />
            <Grid container justifyContent={"end"} className='mt-4'>
              <Grid item>
                <Button
                  color='secondary'
                  variant='contained'
                  className='mr-4 capitalize'
                  onClick={() => onClose()}
                >
                  Discard
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant='contained'
                  className='mr-2 capitalize'
                  onClick={() => onClose()}
                >
                  Select
                </Button>
              </Grid>
            </Grid>
          </>
        )}
      </Dialog>
    </>
  );
};
