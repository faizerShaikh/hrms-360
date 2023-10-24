import React from "react";
import { DataGrid, Button } from "components";
import { Box } from "@mui/material";
import { GridColumns, GridValueFormatterParams } from "@mui/x-data-grid";
import { useFormikContext } from "formik";
import { QuestionnaireInterface } from "interfaces/questions-bank";
import { SelectQuestionAction } from "./SelectQuestionAction";

const columns: GridColumns = [
  {
    headerName: "Selected Competencies",
    field: "title",
    flex: 1,
    cellClassName: "text-dark",
  },
  {
    headerName: "Available Questions",
    field: "no_of_questions",
    flex: 1,
    cellClassName: "flex justify-center",
  },
  {
    headerName: "Selected Questions",
    field: "selected_questions",
    flex: 1,
    cellClassName: "flex justify-center",
    renderCell: ({ row }) => {
      return <>{row?.questions?.length || 0}</>;
    },
  },
  {
    headerName: "Source",
    field: "type",
    flex: 1,
    valueFormatter: ({ value }: GridValueFormatterParams<string>) =>
      `${value} competency`,
  },
  {
    headerName: "Action",
    field: "Action",
    flex: 2,
    renderCell: SelectQuestionAction,
  },
];

export const SelectQuestionnaireQuestions = ({
  isUpdate,
  isLoading,
}: {
  isLoading?: boolean;
  isUpdate?: boolean;
}) => {
  const { values, submitForm, setFieldValue } = useFormikContext<
    QuestionnaireInterface & { activeStep: number }
  >();

  return (
    <Box className='mt-10'>
      <DataGrid
        columns={columns}
        rows={values?.competencies || []}
        addButton={
          <Box className='flex justify-end'>
            <Button
              color='secondary'
              className='capitalize px-4 xl:text-sm 2xl:text-semi-base'
              onClick={() => {
                setFieldValue("activeStep", values.activeStep - 1);
              }}
            >
              Back
            </Button>
            <Button
              isLoading={isLoading}
              className='capitalize ml-4 px-4 xl:text-sm 2xl:text-semi-base'
              onClick={() => submitForm()}
            >
              {isUpdate ? "Update" : "Create"} Questionnaire
            </Button>
          </Box>
        }
      />
    </Box>
  );
};
