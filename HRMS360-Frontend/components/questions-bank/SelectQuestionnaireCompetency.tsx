import React from "react";
import { DataGrid, Button } from "components";
import { Tooltip, Box } from "@mui/material";
import {
  GridColumns,
  GridRenderCellParams,
  GridSelectionModel,
  GridValueFormatterParams,
  GRID_CHECKBOX_SELECTION_COL_DEF,
} from "@mui/x-data-grid";
import { useGetAll } from "hooks/useGetAll";
import { useFormikContext } from "formik";
import { getFormattedDate } from "utils/getFormattedDate";
import { toast } from "utils/toaster";
import { QuestionnaireInterface } from "interfaces/questions-bank";

import { InfoIcon } from "utils/Icons";
import { CompetencyInterface } from "interfaces/competency-bank";

interface SelectQuestionnaireCompetencyProps {}

export const selectCompetencyColumns: GridColumns = [
  {
    ...GRID_CHECKBOX_SELECTION_COL_DEF,
    width: 60,
  },
  {
    headerName: "Competencies",
    field: "title",
    flex: 2,
    cellClassName: "text-dark",
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
    flex: 2,
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
    headerName: "Date of creation",
    field: "createdAt",
    flex: 1,
    valueFormatter: ({ value }: GridValueFormatterParams<string>) =>
      getFormattedDate(value),
  },
  {
    headerName: "Source",
    field: "type",
    flex: 1,
    valueFormatter: ({ value }: GridValueFormatterParams<string>) =>
      `${value} competency`,
  },
];

export const SelectQuestionnaireCompetency =
  ({}: SelectQuestionnaireCompetencyProps) => {
    const { data } = useGetAll({
      key: "/competency",
      params: {
        page: 0,
        limit: 25,
      },
      select(data) {
        return {
          rows: data.data.data.rows.filter(
            (item: CompetencyInterface) =>
              item?.no_of_questions && item?.no_of_questions > 0
          ),
          count: data.data.data.count,
        };
      },
    });

    const { setFieldValue, values, submitForm } =
      useFormikContext<QuestionnaireInterface>();

    return (
      <Box className='mt-10'>
        <DataGrid
          columns={selectCompetencyColumns}
          checkboxSelection
          url='/competency'
          onSelectionModelChange={(ids: GridSelectionModel) => {
            setFieldValue(
              "competencies",
              data.rows.filter((item: any) => ids.includes(item.id))
            );
          }}
          rows={data}
          selectionModel={
            values.competencies?.length
              ? values.competencies.map((item) => (item?.id ? item?.id : ""))
              : []
          }
          addButton={
            <Box className='flex justify-end'>
              <Button
                color='secondary'
                className='capitalize px-4 xl:text-sm 2xl:text-semi-base'
                onClick={() => setFieldValue("activeStep", 0)}
              >
                Back
              </Button>
              <Button
                className='capitalize ml-4 px-4 xl:text-sm 2xl:text-semi-base'
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
        />
      </Box>
    );
  };
