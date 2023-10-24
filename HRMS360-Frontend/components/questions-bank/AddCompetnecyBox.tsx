import { Add } from "@carbon/icons-react";
import { Checkbox, Grid, Typography } from "@mui/material";
import { GridRenderCellParams } from "@mui/x-data-grid";
import { useFormikContext } from "formik";
import { useGetAll } from "hooks/useGetAll";
import { CompetencyInterface } from "interfaces/competency-bank";
import { QuestionnaireInterface } from "interfaces/questions-bank";
import React, { useMemo } from "react";
import { Dialog, Button, DataGrid } from "..";
import { selectCompetencyColumns } from "./SelectQuestionnaireCompetency";

export const AddCompetnecyBox = () => {
  const { data } = useGetAll({
    key: "/competency",
    select(data) {
      return {
        rows: data.data.data.rows.filter(
          (item: CompetencyInterface) =>
            item?.no_of_questions && item?.no_of_questions > 0
        ),
        count: data.data.data.count,
      };
    },
  });
  const { values, setFieldValue } = useFormikContext<QuestionnaireInterface>();

  const selectedComps = useMemo(
    () =>
      values?.competencies?.length
        ? values.competencies?.map((item: CompetencyInterface) => item.id)
        : [],
    [values.competencies]
  );

  const columns = useMemo(
    () => [
      {
        renderHeader: () => {
          return (
            <Checkbox
              checked={selectedComps.length === data?.length}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                if (e.target.checked) {
                  setFieldValue(
                    "competencies",
                    values.competencies?.length
                      ? [
                          ...values.competencies,
                          ...data?.filter(
                            (item: CompetencyInterface) =>
                              !selectedComps.includes(item.id)
                          ),
                        ]
                      : data
                  );
                } else {
                  setFieldValue("competencies", []);
                }
              }}
            />
          );
        },
        field: "checkbox",
        maxWidth: 70,
        renderCell: ({ row }: GridRenderCellParams<CompetencyInterface>) => {
          return (
            <Checkbox
              checked={selectedComps.includes(row.id)}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                if (e.target.checked) {
                  setFieldValue(
                    "competencies",
                    values?.competencies?.length
                      ? [...values?.competencies, row]
                      : [row]
                  );
                } else {
                  setFieldValue(
                    "competencies",
                    values?.competencies?.length
                      ? values?.competencies.filter(
                          (item) => item.id !== row.id
                        )
                      : []
                  );
                }
              }}
            />
          );
        },
        disableReorder: true,
        disableColumnMenu: true,
        disableExport: true,
        hideSortIcons: true,
      },
      ...selectCompetencyColumns,
    ],
    [selectedComps, data, setFieldValue, values.competencies]
  );
  return (
    <Dialog
      maxWidth='xl'
      title={`Competencies`}
      button={
        <Button variant='outlined' startIcon={<Add size={24} />}>
          <Typography className='capitalize  xl:text-sm 2xl:text-semi-base'>
            Add Competency
          </Typography>
        </Button>
      }
    >
      <Grid container className='mt-5'>
        <Grid item xs={12}>
          <DataGrid columns={columns} rows={data || []} />
        </Grid>
      </Grid>
    </Dialog>
  );
};
