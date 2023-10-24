import { Add, Edit } from "@carbon/icons-react";
import { Grid } from "@mui/material";
import { AutoComplete, Button, Dialog, Label } from "components/layout";
import { useFormikContext } from "formik";
import { EmployeeInterface } from "interfaces/employee-configuration";
import {
  PendingNominationInterface,
  SurveyExternalRespondantInterface,
} from "interfaces/survey";
import { useEffect, useState } from "react";
import { VoidFunction } from "types/functionTypes";

export interface AddRespondentBoxProps {
  selectedRater?: EmployeeInterface &
    Partial<SurveyExternalRespondantInterface>;
  rater: PendingNominationInterface;
}

export const AddRespondentBox = ({
  selectedRater,
  rater,
}: AddRespondentBoxProps) => {
  const [user, setUser] = useState<any>("");
  const { values, setFieldValue } = useFormikContext<any>();

  useEffect(() => {
    if (selectedRater) {
      setUser(selectedRater);
    }
  }, [selectedRater]);

  const onChange = (v: any) => {
    setUser(v);
  };

  const onSave = (onClose: VoidFunction) => {
    let userToRemove: string;
    let userIds: Array<string> = [];

    setFieldValue(
      "raters",
      values.raters.map((item: PendingNominationInterface) => {
        if (item.id === rater.id) {
          if (selectedRater) {
            if (selectedRater.id) {
              userToRemove = selectedRater.id;
            }
            if (user) {
              userIds.push(user.id);
              return {
                ...item,
                raters: [
                  ...item.raters.filter((item) => item.id !== selectedRater.id),
                  user,
                ],
              };
            }
            return {
              ...item,
              raters: [
                ...item.raters.filter((item) => item.id !== selectedRater.id),
              ],
              selectedRaters: item.selectedRaters - 1,
            };
          }
          userIds.push(user.id);
          return {
            ...item,
            raters: [...item.raters, user],
            selectedRaters: item.selectedRaters + 1,
          };
        }
        return item;
      })
    );
    userIds = [
      ...userIds,
      ...values.userIds.filter((id: string) => id !== userToRemove),
    ];

    setFieldValue("userIds", userIds);
    onClose();
  };

  return (
    <Dialog
      maxWidth="md"
      button={
        <Button
          variant="text"
          startIcon={selectedRater ? <Edit /> : <Add size={24} />}
          color={"primary"}
          className="capitalize"
        >
          {selectedRater ? "Change" : "Add Respondent"}
        </Button>
      }
      title={
        rater?.category_name
          ? `ADD ${rater?.category_name?.toUpperCase()} `
          : "ADD RESPONDENTS"
      }
    >
      {({ onClose }) => (
        <Grid container spacing={4} className="mt-4 mb-5" alignItems={"center"}>
          <Grid item xs={3}>
            <Label text={"Respondent : "} />
          </Grid>
          <Grid item xs={9}>
            <AutoComplete
              value={user}
              options={
                values?.users.filter(
                  (item: any) => !values.userIds.includes(item.id)
                ) || []
              }
              onChange={(_, v) => onChange(v)}
              getOptionLabel={(option: any) => option.name || option}
            />
          </Grid>

          <Grid item xs={12} className="flex justify-end items-center">
            <Button
              color="secondary"
              className="px-4 capitalize xl:text-sm 2xl:text-base"
              onClick={() => onClose()}
            >
              Close
            </Button>
            <Button
              className="ml-4 px-4 capitalize xl:text-sm 2xl:text-base"
              color="primary"
              onClick={() => onSave(onClose)}
            >
              Save
            </Button>
          </Grid>
        </Grid>
      )}
    </Dialog>
  );
};
