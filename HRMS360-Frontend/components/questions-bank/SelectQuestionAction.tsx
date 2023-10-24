import { RowDelete } from "@carbon/icons-react";
import { Typography } from "@mui/material";
import { GridRenderCellParams } from "@mui/x-data-grid";
import { useFormikContext } from "formik";
import { CompetencyInterface } from "interfaces/competency-bank";
import { QuestionnaireInterface } from "interfaces/questions-bank";
import React from "react";
import { Confirm, Button } from "..";
import { SelectQuestionnaireQuestionsDialog } from "./CompetencyQuestionsDialog";

export const SelectQuestionAction = ({
  row,
}: GridRenderCellParams<CompetencyInterface>) => {
  const { setFieldValue, values } = useFormikContext<QuestionnaireInterface>();

  return (
    <div className="flex items-center">
      <SelectQuestionnaireQuestionsDialog competency={row} />
      <div className="border rounded-xl py-2 mx-3"></div>
      <Confirm
        title={"Delete Competency"}
        submitHandler={() => {
          setFieldValue(
            "competencies",
            values.competencies?.filter((i) => i.id !== row.id)
          );
        }}
        button={
          <Button variant="text" color="secondary" startIcon={<RowDelete />}>
            <Typography className="capitalize xl:text-sm 2xl:text-semi-base">
              Remove
            </Typography>
          </Button>
        }
      >
        Are you sure do you want to delete this competency
      </Confirm>
    </div>
  );
};
