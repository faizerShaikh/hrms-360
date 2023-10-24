import { Add, Edit } from "@carbon/icons-react";
import { GridColumns, GridRenderCellParams } from "@mui/x-data-grid";
import { Button, DataGrid, PageHeader } from "components/layout";
import { StatusCard } from "components/layout/cards/StatusCard";
import { ActivateDeactivateTenant } from "components/tenant/ActivateDeactivateTenant";

import { serverAPI } from "configs/api";
import { TenentInterface, BaseProps } from "interfaces";
import { NextPageContext } from "next";
import Link from "next/link";

import { setApiHeaders } from "utils/setApiHeaders";

export const getServerSideProps = async (ctx: NextPageContext) => {
  setApiHeaders(ctx);
  const res = await serverAPI.get("/channel-partner/tenant", {
    params: {
      page: 0,
      limit: 25,
    },
  });

  let data: TenentInterface[] = res.data.data;

  return {
    props: {
      data,
    },
  };
};

const columns: GridColumns = [
  {
    headerName: "Organisation Name",
    field: "name",
    minWidth: 200,
    cellClassName: "text-dark",
  },
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
    align: "center",
    headerAlign: "center",
    renderCell(params) {
      return (
        <StatusCard
          text={params.row.is_active ? "Active" : "Inactive"}
          variant={params.row.is_active ? "initiated" : "in_progress"}
        />
      );
    },
  },
  {
    headerName: "Action",
    field: "action",
    type: "action",
    minWidth: 250,

    renderCell: ({ row }: GridRenderCellParams) => (
      <div className='flex items-center'>
        <Link passHref href={`/admin/tenant-configration/edit/${row.id}`}>
          <a>
            <Button startIcon={<Edit />} className='capitalize' variant='text'>
              View/Edit
            </Button>
          </a>
        </Link>

        <div className='border py-2 mx-3'></div>

        {!(new Date(row.start_date).getTime() > new Date().getTime()) &&
          new Date(row.end_date).getTime() > new Date().getTime() && (
            <ActivateDeactivateTenant
              title={`${row.is_active ? "Deactivate" : "Activate"} Tenant`}
              url={`/channel-partner/tenant/${row.id}`}
              successMsg={
                row.is_active
                  ? "Tenant deactivated successfully"
                  : "Tenant activated successfully"
              }
              refetchUrl='/channel-partner/tenant'
              button={
                row.is_active ? (
                  <Button
                    variant='text'
                    className='capitalize'
                    color='secondary'
                  >
                    Deactivate
                  </Button>
                ) : (
                  <Button variant='text' className='capitalize' color='primary'>
                    Activate
                  </Button>
                )
              }
            >
              Do you really want to {row.is_active ? "deactivate" : "activate"}{" "}
              this tenant?
            </ActivateDeactivateTenant>
          )}
      </div>
    ),
  },
];

const TenantConfigration: BaseProps<TenentInterface[]> = ({
  data,
}: {
  data: TenentInterface[];
}) => {
  return (
    <>
      <PageHeader title='Tenants list' />
      <DataGrid
        rows={data}
        columns={columns}
        url={`/channel-partner/tenant`}
        addButton={
          <Link href='/admin/tenant-configration/add' passHref>
            <Button startIcon={<Add size={"24"} />} className='h-9 capitalize'>
              Tenants
            </Button>
          </Link>
        }
      />
    </>
  );
};

export default TenantConfigration;
