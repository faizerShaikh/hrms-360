import { DataGrid, DeleteBox, PageHeader } from "components/layout";
import { NextPageContext } from "next";
import React from "react";
import { GridColumns, GridRenderCellParams } from "@mui/x-data-grid";
import { AssessmentAreaDialog } from "components/settings/AssessmentAreaDialog";
import { serverAPI } from "configs/api";
import { setApiHeaders } from "utils/setApiHeaders";
import { AssessmentAreaInterface } from "interfaces/settings";
import { BaseProps } from "interfaces/base";
import { getCookie } from "cookies-next";

export const getServerSideProps = async (ctx: NextPageContext) => {
  setApiHeaders(ctx);
  const isChannelPartner = getCookie("is_channel_partner", ctx);
  const res = await serverAPI.get(
    `/setting/area-assessment${!isChannelPartner ? "" : "/standard"}`,
    {
      params: {
        page: 0,
        limit: 25,
      },
    }
  );

  let data: AssessmentAreaInterface[] = res.data.data;
  return {
    props: {
      data,
      isChannelPartner: !!isChannelPartner,
    },
  };
};

const AssessmentAreaConfiguration: BaseProps<
  AssessmentAreaInterface[],
  { isChannelPartner: boolean }
> = ({ data, isChannelPartner }) => {
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
            url={`/setting/area-assessment${
              !isChannelPartner ? "" : "/standard"
            }`}
            data={row.id}
          >
            Are You sure do you want to delete this Assessment Area?
          </DeleteBox>
        </div>
      ),
    },
  ];
  return (
    <>
      <PageHeader
        title={`${
          isChannelPartner ? "" : "Standard "
        }Assessment Areas Configuration`}
      />
      <DataGrid
        columns={columns}
        rows={data}
        url={`/setting/area-assessment${!isChannelPartner ? "" : "/standard"}`}
        addButton={<AssessmentAreaDialog isStandard={isChannelPartner} />}
      />
    </>
  );
};

export default AssessmentAreaConfiguration;
