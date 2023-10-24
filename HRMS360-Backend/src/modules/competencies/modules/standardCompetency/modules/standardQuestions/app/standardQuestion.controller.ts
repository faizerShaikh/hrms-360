import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { MulterIntercepter } from "src/common/interceptors";
import { MulterEnum } from "src/common/interfaces/multer.interfaces";
import {
  CreateQuestionDTO,
  UpdateQuestionDTO,
} from "src/modules/competencies/modules/questions/dtos";
import { StandardQuestionService } from "./standardQuestion.service";

@Controller("standard-competency/question")
export class StandardQuestionController {
  constructor(
    private readonly standardQuestionService: StandardQuestionService
  ) {}

  @Post()
  createQuestion(@Body() body: CreateQuestionDTO) {
    return this.standardQuestionService.createQuestion(body);
  }

  @Post("import/:id")
  @UseInterceptors(
    MulterIntercepter({
      type: MulterEnum.single,
      fieldName: "file",
      path: "/media/excels",
    })
  )
  importQuestions(
    @UploadedFile() file: Express.Multer.File,
    @Param("id") id: string
  ) {
    return this.standardQuestionService.importQuestionsNew(file, id);
  }

  // @Put("manage-order")
  // manageOrder(@Body() body: any) {
  //   return this.standardQuestionService.manageOrder(body);
  // }

  @Put(":id")
  updateQuestion(@Body() body: UpdateQuestionDTO, @Param("id") id: string) {
    return this.standardQuestionService.updateQuestion(body, id);
  }

  @Delete(":id")
  deleteQuestion(@Param("id") id: string) {
    return this.standardQuestionService.deleteQuestion(id);
  }
}
