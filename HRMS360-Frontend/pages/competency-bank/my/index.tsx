import React from "react";
import { DataGrid, DeleteBox, PageHeader, Button } from "components";
import { NextPageContext } from "next";
import { Add, Edit } from "@carbon/icons-react";
import { Tooltip, Typography } from "@mui/material";
import NextLink from "next/link";
import {
  GridColumns,
  GridRenderCellParams,
  GridValueGetterParams,
} from "@mui/x-data-grid";
import { setApiHeaders } from "utils/setApiHeaders";
import { serverAPI } from "configs/api";
import { CompetencyInterface } from "interfaces/competency-bank";
import { BaseProps } from "interfaces/base";
import { getFormattedDate } from "utils/getFormattedDate";
import { InfoIcon } from "utils/Icons";
import { getCookie } from "cookies-next";

export const getServerSideProps = async (ctx: NextPageContext) => {
  setApiHeaders(ctx);
  let is_NBOL = getCookie("is_NBOL", {
    req: ctx.req,
    res: ctx.res,
  });
  const res = await serverAPI.get(
    is_NBOL ? "/competency" : "/competency/by-type/custom",
    {
      params: {
        limit: 25,
        page: 0,
      },
    }
  );

  const data: Array<CompetencyInterface> = res.data.data;
  return {
    props: { data, is_NBOL },
  };
};

const columns: GridColumns = [
  {
    headerName: "Competencies",
    field: "title",
    minWidth: 250,
    cellClassName: "text-dark",
  },
  {
    headerName: "No. of Questions",
    field: "no_of_questions",
    cellClassName: "flex justify-center",
    minWidth: 140,
  },
  {
    headerName: "Description",
    field: "description",
    minWidth: 250,
    flex: 3,
    renderCell: ({ row }: GridRenderCellParams) => (
      <div className='flex justify-left items-center w-full pr-3'>
        <Tooltip arrow title={row.description}>
          <span className='mr-2'>
            <InfoIcon className='my-auto block' />
          </span>
        </Tooltip>
        <p className='break-all truncate text-main'>{row.description}</p>
      </div>
    ),
  },
  {
    headerName: "Date of Creation",
    field: "createdAt",
    minWidth: 200,
    valueGetter: ({ row }: GridValueGetterParams) =>
      getFormattedDate(row?.createdAt),
  },
  {
    headerName: "Action",
    field: "actions",
    minWidth: 230,
    renderCell: ({ row }: GridRenderCellParams) => (
      <div className='flex items-center'>
        <NextLink href={`my/${row.id}`}>
          <Button variant='text' startIcon={<Edit />}>
            <Typography className='capitalize xl:text-sm 2xl:text-semi-base'>
              view/Edit
            </Typography>
          </Button>
        </NextLink>
        <div className='border rounded-xl py-2 mx-3'></div>
        <DeleteBox
          data={row.id}
          url='/competency'
          refetchUrl='/competency/by-type/custom'
          title='Competency'
        >
          Are You sure do you want to delete this Competency?
        </DeleteBox>
      </div>
    ),
  },
];

const MyCompentency: BaseProps<
  Array<CompetencyInterface>,
  { is_NBOL: boolean }
> = ({ data, is_NBOL }) => {
  return (
    <>
      <PageHeader title='My Competencies' />
      <DataGrid
        columns={columns}
        rows={data}
        url={is_NBOL ? "/competency" : "/competency/by-type/custom"}
        addButton={
          !is_NBOL && (
            <NextLink href='/competency-bank/add'>
              <Button
                variant='outlined'
                startIcon={<Add size='24' />}
                className='px-4 capitalize text-base h-9  xl:text-sm 2xl:text-base'
              >
                New Competency
              </Button>
            </NextLink>
          )
        }
      />
    </>
  );
};

export default MyCompentency;
