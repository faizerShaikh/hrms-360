import React from "react";
import { ButtonGroup } from "components";
import { CompetencyInterface } from "interfaces/competency-bank";
import { CompetencyDescription } from "./CompetencyDescription";
import { CompetencyQuestions } from "./CompetencyQuestions";

export const CompetencyDetail = ({ data }: { data: CompetencyInterface }) => {
  return (
    <>
      <ButtonGroup
        buttons={[
          { text: "Description", key: "Description" },
          { text: "Questions", key: "Questions" },
        ]}
        buttonClasses="px-14 capitalize mb-10   xl:text-base 2xl:text-lg"
      >
        <CompetencyDescription key="Description" data={data} />
        <CompetencyQuestions questions={data.questions} key="Questions" />
      </ButtonGroup>
    </>
  );
};
