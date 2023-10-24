import { EmployeeInterface } from "interfaces/employee-configuration";
import { RaterInterface } from "interfaces/settings";
import { SurveyRespondantInterface } from "interfaces/survey";

export const getInitialStateData = (
  data: RaterInterface[],
  users: EmployeeInterface[]
) => {
  let userIds: Array<string> = [];

  return {
    raters: data.map((item) => {
      let users: Array<EmployeeInterface & SurveyRespondantInterface> =
        item?.users?.map((user) => {
          if (user.id) {
            userIds.push(user.id);
          }

          if (
            user?.respondant &&
            user?.respondant?.last_suggestion &&
            user?.respondant?.last_suggestion.alternative_suggestion_id
          ) {
            userIds.push(
              user?.respondant?.last_suggestion.alternative_suggestion_id
            );
          }

          return {
            is_selected_by_system: Boolean(
              user?.respondant?.is_selected_by_system
            ),
            is_approved_by_line_manager: Boolean(
              user?.respondant?.is_approved_by_line_manager
            ),
            respondant_id: user.respondant?.respondant_id || "",
            logs: user.respondant?.logs || [],
            ...user.respondant,
            ...user,
          };
        }) || [];

      return {
        ...item,
        raters: users,
        selectedRaters: item.is_external
          ? item?.surveyExternalRespondant?.length || 0
          : item?.users?.length || 0,
        externalRespondents: item.surveyExternalRespondant || [],
      };
    }),
    users,
    userIds,
    is_approval: true,
  };
};
