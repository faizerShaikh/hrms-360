import {
  Box,
  FormGroup,
  TextField,
  RadioGroup as MuiRadioGroup,
  FormControlLabel,
  Radio,
  useMediaQuery,
} from "@mui/material";
import { Checkbox, RadioGroup } from "components/layout";
import {
  QuestionInterface,
  ResponseObjInterface,
} from "interfaces/competency-bank";
import { Checkbox as CheckboxIcon } from "@carbon/icons-react";
import { colors } from "./theme";
import { memo } from "react";
import { SurveyResponseInterface } from "interfaces/survey";

interface onChnageOptions {
  name: string;
  value: string | boolean;
  id: number;
  checkedId?: string;
}
interface SurveyFieldProps {
  options: ResponseObjInterface[];
  onChange: (onChnageOptions: onChnageOptions) => void;
  id: number;
  item: QuestionInterface & SurveyResponseInterface;
}

const SurveyTextField = (props: SurveyFieldProps) => {
  return (
    <TextField
      placeholder="Add Comment"
      fullWidth
      multiline
      rows={4}
      value={props.item.response_text}
      sx={{
        "& .MuiTypography-root": {
          color: colors.tertiary.dark,
        },
      }}
      onChange={(e) =>
        props.onChange &&
        props.onChange({
          name: "response_text",
          value: e.target.value,
          id: props.id,
        })
      }
    />
  );
};

const MemoizedTextField = memo(SurveyTextField, (prevProps, nextProps) => {
  return nextProps.item.response_text === prevProps.item.response_text;
});

const SurveySelect = (props: any) => {
  return (
    <RadioGroup
      {...props}
      value={props.item.response_id}
      sx={{
        "& .MuiTypography-root": {
          color: colors.tertiary.dark,
        },
      }}
      onChange={(e: any) => {
        props.onChange &&
          props.onChange({
            name: "response_id",
            value: e.target.value,
            id: props.id,
          });
      }}
    />
  );
};
const MemoizedSelect = memo(SurveySelect, (prevProps, nextProps) => {
  return nextProps.item.response_id === prevProps.item.response_id;
});

const SurveyMultipleSelect = (props: any) => {
  return (
    <FormGroup>
      {props.options?.map((item: ResponseObjInterface) => (
        <Checkbox
          key={item.value}
          label={item?.label}
          className="text-sm md:text-base flex justify-start items-start"
          id={Math.random() < 0.5 ? "select" : undefined}
          checked={props.item.response_ids.includes(item.value)}
          onChange={(_: any, checked: boolean) => {
            props.onChange &&
              props.onChange({
                name: "response_ids",
                value: checked,
                id: props.id,
                checkedId: item.value,
              });
          }}
          sx={{
            "& .MuiTypography-root": {
              color: colors.tertiary.dark,
            },
          }}
          checkBoxProps={{
            color: "primary",
            icon: <CheckboxIcon color={colors.primary.dark} size={24} />,
          }}
          name={item?.label}
        />
      ))}
    </FormGroup>
  );
};

const MemoizedMultipleSelect = memo(
  SurveyMultipleSelect,
  (prevProps, nextProps) => {
    return (
      JSON.stringify(nextProps.item.response_ids) ===
      JSON.stringify(prevProps.item.response_ids)
    );
  }
);

const getOptions = (options: ResponseObjInterface[]) => {
  let reversedOptions = [...options]?.reverse();

  const isMobile = useMediaQuery("(max-width:640px)");

  let labels: any = [];
  let radioButtons: any = [];
  for (const item of reversedOptions) {
    labels.push(
      <Box
        key={item?.id}
        className={`text-center py-2 break-normal text-tertiary text-sm md:text-base mr-5`}
        sx={{
          maxWidth: `170px`,
          minWidth: `100px`,
        }}
      >
        {item.label}
      </Box>
    );

    radioButtons.push(
      <Box
        className="flex justify-center items-center mr-5"
        sx={{
          maxWidth: `${isMobile ? "50px" : "170px"}`,
          minWidth: `${isMobile ? "30px" : "100px"}`,
        }}
      >
        <FormControlLabel
          className="m-0 flex-col"
          label={isMobile && (item?.score === 0 ? `Don't know` : item?.score)}
          key={item?.value?.toString()}
          value={item.value}
          id={Math.random() < 0.5 ? "select" : undefined}
          control={
            <Radio
              size={isMobile ? "small" : "medium"}
              sx={{ color: colors.primary.dark }}
            />
          }
        />
      </Box>
    );
  }

  return (
    <>
      {!isMobile && (
        <div className="text-[#787878] flex justify-between items-start w-full gap-10">
          {labels}
        </div>
      )}
      <div className="flex justify-between items-start w-full ">
        {radioButtons}
      </div>
    </>
  );
};
const SurveyLikertScale = (props: SurveyFieldProps) => {
  return (
    <MuiRadioGroup
      aria-labelledby={`demo-radio-buttons-group-label-${props.item.text}`}
      name={`radio-buttons-group-${props.item.text}`}
      value={props.item.response_id}
      onChange={(e) => {
        props.onChange &&
          props.onChange({
            name: "response_id",
            value: e.target.value,
            id: props.id,
          });
      }}
      sx={{
        "& .MuiFormControlLabel-label": {
          fontSize: "14px",
          color: "#787878",
        },
      }}
    >
      <Box className="flex items-start justify-between overflow-x-auto flex-col w-full">
        {getOptions(props.options)}
      </Box>
    </MuiRadioGroup>
  );
};

const MemoizedLikertScale = memo(SurveyLikertScale, (prevProps, nextProps) => {
  return nextProps.item.response_id === prevProps.item.response_id;
});

export const surveyAssessmentComponents: any = {
  text: (props: any) => <MemoizedTextField {...props} />,
  yes_no: (props: any) => <MemoizedSelect {...props} />,
  single_choice: (props: any) => <MemoizedSelect {...props} />,
  multiple_choice: (props: any) => <MemoizedMultipleSelect {...props} />,
  likert_scale: (props: any) => <MemoizedLikertScale {...props} />,
};
// export const surveyAssessmentComponents: any = {
//   text: (props: any) => <SurveyTextField {...props} />,
//   yes_no: (props: any) => <SurveySelect {...props} />,
//   single_choice: (props: any) => <SurveySelect {...props} />,
//   multiple_choice: (props: any) => <SurveyMultipleSelect {...props} />,
//   likert_scale: (props: any) => <SurveySelect {...props} />,
// };
