import React from "react";
import {
  DataGrid,
  PageHeader,
  LinearProgressBar,
  StatusCard,
  Button,
  GenrateReports,
  Input,
} from "components";
import { NextPageContext } from "next";
import { RuleCancelled, View } from "@carbon/icons-react";
import NextLink from "next/link";
import { GridColumns, GridRenderCellParams } from "@mui/x-data-grid";
import { setApiHeaders } from "utils/setApiHeaders";
import { API, serverAPI } from "configs/api";
import { SurveyDescriptionInterface, SurveyStatus } from "interfaces/survey";
import { BaseProps } from "interfaces/base";
import { getFormattedDate } from "utils/getFormattedDate";
import { toast } from "utils/toaster";
import { useMutation } from "react-query";
import { Typography } from "@mui/material";
import { useGetAll } from "hooks/useGetAll";
import { onError } from "utils/onError";

export const getServerSideProps = async (ctx: NextPageContext) => {
  setApiHeaders(ctx);
  const res = await serverAPI.get("/survey", {
    params: {
      limit: 25,
      page: 0,
    },
  });
  const data: SurveyDescriptionInterface[] = res.data.data;

  return {
    props: {
      data,
    },
  };
};

const AllSurvey: BaseProps<SurveyDescriptionInterface[]> = ({ data }) => {
  interface dataTypes {
    id: string;
    status?: string;
    date?: string;
  }

  interface handlerType {
    id: string;
    name: string;
    value: any;
  }

  const { data: allSurvey, refetch } = useGetAll({
    key: `/survey`,
    enabled: false,
  });

  const Mutation = useMutation(
    (data: dataTypes) => API.put(`/survey/date/${data?.id}`, data),
    {
      onSuccess: () => {
        toast("Survey updated successfully");
        refetch();
      },
      onError: (error: any) => {
        onError(error);
        refetch();
      },
    }
  );

  const handleChange = (
    { id, name, value }: handlerType,
    row?: SurveyDescriptionInterface
  ) => {
    let data = { id: id, [name]: value, field: name };
    if (name === "end_date") {
      if (
        row &&
        row.status === "Closed" &&
        new Date(row.end_date).getTime() < new Date(value).getTime()
      ) {
        data["status"] = SurveyStatus.Ongoing;
      }
    }
    Mutation.mutate(data);
  };

  const columns: GridColumns<SurveyDescriptionInterface> = [
    {
      headerName: "Name of Survey",
      field: "title",
      flex: 2,
      minWidth: 250,
      cellClassName: "text-dark",
      renderCell: ({ row }: GridRenderCellParams) => (
        <NextLink href={`/survey/${row.id}`} className='underline'>
          <a className='underline'>{row.title}</a>
        </NextLink>
      ),
    },
    {
      headerName: "Start Date",
      field: "created_at",
      flex: 1,
      minWidth: 120,
      valueGetter({ value }) {
        return getFormattedDate(value);
      },
    },

    {
      headerName: "Assessments Due",
      field: "assessments_due",
      cellClassName: "flex justify-center",
      flex: 1,
      minWidth: 120,
    },
    {
      headerName: "Assessments Completed",
      field: "assessments_completed",
      cellClassName: "flex justify-center",
      flex: 1,
      minWidth: 120,
    },
    {
      headerName: "Progress",
      field: "progress",
      flex: 1,
      minWidth: 180,
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
            <span className='pl-2 w-[25px]'>{per.toFixed()} %</span>
          </>
        );
      },
    },
    {
      headerName: "Survey Stage",
      field: "status",
      flex: 1.2,
      minWidth: 250,
      headerAlign: "center",
      align: "center",
      renderCell: ({ row }: GridRenderCellParams) => (
        <StatusCard
          text={row?.status}
          variant={row?.status?.toLowerCase()?.replace(/ /g, "_")}
        />
      ),
    },
    {
      headerName: "Respondant Nominee Cut-off Date",
      field: "respondant_cut_off_date",
      flex: 1.5,
      minWidth: 240,
      renderCell: (params: GridRenderCellParams) => (
        <>
          {[
            "terminated",
            "completed",
            "closed",
            "ongoing",
            "pending approval",
          ].includes(params.row?.status?.toLowerCase()) ? (
            <p className='ml-3'>
              {getFormattedDate(params.row?.respondant_cut_off_date, true)}
            </p>
          ) : (
            <Input
              type={"datetime-local"}
              defaultValue={params.row?.respondant_cut_off_date}
              onBlur={(value) =>
                handleChange(
                  {
                    id: params.row?.id,
                    name: "respondant_cut_off_date",
                    value: value.target.value,
                  },
                  params.row
                )
              }
            />
          )}
        </>
      ),
    },
    {
      headerName: "LM approval cut-off Date",
      field: "lm_approval_cut_off_date",
      flex: 1.5,
      minWidth: 240,
      renderCell: (params: GridRenderCellParams) => (
        <>
          {["terminated", "completed", "closed", "ongoing"].includes(
            params.row?.status?.toLowerCase()
          ) ? (
            <p className='ml-3'>
              {getFormattedDate(params.row?.lm_approval_cut_off_date, true)}
            </p>
          ) : (
            <Input
              type={"datetime-local"}
              defaultValue={params.row?.lm_approval_cut_off_date}
              onBlur={(value) =>
                handleChange(
                  {
                    id: params.row?.id,
                    name: "lm_approval_cut_off_date",
                    value: value.target.value,
                  },
                  params.row
                )
              }
            />
          )}
        </>
      ),
    },
    {
      headerName: "End Date",
      field: "end_date",
      flex: 1.5,
      minWidth: 240,
      renderCell: (params: GridRenderCellParams) => {
        return (
          <>
            {params.row?.status?.toLowerCase() === "terminated" ||
            params.row?.status?.toLowerCase() === "completed" ? (
              <p className='ml-3'>
                {getFormattedDate(params.row?.end_date, true)}
              </p>
            ) : (
              <Input
                type={"datetime-local"}
                defaultValue={params.row?.end_date}
                onBlur={(value) =>
                  handleChange(
                    {
                      id: params.row?.id,
                      name: "end_date",
                      value: value.target.value,
                    },
                    params.row
                  )
                }
              />
            )}
          </>
        );
      },
    },

    {
      headerName: "Action",
      field: "actions",
      flex: 1,
      minWidth: 300,
      renderCell: ({ row }: GridRenderCellParams) => (
        <>
          <div className='flex items-center justify-evenly'>
            <NextLink href={`/survey/${row.id}`} passHref>
              <Button
                startIcon={<View />}
                className='xl:text-sm 2xl:text-semi-base capitalize'
                variant='text'
              >
                View
              </Button>
            </NextLink>
            {row.status === "Closed" && <GenrateReports id={row.id} />}
            {!["completed", "terminated", "closed"].includes(
              row?.status?.toLowerCase()
            ) && (
              <>
                <div className='border rounded-xl py-2 mx-3'></div>
                <Button
                  variant='text'
                  onClick={() =>
                    handleChange({
                      id: row?.id,
                      name: "status",
                      value: "Terminated",
                    })
                  }
                  sx={{ color: "#f64459" }}
                  startIcon={<RuleCancelled size={16} color='#f64459' />}
                >
                  <Typography className='capitalize xl:text-sm 2xl:text-semi-base'>
                    Terminate
                  </Typography>
                </Button>
              </>
            )}
          </div>
        </>
      ),
    },
  ];

  return (
    <>
      <PageHeader title='All Survey' />
      <DataGrid columns={columns} rows={allSurvey || data} url='/survey' />
    </>
  );
};

export default AllSurvey;
