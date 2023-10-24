//import { Add, Edit } from "@carbon/icons-react";
import {
  GridColumns, //GridRenderCellParams
} from "@mui/x-data-grid";
import {
  //Button,
  DataGrid,
  //DeleteBox,
  PageHeader,
  StatusCard,
} from "components/layout";
import { serverAPI } from "configs/api";
//import { TenentInterface } from "interfaces/tenant";
import { NextPageContext } from "next";
//import Link from "next/link";
import { setApiHeaders } from "utils/setApiHeaders";

export const getServerSideProps = async (ctx: NextPageContext) => {
  setApiHeaders(ctx);
  const res = await serverAPI.get(`/tenant/${ctx.query.id}`);
  //   const res = await serverAPI.get("/channel-partner/tenant/");

  //   let data: TenentInterface[] = res.data.data;
  let data = res.data.data;

  return {
    props: {
      data,
    },
  };
};

const columns: GridColumns = [
  { headerName: "Organisation Name", field: "name", minWidth: 200 },
  { headerName: "Location", field: "location", minWidth: 200 },
  {
    headerName: "Industry",
    field: "industry",
    minWidth: 200,
    valueGetter(params) {
      return params.row?.industry?.name;
    },
  },
  {
    headerName: "Admin Type",
    field: "admin_type",
    minWidth: 200,
    cellClassName: "capitalize",
  },
  {
    headerName: "Organization Admin",
    field: "Organization Admin",
    minWidth: 250,
    valueGetter(params) {
      return params.row?.admin?.name || "-";
    },
  },
  {
    headerName: "Admin Email-Address",
    field: "Admin Email-Address",
    minWidth: 250,
    valueGetter(params) {
      return params.row?.admin?.email || "-";
    },
  },
  {
    headerName: "Employee Base",
    field: "no_of_employee",
    minWidth: 150,
  },
  {
    headerName: "Onboarding date",
    field: "start_date",
    type: "date",
    minWidth: 200,
  },
  {
    headerName: "End of subscription date",
    field: "end_date",
    type: "date",
    minWidth: 200,
  },
  {
    headerName: "Tenure",
    field: "tenure",
    minWidth: 150,
    valueGetter(params) {
      return params.row.tenure
        ? params.row.tenure / 12 >= 1
          ? `${(params.row.tenure / 12).toFixed(1)} year`
          : `${params.row.tenure} months`
        : "";
    },
  },
  {
    headerName: "Activity Status",
    field: "is_active",
    minWidth: 250,
    renderCell(params) {
      return (
        <StatusCard
          text={params.row.is_active ? "Active" : "Inactive"}
          variant={params.row.is_active ? "initiated" : "in_progress"}
        />
      );
    },
  },
  //   {
  //     headerName: "Action",
  //     field: "action",
  //     type: "action",
  //     minWidth: 250,

  //     renderCell: ({ row }: GridRenderCellParams) => (
  //       <div className="flex items-center">
  //         <Link href={`/apsis-admin/tenant-configration/edit/${row.id}`}>
  //           <Button startIcon={<Edit />} className="capitalize" variant="text">
  //             View | Edit
  //           </Button>
  //         </Link>
  //         <div className="border py-3 mx-3"></div>
  //         <DeleteBox title="Tenant" url={`/tenant`} data={row.id}>
  //           Are You sure do you want to delete this Tenant?
  //         </DeleteBox>
  //       </div>
  //     ),
  //   },
];

const ChannelPartnerDetails = ({ data }: { data: any }) => {
  return (
    <>
      <PageHeader title={data?.admin?.name} />
      <DataGrid
        rows={data?.my_tenants || []}
        columns={columns || []}
        url={`/tenant`}
        // addButton={
        //   <Link href="/apsis-admin/tenant-configration/add" passHref>
        //     <Button
        //       startIcon={<Add size={"24"} />}
        //       className="h-9 capitalize xl:text-sm 2xl:text-semi-base"
        //     >
        //       Tenants
        //     </Button>
        //   </Link>
        // }
      />
    </>
  );
};

export default ChannelPartnerDetails;
