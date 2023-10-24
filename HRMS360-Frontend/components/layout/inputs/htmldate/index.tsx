import React from "react";

interface DateProps {
  defaultValue: string;
  onBlur: (value: string) => void;
}
export const HTMLDate = ({ defaultValue = "", onBlur }: DateProps) => {
  const [date, setDate] = React.useState<string>(defaultValue);

  return (
    <input
      className='w-full outline-0 bg-transparent pl-1 py-1  text-base '
      style={{
        background: "#E7EDF2",
        border: "1.5px solid #E7EDF2",
        borderRadius: "6px",
        color: "#6f6b6b",
      }}
      type='datetime-local'
      name='end_date'
      onChange={(e) => {
        setDate(e.target.value);
      }}
      onBlur={(e) => {
        onBlur(e.target.value);
      }}
      value={date}
    />
  );
};
