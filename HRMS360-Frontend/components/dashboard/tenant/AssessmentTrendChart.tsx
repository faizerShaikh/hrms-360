import {
  Box,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Grid,
  Typography,
} from "@mui/material";

import { colors } from "constants/theme";
import { useGetAll } from "hooks/useGetAll";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import moment from "moment";
import { AssessmentSurveyDialog } from "./AssementSurveyDialog";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});
export const AssessmentTrendChart = ({ cardStyles }: { cardStyles: any }) => {
  const [survey, setSurvey] = useState<any>("");
  const { data } = useGetAll({
    key: `/dashboard/tenant/assessment-chart/${survey?.id}`,
    enabled: !!survey,
  });

  return (
    <Grid item xs={6}>
      <Card sx={{ boxShadow: `0px 2px 4px rgba(0, 0, 0, 0.1)` }}>
        <CardHeader
          title='Assessment Completion Trend'
          sx={{
            ...cardStyles,
            "& .MuiCardHeader-action": {
              width: "200px",
              textAlign: "right",
            },
            "& .MuiCardHeader-title": {
              paddingLeft: "0px",
            },
            "paddingRight": "20px",
          }}
          action={
            <AssessmentSurveyDialog
              setSurvey={setSurvey}
              selectedSurvey={survey}
            />
          }
        />
        <CardContent sx={{ height: "350px", paddingLeft: "0px" }}>
          {data && (
            <ReactApexChart
              series={[
                {
                  data: data.map((item: any) => item.count),
                  color: colors.primary.dark,
                },
              ]}
              type='area'
              height={"100%"}
              width={"100%"}
              options={{
                chart: {
                  type: "area",
                  height: 350,
                  toolbar: {
                    show: false,
                  },
                },

                dataLabels: {
                  enabled: false,
                },
                stroke: {
                  curve: "smooth",
                  colors: [colors.primary.dark],
                  width: 4,
                },

                fill: {
                  opacity: 0.3,
                  colors: [colors.primary.dark],
                },
                grid: {
                  show: false,
                },
                xaxis: {
                  type: "category",
                  categories: data.map((item: any) =>
                    moment(item.response_date).format("DD-MM-YYYY")
                  ),
                  labels: {
                    show: false,
                  },
                  group: {
                    style: {
                      fontSize: "14px",
                      fontWeight: 700,
                    },
                    groups: [
                      { title: "Week 1", cols: 7 },
                      { title: "Week 2", cols: 7 },
                      { title: "Week 3", cols: 6 },
                    ],
                  },
                },
              }}
            />
          )}
        </CardContent>
        <CardActions>
          <Box
            className={`flex justify-start items-center w-full text-light
                 pl-2 pb-1`}
          >
            <Typography
              fontSize={11}
              fontWeight={400}
              className={`text-center`}
            >
              {survey ? `Survey Name: ${survey?.title}` : "No Survey"}
            </Typography>
          </Box>
        </CardActions>
      </Card>
    </Grid>
  );
};
