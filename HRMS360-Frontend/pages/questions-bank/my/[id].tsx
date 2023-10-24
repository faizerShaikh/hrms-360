import {
  QuestionnaireCompetencies,
  QuestionnaireDescription,
  ButtonGroup,
  PageHeader,
} from "components";
import { serverAPI } from "configs";
import { useGetAll, useSetNavbarTitle } from "hooks";
import { QuestionnaireInterface, BaseProps } from "interfaces";
import { NextPageContext } from "next";
import { useRouter } from "next/router";
import { useState } from "react";
import { setApiHeaders } from "utils";

export const getServerSideProps = async (ctx: NextPageContext) => {
  setApiHeaders(ctx);
  const { data } = await serverAPI.get(`/questionnaire/${ctx.query.id}`);
  const questionnaire: QuestionnaireInterface = data.data;

  return {
    props: { data: questionnaire },
  };
};

const SingleQuestionnaire: BaseProps<QuestionnaireInterface> = ({ data }) => {
  const { query } = useRouter();
  const [questionnaireData, setQuestionnaireData] = useState(data);

  useSetNavbarTitle(questionnaireData.title);

  useGetAll({
    key: `/questionnaire/${query.id}`,
    enabled: false,
    onSuccess: (data) => setQuestionnaireData(data),
  });

  return (
    <>
      <PageHeader title={questionnaireData.title} />
      <ButtonGroup
        buttons={[
          { text: "Description", key: "Description" },
          { text: "Competencies", key: "Competencies" },
        ]}
        buttonClasses='px-14'
      >
        <QuestionnaireDescription key='Description' data={questionnaireData} />
        <QuestionnaireCompetencies
          key='Competencies'
          competencies={questionnaireData?.competencies}
        />
      </ButtonGroup>
    </>
  );
};

export default SingleQuestionnaire;
