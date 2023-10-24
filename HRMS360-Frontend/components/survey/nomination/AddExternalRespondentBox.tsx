import { Add, Edit } from "@carbon/icons-react";
import { Grid } from "@mui/material";
import { Button, Dialog, Input, Label } from "components/layout";
import { Formik, useFormikContext } from "formik";
import { PendingNominationInterface } from "interfaces/survey";
import { nanoid } from "nanoid";
import { VoidFunction } from "types/functionTypes";
import { toast } from "utils/toaster";
import * as yup from "yup";

export interface AddExternalRespondentBoxProps {
  rater: PendingNominationInterface;
  defaultValue?: {
    id: string;
    respondant_name: string;
    respondant_email: string;
  };
}

const externalRespondentValidations = yup.object({
  respondant_name: yup.string().required("Name is required"),
  respondant_email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email"),
});

export const AddExternalRespondentBox = ({
  rater,
  defaultValue,
}: AddExternalRespondentBoxProps) => {
  const { values, setFieldValue } = useFormikContext<any>();

  const onSave = (value: any, onClose: VoidFunction) => {
    let raters: any = [];

    for (const rtr of values.raters) {
      if (!defaultValue) {
        for (const respondent of rtr.externalRespondents) {
          if (respondent.respondant_email === value.respondant_email) {
            return toast(
              "External Respondent with this email is already nominated!",
              "error"
            );
          }
        }
        if (rtr.id === rater.id) {
          raters.push({
            ...rtr,
            selectedRaters: rtr.selectedRaters + 1,
            externalRespondents: [
              ...rtr.externalRespondents,
              { ...value, id: nanoid() },
            ],
          });
        } else {
          raters.push(rtr);
        }
      } else {
        let respondents: any[] = [];
        for (const respondent of rtr.externalRespondents) {
          if (defaultValue.respondant_email !== value.respondant_email) {
            if (respondent.respondant_email === value.respondant_email) {
              return toast(
                "External Respondent with this email is already nominated!",
                "error"
              );
            }
          }
          if (respondent.id === defaultValue.id) {
            respondents.push({
              id: respondent.id,
              respondant_email: value.respondant_email,
              respondant_name: value.respondant_name,
            });
          } else {
            respondents.push(respondent);
          }
        }

        if (rtr.id === rater.id) {
          raters.push({
            ...rtr,
            externalRespondents: respondents,
          });
        } else {
          raters.push(rtr);
        }
      }
    }
    setFieldValue("raters", raters);
    onClose();
  };

  return (
    <Dialog
      maxWidth='md'
      button={
        <Button
          variant='text'
          startIcon={defaultValue ? <Edit /> : <Add size={24} />}
          className='capitalize'
        >
          {defaultValue ? "Change" : "Add Respondent"}
        </Button>
      }
      title={
        rater?.category_name
          ? `ADD ${rater?.category_name?.toUpperCase()} `
          : "ADD RESPONDENTS"
      }
    >
      {({ onClose }) => (
        <Formik
          initialValues={
            defaultValue
              ? defaultValue
              : { respondant_name: "", respondant_email: "" }
          }
          validationSchema={externalRespondentValidations}
          onSubmit={(values) => onSave(values, onClose)}
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
                <Input label='Name' name='respondant_name' />
              </Grid>
              <Grid item xs={4.5}>
                <Input label='Email' name='respondant_email' />
              </Grid>
              <Grid item xs={12} className='flex justify-end items-center'>
                <Button
                  color='secondary'
                  className='px-4 capitalize xl:text-sm 2xl:text-base'
                >
                  Close
                </Button>
                <Button
                  color='primary'
                  onClick={() => submitForm()}
                  className='ml-4 px-4 capitalize xl:text-sm 2xl:text-base'
                >
                  Save
                </Button>
              </Grid>
            </Grid>
          )}
        </Formik>
      )}
    </Dialog>
  );
};
