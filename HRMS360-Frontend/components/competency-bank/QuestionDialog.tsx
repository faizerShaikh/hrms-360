import React, { useMemo } from "react";
import {
  Checkbox,
  FormControlLabel,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  Typography,
} from "@mui/material";
import { Dialog } from "..";
import { Label, Input, Button, AutoComplete } from "..";
import { Add, Edit } from "@carbon/icons-react";
import { FieldArray, Form, Formik } from "formik";
import { useRouter } from "next/router";
import { useCreateOrUpdate } from "hooks/useCreateOrUpdate";
import { AssessmentAreaInterface } from "interfaces/settings";
import * as yup from "yup";
import {
  getResponseObj,
  ResponseDefaults,
  responseTypeChoices,
} from "constants/competency";
import { ResponseOptionField } from "./ResponseOptionField";
import {
  QuestionInterface,
  QuestionResponseType,
} from "interfaces/competency-bank";
import { colors } from "constants/theme";
import { getIdsArray } from "utils/getIdsArray";
import { VoidFunction } from "types/functionTypes";
import { toast } from "utils/toaster";
import { useQueryClient } from "react-query";
import { onError } from "utils/onError";
import { useGetAll } from "hooks/useGetAll";

export interface QuestionDialogProps {
  isUpdate?: boolean;
  isChannelPartner?: boolean;
  data?: QuestionInterface;
}

const typesWithResponse = ["single_choice", "multiple_choice", "likert_scale"];
const questionInitialValues: QuestionInterface<{
  label: string;
  value: string;
}> = {
  text: "",
  competency_id: "",
  response_type: { label: "", value: "" },
  area_assessments: [],
  responses: [],
  standard_response: false,
};

const questionValidations = yup.object({
  text: yup.string().required("Question text is required"),
  area_assessments: yup
    .array()
    .min(1, "Atleast one Assessment area is required")
    .required("Atleast one Assessment area is required")
    .nullable(),
  response_type: yup
    .object({
      label: yup.string(),
      value: yup.string(),
    })
    .required("Response type is required"),
});

export const QuestionDialog = ({
  isUpdate = false,
  data,
  isChannelPartner = false,
}: QuestionDialogProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const url = useMemo(() => {
    if (isChannelPartner) {
      return isUpdate
        ? `/standard-competency/question/${data?.id}`
        : "/standard-competency/question";
    } else {
      return isUpdate
        ? `/competency/question/${data?.id}`
        : "/competency/question";
    }
  }, [isChannelPartner, isUpdate, data?.id]);

  const { mutate, isLoading } = useCreateOrUpdate({
    url,
    method: isUpdate ? "put" : "post",
    refetch: async () => {
      let query = [`/competency/${router.query.id}`];
      if (isChannelPartner) {
        query = [`/standard-competency/${router.query.id}`];
      }

      await queryClient.refetchQueries(query, {
        exact: true,
      });
    },
  });

  const { data: standardData, refetch } = useGetAll({
    key: "/setting/standard-response",
    enabled: false,
  });

  const onTypeChange = (type: any, setFieldValue: any) => {
    if (type === "standard_responses") {
      setFieldValue("responses", standardData.rows || []);
    } else {
      setFieldValue("response_type", type ? type : { label: "", value: "" });
      setFieldValue("responses", type ? ResponseDefaults[type.value] : []);
    }
  };

  const onSubmit = (
    values: QuestionInterface<{ label: string; value: string }>,
    onClose: VoidFunction,
    setFieldError: any
  ) => {
    try {
      if (!values.response_type.value) {
        setFieldError("response_type", "Response type is required");
        return;
      }
      let responses: string[] = [];
      const data: any = {
        ...values,
        response_type: values.response_type.value,
        competency_id: router?.query?.id,
        area_assessments: getIdsArray(values?.area_assessments),
        responses: values?.responses!.map((item) => {
          if (responses.includes(item.label)) {
            throw new Error("Response Label must be uniqe");
          }

          responses.push(item.label);
          if (typesWithResponse.includes(values.response_type.value)) {
            if (!item.label) {
              throw new Error("Please add label in all responses");
            }
            if (values.response_type.value === "likert_scale" && !item.score) {
              throw new Error("Please add score in all responses");
            }
            if (
              values.response_type.value === "likert_scale" &&
              item.score &&
              item.score > 5
            ) {
              throw new Error("Score must be less then 5");
            }
          }

          return {
            ...item,
            is_standard: false,
            score: item.score,
            id: undefined,
          };
        }),
      };

      mutate(data, {
        onSuccess: () => {
          toast(`Question ${isUpdate ? "Updated" : "Added"} successfully`);
          onClose();
        },
      });
    } catch (error) {
      onError(error);
    }
  };

  return (
    <Dialog
      maxWidth='xl'
      title={"Add Question"}
      buttonOnClick={() => refetch()}
      button={
        <Button
          className={`px-4 ${
            isUpdate && "ml-4"
          } capitalize xl:text-sm 2xl:text-semi-base`}
          variant={"contained"}
          startIcon={isUpdate ? <Edit /> : <Add size={24} />}
        >
          {isUpdate ? "Edit" : "New Question"}
        </Button>
      }
    >
      {({ onClose }) => (
        <Formik
          initialValues={
            isUpdate
              ? {
                  ...questionInitialValues,
                  ...data,
                  responses:
                    data &&
                    data.response_type === QuestionResponseType.likert_scale
                      ? data.responses?.filter(
                          (item) => item.label !== "Don't Know"
                        )
                      : data
                      ? data?.responses
                      : questionInitialValues.responses,
                  response_type: responseTypeChoices.find(
                    (item) => item.value === data?.response_type
                  ) || { label: "", value: "" },
                }
              : questionInitialValues
          }
          enableReinitialize
          validationSchema={questionValidations}
          onSubmit={(values, { setFieldError }) =>
            onSubmit(values, onClose, setFieldError)
          }
        >
          {({ values, setFieldValue }) => (
            <Form>
              <Grid className='py-10' container gap={4}>
                <Grid container item>
                  <Grid item xs={2}>
                    <Label
                      text='Question:'
                      className='xl:text-sm 2xl:text-base'
                    />
                  </Grid>
                  <Grid item xs={8}>
                    <Input multiline rows={3} name='text' />
                  </Grid>
                </Grid>
                <Grid container item>
                  <Grid xs={2}>
                    <Label
                      text='Area Assessed:'
                      className='xl:text-sm 2xl:text-base'
                    />
                  </Grid>
                  <Grid item xs={8}>
                    <AutoComplete
                      multiple
                      url={
                        isChannelPartner
                          ? "/setting/area-assessment/standard"
                          : "/setting/area-assessment"
                      }
                      getOptionLabel={(option: AssessmentAreaInterface) =>
                        option.name || ""
                      }
                      name='area_assessments'
                      className='xl:text-sm 2xl:text-base'
                    />
                  </Grid>
                </Grid>
                <Grid container item>
                  <Grid xs={2}>
                    <Label
                      text='Response Type:'
                      className='xl:text-sm 2xl:text-base'
                    />
                  </Grid>
                  <Grid item xs={8}>
                    <AutoComplete
                      name='response_type'
                      options={responseTypeChoices}
                      onChange={(_, v) => onTypeChange(v, setFieldValue)}
                      getOptionLabel={(option) => option?.label || ""}
                      className='xl:text-sm 2xl:text-base'
                    />
                  </Grid>
                </Grid>

                {typesWithResponse.includes(values.response_type?.value) && (
                  <Grid container item>
                    <Grid xs={2}>
                      <Label
                        text='Responses:'
                        className='xl:text-sm 2xl:text-base'
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <List className='w-full'>
                        <FieldArray name='responses'>
                          {({ push, remove }) => (
                            <>
                              {values.responses &&
                                values.responses?.map((item, index) => (
                                  <ResponseOptionField
                                    key={item.id}
                                    remove={remove}
                                    isLikert={
                                      values.response_type.value ===
                                      "likert_scale"
                                    }
                                    index={index}
                                  />
                                ))}
                              {values?.responses?.length !== 5 && (
                                <ListItem className='flex items-center px-0 w-full'>
                                  <ListItemAvatar
                                    sx={{ minWidth: "20px" }}
                                    className='flex items-center'
                                  >
                                    <Add
                                      color={colors.primary.dark}
                                      size={20}
                                      className='mr-3'
                                    />
                                  </ListItemAvatar>
                                  <Typography>
                                    <span
                                      style={{ color: colors.primary.dark }}
                                      className='underline cursor-pointer xl:text-sm 2xl:text-base'
                                      onClick={() => {
                                        push(
                                          getResponseObj(
                                            values.response_type.value
                                          )
                                        );
                                      }}
                                    >
                                      Add Option
                                    </span>
                                  </Typography>
                                </ListItem>
                              )}
                            </>
                          )}
                        </FieldArray>
                      </List>
                    </Grid>
                    {values.response_type?.value === "likert_scale" &&
                      !isChannelPartner && (
                        <Grid item xs={4} justifyContent={"start"}>
                          <FormControlLabel
                            control={<Checkbox />}
                            label='Select From Standard Response'
                            sx={{
                              "& .MuiFormControlLabel-label": {
                                fontSize: "14px",
                              },
                            }}
                            name='standard_response'
                            onChange={(_, v) => {
                              if (v) {
                                onTypeChange(
                                  "standard_responses",
                                  setFieldValue
                                );
                              } else {
                                onTypeChange(
                                  values.response_type,
                                  setFieldValue
                                );
                              }
                            }}
                          />
                        </Grid>
                      )}
                  </Grid>
                )}

                <Grid container item className='d-flex'>
                  <Grid item container xs={2}></Grid>
                  <Grid item container xs={8}>
                    <Button
                      color='secondary'
                      className='px-4 mr-4 capitalize xl:text-sm 2xl:text-semi-base'
                      onClick={() => onClose()}
                    >
                      Discard
                    </Button>
                    <Button
                      className='px-4 capitalize xl:text-sm 2xl:text-semi-base'
                      type='submit'
                      isLoading={isLoading}
                    >
                      Save
                    </Button>
                  </Grid>
                </Grid>
              </Grid>
            </Form>
          )}
        </Formik>
      )}
    </Dialog>
  );
};
