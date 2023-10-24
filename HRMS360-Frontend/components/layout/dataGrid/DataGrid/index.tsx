import { Grid } from "@mui/material";
import { Search } from "components/layout/inputs";
import React, {
  ChangeEvent,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  DataGrid as MuiDataGrid,
  GridFeatureModeConstant,
} from "@mui/x-data-grid";
import { DataGridProps } from "@mui/x-data-grid/models/props/DataGridProps";
import { colors } from "constants/theme";
import { Pagination } from "components/layout/pagination";
import { useGetAll } from "hooks/useGetAll";
import { NoDataOverlay } from "../NoDataOverlay";
import { useDebounce } from "hooks/useDebounce";
import { searchData } from "utils/searchData";

type DataGridRows = any[] | { rows: any[]; count: number };
interface DataGridComponent extends Omit<DataGridProps, "rows"> {
  addButton?: ReactNode;
  noSearch?: boolean;
  url?: string;
  refetchInside?: boolean;
  rows: DataGridRows;
}

const dataGridStyles = {
  "borderRadius": 0,
  "border": "none",
  "& .MuiDataGrid-columnHeaders": {
    "backgroundColor": colors.tertiary.light,
    "borderRadius": 0,
    "color": colors.text.dark,
    "border": "1px solid #E0E7ED",
    "& .MuiDataGrid-columnHeaderTitleContainer": {
      paddingLeft: "6px",
      paddingRight: "8px",
    },
    "& .MuiDataGrid-columnHeaderTitle": {
      fontWeight: "600",
      fontFamily: "'Century Gothic Bold', sans-serif",
      color: "#4D4D4D",
      fontSize: {
        sm: "14px",
        xl: "16px",
        lg: "15px",
      },
    },
  },
  "& .MuiDataGrid-virtualScroller": {
    borderLeft: "1px solid #E0E7ED",
    borderRight: "1px solid #E0E7ED",
  },
  "& .MuiDataGrid-cell": {
    color: colors.text.main,
    fontFamily: "'Aller', sans-serif",
    paddingLeft: "16px",
    paddingRight: "16px",
  },
  "& .MuiDataGrid-cellContent": {
    fontSize: {
      md: "14px",
      lg: "14px",
      xl: "15px",
    },
    fontFamily: "inherit",
  },
  "& .MuiDataGrid-columnSeparator .MuiSvgIcon-root": {
    display: "none",
  },
  "& .MuiDataGrid-columnHeader": {
    borderRight: "1px solid #fff",
  },
  "& .MuiDataGrid-selectedRowCount": {
    width: "130px",
    borderRight: `2px solid #e5e7eb`,
    height: "32px",
    marginRight: 0,
  },
  "& .MuiCheckbox-root": {
    color: "#c4c4c4",
  },
};

export const DataGrid = ({
  columns = [],
  rows = [],
  addButton,
  noSearch = false,
  url = "",
  refetchInside = false,

  ...otherProps
}: DataGridComponent) => {
  const [query, setQuery] = useState<string | null>(null);
  const [data, setData] = useState<DataGridRows>([]);
  const [queryKey, setQueryKey] = useState("");
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 25,
  });

  const search = useDebounce(query || "", 1000);

  useEffect(() => {
    if (rows) {
      if (Array.isArray(rows) && rows.length) {
        setData(rows);
      }
      if ("rows" in rows && Array.isArray(rows.rows) && rows.rows.length) {
        setData(rows);
      }
    }
  }, [rows]);

  useEffect(() => {
    if (refetchInside) {
      setQueryKey(url);
    }
  }, [refetchInside, url]);

  useGetAll({
    key: url,
    params: {
      page: pagination.page,
      limit: pagination.limit,
      search: search,
    },
    enabled: refetchInside || Boolean(queryKey),
    onSuccess(data) {
      setData(data);
    },
  });

  const onPageChange = useCallback(
    (page: number) => {
      setPagination((prev) => ({ ...prev, page }));
      setQueryKey(
        `${url}?page=${page}&limit=${pagination.limit}&search=${search}`
      );
    },
    [url, pagination, search]
  );

  const onPageLimitChange = useCallback(
    (limit: number) => {
      setPagination((prev) => ({ ...prev, limit, page: 0 }));
      setQueryKey(`${url}?page=${0}&limit=${limit}&search=${search}`);
    },
    [url, search]
  );

  useEffect(() => {
    if (search) {
      setQueryKey(
        `${url}?page=${0}&limit=${pagination.limit}&search=${search}`
      );
      setPagination((prev) => ({ ...prev, page: 0 }));
    }
  }, [search, pagination.limit, url]);

  const getPaginationState = useCallback(() => {
    if (url) {
      return {
        onPageChange,
        pageSize: pagination.limit,
        onPageSizeChange: onPageLimitChange,
        page: pagination?.page,
        paginationMode: GridFeatureModeConstant.server,
      };
    } else {
      return {};
    }
  }, [url, pagination, onPageChange, onPageLimitChange]);

  const onClear = () => {
    setQuery("");
    if (url) {
      setQueryKey(`${url}?page=${pagination.page}&limit=${pagination.limit}`);
    } else {
      setData(rows);
    }
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setQuery(e.target.value);
    } else {
      setQueryKey(`${url}?page=${pagination.page}&limit=${pagination.limit}`);
      setQuery(e.target.value);
    }
  };

  useEffect(() => {
    if (!url && search) {
      const newData = searchData(rows, search);
      setData(newData);
    }
  }, [url, search, rows]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} className='flex items-center justify-between'>
        {!noSearch ? (
          <Search
            sx={{ width: "300px" }}
            value={query || ""}
            className='xl:h-9    2xl:h-11'
            onClear={onClear}
            onChange={onChange}
          />
        ) : (
          <div />
        )}
        {addButton}
      </Grid>
      <Grid
        item
        xs={12}
        sx={{
          height: !("rows" in data ? data.rows : data || []).length
            ? "500px"
            : "auto",
        }}
      >
        <MuiDataGrid
          {...otherProps}
          columns={columns}
          rows={"rows" in data ? data.rows : data || []}
          sx={dataGridStyles}
          components={{
            Pagination,
            NoRowsOverlay: NoDataOverlay,
          }}
          keepNonExistentRowsSelected
          {...getPaginationState()}
          autoHeight={Boolean(("rows" in data ? data.rows : data || []).length)}
          rowCount={"count" in data ? data.count : data.length}
          disableSelectionOnClick
        />
      </Grid>
    </Grid>
  );
};
