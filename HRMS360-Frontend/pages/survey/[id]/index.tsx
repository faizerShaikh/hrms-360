import React from "react";
import { DataGrid, PageHeader } from "components";
import { NextPageContext } from "next";
import { View } from "@carbon/icons-react";
import { Typography, Button } from "@mui/material";
import NextLink from "next/link";
import { GridColumns, GridRenderCellParams } from "@mui/x-data-grid";
import { StatusCard } from "components/layout/cards/StatusCard";
import { API, serverAPI } from "configs/api";
import { setApiHeaders } from "utils/setApiHeaders";
import { SurveyDescriptionInterface, SurveyStatus } from "interfaces/survey";
import { BaseProps } from "interfaces/base";
import { useSetNavbarTitle } from "hooks/useSetNavbarTitle";
import { useRouter } from "next/router";
import { useDownaloadFile } from "hooks/useDownloadFile";

export const getServerSideProps = async (ctx: NextPageContext) => {
  setApiHeaders(ctx);
  const res = await serverAPI.get(`/survey/${ctx.query.id}`);
  const data: SurveyDescriptionInterface = res.data.data;
  return {
    props: { data },
  };
};

const SurveyDetailActions = ({ row }: GridRenderCellParams) => {
  const { query } = useRouter();
  return (
    <NextLink href={`/survey/${query.id}/${row?.Survey?.id}`}>
      <Button startIcon={<View />}>
        <Typography className='capitalize xl:text-sm 2xl:text-semi-base'>
          View
        </Typography>
      </Button>
    </NextLink>
  );
};

const columns: GridColumns = [
  {
    headerName: "Recipient Name",
    field: "name",
    flex: 1,
    minWidth: 200,
    renderCell: ({ row, value }: GridRenderCellParams) => (
      <div className='flex flex-col py-4 w-full'>
        <p className={`m-0 text-dark `}>{value}</p>
        <p className={`m-0 text-main truncate `}>{row?.designation?.name}</p>
      </div>
    ),
  },
  {
    headerName: "Contact Details",
    field: "email",
    flex: 1,
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
    flex: 1,
    valueGetter({ value }) {
      return value?.name || "-";
    },
  },
  {
    headerName: "Line Manager",
    field: "line_manager",
    flex: 1,
    valueGetter({ value }) {
      return value?.name || "-";
    },
  },
  {
    headerName: "Survey Stage",
    field: "status",
    flex: 1,
    align: "center",
    headerAlign: "center",
    minWidth: 250,
    renderCell: ({ row }: GridRenderCellParams) => (
      <StatusCard
        text={row?.Survey?.status}
        variant={
          [
            SurveyStatus.Initiated,
            SurveyStatus.Ongoing,
            SurveyStatus.Suggested_by_EMP,
            SurveyStatus.Suggested_by_LM,
          ].includes(row?.Survey?.status)
            ? SurveyStatus.Initiated?.toLocaleLowerCase().replace(/ /g, "_")
            : row?.Survey?.status?.toLocaleLowerCase().replace(/ /g, "_")
        }
      />
    ),
  },
  {
    headerName: "Action",
    field: "actions",
    flex: 1,
    renderCell: SurveyDetailActions,
  },
];

const MySurvey: BaseProps<SurveyDescriptionInterface> = ({ data }) => {
  useSetNavbarTitle(data?.title);
  const { refetch } = useDownaloadFile(
    `/survey/get-responses-excel/${data.id}`,
    () => {}
  );
  return (
    <>
      <PageHeader title={data?.title} />
      <DataGrid
        columns={columns}
        rows={data?.employees || []}
        noSearch
        rowHeight={60}
        addButton={
          data.status === "Completed" ? (
            <Button variant='contained' onClick={() => refetch()}>
              Download Responses
            </Button>
          ) : (
            data?.status &&
            [
              "Ongoing",
              "Initiated",
              "In Progress",
              "Pending Approval",
            ].includes(data?.status) && (
              <Button
                variant='contained'
                onClick={() => API.get(`/survey/token/${data.id}`)}
              >
                Send Mail
              </Button>
            )
          )
        }
      />
    </>
  );
};

export default MySurvey;
