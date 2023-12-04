import React from "react";
import { Button, Input, Label, FormContainer } from "components";
import { Grid } from "@mui/material";
import NextLink from "next/link";
import { useFormikContext } from "formik";
import { SurveyDescriptionInterface } from "interfaces/survey";

interface AddSurveyTitle {
  // errors: any;
  // touched: any;
}

export const AddSurveyTitle = ({}: AddSurveyTitle) => {
  const { submitForm, values } = useFormikContext<SurveyDescriptionInterface>();
  console.log(values);

  return (
    <FormContainer className='mt-14'>
      <Grid
        container
        gap={1}
        className='flex items-start justify-center w-full'
      >
        <Grid item xs={12}>
          <Label text='Add a title to your Survey' />
        </Grid>
        <Grid item xs={12}>
          <Input placeholder='Your title goes here' fullWidth name='title' />
        </Grid>
        <Grid item xs={12} className='mt-7'>
          <Label text='Add a description to the Survey' />
        </Grid>
        <Grid item xs={12}>
          <Input
            multiline
            rows={4}
            placeholder='Description'
            fullWidth
            name='description'
          />
        </Grid>

        <Grid container gap={3.2} className='mt-4'>
          {/* <Grid item xs={5.77}>
            <Input
              label='Respondent Nomination Cut-Off Date'
              type='datetime-local'
              name='respondant_cut_off_date'
              fullWidth
            />
          </Grid>

          <Grid item xs={5.77}>
            <Input
              label='LM Approval Cut-Off Date'
              type='datetime-local'
              name='lm_approval_cut_off_date'
            />
          </Grid> */}
          <Grid item xs={12}>
            <Input
              label='Survey End Date'
              type='datetime-local'
              name='end_date'
              fullWidth
            />
          </Grid>
        </Grid>
        <Grid
          item
          xs={12}
          className='flex items-center justify-center mt-5'
          gap={2}
        >
          <NextLink href='/survey'>
            <Button
              className='px-4 capitalize xl:text-sm 2xl:text-semi-base'
              color='secondary'
            >
              Discard
            </Button>
          </NextLink>
          <Button
            className='px-4 capitalize xl:text-sm 2xl:text-semi-base'
            onClick={() => submitForm()}
          >
            Save & Next
          </Button>
        </Grid>
      </Grid>
    </FormContainer>
  );
};
