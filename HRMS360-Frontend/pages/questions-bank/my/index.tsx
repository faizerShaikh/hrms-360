import React from "react";
import { DataGrid, DeleteBox, PageHeader, Button } from "components";
import { NextPageContext } from "next";
import { Add, Edit, View } from "@carbon/icons-react";
import { Tooltip, Typography } from "@mui/material";
import NextLink from "next/link";
import { GridRenderCellParams, GridValueGetterParams } from "@mui/x-data-grid";
import { BaseProps, QuestionnaireInterface } from "interfaces";
import { setApiHeaders, getFormattedDate } from "utils";
import { serverAPI } from "configs";
import { InfoIcon } from "utils/Icons";

export const getServerSideProps = async (ctx: NextPageContext) => {
  setApiHeaders(ctx);
  const res = await serverAPI.get("/questionnaire", {
    params: {
      limit: 25,
      page: 0,
    },
  });
  const data: QuestionnaireInterface[] = res.data.data;
  return { props: { data } };
};

const columns = [
  {
    headerName: "Questionnaire",
    field: "title",
    flex: 2,
    cellClassName: "text-dark",
  },
  {
    headerName: "No. of Questions",
    field: "no_of_questions",
    cellClassName: "flex justify-center",
    flex: 1,
    minWidth: 140,
  },
  {
    headerName: "Description",
    field: "description",
    minWidth: 260,
    flex: 3,
    renderCell: ({ row }: GridRenderCellParams) => (
      <div className='flex justify-left items-center w-full pr-3'>
        <Tooltip arrow title={row.description}>
          <span className='mr-2'>
            {" "}
            <InfoIcon className='my-auto block' />
          </span>
        </Tooltip>
        <p className='break-all truncate text-main'>{row.description}</p>
      </div>
    ),
  },
  {
    headerName: "Date",
    field: "created_at",
    flex: 1,
    minWidth: 150,
    valueGetter: ({ row }: GridValueGetterParams) =>
      getFormattedDate(row?.createdAt),
  },
  {
    headerName: "Action",
    field: "actions",
    flex: 1.5,
    minWidth: 230,
    renderCell: ({ row }: GridRenderCellParams) => (
      <div className='flex items-center'>
        <NextLink href={`/questions-bank/my/view/${row.id}`}>
          <Button variant='text' startIcon={<View />}>
            <Typography className='capitalize xl:text-sm 2xl:text-semi-base'>
              view
            </Typography>
          </Button>
        </NextLink>
        <NextLink href={`/questions-bank/my/${row.id}`}>
          <Button variant='text' startIcon={<Edit />}>
            <Typography className='capitalize xl:text-sm 2xl:text-semi-base'>
              Edit
            </Typography>
          </Button>
        </NextLink>
        <div className='border rounded-xl py-2 mx-3'></div>
        <DeleteBox data={row.id} url='/questionnaire' title='Questionnaire'>
          Are You sure do you want to delete this Questionnaire?
        </DeleteBox>
      </div>
    ),
  },
];

const MyQuestionnaire: BaseProps<Array<QuestionnaireInterface>> = ({
  data,
}) => {
  return (
    <>
      <PageHeader title='My Questionnaire' />
      <DataGrid
        columns={columns}
        rows={data}
        url='/questionnaire'
        addButton={
          <NextLink href='/questions-bank/add'>
            <Button
              variant='outlined'
              startIcon={<Add size='24' />}
              className='px-4 capitalize xl:text-sm  2xl:text-semi-base h-9'
            >
              New Questionnaire
            </Button>
          </NextLink>
        }
      />
    </>
  );
};

export default MyQuestionnaire;
