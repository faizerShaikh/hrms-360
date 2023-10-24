import { Card, CardContent, CardHeader, Grid } from "@mui/material";
import {
  cardStyles,
  DashboardCard,
  IndustryBreakUp,
  SurveyStatus,
  TenantBreakUp,
} from "components/dashboard";

import { colors } from "constants/theme";
import { PageHeader } from "components/layout";

import { setApiHeaders } from "utils/setApiHeaders";
import { NextPageContext } from "next";
import { serverAPI } from "configs/api";
import { BaseProps } from "interfaces/base";

import { IndustryInterface } from "interfaces/settings";
import ErrorPage from "next/error";
import Link from "next/link";

interface DashboardInterface {
  data: number[] | IndustryInterface[];
  categories: string[];
  total: number;
  competency: number;
  question: number;
  pieChart: any[];
  current: number;
  last: number;
  percentage: number;
  thisWeekCount?: number;
}

export const getServerSideProps = async (ctx: NextPageContext) => {
  try {
    setApiHeaders(ctx);

    const getTenantTotal = serverAPI.get(
      "/dashboard/channel-partner/total-tenant-chart?range=by_week"
    );

    const getActiveTenantTotal = serverAPI.get(
      "/dashboard/channel-partner/active-tenant-chart?range=by_week"
    );

    const getSurveyCountTotal = serverAPI.get(
      "/dashboard/channel-partner/survey-count-chart?range=by_week"
    );

    const getCompetencyChartTotal = serverAPI.get(
      "/dashboard/channel-partner/competency-chart"
    );

    const getQuestionChartTotal = serverAPI.get(
      "/dashboard/channel-partner/question-chart"
    );

    let getTenantTotalResp = await getTenantTotal;
    let getActiveTenantTotalResp = await getActiveTenantTotal;
    let getSurveyCountTotalResp = await getSurveyCountTotal;
    let getCompetencyChartTotalResp = await getCompetencyChartTotal;
    let getQuestionChartTotalResp = await getQuestionChartTotal;

    return {
      props: {
        data: [
          getTenantTotalResp.data.data || null,
          getActiveTenantTotalResp.data.data || null,
          getSurveyCountTotalResp.data.data || null,
          getCompetencyChartTotalResp.data.data || null,
          getQuestionChartTotalResp.data.data || null,
        ],
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

const AdminDashboard: BaseProps<DashboardInterface[]> = ({ data }) => {
  if (!data) {
    return <ErrorPage statusCode={500} />;
  }

  return (
    <>
      <PageHeader title='Admin Dashboard' />
      <Grid container spacing={2}>
        <Link href='/admin/tenant-configration' passHref>
          <Grid item xs={4} className='cursor-pointer'>
            <DashboardCard
              title='Total Tenants'
              count={data[0]?.total ?? 0}
              url='/dashboard/channel-partner/total-tenant-chart'
              sortAllowed={true}
              menuItems={["by_week", "by_month", "by_year"]}
              data={data[0]?.data || []}
              categories={data[0]?.categories || []}
              chartColor={[colors.primary.dark]}
              text={
                !data[0]?.last
                  ? `No changes since last week`
                  : `${(Math.abs(data[0]?.percentage) || 0).toFixed(2)}% ${
                      data[0]?.current > data[0]?.last ? "greater" : "lower"
                    } than last week`
              }
              isIncreased={
                !data[0]?.last ? null : data[0]?.current > data[0]?.last
              }
            />
          </Grid>
        </Link>
        <Link href='/admin/tenant-configration' passHref>
          <Grid item xs={4} className='cursor-pointer'>
            <DashboardCard
              url='/dashboard/channel-partner/active-tenant-chart'
              title='Active Tenants'
              count={data[1]?.total ?? 0}
              sortAllowed={true}
              menuItems={["by_week", "by_month", "by_year"]}
              data={data[1]?.data}
              categories={data[1]?.categories || []}
              chartColor={[colors.secondary.dark]}
              text={
                !data[1]?.last
                  ? `No changes since last week`
                  : `${(Math.abs(data[1]?.percentage) || 0).toFixed(2)}% ${
                      data[1]?.current > data[1]?.last ? "greater" : "lower"
                    } than last week`
              }
              isIncreased={
                !data[1]?.last ? null : data[1]?.current > data[1]?.last
              }
            />
          </Grid>
        </Link>
        <Grid item xs={4}>
          <DashboardCard
            url='/dashboard/channel-partner/survey-count-chart'
            title='Survey Count'
            count={data[2]?.total ?? 0}
            sortAllowed={true}
            menuItems={["by_week", "by_month", "by_year"]}
            data={data[2]?.data}
            categories={data[2]?.categories || []}
            chartColor={[colors.primary.dark]}
            text={
              !data[2]?.last
                ? `No changes since last week`
                : `${(
                    parseInt(`${Math.abs(data[2]?.percentage)}`) || 0
                  ).toFixed(2)}% ${
                    data[2]?.current > data[2]?.last ? "greater" : "lower"
                  } than last week`
            }
            isIncreased={
              !data[2]?.last ? null : data[2]?.current > data[2]?.last
            }
          />
        </Grid>
      </Grid>
      <Grid container spacing={2} className='mt-1'>
        <IndustryBreakUp cardStyles={cardStyles} />
        <Grid item xs={4}>
          <SurveyStatus data={data[2]} />
        </Grid>
        <Grid item xs={2}>
          <Grid
            container
            justifyContent='space-between'
            alignContent='space-between'
            sx={{ height: "100%" }}
          >
            <Link href='/competency-bank/standard' passHref>
              <Grid item xs={12} height='48%' className='cursor-pointer'>
                <DashboardCard
                  title='Competencies'
                  count={data[3]?.competency ?? 0}
                  text={
                    !data[3]?.last
                      ? `No changes since last week`
                      : `${Math.abs(data[3]?.percentage) || 0}% ${
                          data[3]?.current > data[3]?.last ? "greater" : "lower"
                        } than last week`
                  }
                  isIncreased={
                    !data[3]?.last ? null : data[3]?.current > data[3]?.last
                  }
                  sortAllowed={false}
                  hideChart={true}
                />
              </Grid>
            </Link>
            <Link href='/competency-bank/standard' passHref>
              <Grid item xs={12} height='48%' className='cursor-pointer'>
                <DashboardCard
                  title='Questions'
                  count={data[4]?.question ?? 0}
                  sortAllowed={false}
                  hideChart={true}
                  text={
                    !data[4]?.last
                      ? `No changes since last week`
                      : `${Math.abs(data[4]?.percentage) || 0}% ${
                          data[4]?.current > data[4]?.last ? "greater" : "lower"
                        } than last week`
                  }
                  isIncreased={
                    !data[4]?.last ? null : data[4]?.current > data[4]?.last
                  }
                />
              </Grid>
            </Link>
          </Grid>
        </Grid>
      </Grid>
      <Card className='mt-5'>
        <CardHeader
          title='Tenant Breakup by Industry'
          sx={{
            ...cardStyles,
            "& .MuiCardHeader-title": {
              paddingLeft: "0px",
            },
          }}
        />
        <CardContent className='pt-0'>
          <TenantBreakUp />
        </CardContent>
      </Card>
    </>
  );
};

export default AdminDashboard;
