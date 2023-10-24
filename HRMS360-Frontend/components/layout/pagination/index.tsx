import React from "react";
import {
  gridPageCountSelector,
  gridPageSelector,
  gridPageSizeSelector,
  useGridApiContext,
  useGridSelector,
  gridRowCountSelector,
} from "@mui/x-data-grid";
import { Box, MenuItem, Pagination as MuiPagination } from "@mui/material";
import { colors } from "constants/theme";
import { Select } from "../inputs/select";

const paginationStyles = {
  "& .MuiPaginationItem-root": {
    "background": colors.tertiary.light,
    "fontFamily": "'Century Gothic', sans-serif",
    "padding": "10px",
    "minWidth": "auto",
    "width": "26px",
    "height": "32px",
    "fontSize": "12px",
    "&:hover": {
      opacity: 0.8,
    },
  },
  "& .MuiPagination-ul li:first-of-type .MuiPaginationItem-root": {
    width: "38px",
    height: "32px",
    borderRadius: "8px",
  },
  "& .MuiPagination-ul li:last-child .MuiPaginationItem-root": {
    width: "38px",
    height: "32px",
    borderRadius: "8px",
  },
  "& .MuiPaginationItem-ellipsis": {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "30px",
  },
  "& .MuiPaginationItem-root.Mui-selected": {
    background: colors.primary.dark,
    color: "#fff",
    width: "26px",
    height: "32px",
    borderRadius: "8px",
  },
};

export const Pagination = () => {
  const apiRef = useGridApiContext();
  const pageSize = useGridSelector(apiRef, gridPageSizeSelector);
  const page = useGridSelector(apiRef, gridPageSelector);
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);
  const total = useGridSelector(apiRef, gridRowCountSelector);

  return (
    <Box className='flex justify-between items-center w-full py-5'>
      <Box className='flex items-center justify-start text-xs'>
        <div
          className='border-r-2 p-2 century-gothic'
          style={{ color: "#333333" }}
        >
          Showing {page * pageSize || 1} to {page * pageSize + pageSize} of{" "}
          {total} entries
        </div>
        <div
          className='p-2 flex items-center century-gothic'
          style={{
            fontFamily: "'Century Gothic', sans-serif",
            color: "#333333",
          }}
        >
          Show{" "}
          <Select
            value={pageSize.toString()}
            onChange={(e: any) =>
              apiRef.current.setPageSize(+e.target.value || 25)
            }
            sx={{
              fontFamily: "'Century Gothic', sans-serif",
              color: "#333333",
            }}
          >
            {[2, 5, 10, 25, 50, 75, 100].map((item) => (
              <MenuItem
                key={item}
                value={item}
                sx={{
                  fontFamily: "'Century Gothic', sans-serif",
                  color: "#333333",
                }}
              >
                {item}
              </MenuItem>
            ))}
          </Select>
          entries
        </div>
      </Box>
      <MuiPagination
        sx={paginationStyles}
        count={pageCount}
        shape='rounded'
        size='large'
        page={page + 1}
        onChange={(_, value) => apiRef.current.setPage(value - 1)}
      />
    </Box>
  );
};
