import React from "react";
import { DataGrid, DeleteBox, PageHeader } from "components/layout";
import { NextPageContext } from "next";
import { GridColumns, GridRenderCellParams } from "@mui/x-data-grid";
import { EmployeeDesignationDialog } from "components/settings/EmployeeDesignationDialog";
import { serverAPI } from "configs/api";
import { setApiHeaders } from "utils/setApiHeaders";
import { EmployeeDesignationInterface } from "interfaces/settings";
import { BaseProps } from "interfaces/base";

export const getServerSideProps = async (ctx: NextPageContext) => {
  setApiHeaders(ctx);
  const res = await serverAPI.get("/setting/designation", {
    params: {
      limit: 24,
      page: 0,
    },
  });
  let data: EmployeeDesignationInterface[] = res.data.data;

  return {
    props: {
      data,
    },
  };
};

const columns: GridColumns = [
  {
    headerName: "Title",
    field: "name",
    flex: 1,
    cellClassName: "text-dark",
  },

  {
    headerName: "Action",
    field: "actions",
    flex: 1,
    renderCell: ({ row }: GridRenderCellParams) => (
      <div className="flex items-center">
        <EmployeeDesignationDialog isUpdate data={row} />
        <div className="border rounded-xl py-2 mx-3"></div>
        <DeleteBox
          title="Delete Employee Designation"
          url="/setting/designation"
          data={row.id}
        >
          Are You sure do you want to delete this Employee Designation?
        </DeleteBox>
      </div>
    ),
  },
];

const EmployeeDesignationConfiguration: BaseProps<
  EmployeeDesignationInterface[]
> = ({ data }) => {
  return (
    <>
      <PageHeader title="Designation Configuration" />
      <DataGrid
        columns={columns}
        rows={data}
        url="/setting/designation"
        addButton={<EmployeeDesignationDialog />}
      />
    </>
  );
};

export default EmployeeDesignationConfiguration;
