import React from "react";
import { Button, Input, Label, FormContainer } from "components";
import { Grid } from "@mui/material";
import NextLink from "next/link";
import { useFormikContext } from "formik";

interface AddQuestionnaireTitleProps {}

export const AddQuestionnaireTitle = ({}: AddQuestionnaireTitleProps) => {
  const { submitForm } = useFormikContext();

  return (
    <FormContainer className="mt-10">
      <Grid
        container
        gap={1}
        className="flex items-start justify-center w-full"
      >
        <Grid item xs={12}>
          <Label text="Add a title to your Questionnaire" />
        </Grid>
        <Grid item xs={12}>
          <Input placeholder="Your title goes here" fullWidth name="title" />
        </Grid>
        <Grid item xs={12} className="mt-7">
          <Label text="Add a description to the Questionnaire" />
        </Grid>
        <Grid item xs={12}>
          <Input
            multiline
            rows={4}
            placeholder="Description"
            fullWidth
            name="description"
          />
        </Grid>
        <Grid item xs={12} className="flex items-center justify-center mt-7">
          <NextLink href="/questions-bank" passHref>
            <a>
              <Button
                className="capitalize px-4 xl:text-sm 2xl:text-semi-base"
                color="secondary"
              >
                Discard
              </Button>
            </a>
          </NextLink>
          <Button
            className="ml-4 capitalize px-4 xl:text-sm 2xl:text-semi-base"
            onClick={() => {
              submitForm();
            }}
          >
            Save & Next
          </Button>
        </Grid>
      </Grid>
    </FormContainer>
  );
};
