import React from "react";
import { DataGrid, PageHeader } from "components";
import { NextPageContext } from "next";
import { GridColumns, GridRenderCellParams } from "@mui/x-data-grid";
import { StatusCard } from "components/layout/cards/StatusCard";
import { serverAPI } from "configs/api";
import { setApiHeaders } from "utils/setApiHeaders";
import { BaseProps } from "interfaces/base";
import { useSetNavbarTitle } from "hooks/useSetNavbarTitle";
import { getFormattedDate } from "utils/getFormattedDate";

export const getServerSideProps = async (ctx: NextPageContext) => {
  setApiHeaders(ctx);
  const res = await serverAPI.get(`/survey/respondents/${ctx.query.surveyId}`);
  const data: any[] = res.data.data.users;
  let survey: any = res.data.data.survey;
  return {
    props: { data, survey },
  };
};

const columns: GridColumns = [
  {
    headerName: "Employee Name",
    field: "name",
    flex: 1,
    minWidth: 200,
    renderCell: ({ row }: GridRenderCellParams) => (
      <div className='flex flex-col py-4 w-full'>
        <p className={`m-0 text-dark	`}>{row?.respondant_name || row?.name}</p>
        <p className={`m-0 text-main truncate`}>{row?.designation?.name}</p>
      </div>
    ),
  },
  {
    headerName: "Respondent Details",
    field: "email",
    flex: 1,
    minWidth: 250,
    renderCell: ({ row }: GridRenderCellParams) => (
      <div className='flex flex-col py-4 w-full'>
        <p className={`m-0 text-main`}>{row?.respondant_email || row?.email}</p>
        <p className={`m-0 text-main`}>{row?.contact}</p>
      </div>
    ),
  },
  {
    headerName: "Relationship with Employee",
    field: "respondant",
    flex: 1,
    valueGetter({ value, row }) {
      return row?.rater?.name || value?.rater?.name;
    },
  },
  {
    headerName: "Survey Status",
    field: "status",
    flex: 1,
    align: "center",
    headerAlign: "center",
    minWidth: 250,
    renderCell: ({ row }: GridRenderCellParams) => {
      let status: any = row?.status || row?.respondant?.status;
      return (
        <StatusCard
          text={status}
          variant={status?.toLocaleLowerCase().replace(/ /g, "_")}
        />
      );
    },
  },
  {
    headerName: "Response Date",
    field: "response_date",
    flex: 1,
    valueGetter({ row }) {
      let value = row?.response_date || row?.respondant?.response_date;
      return value ? getFormattedDate(value) : "-";
    },
  },
];

const MySurvey: BaseProps<any[], { survey: any }> = ({ data, survey }) => {
  useSetNavbarTitle(
    ` ${survey.survey_description.title}/ ${survey.employee.name}`
  );

  return (
    <>
      <PageHeader title={survey.survey_description.title} />
      <DataGrid columns={columns} rows={data} noSearch rowHeight={60} />
    </>
  );
};

export default MySurvey;
