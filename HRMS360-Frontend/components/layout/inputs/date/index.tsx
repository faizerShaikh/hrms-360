import moment from "moment";
import React from "react";
import { Input } from "../input";

interface DateProps {
  defaultValue: string;
  onBlur: (value: string) => void;
}
export const Date = ({ defaultValue = "", onBlur }: DateProps) => {
  const [date, setDate] = React.useState<string>(defaultValue);

  return (
    <Input
      type={"date"}
      value={date}
      onChange={(e) => {
        setDate(e.target.value);
      }}
      inputProps={{
        min: moment().format("YYYY-MM-DD"),
      }}
      onBlur={(e) => {
        onBlur(e.target.value);
      }}
    />
  );
};
