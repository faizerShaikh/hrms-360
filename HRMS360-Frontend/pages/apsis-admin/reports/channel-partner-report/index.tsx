import { Download } from "@carbon/icons-react";
import { Box, MenuItem, SelectChangeEvent } from "@mui/material";

import { GridColumns } from "@mui/x-data-grid";
import {
  Button,
  DataGrid,
  Label,
  PageHeader,
  Select,
  DatePicker,
} from "components/layout";
import dayjs, { Dayjs } from "dayjs";
import { useGetAll } from "hooks/useGetAll";
import { useState } from "react";
import { BsArrowRight } from "react-icons/bs";
import { onError } from "utils/onError";

const columns: GridColumns = [
  {
    headerName: "Channel Partner Name",
    field: "channel_partner",
    minWidth: 250,
  },
  {
    headerName: "Last Activation Date",
    field: "last_activation_date",
    type: "date",
    minWidth: 250,
  },
  {
    headerName: "Status",
    field: "status",
    minWidth: 250,
  },
  {
    headerName: "Total Tenants",
    field: "total_tenants",
    minWidth: 250,
  },
  {
    headerName: "Active Tenant Count",
    field: "active_tenant_count",
    minWidth: 250,
    valueGetter(params) {
      return params.row.active_tenant_count ?? "0";
    },
  },
  {
    headerName: "Inactive Tenant Count",
    field: "inactive_tenant_count",
    minWidth: 250,
    valueGetter(params) {
      return params.row.inactive_tenant_count ?? "0";
    },
  },

  {
    headerName: "Total Users Onboarded",
    field: "total_users_onboarded",
    minWidth: 250,
  },
  {
    headerName: "Surveys Launched",
    field: "surveys_launched",
    minWidth: 250,
  },
  {
    headerName: "Surveys Ongoing",
    field: "surveys_ongoing",
    minWidth: 250,
  },
  {
    headerName: "Surveys Completed",
    field: "surveys_completed",
    minWidth: 250,
  },
  {
    headerName: "Surveys Terminated",
    field: "surveys_terminated",
    minWidth: 250,
  },
  {
    headerName: " Ratee Count",
    field: "ratee_count",
    minWidth: 250,
  },
  {
    headerName: "Rater Count",
    field: "rater_count",
    minWidth: 250,
  },
  {
    headerName: "Total Participation",
    field: "total_participant_count",
    minWidth: 250,
  },
];

const AdminChannelPartnerReports = () => {
  const [selected, setSelected] = useState<string>("Till Date");
  const [fromDate, setFromDate] = useState<Dayjs>(dayjs().subtract(1, "M"));
  const [toDate, setToDate] = useState<Dayjs>(dayjs());
  const [isMonthRange, setMonthRange] = useState<boolean>(false);
  const [channelPartnerData, setChannelPartnerData] = useState<any>(null);

  const onSelectChange = (e: SelectChangeEvent<any>) => {
    e.stopPropagation();
    setSelected(`${e.target.value}`);
    if (e.target.value === "Month range") {
      setMonthRange(true);
      setChannelPartnerData(null);
    } else {
      setMonthRange(false);
      setChannelPartnerData(null);
    }
  };

  const { data, refetch, isLoading, isFetching } = useGetAll({
    key: isMonthRange
      ? `/admin-reports/channel-partner-report-monthly?start_month=${fromDate.toDate()}&end_month=${toDate.toDate()}`
      : "/admin-reports/channel-partner-report-till-date",
    enabled: false,
  });

  const dowloadReport = () => {
    let a = document.createElement("a");

    a.href = `${process.env.NEXT_PUBLIC_API_URL?.split("/api/v1")[0]}${
      data?.file_path
    }`;

    a.target = "_blank";
    a.download =
      data?.file_path?.split("/")[data?.file_path.split("/")?.length - 1];
    a.click();
  };

  const generateReport = () => {
    refetch()
      .then((value) => {
        setChannelPartnerData(value.data?.data);
      })
      .catch((error) => {
        onError(error);
      });
  };

  return (
    <>
      <PageHeader title='Channel Partner Report' />
      <DataGrid
        rows={channelPartnerData || []}
        columns={columns || []}
        noSearch={false}
        addButton={
          <Box
            key={channelPartnerData}
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
              {channelPartnerData && (
                <Button
                  className=' h-9 capitalize xl:text-sm 2xl:text-semi-base'
                  type='submit'
                  color='secondary'
                  startIcon={<Download />}
                  onClick={() => {
                    dowloadReport();
                  }}
                  key={channelPartnerData}
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

export default AdminChannelPartnerReports;
