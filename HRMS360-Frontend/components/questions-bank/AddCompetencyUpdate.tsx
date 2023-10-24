import { Box, Grid } from "@mui/material";
import { useFormikContext } from "formik";
import { QuestionnaireInterface } from "interfaces/questions-bank";
import { toast } from "utils/toaster";
import { DataGrid, Button } from "..";
import { AddCompetnecyBox } from "./AddCompetnecyBox";
import { selectCompetencyColumns } from "./SelectQuestionnaireCompetency";

export const CompetencyUpdate = () => {
  const { values, submitForm } = useFormikContext<QuestionnaireInterface>();
  return (
    <Grid container spacing={2} className="mt-14">
      <Grid item xs={12}>
        <DataGrid
          addButton={
            <Box className="flex justify-end">
              <AddCompetnecyBox />
              <Button
                className="capitalize ml-4 px-6 xl:text-sm 2xl:text-semi-base"
                onClick={() => {
                  if (values.competencies && !values?.competencies.length) {
                    return toast("Please select atleast 1 competency", "error");
                  }
                  submitForm();
                }}
              >
                Save & Next
              </Button>
            </Box>
          }
          rows={values.competencies || []}
          columns={selectCompetencyColumns}
        />
      </Grid>
    </Grid>
  );
};
