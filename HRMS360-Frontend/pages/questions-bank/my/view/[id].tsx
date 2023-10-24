import { Box } from "@mui/material";
import { PageHeader } from "components/layout";
import { serverAPI } from "configs/api";
import { responseComponents } from "constants/competency";
import { colors } from "constants/theme";
import { useSetNavbarTitle } from "hooks/useSetNavbarTitle";
import { BaseProps } from "interfaces/base";
import { QuestionnaireInterface } from "interfaces/questions-bank";
import { NextPageContext } from "next";
import { setApiHeaders } from "utils/setApiHeaders";

export const getServerSideProps = async (ctx: NextPageContext) => {
  setApiHeaders(ctx);

  const res = await serverAPI.get(`/questionnaire/${ctx.query.id}`);
  const data: QuestionnaireInterface = res.data.data;
  return {
    props: { data },
  };
};

const ViewQuestionnaire: BaseProps<QuestionnaireInterface> = ({ data }) => {
  useSetNavbarTitle(data.title);
  return (
    <>
      <PageHeader title={data.title} />
      <Box>
        {data &&
          data?.competencies?.map((comp) => (
            <Box key={comp.id} className='mb-10'>
              <Box
                key={comp.id}
                className={`py-3 mb-10 px-5 font-thin border-l-4`}
                bgcolor={colors.primary.light}
                sx={{ borderColor: colors.primary.dark }}
                color={colors.text.dark}
              >
                {comp.title}
              </Box>
              {comp.questions?.map((item, index) => (
                <Box key={item.id} className='my-10 ml-5 mb-5'>
                  <Box className='text-base'>
                    Q {index + 1}. {item.text}
                  </Box>
                  <Box className='mt-5'>
                    {responseComponents[item.response_type]({
                      responses: item?.responses,
                      viewOnly: true,
                    })}
                  </Box>
                </Box>
              ))}
            </Box>
          ))}
      </Box>
    </>
  );
};

export default ViewQuestionnaire;
