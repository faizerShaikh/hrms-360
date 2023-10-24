import React from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import { colors } from "constants/theme";
import { CompetencyInterface } from "interfaces/competency-bank";
import { Formik } from "formik";
import * as yup from "yup";
import { useCreateOrUpdate } from "hooks/useCreateOrUpdate";
import { getCookie } from "cookies-next";
import { useRouter } from "next/router";
import { useQueryClient } from "react-query";

const validations = yup.object({
  title: yup.string().required("Title is requierd"),
  description: yup.string().required("Description is requierd"),
});
export const CompetencyDescription = ({
  data,
}: {
  data?: CompetencyInterface;
}) => {
  const router = useRouter();
  const is_client = getCookie("is_client");
  const queryClient = useQueryClient();

  const { mutate } = useCreateOrUpdate({
    url: `${!is_client ? "/standard-competency/" : "/competency/"}${data?.id}`,
    refetch: async () => {
      let query = [`/competency/${router.query.id}`];
      if (!is_client) {
        query = [`/standard-competency/${router.query.id}`];
      }

      await queryClient.refetchQueries(query, {
        exact: true,
      });
    },
    method: "put",
  });

  return (
    <Box className="mt-0">
      <Formik
        initialValues={{
          ...data,
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
                title={
                  router.pathname.includes("my") || !is_client
                    ? `Double Click on text to update`
                    : ""
                }
                followCursor
              >
                <Typography
                  className="w-full text-grid lg:text-base xl:text-base 2xl:text-lg"
                  onDoubleClick={() => {
                    if (router.pathname.includes("my") || !is_client) {
                      setFieldValue("isTitleEdit", !values.isTitleEdit);
                    }
                  }}
                >
                  {values.isTitleEdit ? (
                    <input
                      className="w-4/5 outline-0 bg-transparent pl-1 py-1 border-b border-b-slate-500 text-base "
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
              <Typography
                className="w-44  lg:text-base xl:text-base 2xl:text-lg"
                color={"#333333"}
              >
                No of Questions: {data?.no_of_questions}
              </Typography>
            </Box>
            <Box className="py-6 px-4 border-2 border-t-0">
              <Tooltip
                arrow
                title={
                  router.pathname.includes("my") || !is_client
                    ? `Double Click on text to update`
                    : ""
                }
                followCursor
              >
                <Typography
                  color={colors.text.light}
                  className="lg:text-sm  xl:text-sm 2xl:text-base"
                  onDoubleClick={() => {
                    if (router.pathname.includes("my") || !is_client) {
                      setFieldValue(
                        "isDescriptionEdit",
                        !values.isDescriptionEdit
                      );
                    }
                  }}
                >
                  {values.isDescriptionEdit ? (
                    <textarea
                      className="w-full outline-0 bg-transparent pl-1 py-1 border-b border-b-slate-500 text-base resize-none "
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
