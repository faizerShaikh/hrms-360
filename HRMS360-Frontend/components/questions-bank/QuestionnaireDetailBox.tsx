import { Edit } from "@carbon/icons-react";
import { Box } from "@mui/material";
import { responseComponents } from "constants/competency";
import { colors } from "constants/theme";
import { useGetAll } from "hooks/useGetAll";
import { QuestionnaireInterface } from "interfaces/questions-bank";
import React from "react";
import { Dialog, Button } from "..";
export interface QuestionnaireDetailBoxProps {
  id: string;
}
const QuestionnaireDetailBox = ({ id }: QuestionnaireDetailBoxProps) => {
  const { data, refetch } = useGetAll<QuestionnaireInterface>({
    key: `/questionnaire/${id}`,
    enabled: false,
  });

  return (
    <Dialog
      title={`Questionnaire Details / ${data?.title}`}
      buttonOnClick={() => {
        refetch();
      }}
      maxWidth='lg'
      button={
        <Button variant='text' startIcon={<Edit />}>
          view/Edit
        </Button>
      }
    >
      {({ onClose }) => (
        <>
          <Box
            className='py-5 overflow-y-auto border-b'
            sx={{ height: "75vh" }}
          >
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
          <Box className='flex justify-end pt-4'>
            <Button color='secondary' onClick={() => onClose()}>
              Close
            </Button>
          </Box>
        </>
      )}
    </Dialog>
  );
};

export default QuestionnaireDetailBox;
