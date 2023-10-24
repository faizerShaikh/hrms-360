import { View } from "@carbon/icons-react";
import { Card, CardContent, CardHeader, Grid } from "@mui/material";

import {
  DataGrid,
  LinearProgressBar,
  PageHeader,
  StatusCard,
  Button,
} from "components/layout";

import { GridColumns, GridRenderCellParams } from "@mui/x-data-grid";

import { cardStyles, DashboardCard } from "components/dashboard";

import React from "react";

import { colors } from "constants/theme";
import { NextPageContext } from "next";
import { setApiHeaders } from "utils/setApiHeaders";
import { serverAPI } from "configs/api";

import { BaseProps } from "interfaces/base";
// import axios from "axios";
import { SurveyDescriptionInterface } from "interfaces/survey";
import NextLink from "next/link";
import { getFormattedDate } from "utils/getFormattedDate";
import {
  AssessmentTrendChart,
  TenantSurveyStatusChart,
} from "components/dashboard/tenant";
import Link from "next/link";

const columns: GridColumns<SurveyDescriptionInterface> = [
  {
    headerName: "Name of Survey",
    field: "title",
    flex: 2,
    minWidth: 250,
    renderCell: ({ row }: GridRenderCellParams) => (
      <NextLink href={`/survey/${row.id}`}>
        <p className='text-dark truncate'>{row.title}</p>
      </NextLink>
    ),
  },
  {
    headerName: "Start Date",
    field: "createdAt",
    flex: 1,
    minWidth: 120,
    valueGetter({ value }) {
      return getFormattedDate(value);
    },
  },
  {
    headerName: "Assessments Due",
    field: "assessments_due",
    flex: 1,
    align: "center",
  },
  {
    headerName: "Assessments Completed",
    field: "assessments_completed",
    align: "center",
    flex: 1,
  },
  {
    headerName: "Progress",
    field: "progress",
    flex: 1,
    minWidth: 190,
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
          <span className='pl-2 pr-1 text-dark w-[25px]'>
            {per.toFixed()} %
          </span>
        </>
      );
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
        text={row.status}
        variant={row?.status?.toLocaleLowerCase()?.replaceAll(" ", "_")}
      />
    ),
  },
  {
    headerName: "Action",
    field: "actions",
    flex: 1,
    minWidth: 150,
    renderCell: ({ row }) => (
      <div className='flex items-center justify-evenly'>
        <NextLink href={`/survey/${row.id}`} passHref>
          <Button startIcon={<View />} variant='text'>
            View
          </Button>
        </NextLink>
      </div>
    ),
  },
];

export const getServerSideProps = async (ctx: NextPageContext) => {
  try {
    setApiHeaders(ctx);

    const resDataResp = await serverAPI.get("/dashboard/tenant");
    const surveyTrendResp = await serverAPI.get(
      "/dashboard/tenant/survey-trend-chart?range=by_week"
    );

    return {
      props: {
        data: [resDataResp.data.data, surveyTrendResp.data.data],
      },
    };
  } catch (error) {
    return {
      props: {
        data: {},
      },
    };
  }
};

const Home: BaseProps<any> = ({ data }) => {
  return (
    <>
      <PageHeader title='Dashboard' className='mb-5' />
      <Grid container spacing={2}>
        <Link href='/survey/all' passHref>
          <Grid item xs={2} className='cursor-pointer'>
            <DashboardCard
              title='Total Surveys'
              count={(data && data[0]?.surveyData?.total) || 0}
              text={
                data && !data[0]?.surveyData?.lastYearCount
                  ? `No changes since last year`
                  : `${
                      (data && data[0]?.surveyData?.lastYearCount.toFixed()) ||
                      0
                    }%
                  ${
                    data && data[0]?.surveyData?.lastYearCount > 0
                      ? "greater"
                      : "lower"
                  } than last year`
              }
              isIncreased={
                data && !data[0]?.surveyData?.lastYearCount
                  ? null
                  : data && data[0]?.surveyData?.lastYearCount >= 0
              }
              hideChart
            />
          </Grid>
        </Link>
        <Link href='/survey/all' passHref>
          <Grid item xs={4} className='cursor-pointer'>
            <DashboardCard
              title='Survey Trend'
              text={
                !data[1]?.last
                  ? `No changes since last week`
                  : `${data[1]?.percentage.toFixed() || 0}% ${
                      data[1]?.current > data[1]?.last ? "greater" : "lower"
                    } than last week`
              }
              data={data[1]?.data || []}
              categories={data[1]?.categories || []}
              sortAllowed={true}
              menuItems={["by_week", "by_month", "by_year"]}
              isIncreased={
                !data[1]?.last ? null : data[1]?.current > data[1]?.last
              }
              count={data[1]?.total.toFixed() || 0}
              chartColor={[colors.secondary.dark]}
              url={`/dashboard/tenant/survey-trend-chart`}
            />
          </Grid>
        </Link>
        <Link href='/employee-configuration' passHref>
          <Grid item xs={2} className='cursor-pointer'>
            <DashboardCard
              title='Total Employees'
              count={data[0]?.employeeData?.total ?? 0}
              text={
                !data[0]?.employeeData?.thisWeekCount
                  ? `No changes since last week`
                  : `${
                      data[0]?.employeeData?.thisWeekCount || 0
                    } new users added this week`
              }
              hideChart
              isIncreased={data[0]?.employeeData?.thisWeekCount > 0}
            />
          </Grid>
        </Link>
        <Link href='/competency-bank/my' passHref>
          <Grid item xs={2} className='cursor-pointer'>
            <DashboardCard
              title='My Competencies'
              count={data[0]?.competencyData?.total || 0}
              text={
                !data[0]?.competencyData?.thisWeekCount
                  ? `No changes since last week`
                  : `${
                      data[0]?.competencyData?.thisWeekCount || 0
                    } new competencies added this week`
              }
              isIncreased={
                !data[0]?.competencyData?.thisWeekCount
                  ? null
                  : data[0]?.competencyData?.thisWeekCount >= 0
              }
              hideChart
            />
          </Grid>
        </Link>
        <Link href='/questions-bank/my' passHref>
          <Grid item xs={2} className='cursor-pointer'>
            <DashboardCard
              title='Questionnaires'
              count={data[0]?.questionnaireData?.total || 0}
              text={
                !data[0]?.questionnaireData?.thisWeekCount
                  ? `No changes since last week`
                  : `${
                      data[0]?.questionnaireData?.thisWeekCount || 0
                    } new competencies added this week`
              }
              isIncreased={
                !data[0]?.questionnaireData?.thisWeekCount
                  ? null
                  : data[0]?.questionnaireData?.thisWeekCount >= 0
              }
              hideChart
            />
          </Grid>
        </Link>
      </Grid>

      <Grid container spacing={2} className='mt-0'>
        <AssessmentTrendChart cardStyles={cardStyles} />
        <Grid item xs={6}>
          <TenantSurveyStatusChart />
        </Grid>
      </Grid>

      <Card
        sx={{ boxShadow: `0px 2px 4px rgba(0, 0, 0, 0.1)` }}
        className='mt-4'
      >
        <CardHeader
          title='Survey-wise Status'
          sx={{
            ...cardStyles,
            "& .MuiCardHeader-title": {
              paddingLeft: "0px",
            },
          }}
        />
        <CardContent className='pt-0'>
          <DataGrid
            columns={columns}
            rows={[]}
            refetchInside
            url='/survey?page=0&limit=5'
            hideFooterPagination
            noSearch
            // addButton={is_tenant_admin && <UserDialog />}
          />
        </CardContent>
      </Card>
    </>
  );
};

export default Home;
