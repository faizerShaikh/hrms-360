import React from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import { colors } from "constants/theme";
import { Formik } from "formik";
import * as yup from "yup";
import { useCreateOrUpdate } from "hooks/useCreateOrUpdate";
import { useRouter } from "next/router";
import { useQueryClient } from "react-query";
import { QuestionnaireInterface } from "interfaces/questions-bank";

const validations = yup.object({
  title: yup.string().required("Title is requierd"),
  description: yup.string().required("Description is requierd"),
});

export const QuestionnaireDescription = ({
  data,
}: {
  data?: QuestionnaireInterface;
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate } = useCreateOrUpdate({
    url: `${"/questionnaire/"}${data?.id}`,
    refetch: async () => {
      let query = [`/questionnaire/${router.query.id}`];
      await queryClient.refetchQueries(query, {
        exact: true,
      });
    },
    method: "put",
  });
  return (
    <Box className="mt-14">
      <Formik
        initialValues={{
          title: data?.title,
          description: data?.description,
          isTitleEdit: false,
          isDescriptionEdit: false,
        }}
        validationSchema={validations}
        onSubmit={() => {}}
      >
        {({ values, setFieldValue, getFieldProps }) => (
          <>
            <Box
              bgcolor={colors.primary.light}
              sx={{ border: `1px solid ${colors.primary.dark}30` }}
              className="flex items-center justify-between py-6 px-4"
            >
              <Tooltip
                arrow
                title="Double Click on text to update"
                followCursor
              >
                <Typography
                  className="w-full"
                  onDoubleClick={() =>
                    setFieldValue("isTitleEdit", !values.isTitleEdit)
                  }
                >
                  {values.isTitleEdit ? (
                    <input
                      className="w-4/5 outline-0 bg-transparent pl-1 py-1 border-b border-b-slate-500 text-base"
                      autoFocus
                      {...getFieldProps("title")}
                      onBlur={(e) => {
                        setFieldValue("isTitleEdit", !values.isTitleEdit);
                        getFieldProps("title").onBlur(e);
                        mutate(values);
                      }}
                    />
                  ) : (
                    "Description for " + values?.title
                  )}
                </Typography>
              </Tooltip>
              <Typography className="w-48">
                No of Questions: {data?.no_of_questions}
              </Typography>
            </Box>
            <Box className="py-6 px-4 border-2 border-t-0">
              <Tooltip
                arrow
                title="Double Click on text to update"
                followCursor
              >
                <Typography
                  onDoubleClick={() =>
                    setFieldValue(
                      "isDescriptionEdit",
                      !values.isDescriptionEdit
                    )
                  }
                >
                  {values.isDescriptionEdit ? (
                    <textarea
                      className="w-full outline-0 bg-transparent pl-1 py-1 border-b border-b-slate-500 text-base resize-none"
                      autoFocus
                      {...getFieldProps("description")}
                      onBlur={(e) => {
                        setFieldValue(
                          "isDescriptionEdit",
                          !values.isDescriptionEdit
                        );
                        getFieldProps("description").onBlur(e);
                        mutate(values);
                      }}
                    />
                  ) : (
                    values?.description
                  )}
                </Typography>
              </Tooltip>
            </Box>
          </>
        )}
      </Formik>
    </Box>
  );
};
