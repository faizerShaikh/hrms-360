import { View } from "@carbon/icons-react";
import { Box, Grid } from "@mui/material";
import { Button, Dialog, Label } from "components/layout";
import { useGetAll } from "hooks/useGetAll";
import { EmployeeInterface } from "interfaces/employee-configuration";
import {
  SurveyApprovalRejectionLogs,
  SurveyExternalRespondantInterface,
  SurveyRespondantInterface,
} from "interfaces/survey";
import React from "react";

interface CommentBoxProps {
  rater:
    | (EmployeeInterface & Partial<SurveyRespondantInterface>)
    | SurveyExternalRespondantInterface;
}
export const CommentBox = ({ rater }: CommentBoxProps) => {
  const { data, refetch } = useGetAll({
    key: `/survey/comments/${
      "respondant" in rater ? rater?.respondant?.id : rater?.id
    }`,
    enabled: false,
  });

  return (
    <Dialog
      title='Comments'
      buttonOnClick={() => refetch()}
      button={
        <Button startIcon={<View />} variant='text'>
          View Comments
        </Button>
      }
    >
      {({ onClose }) => (
        <Grid container className='pt-7'>
          <Grid item xs={12}>
            <Label
              text='Last Suggestion : '
              className='mr-2 mb-4'
              colorClass='text-primary'
            />
          </Grid>
          <Grid item xs={12} className='border-l-2 py-2 px-2'>
            <Box className='flex justify-between border-b pb-2'>
              <Box className='flex justify-start w-1/2'>
                <Label
                  text='Name : '
                  className='mr-2'
                  colorClass='text-secondary'
                />
                <p className='truncate my-0'>
                  {"respondant" in rater
                    ? rater.respondant?.last_suggestion?.user?.name
                    : rater.last_suggestion?.alternative_name}
                </p>
              </Box>
              <Box className='flex justify-start w-1/2'>
                <Label
                  text='Email : '
                  className='mr-2'
                  colorClass='text-secondary'
                />
                <p className='truncate my-0'>
                  {"respondant" in rater
                    ? rater.respondant?.last_suggestion?.user?.email
                    : rater.last_suggestion?.alternative_email}
                </p>
              </Box>
            </Box>
            <Box className='flex justify-start mt-2'>
              {" "}
              <Label
                text='Comments : '
                className='mr-2'
                colorClass='text-secondary'
              />
              <p className='truncate my-0'>
                {" "}
                {"respondant" in rater
                  ? rater.respondant?.last_suggestion?.comments
                  : rater.last_suggestion?.comments}
              </p>
            </Box>
          </Grid>

          <Grid item xs={12} className='mt-4'>
            <Label
              text='All Suggestions : '
              className='mr-2 mb-2'
              colorClass='text-primary'
            />
          </Grid>

          {data &&
            data.map(
              (item: SurveyApprovalRejectionLogs) =>
                item.id !== rater?.last_suggestion?.id && (
                  <Grid
                    key={item.id}
                    item
                    xs={12}
                    className='border-l-2 py-2 px-2 mt-2'
                  >
                    <Box className='flex justify-between border-b pb-2'>
                      <Box className='flex justify-start w-1/2'>
                        <Label
                          text='Email : '
                          className='mr-2'
                          colorClass='text-secondary'
                        />
                        <p className='truncate my-0'>
                          {item.alternative_email || item?.user?.email}
                        </p>
                      </Box>
                      <Box className='flex justify-start w-1/2'>
                        <Label
                          text='Name : '
                          className='mr-2'
                          colorClass='text-secondary'
                        />
                        <p className='truncate my-0'>
                          {item.alternative_email || item?.user?.name}
                        </p>
                      </Box>
                    </Box>
                    <Box className='flex justify-start  mt-2'>
                      <Label
                        text='Comments : '
                        className='mr-2'
                        colorClass='text-secondary'
                      />
                      <p className='truncate my-0'>{item?.comments}</p>
                    </Box>
                  </Grid>
                )
            )}

          <Grid item xs={12} className='flex justify-end mt-4'>
            <Button onClick={onClose} color='secondary'>
              Close
            </Button>
          </Grid>
        </Grid>
      )}
    </Dialog>
  );
};
