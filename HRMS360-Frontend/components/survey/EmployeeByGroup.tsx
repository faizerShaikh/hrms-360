import { Box } from "@mui/material";
import { useFormikContext } from "formik";
import { useGetAll } from "hooks/useGetAll";
import { EmployeeInterface } from "interfaces/employee-configuration";
import { DepartmentInterface } from "interfaces/settings";
import { SelectRecipientsInterfcae } from "interfaces/survey";
import { useCallback } from "react";
import { PrimaryAccordion, Checkbox } from "..";

export interface EmployeeByGroupInterface extends SelectRecipientsInterfcae {
  url: string;
  query?: string;
}

export const EmployeeByGroup = ({
  onChange,
  url,
  query,
}: EmployeeByGroupInterface) => {
  const { values } = useFormikContext<any>();

  const { data } = useGetAll({
    key: "/user/group-by/" + url,
    params: Boolean(query) && {
      query,
    },
  });

  const onEmployeeChange = useCallback(
    (checked: boolean, users: EmployeeInterface[]) => {
      if (checked) {
        onChange(
          checked,
          users.filter(
            (user: EmployeeInterface) => !values.employeeIds.includes(user.id)
          )
        );
      } else {
        onChange(checked, users);
      }
    },
    [values.employeeIds, onChange]
  );

  return (
    <Box className='2xl:h-[380px] xl:h-[380px] lg:h-[280px] overflow-y-auto '>
      {" "}
      {data &&
        data?.map(
          (item: DepartmentInterface & { users: EmployeeInterface[] }) => {
            const empCount = values.employees.filter(
              (user: EmployeeInterface) =>
                user[
                  url === "department" ? "department_id" : "designation_id"
                ] === item.id
            ).length;
            return (
              <PrimaryAccordion
                key={item.id}
                header={
                  <Box className='flex items-center justify-start text-light  xl:text-sm 2xl:text-base h-7'>
                    <Checkbox
                      checkBoxProps={{
                        className: "ml-3",
                        indeterminate:
                          empCount && item.users.length === empCount
                            ? undefined
                            : Boolean(empCount),
                        checked: Boolean(
                          item.users.length && item.users.length === empCount
                        ),
                        onClick: (e) => e.stopPropagation(),
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                          onEmployeeChange(e.target.checked, item.users);
                        },
                      }}
                    />
                    {item.name}
                  </Box>
                }
              >
                <Box className='pl-8'>
                  {item.users.map((user: EmployeeInterface) => (
                    <Box
                      key={user.id}
                      className={`flex items-center justify-start text-light  xl:text-sm 2xl:text-base`}
                    >
                      <Checkbox
                        checkBoxProps={{
                          className: "ml-3",
                          checked: values.employeeIds.includes(user.id),
                          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                            onChange(e.target.checked, user),
                        }}
                      />
                      {user.name}
                    </Box>
                  ))}
                </Box>
              </PrimaryAccordion>
            );
          }
        )}
    </Box>
  );
};
