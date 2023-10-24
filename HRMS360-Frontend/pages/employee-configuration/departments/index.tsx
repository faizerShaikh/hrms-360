import { DataGrid, DeleteBox, PageHeader } from "components/layout";
import { NextPageContext } from "next";
import React from "react";
import { GridColumns } from "@mui/x-data-grid";

import { setApiHeaders } from "utils/setApiHeaders";
import { DepartmentInterface } from "interfaces/settings";
import { serverAPI } from "configs/api";
import { BaseProps } from "interfaces/base";
import { DepartmentDialog } from "components/settings";

export const getServerSideProps = async (ctx: NextPageContext) => {
  setApiHeaders(ctx);
  const res = await serverAPI.get("/setting/department", {
    params: {
      page: 0,
      limit: 25,
    },
  });
  const data: DepartmentInterface[] = res.data.data;
  return {
    props: {
      data,
    },
  };
};

const columns: GridColumns<DepartmentInterface> = [
  {
    headerName: "Department Name",
    field: "name",
    flex: 1,
    cellClassName: "text-dark",
  },

  {
    headerName: "Action",
    field: "actions",
    flex: 1,
    renderCell: ({ row }) => (
      <div className="flex items-center">
        <DepartmentDialog isUpdate data={row} />
        <div className="border rounded-xl py-2 mx-3"></div>
        <DeleteBox data={row.id} url="/setting/department" title="Department">
          Are You sure do you want to delete this department?
        </DeleteBox>
      </div>
    ),
  },
];

const DepartmentConfiguration: BaseProps<DepartmentInterface[]> = ({
  data,
}) => {
  return (
    <>
      <PageHeader title="Departments configuration" />
      <DataGrid
        columns={columns}
        rows={data}
        url="/setting/department"
        addButton={<DepartmentDialog />}
      />
    </>
  );
};

export default DepartmentConfiguration;
