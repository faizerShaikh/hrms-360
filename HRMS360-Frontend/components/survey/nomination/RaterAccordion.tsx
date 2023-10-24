import { Box, Grid } from "@mui/material";
import { Label, SecondaryAccordion } from "components/layout";
import { useFormikContext } from "formik";
import { nanoid } from "nanoid";
import { PendingNominationInterface } from "interfaces/survey";
import { AddExternalRespondentBox } from "./AddExternalRespondentBox";
import { AddRespondentBox } from "./AddRespondentBox";
import GetAccrodionStatus from "./GetAccrodionStatus";
import GetAccordionButtons from "./GetAccordionButtons";
import ExternalRespondentButtons from "./ExternalRespondentButtons";

export interface RaterAccordionProps {
  item: PendingNominationInterface;
}
export const RaterAccordion = ({ item }: RaterAccordionProps) => {
  const { values, setFieldValue } = useFormikContext<any>();

  const onDelete = (id: string, isExternal: boolean = false) => {
    setFieldValue(
      "raters",
      values.raters.map((rater: PendingNominationInterface) =>
        rater.id === item.id
          ? {
              ...rater,
              selectedRaters: rater.selectedRaters - 1,
              raters: !isExternal
                ? rater.raters.filter((item) => item.id !== id)
                : rater.raters,
              externalRespondents: isExternal
                ? rater.externalRespondents.filter(
                    (item: any) => item.id !== id
                  )
                : rater.externalRespondents,
            }
          : rater
      )
    );
    setFieldValue(
      "userIds",
      values.userIds.filter((userId: string) => id !== userId)
    );
  };

  return (
    <SecondaryAccordion
      key={item.id}
      header={item.category_name}
      className='p-0'
      status={<GetAccrodionStatus item={item} />}
    >
      <Box>
        {item.raters.map((rater, index, arr) => (
          <Grid
            key={rater.id}
            container
            className={`xl:text-sm 2xl:text-semi-base border p-4 border-b-${
              index + 1 === arr.length ? "1" : "2"
            }`}
          >
            <Grid
              item
              xs={3}
              className='flex flex-col items-start justify-center'
            >
              <span className='text-dark'>{rater.name}</span>
              <span className='text-main'>{rater?.designation?.name}</span>
            </Grid>
            {rater.respondant?.last_suggestion &&
            !rater.is_approved_by_line_manager ? (
              <>
                <Grid
                  item
                  xs={4}
                  className='text-main flex items-center justify-center w-full'
                >
                  <span className='border-r-2 py-3 px-2 mr-5'></span>
                  <Label
                    text='Last Suggestion:'
                    className='text-secondary mr-2 xl:text-sm 2xl:text-semi-base'
                  />
                  <p className='truncate my-0'>
                    {" "}
                    {rater?.respondant?.last_suggestion?.user?.email}
                  </p>
                </Grid>
              </>
            ) : (
              <>
                <Grid
                  item
                  xs={3}
                  className='flex flex-col items-center justify-center text-main'
                >
                  {rater.email}
                </Grid>

                <Grid
                  item
                  xs={2}
                  className='flex flex-col items-center justify-center text-main'
                >
                  {rater?.department?.name}
                </Grid>
              </>
            )}

            <GetAccordionButtons
              rater={rater}
              item={item}
              onDelete={onDelete}
            />
          </Grid>
        ))}
        {item.externalRespondents.map((rater: any, index, arr) => (
          <Grid
            key={rater.id}
            container
            className={`xl:text-sm 2xl:text-semi-base border p-4 border-b-${
              index + 1 === arr.length ? "1" : "2"
            }`}
          >
            <Grid
              item
              xs={rater?.last_suggestion ? 3 : 4}
              className='flex flex-col items-start justify-center'
            >
              <span className='text-dark'>{rater.respondant_name}</span>
              {rater?.last_suggestion && !rater.is_approved_by_line_manager && (
                <span className='text-main'> {rater.respondant_email}</span>
              )}
            </Grid>

            {rater?.last_suggestion && !rater.is_approved_by_line_manager ? (
              <>
                <Grid item xs={3} className='text-main'>
                  <Label
                    text='Last Suggestion:'
                    className='text-secondary mr-2'
                  />
                  <p className='truncate my-0'>
                    {rater.last_suggestion.alternative_email}
                  </p>
                </Grid>
                <Grid item xs={3} className='text-main'>
                  <Label text='LM Comments:' className='text-secondary mr-2' />
                  <p className='truncate my-0'>
                    {" "}
                    {rater.last_suggestion.comments}
                  </p>
                </Grid>
              </>
            ) : (
              <Grid
                item
                xs={4}
                className='flex items-center justify-center text-main'
              >
                {rater.respondant_email}
              </Grid>
            )}

            <ExternalRespondentButtons
              rater={rater}
              onDelete={onDelete}
              item={item}
            />
          </Grid>
        ))}
        {Array(item.no_of_raters - item.selectedRaters)
          .fill(nanoid())
          .map(
            (_, index, arr) =>
              values.loggedInUser?.id === values.user?.id && (
                <Grid
                  key={nanoid()}
                  container
                  className={` xl:text-sm 2xl:text-semi-base border p-4 border-b-${
                    index + 1 === arr.length ? "2" : "1"
                  }`}
                >
                  <Grid
                    item
                    xs={item.is_external ? 4 : 3}
                    className='flex flex-col items-start justify-center'
                  >
                    <span className='text-dark'>Name</span>
                    {!item.is_external && (
                      <span className='text-main'>Designation</span>
                    )}
                  </Grid>
                  <Grid
                    item
                    xs={item.is_external ? 4 : 3}
                    className='flex flex-col items-center justify-center text-main'
                  >
                    Email
                  </Grid>
                  {!item.is_external && (
                    <Grid
                      item
                      xs={3}
                      className='flex flex-col items-center justify-center text-main'
                    >
                      Department
                    </Grid>
                  )}
                  <Grid
                    item
                    xs={item.is_external ? 4 : 3}
                    className='xl:text-sm 2xl:text-semi-base flex items-center justify-end'
                  >
                    <>
                      {!item.is_external && <AddRespondentBox rater={item} />}
                      {item.is_external && (
                        <AddExternalRespondentBox rater={item} />
                      )}
                    </>
                  </Grid>
                </Grid>
              )
          )}
      </Box>
    </SecondaryAccordion>
  );
};
