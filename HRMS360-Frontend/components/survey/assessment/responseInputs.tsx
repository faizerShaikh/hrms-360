import { Checkbox, Select } from "components/layout";
import {
  Box,
  Radio,
  TextField as MuiTextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  FormControlLabel,
  useMediaQuery,
  MenuItem,
} from "@mui/material";
import { ReactElement, useMemo } from "react";
import { SurveyInterface } from "interfaces/survey";
import { ResponseObjInterface } from "interfaces";
import { Checkmark } from "@carbon/icons-react";

const TextField = (props: any) => {
  return (
    <Box className="overflow-y-auto 2xl:h-[400px] 2xl:h-min-[400px] xl:h-[300px] xl:min-h-[300px] h-auto">
      <Table sx={{ width: "100%" }} className="my-5" aria-label="simple table">
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
            <TableCell className="hidden md:table-cell bg-primary-light text-dark 2xl:text-base xl:text-xs font-semibold xl:py-4 2xl:py-6">
              Add comment
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.item.surveys.map((item: SurveyInterface, index: number) => (
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
                        item.survey_respondants[0]?.rater?.name}
                      {item.survey_external_respondants &&
                        item.survey_external_respondants[0] &&
                        item.survey_external_respondants[0]?.rater?.name}
                    </Typography>

                    <MuiTextField
                      multiline
                      fullWidth
                      placeholder="Add Comment"
                      className={`
                      block md:hidden lg:hidden mt-4 `}
                      onChange={(e) => {
                        props.onChange("response_text", e.target.value, index);
                      }}
                      value={props.item.surveys[index].response_text}
                      sx={{
                        "& .MuiInputBase-root::after, .MuiInputBase-root::before":
                          {
                            display: "none",
                          },
                        "& .MuiInputBase-root": {
                          border: `0.5px  #828282`,
                          height: "auto",
                        },
                      }}
                      InputProps={{
                        style: { fontSize: "12px" },
                      }}
                    />
                  </Box>
                  <Box className="hidden md:block">
                    {props.item.surveys[index].is_answerd && (
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
                  item.survey_respondants[0]?.rater?.name}
                {item.survey_external_respondants &&
                  item.survey_external_respondants[0] &&
                  item.survey_external_respondants[0]?.rater?.name}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <MuiTextField
                  multiline
                  fullWidth
                  placeholder="Add Comment"
                  variant="standard"
                  className="px-2"
                  onChange={(e) => {
                    props.onChange("response_text", e.target.value, index);
                  }}
                  value={props.item.surveys[index].response_text}
                  sx={{
                    "& .MuiInputBase-root::after, .MuiInputBase-root::before": {
                      display: "none",
                    },
                  }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};
const SingleChoice = (props: any) => {
  const getOptions = (surveyIndex: number) => {
    let buttons: ReactElement[] = [];

    for (const [index, option] of props.options.entries()) {
      buttons.push(
        <TableCell
          align="center"
          className={`px-5 ${
            index + 1 === props.options.length
              ? ""
              : "border-r-[#E0E7ED] border-r  sm:p-2 2xl:p-4"
          }`}
          key={option.value}
        >
          <Radio
            onChange={(_, checked) => {
              props.onChange(
                "response_id",
                checked ? option.value : "",
                surveyIndex
              );
            }}
            checked={
              props.item.surveys[surveyIndex].response_id === option.value
            }
            sx={{
              bgcolor: "#ffffff",
              color: "#D4D4D4",
              padding: 0,
            }}
          />
        </TableCell>
      );
    }

    return buttons;
  };

  return (
    <Box className="overflow-y-auto 2xl:h-[450px] 2xl:h-min-[450px] sm:h-[280px] sm:min-h-[280px]">
      <Table sx={{ width: "100%" }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell
              className="bg-primary-light text-dark 2xl:text-base sm:text-xs font-semibold sm:py-4 2xl:py-6 border-r border-x-white"
              width={"20%"}
            >
              Survey Employee
            </TableCell>
            <TableCell
              className="bg-primary-light text-dark 2xl:text-base sm:text-xs font-semibold sm:py-4 2xl:py-6 border-r border-x-white"
              width={"15%"}
            >
              Relation
            </TableCell>
            {props.options.map((item: ResponseObjInterface, index: number) => (
              <TableCell
                key={item.value}
                className="bg-primary-light text-dark 2xl:text-base sm:text-xs font-semibold sm:py-4 2xl:py-6 border-r border-x-white"
                align="center"
              >
                {props.item.response_type === "yes_no" ? item.label : index + 1}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {props.item.surveys.map((item: SurveyInterface, index: number) => (
            <TableRow key={item.id}>
              <TableCell
                component="th"
                scope="row"
                className="border-r-[#E0E7ED] border-r sm:p-2 2xl:p-4"
              >
                <Box className="flex justify-between items-center">
                  <Box>
                    <Typography className="sm:text-xs 2xl:text-sm aller text-[#242424]">
                      {item.employee.name}
                    </Typography>
                    <Typography className="sm:text-xs 2xl:text-sm aller text-[#828282]">
                      {item.employee.email}
                    </Typography>
                  </Box>
                  {props.item.surveys[index].is_answerd && (
                    <Box className="w-[30px] h-[30px] flex justify-center items-center rounded-full bg-[#EEFBDB]">
                      <Checkmark color="#18AB56" size={"20"} />
                    </Box>
                  )}
                </Box>
              </TableCell>
              <TableCell className="sm:text-xs 2xl:text-sm border-r-[#E0E7ED] border-r sm:p-2 2xl:p-4">
                {item.survey_respondants &&
                  item.survey_respondants[0] &&
                  item.survey_respondants[0]?.rater &&
                  item.survey_respondants[0]?.rater?.name}
                {item.survey_external_respondants &&
                  item.survey_external_respondants[0] &&
                  item.survey_external_respondants[0].rater.name}
              </TableCell>
              {getOptions(index)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

const MultipleSelect = (props: any) => {
  const getOptions = (surveyIndex: number) => {
    let buttons: ReactElement[] = [];

    for (const [index, option] of props.options.entries()) {
      buttons.push(
        <TableCell
          align="center"
          className={`px-5 ${
            index + 1 === props.options.length
              ? ""
              : "border-r-[#E0E7ED] border-r sm:p-2 2xl:p-4"
          }`}
          key={option.value}
        >
          <Checkbox
            onChange={(_, checked) => {
              props.onChange(
                "response_ids",
                checked
                  ? [
                      ...props.item.surveys[surveyIndex].response_ids,
                      option.value,
                    ]
                  : props.item.surveys[surveyIndex].response_ids.filter(
                      (item: string) => item !== option.value
                    ),
                surveyIndex
              );
            }}
            checked={props.item.surveys[surveyIndex].response_ids.includes(
              option.value
            )}
            sx={{
              bgcolor: "#ffffff",
              color: "#D4D4D4",
              padding: 0,
            }}
          />
        </TableCell>
      );
    }

    return buttons;
  };

  return (
    <Box className="overflow-y-auto 2xl:h-[450px] 2xl:h-min-[450px] sm:h-[280px] sm:min-h-[280px]">
      <Table sx={{ width: "100%" }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell
              className="bg-primary-light text-dark 2xl:text-base sm:text-xs font-semibold sm:py-4 2xl:py-6 border-r border-x-white"
              width={"20%"}
            >
              Survey Employee
            </TableCell>
            <TableCell
              className="bg-primary-light text-dark 2xl:text-base sm:text-xs font-semibold sm:py-4 2xl:py-6 border-r border-x-white"
              width={"15%"}
            >
              Relation
            </TableCell>
            {props.options.map((item: ResponseObjInterface, index: number) => (
              <TableCell
                key={item.value}
                className="bg-primary-light text-dark 2xl:text-base sm:text-xs font-semibold sm:py-4 2xl:py-6 border-r border-x-white"
                align="center"
              >
                {index + 1}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {props.item.surveys.map((item: SurveyInterface, index: number) => (
            <TableRow key={item.id}>
              <TableCell
                component="th"
                scope="row"
                className="border-r-[#E0E7ED] border-r sm:p-2 2xl:p-4"
              >
                <Box className="flex justify-between items-center">
                  <Box>
                    <Typography className="sm:text-xs 2xl:text-sm aller text-[#242424]">
                      {item.employee.name}
                    </Typography>
                    <Typography className="sm:text-xs 2xl:text-sm aller text-[#828282]">
                      {item.employee.email}
                    </Typography>
                  </Box>
                  {props.item.surveys[index].is_answerd && (
                    <Box className="w-[30px] h-[30px] flex justify-center items-center rounded-full bg-[#EEFBDB]">
                      <Checkmark color="#18AB56" size={"20"} />
                    </Box>
                  )}
                </Box>
              </TableCell>
              <TableCell className="sm:text-xs 2xl:text-sm border-r-[#E0E7ED] border-r sm:p-2 2xl:p-4">
                {item.survey_respondants &&
                  item.survey_respondants[0] &&
                  item.survey_respondants[0]?.rater &&
                  item.survey_respondants[0]?.rater?.name}
                {item.survey_external_respondants &&
                  item.survey_external_respondants[0] &&
                  item.survey_external_respondants[0].rater.name}
              </TableCell>
              {getOptions(index)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

const LikertScale = (props: any) => {
  const isMobile = useMediaQuery("(max-width:640px)");

  const dontKnowOption = useMemo(() => {
    return props.options.find(
      (item: ResponseObjInterface) => item.label === "Don't Know (0)"
    );
  }, [props.options]);
  const getOptions = (surveyIndex: number) => {
    let buttons: ReactElement[] = [];

    if (!isMobile) {
      for (const [index, option] of props.options.entries()) {
        if (option.label !== "Don't Know (0)") {
          buttons.push(
            <TableCell
              align="center"
              className={`px-2 lg:py-3 lg:px-2  xl:py-5 xl:px-4  ${
                index === 1 ? "md:pl-5 lg:pl-5 xl:pl-7  " : "xl:px-4"
              } ${
                index + 1 === props?.options?.length &&
                "md:pr-5 lg:pr-5 xl:pr-7"
              }`}
              key={option.value}
            >
              <Radio
                onChange={(_, checked) => {
                  props.onChange(
                    "response_id",
                    checked ? option.value : "",
                    surveyIndex
                  );
                }}
                checked={
                  props.item.surveys[surveyIndex]["response_id"] ===
                  option.value
                }
                sx={{
                  bgcolor: "#ffffff",
                  color: "#D4D4D4",
                  padding: 0,
                }}
              />
              <Box className="xl:text-xs 2xl:text-sm">{option.score}</Box>
            </TableCell>
          );
        }
      }

      return buttons;
    } else {
      return (
        <TableCell
          align="center"
          className=" md:text-xs 2xl:text-sm  py-2 px-0 md:p-3 2xl:p-4"
        >
          <Select
            className="mx-0 pr-2"
            size="small"
            name="options"
            sx={{
              width: "48px",
              fontSize: "12px",
              "& .MuiList-root.MuiMenu-list": {
                fontSize: "12px",
              },
            }}
            onChange={(e) => {
              props.onChange("response_id", e.target.value, surveyIndex);
            }}
            value={props.item.surveys[surveyIndex]["response_id"]}
          >
            {props?.options?.map((item: any, index: number) => (
              <MenuItem
                value={item?.value}
                onClick={(e) => e.stopPropagation()}
                key={`${index}`}
                className="capitalize text-xs"
              >
                {item?.score}
              </MenuItem>
            ))}
          </Select>
        </TableCell>
      );
    }
  };

  return (
    <Box className="overflow-y-auto 2xl:h-[400px] 2xl:h-min-[400px] sm:h-[150px] sm:min-h-[150px]">
      <Table sx={{ width: "100%" }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell
              className="bg-primary-light text-dark 2xl:text-base lg:text-xs text-[12px] font-bold py-1 px-1 md:px-3 md:py-2 lg:py-4 lg:px-4 2xl:py-6 border-r border-x-white leading-snug"
              width={isMobile ? "15%" : "20%"}
            >
              Survey Employee
            </TableCell>
            <TableCell
              className="hidden lg:table-cell bg-primary-light text-dark 2xl:text-base lg:text-xs text-[12px] font-bold py-1 md:py-2  lg:py-4 2xl:py-6 border-r border-x-white leading-snug	"
              width={"8%"}
            >
              Relation
            </TableCell>
            <TableCell
              colSpan={isMobile ? undefined : 5}
              className="bg-primary-light text-dark 2xl:text-base lg:text-xs text-[12px] font-bold px-1 py-1 md:py-2 lg:py-4 2xl:py-6 border-r border-x-white leading-snug	"
              align="center"
              width={"20%"}
            >
              Ratings
            </TableCell>
            <TableCell
              className="hidden sm:table-cell bg-primary-light text-dark 2xl:text-base lg:text-xs text-[12px] font-bold  px-1 md:py-2 lg:py-4 2xl:py-6 border-r border-x-white leading-snug	"
              align="center"
              width={isMobile ? "5%" : "10%"}
            >
              Don’t Know
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.item.surveys.map((item: SurveyInterface, index: number) => (
            <TableRow key={item.id}>
              <TableCell
                component="th"
                scope="row"
                className="p-1  xl:py-3 xl:px-4 2xl:py-4 2xl:px-6"
              >
                <Box className="flex justify-between items-center">
                  <Box>
                    <Typography className="text-[12px] lg:text-xs font-semibold 2xl:text-sm aller text-[#242424]">
                      {item.employee.name}
                    </Typography>
                    <Typography className="text-[12px] lg:text-xs 2xl:text-sm aller text-[#828282]">
                      {item.employee.email}
                    </Typography>
                    <Typography className="block lg:hidden text-[12px] lg:text-xs 2xl:text-sm aller text-[#828282]">
                      {item.survey_respondants &&
                        item.survey_respondants[0] &&
                        item.survey_respondants[0]?.rater?.name}
                      {item.survey_external_respondants &&
                        item.survey_external_respondants[0] &&
                        item.survey_external_respondants[0]?.rater?.name}
                    </Typography>
                  </Box>
                  <Box className="hidden md:block">
                    {props.item.surveys[index].is_answerd && (
                      <Box className="lg:w-[30px] lg:h-[30px] w-[20px] h-[20px] flex justify-center items-center rounded-full bg-[#EEFBDB]">
                        <Checkmark
                          color="#18AB56" // size={"20"}
                          className="lg:w-[20px] lg:h-[20px] md:w-[16px] md:h-[16px] w-[14px] h-[14px]"
                        />
                      </Box>
                    )}
                  </Box>
                </Box>
                <Box className="block md:hidden">
                  {props.item.surveys[index].is_answerd && (
                    <Box className="lg:w-[25px] lg:h-[25px] w-[20px] h-[20px] flex justify-center items-center rounded-full bg-[#EEFBDB]">
                      <Checkmark
                        color="#18AB56" // size={"20"}
                        className="lg:w-[18px] lg:h-[18px] md:w-[16px] md:h-[16px] w-[14px] h-[14px]"
                      />
                    </Box>
                  )}
                </Box>
              </TableCell>
              <TableCell className="hidden lg:table-cell text-[12px] lg:text-xs 2xl:text-sm   p-1 lg:p-3 2xl:p-4">
                {item.survey_respondants &&
                  item.survey_respondants[0] &&
                  item.survey_respondants[0]?.rater?.name}
                {item.survey_external_respondants &&
                  item.survey_external_respondants[0] &&
                  item.survey_external_respondants[0]?.rater?.name}
              </TableCell>

              {getOptions(index)}

              <TableCell
                align="center"
                className="hidden sm:table-cell p-1 md:p-auto"
              >
                {dontKnowOption && (
                  <Box className="w-[20px] mx-auto md:w-auto">
                    <FormControlLabel
                      className="m-0"
                      label={""}
                      sx={{
                        "& .MuiTypography-root": {
                          fontSize: "12px",
                        },
                      }}
                      labelPlacement="bottom"
                      value={dontKnowOption.value}
                      id={Math.random() < 0.5 ? "select" : undefined}
                      onChange={(_, checked) => {
                        props.onChange(
                          "response_id",
                          checked ? dontKnowOption.value : "",
                          index
                        );
                      }}
                      checked={
                        props.item.surveys[index]["response_id"] ===
                        dontKnowOption.value
                      }
                      control={
                        <Radio
                          sx={{
                            bgcolor: "#ffffff",
                            color: "#D4D4D4",
                            padding: 0,
                          }}
                          size={"small"}
                        />
                      }
                    />
                  </Box>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

export const responses: any = {
  text: (props: any) => <TextField {...props} />,
  yes_no: (props: any) => <SingleChoice {...props} />,
  single_choice: (props: any) => <SingleChoice {...props} />,
  multiple_choice: (props: any) => <MultipleSelect {...props} />,
  likert_scale: (props: any) => <LikertScale {...props} />,
};
