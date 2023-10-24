import { ArrowUpRight } from "@carbon/icons-react";
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
import { colors } from "constants/theme";
import { useGetAll } from "hooks/useGetAll";
import { useEffect, useState } from "react";
import { MdTrendingDown, MdTrendingUp } from "react-icons/md";
import { SparklineChart } from "./SparklineChart";

export const cardStyles = {
  ".MuiCardHeader-title": {
    fontSize: {
      sm: "12px",
      md: "13px",
      lg: "14px",
      xl: "16px",
    },
    fontWeight: "500",
    paddingLeft: "16px",
    boxSizing: "border-box",
    color: "#242424",
  },
  ".MuiCard-root": {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxShadow: `0px 2px 4px rgba(0, 0, 0, 0.2)`,
  },
  ".MuiCardHeader-action": {
    fontSize: "14px",
    width: "100px",
  },
  "& .MuiTypography-root": {
    fontFamily: "'Century Gothic', 'sans-serif'",
  },
};

interface dashboardData {
  title: string;
  count: number;
  sortAllowed?: boolean;
  isIncreased: boolean | null;
  text?: string;
  data?: any | undefined;
  categories?: string[];
  menuItems?: string[];
  chartColor?: string[];
  hideChart?: boolean;
  url?: string;
}

export const DashboardCard = ({
  title,
  count,
  sortAllowed = false,
  data,
  text,
  menuItems = [],
  categories,
  hideChart = false,
  url,
  chartColor,
  isIncreased,
}: dashboardData) => {
  const [selected, setSelected] = useState("by_week");

  const [isIncrease, setIncreased] = useState<boolean | null>(null);
  const [myText, setText] = useState<string | undefined>("");

  let { data: newData, isLoading } = useGetAll({
    key: `${url}`,
    params: { range: selected },
    enabled: selected !== "by_week",
    onSuccess(data) {
      if (data?.current === data?.last) {
        setIncreased(null);
        setText(`No changes since last ${selected?.replace(/_/g, " ")}`);
      } else if (data?.current < data?.last) {
        setIncreased(false);
        setText(
          `${
            parseInt(`${Math.abs(data?.percentage)}`) || 0
          }%  lower than last  ${selected?.replace(/_/g, " ")}`
        );
      } else {
        setIncreased(true);
        setText(
          `${
            parseInt(`${Math.abs(data?.percentage)}`) || 0
          }%  greater than last  ${selected?.replace(/_/g, " ")}`
        );
      }
    },
  });

  useEffect(() => {
    setIncreased(isIncreased);
    setText(text);
  }, [isIncreased, text]);

  return (
    <>
      <Card sx={{ ...cardStyles[".MuiCard-root"] }} className='pt-0'>
        <CardHeader
          className={hideChart ? " " : "py-4 pr-2 pl-0"}
          title={title}
          sx={
            data != undefined
              ? { ...cardStyles }
              : { ...cardStyles, textAlign: "center", paddingLeft: 0 }
          }
          action={
            sortAllowed && (
              <Select
                value={selected}
                autoWidth
                sx={{
                  "width": "90px",
                  "& .MuiSelect-select": {
                    paddingBottom: "6px",
                  },
                }}
                border={false}
                onChange={async (e) => {
                  e.stopPropagation();
                  if (`${e.target.value}` === "by_week") {
                    setIncreased(isIncreased);
                    setText(text);
                    newData = undefined;
                  }
                  setSelected(`${e.target.value}`);
                }}
                defaultValue={menuItems[0]}
                className='capitalize'
              >
                {menuItems.map((ele: string, index: number) => (
                  <MenuItem
                    value={ele}
                    onClick={(e) => e.stopPropagation()}
                    key={`${ele + index}`}
                    className='capitalize text-xs'
                  >
                    {ele?.replace(/_/g, " ")}
                  </MenuItem>
                ))}
              </Select>
            )
          }
        />
        {isLoading ? (
          <div className='flex justify-center items-center h-full'>
            <CircularProgress />
          </div>
        ) : (
          <CardContent className={hideChart ? "p-3" : "py-3 pr-3 pl-0"}>
            <Grid container direction='row'>
              <Grid item xs={hideChart ? 12 : 4} className='flex items-center'>
                <Grid
                  direction='row'
                  container
                  className={"items-center justify-center flex"}
                >
                  <Grid item>
                    <Typography fontSize={24} fontWeight={700}>
                      {newData?.total || count}
                    </Typography>
                  </Grid>
                  <Grid
                    item
                    style={{
                      backgroundColor: `${colors.secondary.light}`,
                      borderRadius: "4px",
                      display: "grid",
                      placeContent: "center",
                      marginLeft: "8px",
                      height: "24px",
                      width: "24px",
                    }}
                  >
                    <ArrowUpRight size={24} fill={colors.secondary.dark} />
                  </Grid>
                </Grid>
              </Grid>
              {!hideChart && (
                <Grid
                  item
                  xs={8}
                  sx={{
                    height: "50px",
                    width: "100%",
                  }}
                  className='flex justify-end items-center'
                >
                  <SparklineChart
                    data={newData?.data || data || []}
                    categories={newData?.categories || categories || []}
                    colors={chartColor || []}
                  />
                </Grid>
              )}
            </Grid>
          </CardContent>
        )}
        {isLoading ? (
          <div className='h-4'></div>
        ) : (
          <CardActions className={`${hideChart ? "" : "pl-0"}`}>
            <Box
              className={`flex justify-start items-center w-full ${
                isIncrease === null
                  ? "text-main"
                  : isIncrease
                  ? "text-success"
                  : "text-red-500"
              }`}
            >
              <Typography
                fontSize={11}
                fontWeight={400}
                className={`text-center  ${
                  hideChart ? "w-full" : "ml-4 flex items-center"
                }`}
              >
                {isIncrease === null ? (
                  ""
                ) : isIncrease ? (
                  <MdTrendingUp size={14} className='mr-1' />
                ) : (
                  <MdTrendingDown size={14} className='mr-1' />
                )}{" "}
                {myText}
              </Typography>
            </Box>
          </CardActions>
        )}
      </Card>
    </>
  );
};
