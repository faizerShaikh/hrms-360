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
  {
    headerName: "Tenant Name",
    field: "tenant_name",
    minWidth: 200,
  },
  {
    headerName: "Tenant Type",
    field: "tenant_type",
    minWidth: 200,
  },
  {
    headerName: "Channel Partner",
    field: "channel_partner",
    minWidth: 200,
  },
  {
    headerName: "Tenant Status",
    field: "tenant_status",
    minWidth: 200,
  },
  {
    headerName: "No.of times re-activated",
    field: "no_of_reactivation",
    minWidth: 200,
  },
  {
    headerName: "Last Onboarding Date",
    field: "last_onboarding_date",
    minWidth: 200,
  },
  {
    headerName: "Tenant Expiry Date",
    field: "tenant_expiry_date",
    type: "date",
    minWidth: 200,
  },
  {
    headerName: "Activation Tenure",
    field: "activation_tenure",
    minWidth: 200,
  },
  {
    headerName: "Organization Admin",
    field: "admin_name",
    minWidth: 250,
    valueGetter(params) {
      return params.row.admin_name ?? "-";
    },
  },
  {
    headerName: "Organization Admin email Id",
    field: "email",
    minWidth: 250,
    valueGetter(params) {
      return params.row.admin_email ?? "-";
    },
  },
  {
    headerName: "Count of Employees",
    field: "employee_count",
    minWidth: 200,
  },
  {
    headerName: "Surveys Launched",
    field: "surveys_launched",
    minWidth: 200,
  },
  {
    headerName: "Surveys Ongoing",
    field: "surveys_ongoing",
    minWidth: 200,
  },
  {
    headerName: "Surveys Terminated",
    field: "surveys_terminated",
    minWidth: 200,
  },
  {
    headerName: "Surveys Completed",
    field: "surveys_completed",
    minWidth: 200,
  },
  {
    headerName: "Ratee Count",
    field: "ratee_count",
    minWidth: 200,
  },
  {
    headerName: "Rater Count",
    field: "rater_count",
    minWidth: 200,
  },
  {
    headerName: "Total Participant Count",
    field: "total_participant_count",
    minWidth: 200,
  },
  //
];

const AdmintTenantReports = () => {
  const [selected, setSelected] = useState<string>("Till Date");
  const [fromDate, setFromDate] = useState<Dayjs>(dayjs().subtract(1, "M"));
  const [toDate, setToDate] = useState<Dayjs>(dayjs());
  const [isMonthRange, setMonthRange] = useState<boolean>(false);
  const [tenantData, setTenantData] = useState<any>(null);

  const onSelectChange = (e: SelectChangeEvent<any>) => {
    e.stopPropagation();
    setSelected(`${e.target.value}`);
    if (e.target.value === "Month range") {
      setMonthRange(true);
      setTenantData(null);
    } else {
      setMonthRange(false);
      setTenantData(null);
    }
  };

  const {
    data,
    refetch,
    isLoading,
    error: Error,
    isFetching,
  } = useGetAll({
    key: isMonthRange
      ? `/admin-reports/tenant-wise-report-monthly?start_month=${fromDate.toDate()}&end_month=${toDate.toDate()}`
      : "/admin-reports/tenant-wise-report-till-date",
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
        setTenantData(value.data?.data);
      })
      .catch((_) => {
        onError(Error);
      });
  };

  return (
    <>
      <PageHeader title='Tenant Report' />
      <DataGrid
        loading={isLoading || isFetching}
        rows={tenantData ? tenantData : []}
        key={tenantData}
        columns={columns || []}
        noSearch={false}
        addButton={
          <Box
            key={tenantData}
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
              {tenantData && (
                <Button
                  className=' h-9 capitalize xl:text-sm 2xl:text-semi-base'
                  type='submit'
                  color='secondary'
                  startIcon={<Download />}
                  onClick={() => {
                    dowloadReport();
                  }}
                  key={tenantData}
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

export default AdmintTenantReports;
