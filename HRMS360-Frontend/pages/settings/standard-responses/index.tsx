import { NextPageContext } from "next";
import { GridColumns, GridRenderCellParams } from "@mui/x-data-grid";
import { DataGrid, DeleteBox, PageHeader } from "components/layout";
import { StandardResponseDialog } from "components/settings/StandardResponsesDialog";
import { serverAPI } from "configs/api";
import { setApiHeaders } from "utils/setApiHeaders";
import { ResponseObjInterface } from "interfaces/competency-bank";
import { BaseProps } from "interfaces/base";
import { useGetAll } from "hooks/useGetAll";
import { useState } from "react";

export const getServerSideProps = async (ctx: NextPageContext) => {
  setApiHeaders(ctx);
  const res = await serverAPI.get("/setting/standard-response", {
    params: {
      page: 0,
      limit: 25,
    },
  });

  let data: ResponseObjInterface[] = res.data.data;
  return {
    props: {
      data,
    },
  };
};

const columns: GridColumns = [
  {
    headerName: "Label",
    field: "label",
    flex: 2,
    cellClassName: "text-dark",
  },
  {
    headerName: "Score",
    field: "score",
    flex: 1,
    minWidth: 200,
    align: "center",
    headerAlign: "center",
  },

  {
    headerName: "Actions",
    field: "actions",
    flex: 2,
    renderCell: ({ row }: GridRenderCellParams) => (
      <div className='flex items-center'>
        <StandardResponseDialog isUpdate data={row} />
        <div className='border rounded-xl py-2 mx-3'></div>

        <DeleteBox
          title='Delete Standard Response'
          url='/setting/standard-response'
          data={row.id}
        >
          Are You sure do you want to delete this Standard Response?
        </DeleteBox>
      </div>
    ),
  },
];

const StandardResponses: BaseProps<any> = ({ data }) => {
  const [standardResponses, setStandardResponses] = useState(data);
  useGetAll({
    key: "/setting/standard-response",
    enabled: false,
    onSuccess: (data) => {
      setStandardResponses(data);
    },
  });

  return (
    <>
      <PageHeader title='Standard Responses'></PageHeader>
      <DataGrid
        columns={columns}
        rows={standardResponses}
        addButton={
          standardResponses?.rows?.length < 5 && <StandardResponseDialog />
        }
      />
    </>
  );
};

export default StandardResponses;
