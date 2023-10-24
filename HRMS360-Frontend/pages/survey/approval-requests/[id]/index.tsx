import React from "react";
import { DataGrid, PageHeader } from "components";
import { NextPageContext } from "next";
import { View } from "@carbon/icons-react";
import { Typography, Button } from "@mui/material";
import NextLink from "next/link";
import { GridColumns, GridRenderCellParams } from "@mui/x-data-grid";
import { StatusCard } from "components/layout/cards/StatusCard";
import { serverAPI } from "configs/api";
import { setApiHeaders } from "utils/setApiHeaders";
import { SurveyDescriptionInterface, SurveyStatus } from "interfaces/survey";
import { BaseProps } from "interfaces/base";
import { useRouter } from "next/router";
import { useSetNavbarTitle } from "hooks/useSetNavbarTitle";

export const getServerSideProps = async (ctx: NextPageContext) => {
  setApiHeaders(ctx);
  const res = await serverAPI.get(
    `/survey/pending-approval-survey-users/${ctx.query.id}`
  );
  const data: SurveyDescriptionInterface = res.data.data;
  return {
    props: { data },
  };
};

const SurveyDetailActions = ({ row }: GridRenderCellParams) => {
  const { query } = useRouter();
  return (
    row.is_lm_approval_required && (
      <NextLink
        href={`/survey/approval-requests/${query.id}/${row?.Survey?.id}`}
      >
        <Button startIcon={<View />}>
          <Typography className='capitalize xl:text-sm 2xl:text-semi-base'>
            View
          </Typography>
        </Button>
      </NextLink>
    )
  );
};

const columns: GridColumns = [
  {
    headerName: "Recipient Name",
    field: "name",
    minWidth: 200,
    renderCell: ({ row, value }: GridRenderCellParams) => (
      <div className='flex flex-col py-4 w-full'>
        <p className={`m-0 text-dark`}>{value}</p>
        <p className={`m-0 text-main truncate`}>{row?.designation?.name}</p>
      </div>
    ),
  },
  {
    headerName: "Contact Details",
    field: "email",
    minWidth: 250,
    renderCell: ({ row }: GridRenderCellParams) => (
      <div className='flex flex-col py-4 w-full'>
        <p className={`m-0 text-main truncate`}>{row?.email}</p>
        <p className={`m-0 text-main`}>{row?.contact}</p>
      </div>
    ),
  },
  {
    headerName: "Department",
    field: "department",
    minWidth: 200,
    valueGetter({ value }) {
      return value?.name || "-";
    },
  },
  {
    headerName: "Line Manager",
    field: "line_manager",
    minWidth: 200,
    valueGetter({ value }) {
      return value?.name || "-";
    },
  },
  {
    headerName: "Survey Stage",
    field: "status",
    minWidth: 250,
    renderCell: ({ row }: GridRenderCellParams) => (
      <StatusCard
        text={row?.Survey?.status}
        variant={
          [
            SurveyStatus.Suggested_by_EMP.toString(),
            SurveyStatus.Suggested_by_LM.toString(),
          ].includes(row?.Survey?.status)
            ? "initiated"
            : row?.Survey?.status?.toLocaleLowerCase().replace(/ /g, "_")
        }
      />
    ),
  },
  {
    headerName: "Action",
    field: "actions",
    minWidth: 100,
    renderCell: SurveyDetailActions,
  },
];

const AllEmployees: BaseProps<SurveyDescriptionInterface> = ({ data }) => {
  useSetNavbarTitle(data?.title);

  return (
    <>
      <PageHeader title={data?.title} />
      <DataGrid
        columns={columns}
        rows={data?.employees || []}
        noSearch
        rowHeight={60}
      />
    </>
  );
};

export default AllEmployees;
