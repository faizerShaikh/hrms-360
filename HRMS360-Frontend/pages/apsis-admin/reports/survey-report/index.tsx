import { Download } from "@carbon/icons-react";
import { Box, MenuItem, SelectChangeEvent } from "@mui/material";
import { GridColumns } from "@mui/x-data-grid";
import {
  Button,
  DataGrid,
  DatePicker,
  Label,
  PageHeader,
  Select,
} from "components/layout";
import dayjs, { Dayjs } from "dayjs";

import { useGetAll } from "hooks/useGetAll";

import { useState } from "react";
import { BsArrowRight } from "react-icons/bs";
import { onError } from "utils/onError";

const columns: GridColumns = [
  { headerName: "Survey Name", field: "survey_name", minWidth: 200 },
  { headerName: "Survey Status", field: "survey_status", minWidth: 200 },
  {
    headerName: "Survey Month",
    field: "survey_month",
    minWidth: 200,
  },
  {
    headerName: "Survey Year",
    field: "survey_year",
    minWidth: 200,
    cellClassName: "capitalize",
  },
  {
    headerName: "Tenant Name",
    field: "tenant_name",
    minWidth: 250,
  },
  {
    headerName: "Channel Partner Name",
    field: "channel_partner_name",
    minWidth: 250,
  },
  {
    headerName: "Ratee Count",
    field: "ratee_count",
    minWidth: 150,
  },
  {
    headerName: "Rater Count",
    field: "rater_count",
    minWidth: 200,
  },
  {
    headerName: "Line Manager Approval (Y/N)",
    field: "line_manager_approval",

    minWidth: 250,
  },

  {
    headerName: "Total Participation",
    field: "total_participation",

    minWidth: 250,
  },
  {
    headerName: "% Participation",
    field: "participation_percentage",
    minWidth: 200,
  },
];
const AdminSurveyReports = () => {
  const [selected, setSelected] = useState<string>("Till Date");
  const [fromDate, setFromDate] = useState<Dayjs>(dayjs().subtract(1, "M"));
  const [toDate, setToDate] = useState<Dayjs>(dayjs());
  const [isMonthRange, setMonthRange] = useState<boolean>(false);
  const [surveyData, setSurveyData] = useState<any>(null);

  const { data, refetch, isLoading, isFetching } = useGetAll({
    key: isMonthRange
      ? `/admin-reports/all-surveys-report-monthly?start_month=${fromDate}&end_month=${toDate}`
      : "/admin-reports/all-surveys-report",
    enabled: false,
  });

  const onSelectChange = (e: SelectChangeEvent<any>) => {
    e.stopPropagation();
    setSelected(`${e.target.value}`);
    if (e.target.value === "Month range") {
      setMonthRange(true);
      setSurveyData(null);
    } else {
      setMonthRange(false);
      setSurveyData(null);
    }
  };

  const dowloadReport = () => {
    let a = document.createElement("a");

    a.href = `${process.env.NEXT_PUBLIC_API_URL?.split("/api/v1")[0]}${
      data?.file_path
    }`;

    a.target = "_blank";
    a.download =
      data?.file_path.split("/")[data?.file_path.split("/")?.length - 1];
    a.click();
  };

  const generateReport = () => {
    refetch()
      .then((value) => {
        setSurveyData(value.data?.data);
      })
      .catch((error) => {
        onError(error);
      });
  };

  return (
    <>
      <PageHeader title='Survey Report' />
      <DataGrid
        rows={surveyData || []}
        columns={columns || []}
        key={surveyData}
        addButton={
          <Box
            key={surveyData}
            className='flex justify-between items-center w-full'
          >
            <Box className='flex justify-start items-center gap-4'>
              <Select
                sx={{ width: "150px", height: "36px" }}
                onChange={onSelectChange}
                border={false}
                value={selected}
                defaultValue={selected}
                className='text-sm'
              >
                {["Till Date", "Month range"].map(
                  (element: string, index: number) => (
                    <MenuItem
                      value={element}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      key={`${element + index}`}
                      className='capitalize text-sm'
                    >
                      {element}
                    </MenuItem>
                  )
                )}
              </Select>
              {isMonthRange && (
                <Box className='flex items-center justify-between'>
                  <Label className='mr-3' text='From Date :' />
                  <DatePicker
                    onChange={(value) => {
                      setFromDate(value);
                    }}
                    value={fromDate}
                  />
                  <BsArrowRight className='mx-3' />
                  <Label className='mr-3' text='To Date :' />
                  <DatePicker
                    onChange={(value) => {
                      setToDate(value);
                    }}
                    value={toDate}
                    fromDate={fromDate}
                  />
                </Box>
              )}
            </Box>
            <div>
              <Button
                className='mr-4 h-9 capitalize xl:text-sm 2xl:text-semi-base'
                onClick={() => {
                  generateReport();
                }}
                isLoading={isLoading || isFetching}
              >
                Get Data
              </Button>
              {surveyData && (
                <Button
                  className=' h-9 capitalize xl:text-sm 2xl:text-semi-base'
                  type='submit'
                  color='secondary'
                  startIcon={<Download />}
                  onClick={() => {
                    dowloadReport();
                  }}
                  key={surveyData}
                  disabled={!data?.file_path}
                >
                  Report
                </Button>
              )}
            </div>
          </Box>
        }
      />
    </>
  );
};

export default AdminSurveyReports;
