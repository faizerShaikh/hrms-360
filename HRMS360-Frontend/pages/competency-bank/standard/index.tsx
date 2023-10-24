import React from "react";
import { DataGrid, DeleteBox, PageHeader, Button } from "components";
import { NextPageContext } from "next";
import { Add, Edit, View } from "@carbon/icons-react";
import { Tooltip, Typography } from "@mui/material";
import NextLink from "next/link";
import { GridColumns, GridRenderCellParams } from "@mui/x-data-grid";
import { setApiHeaders } from "utils/setApiHeaders";
import { serverAPI } from "configs/api";
import { CompetencyInterface } from "interfaces/competency-bank";
import { BaseProps } from "interfaces/base";
import { getCookie } from "cookies-next";
import { useMemo } from "react";
import { InfoIcon } from "utils/Icons";

export const getServerSideProps = async (ctx: NextPageContext) => {
  setApiHeaders(ctx);
  const is_client = getCookie("is_client", {
    req: ctx.req,
    res: ctx.res,
  });
  const res = await serverAPI.get(
    is_client ? "/competency/by-type/standard" : "/standard-competency",
    {
      params: {
        limit: 25,
        page: 0,
      },
    }
  );
  const data: CompetencyInterface = res.data.data;
  return {
    props: { data, is_client },
  };
};

const StandardCompetency: BaseProps<
  CompetencyInterface[],
  { is_client: boolean }
> = ({ data, is_client }) => {
  const columns: GridColumns = useMemo(
    () => [
      {
        headerName: "Competencies",
        field: "title",
        minWidth: 250,
        cellClassName: "text-dark",
      },
      {
        headerName: "No. of Questions",
        field: "no_of_questions",
        minWidth: 150,
        cellClassName: "flex justify-center",
        renderCell: ({ row }: GridRenderCellParams) => (
          <p className='text-fc-main'>{row.no_of_questions}</p>
        ),
      },
      {
        headerName: "Description",
        field: "description",
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
        headerName: "Action",
        field: "actions",
        flex: 2,
        renderCell: ({ row }: GridRenderCellParams) => (
          <>
            <NextLink href={`standard/${row.id}`}>
              <Button
                variant='text'
                startIcon={!is_client ? <Edit /> : <View />}
              >
                <Typography className='capitalize xl:text-sm 2xl:text-semi-base'>
                  {!is_client ? "View/Edit" : "View"}
                </Typography>
              </Button>
            </NextLink>
            {!is_client && (
              <>
                <div className='border rounded-xl py-2 mx-3'></div>
                <DeleteBox
                  title='Delete Competency'
                  url='/standard-competency'
                  data={row.id}
                >
                  Are You sure do you want to delete this Competency?
                </DeleteBox>
              </>
            )}
          </>
        ),
      },
    ],
    [is_client]
  );

  return (
    <>
      <PageHeader title='Standard Competencies' />
      <DataGrid
        columns={columns}
        rows={data}
        url={
          is_client ? "/competency/by-type/standard" : "/standard-competency"
        }
        addButton={
          !is_client && (
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

export default StandardCompetency;
