import {
  Box,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CircularProgress,
  MenuItem,
  Typography,
} from "@mui/material";
import { Select } from "components/layout";
import { useGetAll } from "hooks/useGetAll";
import React, { useState } from "react";
import { MdTrendingDown, MdTrendingUp } from "react-icons/md";
import { cardStyles } from "../DashboardCard";
import { SemiDonutChart } from "../SemiDonutChart";

export const TenantSurveyStatusChart = () => {
  const [selected, setSelected] = useState("by_week");
  const { data, isLoading } = useGetAll({
    key: "/dashboard/tenant/survey-status-chart",
    params: { range: selected },
    enabled: Boolean(selected),
  });

  return (
    <Card sx={{ boxShadow: `0px 2px 4px rgba(0, 0, 0, 0.1)` }}>
      <CardHeader
        title='Survey Status'
        sx={{
          ...cardStyles,
          "& .MuiCardHeader-title": {
            paddingLeft: "0px",
          },
        }}
        action={
          <Select
            border={false}
            defaultValue='by_week'
            sx={{
              "width": "100px",
              "& .MuiSelect-select": {
                paddingBottom: "6px",
              },
            }}
            className='capitalize text-xs'
            onChange={(e: any) => setSelected(e.target.value)}
          >
            {["by_week", "by_month", "by_year"].map(
              (ele: string, index: number) => (
                <MenuItem
                  value={ele}
                  onClick={(e) => e.stopPropagation()}
                  key={`${ele + index}`}
                  className='capitalize text-xs'
                >
                  {ele?.replace(/_/g, " ")}
                </MenuItem>
              )
            )}
          </Select>
        }
      />
      <CardContent sx={{ height: "350px" }}>
        {isLoading ? (
          <div className='flex justify-center items-center h-full'>
            <CircularProgress />
          </div>
        ) : (
          <SemiDonutChart
            data={data?.surveyStatus || []}
            startAngle={180}
            endAngle={0}
            innerRadius={130}
            outerRadius={180}
            positionFromYaxis={200}
            cellColors={["#14C9C9", "#F7BA1E", "#5AC2F7", "#F3F5F7"]}
            isSemiCircle={true}
            dataKey='count'
            width={450}
          />
        )}
      </CardContent>
      <CardActions>
        <Box
          className={`flex justify-start items-center w-full ${
            data?.thisWeekCount > 0 ? "text-success" : "text-red-500"
          } pl-2 pb-1`}
        >
          {isLoading ? (
            <div className='h-4' />
          ) : (
            <>
              {data?.thisWeekCount > 0 ? (
                <MdTrendingUp className='mr-2' />
              ) : (
                <MdTrendingDown className='mr-2' />
              )}
              <Typography
                fontSize={11}
                fontWeight={400}
                className={`text-center`}
              >
                {`${data?.thisWeekCount} completed this  ${selected?.replace(
                  /_/g,
                  " "
                )}`}
              </Typography>
            </>
          )}
        </Box>
      </CardActions>
    </Card>
  );
};
