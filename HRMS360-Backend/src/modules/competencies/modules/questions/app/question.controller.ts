import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import {
  MulterIntercepter,
  TransactionInterceptor,
} from "src/common/interceptors";
import { MulterEnum } from "src/common/interfaces/multer.interfaces";
import { CreateQuestionDTO, UpdateQuestionDTO } from "../dtos";
import { QuestionService } from "./question.service";

@UseInterceptors(TransactionInterceptor)
@Controller("competency/question")
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Post()
  createQuestion(@Body() body: CreateQuestionDTO) {
    return this.questionService.createQuestion(body);
  }

  @Get("get-excel")
  getSampleQuestionFile() {
    return this.questionService.getSampleQuestionFile();
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
    return this.questionService.importQuestions(file, id);
  }

  @Put(":id")
  updateQuestion(@Body() body: UpdateQuestionDTO, @Param("id") id: string) {
    return this.questionService.updateQuestion(body, id);
  }

  @Delete(":id")
  deleteQuestion(@Param("id") id: string) {
    return this.questionService.deleteQuestion(id);
  }
}
