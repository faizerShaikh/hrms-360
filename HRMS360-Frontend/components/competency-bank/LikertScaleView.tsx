import { Box, Grid } from "@mui/material";
import { colors } from "constants/theme";
import { ResponseObjInterface } from "interfaces/competency-bank";
import { nanoid } from "nanoid";
import React from "react";
import { Label } from "..";

export interface LikertScaleProps {
  responses: ResponseObjInterface[];
}
export const LikertScaleView = ({ responses }: LikertScaleProps) => {
  return (
    <Grid container>
      {new Array(Math.ceil(responses.length / 5))
        .fill(nanoid())
        .map((row, i: number) => (
          <>
            <Grid container item key={row} className="mb-2">
              <Grid
                item
                xs={2}
                color={colors.text.dark}
                className="border-slate-200 border flex justify-between flex-col items-center h-36 border-r-0"
              >
                <Box className="flex justify-start items-center border-slate-200 border-b w-full h-full pl-5">
                  <Label
                    text="Responses :"
                    className="xl:text-sm 2xl:text-base"
                  />
                </Box>
                <Box className="flex justify-start items-center w-full h-full pl-5">
                  <Label text="Score :" className="xl:text-sm 2xl:text-base" />
                </Box>
              </Grid>
              {responses
                .slice(5 * i, 5 * i + 5)
                .map((item: ResponseObjInterface, index: number, thisArr) => (
                  <Grid
                    key={item.id}
                    item
                    xs={2}
                    color={colors.text.dark}
                    className={`border-slate-200 border flex justify-between flex-col items-center h-36 ${
                      index + 1 === thisArr.length ? "border-r-1" : "border-r-0"
                    }`}
                  >
                    <Box
                      className={`h-1/2 flex justify-center items-center border-slate-200 border-b w-full p-2 xl:text-sm 2xl:text-base text-light`}
                    >
                      {item.label}
                    </Box>
                    <Box className="h-1/2 flex justify-center items-center w-full xl:text-sm 2xl:text-base text-light">
                      {item.score}
                    </Box>
                  </Grid>
                ))}
            </Grid>
          </>
        ))}
    </Grid>
  );
};
