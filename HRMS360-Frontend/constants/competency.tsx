import {
  LikertScaleProps,
  LikertScaleView,
  YesNo,
  YesNoInterface,
} from "components/competency-bank";
import { MCQView, MCQViewProps } from "components/competency-bank/MCQView";
import { SingleChoiceView } from "components/competency-bank/SingleChoiceView";
import { Input } from "components/layout";
import { ResponseObjInterface } from "interfaces/competency-bank";
import { nanoid } from "nanoid";

export const responseTypeChoices = [
  { label: "Text", value: "text" },
  { label: "Yes/No", value: "yes_no" },
  { label: "Single Choice", value: "single_choice" },
  { label: "Multiple Select MCQ", value: "multiple_choice" },
  { label: "Likert Scale", value: "likert_scale" },
];

export const responseComponents: {
  [key: string]: (props: any) => JSX.Element;
} = {
  text: () => (
    <>
      <Input multiline rows={3} disabled fullWidth />
    </>
  ),
  yes_no: (props: YesNoInterface) => <YesNo {...props} />,
  single_choice: (props: MCQViewProps) => <SingleChoiceView {...props} />,
  multiple_choice: (props: MCQViewProps) => <MCQView {...props} />,
  likert_scale: (props: LikertScaleProps) => <LikertScaleView {...props} />,
};

export const getResponseObj = (type: string) => {
  return {
    type,
    label: "",
    score: type === "likert_scale" ? 0 : null,
    id: nanoid(),
  };
};

export const ResponseDefaults: { [key: string]: ResponseObjInterface[] } = {
  text: [
    {
      type: "text",
      label: "",
      score: null,
    },
  ],
  yes_no: [
    {
      type: "yes_no",
      label: "Yes",
      score: 1,
    },
    {
      type: "yes_no",
      label: "No",
      score: 0,
    },
  ],
  single_choice: [
    getResponseObj("single_choice"),
    getResponseObj("single_choice"),
  ],
  multiple_choice: [
    getResponseObj("multiple_choice"),
    getResponseObj("multiple_choice"),
  ],
  likert_scale: [
    getResponseObj("likert_scale"),
    getResponseObj("likert_scale"),
  ],
};
