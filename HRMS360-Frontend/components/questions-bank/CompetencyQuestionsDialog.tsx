import { Grid, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { Dialog } from "..";
import { Button } from "../layout/buttons";
import { Add } from "@carbon/icons-react";
import { Checkbox, Label, Search } from "components/layout/inputs";
import { PrimaryAccordion } from "components/layout/accordion";
import { colors } from "constants/theme";
import { Chip, NoDataOverlay } from "..";
import {
  CompetencyInterface,
  QuestionInterface,
} from "interfaces/competency-bank";
import { useGetAll } from "hooks/useGetAll";
import { ResponseInterface } from "interfaces/responseInterface";
import { responseComponents, responseTypeChoices } from "constants/competency";
import { useFormikContext } from "formik";
import { QuestionnaireInterface } from "interfaces/questions-bank";
import { AssessmentAreaInterface } from "interfaces/settings";

export const SelectQuestionnaireQuestionsDialog = ({
  competency,
}: {
  competency: CompetencyInterface;
}) => {
  const { values, setFieldValue } = useFormikContext<QuestionnaireInterface>();

  const [competencyState, setCompetencyState] = useState<
    Array<QuestionInterface>
  >(competency?.questions || []);

  useEffect(() => {
    if (competency?.questions) {
      setCompetencyState(competency?.questions);
    }
  }, [competency.id, competency?.questions]);

  const { data, refetch } = useGetAll({
    key: `competency/${competency.id}`,
    enabled: false,
    select: (data: ResponseInterface) => data?.data?.data,
  });

  return (
    <Dialog
      maxWidth='xl'
      title={`Questions Under - ${competency.title}`}
      buttonOnClick={() => {
        refetch();
      }}
      button={
        <Button variant='text' startIcon={<Add size={24} />}>
          <Typography className='capitalize  xl:text-sm 2xl:text-semi-base'>
            View / Add Questions
          </Typography>
        </Button>
      }
    >
      {({ onClose }) => (
        <Grid container spacing={2} className='mt-5 h-3/4'>
          <Grid item xs={12} className='flex items-center justify-between'>
            <Search sx={{ width: "300px" }} />
          </Grid>

          <Grid container item xs={12} className='overflow-y-auto'>
            <Grid
              item
              xs={12}
              className='flex justify-start items-center pl-[9px] mb-0'
              sx={{ borderBottom: `1px solid ${colors.tertiary.dark}30` }}
            >
              <Checkbox
                checkBoxProps={{
                  checked: data?.questions?.length === competencyState.length,
                  indeterminate:
                    data?.questions?.length === competencyState.length
                      ? undefined
                      : Boolean(competencyState.length),
                  onChange: (_, checked) => {
                    if (checked) {
                      setCompetencyState(data?.questions);
                    } else {
                      setCompetencyState([]);
                    }
                  },
                }}
              />
              <Typography className='text-dark xl:text-base 2xl:text-lg'>
                Select All
              </Typography>
            </Grid>
            <Grid item xs={12} className='mt-0'>
              {data?.questions?.length ? (
                data?.questions?.map((q: QuestionInterface, i: number) => (
                  <PrimaryAccordion
                    key={q.id}
                    headerClassName='h-[55px] mt-3'
                    header={
                      <div className='flex items-center justify-start h-auto'>
                        <Checkbox
                          checkBoxProps={{
                            checked: Boolean(
                              q?.id &&
                                competencyState.find((i) => i?.id === q?.id)
                            ),
                            onChange: (e, checked) => {
                              e.stopPropagation();
                              if (checked) {
                                setCompetencyState([...competencyState, q]);
                              } else {
                                setCompetencyState((prev) =>
                                  prev.filter((e) => e?.id !== q?.id)
                                );
                              }
                            },
                          }}
                        />
                        <Typography className='leading-6  text-dark xl:text-sm 2xl:text-base'>
                          {" "}
                          {`Q ${i + 1}.  ${q.text}`}{" "}
                        </Typography>
                      </div>
                    }
                  >
                    <Grid container gap={4}>
                      <Grid
                        container
                        item
                        className='flex items-center justify-start'
                      >
                        <Grid item xs={1.5}>
                          <Label
                            text='Area Assessed:'
                            className='justify-start xl:text-sm 2xl:text-base'
                          />
                        </Grid>
                        <Grid item xs={9.5}>
                          {q.area_assessments?.length
                            ? q.area_assessments.map(
                                (a: AssessmentAreaInterface) => (
                                  <Chip
                                    key={a.id}
                                    label={a.name}
                                    className='mr-3 xl:text-sm 2xl:text-base'
                                  />
                                )
                              )
                            : ""}
                        </Grid>
                      </Grid>
                      <Grid item container>
                        <Grid item xs={1.5}>
                          <Label
                            text='Responses Type:'
                            className='justify-start xl:text-sm 2xl:text-base'
                          />
                        </Grid>
                        <Grid item xs={10.5}>
                          <Typography
                            color={colors.text.dark}
                            className='font-normal xl:text-sm 2xl:text-base'
                          >
                            {
                              responseTypeChoices.find(
                                (i) => i.value === q.response_type
                              )?.label
                            }
                          </Typography>
                        </Grid>
                      </Grid>
                      {q.response_type !== "text" && (
                        <Grid item container>
                          <Grid item xs={1.5}>
                            <Label
                              text='Responses'
                              className='justify-start xl:text-sm 2xl:text-base'
                            />
                          </Grid>
                          <Grid item xs={10.5}>
                            {responseComponents[q.response_type]({
                              responses: q?.responses,
                              viewOnly: true,
                            })}
                          </Grid>
                        </Grid>
                      )}
                    </Grid>
                  </PrimaryAccordion>
                ))
              ) : (
                <NoDataOverlay />
              )}
            </Grid>
          </Grid>

          <Grid className='flex justify-end mt-6' item xs={12}>
            <Button
              color='secondary'
              className='px-4 capitalize  xl:text-sm 2xl:text-semi-base'
              onClick={onClose}
            >
              Discard
            </Button>
            <Button
              className='capitalize ml-4 px-4  xl:text-sm 2xl:text-semi-base'
              onClick={() => {
                setFieldValue(
                  "competencies",
                  values?.competencies?.map((item) =>
                    item.id === competency.id
                      ? { ...item, questions: competencyState }
                      : item
                  )
                );

                onClose();
              }}
            >
              Save & Next
            </Button>
          </Grid>
        </Grid>
      )}
    </Dialog>
  );
};
