import { TenentInterface, BaseProps } from "interfaces";
import { serverAPI } from "configs/api";
import { NextPageContext } from "next";
import { setApiHeaders } from "utils/setApiHeaders";
import { Button, DataGrid, PageHeader, StatusCard } from "components/layout";
import Link from "next/link";
import { Add, Edit } from "@carbon/icons-react";
import { GridColumns, GridRenderCellParams } from "@mui/x-data-grid";
import { useMemo } from "react";
import { ActivateDeactivateTenant } from "components/tenant/ActivateDeactivateTenant";

export const getServerSideProps = async (ctx: NextPageContext) => {
  setApiHeaders(ctx);
  const res = await serverAPI.get("/tenant/channel-partner", {
    params: {
      page: 0,
      limit: 25,
    },
  });

  let data: TenentInterface[] = res.data.data?.rows;

  return {
    props: {
      data,
    },
  };
};

const ChannelPartneConfig: BaseProps<TenentInterface[]> = ({
  data,
}: {
  data: TenentInterface[];
}) => {
  const columns: GridColumns = useMemo(
    () => [
      {
        headerName: "Organisation Name",
        field: "name",
        minWidth: 200,
        renderCell({ row }) {
          return (
            <Link href={`/apsis-admin/channel-partner-configration/${row.id}`}>
              {row.name}
            </Link>
          );
        },
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
      {
        headerName: "Action",
        field: "action",
        type: "action",
        minWidth: 250,
        renderCell: ({ row }: GridRenderCellParams) => (
          <div className='flex items-center'>
            <Link
              href={`/apsis-admin/channel-partner-configration/edit/${row.id}`}
            >
              <Button
                startIcon={<Edit />}
                className='capitalize'
                variant='text'
              >
                View | Edit
              </Button>
            </Link>{" "}
            <div className='border py-3 mx-3'></div>
            {!(new Date(row.start_date).getTime() > new Date().getTime()) &&
              new Date(row.end_date).getTime() > new Date().getTime() && (
                <ActivateDeactivateTenant
                  title={`${row.is_active ? "Deactivate" : "Activate"} Tenant`}
                  url={`/tenant/${row.id}`}
                  successMsg={
                    row.is_active
                      ? "Tenant deactivated successfully"
                      : "Tenant activated successfully"
                  }
                  refetchUrl='/tenant/channel-partner'
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
                      <Button
                        variant='text'
                        className='capitalize'
                        color='primary'
                      >
                        Activate
                      </Button>
                    )
                  }
                >
                  Do you really want to{" "}
                  {row.is_active ? "deactivate" : "activate"} this tenant?
                </ActivateDeactivateTenant>
              )}
          </div>
        ),
      },
    ],
    []
  );

  return (
    <>
      <PageHeader title='Channel Partner list' />
      <DataGrid
        rows={data || []}
        columns={columns || []}
        url={`/tenant/channel-partner`}
        addButton={
          <Link href='/apsis-admin/channel-partner-configration/add' passHref>
            <Button
              startIcon={<Add size={"24"} />}
              className='h-9 capitalize xl:text-sm 2xl:text-semi-base'
            >
              Channel Partner
            </Button>
          </Link>
        }
      />
    </>
  );
};

export default ChannelPartneConfig;
