import React from "react";
import {
  DataGrid,
  PageHeader,
  LinearProgressBar,
  StatusCard,
  Button,
  DonwloadReport,
} from "components";
import { NextPageContext } from "next";
import { Add, View } from "@carbon/icons-react";
import NextLink from "next/link";
import { GridColumns, GridRenderCellParams } from "@mui/x-data-grid";
import { setApiHeaders } from "utils/setApiHeaders";
import { serverAPI } from "configs/api";
import { SurveyDescriptionInterface, SurveyStatus } from "interfaces/survey";
import { BaseProps } from "interfaces/base";
import { getFormattedDate } from "utils/getFormattedDate";

export const getServerSideProps = async (ctx: NextPageContext) => {
  setApiHeaders(ctx);
  const res = await serverAPI.get("/survey/my", {
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

const MyActionButton = ({ row }: { row: SurveyDescriptionInterface }) => {
  if (row.status === SurveyStatus.Completed) {
    return <DonwloadReport id={`${row.surveys ? row.surveys[0].id : ""}`} />;
  }

  if (
    row.surveys &&
    row.surveys[0] &&
    [
      SurveyStatus.In_Progress.toString(),
      SurveyStatus.Initiated.toString(),
    ].includes(row.surveys[0].status) &&
    row.surveys[0].no_of_respondents === 0
  ) {
    return (
      <div className='flex items-center justify-evenly'>
        <NextLink
          href={`/survey/my/nominate-respondents/${row.surveys[0].id}`}
          passHref
        >
          <Button startIcon={<Add size={24} />} variant='text'>
            Add Nominies
          </Button>
        </NextLink>
      </div>
    );
  }
  if (
    row.surveys &&
    row.surveys[0] &&
    [SurveyStatus.Suggested_by_LM.toString()].includes(row.surveys[0].status)
  ) {
    return (
      <div className='flex items-center justify-evenly'>
        <NextLink
          href={`/survey/my/alternative-suggestion/${row.surveys[0].id}`}
          passHref
        >
          <Button
            startIcon={<View />}
            className='xl:text-sm 2xl:text-semi-base capitalize'
            variant='text'
          >
            View Suggestions
          </Button>
        </NextLink>
      </div>
    );
  }

  return <>-</>;
};

const columns: GridColumns<SurveyDescriptionInterface> = [
  {
    headerName: "Name of Survey",
    field: "title",
    minWidth: 400,
  },
  {
    headerName: "Start Date",
    field: "created_at",

    minWidth: 150,
    valueGetter({ value }) {
      return getFormattedDate(value);
    },
  },
  {
    headerName: "Assessments Due",
    field: "assessments_due",
    cellClassName: "flex justify-center",
    minWidth: 180,
  },
  {
    headerName: "Assessments Completed",
    field: "assessments_completed",
    cellClassName: "flex justify-center",

    minWidth: 200,
  },
  {
    headerName: "Progress",
    field: "progress",
    minWidth: 200,
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
    minWidth: 250,
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
    minWidth: 220,
    renderCell: ({ row }) => <MyActionButton row={row} />,
  },
];

const MySurvey: BaseProps<SurveyDescriptionInterface[]> = ({ data }) => {
  return (
    <>
      <PageHeader title='My All Survey' />
      <DataGrid columns={columns} rows={data} url='/survey/my' />
    </>
  );
};

export default MySurvey;
