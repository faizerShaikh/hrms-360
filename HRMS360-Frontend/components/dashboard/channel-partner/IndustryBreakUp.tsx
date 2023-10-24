import {
  Box,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CircularProgress,
  Grid,
  MenuItem,
  Typography,
} from "@mui/material";
import { Select } from "components/layout";
import { useGetAll } from "hooks/useGetAll";
import React, { useState } from "react";
import { MdTrendingDown, MdTrendingUp } from "react-icons/md";
import { SemiDonutChart } from "../SemiDonutChart";

export const IndustryBreakUp = ({
  cardStyles,
}: {
  cardStyles: { [key: string]: any };
}) => {
  const [selectedOption, setSelectedOption] = useState<any>("by_week");

  const {
    data: newData,
    refetch,
    isLoading,
  } = useGetAll({
    key: `/dashboard/channel-partner/industry-chart?range=${selectedOption}`,
  });

  return (
    <Grid item xs={6}>
      <Card>
        <CardHeader
          title='Tenant Breakup by Industry'
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
                setSelectedOption(e.target.value);
                refetch();
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
                newData?.industryCount.map((item: any) => ({
                  ...item,
                  value: item?.tenants?.length,
                })) || []
              }
              cellColors={[
                "#14C9C9",
                "#F7BA1E",
                "#6CBE45",
                "#00B4FF",
                "#F7941D",
              ]}
              innerRadius={60}
              outerRadius={90}
              isSemiCircle={false}
              dataKey='value'
            />
          )}
        </CardContent>
        <CardActions>
          {isLoading ? (
            <div className='h-4' />
          ) : (
            <Box
              className={`flex justify-start items-center w-full ${
                !newData?.percentage
                  ? "text-main"
                  : newData?.percentage >= 0
                  ? "text-success"
                  : "text-red-500"
              }`}
            >
              {!newData?.percentage ? (
                ``
              ) : (
                <>
                  {newData?.percentage >= 0 ? (
                    <>
                      <MdTrendingUp className='mr-2' />
                    </>
                  ) : (
                    <>
                      <MdTrendingDown className='mr-2' />
                    </>
                  )}
                </>
              )}

              <Typography
                fontSize={11}
                fontWeight={400}
                className={`text-center`}
              >
                {!newData?.percentage
                  ? `No Changes since last ${selectedOption?.replace(
                      /by_/g,
                      " "
                    )}`
                  : newData?.percentage >= 0
                  ? `${newData?.percentage.toFixed()}% greater then ${selectedOption?.replace(
                      /by_/g,
                      " "
                    )}`
                  : `${newData?.percentage.toFixed()}% less then ${selectedOption?.replace(
                      /by_/g,
                      " "
                    )}`}
              </Typography>
            </Box>
          )}
        </CardActions>
      </Card>
    </Grid>
  );
};
