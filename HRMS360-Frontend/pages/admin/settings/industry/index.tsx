import { DataGrid, DeleteBox, PageHeader } from "components/layout";
import { NextPageContext } from "next";
import React from "react";
import { GridColumns, GridRenderCellParams } from "@mui/x-data-grid";

import { serverAPI } from "configs/api";
import { setApiHeaders } from "utils/setApiHeaders";
import { BaseProps } from "interfaces/base";
import { IndustryInterface } from "interfaces/settings";
import { IndustryDialog } from "components/settings/IndustryDialog";

export const getServerSideProps = async (ctx: NextPageContext) => {
  setApiHeaders(ctx);
  const res = await serverAPI.get("/setting/industry", {
    params: {
      page: 0,
      limit: 25,
    },
  });

  let data: IndustryInterface[] = res.data.data;
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
      <div className='flex items-center'>
        <IndustryDialog isUpdate data={row} />
        <div className='border rounded-xl py-2 mx-3'></div>
        <DeleteBox title='Industry' url='/setting/industry' data={row.id}>
          Are You sure do you want to delete this Industry?
        </DeleteBox>
      </div>
    ),
  },
];

const IndustryConfiguration: BaseProps<IndustryInterface[]> = ({ data }) => {
  return (
    <>
      <PageHeader title='Industry Configuration' />
      <DataGrid
        columns={columns}
        rows={data}
        url='/setting/industry'
        addButton={<IndustryDialog />}
      />
    </>
  );
};

export default IndustryConfiguration;
