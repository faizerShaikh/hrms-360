import { DataGrid, DeleteBox, PageHeader } from "components/layout";
import { NextPageContext } from "next";
import React from "react";
import { GridColumns, GridRenderCellParams } from "@mui/x-data-grid";
import { AssessmentAreaDialog } from "components/settings/AssessmentAreaDialog";
import { serverAPI } from "configs/api";
import { setApiHeaders } from "utils/setApiHeaders";
import { AssessmentAreaInterface } from "interfaces/settings";
import { BaseProps } from "interfaces/base";

export const getServerSideProps = async (ctx: NextPageContext) => {
  setApiHeaders(ctx);
  const res = await serverAPI.get("/setting/area-assessment/standard", {
    params: {
      page: 0,
      limit: 25,
    },
  });

  let data: AssessmentAreaInterface[] = res.data.data;
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
        <AssessmentAreaDialog isUpdate data={row} isStandard />
        <div className='border py-2 mx-3'></div>
        <DeleteBox
          title='Assessment Area'
          url='/setting/area-assessment/standard'
          data={row.id}
        >
          Are You sure do you want to delete this Assessment Area?
        </DeleteBox>
      </div>
    ),
  },
];

const AssessmentAreaConfiguration: BaseProps<AssessmentAreaInterface[]> = ({
  data,
}) => {
  return (
    <>
      <PageHeader title='Standard Assessment Areas Configuration' />
      <DataGrid
        columns={columns}
        rows={data}
        url='/setting/area-assessment/standard'
        addButton={<AssessmentAreaDialog isStandard />}
      />
    </>
  );
};

export default AssessmentAreaConfiguration;
