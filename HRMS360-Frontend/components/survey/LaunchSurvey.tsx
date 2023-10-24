import React from "react";
import { DataGrid, Button } from "components";
import { RowDelete } from "@carbon/icons-react";
import { Box } from "@mui/material";
import {
  GridColumns,
  GridRenderCellParams,
  GridSelectionModel,
  GRID_CHECKBOX_SELECTION_COL_DEF,
} from "@mui/x-data-grid";
import { useFormikContext } from "formik";
import { EmployeeInterface } from "interfaces/employee-configuration";
import { SurveyDescriptionInterface } from "interfaces/survey";

const LaunchSurveyAction = ({ row }: GridRenderCellParams) => {
  const { setFieldValue, values } = useFormikContext<any>();
  return (
    <Button
      variant='text'
      startIcon={<RowDelete />}
      color={"secondary"}
      onClick={() => {
        setFieldValue(
          "employees",
          values.employees.filter(
            (item: EmployeeInterface) => item.id !== row.id
          )
        );
        setFieldValue(
          "employeeIds",
          values?.employeeIds.filter((item: string) => item !== row.id)
        );
      }}
    >
      Remove
    </Button>
  );
};
const columns: GridColumns = [
  {
    ...GRID_CHECKBOX_SELECTION_COL_DEF,
    width: 60,
    minWidth: 60,
  },
  {
    headerName: "Employee Name",
    field: "title",
    width: 200,
    minWidth: 200,
    renderCell: ({ row }: GridRenderCellParams) => (
      <div className='flex flex-col py-4 w-full'>
        <p className={`m-0 xl:test-sm 2xl:text-semi-base text-dark truncate`}>
          {row?.name}
        </p>
        <p className={`m-0 xl:test-sm 2xl:text-semi-base text-main truncate`}>
          {row?.designation?.name}
        </p>
      </div>
    ),
  },
  {
    headerName: "Contact Details",
    field: "no_of_questions",
    width: 250,
    minWidth: 250,
    renderCell: ({ row }: GridRenderCellParams) => (
      <div className='flex flex-col py-4 w-full'>
        <p className={`m-0  text-main xl:test-sm 2xl:text-semi-base truncate`}>
          {row?.email}
        </p>
        <p className={`m-0  text-main xl:test-sm 2xl:text-semi-base`}>
          {row?.contact}
        </p>
      </div>
    ),
  },
  {
    headerName: "Department",
    field: "department",
    width: 200,
    minWidth: 200,
    valueGetter(params) {
      return params?.value?.name;
    },
  },
  {
    headerName: "Region",
    field: "region",
    minWidth: 200,
  },
  {
    headerName: "Line Manager",
    field: "line_manager",
    minWidth: 300,
    renderCell: ({ row }: GridRenderCellParams) => (
      <div className='flex flex-col py-4 w-full'>
        <p className={`m-0  text-main xl:test-sm 2xl:text-semi-base truncate`}>
          {row?.line_manager?.name}
        </p>
        <p className={`m-0  text-main xl:test-sm 2xl:text-semi-base truncate`}>
          {row?.line_manager?.email}
        </p>
      </div>
    ),
  },
  {
    headerName: "Action",
    field: "actions",
    minWidth: 150,
    renderCell: LaunchSurveyAction,
  },
];

interface launchServeyProps {
  goBack: VoidFunction;
  isLoading?: boolean;
}

export const LaunchSurvey = ({ goBack, isLoading }: launchServeyProps) => {
  const { values, setFieldValue, submitForm } =
    useFormikContext<SurveyDescriptionInterface>();

  return (
    <Box className='mt-16'>
      <DataGrid
        checkboxSelection
        columns={columns}
        rows={values.employees || []}
        rowHeight={60}
        selectionModel={values?.employeeIds || []}
        onSelectionModelChange={(ids: GridSelectionModel) => {
          setFieldValue("employeeIds", ids);
        }}
        addButton={
          <Box className='flex justify-end'>
            <Button
              onClick={() => {
                goBack();
              }}
              color='secondary'
              className='px-4 capitalize xl:text-sm 2xl:text-semi-base'
              variant='contained'
            >
              Discard
            </Button>
            <Button
              variant='contained'
              className='capitalize ml-4 px-4 xl:text-sm 2xl:text-semi-base'
              isLoading={isLoading}
              onClick={() => submitForm()}
            >
              Launch Survey
            </Button>
          </Box>
        }
      />
    </Box>
  );
};
