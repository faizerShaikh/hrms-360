import { Box } from "@mui/material";
import { Button, PageHeader } from "components/layout";
import { RaterAccordion } from "components/survey";
import { serverAPI } from "configs/api";
import { Formik } from "formik";
import { useCreateOrUpdate } from "hooks/useCreateOrUpdate";
import { useGetAll } from "hooks/useGetAll";
import { BaseProps } from "interfaces/base";
import { EmployeeInterface } from "interfaces/employee-configuration";
import { RaterInterface } from "interfaces/settings";
import {
  nominationInitialStateInterface,
  SurveyInterface,
  SurveyStatus,
} from "interfaces/survey";
import { NextPageContext } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { getParsedCookie } from "utils/getParsedCookie";
import { setApiHeaders } from "utils/setApiHeaders";
import { getInitialStateData } from "utils/survey";
import { toast } from "utils/toaster";

export const getServerSideProps = async (ctx: NextPageContext) => {
  setApiHeaders(ctx);
  const ratersGet = serverAPI.get(`/survey/raters/${ctx.query.surveyId}`);
  const usersGet = serverAPI.get("/user", {
    params: {
      me: false,
    },
  });

  const [ratersRes, usersRes] = await Promise.all([ratersGet, usersGet]);
  const data: RaterInterface[] = ratersRes.data.data.raters.reverse();
  const user: EmployeeInterface = ratersRes.data.data.user;
  const survey: SurveyInterface = ratersRes.data.data.survey;

  if (survey.status !== "Suggested By Line Manager") {
    return {
      redirect: {
        destination: "/survey/my/alternative-suggestion",
        permanent: false,
      },
    };
  }
  const users: EmployeeInterface[] = usersRes.data.data.rows;
  const loggedInUser = getParsedCookie("user", ctx);
  return {
    props: {
      data,
      user,
      users,
      loggedInUser,
    },
  };
};

const AlternativeSuggestion: BaseProps<
  RaterInterface[],
  {
    users: EmployeeInterface[];
    user: EmployeeInterface;
    loggedInUser: EmployeeInterface;
  }
> = ({ data, users, user, loggedInUser }) => {
  const [initialState, setInitialState] = useState<
    nominationInitialStateInterface & {
      is_approval?: boolean;
    }
  >(getInitialStateData(data, users));

  const { query, push } = useRouter();

  useGetAll({
    key: `/survey/raters/${query.surveyId}`,
    enabled: false,
    onSuccess(data) {
      setInitialState(getInitialStateData(data.raters.reverse(), users));
    },
  });

  const { mutate, isLoading } = useCreateOrUpdate({
    url: `/survey/send-suggestion/${query.surveyId}`,
    onSuccess: () => {
      toast("Survey sent for apprroval successfully");
      push("/survey/my/alternative-suggestion");
    },
  });
  return (
    <>
      <PageHeader title='Alternative Suggestion' />
      <Formik
        initialValues={{
          ...initialState,
          userIds: [...initialState.userIds, user.id],
          is_suggestion: true,
          is_approval: false,
          user,
          loggedInUser,
        }}
        enableReinitialize
        onSubmit={() => mutate({ status: SurveyStatus.Suggested_by_EMP })}
      >
        {({ values, submitForm }) => (
          <>
            {values.raters &&
              values.raters.map((item) => (
                <RaterAccordion key={item.id} item={item} />
              ))}
            <Box className='flex justify-end items-center gap-4 mt-6'>
              <Link
                href='/survey/my/alternative-suggestion'
                passHref
                className='mr-4'
              >
                <Button color='secondary'>Discard</Button>
              </Link>
              <Button isLoading={isLoading} onClick={() => submitForm()}>
                Send For Approval
              </Button>
            </Box>
          </>
        )}
      </Formik>
    </>
  );
};

export default AlternativeSuggestion;
