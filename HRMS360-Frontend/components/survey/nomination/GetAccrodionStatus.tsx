import { DotMark } from "@carbon/icons-react";
import { colors } from "constants/theme";
import { defaultRaters } from "constants/survey";
import { PendingNominationInterface } from "interfaces/survey";
import React from "react";

const GetAccrodionStatus = ({ item }: { item: PendingNominationInterface }) => {
  if (item.name) {
    if (
      (item.raters.length &&
        item.raters.every((rater) => rater.is_approved_by_line_manager)) ||
      (item.externalRespondents.length &&
        item.externalRespondents.every(
          (rater) => rater.is_approved_by_line_manager
        ))
    ) {
      return (
        <div className="flex justify-end items-center">
          <DotMark color={colors.primary.dark} className="mr-1" />
          Approved
        </div>
      );
    }
    if (
      defaultRaters.includes(item?.name) &&
      item.raters.length &&
      item.raters.every((rater) => rater.is_selected_by_system)
    ) {
      return (
        <div className="flex justify-end items-center">
          <DotMark color={colors.primary.dark} className="mr-1" />
          Already Nominated by HR
        </div>
      );
    }
    return (
      <div className="flex justify-end items-center">
        {item.is_required ? (
          <span className="flex justify-end items-center border-r-2 border-gray-300 px-3">
            <DotMark color={colors.secondary.dark} className="mr-1" />
            Required : {`${item.no_of_raters}`.padStart(2, "0")}
          </span>
        ) : (
          <span className="flex justify-end items-center border-r-2 border-gray-300 px-3">
            <DotMark color={colors.tertiary.main} className="mr-1" />
            Optional : {`${item.no_of_raters}`.padStart(2, "0")}
          </span>
        )}
        <span className="flex justify-end items-center pl-3">
          Nominated: {`${item.selectedRaters}`.padStart(2, "0")}
        </span>
      </div>
    );
  }
  return null;
};

export default GetAccrodionStatus;
