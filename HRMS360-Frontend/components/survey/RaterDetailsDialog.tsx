import React from "react";
import { Dialog, DataGrid, Button } from "..";
import { GridColumns } from "@mui/x-data-grid";
import { useRouter } from "next/router";
import { Box, Grid, Typography } from "@mui/material";
import { useGetAll } from "hooks/useGetAll";
import { RaterInterface } from "interfaces/settings";
import { Add } from "@carbon/icons-react";

export const RaterDetails = ({}) => {
  const router = useRouter();

  const { data, refetch } = useGetAll({
    key: `/setting/rater`,
    params: {
      page: 0,
      limit: 25,
    },
    enabled: false,
  });

  const columns: GridColumns<RaterInterface> = [
    {
      headerName: "Raters Category",
      field: "category_name",
      flex: 1,
      cellClassName: "text-dark",
    },
    {
      headerName: "No. of Raters",
      field: "no_of_raters",
      flex: 1,
      align: "center",
      headerAlign: "center",
    },
    {
      headerName: "Mandatory Field",
      field: "is_required",
      flex: 1,
    },
    {
      headerName: "Is external",
      field: "is_external",
      flex: 1,
    },
  ];
  return (
    <Dialog
      title={"Rater Details"}
      button={
        <div className="mx-10 flex items-center justify-center">
          <Add size="32" />
          <Typography
            className="xl:text-sm 2xl:text-base"
            sx={{ fontFamily: "'Century Gothic', 'sans-serif'" }}
          >
            Create New Survey
          </Typography>
        </div>
      }
      buttonOnClick={() => {
        refetch();
      }}
    >
      <>
        <Grid className="mt-5">
          <DataGrid
            key="Respondents"
            checkboxSelection
            columns={columns}
            url="/setting/rater"
            rows={data}
            rowHeight={60}
            getRowId={(row) => row?.id}
          />
        </Grid>
        <Grid xs={12} item>
          <Box className="flex justify-end">
            <Button
              variant="contained"
              className="capitalize ml-4 px-4  xl:text-sm 2xl:text-semi-base"
              onClick={() => {
                router.push("/survey/add");
              }}
            >
              Proceed
            </Button>
          </Box>
        </Grid>
      </>
    </Dialog>
  );
};
