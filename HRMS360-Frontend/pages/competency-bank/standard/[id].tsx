import React, { useState } from "react";
import { CompetencyDetail, PageHeader } from "components";
import { setApiHeaders } from "utils/setApiHeaders";
import { serverAPI } from "configs/api";
import { BaseProps } from "interfaces/base";
import { CompetencyInterface } from "interfaces/competency-bank";
import { NextPageContext } from "next";
import { useRouter } from "next/router";
import { useGetAll } from "hooks/useGetAll";
import { useSetNavbarTitle } from "hooks/useSetNavbarTitle";
import { getCookie } from "cookies-next";

export const getServerSideProps = async (ctx: NextPageContext) => {
  setApiHeaders(ctx);

  const is_client = getCookie("is_client", { req: ctx.req, res: ctx.res });

  const res = await serverAPI.get(
    is_client
      ? `/competency/${ctx.query.id}`
      : `/standard-competency/${ctx.query.id}`
  );
  const data: CompetencyInterface = res.data.data;
  return {
    props: { data },
  };
};

const StandardCompetencyDetail: BaseProps<CompetencyInterface> = ({ data }) => {
  const [competencyData, setCompetencyData] = useState(data);
  const router = useRouter();

  useGetAll({
    key: `/standard-competency/${router.query.id}`,
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

export default StandardCompetencyDetail;
