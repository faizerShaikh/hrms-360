import { Grid } from "@mui/material";
import {
  ActionCard,
  ActionVarient,
  Button,
  PageHeader,
} from "components/layout";
import { RaterAccordion } from "components/survey";
import { serverAPI } from "configs/api";
import { colors } from "constants/theme";
import { Formik } from "formik";
import { useCreateOrUpdate } from "hooks/useCreateOrUpdate";
import { BaseProps } from "interfaces/base";
import { EmployeeInterface } from "interfaces/employee-configuration";
import { RaterInterface } from "interfaces/settings";
import {
  nominationInitialStateInterface,
  SurveyDescriptionInterface,
  SurveyExternalRespondantInterface,
  SurveyInterface,
  SurveyRespondantInterface,
} from "interfaces/survey";
import { NextPageContext } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { getParsedCookie } from "utils/getParsedCookie";
import { setApiHeaders } from "utils/setApiHeaders";
import { toast } from "utils/toaster";

let cardVariants: ActionVarient[] = ["primary", "secondary", "tertiary"];

export const getServerSideProps = async (ctx: NextPageContext) => {
  setApiHeaders(ctx);
  const loggedInUser = getParsedCookie("user", ctx);

  const ratersGet = serverAPI.get(`/survey/raters/${ctx.query.id}`);
  const usersGet = serverAPI.get("/user", {
    params: {
      me: false,
    },
  });

  const [ratersRes, usersRes] = await Promise.all([ratersGet, usersGet]);
  const data: RaterInterface[] = ratersRes.data.data.raters.reverse();
  const user: EmployeeInterface = ratersRes.data.data.user;
  const survey: SurveyInterface = ratersRes.data.data.survey;
  if (survey.status !== "Initiated") {
    return {
      redirect: {
        destination: "/survey/my/nominate-respondents",
        permanent: false,
      },
    };
  }
  const surveyDescription: SurveyDescriptionInterface =
    ratersRes.data.data.surveyDescription;
  const users: EmployeeInterface[] = usersRes.data.data.rows;

  let is_lm_approval_required = true;
  if (!loggedInUser.is_lm_approval_required) {
    is_lm_approval_required = false;
  } else if (!surveyDescription.is_lm_approval_required) {
    is_lm_approval_required = false;
  }

  return {
    props: {
      data,
      user,
      users,
      loggedInUser,
      is_lm_approval_required,
      survey,
    },
  };
};

const PendingNomination: BaseProps<
  RaterInterface[],
  {
    users: EmployeeInterface[];
    user: EmployeeInterface;
    loggedInUser: EmployeeInterface;
    is_lm_approval_required: boolean;
  }
> = ({ data, users, user, loggedInUser, is_lm_approval_required }) => {
  const { query, push } = useRouter();

  let initialState: nominationInitialStateInterface = useMemo(() => {
    let userIds: Array<string> = user?.id ? [user.id] : [];
    let raters = data?.map((item) => {
      let externalRespondents: Array<SurveyExternalRespondantInterface> =
        item.surveyExternalRespondant || [];
      let raters: Array<
        EmployeeInterface & Partial<SurveyRespondantInterface>
      > = [];

      if (!item.is_external) {
        if (item.users?.length) {
          for (const user of item.users) {
            if (user.id) {
              userIds.push(user.id);
              if (user.respondant) {
                raters.push({ ...user.respondant, ...user });
              }
            }
          }
        }
      }

      if (user) {
        if (item.name === "Line Manager") {
          let rater = users.find((u) => u.id === user.line_manager_id);
          if (rater && rater.id) {
            if (!userIds.includes(rater.id)) {
              userIds.push(rater?.id);
              raters = [
                {
                  ...rater,
                  is_selected_by_system: true,
                  is_approved_by_employee: true,
                  is_approved_by_line_manager: true,
                },
              ];
            }
          }
        } else if (item.name === "Secondary Line Manager") {
          let rater = users.find(
            (u) => u.id === user.secondary_line_manager_id
          );

          if (rater && rater.id) {
            if (!userIds.includes(rater.id)) {
              userIds.push(rater.id);
              raters = [
                {
                  ...rater,
                  is_selected_by_system: true,
                  is_approved_by_employee: true,
                  is_approved_by_line_manager: true,
                },
              ];
            }
          }
        }
      }

      return {
        ...item,
        selectedRaters: item.is_external
          ? externalRespondents.length
          : raters.length,
        raters,
        externalRespondents,
      };
    });

    return {
      raters,
      users,
      userIds,
    };
  }, [data, users, user]);

  const { mutate, isLoading } = useCreateOrUpdate({
    url: `/survey/add-respondents`,
    onSuccess() {
      toast(
        is_lm_approval_required
          ? "Survey respondent added successfully"
          : "Survey launched successfully"
      );
      push("/survey/my/nominate-respondents");
    },
  });

  const onSubmit = (values: nominationInitialStateInterface) => {
    let surveyRespondents: any[] = [];
    let externalSurveyRespondents: any[] = [];
    for (const rater of values.raters) {
      if (rater.is_required && rater.selectedRaters !== rater.no_of_raters) {
        return toast(
          "Please select all required number of raters in all categories!",
          "error"
        );
      }

      for (const item of rater.raters) {
        surveyRespondents.push({
          respondant_id: item.id,
          relationship_with_employee_id: rater.id,
          is_selected_by_system: Boolean(item.is_selected_by_system),
          is_approved_by_employee: Boolean(item.is_approved_by_employee),
          is_approved_by_line_manager: Boolean(
            item.is_approved_by_line_manager
          ),
        });
      }
      for (const item of rater.externalRespondents) {
        externalSurveyRespondents.push({
          respondant_email: item.respondant_email,
          respondant_name: item.respondant_name,
          relationship_with_employee_id: rater.id,
          is_approved_by_employee: Boolean(item.is_approved_by_employee),
          is_approved_by_line_manager: Boolean(
            item.is_approved_by_line_manager
          ),
        });
      }
    }

    let data = {
      survey_id: query.id,
      surveyRespondents,
      externalSurveyRespondents,
    };

    mutate(data);
  };

  return (
    <>
      <PageHeader title="Nominate Respondents" />
      <Formik
        enableReinitialize={true}
        initialValues={{ ...initialState, user, loggedInUser }}
        onSubmit={(values) => onSubmit(values)}
      >
        {({ values, submitForm }) => (
          <Grid container gap={2}>
            <Grid
              item
              xs={12}
              className="flex items-center justify-start overflow-x-auto pb-2"
            >
              {values &&
                values.raters.map((item, index) => (
                  <ActionCard
                    key={item.id}
                    className="flex flex-col h-24 mr-5"
                    variant={cardVariants[index > 2 ? index - 3 : index]}
                  >
                    <p className="my-0 text-base">{item.category_name}</p>
                    <p className="mb-0 mt-1 text-lg">
                      <span
                        style={{
                          color:
                            colors[cardVariants[index > 2 ? index - 3 : index]]
                              ?.dark,
                        }}
                      >
                        {`${item.selectedRaters}`.padStart(2, "0")}
                      </span>{" "}
                      / <span>{`${item.no_of_raters}`.padStart(2, "0")}</span>
                    </p>
                  </ActionCard>
                ))}
            </Grid>
            <Grid item xs={12}>
              {values &&
                values.raters.map((item) => (
                  <RaterAccordion key={item.id} item={item} />
                ))}
            </Grid>
            <Grid item xs={12} className="flex justify-end items-center mt-6">
              <Link href="/survey/my/nominate-respondents" passHref>
                <Button
                  color="secondary"
                  className="px-4 mr-4 capitalize xl:text-sm 2xl:text-base"
                >
                  Discard
                </Button>
              </Link>

              <Button isLoading={isLoading} onClick={() => submitForm()}>
                {is_lm_approval_required
                  ? "Send For Approval"
                  : "Launch Survey"}
              </Button>
            </Grid>
          </Grid>
        )}
      </Formik>
    </>
  );
};

export default PendingNomination;
