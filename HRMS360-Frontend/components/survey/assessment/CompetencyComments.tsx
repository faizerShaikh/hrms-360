import { Checkmark } from "@carbon/icons-react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  TextField as MuiTextField,
} from "@mui/material";
import { SurveyResponses } from "pages/survey/assessment/multiple/[token]";

import React from "react";

export const CompetencyComments = ({
  selectedQuestion,
  setSelectedQuestion,
  setQuestions,
  selectedIndex,
}: {
  selectedQuestion: SurveyResponses;
  setSelectedQuestion: any;
  setQuestions: any;
  selectedIndex: number;
}) => {
  const onChange = (name: string, value: any, index: number) => {
    let newObj: any = {
      ...selectedQuestion,
    };

    newObj.comments[index] = {
      ...newObj.comments[index],
      [name]: value,
      is_answerd: Array.isArray(value) ? Boolean(value.length) : Boolean(value),
      is_unanswerd: Array.isArray(value)
        ? !Boolean(value.length)
        : !Boolean(value),
    };

    if (newObj.comments.every((item: any) => item.is_answerd)) {
      newObj["is_answerd"] = true;
      newObj["is_unanswerd"] = false;
    } else {
      newObj["is_answerd"] = false;
      newObj["is_unanswerd"] = true;
    }

    setSelectedQuestion(newObj);
    setQuestions((prev: any) => {
      let newArray = JSON.parse(JSON.stringify(prev));
      newArray[selectedIndex] = JSON.parse(JSON.stringify(newObj));
      return newArray;
    });
  };
  return (
    <>
      <Box className="h-auto pr-4">
        <Table sx={{ width: "100%" }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell
                className="bg-primary-light text-dark 2xl:text-base  text-[12px] lg:text-sm font-semibold py-1 md:py-2 lg:py-4 2xl:py-6 border-r border-x-white"
                width={"20%"}
              >
                Survey Employee
              </TableCell>
              <TableCell
                className="hidden md:table-cell bg-primary-light text-dark 2xl:text-base text-[12px] lg:text-sm font-semibold py-1 md:py-2 lg:py-4 2xl:py-6 border-r border-x-white"
                width={"15%"}
              >
                Rater Category
              </TableCell>
              <TableCell className="hidden md:table-cell bg-primary-light text-dark 2xl:text-base lg:text-sm text-[12px] font-semibold py-1 md:py-2 lg:py-4 2xl:py-6">
                Add comment
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {selectedQuestion.comments &&
              selectedQuestion.comments.map((item: any, index: number) => (
                <TableRow key={item.id}>
                  <TableCell
                    component="th"
                    scope="row"
                    className="md:border-r-[#E0E7ED] md:border-r xl:p-3 2xl:p-4"
                  >
                    <Box className="flex justify-between items-center">
                      <Box className="w-full">
                        <Typography className="block md:hidden lg:hidden text-[12px] lg:text-xs font-semibold 2xl:text-sm aller text-[#242424]">
                          {item.employee.name} |
                          <span className="text-[12px] lg:text-xs 2xl:text-sm aller text-[#828282] px-1">
                            {item.employee.email}
                          </span>
                        </Typography>
                        <Typography className="hidden md:block lg:block text-[12px] lg:text-xs font-semibold 2xl:text-sm aller text-[#242424]">
                          {item.employee.name}
                        </Typography>
                        <Typography className="hidden md:block lg:block text-[12px] lg:text-xs 2xl:text-sm aller text-[#828282]">
                          {item.employee.email}
                        </Typography>
                        <Typography className="block md:hidden lg:hidden text-[12px] lg:text-xs 2xl:text-sm aller text-[#828282]">
                          {item.survey_respondants &&
                            item.survey_respondants[0] &&
                            item.survey_respondants[0].rater?.name}
                          {item.survey_external_respondants &&
                            item.survey_external_respondants[0] &&
                            item.survey_external_respondants[0].rater?.name}
                        </Typography>

                        <MuiTextField
                          multiline
                          fullWidth
                          placeholder="Add Comment"
                          className={`
                 block md:hidden lg:hidden mt-4 `}
                          onChange={(e) => {
                            onChange("comments", e.target.value, index);
                          }}
                          value={
                            selectedQuestion.comments &&
                            selectedQuestion.comments[index].comments
                          }
                          sx={{
                            "& .MuiInputBase-root::after, .MuiInputBase-root::before":
                              {
                                display: "none",
                              },
                            "& .MuiInputBase-root": {
                              border: `0.5px  #828282`,
                              height: "auto",
                            },
                            "& .MuiInputBase-input.MuiInput-input": {
                              fontSize: {
                                xs: "12px !important",
                                lg: "14px !important",
                              },
                              lineHeight: "130%",
                            },
                          }}
                          InputProps={{
                            style: { fontSize: "12px" },
                          }}
                        />
                      </Box>
                      <Box className="hidden md:block">
                        {selectedQuestion.comments &&
                          selectedQuestion.comments[index].is_answerd && (
                            <Box className="lg:w-[30px] lg:h-[30px] w-[20px] h-[20px] flex justify-center items-center rounded-full bg-[#EEFBDB]">
                              <Checkmark
                                color="#18AB56"
                                className="lg:w-[20px] lg:h-[20px] md:w-[16px] md:h-[16px] w-[14px] h-[14px]"
                              />
                            </Box>
                          )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell className="hidden md:table-cell xl:text-xs 2xl:text-sm border-r-[#E0E7ED] border-r xl:p-3 2xl:p-4">
                    {item.survey_respondants &&
                      item.survey_respondants[0] &&
                      item.survey_respondants[0].rater?.name}
                    {item.survey_external_respondants &&
                      item.survey_external_respondants[0] &&
                      item.survey_external_respondants[0].rater?.name}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <MuiTextField
                      multiline
                      fullWidth
                      variant="standard"
                      placeholder="Add Comment"
                      className="px-2 lg:text-xs 2xl:text-sm"
                      onChange={(e) => {
                        onChange("comments", e.target.value, index);
                      }}
                      value={
                        selectedQuestion.comments &&
                        selectedQuestion.comments[index].comments
                      }
                      sx={{
                        "& .MuiInputBase-root::after, .MuiInputBase-root::before":
                          {
                            display: "none",
                          },
                        "& .MuiInputBase-input.MuiInput-input": {
                          fontSize: {
                            xs: "12px !important",
                            lg: "14px !important",
                          },
                          lineHeight: "130%",
                        },
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Box>
    </>
  );
};
