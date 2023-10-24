import { Grid, Box } from "@mui/material";
import { Label, PageHeader, Button } from "components/layout";
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
import { useEffect, useState } from "react";
import { getParsedCookie } from "utils/getParsedCookie";
import { setApiHeaders } from "utils/setApiHeaders";
import { getInitialStateData } from "utils/survey";
import { toast } from "utils/toaster";

export const getServerSideProps = async (ctx: NextPageContext) => {
  setApiHeaders(ctx);
  const ratersGet = serverAPI.get(`/survey/raters/${ctx.query.surveyId}`);
  const usersGet = serverAPI.get("/user", {
    params: { me: false },
  });

  const [ratersRes, usersRes] = await Promise.all([ratersGet, usersGet]);
  const data: RaterInterface[] = ratersRes.data.data.raters.reverse();
  const user: EmployeeInterface = ratersRes.data.data.user;
  const users: EmployeeInterface[] = usersRes.data.data.rows;
  const survey: SurveyInterface = ratersRes.data.data.survey;
  if (!["In Progress", "Suggested By Employee"].includes(survey.status)) {
    return {
      redirect: {
        destination: "/survey/approval-requests",
        permanent: false,
      },
    };
  }
  const loggedInUser = getParsedCookie("user", ctx);
  return {
    props: { data, users, user, loggedInUser, survey },
  };
};

const ApprovalRequest: BaseProps<
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
  const [allApproved, setAllApproved] = useState(false);

  useEffect(() => {
    let arr: any = [];
    for (const item of initialState.raters) {
      if (item.is_external) {
        for (const resp of item.externalRespondents) {
          arr.push(resp.is_approved_by_line_manager);
        }
      } else {
        for (const resp of item.raters) {
          arr.push(resp.is_approved_by_line_manager);
        }
      }
    }

    setAllApproved(arr.every((item) => item === true));
  }, [initialState]);

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
    onSuccess: (_) => {
      toast(
        allApproved
          ? "Survey launched successfully"
          : "Survey sent for apprroval successfully"
      );
      push("/survey/approval-requests/");
    },
  });

  return (
    <>
      <PageHeader title='Approval Request' />
      <Grid container>
        <Grid className='px-3 border-l-2 py-2 ' item xs={12}>
          <Box className='border-b-gray-200 border-b pb-2'>
            <Label text='Request From' colorClass={`text-primary`} />
          </Box>
          <Box className='flex justify-start items-center mt-2'>
            <Box className='w-4/12 h-12 text-[#333333b5] py-1 border-r-2 text-center break-words'>
              Employee Name : {user?.name} <br />
              {user?.department && <>( {user?.department?.name} )</>}
            </Box>
            <Box className='w-4/12 h-12 text-[#333333b5] py-1 border-r-2 text-center break-words'>
              Department : {user?.designation ? user?.designation?.name : "-"}
            </Box>
            <Box className='w-4/12 h-12 text-[#333333b5] py-1 border-r-2 text-center break-words'>
              Email-Address : {user.email}
            </Box>
          </Box>
        </Grid>
        <Formik
          enableReinitialize={true}
          initialValues={{
            ...initialState,
            userIds: [...initialState.userIds, user.id],
            loggedInUser,
            user,
          }}
          onSubmit={() =>
            mutate({
              status: allApproved
                ? SurveyStatus.Ongoing
                : SurveyStatus.Suggested_by_LM,
            })
          }
        >
          {({ values, submitForm }) => (
            <Grid container gap={2} className='mt-10'>
              <Grid item xs={12}>
                {values &&
                  values.raters.map((item) => (
                    <RaterAccordion key={item.id} item={item} />
                  ))}
              </Grid>
              <Grid item xs={12} className='flex justify-end items-center mt-6'>
                <Link href='/survey/approval-requests' passHref>
                  <Button
                    color='secondary'
                    className='px-4 mr-4 capitalize xl:text-sm 2xl:text-semi-base'
                  >
                    Discard
                  </Button>
                </Link>

                <Button
                  isLoading={isLoading}
                  className='px-4 capitalize xl:text-sm 2xl:text-semi-base'
                  onClick={() => submitForm()}
                >
                  {allApproved ? "Launch Survey" : "Send to Recipient"}
                </Button>
              </Grid>
            </Grid>
          )}
        </Formik>
      </Grid>
    </>
  );
};

export default ApprovalRequest;
