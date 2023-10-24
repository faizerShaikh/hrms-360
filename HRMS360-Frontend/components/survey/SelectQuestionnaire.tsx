import React from "react";
import { DataGrid, Button } from "components";
import { Box, Radio, Tooltip } from "@mui/material";
import { GridColumns, GridRenderCellParams } from "@mui/x-data-grid";
import { VoidFunction } from "types/functionTypes";
import { useGetAll } from "hooks/useGetAll";
import { useFormikContext } from "formik";
import { toast } from "utils/toaster";
import { getFormattedDate } from "utils/getFormattedDate";
import QuestionnaireDetailBox from "components/questions-bank/QuestionnaireDetailBox";
import { SurveyDescriptionInterface } from "interfaces/survey";
import { InfoIcon } from "utils/Icons";

interface SelectQuestionnaireProps {
  goBack: VoidFunction;
}

const QuestionnaireTitle = ({ row }: GridRenderCellParams) => {
  const { values } = useFormikContext<any>();
  return (
    <div className='flex justify-left items-center w-full pr-3'>
      <span className='mr-2'>
        <Radio checked={values.questionnaire_id === row.id} />
      </span>{" "}
      <Tooltip arrow title={row.title}>
        <p className='break-all truncate text-dark'>{row.title}</p>
      </Tooltip>
    </div>
  );
};

const columns: GridColumns = [
  {
    headerName: "Questionnaire",
    field: "title",
    flex: 2,
    cellClassName: "text-dark",
    renderCell: QuestionnaireTitle,
  },
  {
    headerName: "No. of Questions",
    field: "no_of_questions",
    flex: 1,
    align: "center",
    headerAlign: "center",
  },
  {
    headerName: "Description",
    field: "description",
    flex: 3,
    renderCell: ({ row }: GridRenderCellParams) => (
      <div className='flex justify-left items-center w-full pr-3'>
        <Tooltip arrow title={row.description}>
          <span className='mr-2'>
            {" "}
            <InfoIcon className='my-auto block' />
          </span>
        </Tooltip>
        <p className='break-all truncate text-main'>{row.description}</p>
      </div>
    ),
  },
  {
    headerName: "Date",
    field: "createdAt",
    flex: 1,
    type: "date",
    valueGetter(param) {
      return getFormattedDate(param.value);
    },
  },
  {
    headerName: "Action",
    field: "actions",
    flex: 1,
    renderCell: ({ row }: GridRenderCellParams) => (
      <QuestionnaireDetailBox id={row.id} />
    ),
  },
];

export const SelectQuestionnaire = ({ goBack }: SelectQuestionnaireProps) => {
  const { data } = useGetAll({ key: "/questionnaire" });
  const { values, setFieldValue, submitForm } =
    useFormikContext<SurveyDescriptionInterface>();
  return (
    <Box className='mt-16'>
      <DataGrid
        columns={columns}
        rows={data || []}
        onRowClick={(params: any) => {
          if (values.questionnaire_id !== params.id) {
            setFieldValue("questionnaire_id", params.id);
          } else {
            setFieldValue("questionnaire_id", "");
          }
        }}
        addButton={
          <Box className='flex justify-end'>
            <Button
              color='secondary'
              className='px-4 capitalize xl:text-sm 2xl:text-semi-base'
              variant='contained'
              onClick={() => {
                goBack();
              }}
            >
              Back
            </Button>
            <Button
              variant='contained'
              className='capitalize ml-4 px-4 xl:text-sm 2xl:text-semi-base'
              onClick={() => {
                if (!values.questionnaire_id) {
                  return toast(
                    "Please select at least one questionnaire",
                    "error"
                  );
                }
                submitForm();
              }}
            >
              Save & Next
            </Button>
          </Box>
        }
      />
    </Box>
  );
};
