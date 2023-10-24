import { AutoComplete, Button, DataGrid } from "components/layout";
import { GridColumns } from "@mui/x-data-grid";

import { Formik, FormikHelpers, useFormikContext } from "formik";
import * as yup from "yup";
//import { useGetAll } from "hooks/useGetAll";
import { toast } from "utils/toaster";
import { Box, Checkbox, Stack, Typography } from "@mui/material";
import { colors } from "constants/theme";
import { useCreateOrUpdate } from "hooks/useCreateOrUpdate";
import { useRouter } from "next/router";
import { memo, useCallback, useState } from "react";
import { useGetAll } from "hooks/useGetAll";

interface initialValuesType {
  data: any[];
}

const validations = yup.object({});

const LineManagerField = memo(({ userData, row, isChecked }: any) => {
  const { setFieldValue, values } = useFormikContext<any>();

  const { data } = useGetAll({
    key: "/user",
  });

  const onChange = useCallback(
    (_: any, v: any) => {
      setFieldValue(
        "data",
        values.data.map((item: any) => {
          if (item.id === row.id) {
            let newData = { ...item, line_manager_id: v };

            if (item.id === v?.id) {
              toast(
                "User cannot be a line manager to himself/herself, please select a different person",
                "error"
              );
              return item;
            }
            return newData;
          }
          return item;
        })
      );
    },
    [values.data, row.id, setFieldValue]
  );

  return (
    <AutoComplete
      name='line_manager'
      onChange={onChange}
      value={row?.line_manager_id || ""}
      //options={data ? [...data.rows, ...userData] : userData}
      options={isChecked ? [...data.rows, ...userData] : userData}
      getOptionLabel={(option: any) => option?.name || option}
      renderOption={(options, row) => (
        <li {...options}>
          <div className={`px-2 cursor-pointer`}>
            <div className='text-fc-dark'>{row.name}</div>
            <div className='text-fc-main'>{row.email}</div>
          </div>
        </li>
      )}
    />
  );
});

LineManagerField.displayName = "LineManagerField";

export const AssignLineManager = ({
  setActiveStep,
  users,
}: {
  setActiveStep: any;
  users: any;
}) => {
  const [isChecked, setIsChecked] = useState<boolean>(false);

  const { push } = useRouter();

  const columns: GridColumns = [
    {
      headerName: "Employee Name",
      field: "name",
      minWidth: 200,
      renderCell({ row }) {
        return (
          <Stack direction={"column"}>
            <Typography fontSize={12}>{row.name}</Typography>
            <Typography color={colors.text.main} fontSize={12}>
              {row.designation_name}
            </Typography>
          </Stack>
        );
      },
    },
    {
      headerName: "Contact Details",
      field: "email",
      minWidth: 250,
      renderCell({ row }) {
        return (
          <Stack direction={"column"}>
            <Typography fontSize={12}>{row.email}</Typography>
            <Typography color={colors.text.main} fontSize={12}>
              {row.contact}
            </Typography>
          </Stack>
        );
      },
    },
    {
      headerName: "Department Name",
      field: "department_name",
      minWidth: 200,
    },
    {
      headerName: "Line Manager",
      field: "line_manager",
      minWidth: 300,
      renderCell(params) {
        return (
          <LineManagerField
            {...params}
            userData={users}
            isChecked={isChecked}
          />
        );
      },
    },
    {
      headerName: "Region",
      field: "region",
      minWidth: 200,
    },
  ];

  const assignLineManager = (
    values: initialValuesType,
    { resetForm }: FormikHelpers<initialValuesType>
  ) => {
    let assignData = values.data.map((e: any) => {
      return {
        ...e,
        line_manager_id: e.line_manager_id,
        secondary_line_manager_id: e.secondary_line_manager_id ?? null,
      };
    });

    mutate(assignData, {
      onSuccess: resetForm,
    });
  };

  const { mutate, isLoading } = useCreateOrUpdate({
    url: "/user/import",
    onSuccess: async () => {
      toast("Users Imported successfully");
      push("/employee-configuration/");
    },
  });

  return (
    <>
      <Formik
        initialValues={{ data: users }}
        validationSchema={validations}
        onSubmit={assignLineManager}
      >
        {({ values, submitForm }) => (
          <>
            <DataGrid
              rows={values.data || []}
              columns={columns}
              noSearch={true}
              addButton={
                <div className='flex mt-5 justify-between items-center w-full'>
                  <Box className='mt-2 flex items-center'>
                    <Checkbox
                      onChange={(e) => {
                        setIsChecked(e.target.checked);
                      }}
                      className='border-main'
                    />
                    <Typography className='text-dark xl:text-sm 2xl:text-semi-base'>
                      Upload previous data
                    </Typography>
                  </Box>
                  <div>
                    <Button
                      variant='contained'
                      className='capitalize'
                      color='secondary'
                      onClick={() => {
                        setActiveStep((prev: number) => prev - 1);
                      }}
                    >
                      Back
                    </Button>
                    <Button
                      className='ml-4 capitalize'
                      isLoading={isLoading}
                      onClick={() => submitForm()}
                      disabled={values.data.some(
                        (e: any) => !e.line_manager_id
                      )}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              }
            />
          </>
        )}
      </Formik>
    </>
  );
};
