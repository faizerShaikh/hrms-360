import React, { useState } from "react";
import { NextPageContext } from "next";
import { CompetencyDetail, PageHeader } from "components";
import { setApiHeaders } from "utils/setApiHeaders";
import { serverAPI } from "configs/api";
import { BaseProps } from "interfaces/base";
import { CompetencyInterface } from "interfaces/competency-bank";
import { useGetAll } from "hooks/useGetAll";
import { useRouter } from "next/router";
import { useSetNavbarTitle } from "hooks/useSetNavbarTitle";

export const getServerSideProps = async (ctx: NextPageContext) => {
  setApiHeaders(ctx);
  const res = await serverAPI.get(`/competency/${ctx.query.id}`);
  const data: CompetencyInterface = res.data.data;
  return {
    props: { data },
  };
};

const MyCompetencyDetail: BaseProps<CompetencyInterface> = ({ data }) => {
  const [competencyData, setCompetencyData] = useState(data);
  const router = useRouter();

  useGetAll({
    key: `/competency/${router.query.id}`,
    enabled: false,
    onSuccess: (data) => {
      setCompetencyData(data);
    },
  });

  useSetNavbarTitle(competencyData.title);

  return (
    <>
      <PageHeader title={competencyData.title} />
      <CompetencyDetail data={competencyData} />
    </>
  );
};

export default MyCompetencyDetail;
