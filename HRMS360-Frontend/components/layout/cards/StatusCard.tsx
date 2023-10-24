import { colors } from "constants/theme";
import React from "react";

interface StatusCardProps {
  text: string;
  variant:
    | "initiated"
    | "in_progress"
    | "on_hold"
    | "completed"
    | "terminated"
    | "cancelled"
    | "closed"
    | "pending_approval";
}

export const StatusCard = ({ text, variant }: StatusCardProps) => {
  return (
    <div
      className={`px-5 py-2 rounded-xl text-center`}
      style={{
        background:
          colors.status[
            [
              "suggested_by_line_manager",
              "suggested_by_employee",
              "pending_approval",
            ].includes(variant)
              ? "in_progress"
              : variant
          ].background,
      }}
    >
      <p
        style={{
          color:
            colors.status[
              [
                "suggested_by_line_manager",
                "suggested_by_employee",
                "pending_approval",
              ].includes(variant)
                ? "in_progress"
                : variant
            ].text,
        }}
        className='m-0  xl:text-[13px]	2xl:text-semi-base'
      >
        {text}
      </p>
    </div>
  );
};
