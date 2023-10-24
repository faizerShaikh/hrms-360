import {
  Box,
  Divider,
  Step,
  StepLabel,
  Stepper as MuiStepper,
  styled,
  Typography,
} from "@mui/material";
import { colors } from "constants/theme";
import React from "react";
import { StepIconProps } from "@mui/material/StepIcon";
import { Checkmark } from "@carbon/icons-react";
interface stepperProps {
  activeStep: number;
  steps: Array<string>;
}

const QontoStepIconRoot = styled("div")<{ ownerState: { active?: boolean } }>(
  ({ ownerState }) => ({
    "display": "flex",
    "height": 22,
    "alignItems": "center",
    ...(ownerState.active && {
      color: colors.primary.dark,
    }),
    "& .QontoStepIcon-completedIcon": {
      color: colors.primary.dark,
      zIndex: 1,
      fontSize: 18,
    },
  })
);

function QontoStepIcon(props: StepIconProps) {
  const { active, completed, className, icon } = props;

  return (
    <QontoStepIconRoot ownerState={{ active }} className={className}>
      {completed ? (
        <div
          className='rounded-full flex items-center justify-center'
          style={{
            background: colors.primary.light,
            width: "30px",
            height: "30px",
          }}
        >
          <Checkmark size={24} color={colors.primary.dark} />
        </div>
      ) : (
        <div
          className='rounded-full flex items-center justify-center'
          style={{
            background: active ? colors.primary.light : colors.tertiary.light,
            color: active ? colors.primary.dark : colors.tertiary.dark,
            width: "30px",
            height: "30px",
          }}
        >
          {icon}
        </div>
      )}
    </QontoStepIconRoot>
  );
}

export const Stepper = ({ activeStep, steps }: stepperProps) => {
  return (
    <Box className={`mb-14`}>
      <MuiStepper activeStep={activeStep} className='mb-5'>
        {steps.map((label, index) => {
          return (
            <Step key={label}>
              <StepLabel
                StepIconComponent={QontoStepIcon}
                color={
                  index + 1 >= activeStep ? colors.text.dark : colors.text.light
                }
                className='text-lg'
              >
                <Typography>{label}</Typography>
              </StepLabel>
            </Step>
          );
        })}
      </MuiStepper>
      <Divider />
    </Box>
  );
};
