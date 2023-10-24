import { Box, Typography } from "@mui/material";
import { colors } from "constants/theme";
import { useDebounce } from "hooks/useDebounce";
import React, { ReactNode, useState } from "react";
import { Search } from "../inputs";

interface TransferlistProps {
  header: string;
  children: ReactNode;
}
export const Transferlist = ({ header, children }: TransferlistProps) => {
  const [search, setSearch] = useState("");
  const query = useDebounce(search, 1000);
  return (
    <Box className='border-gray-200 border p-4 h-full'>
      <Typography
        className='text-dark font-normal mb-4  xl:text-base 2xl:text-lg'
        sx={{
          borderBottom: `0.5px solid ${colors.primary.dark}`,
          fontFamily: "'Century Gothic', 'sans-serif'",
        }}
      >
        {header}
      </Typography>
      <Search
        placeholder='Search name, designation, or etc.'
        size='small'
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onClear={() => setSearch("")}
      />
      <Box className='mt-5 px-2'>
        {children && typeof children === "object" && "props" in children
          ? React.cloneElement(children, {
              query,
            })
          : children}
      </Box>
    </Box>
  );
};
