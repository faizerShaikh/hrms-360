import {
  Divider,
  Grid,
  Step,
  StepLabel,
  Stepper as MuiStepper,
  styled,
  Typography,
} from "@mui/material";
import { colors } from "constants/theme";
import React, {
  cloneElement,
  ReactElement,
  useEffect,
  useMemo,
  useState,
} from "react";
import { StepIconProps } from "@mui/material/StepIcon";
import { Checkmark } from "@carbon/icons-react";

interface StepType {
  position: number;
  step: number | string;
  component: ReactElement;
}

interface stepperProps {
  activeStep: number;
  steps: StepType[];
  alternativeLabel?: boolean;
  hideDevider?: boolean;
  orientation?: "vertical" | "horizontal";
  justify?: string;
}

export const QontoStepIconRoot = styled("div")<{
  ownerState: { active?: boolean };
}>(({ ownerState }) => ({
  display: "flex",
  height: 22,
  alignItems: "center",
  ...(ownerState.active && {
    color: colors.primary.dark,
  }),
  "& .QontoStepIcon-completedIcon": {
    color: colors.primary.dark,
    zIndex: 1,
    fontSize: 18,
  },
}));

function QontoStepIcon(props: StepIconProps) {
  const { active, completed, className, icon } = props;

  return (
    <QontoStepIconRoot ownerState={{ active }} className={className}>
      {completed ? (
        <div
          className="rounded-full flex items-center justify-center"
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
          className="rounded-full flex items-center justify-center"
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

export const Stepper = ({
  activeStep,
  steps,
  alternativeLabel = false,
  hideDevider = false,
  orientation = "horizontal",
  justify = "justify-center",
}: stepperProps) => {
  const [currStep, setCurrStep] = useState<number>(activeStep);

  useEffect(() => {
    setCurrStep(activeStep);
  }, [activeStep]);

  let Component = useMemo(() => {
    return (
      steps.find((item) => item.position === currStep)?.component || <div></div>
    );
  }, [currStep, steps]);

  return (
    <Grid container className={`flex  ${justify}`}>
      <Grid item xs={10}>
        <MuiStepper
          activeStep={currStep}
          className="mb-4"
          alternativeLabel={alternativeLabel}
          orientation={orientation}
        >
          {steps.map((item, index) => {
            return (
              <Step key={item.step}>
                <StepLabel
                  StepIconComponent={QontoStepIcon}
                  color={index === currStep ? "#828282" : "#333333"}
                  className="text-lg"
                >
                  <Typography className="text-sm">{item.step}</Typography>
                </StepLabel>
              </Step>
            );
          })}
        </MuiStepper>
        {!hideDevider && <Divider />}
      </Grid>
      <Grid item xs={12}>
        {cloneElement(Component, { setActiveStep: setCurrStep })}
      </Grid>
    </Grid>
  );
};
