import { Box } from "@mui/material";
import React, { ReactNode } from "react";

interface FormContainerProps {
    children: ReactNode;
    className?: string;
}

export const FormContainer = ({ children, className }: FormContainerProps) => {
    return (
        <Box className={`flex items-center justify-center ${className}`}>
            <Box className="w-2/3 p-10 rounded-xl border-2 flex flex-col items-center justify-center">
                {children}
            </Box>
        </Box>

    );
};

