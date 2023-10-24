import { GridColumns, GridRenderCellParams } from "@mui/x-data-grid";
import React from "react";
import {
  Button,
  DataGrid,
  DeleteBox,
  PageHeader,
  QontoStepIconRoot,
} from "components";
import { NextPageContext } from "next";
import { DocumentImport } from "@carbon/icons-react";
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepIconProps,
} from "@mui/material";

import { AddEmployeeDialog } from "components/employee-config/AddEmployeeDialog";
import { setApiHeaders } from "utils/setApiHeaders";
import { serverAPI } from "configs/api";
import { EmployeeInterface } from "interfaces/employee-configuration";
import { BaseProps } from "interfaces/base";
import Link from "next/link";
import { colors } from "constants/theme";

export const getServerSideProps = async (ctx: NextPageContext) => {
  setApiHeaders(ctx);
  const res = await serverAPI.get("/user", {
    params: {
      page: 0,
      limit: 25,
    },
  });
  let data: EmployeeInterface[] = res.data.data;
  return {
    props: {
      data,
    },
  };
};

const columns: GridColumns = [
  {
    headerName: "Employee Name",
    field: "name",
    minWidth: 250,
    renderCell: ({ row }: GridRenderCellParams) => (
      <div className="flex flex-col py-4 w-full">
        <p className={`m-0   text-dark`}>{row.name}</p>
        <p className={`m-0 text-main truncate`}>{row?.designation?.name}</p>
      </div>
    ),
  },
  {
    headerName: "Contact Details",
    field: "no_of_questions",
    minWidth: 270,
    renderCell: ({ row }: GridRenderCellParams) => (
      <div className="flex flex-col py-4 w-full">
        <p className={`m-0 text-main truncate font-aller`}>{row.email}</p>
        <p className={`m-0 text-main font-aller`}>{row?.contact}</p>
      </div>
    ),
  },
  {
    headerName: "Department",
    field: "department",
    minWidth: 250,

    renderCell: ({ row }: GridRenderCellParams) => (
      <div className="flex flex-col py-4">
        <p className={`m-0 text-main font-aller `}>{row?.department?.name}</p>
      </div>
    ),
  },
  {
    headerName: "Region",
    field: "region",
    minWidth: 250,
    renderCell: ({ row }: GridRenderCellParams) => (
      <div className="flex flex-col py-4">
        <p className={`m-0 text-main font-aller `}>{row?.region}</p>
      </div>
    ),
  },
  {
    headerName: "Is Line Manager Approval Required",
    field: "is_lm_approval_required",
    minWidth: 250,
    renderCell: ({ value }: GridRenderCellParams) => (
      <div className="flex flex-col py-4">
        <p className={`m-0 text-main font-aller `}>{value ? "Y" : "N"}</p>
      </div>
    ),
  },
  {
    headerName: "Line Manager",
    field: "line_manager_id",
    minWidth: 250,
    renderCell: ({ row }: GridRenderCellParams) => (
      <div className="flex flex-col py-4">
        <p className={`m-0 text-main font-aller `}>
          {row?.line_manager?.name || "-"}
        </p>
      </div>
    ),
  },
  // {
  //   headerName: "Secondary Line Manager",
  //   field: "secondary_line_manager_id",
  //   minWidth: 250,
  //   renderCell: ({ row }: GridRenderCellParams) => (
  //     <div className='flex flex-col py-4'>
  //       <p className={`m-0 text-main font-aller `}>
  //         {row?.secondary_line_manager?.name || "-"}
  //       </p>
  //     </div>
  //   ),
  // },
  {
    headerName: "Action",
    field: "actions",
    minWidth: 300,
    renderCell: ({ row }) => (
      <div className="flex items-center">
        <AddEmployeeDialog isUpdate data={row} />
        {!row.is_tenant_admin && (
          <>
            <div className="border rounded-xl py-2 mx-3"></div>
            <DeleteBox data={row.id} url="/user" title="Employee">
              Do you really want to delete this employee?
            </DeleteBox>
          </>
        )}
      </div>
    ),
  },
];

const EmployeeConfig: BaseProps<EmployeeInterface[]> = ({ data }) => {
  const steps: string[] = [
    "Configure new Departments (if any)",
    "Configure new Designations (if any)",
    "Click ‘Import Excel’",
    "Download Sample File",
    "Update & Import Excel",
  ];

  function QontoStepIcon(props: StepIconProps) {
    const { active, className, icon } = props;
    return (
      <QontoStepIconRoot ownerState={{ active }} className={className}>
        <div
          className="rounded-full flex items-center justify-center century-gothic lg:text-[10px] xl:text-[10px] 2xl:text-xs"
          style={{
            background: colors.secondary.light,
            color: colors.secondary.dark,
            width: "20px",
            height: "20px",
          }}
        >
          {icon}
        </div>
      </QontoStepIconRoot>
    );
  }

  return (
    <>
      <PageHeader title="Employee list" />
      <Typography className="text-dark font-normal century-gothic mb-1 xl:text-[10px] 2xl:text-xs">
        <span className="text-[#F33E05]   xl:text-[10px] 2xl:text-xs">
          NOTE:
        </span>
        Whenever new employee data needs to be added via{" "}
        <strong className="font-bold"> ‘Import Excel’ </strong>option, please
        follow the following steps -
      </Typography>
      <Stepper
        activeStep={-1}
        className="mb-10 bg-[#FEFBF3] p-2 rounded-md border border-[#F7941D4D] "
      >
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel StepIconComponent={QontoStepIcon}>
              <Typography className="text-grid century-gothic  lg:text-[10px] xl:text-[10px] 2xl:text-xs">
                {label}
              </Typography>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
      <DataGrid
        columns={columns}
        rows={data}
        url="/user"
        rowHeight={60}
        addButton={
          <Box className="flex justify-end items-center">
            <Link href={"employee-configuration/import"}>
              <Button
                className="px-4 capitalize h-9"
                variant="outlined"
                startIcon={<DocumentImport size={20} />}
              >
                Import Excel
              </Button>
            </Link>
            <AddEmployeeDialog />
          </Box>
        }
      />
    </>
  );
};

export default EmployeeConfig;
