// import { Box, Tooltip } from "@mui/material";
// import { colors } from "constants/theme";
// import { useFormikContext } from "formik";
// import { EmployeeInterface } from "interfaces/employee-configuration";
// import { SelectRecipientsInterfcae } from "interfaces/survey";
// import { useEffect, useMemo, useState } from "react";
// import { Checkbox } from "..";

// export interface EmployeeByNameInterface extends SelectRecipientsInterfcae {
//   isAfterList?: boolean;
//   query?: string;
//   users: EmployeeInterface[];
// }

// export const EmployeeByName = ({
//   onChange,
//   query,
//   isAfterList = false,
//   users,
// }: EmployeeByNameInterface) => {
//   let [selectedIds, setSelectedIds] = useState<any>([]);
//   const { values } = useFormikContext<any>();

//   let filterdUsers = useMemo(() => {
//     if (query && query.length) {
//       return users.filter((item: EmployeeInterface) =>
//         item?.name?.toLowerCase().match(query.toLowerCase())
//       );
//     } else {
//       return users;
//     }
//   }, [query, users]);

//   useEffect(() => {
//     if (isAfterList) {
//       setSelectedIds(users.map((item: any) => item.id));
//     } else {
//       setSelectedIds([]);
//     }
//   }, [users, isAfterList]);

//   return (
//     <Box className='2xl:h-[380px] xl:h-[380px] lg:h-[280px] overflow-y-auto'>
//       <Box
//         className={`flex items-center justify-start text-[${colors.text.light}] border-b text-light xl:text-sm 2xl:text-base`}
//       >
//         <Checkbox
//           checkBoxProps={{
//             disabled: !filterdUsers.length,
//             className: "ml-3",
//             indeterminate:
//               !isAfterList &&
//               selectedIds.length > 0 &&
//               selectedIds.length !== users.length,
//             checked:
//               selectedIds.length > 0 && selectedIds.length === users.length,
//             onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
//               if (users) {
//                 setSelectedIds(
//                   e.target.checked ? users.map((item) => item.id) : []
//                 );
//                 onChange(e.target.checked, users);
//               }
//             },
//           }}
//         />
//         All
//       </Box>
//       {filterdUsers &&
//         filterdUsers?.map((user: EmployeeInterface) => (
//           <Tooltip
//             key={user.id}
//             followCursor
//             arrow
//             title={
//               !user.line_manager &&
//               "Please assign Line Manager to perform survey"
//             }
//           >
//             <Box
//               key={user.id}
//               className={`flex justify-start items-center flex-row text-dark xl:text-sm 2xl:text-semi-base py-3 ${
//                 !user.line_manager && `opacity-30`
//               } border-b`}
//             >
//               <Checkbox
//                 checkBoxProps={{
//                   className: "ml-3",

//                   disabled: !user.line_manager,
//                   checked: values?.employeeIds?.includes(user?.id),
//                   onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
//                     setSelectedIds((prev: string[]) =>
//                       e.target.checked
//                         ? [...new Set([...prev, user.id])]
//                         : prev.filter((item: string) => item !== user.id)
//                     );
//                     onChange(e.target.checked, user);
//                   },
//                 }}
//               />
//               <div>
//                 <div className='flex items-center justify-start'>
//                   {user.name}{" "}
//                   <span className='text-neutral-500 ml-2'>({user.email})</span>
//                 </div>
//                 <div className='text-neutral-500'>{user.designation?.name}</div>
//               </div>
//             </Box>
//           </Tooltip>
//         ))}
//     </Box>
//   );
// };

import { Box } from "@mui/material";
import { colors } from "constants/theme";
import { useFormikContext } from "formik";
import { useGetAll } from "hooks/useGetAll";
import { EmployeeInterface } from "interfaces/employee-configuration";
import { SelectRecipientsInterfcae } from "interfaces/survey";
import { Checkbox } from "..";

export interface EmployeeByNameInterface extends SelectRecipientsInterfcae {
  isAfterList?: boolean;
  query?: string;
}

export const EmployeeByName = ({
  onChange,
  query,
  isAfterList = false,
}: EmployeeByNameInterface) => {
  const { values } = useFormikContext<any>();
  const { data } = useGetAll({
    key: "/user",
    params: Boolean(query) && {
      search: query,
    },
    select: (data) => {
      return {
        rows: data.data.data.rows,
        count: data.data.data.count,
      };
    },
  });

  let emps = query
    ? values.employees.filter((item: EmployeeInterface) =>
        item?.name?.toLowerCase().match(query.toLowerCase())
      )
    : values.employees;

  return (
    <Box className='2xl:h-[380px] xl:h-[380px] lg:h-[280px] overflow-y-auto'>
      <Box
        className={`flex items-center justify-start text-[${colors.text.light}] border-b text-light xl:text-sm 2xl:text-base`}
      >
        <Checkbox
          checkBoxProps={{
            className: "ml-3",
            disabled: isAfterList && !emps.length,
            checked:
              (isAfterList && values.employeeIds.length) ||
              Boolean(data && values?.employeeIds?.length === data.rows.length),
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
              if (!isAfterList || emps.length)
                onChange(e.target.checked, data.rows);
            },
          }}
        />
        All
      </Box>
      {isAfterList
        ? emps?.map((user: EmployeeInterface) => (
            <Box
              key={user.id}
              className={`flex items-center justify-start text-[${colors.text.light}]  `}
            >
              <Checkbox
                checkBoxProps={{
                  className: "ml-3",
                  defaultChecked: true,
                  checked: values?.employeeIds?.includes(user?.id),
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                    onChange(e.target.checked, user),
                }}
              />
              {user.name}
            </Box>
          ))
        : data &&
          data?.rows?.map(
            (user: EmployeeInterface) =>
              (!user.is_lm_approval_required ||
                (user.is_lm_approval_required && user.line_manager)) && (
                <Box
                  key={user.id}
                  className={`flex items-center justify-start text-dark xl:text-sm 2xl:text-semi-base`}
                >
                  <Checkbox
                    checkBoxProps={{
                      className: "ml-3",
                      checked: values?.employeeIds?.includes(user?.id),
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                        onChange(e.target.checked, user),
                    }}
                  />
                  {user.name}
                </Box>
              )
          )}
    </Box>
  );
};
