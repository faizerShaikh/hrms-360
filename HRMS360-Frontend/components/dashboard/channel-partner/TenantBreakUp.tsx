import { Avatar, Grid, Typography } from "@mui/material";
import { GridColumns, GridRenderCellParams } from "@mui/x-data-grid";

import { colors } from "constants/theme";
import { DataGrid, StatusCard } from "components/layout";

const columns: GridColumns = [
  {
    headerName: "Name of Company",
    field: "name",
    minWidth: 250,

    renderCell({ row }) {
      return (
        <Grid direction='row' container alignItems='center'>
          <Grid xs={4} item>
            <Avatar
              sx={{ width: 24, height: 24, fontSize: "14px" }}
              alt={row.name}
              src={`${process.env.NEXT_PUBLIC_API_URL?.split("/api/v1")[0]}${
                row.tenant_pic
              }`}
            />
          </Grid>
          <Grid xs={8} item>
            <Typography color={colors.text.dark} fontSize={14}>
              {row.name}
            </Typography>
          </Grid>
        </Grid>
      );
    },
  },
  {
    headerName: "Surveys Performed",
    field: "surveys",
    minWidth: 200,
    renderCell: ({ row }: GridRenderCellParams) => (
      <Typography color={colors.text.dark} fontSize={14}>
        {row.tenantHistory.length}
      </Typography>
    ),
  },
  {
    headerName: "Employee Base",
    field: "no_of_employee",
    minWidth: 200,
  },
  {
    headerName: "Onboarding Date",
    field: "start_date",
    minWidth: 200,
    type: "date",
  },
  {
    headerName: "Subscription",
    field: "is_active",
    minWidth: 250,
    align: "center",
    headerAlign: "center",
    renderCell({ row }: GridRenderCellParams) {
      return row.is_active ? (
        <StatusCard text={"Active"} variant={"initiated"} />
      ) : (
        <StatusCard text={"Expired"} variant={"terminated"} />
      );
    },
  },
];

export const TenantBreakUp = () => {
  return (
    <>
      <DataGrid
        columns={columns}
        rows={[]}
        url='/dashboard/channel-partner/tenants?limit=10&page=0'
        refetchInside
        hideFooterPagination
        noSearch
      />
    </>
  );
};
