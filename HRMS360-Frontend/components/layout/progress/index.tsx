import { LinearProgress, linearProgressClasses, LinearProgressProps } from '@mui/material';
import styled from "@emotion/styled";

const BorderLinearProgress = styled(LinearProgress)(() => ({
    height: 15,
    borderRadius: 10,
    [`&.${linearProgressClasses.colorPrimary}`]: {
        backgroundColor: "#E0E0E0",
    },
    [`& .${linearProgressClasses.bar}`]: {
        borderRadius: 10,
        backgroundColor: "#0DC7B1",
    },
}));


export const LinearProgressBar = (props: LinearProgressProps) => {
    return (
        <BorderLinearProgress {...props} />
    );
};