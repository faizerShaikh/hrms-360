import { BadRequestException } from "@nestjs/common";
import { responseTypes } from "../constants";

export const validateQuestion = (question: any): any => {
  let obj = {};
  if (!question["Question"]) {
    throw new BadRequestException("Please add name in all Questions");
  }
  obj["text"] = question["Question"];

  obj["regional_text"] = question["Regional Question"];

  if (!question["Type"] || !responseTypes[question["Type"]]) {
    throw new BadRequestException(
      "Please select correct type in all Questions"
    );
  }
  obj["response_type"] = responseTypes[question["Type"]];

  if (
    !question["Area of Assessment"] ||
    !question["Area of Assessment"].split(",").length
  ) {
    throw new BadRequestException(
      "Please add at least on Area of Assessment in all Questions"
    );
  }

  obj["areaAssessments"] = question["Area of Assessment"].split(",");

  let responses = [];
  let scores = [];
  if (question["Type"] === "Text") {
    responses.push({
      type: "text",
      label: "",
      score: null,
    });
  } else if (question["Type"] === "Yes/No") {
    responses.push({
      type: "yes_no",
      label: "Yes",
      score: 1,
      order: 0,
    });
    responses.push({
      type: "yes_no",
      label: "No",
      score: 0,
      order: 1,
    });
  } else {
    let includedResponses = [];

    let options = ["1", "2", "3", "4", "5"];

    for (const [index, score] of options.entries()) {
      if (includedResponses.includes(question[score])) {
        throw new BadRequestException("Response Label must be uniqe");
      }

      includedResponses.push(question[score]);
      if (question[score]) {
        if (question["Type"] === "Likert Scale") {
          scores.push(+score);
          responses.push({
            type: responseTypes[question["Type"]],
            score: +score,
            label: question[score],
            order: index,
          });
        } else {
          responses.push({
            type: responseTypes[question["Type"]],
            score: null,
            label: question[score],
            order: index,
          });
        }
      }
    }

    if (responses.length < 2) {
      throw new BadRequestException("Please add atleast two responses");
    }
    if (responses.length > 5) {
      throw new BadRequestException("Only five responses can be added");
    }
    if (question["Type"] === "Likert Scale") {
      obj["max_score"] = Math.max(...scores);
    }
  }

  obj["responses"] = responses;

  return obj;
};
