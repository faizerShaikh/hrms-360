import React, { useEffect, useState } from "react";
import { Grid, Typography } from "@mui/material";
import { Label, Search } from "components/layout/inputs";
import { PrimaryAccordion } from "components/layout/accordion";
import { Chip, NoDataOverlay, DeleteBox } from "..";
import { colors } from "constants/theme";
import { useRouter } from "next/router";
import { QuestionDialog } from "./QuestionDialog";
import { QuestionInterface } from "interfaces/competency-bank";
import { responseComponents, responseTypeChoices } from "constants/competency";
import { getCookie } from "cookies-next";

import { ImportQuestionBox } from "./ImportQuestionBox";
import { useDebounce } from "hooks/useDebounce";
import { searchData } from "utils/searchData";

export const CompetencyQuestions = ({
  questions,
}: {
  questions?: QuestionInterface[];
}) => {
  const [data, setData] = useState(questions);
  const [search, setSearch] = useState("");
  const query = useDebounce(search, 1000);

  const router = useRouter();
  const is_client = getCookie("is_client");

  useEffect(() => {
    if (query) {
      setData(searchData(questions, query));
    } else {
      setData(questions);
    }
  }, [query, questions]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} className='flex items-center justify-between'>
        <Search
          sx={{ width: "300px" }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
        />
        {(router.pathname.includes("my") || !is_client) && (
          <div>
            {/* <ImportQuestionBox /> */}
            <QuestionDialog isChannelPartner={!is_client} />
          </div>
        )}
      </Grid>
      <Grid item xs={12}>
        {data?.length ? (
          data?.map((q: QuestionInterface, i: number) => (
            <PrimaryAccordion
              className='text-dark pb-3 xl:text-base 2xl:text-lg m-0'
              header={
                <div>
                  Q {i + 1}.{q.text}
                </div>
              }
              key={`Q ${i + 1}.  ${q.text}`}
            >
              <Grid container className='pb-3'>
                <Grid
                  container
                  item
                  className='flex items-center justify-start mt-3 mb-0'
                >
                  <Grid item xs={1.67}>
                    <Label
                      text='Area Assessed:'
                      className='justify-start text-dark mr-5  xl:text-sm 2xl:text-base'
                    />
                  </Grid>
                  <Grid item xs={9}>
                    {q.area_assessments?.length
                      ? q.area_assessments.map((a) => (
                          <Chip
                            key={a.id}
                            label={a.name}
                            className='mr-3  xl:text-sm 2xl:text-base text-light bg-chip'
                          />
                        ))
                      : ""}
                  </Grid>
                  {(router.pathname.includes("my") || !is_client) && (
                    <Grid item xs={1} className='flex justify-end mt-3'>
                      <DeleteBox
                        refetchUrl={
                          !is_client
                            ? `/standard-competency/${router.query.id}`
                            : `/competency/${router.query.id}`
                        }
                        data={q.id}
                        url={
                          !is_client
                            ? `/standard-competency/question`
                            : `/competency/question`
                        }
                        title='Question'
                      >
                        Are You sure do you want to delete this Question?
                      </DeleteBox>
                      <QuestionDialog
                        isUpdate
                        data={q}
                        isChannelPartner={!is_client}
                      />
                    </Grid>
                  )}
                </Grid>
                <Grid item container className='my-4'>
                  <Grid item xs={1.7}>
                    <Label
                      text='Response Type:'
                      className='justify-start mr-5  xl:text-sm 2xl:text-base'
                    />
                  </Grid>
                  <Grid item xs={10} className='flex items-center'>
                    <Typography
                      color={colors.text.light}
                      className='font-normal  xl:text-sm 2xl:text-base'
                    >
                      {
                        responseTypeChoices.find(
                          (item) => item.value === q.response_type
                        )?.label
                      }
                    </Typography>
                  </Grid>
                </Grid>
                {q.response_type !== "text" && (
                  <Grid item container>
                    <Grid item xs={1.7}>
                      <Label
                        text='Responses :'
                        className='justify-start xl:text-sm 2xl:text-base'
                        outerClassName='my-0'
                      />
                    </Grid>
                    <Grid item xs={10} className='flex items-center'>
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
  );
};
