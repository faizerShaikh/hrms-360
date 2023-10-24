import React from "react";
import { DataGrid, DeleteBox, PageHeader } from "components/layout";
import { NextPageContext } from "next";
import { GridColumns, GridRenderCellParams } from "@mui/x-data-grid";
import { Switch } from "@mui/material";
import { RaterCategoryDialog } from "components/settings/RaterCategoryDialog";
import { setApiHeaders } from "utils/setApiHeaders";
import { serverAPI } from "configs/api";
import { RaterInterface } from "interfaces/settings";
import { BaseProps } from "interfaces/base";

export const getServerSideProps = async (ctx: NextPageContext) => {
  setApiHeaders(ctx);
  const res = await serverAPI.get("/setting/rater", {
    params: {
      page: 0,
      limit: 25,
    },
  });
  const data: RaterInterface[] = res.data.data;
  return {
    props: {
      data,
    },
  };
};

const columns: GridColumns<RaterInterface> = [
  {
    headerName: "Raters Category",
    field: "category_name",
    flex: 1,
    cellClassName: "text-dark",
  },
  {
    headerName: "No. of Raters",
    field: "no_of_raters",
    flex: 1,
    align: "center",
    headerAlign: "center",
  },
  {
    headerName: "Mandatory Field",
    field: "is_required",
    flex: 1,
    renderCell: ({ row }: GridRenderCellParams) => (
      <Switch checked={row.is_required} disabled />
    ),
  },
  {
    headerName: "Is external",
    field: "is_external",
    flex: 1,
    renderCell: ({ row }: GridRenderCellParams) => (
      <Switch checked={row.is_external} disabled />
    ),
  },
  {
    headerName: "Action",
    field: "actions",
    flex: 1,
    minWidth: 250,
    renderCell: ({ row }) => (
      <div className='flex items-center '>
        <RaterCategoryDialog isUpdate data={row} />

        {row.can_be_deleted && (
          <>
            {" "}
            <div className='border rounded-xl py-2 mx-3'></div>
            <DeleteBox title='Delete Rater' url='/setting/rater' data={row.id}>
              Are You sure do you want to delete this rater?
            </DeleteBox>
          </>
        )}
      </div>
    ),
  },
];

const RaterConfiguration: BaseProps<RaterInterface[]> = ({ data }) => {
  return (
    <>
      <PageHeader title='raters configuration' />
      <DataGrid
        columns={columns}
        rows={data}
        url='/setting/rater'
        addButton={<RaterCategoryDialog />}
      />
    </>
  );
};

export default RaterConfiguration;
