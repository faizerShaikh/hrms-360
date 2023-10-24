import { serverAPI } from "configs/api";
import { setApiHeaders } from "utils/setApiHeaders";

import { IndustryInterface } from "interfaces/settings";
import { NextPageContext } from "next";
import { BaseProps } from "interfaces/base";
import { DataGrid, DeleteBox, PageHeader } from "components/layout";
import { IndustryDialog } from "components/settings/IndustryDialog";
import { GridColumns, GridRenderCellParams } from "@mui/x-data-grid";

export const getServerSideProps = async (ctx: NextPageContext) => {
  setApiHeaders(ctx);
  const res = await serverAPI.get("/setting/industry/apsis-admin", {
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
        <DeleteBox
          title='Industry'
          url='/setting/industry'
          data={row.id}
          refetchUrl='/setting/industry/apsis-admin'
        >
          Are You sure do you want to delete this Industry?
        </DeleteBox>
      </div>
    ),
  },
];

const IndustrySettings: BaseProps<IndustryInterface[]> = ({ data }) => {
  return (
    <>
      <PageHeader title='Industry Configuration' />
      <DataGrid
        columns={columns}
        rows={data}
        url='/setting/industry/apsis-admin'
        addButton={<IndustryDialog />}
      />
    </>
  );
};

export default IndustrySettings;
