import React from "react";
import { Grid } from "@mui/material";
import {
  Transferlist,
  Tabs,
  EmployeeByName,
  EmployeeByGroup,
  Button,
} from "..";
import { useFormikContext } from "formik";
import { EmployeeInterface } from "interfaces/employee-configuration";
import { toast } from "utils/toaster";

interface SelectRecipientsProps {
  goBack: VoidFunction;
}

export const SelectRecipients = ({ goBack }: SelectRecipientsProps) => {
  const { values, setFieldValue, submitForm } = useFormikContext<any>();

  const onChange = (
    checked: boolean,
    emp: EmployeeInterface | EmployeeInterface[]
  ) => {
    if (checked) {
      setFieldValue(
        "employees",
        Array.isArray(emp)
          ? [...new Set([...values.employees, ...emp])]
          : [...new Set([...values.employees, emp])]
      );
      setFieldValue(
        "employeeIds",
        Array.isArray(emp)
          ? [...new Set([...values.employeeIds, ...emp.map((item) => item.id)])]
          : [...new Set([...values.employeeIds, emp.id])]
      );
    } else {
      let emps = Array.isArray(emp) ? emp.map((item) => item.id) : [emp.id];
      setFieldValue(
        "employees",
        values.employees.filter(
          (item: EmployeeInterface) => !emps.includes(item.id)
        )
      );
      setFieldValue(
        "employeeIds",
        values.employeeIds.filter((item: string) => !emps.includes(item))
      );
    }
  };

  return (
    <Grid
      container
      spacing={4}
      className='mt-4 2xl:h-[600px] xl:h-[600px] lg:h-[500px]'
    >
      <Grid item xs={6} className='h-full'>
        <Transferlist header='Available Employees'>
          <Tabs
            tabs={[
              {
                id: 0,
                buttonLabel: "By Department",
                component: (
                  <EmployeeByGroup onChange={onChange} url={"department"} />
                ),
              },
              {
                id: 1,
                buttonLabel: "By Designation",
                component: (
                  <EmployeeByGroup onChange={onChange} url={"designation"} />
                ),
              },
              {
                id: 2,
                buttonLabel: "By Employee Name",
                component: <EmployeeByName onChange={onChange} />,
              },
            ]}
          />
        </Transferlist>
      </Grid>

      <Grid item xs={6} className='h-full'>
        <Transferlist header='Selected Employees'>
          <EmployeeByName onChange={onChange} isAfterList />
        </Transferlist>
      </Grid>
      <Grid item xs={12} className='pb-5 flex justify-end'>
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
            if (!values.employees.length) {
              return toast("Please select atleast one employee", "error");
            }
            submitForm();
          }}
        >
          Save & Next
        </Button>
      </Grid>
    </Grid>
  );
};
