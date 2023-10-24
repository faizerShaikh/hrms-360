import React from "react";
import {
  DataGrid,
  PageHeader,
  LinearProgressBar,
  StatusCard,
  Button,
} from "components";
import { NextPageContext } from "next";
import { View } from "@carbon/icons-react";
import NextLink from "next/link";
import { GridColumns, GridRenderCellParams } from "@mui/x-data-grid";
import { setApiHeaders } from "utils/setApiHeaders";
import { serverAPI } from "configs/api";
import { SurveyDescriptionInterface } from "interfaces/survey";
import { BaseProps } from "interfaces/base";
import { getFormattedDate } from "utils/getFormattedDate";

export const getServerSideProps = async (ctx: NextPageContext) => {
  setApiHeaders(ctx);
  const res = await serverAPI.get("/survey/pending-approval-survey", {
    params: {
      limit: 25,
      page: 0,
    },
  });

  const data: SurveyDescriptionInterface[] = res.data.data;

  return {
    props: {
      data,
    },
  };
};

const columns: GridColumns<SurveyDescriptionInterface> = [
  {
    headerName: "Name of Survey",
    field: "title",
    width: 300,
    cellClassName: "text-dark",
    renderCell: ({ row }: GridRenderCellParams) => (
      <NextLink href={`/survey/approval-requests/${row.id}`}>
        <p className='truncate'> {row.title}</p>
      </NextLink>
    ),
  },
  {
    headerName: "Start Date",
    field: "created_at",
    width: 130,
    valueGetter({ value }) {
      return getFormattedDate(value);
    },
  },
  {
    headerName: "Assessments Due",
    field: "assessments_due",
    cellClassName: "flex justify-center",
    width: 170,
  },
  {
    headerName: "Assessments Completed",
    field: "assessments_completed",
    cellClassName: "flex justify-center",
    width: 170,
  },
  {
    headerName: "Progress",
    field: "progress",
    width: 200,
    renderCell: ({ row }) => {
      const per =
        ((row.assessments_completed || 0) /
          ((row.assessments_due || 0) + (row.assessments_completed || 0))) *
        100;
      return (
        <>
          <LinearProgressBar
            variant='determinate'
            value={+per.toFixed()}
            sx={{ width: "75%" }}
          />
          <span className='pl-2 w-[25px]'>{per.toFixed()} %</span>
        </>
      );
    },
  },
  {
    headerName: "Survey Stage",
    field: "status",
    align: "center",
    headerAlign: "center",
    width: 250,
    renderCell: ({ row }: GridRenderCellParams) => (
      <StatusCard
        text={row.status}
        variant={row?.status?.toLowerCase()?.replace(/ /g, "_")}
      />
    ),
  },
  {
    headerName: "Action",
    field: "actions",
    width: 100,
    renderCell: ({ row }) => (
      <div className='flex items-center justify-evenly'>
        <NextLink href={`/survey/approval-requests/${row.id}`} passHref>
          <Button
            startIcon={<View />}
            className='xl:text-sm 2xl:text-semi-base capitalize'
            variant='text'
          >
            View
          </Button>
        </NextLink>
      </div>
    ),
  },
];

const ApprovalRequests: BaseProps<SurveyDescriptionInterface[]> = ({
  data,
}) => {
  return (
    <>
      <PageHeader title='Approval Requests' />
      <DataGrid
        columns={columns}
        rows={data}
        url='/survey/pending-approval-survey'
      />
    </>
  );
};

export default ApprovalRequests;
