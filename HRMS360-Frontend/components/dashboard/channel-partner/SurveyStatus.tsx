import {
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CircularProgress,
  MenuItem,
  Typography,
} from "@mui/material";
import { Box } from "@mui/system";
import { Select } from "components/layout";
import { useGetAll } from "hooks/useGetAll";
import React, { useMemo, useState } from "react";
import { MdTrendingDown, MdTrendingUp } from "react-icons/md";
import { cardStyles } from "../DashboardCard";
import { SemiDonutChart } from "../SemiDonutChart";

export const SurveyStatus = ({ data }: { data: any }) => {
  const [surveyOption, setSurveyOption] = useState<any>("by_week");

  const { data: surveyData, isLoading } = useGetAll({
    key: `/dashboard/channel-partner/survey-count-chart?range=${surveyOption}`,
    enabled: surveyOption !== "by_week",
  });

  let newData = useMemo(() => {
    if (surveyOption === "by_week") {
      return data;
    } else {
      return surveyData;
    }
  }, [surveyData, surveyOption, data]);

  return (
    <Card>
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
            onChange={(e) => {
              setSurveyOption(e.target.value);
            }}
          >
            <MenuItem value='by_week'>By Week</MenuItem>
            <MenuItem value='by_month'>By Month</MenuItem>
            <MenuItem value='by_year'>By Year</MenuItem>
          </Select>
        }
      />
      <CardContent sx={{ height: "280px" }}>
        {isLoading ? (
          <div className='flex justify-center items-center h-full'>
            <CircularProgress />
          </div>
        ) : (
          <SemiDonutChart
            data={
              newData
                ? newData?.pieChart?.map((e: any) => {
                    return {
                      name: e.name?.replace(/_/g, " "),
                      count: e?.count,
                    };
                  })
                : []
            }
            startAngle={180}
            endAngle={0}
            innerRadius={90}
            outerRadius={120}
            positionFromYaxis={130}
            cellColors={["#6CBE45", "#F7941D"]}
            isSemiCircle={true}
            dataKey='count'
            // url="/dashboard/channel-partner/industry-chart"
          />
        )}
      </CardContent>
      {isLoading ? (
        <div className='h-8' />
      ) : (
        newData &&
        newData?.thisWeekCount !== null &&
        typeof newData?.thisWeekCount !== "undefined" && (
          <CardActions>
            <Box
              className={`flex justify-start items-center w-full ${
                newData?.thisWeekCount > 0 ? "text-success" : "text-red-500"
              }`}
            >
              {newData?.thisWeekCount > 0 ? (
                <MdTrendingUp className='mr-2' />
              ) : (
                <MdTrendingDown className='mr-2' />
              )}
              <Typography
                fontSize={11}
                fontWeight={400}
                className={`text-center`}
              >
                {`${
                  newData?.thisWeekCount
                } completed this  ${surveyOption?.replace(/_/g, " ")}`}
              </Typography>
            </Box>
          </CardActions>
        )
      )}
    </Card>
  );
};
