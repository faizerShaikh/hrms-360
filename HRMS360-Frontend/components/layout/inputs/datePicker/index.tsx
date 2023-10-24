import {
  DatePicker as MuiDatePicker,
  LocalizationProvider,
} from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Input } from "../input";
import { Dayjs } from "dayjs";

export const DatePicker = ({
  onChange,
  value,
  fromDate,
  label,
}: {
  onChange: (value: any) => void;
  value: Dayjs;
  fromDate?: any;
  label?: string;
}) => {
  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MuiDatePicker
          label={label}
          views={["year", "month"]}
          openTo={"month"}
          disableFuture
          minDate={fromDate}
          onChange={onChange}
          value={value}
          renderInput={(params) => {
            return <Input {...params} sx={{ width: "150px" }} />;
          }}
        />
      </LocalizationProvider>
    </>
  );
};
