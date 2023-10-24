import React from "react";
import {
  DataGrid,
  PageHeader,
  LinearProgressBar,
  StatusCard,
  Button,
} from "components";
import { NextPageContext } from "next";
import { Add } from "@carbon/icons-react";
import NextLink from "next/link";
import { GridColumns, GridRenderCellParams } from "@mui/x-data-grid";
import { setApiHeaders } from "utils/setApiHeaders";
import { serverAPI } from "configs/api";
import { SurveyDescriptionInterface, SurveyStatus } from "interfaces/survey";
import { BaseProps } from "interfaces/base";
import { getFormattedDate } from "utils/getFormattedDate";

export const getServerSideProps = async (ctx: NextPageContext) => {
  setApiHeaders(ctx);
  const res = await serverAPI.get("/survey/my-pending-survey", {
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
    flex: 2,
    minWidth: 200,
    cellClassName: "text-dark",
  },
  {
    headerName: "Start Date",
    field: "created_at",
    flex: 1,
    minWidth: 120,
    valueGetter({ value }) {
      return getFormattedDate(value);
    },
  },
  {
    headerName: "Assessments Due",
    field: "assessments_due",
    cellClassName: "flex justify-center",
    flex: 1,
  },
  {
    headerName: "Assessments Completed",
    field: "assessments_completed",
    cellClassName: "flex justify-center",
    flex: 1,
  },
  {
    headerName: "Progress",
    field: "progress",
    flex: 1,
    minWidth: 170,
    renderCell: ({ row }) => {
      const per =
        (row.assessments_completed || 0) / (row.assessments_due || 0) +
        (row.assessments_completed || 0);
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
    flex: 1,
    minWidth: 250,
    align: "center",
    headerAlign: "center",
    renderCell: ({ row }: GridRenderCellParams) =>
      row.surveys[0] && (
        <StatusCard
          text={row.surveys[0] && row.surveys[0].status}
          variant={row.surveys[0].status.toLocaleLowerCase().replace(/ /g, "_")}
        />
      ),
  },
  {
    headerName: "Action",
    field: "actions",
    flex: 1,
    minWidth: 180,
    renderCell: ({ row }) =>
      row.surveys &&
      [
        SurveyStatus.Initiated.toString(),
        SurveyStatus.In_Progress.toString(),
      ].includes(row.surveys[0].status) ? (
        <div className='flex items-center justify-evenly'>
          <NextLink
            href={`/survey/my/nominate-respondents/${row.surveys[0].id}`}
            passHref
          >
            <Button
              startIcon={<Add size={24} />}
              className='xl:text-sm 2xl:text-semi-base capitalize'
              variant='text'
            >
              Add Nominies
            </Button>
          </NextLink>
        </div>
      ) : (
        "-"
      ),
  },
];

const PendingNominations: BaseProps<SurveyDescriptionInterface[]> = ({
  data,
}) => {
  return (
    <>
      <PageHeader title='All Pending Nominations Survey' />
      <DataGrid columns={columns} rows={data} />
    </>
  );
};

export default PendingNominations;
