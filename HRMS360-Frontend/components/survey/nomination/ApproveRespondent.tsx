import { Checkmark } from "@carbon/icons-react";
import { Button } from "components/layout";
import { useCreateOrUpdate } from "hooks/useCreateOrUpdate";
import { useRouter } from "next/router";
import React from "react";
import { useQueryClient } from "react-query";
import { toast } from "utils/toaster";

export const ApproveRespondent = ({
  body = {},
  id,
}: {
  body: any;
  id: string;
}) => {
  const { query } = useRouter();
  const queryClient = useQueryClient();

  const { mutate, isLoading } = useCreateOrUpdate({
    url: `/survey/approve-respondents/${id}`,
    onSuccess: async () => {
      toast("Respondent approved successfully");
      await queryClient.refetchQueries(`/survey/raters/${query.surveyId}`, {
        exact: true,
      });
    },
  });

  return (
    <Button
      startIcon={<Checkmark />}
      isLoading={isLoading}
      onClick={() => mutate(body)}
      className='px-5 capitalize xl:text-sm 2xl:text-semi-base'
    >
      {body?.alternative || body.alternative_email ? "Accept" : "Approve"}
    </Button>
  );
};
