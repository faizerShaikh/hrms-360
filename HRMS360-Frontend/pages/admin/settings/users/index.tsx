import { GridColumns, GridRenderCellParams } from "@mui/x-data-grid";
import { DataGrid, DeleteBox, PageHeader } from "components/layout";
import { serverAPI } from "configs/api";
import { BaseProps } from "interfaces/base";
import { UserInterface } from "interfaces/users";
import { NextPageContext } from "next";
import { setApiHeaders } from "utils/setApiHeaders";
import { getCookie } from "cookies-next";
import { UserDialog } from "components/settings/UserDialog";
import { getParsedCookie } from "utils/getParsedCookie";

export const getServerSideProps = async (ctx: NextPageContext) => {
  setApiHeaders(ctx);

  const res = await serverAPI.get("/channel-partner/user", {
    params: {
      page: 0,
      limit: 25,
    },
  });

  let data: UserInterface[] = res.data.data;
  return {
    props: {
      data,
      is_tenant_admin: getCookie("is_tenant_admin", {
        req: ctx.req,
        res: ctx.res,
      }),
    },
  };
};

const columns: GridColumns = [
  {
    headerName: "Name",
    field: "name",
    minWidth: 250,
    cellClassName: "text-dark",
  },
  {
    headerName: "Email",
    field: "email",
    minWidth: 250,
  },
  {
    headerName: "Region",
    field: "region",
    minWidth: 250,
  },
  {
    headerName: "Action",
    field: "actions",
    minWidth: 200,
    renderCell: ({ row }: GridRenderCellParams) =>
      getParsedCookie("user")?.id !== row.id && (
        <>
          <UserDialog isUpdate data={row} />
          <div className='border rounded-xl py-2 mx-3'></div>
          <DeleteBox title='User' url='/channel-partner/user' data={row.id}>
            Are You sure do you want to delete this User?
          </DeleteBox>
        </>
      ),
  },
];

const Users: BaseProps<UserInterface[], { is_tenant_admin: boolean }> = ({
  data,
  is_tenant_admin,
}) => {
  return (
    <>
      <PageHeader title='Users'></PageHeader>
      <DataGrid
        columns={columns}
        rows={data}
        url='/channel-partner/user'
        addButton={is_tenant_admin && <UserDialog />}
      />
    </>
  );
};

export default Users;
